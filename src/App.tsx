import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (session) {
      // 3 minutes = 180000 ms
      timeoutRef.current = setTimeout(() => {
        logout();
      }, 180000);
    }
  }, [session, logout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    if (session) {
      events.forEach(e => window.addEventListener(e, handleActivity));
      resetTimer();
    }

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [session, resetTimer]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Cargando entorno seguro...
      </div>
    );
  }

  return (
    <div className="app-container">
      {!session ? <Login /> : <Dashboard />}
    </div>
  );
}

export default App;
