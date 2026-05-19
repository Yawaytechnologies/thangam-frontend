import React from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useLogout } from '../../hooks/useAuth';

const AdminProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const logout = useLogout();

  const admin = user?.admin;
  const branch = admin?.branch;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-24" />

        {/* Avatar + basic info */}
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4 flex items-end gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 border-4 border-white shadow-sm flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {(admin?.fullName ?? user?.email ?? 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="mb-1">
              <p className="text-xl font-bold text-gray-900">{admin?.fullName ?? 'Admin'}</p>
              <p className="text-sm text-gray-500">Branch Admin</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              ['Admin ID', admin?.adminId ?? '—'],
              ['Phone', admin?.phone ?? user?.phone ?? '—'],
              ['Email', admin?.email ?? user?.email ?? '—'],
              ['Status', admin?.status ?? user?.status ?? '—'],
              ['Branch', branch?.name ?? '—'],
              ['Branch Code', branch?.branchCode ?? '—'],
              ['Branch City', [branch?.city, branch?.state].filter(Boolean).join(', ') || '—'],
              ['Member Since', admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
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

export default AdminProfilePage;
