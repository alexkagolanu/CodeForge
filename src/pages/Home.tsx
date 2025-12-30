/**
 * Home Page - Landing page with featured problems
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Code2, 
  Zap, 
  Target, 
  Trophy,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { ProblemCard } from '@/components/problem/ProblemCard';
import { storageService } from '@/services/storage/StorageService';
import type { Problem } from '@/types';

const features = [
  {
    icon: Code2,
    title: 'Multi-Language Support',
    description: 'Write code in JavaScript, Python, C++, Java, and more with full syntax highlighting.',
  },
  {
    icon: Zap,
    title: 'Instant Execution',
    description: 'Run your code instantly with our powerful execution engine powered by Piston API.',
  },
  {
    icon: Target,
    title: 'Create & Share',
    description: 'Create your own coding challenges and share them with the community.',
  },
  {
    icon: Trophy,
    title: 'Track Progress',
    description: 'Monitor your performance, build streaks, and compete on leaderboards.',
  },
];


export default function HomePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProblems() {
      await storageService.initialize();
      const result = await storageService.getDriver().getProblems({
        limit: 6,
        orderBy: 'likes',
        orderDirection: 'desc',
      });
      setProblems(result.data);
      setLoading(false);
    }
    loadProblems();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-0 top-1/2 h-[300px] w-[300px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Practice. Create. Master.
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Level Up Your{' '}
            <span className="gradient-text">Coding Skills</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Solve algorithmic challenges, create your own problems, and join a 
            community of developers pushing their limits every day.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/problems">
              <Button size="lg" className="gap-2">
                Start Solving
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/create">
              <Button size="lg" variant="outline" className="gap-2">
                Create Problem
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Everything You Need to Excel
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} variant="gradient" className="group hover:shadow-lg transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Problems Section */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Popular Problems
            </h2>
            <p className="text-muted-foreground mt-1">
              Start with these highly-rated challenges
            </p>
          </div>
          <Link to="/problems">
            <Button variant="ghost" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-48 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-12">
        <Card variant="gradient" className="p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Join thousands of developers who are improving their skills every day.
          </p>
          <Link to="/problems">
            <Button size="lg" className="gap-2">
              Explore Problems
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </section>
    </Layout>
  );
}
