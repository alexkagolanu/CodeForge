/**
 * Bookmarks Hook - Manage user bookmarks for problems and lists
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedProblemIds, setBookmarkedProblemIds] = useState<Set<string>>(new Set());
  const [bookmarkedListIds, setBookmarkedListIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    } else {
      setBookmarkedProblemIds(new Set());
      setBookmarkedListIds(new Set());
      setLoading(false);
    }
  }, [user]);

  const loadBookmarks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('problem_id, list_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const problemIds = new Set<string>();
      const listIds = new Set<string>();

      (data || []).forEach((b) => {
        if (b.problem_id) problemIds.add(b.problem_id);
        if (b.list_id) listIds.add(b.list_id);
      });

      setBookmarkedProblemIds(problemIds);
      setBookmarkedListIds(listIds);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProblemBookmark = useCallback(async (problemId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to bookmark problems.',
        variant: 'destructive',
      });
      return;
    }

    const isBookmarked = bookmarkedProblemIds.has(problemId);

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('problem_id', problemId);

        if (error) throw error;

        setBookmarkedProblemIds((prev) => {
          const next = new Set(prev);
          next.delete(problemId);
          return next;
        });
        
        toast({ title: 'Bookmark removed' });
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, problem_id: problemId });

        if (error) throw error;

        setBookmarkedProblemIds((prev) => new Set(prev).add(problemId));
        toast({ title: 'Problem bookmarked' });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bookmark',
        variant: 'destructive',
      });
    }
  }, [user, bookmarkedProblemIds]);

  const toggleListBookmark = useCallback(async (listId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to bookmark lists.',
        variant: 'destructive',
      });
      return;
    }

    const isBookmarked = bookmarkedListIds.has(listId);

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('list_id', listId);

        if (error) throw error;

        setBookmarkedListIds((prev) => {
          const next = new Set(prev);
          next.delete(listId);
          return next;
        });
        
        toast({ title: 'Bookmark removed' });
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, list_id: listId });

        if (error) throw error;

        setBookmarkedListIds((prev) => new Set(prev).add(listId));
        toast({ title: 'List bookmarked' });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bookmark',
        variant: 'destructive',
      });
    }
  }, [user, bookmarkedListIds]);

  const isProblemBookmarked = useCallback(
    (problemId: string) => bookmarkedProblemIds.has(problemId),
    [bookmarkedProblemIds]
  );

  const isListBookmarked = useCallback(
    (listId: string) => bookmarkedListIds.has(listId),
    [bookmarkedListIds]
  );

  return {
    loading,
    isProblemBookmarked,
    isListBookmarked,
    toggleProblemBookmark,
    toggleListBookmark,
    refetch: loadBookmarks,
  };
}
