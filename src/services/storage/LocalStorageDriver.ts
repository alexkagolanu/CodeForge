/**
 * LocalStorage Driver - For offline storage and caching
 */

import type { Problem, ProblemList, User, Submission, Comment, Note } from '@/types';
import type { IStorageDriver, StorageQuery, StorageResult, StorageListResult } from './StorageInterface';

const STORAGE_KEYS = {
  PROBLEMS: 'codeforge_problems',
  LISTS: 'codeforge_lists',
  USERS: 'codeforge_users',
  SUBMISSIONS: 'codeforge_submissions',
  COMMENTS: 'codeforge_comments',
  NOTES: 'codeforge_notes',
  CACHE_TIMESTAMP: 'codeforge_cache_ts',
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateShareCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

function applyQuery<T extends Record<string, any>>(
  items: T[],
  query?: StorageQuery<T>
): { data: T[]; total: number } {
  if (!query) return { data: items, total: items.length };

  let filtered = [...items];

  // Apply where filters
  if (query.where) {
    filtered = filtered.filter(item => {
      return Object.entries(query.where!).every(([key, value]) => {
        if (value === undefined) return true;
        return item[key] === value;
      });
    });
  }

  // Apply search
  if (query.search && query.searchFields) {
    const searchLower = query.search.toLowerCase();
    filtered = filtered.filter(item => {
      return query.searchFields!.some(field => {
        const value = item[field as string];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        if (Array.isArray(value)) {
          return value.some(v => 
            typeof v === 'string' && v.toLowerCase().includes(searchLower)
          );
        }
        return false;
      });
    });
  }

  const total = filtered.length;

  // Apply sorting
  if (query.orderBy) {
    filtered.sort((a, b) => {
      const aVal = a[query.orderBy as string];
      const bVal = b[query.orderBy as string];
      const direction = query.orderDirection === 'desc' ? -1 : 1;
      
      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
      return 0;
    });
  }

  // Apply pagination
  if (query.offset !== undefined) {
    filtered = filtered.slice(query.offset);
  }
  if (query.limit !== undefined) {
    filtered = filtered.slice(0, query.limit);
  }

  return { data: filtered, total };
}

export class LocalStorageDriver implements IStorageDriver {
  private initialized = false;

  async initialize(): Promise<void> {
    // Seed with sample data if empty
    const problems = getFromStorage<Problem>(STORAGE_KEYS.PROBLEMS);
    if (problems.length === 0) {
      await this.seedSampleData();
    }
    this.initialized = true;
  }

  isAvailable(): boolean {
    try {
      localStorage.setItem('__test__', 'test');
      localStorage.removeItem('__test__');
      return true;
    } catch {
      return false;
    }
  }

  private async seedSampleData(): Promise<void> {
    const sampleProblems: Problem[] = [
      {
        id: generateId(),
        title: 'Two Sum',
        slug: 'two-sum',
        description: 'Find two numbers that add up to a target',
        sourcePlatform: 'leetcode',
        externalUrl: 'https://leetcode.com/problems/two-sum/',
        content: `# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

## Mathematical Background

The problem can be expressed mathematically as finding indices $i$ and $j$ where:

$$nums[i] + nums[j] = target$$

where $i \\neq j$`,
        difficulty: 'easy',
        tags: ['Array', 'Hash Table'],
        examples: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
          },
        ],
        constraints: {
          timeLimit: 1000,
          memoryLimit: 256,
          customConstraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
        },
        inputFormat: 'First line: array of integers. Second line: target integer.',
        outputFormat: 'Array of two indices.',
        testCases: [
          { id: '1', input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
          { id: '2', input: '3 2 4\n6', expectedOutput: '1 2', isHidden: false },
          { id: '3', input: '3 3\n6', expectedOutput: '0 1', isHidden: true },
        ],
        starterCode: {
          javascript: 'function twoSum(nums, target) {\n  // Your code here\n}',
          python: 'def two_sum(nums, target):\n    # Your code here\n    pass',
        },
        visibility: 'public',
        creatorId: 'system',
        creatorName: 'CodeForge',
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 1234,
        submissions: 50000,
        acceptanceRate: 48.5,
        shareCode: generateShareCode(),
      },
      {
        id: generateId(),
        title: 'Reverse Linked List',
        slug: 'reverse-linked-list',
        description: 'Reverse a singly linked list',
        content: `# Reverse Linked List

Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.

## Approach

The reversal can be done iteratively or recursively. The time complexity is $O(n)$ where $n$ is the number of nodes.`,
        difficulty: 'easy',
        tags: ['Linked List', 'Recursion'],
        examples: [
          {
            input: 'head = [1,2,3,4,5]',
            output: '[5,4,3,2,1]',
          },
        ],
        constraints: {
          timeLimit: 1000,
          memoryLimit: 256,
          customConstraints: ['0 <= Number of nodes <= 5000', '-5000 <= Node.val <= 5000'],
        },
        inputFormat: 'Linked list represented as array',
        outputFormat: 'Reversed linked list as array',
        testCases: [
          { id: '1', input: '1 2 3 4 5', expectedOutput: '5 4 3 2 1', isHidden: false },
        ],
        starterCode: {},
        visibility: 'public',
        creatorId: 'system',
        creatorName: 'CodeForge',
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 890,
        submissions: 35000,
        acceptanceRate: 72.3,
        shareCode: generateShareCode(),
      },
      {
        id: generateId(),
        title: 'Longest Substring Without Repeating Characters',
        slug: 'longest-substring-without-repeating',
        description: 'Find the longest substring without repeating characters',
        content: `# Longest Substring Without Repeating Characters

Given a string \`s\`, find the length of the **longest substring** without repeating characters.

## Sliding Window Technique

This problem is a classic application of the sliding window technique with time complexity $O(n)$.`,
        difficulty: 'medium',
        tags: ['String', 'Sliding Window', 'Hash Table'],
        examples: [
          {
            input: 's = "abcabcbb"',
            output: '3',
            explanation: 'The answer is "abc", with the length of 3.',
          },
        ],
        constraints: {
          timeLimit: 1000,
          memoryLimit: 256,
          customConstraints: ['0 <= s.length <= 5 * 10^4'],
        },
        inputFormat: 'A single string',
        outputFormat: 'An integer representing the length',
        testCases: [
          { id: '1', input: 'abcabcbb', expectedOutput: '3', isHidden: false },
          { id: '2', input: 'bbbbb', expectedOutput: '1', isHidden: false },
          { id: '3', input: 'pwwkew', expectedOutput: '3', isHidden: true },
        ],
        starterCode: {},
        visibility: 'public',
        creatorId: 'system',
        creatorName: 'CodeForge',
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 2341,
        submissions: 85000,
        acceptanceRate: 33.8,
        shareCode: generateShareCode(),
      },
    ];

    saveToStorage(STORAGE_KEYS.PROBLEMS, sampleProblems);
  }

  // Problems
  async getProblems(query?: StorageQuery<Problem>): Promise<StorageListResult<Problem>> {
    const problems = getFromStorage<Problem>(STORAGE_KEYS.PROBLEMS);
    const { data, total } = applyQuery(problems, query);
    return { data, total, error: null };
  }

  async getProblem(id: string): Promise<StorageResult<Problem>> {
    const problems = getFromStorage<Problem>(STORAGE_KEYS.PROBLEMS);
    const problem = problems.find(p => p.id === id) || null;
    return { data: problem, error: problem ? null : 'Problem not found' };
  }

  async getProblemBySlug(slug: string): Promise<StorageResult<Problem>> {
    const problems = getFromStorage<Problem>(STORAGE_KEYS.PROBLEMS);
    const problem = problems.find(p => p.slug === slug) || null;
    return { data: problem, error: problem ? null : 'Problem not found' };
  }

  async getProblemByShareCode(code: string): Promise<StorageResult<Problem>> {
    const problems = getFromStorage<Problem>(STORAGE_KEYS.PROBLEMS);
    const problem = problems.find(p => p.shareCode === code) || null;
    return { data: problem, error: problem ? null : 'Problem not found' };
  }

  async createProblem(
    problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt' | 'shareCode'>
  ): Promise<StorageResult<Problem>> {
    const problems = getFromStorage<Problem>(STORAGE_KEYS.PROBLEMS);
    const newProblem: Problem = {
      ...problem,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      shareCode: generateShareCode(),
    };
    problems.push(newProblem);
    saveToStorage(STORAGE_KEYS.PROBLEMS, problems);
    return { data: newProblem, error: null };
  }

  async updateProblem(id: string, updates: Partial<Problem>): Promise<StorageResult<Problem>> {
    const problems = getFromStorage<Problem>(STORAGE_KEYS.PROBLEMS);
    const index = problems.findIndex(p => p.id === id);
    if (index === -1) return { data: null, error: 'Problem not found' };
    
    problems[index] = { ...problems[index], ...updates, updatedAt: new Date() };
    saveToStorage(STORAGE_KEYS.PROBLEMS, problems);
    return { data: problems[index], error: null };
  }

  async deleteProblem(id: string): Promise<StorageResult<boolean>> {
    const problems = getFromStorage<Problem>(STORAGE_KEYS.PROBLEMS);
    const filtered = problems.filter(p => p.id !== id);
    if (filtered.length === problems.length) {
      return { data: false, error: 'Problem not found' };
    }
    saveToStorage(STORAGE_KEYS.PROBLEMS, filtered);
    return { data: true, error: null };
  }

  // Lists
  async getLists(query?: StorageQuery<ProblemList>): Promise<StorageListResult<ProblemList>> {
    const lists = getFromStorage<ProblemList>(STORAGE_KEYS.LISTS);
    const { data, total } = applyQuery(lists, query);
    return { data, total, error: null };
  }

  async getList(id: string): Promise<StorageResult<ProblemList>> {
    const lists = getFromStorage<ProblemList>(STORAGE_KEYS.LISTS);
    const list = lists.find(l => l.id === id) || null;
    return { data: list, error: list ? null : 'List not found' };
  }

  async getListByShareCode(code: string): Promise<StorageResult<ProblemList>> {
    const lists = getFromStorage<ProblemList>(STORAGE_KEYS.LISTS);
    const list = lists.find(l => l.shareCode === code) || null;
    return { data: list, error: list ? null : 'List not found' };
  }

  async createList(
    list: Omit<ProblemList, 'id' | 'createdAt' | 'updatedAt' | 'shareCode'>
  ): Promise<StorageResult<ProblemList>> {
    const lists = getFromStorage<ProblemList>(STORAGE_KEYS.LISTS);
    const newList: ProblemList = {
      ...list,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      shareCode: generateShareCode(),
    };
    lists.push(newList);
    saveToStorage(STORAGE_KEYS.LISTS, lists);
    return { data: newList, error: null };
  }

  async updateList(id: string, updates: Partial<ProblemList>): Promise<StorageResult<ProblemList>> {
    const lists = getFromStorage<ProblemList>(STORAGE_KEYS.LISTS);
    const index = lists.findIndex(l => l.id === id);
    if (index === -1) return { data: null, error: 'List not found' };
    
    lists[index] = { ...lists[index], ...updates, updatedAt: new Date() };
    saveToStorage(STORAGE_KEYS.LISTS, lists);
    return { data: lists[index], error: null };
  }

  async deleteList(id: string): Promise<StorageResult<boolean>> {
    const lists = getFromStorage<ProblemList>(STORAGE_KEYS.LISTS);
    const filtered = lists.filter(l => l.id !== id);
    saveToStorage(STORAGE_KEYS.LISTS, filtered);
    return { data: true, error: null };
  }

  // Users
  async getUser(id: string): Promise<StorageResult<User>> {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.id === id) || null;
    return { data: user, error: user ? null : 'User not found' };
  }

  async getUserByUsername(username: string): Promise<StorageResult<User>> {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.username === username) || null;
    return { data: user, error: user ? null : 'User not found' };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<StorageResult<User>> {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return { data: null, error: 'User not found' };
    
    users[index] = { ...users[index], ...updates };
    saveToStorage(STORAGE_KEYS.USERS, users);
    return { data: users[index], error: null };
  }

  // Submissions
  async getSubmissions(query?: StorageQuery<Submission>): Promise<StorageListResult<Submission>> {
    const submissions = getFromStorage<Submission>(STORAGE_KEYS.SUBMISSIONS);
    const { data, total } = applyQuery(submissions, query);
    return { data, total, error: null };
  }

  async createSubmission(
    submission: Omit<Submission, 'id' | 'createdAt'>
  ): Promise<StorageResult<Submission>> {
    const submissions = getFromStorage<Submission>(STORAGE_KEYS.SUBMISSIONS);
    const newSubmission: Submission = {
      ...submission,
      id: generateId(),
      createdAt: new Date(),
    };
    submissions.push(newSubmission);
    saveToStorage(STORAGE_KEYS.SUBMISSIONS, submissions);
    return { data: newSubmission, error: null };
  }

  async getLatestSubmission(userId: string, problemId: string): Promise<StorageResult<Submission>> {
    const submissions = getFromStorage<Submission>(STORAGE_KEYS.SUBMISSIONS);
    const userSubmissions = submissions
      .filter(s => s.userId === userId && s.problemId === problemId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return { data: userSubmissions[0] || null, error: null };
  }

  // Comments
  async getComments(problemId: string): Promise<StorageListResult<Comment>> {
    const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS);
    const filtered = comments.filter(c => c.problemId === problemId);
    return { data: filtered, total: filtered.length, error: null };
  }

  async createComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<StorageResult<Comment>> {
    const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS);
    const newComment: Comment = {
      ...comment,
      id: generateId(),
      createdAt: new Date(),
    };
    comments.push(newComment);
    saveToStorage(STORAGE_KEYS.COMMENTS, comments);
    return { data: newComment, error: null };
  }

  async deleteComment(id: string): Promise<StorageResult<boolean>> {
    const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS);
    const filtered = comments.filter(c => c.id !== id);
    saveToStorage(STORAGE_KEYS.COMMENTS, filtered);
    return { data: true, error: null };
  }

  // Notes
  async getNote(userId: string, problemId: string): Promise<StorageResult<Note>> {
    const notes = getFromStorage<Note>(STORAGE_KEYS.NOTES);
    const note = notes.find(n => n.userId === userId && n.problemId === problemId) || null;
    return { data: note, error: null };
  }

  async saveNote(note: Omit<Note, 'id' | 'updatedAt'>): Promise<StorageResult<Note>> {
    const notes = getFromStorage<Note>(STORAGE_KEYS.NOTES);
    const existingIndex = notes.findIndex(
      n => n.userId === note.userId && n.problemId === note.problemId
    );
    
    const savedNote: Note = {
      ...note,
      id: existingIndex >= 0 ? notes[existingIndex].id : generateId(),
      updatedAt: new Date(),
    };
    
    if (existingIndex >= 0) {
      notes[existingIndex] = savedNote;
    } else {
      notes.push(savedNote);
    }
    
    saveToStorage(STORAGE_KEYS.NOTES, notes);
    return { data: savedNote, error: null };
  }
}
