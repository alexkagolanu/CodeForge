/**
 * Main Application Component
 * Handles routing and global providers
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Page imports
import Home from "./pages/Home";
import AuthCallback from "./pages/AuthCallback";
import Problems from "./pages/Problems";
import ProblemEditor from "./pages/ProblemEditor";
import CreateProblem from "./pages/CreateProblem";
import CreateAlgoProblem from './pages/CreateAlgoProblem';
import CreateSqlProblem from './pages/CreateSqlProblem';
import Lists from "./pages/Lists";
import ListDetail from "./pages/ListDetail";
import CreateList from "./pages/CreateList";
import Profile from "./pages/Profile";
import ProfileSettings from "./pages/ProfileSettings";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Bookmarks from "./pages/Bookmarks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const RootDecider = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/home" replace /> : <Navigate to="/auth" replace />;
};

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/auth" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Root redirect based on auth */}
              <Route path="/" element={<RootDecider />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
              <Route path="/problems" element={<RequireAuth><Problems /></RequireAuth>} />
              <Route path="/problem/:slug" element={<RequireAuth><ProblemEditor /></RequireAuth>} />

              <Route path="/create" element={<RequireAuth><CreateProblem /></RequireAuth>} />
              <Route path="/create/algo" element={<RequireAuth><CreateAlgoProblem /></RequireAuth>} />
              <Route path="/create/sql" element={<RequireAuth><CreateSqlProblem /></RequireAuth>} />
              <Route path="/lists" element={<RequireAuth><Lists /></RequireAuth>} />
              <Route path="/lists/create" element={<RequireAuth><CreateList /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/profile/settings" element={<RequireAuth><ProfileSettings /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/bookmarks" element={<RequireAuth><Bookmarks /></RequireAuth>} />

              {/* Share Routes (protect if necessary) */}
              <Route path="/share/:code" element={<RequireAuth><ProblemEditor /></RequireAuth>} />
              <Route path="/list/:code" element={<RequireAuth><ListDetail /></RequireAuth>} />
              
              {/* Catch-all */}
              <Route path="*" element={<RootDecider />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
