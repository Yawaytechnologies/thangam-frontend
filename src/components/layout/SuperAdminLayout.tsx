import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useNotificationSocket } from '../../hooks/useSocket';
import { useUnreadCount } from '../../hooks/useNotifications';
import { useLogout } from '../../hooks/useAuth';
import { useGlobalSearch } from '../../hooks/useSearch';
import type { SearchHit } from '../../api/search.api';

const navLinks = [
  { to: '/super-admin/dashboard',     label: 'Dashboard',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/super-admin/members',       label: 'Members',          icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { to: '/super-admin/branches',      label: 'Create Branches',  icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { to: '/super-admin/admins',        label: 'Create Admin',     icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { to: '/super-admin/properties',    label: 'Create Properties', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { to: '/super-admin/bookings',      label: 'Book Property',    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to: '/super-admin/billing',       label: 'Billing',          icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { to: '/super-admin/notifications', label: 'Notifications',    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
];

export function SuperAdminLayout() {
  useNotificationSocket();

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadCount();
  const { data: searchResults } = useGlobalSearch(searchQuery);

  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allHits: SearchHit[] = searchResults
    ? [
        ...searchResults.branches,
        ...searchResults.admins,
        ...searchResults.members,
        ...searchResults.properties,
        ...searchResults.bookings,
        ...searchResults.billings,
      ]
    : [];

  function handleHitClick(hit: SearchHit) {
    setSearchOpen(false);
    setSearchQuery('');
    const routeMap: Record<SearchHit['type'], string> = {
      branch:  '/super-admin/branches',
      admin:   '/super-admin/admins',
      member:  '/super-admin/members',
      property:'/super-admin/properties',
      booking: '/super-admin/bookings',
      billing: '/super-admin/billing',
    };
    navigate(routeMap[hit.type]);
  }

  const displayName =
    user?.member?.fullName ?? user?.admin?.fullName ?? user?.email ?? user?.phone ?? 'Super Admin';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-navy flex flex-col z-30">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))' }}
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Sri Thangam</p>
            <p className="text-gold text-xs font-semibold tracking-widest uppercase">Housing</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-gold text-navy font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
              </svg>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-navy text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{displayName}</p>
              <p className="text-gray-400 text-xs">Super Admin</p>
            </div>
          </div>
        </div>

        {/* System status */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400">System Status: <span className="text-green-400 font-medium">Online</span></span>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-20">
          {/* Global search */}
          <div ref={searchRef} className="relative w-80">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search members, properties..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
              />
            </div>
            {searchOpen && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
                {allHits.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">No results found</p>
                ) : (
                  allHits.map((hit) => (
                    <button
                      key={`${hit.type}-${hit.id}`}
                      onClick={() => handleHitClick(hit)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-gold text-xs font-medium uppercase mr-2">{hit.type}</span>
                      <span className="text-sm text-gray-800">{hit.label}</span>
                      {hit.sublabel && <span className="text-xs text-gray-500 ml-1">— {hit.sublabel}</span>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              onClick={() => navigate('/super-admin/notifications')}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-0.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-navy text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))' }}
                >
                  {initials}
                </div>
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => { navigate('/super-admin/profile'); setProfileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    View Profile
                  </button>
                  <hr className="border-gray-100" />
                  <button
                    onClick={() => { logoutMutation.mutate(undefined); setProfileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SuperAdminLayout;
