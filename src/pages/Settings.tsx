/**
 * Settings Page
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Moon, 
  Sun, 
  BookOpen, 
  Monitor,
  Save,
  RotateCcw
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'reading' | 'system';

const themes: { id: Theme; name: string; description: string; icon: React.ElementType }[] = [
  { id: 'light', name: 'Light', description: 'Clean and bright', icon: Sun },
  { id: 'dark', name: 'Dark', description: 'Easy on the eyes', icon: Moon },
  { id: 'reading', name: 'Reading', description: 'Warm sepia tones', icon: BookOpen },
  { id: 'system', name: 'System', description: 'Match your device', icon: Monitor },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorTabSize, setEditorTabSize] = useState(2);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('codeforge_settings', JSON.stringify({
      editorFontSize,
      editorTabSize,
      showLineNumbers,
      autoSave,
    }));
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated.',
    });
  };

  const handleReset = () => {
    setEditorFontSize(14);
    setEditorTabSize(2);
    setShowLineNumbers(true);
    setAutoSave(true);
    setTheme('dark');
    toast({
      title: 'Settings reset',
      description: 'All settings have been restored to defaults.',
    });
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize your CodeForge experience
          </p>
        </div>

        {/* Theme Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                    theme === t.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <t.icon className={cn(
                    'h-6 w-6',
                    theme === t.id ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className="text-sm font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.description}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editor Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Editor Preferences
            </CardTitle>
            <CardDescription>Configure your code editor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Font Size</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={editorFontSize}
                  onChange={(e) => setEditorFontSize(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-12">{editorFontSize}px</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tab Size</label>
              <div className="flex gap-2">
                {[2, 4, 8].map((size) => (
                  <Button
                    key={size}
                    variant={editorTabSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorTabSize(size)}
                  >
                    {size} spaces
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Show Line Numbers</label>
                <p className="text-xs text-muted-foreground">Display line numbers in the editor</p>
              </div>
              <button
                onClick={() => setShowLineNumbers(!showLineNumbers)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  showLineNumbers ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform',
                    showLineNumbers && 'translate-x-5'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Auto Save</label>
                <p className="text-xs text-muted-foreground">Automatically save your code</p>
              </div>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  autoSave ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform',
                    autoSave && 'translate-x-5'
                  )}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
}
