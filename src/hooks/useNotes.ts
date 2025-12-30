/**
 * Notes Hook - Save and load user notes for problems
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useNotes(problemId: string | undefined) {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load notes
  useEffect(() => {
    if (!problemId || !user) {
      setLoading(false);
      return;
    }

    async function loadNotes() {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('content, updated_at')
          .eq('problem_id', problemId)
          .eq('user_id', user!.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setNotes(data.content || '');
          setLastSaved(new Date(data.updated_at));
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, [problemId, user]);

  // Save notes
  const saveNotes = useCallback(async (content: string) => {
    if (!problemId || !user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save notes.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Check if note exists
      const { data: existing } = await supabase
        .from('notes')
        .select('id')
        .eq('problem_id', problemId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update({
            content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new note
        const { error } = await supabase
          .from('notes')
          .insert({
            problem_id: problemId,
            user_id: user.id,
            content,
          });

        if (error) throw error;
      }

      setLastSaved(new Date());
      toast({
        title: 'Notes saved',
        description: 'Your notes have been saved.',
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [problemId, user]);

  return {
    notes,
    setNotes,
    saveNotes,
    loading,
    saving,
    lastSaved,
  };
}
