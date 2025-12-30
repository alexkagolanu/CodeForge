/**
 * Console Output Component
 */

import React from 'react';
import { Terminal, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConsoleOutputProps {
  output: string;
  error?: string;
  isRunning?: boolean;
  className?: string;
  onClear?: () => void;
}

export function ConsoleOutput({
  output,
  error,
  isRunning,
  className,
  onClear,
}: ConsoleOutputProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-border bg-card overflow-hidden',
        isExpanded && 'fixed inset-4 z-50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Console</span>
          {isRunning && (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 animate-pulse rounded-full bg-warning" />
              <span className="text-xs text-muted-foreground">Running...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          {onClear && (
            <Button variant="ghost" size="icon-sm" onClick={onClear}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Output */}
      <div
        className={cn(
          'flex-1 overflow-auto p-4 font-mono text-sm min-h-0',
          isExpanded && 'h-[calc(100%-40px)]'
        )}
      >
        {error ? (
          <pre className="whitespace-pre-wrap text-destructive">{error}</pre>
        ) : output ? (
          <pre className="whitespace-pre-wrap text-foreground">{output}</pre>
        ) : (
          <p className="text-muted-foreground italic">
            Run your code to see output here...
          </p>
        )}
      </div>
    </div>
  );
}
