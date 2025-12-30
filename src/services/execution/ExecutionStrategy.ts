/**
 * Code Execution Strategy Pattern
 * Supports multiple execution backends (Piston, Judge0)
 */

import type { ExecutionResult, LanguageConfig } from '@/types';

export interface ExecutionRequest {
  code: string;
  language: LanguageConfig;
  input: string;
  timeLimit?: number; // ms
  memoryLimit?: number; // MB
}

export interface IExecutionStrategy {
  name: string;
  isAvailable(): Promise<boolean>;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}

/**
 * Piston API Strategy - Free, no API key required
 * https://github.com/engineer-man/piston
 */
export class PistonStrategy implements IExecutionStrategy {
  name = 'Piston';
  private baseUrl = 'https://emkc.org/api/v2/piston';

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/runtimes`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: request.language.pistonId,
          version: '*',
          files: [
            {
              name: `main.${request.language.extension}`,
              content: request.code,
            },
          ],
          stdin: request.input,
          args: [],
          compile_timeout: 10000,
          run_timeout: request.timeLimit || 5000,
          compile_memory_limit: -1,
          run_memory_limit: (request.memoryLimit || 256) * 1024 * 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`Piston API error: ${response.statusText}`);
      }

      const result = await response.json();

      // Check for compilation errors
      if (result.compile && result.compile.code !== 0) {
        return {
          success: false,
          error: result.compile.stderr || result.compile.output,
          status: 'compile_error',
        };
      }

      // Check for runtime errors
      if (result.run.code !== 0 && result.run.signal) {
        if (result.run.signal === 'SIGKILL') {
          return {
            success: false,
            error: 'Time or memory limit exceeded',
            status: 'time_limit',
          };
        }
        return {
          success: false,
          error: result.run.stderr || 'Runtime error',
          status: 'runtime_error',
        };
      }

      // Check stderr for runtime errors
      if (result.run.stderr && result.run.stderr.trim()) {
        return {
          success: false,
          output: result.run.stdout,
          error: result.run.stderr,
          status: 'runtime_error',
        };
      }

      return {
        success: true,
        output: result.run.stdout,
        status: 'accepted',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        status: 'runtime_error',
      };
    }
  }
}

/**
 * Judge0 API Strategy - Requires API key
 * https://judge0.com/
 */
export class Judge0Strategy implements IExecutionStrategy {
  name = 'Judge0';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://judge0-ce.p.rapidapi.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}/languages`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (!request.language.judge0Id) {
      return {
        success: false,
        error: `Language ${request.language.name} not supported by Judge0`,
        status: 'compile_error',
      };
    }

    try {
      // Submit code
      const submitResponse = await fetch(`${this.baseUrl}/submissions?base64_encoded=true&wait=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        body: JSON.stringify({
          language_id: request.language.judge0Id,
          source_code: btoa(request.code),
          stdin: btoa(request.input),
          cpu_time_limit: (request.timeLimit || 5000) / 1000,
          memory_limit: (request.memoryLimit || 256) * 1024,
        }),
      });

      if (!submitResponse.ok) {
        throw new Error(`Judge0 API error: ${submitResponse.statusText}`);
      }

      const result = await submitResponse.json();

      // Parse result based on status
      const statusId = result.status?.id;
      
      // Status IDs: 1-2 = In Queue/Processing, 3 = Accepted, 4 = Wrong Answer,
      // 5 = Time Limit, 6 = Compilation Error, etc.
      if (statusId === 6) {
        return {
          success: false,
          error: result.compile_output ? atob(result.compile_output) : 'Compilation error',
          status: 'compile_error',
        };
      }

      if (statusId === 5) {
        return {
          success: false,
          error: 'Time limit exceeded',
          status: 'time_limit',
          runtime: result.time ? parseFloat(result.time) * 1000 : undefined,
        };
      }

      if (statusId > 6) {
        return {
          success: false,
          error: result.stderr ? atob(result.stderr) : 'Runtime error',
          status: 'runtime_error',
        };
      }

      return {
        success: true,
        output: result.stdout ? atob(result.stdout) : '',
        runtime: result.time ? parseFloat(result.time) * 1000 : undefined,
        memory: result.memory ? result.memory / 1024 : undefined,
        status: 'accepted',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        status: 'runtime_error',
      };
    }
  }
}

/**
 * Execution Service - Manages execution strategies
 */
class ExecutionService {
  private strategies: IExecutionStrategy[] = [];
  private currentStrategy: IExecutionStrategy | null = null;

  constructor() {
    // Add Piston as default
    this.strategies.push(new PistonStrategy());
  }

  addStrategy(strategy: IExecutionStrategy): void {
    this.strategies.push(strategy);
  }

  async selectBestStrategy(): Promise<IExecutionStrategy | null> {
    for (const strategy of this.strategies) {
      if (await strategy.isAvailable()) {
        this.currentStrategy = strategy;
        return strategy;
      }
    }
    return null;
  }

  getCurrentStrategy(): IExecutionStrategy | null {
    return this.currentStrategy;
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (!this.currentStrategy) {
      await this.selectBestStrategy();
    }

    if (!this.currentStrategy) {
      return {
        success: false,
        error: 'No execution backend available',
        status: 'runtime_error',
      };
    }

    return this.currentStrategy.execute(request);
  }
}

export const executionService = new ExecutionService();
