/**
 * Comment Section Component - Discussion for problems
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, ThumbsUp, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  userName: string;
  userAvatar?: string;
  userId: string;
  likes: number;
  createdAt: Date;
  isLiked?: boolean;
}

interface CommentSectionProps {
  problemId: string;
}

export function CommentSection({ problemId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [problemId]);

  const loadComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('problem_id', problemId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user's likes if logged in
      let userLikes: Set<string> = new Set();
      if (user) {
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
        
        userLikes = new Set((likesData || []).map(l => l.comment_id));
      }

      setComments((commentsData || []).map(c => ({
        id: c.id,
        content: c.content,
        userName: c.user_name,
        userAvatar: c.user_avatar,
        userId: c.user_id,
        likes: c.likes || 0,
        createdAt: new Date(c.created_at),
        isLiked: userLikes.has(c.id),
      })));
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to comment.', variant: 'destructive' });
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('comments')
        .insert({
          problem_id: problemId,
          user_id: user.id,
          user_name: profile?.username || 'Anonymous',
          user_avatar: profile?.avatar_url,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setComments([{
        id: data.id,
        content: data.content,
        userName: data.user_name,
        userAvatar: data.user_avatar,
        userId: data.user_id,
        likes: 0,
        createdAt: new Date(data.created_at),
        isLiked: false,
      }, ...comments]);

      setNewComment('');
      toast({ title: 'Comment posted!', description: 'Your comment has been added.' });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({ title: 'Error', description: 'Failed to post comment. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to like comments.', variant: 'destructive' });
      return;
    }

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    try {
      if (comment.isLiked) {
        // Unlike
        await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', commentId);
        await supabase.from('comments').update({ likes: comment.likes - 1 }).eq('id', commentId);
        
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, likes: c.likes - 1, isLiked: false } : c
        ));
      } else {
        // Like
        await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: commentId });
        await supabase.from('comments').update({ likes: comment.likes + 1 }).eq('id', commentId);
        
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, likes: c.likes + 1, isLiked: true } : c
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      
      setComments(comments.filter(c => c.id !== commentId));
      toast({ title: 'Comment deleted', description: 'Your comment has been removed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete comment.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "Share your thoughts or solution approach..." : "Sign in to comment..."}
          disabled={!user}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!user || submitting || !newComment.trim()} className="gap-2">
            <Send className="h-4 w-4" />
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {comment.userAvatar ? (
                      <img src={comment.userAvatar} alt={comment.userName} className="h-8 w-8 rounded-full" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{comment.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {user?.id === comment.userId && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(comment.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <p className="text-sm">{comment.content}</p>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(comment.id)}
                className={cn('gap-1.5', comment.isLiked && 'text-primary')}
              >
                <ThumbsUp className={cn('h-4 w-4', comment.isLiked && 'fill-current')} />
                {comment.likes}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
