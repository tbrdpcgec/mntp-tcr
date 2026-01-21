import {
  FaHome,
  FaChartBar,
  FaEdit,
  FaCalendarAlt,
  FaFileAlt,
  FaCogs,
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HiArchiveBox } from 'react-icons/hi2';
import { GiHotMeal } from 'react-icons/gi';
import { FaPlaneDeparture } from 'react-icons/fa';
import { RiMailSendLine } from 'react-icons/ri';

const menuItems = [
  { label: 'Home', icon: <FaHome />, path: '/' },
  { label: 'Dashboard', icon: <FaChartBar />, path: '/dashboard' },
  { label: 'Input Data', icon: <FaEdit />, path: '/input' },
  { label: 'Daily Menu', icon: <GiHotMeal />, path: null },
  { label: 'Daily Report', icon: <FaFileAlt />, path: null },
  { label: 'ABMP', icon: <FaPlaneDeparture />, path: '/abmp' },
  { label: 'SP', icon: <RiMailSendLine />, path: '/spaja' },
];

const dailyReportSubmenu = [
  { label: 'TCR-1 Sheetmetal', path: '/daily-report/w301' },
  { label: 'TCR-2 Composite', path: '/daily-report/w302' },
  { label: 'TCR-3 Seat', path: '/daily-report/w304' },
  { label: 'TCR-4 Cabin', path: '/daily-report/w305' },
  { label: 'TCR-5 Machining', path: '/daily-report/w303' },
];

const dailyMenuSubmenu = [
  { label: 'TCR Structure & Cabin', path: '/daily-menu/ws1' },
  { label: 'TCR Archived', path: '/archived' },
];

export default function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const location = useLocation();
  const [isReportExpanded, setIsReportExpanded] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const { email } = useAuth();

  // =============================
  // ACCESS CONFIG
  // =============================

  const DEFAULT_ALLOWED_MENUS = ['Home', 'Dashboard'];

  const FULL_ACCESS = [
    'Home',
    'Dashboard',
    'Daily Report',
    'Daily Menu',
    'Input Data',
    'ABMP',
    'SP',
  ];

  const allowedMenus: Record<string, string[]> = {
    'pujialiminxii2@gmail.com': FULL_ACCESS,
    'zz@gmail.com': FULL_ACCESS,


    'tcr910@gmail.com': ['Home', 'Dashboard', 'Daily Menu', 'Input Data', 'ABMP', 'SP'],
    'tcr5@gmail.com': ['Home', 'Dashboard', 'Input Data', 'Daily Report'],
    'tcr1@gmail.com': ['Home', 'Dashboard', 'Daily Report'],
    'tcr2@gmail.com': ['Home', 'Dashboard', 'Daily Report'],
    'tcr3@gmail.com': ['Home', 'Dashboard', 'Daily Report'],
    'tcr4@gmail.com': ['Home', 'Dashboard', 'Daily Report'],
  };

  const FULL_SUBMENU_ACCESS = {
    'Daily Report': dailyReportSubmenu.map((s) => s.label),
    'Daily Menu': dailyMenuSubmenu.map((s) => s.label),
  };

  const allowedSubmenus: Record<string, Record<string, string[]>> = {
    'tbr1dashboardQ@gmail.com': FULL_SUBMENU_ACCESS,

    'tcr1@gmail.com': {
      'Daily Report': ['TCR-1 Sheetmetal'],
    },
    'tcr2@gmail.com': {
      'Daily Report': ['TCR-2 Composite'],
    },
    'tcr3@gmail.com': {
      'Daily Report': ['TCR-3 Seat'],
    },
    'tcr4@gmail.com': {
      'Daily Report': ['TCR-4 Cabin'],
    },
    'tcr5@gmail.com': {
      'Daily Report': ['TCR-5 Machining'],
    },
  };

  // Filter menu utama
  const userAllowedMenus = allowedMenus[email] ?? DEFAULT_ALLOWED_MENUS;

  const userAllowedSubmenus = allowedSubmenus[email] ?? {};

  const filteredMenuItems = menuItems.filter((item) =>
    userAllowedMenus.includes(item.label)
  );

  const filterSubmenu = (
    menuLabel: string,
    submenu: { label: string; path: string }[]
  ) => {
    const allowed = userAllowedSubmenus[menuLabel];

    // kalau user tidak punya rule → tampilkan semua
    if (!allowed) return submenu;

    return submenu.filter((sub) => allowed.includes(sub.label));
  };

  return (
    <div
      className={`
        ${isCollapsed ? 'w-0 overflow-hidden p-0' : 'w-44 p-2'}
        bg-gradient-to-t from-[#292929] to-[#212121]
        text-white h-screen space-y-2 fixed
        transition-all duration-300 overflow-y-auto text-sm  
      `}
    >
      {!isCollapsed && (
        <div className="flex flex-col items-center">
          <img src="/homes.png" alt="App Logo" className="w-150 h-15" />
        </div>
      )}

      <ul className="space-y-1">
        {filteredMenuItems.map((item) => (
          <li key={item.label}>
            {/* Dropdown menu check */}
            {item.label === 'Daily Report' || item.label === 'Daily Menu' ? (
              <div
                onClick={() =>
                  item.label === 'Daily Report'
                    ? setIsReportExpanded(!isReportExpanded)
                    : setIsMenuExpanded(!isMenuExpanded)
                }
                className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-[#00707A] text-[#f0f0f0] transition-colors duration-200"
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span>{item.label}</span>
                    <span className="ml-auto text-sm">
                      {(
                        item.label === 'Daily Report'
                          ? isReportExpanded
                          : isMenuExpanded
                      )
                        ? '▾'
                        : '▸'}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <Link
                to={item.path!}
                className={`flex items-center gap-2 px-2 py-2 rounded hover:bg-[#00707A] transition-colors duration-200 ${
                  location.pathname === item.path ? 'bg-[#00636B]' : ''
                } text-[#f0f0f0]`}
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )}

            {/* Daily Report Submenu */}
            {!isCollapsed &&
              item.label === 'Daily Report' &&
              isReportExpanded && (
                <ul className="ml-6 mt-1 space-y-1 text-xs">
                  {filterSubmenu('Daily Report', dailyReportSubmenu).length >
                  0 ? (
                    filterSubmenu('Daily Report', dailyReportSubmenu).map(
                      (sub) => (
                        <li key={sub.label}>
                          <Link
                            to={sub.path}
                            className={`block px-2 py-1 rounded hover:bg-[#00707A] ${
                              location.pathname === sub.path
                                ? 'bg-[#00636B]'
                                : ''
                            }`}
                          >
                            {sub.label}
                          </Link>
                        </li>
                      )
                    )
                  ) : (
                    <li className="px-2 py-1 text-gray-400 italic">
                      No access
                    </li>
                  )}
                </ul>
              )}

            {/* Daily Menu Submenu */}
            {!isCollapsed && item.label === 'Daily Menu' && isMenuExpanded && (
              <ul className="ml-6 mt-1 space-y-1 text-xs">
                {filterSubmenu('Daily Menu', dailyMenuSubmenu).length > 0 ? (
                  filterSubmenu('Daily Menu', dailyMenuSubmenu).map((sub) => (
                    <li key={sub.label}>
                      <Link
                        to={sub.path}
                        className={`block px-2 py-1 rounded hover:bg-[#00707A] ${
                          location.pathname === sub.path ? 'bg-[#00636B]' : ''
                        }`}
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="px-2 py-1 text-gray-400 italic">No access</li>
                )}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {/* Version Info di pojok kiri bawah */}
      {!isCollapsed && (
        <div className="absolute bottom-6 left-2 text-xs text-[#f0f0f0]">
          Version PA.1.4.0
        </div>
      )}
    </div>
  );
}
