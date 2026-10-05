import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useLogout } from '../../hooks/useAuth';
import { getRoleHome } from '../../lib/role-home';

function formatRole(role?: string) {
  if (!role) return 'Member';

  return role
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function MemberLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const member = user?.member;
  const dashboardPath = user ? getRoleHome(user.role) : '/login';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-amber-50 ring-1 ring-gold/20">
            <img
              src="/STH-Gold-Finish-Logo-2-300x292.png"
              alt="Sri Thangam Housing"
              className="h-9 w-9 object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">Sri Thangam</p>
            <p className="truncate text-xs text-gray-500">Member Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <NavLink
            to={dashboardPath}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-gold bg-gold/15 font-semibold text-navy'
                  : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </NavLink>
        </nav>

        <div className="border-t border-gray-200 p-3">
          <div className="mb-2 rounded-lg px-3 py-2">
            <p className="truncate text-sm font-semibold text-gray-900">
              {member?.fullName ?? user?.email ?? user?.phone ?? 'Member'}
            </p>
            <p className="truncate text-xs text-gray-500">{formatRole(user?.role)}</p>
          </div>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            <LogOut className="h-5 w-5" />
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
