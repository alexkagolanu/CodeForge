/**
 * Bookmarks Page - User's saved problems and lists
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookOpen, FileText, Trash2, Search } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BookmarkItem {
  id: string;
  type: 'problem' | 'list';
  title: string;
  description?: string;
  difficulty?: string;
  creatorName?: string;
  slug?: string;
  shareCode?: string;
  createdAt: Date;
}

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadBookmarks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadBookmarks = async () => {
    if (!user) return;

    try {
      // Fetch problem bookmarks
      const { data: problemBookmarks, error: problemError } = await supabase
        .from('bookmarks')
        .select(`
          id,
          created_at,
          problems:problem_id (
            id,
            title,
            slug,
            description,
            difficulty,
            creator_name,
            share_code
          )
        `)
        .eq('user_id', user.id)
        .not('problem_id', 'is', null);

      if (problemError) throw problemError;

      // Fetch list bookmarks
      const { data: listBookmarks, error: listError } = await supabase
        .from('bookmarks')
        .select(`
          id,
          created_at,
          problem_lists:list_id (
            id,
            title,
            description,
            creator_name,
            share_code
          )
        `)
        .eq('user_id', user.id)
        .not('list_id', 'is', null);

      if (listError) throw listError;

      const allBookmarks: BookmarkItem[] = [];

      // Map problem bookmarks
      (problemBookmarks || []).forEach((b: any) => {
        if (b.problems) {
          allBookmarks.push({
            id: b.id,
            type: 'problem',
            title: b.problems.title,
            description: b.problems.description,
            difficulty: b.problems.difficulty,
            creatorName: b.problems.creator_name,
            slug: b.problems.slug,
            shareCode: b.problems.share_code,
            createdAt: new Date(b.created_at),
          });
        }
      });

      // Map list bookmarks
      (listBookmarks || []).forEach((b: any) => {
        if (b.problem_lists) {
          allBookmarks.push({
            id: b.id,
            type: 'list',
            title: b.problem_lists.title,
            description: b.problem_lists.description,
            creatorName: b.problem_lists.creator_name,
            shareCode: b.problem_lists.share_code,
            createdAt: new Date(b.created_at),
          });
        }
      });

      // Sort by creation date
      allBookmarks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setBookmarks(allBookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast({ title: 'Error', description: 'Failed to load bookmarks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (id: string) => {
    try {
      const { error } = await supabase.from('bookmarks').delete().eq('id', id);
      if (error) throw error;
      setBookmarks(bookmarks.filter(b => b.id !== id));
      toast({ title: 'Bookmark removed', description: 'Item has been removed from your bookmarks.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove bookmark', variant: 'destructive' });
    }
  };

  const filteredBookmarks = bookmarks.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const problemBookmarks = filteredBookmarks.filter(b => b.type === 'problem');
  const listBookmarks = filteredBookmarks.filter(b => b.type === 'list');

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view bookmarks</h2>
          <p className="text-muted-foreground mb-4">
            Save problems and lists to access them quickly later.
          </p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bookmark className="h-8 w-8 text-primary" />
            Bookmarks
          </h1>
          <p className="text-muted-foreground mt-1">
            Your saved problems and lists
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No bookmarks yet</h3>
            <p className="text-muted-foreground mt-1">
              Start bookmarking problems and lists to see them here.
            </p>
            <Link to="/problems">
              <Button className="mt-4">Browse Problems</Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({filteredBookmarks.length})</TabsTrigger>
              <TabsTrigger value="problems">Problems ({problemBookmarks.length})</TabsTrigger>
              <TabsTrigger value="lists">Lists ({listBookmarks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                {filteredBookmarks.map((bookmark) => (
                  <BookmarkCard key={bookmark.id} bookmark={bookmark} onRemove={removeBookmark} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="problems" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                {problemBookmarks.map((bookmark) => (
                  <BookmarkCard key={bookmark.id} bookmark={bookmark} onRemove={removeBookmark} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="lists" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                {listBookmarks.map((bookmark) => (
                  <BookmarkCard key={bookmark.id} bookmark={bookmark} onRemove={removeBookmark} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}

function BookmarkCard({ bookmark, onRemove }: { bookmark: BookmarkItem; onRemove: (id: string) => void }) {
  const difficultyColors: Record<string, string> = {
    easy: 'bg-success/10 text-success',
    medium: 'bg-warning/10 text-warning',
    hard: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card className="group hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
              bookmark.type === 'problem' ? 'bg-primary/10' : 'bg-accent/10'
            }`}>
              {bookmark.type === 'problem' ? (
                <FileText className="h-5 w-5 text-primary" />
              ) : (
                <BookOpen className="h-5 w-5 text-accent" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link to={bookmark.type === 'problem' ? `/problem/${bookmark.slug}` : `/list/${bookmark.shareCode}`}>
                <h3 className="font-medium truncate hover:text-primary transition-colors">
                  {bookmark.title}
                </h3>
              </Link>
              {bookmark.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {bookmark.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {bookmark.difficulty && (
                  <Badge className={difficultyColors[bookmark.difficulty]}>
                    {bookmark.difficulty}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  by {bookmark.creatorName}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            onClick={() => onRemove(bookmark.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
