// Core domain types for the coding platform
import './augmentations';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Visibility = 'public' | 'private';
export type SubmissionStatus = 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit' | 'memory_limit' | 'runtime_error' | 'compile_error';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
  stats: UserStats;
}

export interface UserStats {
  problemsSolved: number;
  problemsAttempted: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
  streak: number;
  rank?: number;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string; // Markdown with LaTeX support
  difficulty: Difficulty;
  tags: string[];
  examples: ProblemExample[];
  constraints: ProblemConstraints;
  inputFormat: string;
  outputFormat: string;
  testCases: TestCase[];
  starterCode: Record<string, string>;
  visibility: Visibility;
  creatorId: string;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  submissions: number;
  acceptanceRate: number;
  timeLimit?: number; // in minutes for the whole problem
  shareCode: string;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemConstraints {
  timeLimit: number; // in ms per test case
  memoryLimit: number; // in MB
  customConstraints?: string[];
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Submission {
  id: string;
  problemId: string;
  userId: string;
  code: string;
  language: string;
  status: SubmissionStatus;
  runtime?: number;
  memory?: number;
  testCasesPassed: number;
  totalTestCases: number;
  errorMessage?: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  problemId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  createdAt: Date;
  replies?: Comment[];
}

export interface Note {
  id: string;
  problemId: string;
  userId: string;
  content: string; // Markdown
  updatedAt: Date;
}

export interface ProblemList {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  visibility: Visibility;
  isSequential: boolean;
  sections: ListSection[];
  shareCode: string;
  createdAt: Date;
  updatedAt: Date;
  followers: number;
}

export interface ListSection {
  id: string;
  title: string;
  description?: string;
  problems: ListProblem[];
  order: number;
}

export interface ListProblem {
  problemId: string;
  order: number;
  isCompleted?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  runtime: number;
  memory: number;
  language: string;
  submittedAt: Date;
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  runtime?: number;
  memory?: number;
  status: SubmissionStatus;
}

// Language support configuration
export interface LanguageConfig {
  id: string;
  name: string;
  monacoId: string;
  pistonId: string;
  judge0Id?: number;
  extension: string;
  defaultCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    monacoId: 'javascript',
    pistonId: 'javascript',
    judge0Id: 63,
    extension: 'js',
    defaultCode: '// Your JavaScript solution here\n\nfunction solution(input) {\n  // Write your code here\n  return input;\n}\n\n// Read input and call solution\nconst input = require("fs").readFileSync(0, "utf-8").trim();\nconsole.log(solution(input));',
  },
  {
    id: 'python',
    name: 'Python',
    monacoId: 'python',
    pistonId: 'python',
    judge0Id: 71,
    extension: 'py',
    defaultCode: '# Your Python solution here\n\ndef solution(input_data):\n    # Write your code here\n    return input_data\n\nif __name__ == "__main__":\n    import sys\n    input_data = sys.stdin.read().strip()\n    print(solution(input_data))',
  },
  {
    id: 'cpp',
    name: 'C++',
    monacoId: 'cpp',
    pistonId: 'c++',
    judge0Id: 54,
    extension: 'cpp',
    defaultCode: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    // Your C++ solution here\n    string input;\n    getline(cin, input);\n    \n    // Write your code here\n    \n    cout << input << endl;\n    return 0;\n}',
  },
  {
    id: 'java',
    name: 'Java',
    monacoId: 'java',
    pistonId: 'java',
    judge0Id: 62,
    extension: 'java',
    defaultCode: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Your Java solution here\n        String input = scanner.nextLine();\n        \n        // Write your code here\n        \n        System.out.println(input);\n    }\n}',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    monacoId: 'typescript',
    pistonId: 'typescript',
    judge0Id: 74,
    extension: 'ts',
    defaultCode: '// Your TypeScript solution here\n\nfunction solution(input: string): string {\n  // Write your code here\n  return input;\n}\n\n// Note: TypeScript runs with ts-node\nconst input = require("fs").readFileSync(0, "utf-8").trim();\nconsole.log(solution(input));',
  },
  {
    id: 'rust',
    name: 'Rust',
    monacoId: 'rust',
    pistonId: 'rust',
    judge0Id: 73,
    extension: 'rs',
    defaultCode: 'use std::io::{self, BufRead};\n\nfn main() {\n    let stdin = io::stdin();\n    let input = stdin.lock().lines().next().unwrap().unwrap();\n    \n    // Your Rust solution here\n    \n    println!("{}", input);\n}',
  },
  {
    id: 'go',
    name: 'Go',
    monacoId: 'go',
    pistonId: 'go',
    judge0Id: 60,
    extension: 'go',
    defaultCode: 'package main\n\nimport (\n    "bufio"\n    "fmt"\n    "os"\n)\n\nfunc main() {\n    scanner := bufio.NewScanner(os.Stdin)\n    scanner.Scan()\n    input := scanner.Text()\n    \n    // Your Go solution here\n    \n    fmt.Println(input)\n}',
  },
  {
    id: 'sql',
    name: 'SQL',
    monacoId: 'sql',
    pistonId: 'sql',
    extension: 'sql',
    defaultCode: '-- Write your SQL query here\nSELECT 1 as col;'
  },
];

// Theme configuration
export interface ThemeConfig {
  id: string;
  name: string;
  isDark: boolean;
  colors: Record<string, string>;
}
