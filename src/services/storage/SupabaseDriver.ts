/**
 * Supabase Storage Driver - Cloud database implementation
 */

import { supabase } from '@/integrations/supabase/client';
import type { IStorageDriver, StorageQuery, StorageResult, StorageListResult } from './StorageInterface';
import type { Problem, ProblemList, User, Submission, Comment, Note, SubmissionStatus, UserStats } from '@/types';
import type { Json } from '@/integrations/supabase/types';

// Helper to safely parse UserStats from JSON
function parseUserStats(stats: Json | null | undefined): UserStats {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
    return defaultStats;
  }
  const s = stats as Record<string, unknown>;
  return {
    problemsSolved: typeof s.problemsSolved === 'number' ? s.problemsSolved : 0,
    problemsAttempted: typeof s.problemsAttempted === 'number' ? s.problemsAttempted : 0,
    easySolved: typeof s.easySolved === 'number' ? s.easySolved : 0,
    mediumSolved: typeof s.mediumSolved === 'number' ? s.mediumSolved : 0,
    hardSolved: typeof s.hardSolved === 'number' ? s.hardSolved : 0,
    totalSubmissions: typeof s.totalSubmissions === 'number' ? s.totalSubmissions : 0,
    acceptanceRate: typeof s.acceptanceRate === 'number' ? s.acceptanceRate : 0,
    streak: typeof s.streak === 'number' ? s.streak : 0,
    rank: typeof s.rank === 'number' ? s.rank : undefined,
  };
}

// Helper to generate share codes
function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Helper to generate slugs
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
}

// Default user stats
const defaultStats: UserStats = {
  problemsSolved: 0,
  problemsAttempted: 0,
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  totalSubmissions: 0,
  acceptanceRate: 0,
  streak: 0,
};

// Map database row to Problem type
function mapProblemFromDb(row: any): Problem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || '',
    content: row.content || row.contentmarkdown || '',
    difficulty: row.difficulty || 'easy',
    tags: row.tags || [],
    examples: row.examples || [],
    constraints: row.constraints || { timeLimit: (row.time_limit || row.timelimitms || 1000), memoryLimit: (row.memory_limit || row.memorylimitmb || 256) },
    inputFormat: row.input_format || row.inputformat || '',
    outputFormat: row.output_format || row.outputformat || '',
    testCases: row.test_cases || [],
    starterCode: row.starter_code || {},
    visibility: row.visibility,
    creatorId: row.creator_id,
    creatorName: row.creator_name,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    likes: row.likes || 0,
    submissions: row.submissions_count || 0,
    acceptanceRate: row.acceptance_rate || 0,
    timeLimit: row.time_limit || row.timelimitms,
    shareCode: row.share_code,
    // Optional metadata
    sourcePlatform: row.sourceplatform || undefined,
    externalUrl: row.externalurl || undefined,
    sourceId: row.sourceid || undefined,
    rating: row.rating || undefined,
    editorialUrl: row.editorialurl || undefined,
    checker_kind: row.checker_kind || undefined,
    checker_script: row.checker_script || undefined,
    checker_float_tolerance: row.checker_float_tolerance || undefined,
    checker_case_insensitive: row.checker_case_insensitive || undefined,
    io_mode: row.io_mode || undefined,
    file_input_name: row.file_input_name || undefined,
    file_output_name: row.file_output_name || undefined,
    problemType: row.problemtype || 'algorithm',
    sqlGlobalSetup: row.sql_global_setup || undefined,
  };
}

// Map database row to ProblemList type
function mapListFromDb(row: any): ProblemList {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    creatorId: row.creator_id,
    creatorName: row.creator_name,
    visibility: row.visibility,
    isSequential: row.is_sequential || false,
    sections: row.sections || [],
    shareCode: row.share_code,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    followers: row.followers || 0,
  };
}

export class SupabaseDriver implements IStorageDriver {
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  isAvailable(): boolean {
    return true;
  }

  // Problems
  async getProblems(query?: StorageQuery<Problem>): Promise<StorageListResult<Problem>> {
    try {
      // Keep server-side filters simple to avoid 400s from missing columns like likes/created_at.
      let q = supabase.from('problems').select('*');

      if (query?.where) {
        if (query.where.visibility) {
          q = q.eq('visibility', query.where.visibility);
        }
        if (query.where.creatorId) {
          q = q.eq('creator_id', query.where.creatorId);
        }
        if (query.where.difficulty) {
          q = q.eq('difficulty', query.where.difficulty);
        }
        if ((query.where as any).sourcePlatform) {
          q = q.eq('sourceplatform', (query.where as any).sourcePlatform);
        }
      }

      if (query?.search) {
        // Basic OR search on server for title and creator_name
        q = q.or(`title.ilike.%${query.search}%,creator_name.ilike.%${query.search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;

      let items = (data || []).map(mapProblemFromDb);

      // Client-side search for tags as well
      if (query?.search) {
        const ql = query.search.toLowerCase();
        items = items.filter((p) =>
          p.title.toLowerCase().includes(ql) ||
          (p.creatorName || '').toLowerCase().includes(ql) ||
          p.tags.some((t) => t.toLowerCase().includes(ql))
        );
      }

      // Client-side ordering to avoid server errors when columns don't exist
      if (query?.orderBy) {
        const ascending = query.orderDirection === 'asc';
        const key = query.orderBy;
        items.sort((a: any, b: any) => {
          const av = a[key];
          const bv = b[key];
          if (av == null && bv == null) return 0;
          if (av == null) return ascending ? -1 : 1;
          if (bv == null) return ascending ? 1 : -1;
          if (av < bv) return ascending ? -1 : 1;
          if (av > bv) return ascending ? 1 : -1;
          return 0;
        });
      } else {
        // Default: newest first by createdAt if present
        items.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
      }

      const total = items.length;

      if (query?.offset != null || query?.limit != null) {
        const start = query.offset || 0;
        const end = query.limit ? start + query.limit : undefined;
        items = items.slice(start, end);
      }

      return { data: items, total, error: null };
    } catch (error) {
      console.error('Error fetching problems:', error);
      return { data: [], total: 0, error: String(error) };
    }
  }

  async getProblem(id: string): Promise<StorageResult<Problem>> {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return { data: data ? mapProblemFromDb(data) : null, error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async getProblemBySlug(slug: string): Promise<StorageResult<Problem>> {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return { data: data ? mapProblemFromDb(data) : null, error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async getProblemByShareCode(code: string): Promise<StorageResult<Problem>> {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('share_code', code)
        .maybeSingle();

      if (error) throw error;
      return { data: data ? mapProblemFromDb(data) : null, error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async createProblem(problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt' | 'shareCode'>): Promise<StorageResult<Problem>> {
    try {
      const insertData = {
       title: problem.title,
       slug: generateSlug(problem.title),
       description: problem.description,
       content: problem.content,
       difficulty: problem.difficulty,
       tags: problem.tags,
       examples: problem.examples as unknown as Json,
       constraints: problem.constraints as unknown as Json,
       input_format: problem.inputFormat,
       output_format: problem.outputFormat,
       test_cases: problem.testCases as unknown as Json,
       starter_code: problem.starterCode as unknown as Json,
       visibility: problem.visibility,
       creator_id: problem.creatorId,
       creator_name: problem.creatorName,
       time_limit: problem.timeLimit,
       share_code: generateShareCode(),
       // Optional metadata
       sourceplatform: problem.sourcePlatform,
       externalurl: problem.externalUrl,
       sourceid: problem.sourceId,
       rating: problem.rating,
       editorialurl: problem.editorialUrl,
       checker_kind: problem.checker_kind,
       checker_script: problem.checker_script,
       checker_float_tolerance: problem.checker_float_tolerance,
       checker_case_insensitive: problem.checker_case_insensitive,
       io_mode: problem.io_mode,
       file_input_name: problem.file_input_name,
       file_output_name: problem.file_output_name,
       problemtype: problem.problemType || 'algorithm',
       sql_global_setup: problem.sqlGlobalSetup,
     };

      const { data, error } = await supabase
        .from('problems')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { data: mapProblemFromDb(data), error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async updateProblem(id: string, updates: Partial<Problem>): Promise<StorageResult<Problem>> {
    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.content) updateData.content = updates.content;
      if (updates.difficulty) updateData.difficulty = updates.difficulty;
      if (updates.tags) updateData.tags = updates.tags;
      if (updates.examples) updateData.examples = updates.examples;
      if (updates.constraints) updateData.constraints = updates.constraints;
      if (updates.inputFormat) updateData.input_format = updates.inputFormat;
      if (updates.outputFormat) updateData.output_format = updates.outputFormat;
      if (updates.testCases) updateData.test_cases = updates.testCases;
      if (updates.starterCode) updateData.starter_code = updates.starterCode;
      if (updates.visibility) updateData.visibility = updates.visibility;
      if (updates.timeLimit !== undefined) updateData.time_limit = updates.timeLimit;
      // Optional metadata
      if (updates.sourcePlatform !== undefined) updateData.sourceplatform = updates.sourcePlatform;
      if (updates.externalUrl !== undefined) updateData.externalurl = updates.externalUrl;
      if (updates.sourceId !== undefined) updateData.sourceid = updates.sourceId;
      if (updates.rating !== undefined) updateData.rating = updates.rating;
      if (updates.editorialUrl !== undefined) updateData.editorialurl = updates.editorialUrl;
      if (updates.checker_kind !== undefined) updateData.checker_kind = updates.checker_kind;
      if (updates.checker_script !== undefined) updateData.checker_script = updates.checker_script;
      if (updates.checker_float_tolerance !== undefined) updateData.checker_float_tolerance = updates.checker_float_tolerance;
      if (updates.checker_case_insensitive !== undefined) updateData.checker_case_insensitive = updates.checker_case_insensitive;
      if (updates.io_mode !== undefined) updateData.io_mode = updates.io_mode;
      if (updates.file_input_name !== undefined) updateData.file_input_name = updates.file_input_name;
      if (updates.file_output_name !== undefined) updateData.file_output_name = updates.file_output_name;
      if ((updates as any).problemType !== undefined) updateData.problemtype = (updates as any).problemType;
      if ((updates as any).sqlGlobalSetup !== undefined) updateData.sql_global_setup = (updates as any).sqlGlobalSetup;

      const { data, error } = await supabase
        .from('problems')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: mapProblemFromDb(data), error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async deleteProblem(id: string): Promise<StorageResult<boolean>> {
    try {
      const { error } = await supabase.from('problems').delete().eq('id', id);
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: String(error) };
    }
  }

  // Problem Lists
  async getLists(query?: StorageQuery<ProblemList>): Promise<StorageListResult<ProblemList>> {
    try {
      let q = supabase.from('problem_lists').select('*', { count: 'exact' });

      if (query?.where) {
        if (query.where.visibility) {
          q = q.eq('visibility', query.where.visibility);
        }
        if (query.where.creatorId) {
          q = q.eq('creator_id', query.where.creatorId);
        }
      }

      q = q.order('created_at', { ascending: false });

      if (query?.limit) q = q.limit(query.limit);

      const { data, error, count } = await q;

      if (error) throw error;

      return {
        data: (data || []).map(mapListFromDb),
        total: count || 0,
        error: null,
      };
    } catch (error) {
      return { data: [], total: 0, error: String(error) };
    }
  }

  async getList(id: string): Promise<StorageResult<ProblemList>> {
    try {
      const { data, error } = await supabase
        .from('problem_lists')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return { data: data ? mapListFromDb(data) : null, error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async getListByShareCode(code: string): Promise<StorageResult<ProblemList>> {
    try {
      const { data, error } = await supabase
        .from('problem_lists')
        .select('*')
        .eq('share_code', code)
        .maybeSingle();

      if (error) throw error;
      return { data: data ? mapListFromDb(data) : null, error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async createList(list: Omit<ProblemList, 'id' | 'createdAt' | 'updatedAt' | 'shareCode'>): Promise<StorageResult<ProblemList>> {
    try {
      const insertData = {
        title: list.title,
        description: list.description,
        creator_id: list.creatorId,
        creator_name: list.creatorName,
        visibility: list.visibility,
        is_sequential: list.isSequential,
        sections: list.sections as unknown as Json,
        share_code: generateShareCode(),
      };

      const { data, error } = await supabase
        .from('problem_lists')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { data: mapListFromDb(data), error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async updateList(id: string, updates: Partial<ProblemList>): Promise<StorageResult<ProblemList>> {
    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.visibility) updateData.visibility = updates.visibility;
      if (updates.isSequential !== undefined) updateData.is_sequential = updates.isSequential;
      if (updates.sections) updateData.sections = updates.sections;

      const { data, error } = await supabase
        .from('problem_lists')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: mapListFromDb(data), error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async deleteList(id: string): Promise<StorageResult<boolean>> {
    try {
      const { error } = await supabase.from('problem_lists').delete().eq('id', id);
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: String(error) };
    }
  }

  // Users
  async getUser(id: string): Promise<StorageResult<User>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { data: null, error: null };

      return {
        data: {
          id: data.user_id,
          username: data.username,
          email: '',
          avatarUrl: data.avatar_url,
          createdAt: new Date(data.created_at),
          stats: parseUserStats(data.stats),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async getUserByUsername(username: string): Promise<StorageResult<User>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { data: null, error: null };

      return {
        data: {
          id: data.user_id,
          username: data.username,
          email: '',
          avatarUrl: data.avatar_url,
          createdAt: new Date(data.created_at),
          stats: parseUserStats(data.stats),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<StorageResult<User>> {
    try {
      const updateData: any = {};
      if (updates.username) updateData.username = updates.username;
      if (updates.avatarUrl) updateData.avatar_url = updates.avatarUrl;
      if (updates.stats) updateData.stats = updates.stats;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: {
          id: data.user_id,
          username: data.username,
          email: '',
          avatarUrl: data.avatar_url,
          createdAt: new Date(data.created_at),
          stats: parseUserStats(data.stats),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  // Submissions
  async getSubmissions(query?: StorageQuery<Submission>): Promise<StorageListResult<Submission>> {
    try {
      let q = supabase.from('submissions').select('*', { count: 'exact' });

      if (query?.where) {
        if (query.where.userId) {
          q = q.eq('user_id', query.where.userId);
        }
        if (query.where.problemId) {
          q = q.eq('problem_id', query.where.problemId);
        }
      }

      q = q.order('created_at', { ascending: false });
      if (query?.limit) q = q.limit(query.limit);

      const { data, error, count } = await q;

      if (error) throw error;

      return {
        data: (data || []).map((row) => ({
          id: row.id,
          problemId: row.problem_id,
          userId: row.user_id,
          code: row.code,
          language: row.language,
          status: row.status as SubmissionStatus,
          runtime: row.runtime,
          memory: row.memory,
          testCasesPassed: row.test_cases_passed,
          totalTestCases: row.total_test_cases,
          errorMessage: row.error_message,
          createdAt: new Date(row.created_at),
        })),
        total: count || 0,
        error: null,
      };
    } catch (error) {
      return { data: [], total: 0, error: String(error) };
    }
  }

  async createSubmission(submission: Omit<Submission, 'id' | 'createdAt'>): Promise<StorageResult<Submission>> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          problem_id: submission.problemId,
          user_id: submission.userId,
          code: submission.code,
          language: submission.language,
          status: submission.status,
          runtime: submission.runtime,
          memory: submission.memory,
          test_cases_passed: submission.testCasesPassed,
          total_test_cases: submission.totalTestCases,
          error_message: submission.errorMessage,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data: {
          id: data.id,
          problemId: data.problem_id,
          userId: data.user_id,
          code: data.code,
          language: data.language,
          status: data.status as SubmissionStatus,
          runtime: data.runtime,
          memory: data.memory,
          testCasesPassed: data.test_cases_passed,
          totalTestCases: data.total_test_cases,
          errorMessage: data.error_message,
          createdAt: new Date(data.created_at),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async getLatestSubmission(userId: string, problemId: string): Promise<StorageResult<Submission>> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('problem_id', problemId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { data: null, error: null };

      return {
        data: {
          id: data.id,
          problemId: data.problem_id,
          userId: data.user_id,
          code: data.code,
          language: data.language,
          status: data.status as SubmissionStatus,
          runtime: data.runtime,
          memory: data.memory,
          testCasesPassed: data.test_cases_passed,
          totalTestCases: data.total_test_cases,
          errorMessage: data.error_message,
          createdAt: new Date(data.created_at),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  // Comments
  async getComments(problemId: string): Promise<StorageListResult<Comment>> {
    try {
      const { data, error, count } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .eq('problem_id', problemId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: (data || []).map((row) => ({
          id: row.id,
          problemId: row.problem_id,
          userId: row.user_id,
          userName: row.user_name,
          userAvatar: row.user_avatar,
          content: row.content,
          likes: row.likes,
          createdAt: new Date(row.created_at),
        })),
        total: count || 0,
        error: null,
      };
    } catch (error) {
      return { data: [], total: 0, error: String(error) };
    }
  }

  async createComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<StorageResult<Comment>> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          problem_id: comment.problemId,
          user_id: comment.userId,
          user_name: comment.userName,
          user_avatar: comment.userAvatar,
          content: comment.content,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data: {
          id: data.id,
          problemId: data.problem_id,
          userId: data.user_id,
          userName: data.user_name,
          userAvatar: data.user_avatar,
          content: data.content,
          likes: data.likes,
          createdAt: new Date(data.created_at),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async deleteComment(id: string): Promise<StorageResult<boolean>> {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: String(error) };
    }
  }

  // Notes
  async getNote(userId: string, problemId: string): Promise<StorageResult<Note>> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('problem_id', problemId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { data: null, error: null };

      return {
        data: {
          id: data.id,
          problemId: data.problem_id,
          userId: data.user_id,
          content: data.content,
          updatedAt: new Date(data.updated_at),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  async saveNote(note: Omit<Note, 'id' | 'updatedAt'>): Promise<StorageResult<Note>> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .upsert({
          problem_id: note.problemId,
          user_id: note.userId,
          content: note.content,
        }, { onConflict: 'problem_id,user_id' })
        .select()
        .single();

      if (error) throw error;

      return {
        data: {
          id: data.id,
          problemId: data.problem_id,
          userId: data.user_id,
          content: data.content,
          updatedAt: new Date(data.updated_at),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }
}
