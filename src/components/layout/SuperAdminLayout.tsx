import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useNotificationSocket } from '../../hooks/useSocket';
import { useUnreadCount } from '../../hooks/useNotifications';
import { useLogout } from '../../hooks/useAuth';
import { useGlobalSearch } from '../../hooks/useSearch';
import type { SearchHit } from '../../api/search.api';
import SthGoldLogo from '../../assets/STH-Gold-Finish-Logo.png';

const navLinks = [
  {
    to: '/super-admin/dashboard',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    to: '/super-admin/members',
    label: 'Members',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
  {
    to: '/super-admin/branches',
    label: 'Create Branches',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    to: '/super-admin/admins',
    label: 'Create Admin',
    icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  },
  {
    to: '/super-admin/properties',
    label: 'Create Properties',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  },
  {
    to: '/super-admin/bookings',
    label: 'Book Property',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    to: '/super-admin/billing',
    label: 'Billing',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    to: '/super-admin/notifications',
    label: 'Notifications',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
];

export function SuperAdminLayout() {
  useNotificationSocket();

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });

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
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);

    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allHits: SearchHit[] = searchResults
    ? [
        ...(searchResults.branches ?? []),
        ...(searchResults.admins ?? []),
        ...(searchResults.members ?? []),
        ...(searchResults.properties ?? []),
        ...(searchResults.bookings ?? []),
        ...(searchResults.billings ?? []),
      ]
    : [];

  function handleHitClick(hit: SearchHit) {
    setSearchOpen(false);
    setSearchQuery('');

    const routeMap: Record<SearchHit['type'], string> = {
      branch: '/super-admin/branches',
      admin: '/super-admin/admins',
      member: '/super-admin/members',
      property: '/super-admin/properties',
      booking: '/super-admin/bookings',
      billing: '/super-admin/billing',
    };

    navigate(routeMap[hit.type]);
  }

  function closeSidebarOnMobile() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }

  const displayName =
    user?.member?.fullName ??
    user?.admin?.fullName ??
    user?.email ??
    user?.phone ??
    'Super Admin';

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-navy transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? 'translate-x-0 lg:w-64'
            : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
      >
        {/* Logo */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-white/10 transition-all duration-300 ${
            sidebarOpen ? 'justify-start gap-3 px-5' : 'justify-center px-2'
          }`}
        >
          <img
            src={SthGoldLogo}
            alt="Sri Thangam Housing"
            className={`shrink-0 object-contain transition-all duration-300 ${
              sidebarOpen ? 'h-11 w-11' : 'h-9 w-9'
            }`}
          />

          {sidebarOpen && (
            <div className="min-w-0">
              <p className="whitespace-nowrap text-sm font-bold leading-tight text-white">
                Sri Thangam
              </p>
              <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-gold">
                Housing
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeSidebarOnMobile}
                title={!sidebarOpen ? link.label : undefined}
                className={({ isActive }) =>
                  `group relative flex h-11 items-center rounded-xl text-sm transition-all duration-200 ${
                    sidebarOpen
                      ? 'justify-start gap-3 px-3'
                      : 'justify-center px-0'
                  } ${
                    isActive
                      ? 'bg-gold text-navy font-bold shadow-[0_8px_18px_rgba(201,162,39,0.22)]'
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.7}
                    d={link.icon}
                  />
                </svg>

                {sidebarOpen && (
                  <span className="truncate whitespace-nowrap">
                    {link.label}
                  </span>
                )}

                {!sidebarOpen && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-navy-mid px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 lg:block">
                    {link.label}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom User + Logout */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => {
              navigate('/super-admin/profile');
              closeSidebarOnMobile();
            }}
            className={`flex w-full items-center rounded-xl transition-all duration-200 hover:bg-white/10 ${
              sidebarOpen
                ? 'gap-3 px-2 py-2.5 text-left'
                : 'justify-center px-0 py-2.5'
            }`}
            title={!sidebarOpen ? displayName : undefined}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-navy shadow-sm"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))',
              }}
            >
              {initials}
            </div>

            {sidebarOpen && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {displayName}
                </p>
                <p className="text-xs text-gray-400">Super Admin</p>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => logoutMutation.mutate(undefined)}
            className={`mt-1 flex h-10 w-full items-center rounded-xl text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300 ${
              sidebarOpen
                ? 'justify-start gap-3 px-2'
                : 'justify-center px-0'
            }`}
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <svg
              className="h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>

            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>

        {/* System Status */}
        <div className="shrink-0 border-t border-white/10 px-4 py-3">
          <div
            className={`flex items-center ${
              sidebarOpen ? 'justify-start gap-2' : 'justify-center'
            }`}
            title={!sidebarOpen ? 'System Status: Online' : undefined}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.75)]" />

            {sidebarOpen && (
              <span className="whitespace-nowrap text-xs text-gray-400">
                System Status:{' '}
                <span className="font-semibold text-green-400">Online</span>
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div
        className={`flex min-h-screen flex-1 flex-col overflow-hidden transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}
      >
        {/* Header */}
        <header className="relative z-10 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-4 lg:px-6">
          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Desktop Title */}
          <div className="ml-4 hidden min-w-[220px] lg:block">
            <h1 className="text-lg font-extrabold tracking-wide text-gold">
              Super Admin Panel
            </h1>
          </div>

          {/* Desktop Center Search */}
          <div
            ref={searchRef}
            className="absolute left-1/2 top-1/2 hidden w-[420px] -translate-x-1/2 -translate-y-1/2 lg:block"
          >
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search members, properties..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            {searchOpen && searchQuery.length >= 2 && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {allHits.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    No results found
                  </p>
                ) : (
                  allHits.map((hit) => (
                    <button
                      key={`${hit.type}-${hit.id}`}
                      type="button"
                      onClick={() => handleHitClick(hit)}
                      className="w-full border-b border-gray-100 px-4 py-2.5 text-left last:border-0 hover:bg-gray-50"
                    >
                      <span className="mr-2 text-xs font-medium uppercase text-gold">
                        {hit.type}
                      </span>

                      <span className="text-sm text-gray-800">
                        {hit.label}
                      </span>

                      {hit.sublabel && (
                        <span className="ml-1 text-xs text-gray-500">
                          — {hit.sublabel}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-2 lg:gap-3">
            {/* Desktop Notification */}
            <button
              type="button"
              onClick={() => navigate('/super-admin/notifications')}
              className="relative hidden rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:flex"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-xs font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-gray-100"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-navy"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))',
                  }}
                >
                  {initials}
                </div>

                <svg
                  className="hidden h-4 w-4 text-gray-500 lg:block"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/super-admin/profile');
                      setProfileOpen(false);
                    }}
                    className="w-full rounded-t-lg px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    View Profile
                  </button>

                  <hr className="border-gray-100" />

                  <button
                    type="button"
                    onClick={() => {
                      logoutMutation.mutate(undefined);
                      setProfileOpen(false);
                    }}
                    className="w-full rounded-b-lg px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SuperAdminLayout;