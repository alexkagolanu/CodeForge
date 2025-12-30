/**
 * Profile Page - Shows real user data from Supabase
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Trophy, 
  Target, 
  Flame, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Medal,
  Settings
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserStats {
  problemsSolved: number;
  problemsAttempted: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
  streak: number;
}

interface Submission {
  id: string;
  problem_id: string;
  status: string;
  language: string;
  created_at: string;
  problems?: { title: string } | null;
}

const defaultStats: UserStats = {
  problemsSolved: 0,
  problemsAttempted: 0,
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  totalSubmissions: 0,
  acceptanceRate: 0,
  streak: 0,
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string; bio: string | null; avatar_url: string | null } | null>(null);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [problemCounts, setProblemCounts] = useState({ easy: 0, medium: 0, hard: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      loadProfileData();
    }
  }, [user, authLoading, navigate]);

  async function loadProfileData() {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, bio, avatar_url, stats')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile({
          username: profileData.username,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
        });
        
        if (profileData.stats && typeof profileData.stats === 'object') {
          const s = profileData.stats as Record<string, unknown>;
          setStats({
            problemsSolved: (s.problemsSolved as number) || 0,
            problemsAttempted: (s.problemsAttempted as number) || 0,
            easySolved: (s.easySolved as number) || 0,
            mediumSolved: (s.mediumSolved as number) || 0,
            hardSolved: (s.hardSolved as number) || 0,
            totalSubmissions: (s.totalSubmissions as number) || 0,
            acceptanceRate: (s.acceptanceRate as number) || 0,
            streak: (s.streak as number) || 0,
          });
        }
      }

      // Load recent submissions
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('id, problem_id, status, language, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (submissionsData) {
        // Fetch problem titles for submissions
        const problemIds = [...new Set(submissionsData.map(s => s.problem_id))];
        const { data: problemsData } = await supabase
          .from('problems')
          .select('id, title')
          .in('id', problemIds);

        const problemMap = new Map(problemsData?.map(p => [p.id, p.title]) || []);
        
        const submissionsWithTitles = submissionsData.map(s => ({
          ...s,
          problems: { title: problemMap.get(s.problem_id) || 'Unknown Problem' }
        }));

        setRecentSubmissions(submissionsWithTitles);
      }

      // Load problem counts by difficulty
      const { data: problemsCount } = await supabase
        .from('problems')
        .select('difficulty');

      if (problemsCount) {
        const counts = { easy: 0, medium: 0, hard: 0 };
        problemsCount.forEach(p => {
          if (p.difficulty === 'easy') counts.easy++;
          else if (p.difficulty === 'medium') counts.medium++;
          else if (p.difficulty === 'hard') counts.hard++;
        });
        setProblemCounts(counts);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const { easySolved, mediumSolved, hardSolved } = stats;
  const easyTotal = problemCounts.easy || 1;
  const mediumTotal = problemCounts.medium || 1;
  const hardTotal = problemCounts.hard || 1;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card variant="gradient">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>
              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-bold">{profile?.username || 'User'}</h1>
                  <Link to="/profile/settings">
                    <Button variant="ghost" size="icon-sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-muted-foreground">{profile?.bio || user.email}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <Badge variant="success" className="gap-1">
                    <Flame className="h-3 w-3" />
                    {stats.streak} day streak
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Medal className="h-3 w-3" />
                    {stats.problemsSolved} solved
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.problemsSolved}</div>
              <p className="text-sm text-muted-foreground">Problems Solved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="h-8 w-8 text-warning mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.acceptanceRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Acceptance Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
              <p className="text-sm text-muted-foreground">Submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 text-info mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.streak}</div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Difficulty Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Progress by Difficulty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-success" />
                  Easy
                </span>
                <span className="text-muted-foreground">
                  {easySolved}/{easyTotal}
                </span>
              </div>
              <Progress value={(easySolved / easyTotal) * 100} className="h-2 bg-success/20" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-warning" />
                  Medium
                </span>
                <span className="text-muted-foreground">
                  {mediumSolved}/{mediumTotal}
                </span>
              </div>
              <Progress value={(mediumSolved / mediumTotal) * 100} className="h-2 bg-warning/20" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-destructive" />
                  Hard
                </span>
                <span className="text-muted-foreground">
                  {hardSolved}/{hardTotal}
                </span>
              </div>
              <Progress value={(hardSolved / hardTotal) * 100} className="h-2 bg-destructive/20" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No submissions yet.</p>
                <Button className="mt-4" onClick={() => navigate('/problems')}>
                  Start Solving
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {submission.status === 'accepted' ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Clock className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">{submission.problems?.title || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(submission.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{submission.language}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
