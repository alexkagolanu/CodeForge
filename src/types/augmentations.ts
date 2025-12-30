// Interface augmentations for advanced problem metadata and testcases
// These merge with the original interfaces in index.ts

export interface Problem {
  // New optional metadata fields
  sourcePlatform?: 'codeforces' | 'codechef' | 'leetcode' | 'aoc' | 'custom';
  externalUrl?: string;
  sourceId?: string; // e.g., CF contest+index or LeetCode slug
  rating?: number; // e.g., CF rating
  editorialUrl?: string;

  // Optional checker configuration
  checker_kind?: 'exact' | 'trim' | 'token' | 'float_tolerance' | 'custom';
  checker_script?: string; // JS code when checker_kind = 'custom'
  checker_float_tolerance?: number;
  checker_case_insensitive?: boolean;

  // I/O mode
  io_mode?: 'stdin_stdout' | 'file_io';
  file_input_name?: string;
  file_output_name?: string;

  // Problem classification
  problemType?: 'algorithm' | 'sql';
  // SQL-specific global setup executed before each test (DDL/DML)
  sqlGlobalSetup?: string;
}

export interface TestCase {
  weight?: number;
  sampleIndex?: number | null;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  // SQL specific
  sqlSetup?: string | null;
  sqlQuery?: string | null;
  // If true, expectedOutput will be computed at runtime by executing sqlQuery
  sqlExpectedFromAuthor?: boolean;
}
