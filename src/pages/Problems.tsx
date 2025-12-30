/**
 * Problems List Page
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProblemCard } from '@/components/problem/ProblemCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/services/storage/StorageService';
import type { Problem, Difficulty } from '@/types';
import { cn } from '@/lib/utils';

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

const popularTags = [
  'Array', 'Hash Table', 'String', 'Dynamic Programming',
  'Math', 'Sorting', 'Greedy', 'Binary Search', 'Tree', 'Graph'
];

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedProblemTypes, setSelectedProblemTypes] = useState<string[]>([]);

  useEffect(() => {
    async function loadProblems() {
      await storageService.initialize();
      const result = await storageService.getDriver().getProblems({
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });
      setProblems(result.data);
      setLoading(false);
    }
    loadProblems();
  }, []);

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = problem.title.toLowerCase().includes(query);
        const matchesCreator = problem.creatorName.toLowerCase().includes(query);
        const matchesTags = problem.tags.some(tag => 
          tag.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesCreator && !matchesTags) return false;
      }

      // Difficulty filter
      if (selectedDifficulty && problem.difficulty !== selectedDifficulty) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(tag => 
          problem.tags.includes(tag)
        );
        if (!hasAllTags) return false;
      }

      // Platform filter
      if (selectedPlatforms.length > 0) {
        const p = (problem as any).sourcePlatform || 'custom';
        if (!selectedPlatforms.includes(p)) return false;
      }

      // Problem type filter
      if (Array.isArray(selectedProblemTypes) && selectedProblemTypes.length > 0) {
        const t = (problem as any).problemType || 'algorithm';
        if (!selectedProblemTypes.includes(t)) return false;
      }

      return true;
    });
  }, [problems, searchQuery, selectedDifficulty, selectedTags, selectedPlatforms, selectedProblemTypes]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty(null);
    setSelectedTags([]);
    setSelectedPlatforms([]);
    setSelectedProblemTypes([]);
  };

  const hasActiveFilters = searchQuery || selectedDifficulty || selectedTags.length > 0 || selectedPlatforms.length > 0 || selectedProblemTypes.length > 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Problems</h1>
              <p className="text-muted-foreground mt-1">Browse and solve coding challenges from the community</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search problems by title, creator, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-4 animate-fade-in">
              {/* Difficulty */}
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <div className="flex flex-wrap gap-2">
                  {difficulties.map((diff) => (
                    <Button
                      key={diff}
                      variant={selectedDifficulty === diff ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDifficulty(
                        selectedDifficulty === diff ? null : diff
                      )}
                      className={cn(
                        selectedDifficulty === diff && diff === 'easy' && 'bg-success hover:bg-success/90',
                        selectedDifficulty === diff && diff === 'medium' && 'bg-warning hover:bg-warning/90',
                        selectedDifficulty === diff && diff === 'hard' && 'bg-destructive hover:bg-destructive/90'
                      )}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="text-sm font-medium mb-2 block">Source Platform</label>
                <div className="flex flex-wrap gap-2">
                  {['codeforces','codechef','leetcode','aoc','custom'].map((p) => (
                    <Badge
                      key={p}
                      variant={selectedPlatforms.includes(p) ? 'default' : 'secondary'}
                      className="cursor-pointer hover:opacity-80 transition-opacity capitalize"
                      onClick={() => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x=>x!==p) : [...prev, p])}
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Problem Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Problem Type</label>
                <div className="flex flex-wrap gap-2">
                  {['algorithm','sql'].map((t) => (
                    <Badge
                      key={t}
                      variant={selectedProblemTypes.includes(t) ? 'default' : 'secondary'}
                      className="cursor-pointer hover:opacity-80 transition-opacity capitalize"
                      onClick={() => setSelectedProblemTypes(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredProblems.length} of {problems.length} problems
          </p>
        </div>

        {/* Problems Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredProblems.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProblems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No problems found</h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
