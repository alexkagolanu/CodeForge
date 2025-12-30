/**
 * Problem Card Component
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Users, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Problem, Difficulty } from '@/types';
import { cn } from '@/lib/utils';

interface ProblemCardProps {
  problem: Problem;
  isCompleted?: boolean;
}

const difficultyVariant: Record<Difficulty, 'easy' | 'medium' | 'hard'> = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
};

export function ProblemCard({ problem, isCompleted }: ProblemCardProps) {
  const safeDifficulty = (problem.difficulty || 'easy') as Difficulty;
  const safeTags = Array.isArray(problem.tags) ? problem.tags : [];
  const submissions = typeof problem.submissions === 'number' ? problem.submissions : 0;
  const likes = typeof problem.likes === 'number' ? problem.likes : 0;
  const acceptanceRate = typeof problem.acceptanceRate === 'number' ? problem.acceptanceRate : 0;
  return (
    <Link to={`/problem/${problem.slug}`}>
      <Card 
        variant="default" 
        className={cn(
          'group transition-all duration-300 hover:shadow-lg hover:border-primary/30',
          isCompleted && 'border-success/30 bg-success/5'
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {isCompleted && (
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              )}
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                {problem.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {(problem as any).sourcePlatform && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {(problem as any).sourcePlatform}
                </Badge>
              )}

                {(problem as any).problemType && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {(problem as any).problemType}
                  </Badge>
                )}
              <Badge variant={difficultyVariant[safeDifficulty]}>
                {safeDifficulty.charAt(0).toUpperCase() + safeDifficulty.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {problem.description}
          </p>
          
          {/* Source link */}
          {(problem as any).externalUrl && (
            <div className="text-xs">
              <a
                className="text-primary hover:underline"
                href={(problem as any).externalUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                View original problem
              </a>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {safeTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{submissions.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>{likes.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{acceptanceRate.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
