import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useLogout } from '../../hooks/useAuth';
import { useUnreadCount } from '../../hooks/useNotifications';
import { useNotificationSocket } from '../../hooks/useSocket';

const navigation = [
  { label: 'Dashboard', to: '/director/dashboard', icon: LayoutDashboard },
  { label: 'My Team', to: '/director/team', icon: UsersRound },
  { label: 'Notifications', to: '/director/notifications', icon: Bell, badge: true },
  { label: 'Profile', to: '/director/profile', icon: UserRound },
  { label: 'Change Password', to: '/director/change-password', icon: KeyRound },
];

function formatRole(role?: string) {
  if (!role) return 'Director';
  return role
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function DirectorLayout() {
  useNotificationSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const location = useLocation();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;
  const member = user?.member;
  const directorName = member?.fullName ?? user?.email ?? user?.phone ?? 'Director';
  const branchName = member?.branch?.name ?? 'Sri Thangam Housing';

  const closeSidebar = () => setSidebarOpen(false);

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-amber-50 ring-1 ring-gold/20">
          <img
            src="/STH-Gold-Finish-Logo-2-300x292.png"
            alt="Sri Thangam Housing"
            className="h-9 w-9 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">Sri Thangam</p>
          <p className="truncate text-xs text-gray-500">{branchName}</p>
        </div>
        <button
          type="button"
          onClick={closeSidebar}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-gray-100 px-4 py-4">
        <p className="truncate text-sm font-bold text-gray-900">{directorName}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {member?.memberId ?? 'Member'} · {formatRole(user?.role)}
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4" aria-label="Director navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isCurrent =
            location.pathname === item.to ||
            (item.to === '/director/team' && location.pathname.startsWith('/director/team/'));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={() =>
                `relative flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold/40 ${
                  isCurrent
                    ? 'border-gold bg-gold/15 font-semibold text-navy'
                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <span className="relative flex-shrink-0">
                <Icon className="h-5 w-5" />
                {item.badge && unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-5 w-5" />
          {logout.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden flex-shrink-0 lg:block">{sidebar}</div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={closeSidebar}
            aria-label="Close navigation backdrop"
          />
          <div className="relative h-full shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">Director Portal</p>
            <p className="truncate text-xs text-gray-500">{branchName}</p>
          </div>
          <div className="flex-1" />
          <NavLink
            to="/director/notifications"
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </NavLink>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-navy">
            {directorName.charAt(0).toUpperCase()}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
