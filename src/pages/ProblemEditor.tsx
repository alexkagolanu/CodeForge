/**
 * Problem Editor Page - Solve coding challenges with resizable panels
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, 
  Send, 
  Clock, 
  Database, 
  ChevronLeft,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Share2,
  ThumbsUp,
  FileText,
  Trophy,
  Settings2,
  Copy,
  Check,
  AlertCircle,
  Save
} from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Layout } from '@/components/layout/Layout';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { ConsoleOutput } from '@/components/editor/ConsoleOutput';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { CommentSection } from '@/components/comments/CommentSection';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storageService } from '@/services/storage/StorageService';
import { executionService } from '@/services/execution/ExecutionStrategy';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useNotes } from '@/hooks/useNotes';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAuth } from '@/contexts/AuthContext';
import type { Problem, LanguageConfig, ExecutionResult, Difficulty } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/types';
import { toast } from '@/hooks/use-toast';

const difficultyVariant: Record<Difficulty, 'easy' | 'medium' | 'hard'> = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
};

export default function ProblemEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<LanguageConfig>(() => {
    // default depends on problem type if available later
    return SUPPORTED_LANGUAGES[0];
  });
  const [consoleOutput, setConsoleOutput] = useState('');
  const [consoleError, setConsoleError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [copied, setCopied] = useState(false);
  
  const { checkRateLimit, recordAttempt, getRemainingAttempts, getCooldownRemaining, isInCooldown } = useRateLimit();
  const { notes, setNotes, saveNotes, saving: notesSaving, lastSaved } = useNotes(problem?.id);
  const { isProblemBookmarked, toggleProblemBookmark } = useBookmarks();

  useEffect(() => {
    async function loadProblem() {
      if (!slug) return;
      
      await storageService.initialize();
      const result = await storageService.getDriver().getProblemBySlug(slug);
      
      if (result.data) {
        setProblem(result.data);
        const starterCode = result.data.starterCode?.[language.id] || language.defaultCode;
        setCode(starterCode);
      }
      setLoading(false);
    }
    loadProblem();
  }, [slug]);

  useEffect(() => {
    if (problem) {
      const starterCode = problem.starterCode?.[language.id] || language.defaultCode;
      setCode(starterCode);
    }
  }, [language, problem]);

  const handleRun = useCallback(async () => {
    if (!problem) return;
    
    setIsRunning(true);
    setConsoleOutput('');
    setConsoleError('');

    try {
      if ((problem as any).problemType === 'sql') {
        const firstVisible = problem.testCases.find(tc => !tc.isHidden);
        const { rows } = await runSql({
          globalSetup: (problem as any).sqlGlobalSetup || null,
          perTestSetup: (firstVisible as any)?.sqlSetup || null,
          query: code,
        });
        const out = formatRows(rows);
        setConsoleOutput(out || '');
      } else {
        const testInput = problem.testCases.find(tc => !tc.isHidden)?.input || '';
        const result: ExecutionResult = await executionService.execute({
          code,
          language,
          input: testInput,
          timeLimit: problem.constraints.timeLimit,
          memoryLimit: problem.constraints.memoryLimit,
        });

        if (result.success) {
          setConsoleOutput(result.output || 'No output');
        } else {
          setConsoleError(result.error || 'Execution failed');
        }
      }
    } catch (error) {
      setConsoleError(error instanceof Error ? error.message : 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  }, [code, language, problem]);

  const handleSubmit = useCallback(async () => {
    if (!problem) return;

    const rateLimitCheck = checkRateLimit(code);
    if (!rateLimitCheck.allowed) {
      toast({
        title: 'Rate Limited',
        description: rateLimitCheck.message,
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    setConsoleOutput('Submitting solution...\n');
    setConsoleError('');

    let passedCount = 0;
    const totalCases = problem.testCases.length;

    try {
      if ((problem as any).problemType === 'sql') {
        for (const testCase of problem.testCases) {
          // Run user's SQL
          const userRes = await runSql({
            globalSetup: (problem as any).sqlGlobalSetup || null,
            perTestSetup: (testCase as any).sqlSetup || null,
            query: code,
          });
          const actualRaw = formatRows(userRes.rows);

          // Derive expected
          let expectedRaw = testCase.expectedOutput;
          if ((testCase as any).sqlExpectedFromAuthor && (testCase as any).sqlQuery) {
            const expRes = await runSql({
              globalSetup: (problem as any).sqlGlobalSetup || null,
              perTestSetup: (testCase as any).sqlSetup || null,
              query: (testCase as any).sqlQuery,
            });
            expectedRaw = formatRows(expRes.rows);
          }

          const caseInsensitive = !!(problem as any).checker_case_insensitive;
          const norm = (s: string) => (caseInsensitive ? s.toLowerCase() : s);

          const compare = (actual: string, expected: string) => {
            const kind = (problem as any).checker_kind || 'exact';
            switch (kind) {
              case 'trim':
                return norm(actual).trim() === norm(expected).trim();
              case 'token': {
                const aT = norm(actual).trim().split(/\s+/);
                const eT = norm(expected).trim().split(/\s+/);
                if (aT.length !== eT.length) return false;
                for (let i = 0; i < aT.length; i++) if (aT[i] !== eT[i]) return false;
                return true;
              }
              case 'float_tolerance': {
                const tol = (problem as any).checker_float_tolerance ?? 1e-6;
                const aT = norm(actual).trim().split(/\s+/);
                const eT = norm(expected).trim().split(/\s+/);
                if (aT.length !== eT.length) return false;
                for (let i = 0; i < aT.length; i++) {
                  const aNum = Number(aT[i]);
                  const eNum = Number(eT[i]);
                  if (Number.isFinite(aNum) && Number.isFinite(eNum)) {
                    if (Math.abs(aNum - eNum) > tol) return false;
                  } else if (aT[i] !== eT[i]) {
                    return false;
                  }
                }
                return true;
              }
              case 'exact':
              default:
                return norm(actual) === norm(expected);
            }
          };

          if (compare(actualRaw, expectedRaw)) {
            passedCount++;
            setConsoleOutput(prev => prev + `✓ Test case ${passedCount}/${totalCases} passed\n`);
          } else {
            if (!testCase.isHidden) {
              setConsoleOutput(prev => 
                prev + `✗ Test case failed\n  Expected: ${expectedRaw.trim()}\n  Got: ${actualRaw.trim()}\n`
              );
            } else {
              setConsoleOutput(prev => prev + `✗ Hidden test case failed\n`);
            }
            break;
          }
        }
      } else {
        for (const testCase of problem.testCases) {
          const result = await executionService.execute({
            code,
            language,
            input: testCase.input,
            timeLimit: problem.constraints.timeLimit,
            memoryLimit: problem.constraints.memoryLimit,
          });

          if (result.success) {
            const actualRaw = (result.output || '');
            const expectedRaw = testCase.expectedOutput;
            const caseInsensitive = !!problem.checker_case_insensitive;
            const norm = (s: string) => (caseInsensitive ? s.toLowerCase() : s);

            const compare = (actual: string, expected: string) => {
              const kind = problem.checker_kind || 'exact';
              switch (kind) {
                case 'trim':
                  return norm(actual).trim() === norm(expected).trim();
                case 'token': {
                  const aT = norm(actual).trim().split(/\s+/);
                  const eT = norm(expected).trim().split(/\s+/);
                  if (aT.length !== eT.length) return false;
                  for (let i = 0; i < aT.length; i++) if (aT[i] !== eT[i]) return false;
                  return true;
                }
                case 'float_tolerance': {
                  const tol = problem.checker_float_tolerance ?? 1e-6;
                  const aT = norm(actual).trim().split(/\s+/);
                  const eT = norm(expected).trim().split(/\s+/);
                  if (aT.length !== eT.length) return false;
                  for (let i = 0; i < aT.length; i++) {
                    const aNum = Number(aT[i]);
                    const eNum = Number(eT[i]);
                    if (Number.isFinite(aNum) && Number.isFinite(eNum)) {
                      if (Math.abs(aNum - eNum) > tol) return false;
                    } else if (aT[i] !== eT[i]) {
                      return false;
                    }
                  }
                  return true;
                }
                case 'exact':
                default:
                  return norm(actual) === norm(expected);
              }
            };

            if (compare(actualRaw, expectedRaw)) {
              passedCount++;
              setConsoleOutput(prev => prev + `✓ Test case ${passedCount}/${totalCases} passed\n`);
            } else {
              if (!testCase.isHidden) {
                setConsoleOutput(prev => 
                  prev + `✗ Test case failed\n  Expected: ${expectedRaw.trim()}\n  Got: ${actualRaw.trim()}\n`
                );
              } else {
                setConsoleOutput(prev => prev + `✗ Hidden test case failed\n`);
              }
              break;
            }
          } else {
            setConsoleError(result.error || 'Execution failed');
            break;
          }
        }
      }

      recordAttempt(code);

      if (passedCount === totalCases) {
        setConsoleOutput(prev => prev + `\n🎉 All ${totalCases} test cases passed! Solution accepted.`);
        toast({
          title: 'Congratulations!',
          description: 'Your solution passed all test cases.',
        });
      } else {
        setConsoleOutput(prev => prev + `\n❌ ${passedCount}/${totalCases} test cases passed.`);
      }
    } catch (error) {
      setConsoleError(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsRunning(false);
    }
  }, [code, language, problem, checkRateLimit, recordAttempt]);

  const copyShareCode = () => {
    if (problem) {
      navigator.clipboard.writeText(`${window.location.origin}/share/${problem.shareCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Link copied!',
        description: 'Share this link with others.',
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!problem) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Problem not found</h2>
          <p className="text-muted-foreground mt-2">
            The problem you're looking for doesn't exist.
          </p>
          <Link to="/problems">
            <Button className="mt-4">Back to Problems</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/problems">
              <Button variant="ghost" size="icon-sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{problem.title}</h1>
                <Badge variant={difficultyVariant[problem.difficulty]}>
                  {((problem.difficulty || 'easy') as any).charAt(0).toUpperCase() + ((problem.difficulty || 'easy') as any).slice(1)}
                </Badge>
                {(problem as any).sourcePlatform && (
                  <Badge variant="secondary" className="capitalize">{(problem as any).sourcePlatform}</Badge>
                )}
                {(problem as any).externalUrl && (
                  <a
                    className="text-xs text-primary hover:underline"
                    href={(problem as any).externalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Original
                  </a>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                by {problem.creatorName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <ThumbsUp className="h-4 w-4" />
              {problem.likes}
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm"
              onClick={() => toggleProblemBookmark(problem.id)}
              className={isProblemBookmarked(problem.id) ? 'text-primary' : ''}
            >
              {isProblemBookmarked(problem.id) ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={copyShareCode}>
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Main Content - Resizable Panels */}
        <ResizablePanelGroup direction="horizontal" className="min-h-[70vh] rounded-lg border border-border">
          {/* Left Panel - Problem Description */}
          <ResizablePanel defaultSize={45} minSize={25}>
            <Card className="h-full rounded-none border-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <CardHeader className="pb-0">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="description" className="gap-1.5 text-xs sm:text-sm">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Description</span>
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="gap-1.5 text-xs sm:text-sm">
                      <Settings2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Notes</span>
                    </TabsTrigger>
                    <TabsTrigger value="discuss" className="gap-1.5 text-xs sm:text-sm">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Discuss</span>
                    </TabsTrigger>
                    <TabsTrigger value="leaderboard" className="gap-1.5 text-xs sm:text-sm">
                      <Trophy className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Leaders</span>
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="pt-4 flex-1 overflow-hidden">
                  <TabsContent value="description" className="mt-0 h-full">
                    <div className="space-y-6 h-full overflow-auto pr-2">
                      <MarkdownRenderer content={problem.content} />

                      {/* SQL specific panels removed */}

                      {/* Structured metadata blocks (removed for classic layout) */}
                      {problem.inputFormat && (
                        <div className="mt-6">
                          <h4 className="text-sm font-semibold mb-2">Input Format</h4>
                          <pre className="rounded-md bg-secondary p-3 text-sm whitespace-pre-wrap">{problem.inputFormat}</pre>
                        </div>
                      )}
                      {problem.outputFormat && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">Output Format</h4>
                          <pre className="rounded-md bg-secondary p-3 text-sm whitespace-pre-wrap">{problem.outputFormat}</pre>
                        </div>
                      )}
                      {problem.constraints && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">Constraints</h4>
                          <div className="text-sm text-foreground/90 whitespace-pre-wrap">
                            {typeof problem.constraints === 'string'
                              ? problem.constraints
                              : `Time: ${(problem.constraints as any).timeLimit ?? ''} ms\nMemory: ${(problem.constraints as any).memoryLimit ?? ''} MB`}
                          </div>
                        </div>
                      )}
                      {false && problem.tags && problem.tags.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {problem.tags.map((t) => (
                              <span key={t} className="inline-block rounded bg-secondary px-2 py-1 text-xs">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {problem.examples.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-semibold">Examples</h3>
                          {problem.examples.map((example, index) => (
                            <div key={index} className="space-y-2 rounded-lg bg-secondary/50 p-4">
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Input:</span>
                                <pre className="mt-1 font-mono text-sm">{example.input}</pre>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Output:</span>
                                <pre className="mt-1 font-mono text-sm">{example.output}</pre>
                              </div>
                              {example.explanation && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Explanation:</span>
                                  <p className="mt-1 text-sm">{example.explanation}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <h3 className="font-semibold">Constraints</h3>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{problem.constraints.timeLimit}ms</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span>{problem.constraints.memoryLimit}MB</span>
                          </div>
                        </div>
                        {problem.constraints.customConstraints && (
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {problem.constraints.customConstraints.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pb-4">
                        {problem.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0 h-full overflow-auto">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Write your personal notes for this problem in Markdown.
                        </p>
                        {user && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveNotes(notes)}
                            disabled={notesSaving}
                            className="gap-2"
                          >
                            <Save className="h-3.5 w-3.5" />
                            {notesSaving ? 'Saving...' : 'Save'}
                          </Button>
                        )}
                      </div>
                      {lastSaved && (
                        <p className="text-xs text-muted-foreground">
                          Last saved: {lastSaved.toLocaleTimeString()}
                        </p>
                      )}
                      {!user && (
                        <p className="text-xs text-amber-500">
                          Sign in to save your notes.
                        </p>
                      )}
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your notes here... (Markdown supported)"
                        className="w-full h-48 rounded-lg border border-border bg-background p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {notes && (
                        <div className="border-t border-border pt-4">
                          <h4 className="text-sm font-medium mb-2">Preview</h4>
                          <MarkdownRenderer content={notes} />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="discuss" className="mt-0 h-full overflow-auto">
                    <CommentSection problemId={problem.id} />
                  </TabsContent>

                  <TabsContent value="leaderboard" className="mt-0 h-full overflow-auto">
                    <Leaderboard problemId={problem.id} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Code Editor */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={65} minSize={30}>
                <div className="h-full">
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    language={language}
                    onLanguageChange={setLanguage}
                    languages={(problem as any)?.problemType === 'sql' ? SUPPORTED_LANGUAGES.filter(l=>l.id==='sql') : SUPPORTED_LANGUAGES.filter(l=>l.id!=='sql')}
                    height="100%"
                    className="h-full rounded-none border-0"
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={35} minSize={15}>
                <div className="h-full flex flex-col">
                  {/* Action Buttons */}
                  <div className="flex gap-3 p-3 border-b border-border bg-background">
                    <Button
                      variant="outline"
                      onClick={handleRun}
                      disabled={isRunning}
                      className="flex-1 gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Run
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isRunning || isInCooldown}
                      className="flex-1 gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {isInCooldown ? `Wait ${getCooldownRemaining()}s` : 'Submit'}
                    </Button>
                  </div>
                  
                  {/* Rate limit info */}
                  {getRemainingAttempts() < 2 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{getRemainingAttempts()} submission{getRemainingAttempts() !== 1 ? 's' : ''} remaining this minute</span>
                    </div>
                  )}

                  {/* Console */}
                  <div className="flex-1 overflow-hidden">
                    <ConsoleOutput
                      output={consoleOutput}
                      error={consoleError}
                      isRunning={isRunning}
                      onClear={() => {
                        setConsoleOutput('');
                        setConsoleError('');
                      }}
                      className="h-full rounded-none border-0"
                    />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
}
