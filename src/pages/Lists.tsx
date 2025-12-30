/**
 * Lists Page - Browse and manage problem collections
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Users, Lock, Globe, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/services/storage/StorageService';
import type { ProblemList } from '@/types';

export default function ListsPage() {
  const [lists, setLists] = useState<ProblemList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLists() {
      await storageService.initialize();
      const result = await storageService.getDriver().getLists({
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });
      setLists(result.data);
      setLoading(false);
    }
    loadLists();
  }, []);

  const sampleLists = [
    {
      id: 'sample-1',
      title: 'LeetCode 75',
      description: 'Master essential coding patterns with these 75 carefully curated problems',
      creatorName: 'CodeForge',
      visibility: 'public' as const,
      isSequential: true,
      sections: [
        { id: '1', title: 'Arrays', problems: Array(10).fill({ problemId: '1', order: 1 }), order: 1 },
        { id: '2', title: 'Strings', problems: Array(8).fill({ problemId: '1', order: 1 }), order: 2 },
      ],
      followers: 12500,
      createdAt: new Date(),
      updatedAt: new Date(),
      shareCode: 'LC75MASTER',
      creatorId: 'system',
    },
    {
      id: 'sample-2',
      title: 'Dynamic Programming Mastery',
      description: 'From basics to advanced DP techniques',
      creatorName: 'CodeForge',
      visibility: 'public' as const,
      isSequential: true,
      sections: [
        { id: '1', title: '1D DP', problems: Array(15).fill({ problemId: '1', order: 1 }), order: 1 },
      ],
      followers: 8200,
      createdAt: new Date(),
      updatedAt: new Date(),
      shareCode: 'DPMASTER',
      creatorId: 'system',
    },
  ];

  const displayLists = lists.length > 0 ? lists : sampleLists;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Problem Lists</h1>
            <p className="text-muted-foreground mt-1">
              Curated collections of coding challenges
            </p>
          </div>
          <Link to="/create-list">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create List
            </Button>
          </Link>
        </div>

        {/* Lists Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {displayLists.map((list) => {
              const totalProblems = list.sections.reduce(
                (sum, section) => sum + section.problems.length,
                0
              );

              return (
                <Link key={list.id} to={`/list/${list.shareCode || list.id}`}>
                <Card className="group hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {list.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            by {list.creatorName}
                          </p>
                        </div>
                      </div>
                      <Badge variant={list.visibility === 'public' ? 'secondary' : 'outline'}>
                        {list.visibility === 'public' ? (
                          <Globe className="h-3 w-3 mr-1" />
                        ) : (
                          <Lock className="h-3 w-3 mr-1" />
                        )}
                        {list.visibility}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="line-clamp-2">
                      {list.description}
                    </CardDescription>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{totalProblems} problems</span>
                      <span>{list.sections.length} sections</span>
                      {list.isSequential && (
                        <Badge variant="outline" className="text-xs">
                          Sequential
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{list.followers.toLocaleString()} followers</span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 group-hover:text-primary">
                        View List
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && lists.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              These are sample lists. Create your own to get started!
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
