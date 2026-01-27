// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import MainLayout from './layouts/MainLayout';
import ProtectedLayout from './layouts/ProtectedLayout';

import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

import InputData from './pages/InputData';
import DailyMenu from './pages/DailyMenu';
import DailyMenuBush4 from './pages/DailyMenuBush4';
import DailyMenuWS1 from './pages/DailyMenuWS1';

import W301 from './pages/W301';
import W302 from './pages/W302';
import W303 from './pages/W303';
import W304 from './pages/W304';
import W305 from './pages/W305';

import Abmp from './pages/Abmp';
import Spaja from './pages/Spaja';
import Archived from './pages/Archived';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* SEMUA PAGE PAKAI MAINLAYOUT */}
          <Route element={<MainLayout />}>

            {/* PUBLIC */}
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />

            {/* PROTECTED */}
            <Route element={<ProtectedLayout />}>
              <Route path="/input" element={<InputData />} />

              <Route path="/daily-menu" element={<DailyMenu />} />
              <Route path="/daily-menu/bush4" element={<DailyMenuBush4 />} />
              <Route path="/daily-menu/ws1" element={<DailyMenuWS1 />} />

              <Route path="/daily-report/w301" element={<W301 />} />
              <Route path="/daily-report/w302" element={<W302 />} />
              <Route path="/daily-report/w303" element={<W303 />} />
              <Route path="/daily-report/w304" element={<W304 />} />
              <Route path="/daily-report/w305" element={<W305 />} />

              <Route path="/abmp" element={<Abmp />} />
              <Route path="/spaja" element={<Spaja />} />
              <Route path="/archived" element={<Archived />} />
            </Route>

            {/* FALLBACK → HITAM */}
            <Route path="*" element={<div className="flex-1 bg-black" />} />

          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
