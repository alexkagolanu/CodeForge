/**
 * Create Problem Page
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  FileJson,
  FileText,
  Upload,
  Wand2,
  X,
  Info
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storageService } from '@/services/storage/StorageService';
import { parseTestCases, SAMPLE_JSON_FORMAT, SAMPLE_TEXT_FORMAT } from '@/utils/testCaseParser';
import type { Problem, Difficulty, TestCase, ProblemExample } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

const popularTags = [
  'Array', 'Hash Table', 'String', 'Dynamic Programming',
  'Math', 'Sorting', 'Greedy', 'Binary Search', 'Tree', 'Graph',
  'Linked List', 'Recursion', 'Stack', 'Queue', 'Two Pointers'
];

interface FormData {
  // Source metadata
  sourcePlatform?: 'codeforces' | 'codechef' | 'leetcode' | 'aoc' | 'custom';
  externalUrl?: string;
  sourceId?: string;
  rating?: number;
  editorialUrl?: string;
  // Checker
  checker_kind?: 'exact' | 'trim' | 'token' | 'float_tolerance';
  checker_case_insensitive?: boolean;
  checker_float_tolerance?: number;
  title: string;
  description: string;
  content: string;
  difficulty: Difficulty;
  tags: string[];
  examples: ProblemExample[];
  testCases: TestCase[];
  inputFormat: string;
  outputFormat: string;
  timeLimit: number;
  memoryLimit: number;
  customConstraints: string;
  hasTimeLimit: boolean;
  timeLimitMinutes: number;
  visibility: 'public' | 'private';
}

const initialFormData: FormData = {
  title: '',
  description: '',
  content: `# Problem Title

Write your problem description here using Markdown.

You can use **bold**, *italic*, and \`code\` formatting.

## Mathematical Expressions

Use LaTeX for math: $x^2 + y^2 = z^2$

Block equations:

$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$
`,
  difficulty: 'easy',
  tags: [],
  examples: [{ input: '', output: '', explanation: '' }],
  testCases: [{ id: '1', input: '', expectedOutput: '', isHidden: false }],
  inputFormat: '',
  outputFormat: '',
  timeLimit: 1000,
  memoryLimit: 256,
  customConstraints: '',
  hasTimeLimit: false,
  timeLimitMinutes: 30,
  visibility: 'public',
};

export default function CreateProblem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [showTestCaseImport, setShowTestCaseImport] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [testCaseInput, setTestCaseInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !formData.tags.includes(customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, customTag.trim()],
      }));
      setCustomTag('');
    }
  };

  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, { input: '', output: '', explanation: '' }],
    }));
  };

  const updateExample = (index: number, field: keyof ProblemExample, value: string) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      ),
    }));
  };

  const removeExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        { id: Date.now().toString(), input: '', expectedOutput: '', isHidden: false },
      ],
    }));
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      ),
    }));
  };

  const removeTestCase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  const handleTestCaseFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTestCaseInput(content);
      setShowTestCaseImport(true);
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTestCaseImport = () => {
    const result = parseTestCases(testCaseInput);
    
    if (result.error) {
      toast({
        title: 'Import failed',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }

    if (result.testCases.length === 0) {
      toast({
        title: 'No test cases found',
        description: 'The file does not contain valid test cases.',
        variant: 'destructive',
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      testCases: result.testCases,
    }));
    setShowTestCaseImport(false);
    setTestCaseInput('');
    toast({
      title: 'Test cases imported',
      description: `Successfully imported ${result.testCases.length} test case${result.testCases.length > 1 ? 's' : ''}.`,
    });
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setFormData(prev => ({
        ...prev,
        ...parsed,
        examples: parsed.examples || prev.examples,
        testCases: parsed.testCases || prev.testCases,
        tags: parsed.tags || prev.tags,
      }));
      setShowJsonImport(false);
      setJsonInput('');
      toast({
        title: 'Import successful',
        description: 'Problem data has been imported from JSON.',
      });
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'Please check your JSON format and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a problem title.', variant: 'destructive' });
      return;
    }
    if (!formData.content.trim()) {
      toast({ title: 'Content required', description: 'Please enter problem content.', variant: 'destructive' });
      return;
    }
    if (formData.testCases.length === 0) {
      toast({ title: 'Test cases required', description: 'Please add at least one test case.', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      await storageService.initialize();
      
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const problemData: Omit<Problem, 'id' | 'createdAt' | 'updatedAt' | 'shareCode'> = {
        title: formData.title,
        slug,
        description: formData.description || formData.title,
        content: formData.content,
        difficulty: formData.difficulty,
        tags: formData.tags,
        examples: formData.examples.filter(ex => ex.input || ex.output),
        constraints: {
          timeLimit: formData.timeLimit,
          memoryLimit: formData.memoryLimit,
          customConstraints: formData.customConstraints.split('\n').filter(c => c.trim()),
        },
        inputFormat: formData.inputFormat,
        outputFormat: formData.outputFormat,
        testCases: formData.testCases,
        starterCode: {},
        visibility: formData.visibility,
        creatorId: 'user',
        creatorName: 'You',
        likes: 0,
        submissions: 0,
        acceptanceRate: 0,
        timeLimit: formData.hasTimeLimit ? formData.timeLimitMinutes : undefined,
      };

      const result = await storageService.getDriver().createProblem(problemData);

      if (result.data) {
        toast({
          title: 'Problem created!',
          description: 'Your problem has been saved successfully.',
        });
        navigate(`/problem/${slug}`);
      } else {
        throw new Error(result.error || 'Failed to create problem');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create problem',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const jsonFormat = `{
  "title": "Problem Title",
  "description": "Short description",
  "content": "# Full markdown content...",
  "difficulty": "easy|medium|hard",
  "tags": ["Array", "Hash Table"],
  "examples": [
    { "input": "...", "output": "...", "explanation": "..." }
  ],
  "testCases": [
    { "id": "1", "input": "...", "expectedOutput": "...", "isHidden": false }
  ],
  "inputFormat": "...",
  "outputFormat": "...",
  "timeLimit": 1000,
  "memoryLimit": 256,
  "customConstraints": "constraint1\\nconstraint2"
}`;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Create Problem</h1>
            <p className="text-muted-foreground mt-1">
              Create a new coding challenge for others to solve
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowJsonImport(!showJsonImport)}
              className="gap-2"
            >
              <FileJson className="h-4 w-4" />
              Import JSON
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Problem'}
            </Button>
          </div>
        </div>

        {/* JSON Import Modal */}
        {showJsonImport && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Import from JSON
                <Button variant="ghost" size="icon-sm" onClick={() => setShowJsonImport(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Paste your JSON data to import problem details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Optional: SQL Global Setup */}
              <div>
                <label className="text-sm font-medium mb-2 block">SQL Global Setup (executed before each test)</label>
                <textarea
                  value={(formData as any).sqlGlobalSetup || ''}
                  onChange={(e) => updateField('sqlGlobalSetup' as any, e.target.value)}
                  placeholder="CREATE TABLE ..., INSERT ..., etc."
                  className="w-full h-24 rounded-lg border border-border bg-background p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Expected Format:</p>
                <pre className="text-xs overflow-auto">{jsonFormat}</pre>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON here..."
                className="w-full h-48 rounded-lg border border-border bg-background p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={handleJsonImport} className="gap-2">
                <Wand2 className="h-4 w-4" />
                Import
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Problem Type & SQL (moved to top) */}
        <Card>
          <CardHeader>
            <CardTitle>Problem Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={(formData as any).problemType === 'algorithm' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateField('problemType' as any, 'algorithm' as any)}
              >
                Algorithm
              </Button>
              <Button
                type="button"
                variant={(formData as any).problemType === 'sql' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateField('problemType' as any, 'sql' as any)}
              >
                SQL
              </Button>
            </div>

            {(formData as any).problemType === 'sql' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Preview rows per table (SQL)</label>
                  <input
                    type="number"
                    value={(formData as any).sqlPreviewRows || 5}
                    onChange={(e) => updateField('sqlPreviewRows' as any, Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-32 rounded-md border border-border bg-background px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Group ID (for sub-problems grouping)</label>
                  <input
                    type="text"
                    value={(formData as any).groupId || ''}
                    onChange={(e) => updateField('groupId' as any, e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">SQL Global Setup (runs before each test)</label>
                  <textarea
                    value={(formData as any).sqlGlobalSetup || ''}
                    onChange={(e) => updateField('sqlGlobalSetup' as any, e.target.value)}
                    placeholder="CREATE TABLE ..., INSERT ..., etc."
                    className="w-full h-24 rounded-lg border border-border bg-background p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* CSV to INSERT Helper */}
                <CsvToInsertHelper
                  onAppendGlobal={(sql) => updateField('sqlGlobalSetup' as any, (((formData as any).sqlGlobalSetup || '') + '\n' + sql).trim())}
                  onAppendPerTest={(index, sql) => updateTestCase(index, 'sqlSetup' as any, ((((formData.testCases[index] as any).sqlSetup) || '') + '\n' + sql).trim())}
                  testCases={formData.testCases}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Two Sum"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Short Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="A brief one-line description"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty *</label>
                <div className="flex gap-2">
                  {difficulties.map((diff) => (
                    <Button
                      key={diff}
                      type="button"
                      variant={formData.difficulty === diff ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateField('difficulty', diff)}
                      className={cn(
                        formData.difficulty === diff && diff === 'easy' && 'bg-success hover:bg-success/90',
                        formData.difficulty === diff && diff === 'medium' && 'bg-warning hover:bg-warning/90',
                        formData.difficulty === diff && diff === 'hard' && 'bg-destructive hover:bg-destructive/90'
                      )}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Visibility</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.visibility === 'public' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateField('visibility', 'public')}
                  >
                    Public
                  </Button>
                  <Button
                    type="button"
                    variant={formData.visibility === 'private' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateField('visibility', 'private')}
                  >
                    Private
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {popularTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={formData.tags.includes(tag) ? 'default' : 'secondary'}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Add custom tag"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Problem Content */}
        <Card>
          <CardHeader>
            <CardTitle>Problem Content</CardTitle>
            <CardDescription>
              Write the full problem description in Markdown with LaTeX support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'edit' | 'preview')}>
              <TabsList className="mb-4">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="edit">
                <textarea
                  value={formData.content}
                  onChange={(e) => updateField('content', e.target.value)}
                  placeholder="Write your problem content in Markdown..."
                  className="w-full h-80 rounded-lg border border-border bg-background p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </TabsContent>
              
              <TabsContent value="preview">
                <div className="min-h-80 rounded-lg border border-border p-4 overflow-auto">
                  <MarkdownRenderer content={formData.content} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Examples */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Examples</CardTitle>
              <CardDescription>Add examples to help users understand the problem</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addExample}>
              <Plus className="h-4 w-4 mr-1" />
              Add Example
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.examples.map((example, index) => (
              <div key={index} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Example {index + 1}</span>
                  {formData.examples.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeExample(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Input</label>
                    <textarea
                      value={example.input}
                      onChange={(e) => updateExample(index, 'input', e.target.value)}
                      className="w-full h-20 mt-1 rounded-md border border-border bg-background p-2 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Output</label>
                    <textarea
                      value={example.output}
                      onChange={(e) => updateExample(index, 'output', e.target.value)}
                      className="w-full h-20 mt-1 rounded-md border border-border bg-background p-2 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Explanation (optional)</label>
                  <input
                    type="text"
                    value={example.explanation || ''}
                    onChange={(e) => updateExample(index, 'explanation', e.target.value)}
                    className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Test Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Test Cases *</CardTitle>
              <CardDescription>Define test cases for validating submissions</CardDescription>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleTestCaseFileUpload}
                accept=".json,.txt,.text"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTestCaseImport(true)}
                className="gap-1"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addTestCase}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          
          {/* Test Case Import Section */}
          {showTestCaseImport && (
            <CardContent className="border-b border-border pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Import Test Cases</h4>
                  <Button variant="ghost" size="icon-sm" onClick={() => setShowTestCaseImport(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <Tabs defaultValue="json" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="json" className="flex-1 gap-1">
                      <FileJson className="h-3.5 w-3.5" />
                      JSON Format
                    </TabsTrigger>
                    <TabsTrigger value="text" className="flex-1 gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Text Format
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="json" className="mt-4 space-y-3">
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                        <Info className="h-3.5 w-3.5" />
                        JSON Format (supports C-style escapes like \", \\, \n)
                      </div>
                      <pre className="text-xs overflow-auto max-h-32">{SAMPLE_JSON_FORMAT}</pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="text" className="mt-4 space-y-3">
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                        <Info className="h-3.5 w-3.5" />
                        Text Format (structured or simple delimiter)
                      </div>
                      <pre className="text-xs overflow-auto max-h-32">{SAMPLE_TEXT_FORMAT}</pre>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload File
                    </Button>
                    <span className="text-xs text-muted-foreground self-center">or paste content below</span>
                  </div>
                  <textarea
                    value={testCaseInput}
                    onChange={(e) => setTestCaseInput(e.target.value)}
                    placeholder="Paste your test cases here (JSON or text format)..."
                    className="w-full h-40 rounded-lg border border-border bg-background p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <Button onClick={handleTestCaseImport} className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  Import Test Cases
                </Button>
              </div>
            </CardContent>
          )}
          
          <CardContent className={cn("space-y-4", showTestCaseImport && "pt-6")}>
            {formData.testCases.map((testCase, index) => (
              <div key={testCase.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Test Case {index + 1}</span>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={testCase.isHidden}
                        onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                        className="rounded border-border"
                      />
                      Hidden
                    </label>
                  </div>
                  {formData.testCases.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeTestCase(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Input</label>
                    <textarea
                      value={testCase.input}
                      onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                      className="w-full h-20 mt-1 rounded-md border border-border bg-background p-2 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="mt-2">
                      <label className="text-xs text-muted-foreground">SQL Setup (per test)</label>
                      <textarea
                        value={(testCase as any).sqlSetup || ''}
                        onChange={(e) => updateTestCase(index, 'sqlSetup' as any, e.target.value)}
                        className="w-full h-16 mt-1 rounded-md border border-border bg-background p-2 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Expected Output</label>
                    <textarea
                      value={testCase.expectedOutput}
                      onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                      className="w-full h-20 mt-1 rounded-md border border-border bg-background p-2 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="mt-2 grid sm:grid-cols-2 gap-2">
                      <label className="text-xs text-muted-foreground flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(testCase as any).sqlExpectedFromAuthor || false}
                          onChange={(e) => updateTestCase(index, 'sqlExpectedFromAuthor' as any, e.target.checked)}
                        />
                        Derive expected from author SQL
                      </label>
                      {(testCase as any).sqlExpectedFromAuthor && (
                        <input
                          type="text"
                          value={(testCase as any).sqlQuery || ''}
                          onChange={(e) => updateTestCase(index, 'sqlQuery' as any, e.target.value)}
                          placeholder="Author verification SQL"
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Constraints */}
        <Card>
          <CardHeader>
            <CardTitle>Constraints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Time Limit (ms)</label>
                <input
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) => updateField('timeLimit', parseInt(e.target.value) || 1000)}
                  min={100}
                  max={10000}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Memory Limit (MB)</label>
                <input
                  type="number"
                  value={formData.memoryLimit}
                  onChange={(e) => updateField('memoryLimit', parseInt(e.target.value) || 256)}
                  min={16}
                  max={1024}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Custom Constraints (one per line)</label>
              <textarea
                value={formData.customConstraints}
                onChange={(e) => updateField('customConstraints', e.target.value)}
                placeholder="1 <= n <= 10^5&#10;-10^9 <= nums[i] <= 10^9"
                className="w-full h-24 rounded-lg border border-border bg-background p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hasTimeLimit}
                  onChange={(e) => updateField('hasTimeLimit', e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm">Enable overall time limit for the test</span>
              </label>
              {formData.hasTimeLimit && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.timeLimitMinutes}
                    onChange={(e) => updateField('timeLimitMinutes', parseInt(e.target.value) || 30)}
                    min={1}
                    max={180}
                    className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => navigate('/problems')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Problem'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
