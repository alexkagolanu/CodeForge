/**
 * List Detail Page - View problems in a list
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  BookOpen, 
  Users, 
  Lock, 
  Globe,
  CheckCircle2,
  Circle,
  Bookmark,
  BookmarkCheck,
  Share2,
  Check
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { storageService } from '@/services/storage/StorageService';
import { useBookmarks } from '@/hooks/useBookmarks';
import { toast } from '@/hooks/use-toast';
import type { ProblemList, Problem } from '@/types';

export default function ListDetailPage() {
  const { code } = useParams<{ code: string }>();
  const [list, setList] = useState<ProblemList | null>(null);
  const [problems, setProblems] = useState<Map<string, Problem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { isListBookmarked, toggleListBookmark } = useBookmarks();

  useEffect(() => {
    async function loadList() {
      if (!code) return;
      
      await storageService.initialize();
      const driver = storageService.getDriver();
      
      // First try to find by share code, then by id
      const result = await driver.getLists({ limit: 100 });
      const foundList = result.data.find(
        l => l.shareCode === code || l.id === code
      );
      
      if (foundList) {
        setList(foundList);
        
        // Load all problems referenced in the list
        const problemIds = new Set<string>();
        foundList.sections.forEach(section => {
          section.problems.forEach(p => problemIds.add(p.problemId));
        });
        
        const problemsMap = new Map<string, Problem>();
        const problemsResult = await driver.getProblems({ limit: 200 });
        
        problemsResult.data.forEach(problem => {
          if (problemIds.has(problem.id)) {
            problemsMap.set(problem.id, problem);
          }
        });
        
        setProblems(problemsMap);
      }
      
      setLoading(false);
    }
    loadList();
  }, [code]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!list) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">List not found</h2>
          <p className="text-muted-foreground mt-2">
            The list you're looking for doesn't exist or is private.
          </p>
          <Link to="/lists">
            <Button className="mt-4">Back to Lists</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const totalProblems = list.sections.reduce(
    (sum, section) => sum + section.problems.length, 0
  );

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link to="/lists">
            <Button variant="ghost" size="icon-sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{list.title}</h1>
                  <p className="text-sm text-muted-foreground">by {list.creatorName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon-sm"
                  onClick={() => toggleListBookmark(list.id)}
                  className={isListBookmarked(list.id) ? 'text-primary' : ''}
                >
                  {isListBookmarked(list.id) ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/list/${list.shareCode}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast({ title: 'Link copied!' });
                  }}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant={list.visibility === 'public' ? 'secondary' : 'outline'}>
                {list.visibility === 'public' ? (
                  <Globe className="h-3 w-3 mr-1" />
                ) : (
                  <Lock className="h-3 w-3 mr-1" />
                )}
                {list.visibility}
              </Badge>
              {list.isSequential && (
                <Badge variant="outline">Sequential Path</Badge>
              )}
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {list.followers} followers
              </Badge>
            </div>
            
            {list.description && (
              <p className="text-muted-foreground mt-4">{list.description}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">0 / {totalProblems}</span>
            </div>
            <Progress value={0} className="h-2" />
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-6">
          {list.sections.map((section, sectionIndex) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                    {sectionIndex + 1}
                  </span>
                  {section.title}
                  <Badge variant="secondary" className="ml-auto">
                    {section.problems.length} problems
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {section.problems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No problems in this section yet.</p>
                ) : (
                  <div className="space-y-2">
                    {section.problems.map((problemRef, problemIndex) => {
                      const problem = problems.get(problemRef.problemId);
                      
                      if (!problem) {
                        return (
                          <div
                            key={problemRef.problemId}
                            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                          >
                            <Circle className="h-5 w-5 text-muted-foreground" />
                            <span className="text-muted-foreground">Problem not found</span>
                          </div>
                        );
                      }
                      
                      return (
                        <Link
                          key={problem.id}
                          to={`/problem/${problem.slug}`}
                          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <Circle className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <span className="font-medium">{problem.title}</span>
                          </div>
                          <Badge
                            variant={
                              problem.difficulty === 'easy' ? 'easy' :
                              problem.difficulty === 'medium' ? 'medium' : 'hard'
                            }
                          >
                            {problem.difficulty}
                          </Badge>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {list.sections.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No sections yet</h3>
              <p className="text-muted-foreground">
                This list doesn't have any sections or problems yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
