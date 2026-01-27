// src/layouts/MainLayout.tsx
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';

import { FaBars, FaUserCircle } from 'react-icons/fa';
import { MdLogout } from 'react-icons/md';
import { GiHotMeal } from 'react-icons/gi';
import { useMemo } from 'react';

import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayName = userEmail ? userEmail.split('@')[0] : '';

  const today = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  /* =============================
     LOGOUT
  ============================= */
  const handleLogout = async () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    await supabase.auth.signOut();
    setSession(null);
    setUserEmail(null);
    navigate('/login');
  };

  /* =============================
     IDLE TIMER
  ============================= */
  const resetIdleTimer = () => {
    if (!session) return;

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      handleLogout();
    }, 30 * 60 * 1000); // 30 menit
  };

  /* =============================
     SESSION CHECK (1x)
  ============================= */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUserEmail(data.session?.user.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUserEmail(session?.user.email ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* =============================
     USER ACTIVITY LISTENER
  ============================= */
  useEffect(() => {
    if (!session) return;

    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
    ];

    events.forEach((event) => window.addEventListener(event, resetIdleTimer));

    resetIdleTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [session]);

  /* =============================
     HEADER TITLE
  ============================= */
  const getTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard Structure & Cabin Workshop - TCR';
      case '/input':
        return 'Input Data';

      case '/daily-menu/bush4':
        return (
          <span className="flex items-center space-x-2">
            <GiHotMeal className="w-5 h-5 text-white" />
            <span>Daily Menu TBR BUSH4</span>
          </span>
        );

      case '/daily-menu/ws1':
        return (
          <span className="flex items-center space-x-2">
            <GiHotMeal className="w-5 h-5 text-white" />
            <span>Daily Menu TCR</span>
          </span>
        );

      case '/archived':
        return 'Archived';

      case '/daily-report':
        return 'Daily Report';

      case '/daily-report/w301':
        return 'Daily Report Sheetmetal TCR-1';

      case '/daily-report/w302':
        return 'Daily Report Composite TCR-2';

      case '/daily-report/w305':
        return 'Daily Report Cabin Shop TCR-4';

      case '/daily-report/w304':
        return 'Daily Report Seat Shop TCR-3';

      case '/daily-report/w303':
        return 'Daily Report Machining TCR-5';

      case '/abmp':
        return 'ABMP';

      case '/spaja':
        return 'SP-AJA';

      default:
        return 'Home';
    }
  };

  /* =============================
     RENDER
  ============================= */
  return (
    <div className="flex">
      <Sidebar isCollapsed={isCollapsed} />

      <div
        className={`transition-all duration-300 w-full ${
          isCollapsed ? 'ml-0' : 'ml-44'
        }`}
      >
        {/* HEADER */}
        {/* HEADER */}
        {/* HEADER */}
        <div className="flex items-center justify-between bg-[#00838f] px-4 py-2 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsCollapsed(!isCollapsed)}>
              <FaBars className="text-white" />
            </button>
            <h1 className="text-white font-semibold">{getTitle()}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* DATE */}
            <div className="text-xs text-white opacity-90">{today}</div>

            {session ? (
              <>
                {/* USER */}
                <div className="flex items-center gap-2 text-sm text-white">
                  <FaUserCircle />
                  <span>{displayName}</span>
                </div>

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-white text-[#212121] px-2 py-1 rounded text-xs hover:bg-red-600 hover:text-white transition"
                >
                  <MdLogout />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              /* LOGIN */
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-black px-3 py-1 text-xs rounded"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
