// src/layouts/ProtectedLayout.tsx
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) return null;

  // ❌ belum login → tampilkan area hitam saja
  if (!session) {
    return <div className="flex-1 bg-black" />;
  }

  // ✅ sudah login → render halaman
  return <Outlet />;
}
