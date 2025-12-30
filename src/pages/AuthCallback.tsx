import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const hash = window.location.hash || '';

    const finish = () => {
      // Clean the URL (remove hash) and go to /home
      window.history.replaceState({}, '', '/home');
      navigate('/home', { replace: true });
    };

    // If access token is present in the hash (email confirm or oauth implicit)
    if (hash.startsWith('#access_token') || hash.includes('type=signup') || hash.includes('type=recovery')) {
      // Supabase v2 will pick up session via onAuthStateChange; ensure session initialized
      supabase.auth.getSession().finally(finish);
      return;
    }

    // If we already have a user (navigated here unnecessarily), just go home
    if (user) {
      finish();
    } else {
      // Otherwise send to auth
      window.history.replaceState({}, '', '/auth');
      navigate('/auth', { replace: true });
    }
  }, [navigate, user]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <LoadingSpinner />
        <span>Finishing sign-in…</span>
      </div>
    </div>
  );
}
