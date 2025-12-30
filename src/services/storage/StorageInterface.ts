/**
 * Storage Interface - Abstraction layer for data persistence
 * Implements the Strategy pattern for different storage backends
 */

import type { Problem, ProblemList, User, Submission, Comment, Note } from '@/types';

export interface StorageQuery<T> {
  where?: Partial<T>;
  orderBy?: keyof T;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  search?: string;
  searchFields?: (keyof T)[];
}

export interface StorageResult<T> {
  data: T | null;
  error: string | null;
}

export interface StorageListResult<T> {
  data: T[];
  total: number;
  error: string | null;
}

export interface IStorageDriver {
  // Initialization
  initialize(): Promise<void>;
  isAvailable(): boolean;
  
  // Problems
  getProblems(query?: StorageQuery<Problem>): Promise<StorageListResult<Problem>>;
  getProblem(id: string): Promise<StorageResult<Problem>>;
  getProblemBySlug(slug: string): Promise<StorageResult<Problem>>;
  getProblemByShareCode(code: string): Promise<StorageResult<Problem>>;
  createProblem(problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt' | 'shareCode'>): Promise<StorageResult<Problem>>;
  updateProblem(id: string, updates: Partial<Problem>): Promise<StorageResult<Problem>>;
  deleteProblem(id: string): Promise<StorageResult<boolean>>;
  
  // Problem Lists
  getLists(query?: StorageQuery<ProblemList>): Promise<StorageListResult<ProblemList>>;
  getList(id: string): Promise<StorageResult<ProblemList>>;
  getListByShareCode(code: string): Promise<StorageResult<ProblemList>>;
  createList(list: Omit<ProblemList, 'id' | 'createdAt' | 'updatedAt' | 'shareCode'>): Promise<StorageResult<ProblemList>>;
  updateList(id: string, updates: Partial<ProblemList>): Promise<StorageResult<ProblemList>>;
  deleteList(id: string): Promise<StorageResult<boolean>>;
  
  // Users
  getUser(id: string): Promise<StorageResult<User>>;
  getUserByUsername(username: string): Promise<StorageResult<User>>;
  updateUser(id: string, updates: Partial<User>): Promise<StorageResult<User>>;
  
  // Submissions
  getSubmissions(query?: StorageQuery<Submission>): Promise<StorageListResult<Submission>>;
  createSubmission(submission: Omit<Submission, 'id' | 'createdAt'>): Promise<StorageResult<Submission>>;
  getLatestSubmission(userId: string, problemId: string): Promise<StorageResult<Submission>>;
  
  // Comments
  getComments(problemId: string): Promise<StorageListResult<Comment>>;
  createComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<StorageResult<Comment>>;
  deleteComment(id: string): Promise<StorageResult<boolean>>;
  
  // Notes
  getNote(userId: string, problemId: string): Promise<StorageResult<Note>>;
  saveNote(note: Omit<Note, 'id' | 'updatedAt'>): Promise<StorageResult<Note>>;
  
  // Sync
  syncFromRemote?(): Promise<void>;
  syncToRemote?(): Promise<void>;
}

// Storage factory function type
export type StorageDriverFactory = () => IStorageDriver;
