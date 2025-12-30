/**
 * Test Case Parser - Parse test cases from JSON or text files
 * Supports C-style escape sequences for proper string handling
 */

import type { TestCase } from '@/types';

interface ParsedTestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

/**
 * Parse C-style escape sequences in a string
 * Converts \" to ", \\ to \, \n to newline, etc.
 */
export function parseCEscapes(str: string): string {
  let result = '';
  let i = 0;
  
  while (i < str.length) {
    if (str[i] === '\\' && i + 1 < str.length) {
      const next = str[i + 1];
      switch (next) {
        case '"':
          result += '"';
          i += 2;
          break;
        case '\\':
          result += '\\';
          i += 2;
          break;
        case 'n':
          result += '\n';
          i += 2;
          break;
        case 't':
          result += '\t';
          i += 2;
          break;
        case 'r':
          result += '\r';
          i += 2;
          break;
        case '*':
          result += '*';
          i += 2;
          break;
        default:
          result += str[i];
          i++;
      }
    } else {
      result += str[i];
      i++;
    }
  }
  
  return result;
}

/**
 * Parse JSON test cases with C-style escape support
 */
export function parseJsonTestCases(jsonContent: string): { testCases: TestCase[]; error?: string } {
  try {
    // Pre-process the JSON to handle C-style strings within JSON strings
    const parsed = JSON.parse(jsonContent);
    
    if (!Array.isArray(parsed)) {
      // Handle object format with testCases property
      if (parsed.testCases && Array.isArray(parsed.testCases)) {
        return parseTestCaseArray(parsed.testCases);
      }
      return { testCases: [], error: 'JSON must be an array or contain a testCases array' };
    }
    
    return parseTestCaseArray(parsed);
  } catch (e) {
    return { testCases: [], error: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}` };
  }
}

function parseTestCaseArray(arr: unknown[]): { testCases: TestCase[]; error?: string } {
  const testCases: TestCase[] = [];
  
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (typeof item !== 'object' || item === null) {
      return { testCases: [], error: `Test case ${i + 1} is not an object` };
    }
    
    const tc = item as Record<string, unknown>;
    
    // Handle different input formats
    let input: string;
    let expectedOutput: string;
    
    // Input can be a string or array of strings (for multi-line)
    if (typeof tc.input === 'string') {
      input = parseCEscapes(tc.input);
    } else if (Array.isArray(tc.input)) {
      input = tc.input.map(line => 
        typeof line === 'string' ? parseCEscapes(line) : String(line)
      ).join('\n');
    } else {
      input = String(tc.input ?? '');
    }
    
    // Expected output can be a string or array
    if (typeof tc.expectedOutput === 'string') {
      expectedOutput = parseCEscapes(tc.expectedOutput);
    } else if (typeof tc.output === 'string') {
      expectedOutput = parseCEscapes(tc.output);
    } else if (Array.isArray(tc.expectedOutput)) {
      expectedOutput = tc.expectedOutput.map(line =>
        typeof line === 'string' ? parseCEscapes(line) : String(line)
      ).join('\n');
    } else if (Array.isArray(tc.output)) {
      expectedOutput = tc.output.map(line =>
        typeof line === 'string' ? parseCEscapes(line) : String(line)
      ).join('\n');
    } else {
      expectedOutput = String(tc.expectedOutput ?? tc.output ?? '');
    }
    
    testCases.push({
      id: tc.id?.toString() || (i + 1).toString(),
      input,
      expectedOutput,
      isHidden: Boolean(tc.isHidden ?? tc.hidden ?? false),
    });
  }
  
  return { testCases };
}

/**
 * Parse text file test cases
 * Format: 
 * ---INPUT---
 * input content
 * ---OUTPUT---
 * output content
 * ---END---
 * 
 * Or simple format:
 * input line 1
 * ---
 * output line 1
 * ===
 */
export function parseTextTestCases(textContent: string): { testCases: TestCase[]; error?: string } {
  const testCases: TestCase[] = [];
  const lines = textContent.split('\n');
  
  // Try structured format first
  if (textContent.includes('---INPUT---')) {
    return parseStructuredText(textContent);
  }
  
  // Try simple delimiter format
  if (textContent.includes('===')) {
    return parseSimpleDelimiterFormat(textContent);
  }
  
  // Fallback: treat as single test case with input/output separated by empty line
  const sections = textContent.split(/\n\s*\n/);
  if (sections.length >= 2) {
    testCases.push({
      id: '1',
      input: parseCEscapes(sections[0].trim()),
      expectedOutput: parseCEscapes(sections[1].trim()),
      isHidden: false,
    });
    return { testCases };
  }
  
  return { testCases: [], error: 'Could not parse text format. Use structured format with ---INPUT--- and ---OUTPUT--- markers.' };
}

function parseStructuredText(content: string): { testCases: TestCase[]; error?: string } {
  const testCases: TestCase[] = [];
  const parts = content.split('---INPUT---').filter(p => p.trim());
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const outputSplit = part.split('---OUTPUT---');
    
    if (outputSplit.length < 2) {
      continue;
    }
    
    let input = outputSplit[0].trim();
    let outputPart = outputSplit[1];
    
    // Handle ---END--- or ---HIDDEN--- markers
    const endMatch = outputPart.match(/---END---|---HIDDEN---/);
    let isHidden = false;
    
    if (endMatch) {
      isHidden = outputPart.includes('---HIDDEN---');
      outputPart = outputPart.split(/---END---|---HIDDEN---/)[0];
    }
    
    const expectedOutput = outputPart.trim();
    
    testCases.push({
      id: (i + 1).toString(),
      input: parseCEscapes(input),
      expectedOutput: parseCEscapes(expectedOutput),
      isHidden,
    });
  }
  
  return { testCases };
}

function parseSimpleDelimiterFormat(content: string): { testCases: TestCase[]; error?: string } {
  const testCases: TestCase[] = [];
  const cases = content.split('===').filter(c => c.trim());
  
  for (let i = 0; i < cases.length; i++) {
    const caseContent = cases[i].trim();
    const parts = caseContent.split('---');
    
    if (parts.length >= 2) {
      testCases.push({
        id: (i + 1).toString(),
        input: parseCEscapes(parts[0].trim()),
        expectedOutput: parseCEscapes(parts[1].trim()),
        isHidden: parts.length > 2 && parts[2].toLowerCase().includes('hidden'),
      });
    }
  }
  
  return { testCases };
}

/**
 * Auto-detect format and parse
 */
export function parseTestCases(content: string, filename?: string): { testCases: TestCase[]; error?: string } {
  const trimmed = content.trim();
  
  // Check file extension if provided
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'json') {
      return parseJsonTestCases(trimmed);
    }
    if (ext === 'txt' || ext === 'text') {
      return parseTextTestCases(trimmed);
    }
  }
  
  // Auto-detect by content
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return parseJsonTestCases(trimmed);
  }
  
  return parseTextTestCases(trimmed);
}

/**
 * Generate sample JSON format for documentation
 */
export const SAMPLE_JSON_FORMAT = `[
  {
    "input": "5\\n1 2 3 4 5",
    "expectedOutput": "15",
    "isHidden": false
  },
  {
    "input": ["3", "10 20 30"],
    "output": "60",
    "hidden": true
  }
]

// Alternative format with C-style escapes:
[
  {
    "input": "Hello \\"World\\"",
    "expectedOutput": "HELLO \\"WORLD\\""
  },
  {
    "input": "Line1\\nLine2\\nLine3",
    "expectedOutput": "3 lines"
  }
]`;

export const SAMPLE_TEXT_FORMAT = `---INPUT---
5
1 2 3 4 5
---OUTPUT---
15
---END---

---INPUT---
3
10 20 30
---OUTPUT---
60
---HIDDEN---

// Or simple format:
input line 1
---
output line 1
===
input line 2
---
output line 2
===`;
