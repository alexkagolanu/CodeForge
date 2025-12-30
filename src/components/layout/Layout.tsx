/**
 * Main Layout Component with Navigation
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Code2, 
  LayoutDashboard, 
  BookOpen, 
  Plus, 
  User, 
  Settings, 
  Sun, 
  Moon,
  Menu,
  X,
  Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/home', label: 'Home', icon: LayoutDashboard },
  { path: '/problems', label: 'Problems', icon: Code2 },
  { path: '/lists', label: 'Lists', icon: BookOpen },
  { path: '/create', label: 'Create', icon: Plus },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Code2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              Code<span className="gradient-text">Forge</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-2',
                      isActive && 'bg-secondary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <Link to="/bookmarks" className="hidden sm:block">
              <Button variant="ghost" size="icon-sm" className="rounded-full">
                <Bookmark className="h-4 w-4" />
              </Button>
            </Link>

            <Link to="/profile" className="hidden sm:block">
              <Button variant="ghost" size="icon-sm" className="rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </Link>

            <Link to="/settings" className="hidden sm:block">
              <Button variant="ghost" size="icon-sm" className="rounded-full">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-background md:hidden animate-fade-in">
            <nav className="container mx-auto flex flex-col gap-1 p-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              <div className="mt-2 flex gap-2 border-t border-border pt-2">
                <Link to="/bookmarks" className="flex-1">
                  <Button variant="ghost" className="w-full gap-2">
                    <Bookmark className="h-4 w-4" />
                    Bookmarks
                  </Button>
                </Link>
                <Link to="/profile" className="flex-1">
                  <Button variant="ghost" className="w-full gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
