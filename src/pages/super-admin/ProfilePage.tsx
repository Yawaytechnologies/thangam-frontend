import React from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useLogout } from '../../hooks/useAuth';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: 'Branch Admin',
  DIRECTOR: 'Director',
  EXECUTIVE_DIRECTOR: 'Executive Director',
  DEPUTY_DIRECTOR: 'Deputy Director',
  SENIOR_MANAGER: 'Senior Manager',
  BUSINESS_MANAGER: 'Business Manager',
  AGENT: 'Agent',
};

const SuperAdminProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const logout = useLogout();

  const displayName = user?.member?.fullName ?? user?.admin?.fullName ?? user?.email ?? user?.phone ?? 'Super Admin';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-24" style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-navy-mid))' }} />

        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4 flex items-end gap-4">
            <div
              className="w-20 h-20 rounded-full border-4 border-white shadow-sm flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))' }}
            >
              <span className="text-2xl font-bold text-navy">{initial}</span>
            </div>
            <div className="mb-1">
              <p className="text-xl font-bold text-gray-900">{displayName}</p>
              <p className="text-sm text-gray-500">{ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? 'Super Administrator'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              ['Email', user?.email ?? '—'],
              ['Phone', user?.phone ?? '—'],
              ['Role', ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—'],
              ['Status', user?.status ?? '—'],
            ].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
                <p className="text-sm text-gray-900 font-medium">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {logout.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
};

export default SuperAdminProfilePage;
