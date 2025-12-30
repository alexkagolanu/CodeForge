/**
 * Leaderboard Component - Show top performers for a problem
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Database, User, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  userName: string;
  userAvatar?: string;
  runtime: number;
  memory: number;
  language: string;
  submittedAt: Date;
}

interface LeaderboardProps {
  problemId: string;
}

export function Leaderboard({ problemId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [problemId]);

  const loadLeaderboard = async () => {
    try {
      // Get accepted submissions, ordered by runtime
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          runtime,
          memory,
          language,
          created_at,
          user_id,
          profiles!inner (
            username,
            avatar_url
          )
        `)
        .eq('problem_id', problemId)
        .eq('status', 'accepted')
        .order('runtime', { ascending: true })
        .limit(10);

      if (error) throw error;

      // Remove duplicates (keep best submission per user)
      const userBest = new Map<string, any>();
      (data || []).forEach((entry: any) => {
        if (!userBest.has(entry.user_id) || entry.runtime < userBest.get(entry.user_id).runtime) {
          userBest.set(entry.user_id, entry);
        }
      });

      const leaderboard = Array.from(userBest.values())
        .sort((a, b) => (a.runtime || 0) - (b.runtime || 0))
        .slice(0, 10)
        .map((entry, index) => ({
          rank: index + 1,
          userName: entry.profiles?.username || 'Anonymous',
          userAvatar: entry.profiles?.avatar_url,
          runtime: entry.runtime || 0,
          memory: entry.memory || 0,
          language: entry.language,
          submittedAt: new Date(entry.created_at),
        }));

      setEntries(leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No accepted submissions yet.</p>
        <p className="text-sm">Be the first to solve this problem!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={`${entry.userName}-${entry.rank}`}
          className={cn(
            'flex items-center gap-4 p-3 rounded-lg border border-border',
            entry.rank <= 3 && 'bg-primary/5'
          )}
        >
          {/* Rank */}
          <div className="w-8 flex justify-center">
            {entry.rank <= 3 ? (
              <Medal className={cn('h-5 w-5', getMedalColor(entry.rank))} />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                #{entry.rank}
              </span>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {entry.userAvatar ? (
                <img src={entry.userAvatar} alt={entry.userName} className="h-8 w-8 rounded-full" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
            </div>
            <span className="font-medium text-sm truncate">{entry.userName}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{entry.runtime}ms</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              <span>{entry.memory}MB</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {entry.language}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
