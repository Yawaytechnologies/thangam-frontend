import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useLogout } from '../../hooks/useAuth';
import { useUnreadCount } from '../../hooks/useNotifications';
import { useGlobalSearch } from '../../hooks/useSearch';
import type { SearchHit } from '../../api/search.api';

const navItems = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Add Member',
    to: '/admin/add-member',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3M12 7a4 4 0 11-8 0 4 4 0 018 0zM6 14a6 6 0 00-6 6h12a6 6 0 00-6-6z" />
      </svg>
    ),
  },
  {
    label: 'Branch Members',
    to: '/admin/branch-members',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Properties',
    to: '/admin/properties',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: 'Book Property',
    to: '/admin/bookings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Billing',
    to: '/admin/billing',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Notifications',
    to: '/admin/notifications',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    badge: true,
  },
  {
    label: 'Profile',
    to: '/admin/profile',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const AdminLayout: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const { data: unreadData } = useUnreadCount();
  const { data: searchData, isLoading: searchLoading } = useGlobalSearch(searchQuery.trim());
  const unreadCount = unreadData?.count ?? 0;

  const handleLogout = () => {
    logout.mutate(undefined);
  };

  const adminName = user?.admin?.fullName ?? user?.email ?? 'Admin';
  const branchName = user?.admin?.branch?.name ?? 'Branch';
  const searchResults: SearchHit[] = searchData
    ? [
        ...searchData.members,
        ...searchData.properties,
        ...searchData.bookings,
        ...searchData.billings,
        ...searchData.branches,
        ...searchData.admins,
      ].slice(0, 6)
    : [];
  const showSearchResults = searchFocused && searchQuery.trim().length >= 2;

  const handleSearchResult = (result: SearchHit) => {
    const routeByType: Partial<Record<SearchHit['type'], string>> = {
      member: '/admin/members',
      property: '/admin/properties',
      booking: '/admin/bookings',
      billing: '/admin/billing',
      branch: '/admin/branch-members',
      admin: '/admin/profile',
    };

    setSearchFocused(false);
    navigate(routeByType[result.type] ?? '/admin/dashboard');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 h-16">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-amber-50 ring-1 ring-gold/20">
            <img
              src="/STH-Gold-Finish-Logo-2-300x292.png"
              alt="Sri Thangam Housing"
              className="h-8 w-8 object-contain"
            />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Sri Thangam</p>
              <p className="text-xs text-gray-500 truncate">{branchName}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 border-l-4 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-1 ${
                  isActive
                    ? 'bg-gold/15 text-navy font-semibold border-gold'
                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <span className="flex-shrink-0 relative">
                {item.icon}
                {item.badge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Profile */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-left">
            <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-navy font-semibold text-sm">
                {adminName.charAt(0).toUpperCase()}
              </span>
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{adminName}</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-1"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="relative w-full max-w-sm">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
              placeholder="Search members or properties..."
              className="h-9 w-full rounded-xl border border-amber-100 bg-amber-50/70 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-500 outline-none transition focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20"
            />
            {showSearchResults && (
              <div className="absolute left-0 top-11 z-20 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                ) : searchResults.length ? (
                  <div className="max-h-72 overflow-y-auto py-1">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSearchResult(result)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-gray-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-gray-900">{result.label}</span>
                          {result.sublabel && (
                            <span className="block truncate text-xs text-gray-500">{result.sublabel}</span>
                          )}
                        </span>
                        <span className="shrink-0 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
                )}
              </div>
            )}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => navigate('/admin/notifications')}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            aria-label="Notifications"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h11zm0 0v1a3 3 0 1 1-6 0v-1h6z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/admin/profile')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-sm font-semibold text-navy ring-1 ring-gold/30 transition hover:bg-gold/30"
            aria-label="Profile"
          >
            {adminName.charAt(0).toUpperCase()}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
