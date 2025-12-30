/**
 * Create List Page - Create problem collections
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical, Globe, Lock, Save } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { storageService } from '@/services/storage/StorageService';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  title: string;
  description: string;
  problems: { problemId: string; order: number }[];
}

export default function CreateListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isSequential, setIsSequential] = useState(false);
  const [sections, setSections] = useState<Section[]>([
    { id: '1', title: 'Getting Started', description: '', problems: [] }
  ]);
  const [saving, setSaving] = useState(false);

  const addSection = () => {
    setSections([...sections, {
      id: Date.now().toString(),
      title: `Section ${sections.length + 1}`,
      description: '',
      problems: [],
    }]);
  };

  const removeSection = (id: string) => {
    if (sections.length === 1) {
      toast({ title: 'Cannot remove', description: 'At least one section is required.', variant: 'destructive' });
      return;
    }
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to create a list.', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a title for your list.', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      await storageService.initialize();
      const creatorName = (user.user_metadata && (user.user_metadata.username || user.user_metadata.full_name)) || user.email || 'You';
      const payload = {
        title: title.trim(),
        description: description.trim(),
        creatorId: user.id,
        creatorName,
        visibility,
        isSequential,
        sections: sections.map((s, i) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          problems: s.problems,
          order: i,
        })),
      } as const;

      const result = await storageService.getDriver().createList(payload as any);
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to create list');
      }

      toast({ title: 'List created!', description: 'Your problem list has been created.' });
      navigate('/lists');
    } catch (error) {
      console.error('Error creating list:', error);
      toast({ title: 'Error', description: 'Failed to create list. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Sign in to create lists</h2>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Problem List</h1>
          <p className="text-muted-foreground mt-1">
            Organize problems into a curated collection
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>List Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Interview Prep 101"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this list is about..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibility</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={visibility === 'public' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVisibility('public')}
                      className="gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Public
                    </Button>
                    <Button
                      type="button"
                      variant={visibility === 'private' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVisibility('private')}
                      className="gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Private
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Mode</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={!isSequential ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsSequential(false)}
                    >
                      Free Order
                    </Button>
                    <Button
                      type="button"
                      variant={isSequential ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsSequential(true)}
                    >
                      Sequential
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isSequential 
                      ? 'Users must solve problems in order'
                      : 'Users can solve problems in any order'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sections</CardTitle>
                <CardDescription>Organize problems into sections</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSection} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Section
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="rounded-lg border border-border p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      placeholder="Section title"
                      className="flex-1 bg-transparent border-none focus:outline-none font-medium"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeSection(section.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <input
                    type="text"
                    value={section.description}
                    onChange={(e) => updateSection(section.id, { description: e.target.value })}
                    placeholder="Section description (optional)"
                    className="w-full text-sm bg-transparent border-none focus:outline-none text-muted-foreground"
                  />
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    {section.problems.length} problems • Add problems after creating the list
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/lists')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Creating...' : 'Create List'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
