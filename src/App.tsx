import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from './stores/auth.store';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getApiError } from './lib/api-error';

import LoginPage from './pages/auth/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

import { SuperAdminLayout } from './components/layout/SuperAdminLayout';
import SuperAdminDashboardPage from './pages/super-admin/SuperAdminDashboardPage';
import MembersPage from './pages/super-admin/MembersPage';
import BranchesPage from './pages/super-admin/BranchesPage';
import AdminsPage from './pages/super-admin/AdminsPage';
import SuperAdminPropertiesPage from './pages/super-admin/SuperAdminPropertiesPage';
import SuperAdminBookingsPage from './pages/super-admin/BookingsPage';
import SuperAdminBillingPage from './pages/super-admin/BillingPage';
import SuperAdminNotificationsPage from './pages/super-admin/NotificationsPage';
import SuperAdminProfilePage from './pages/super-admin/ProfilePage';

import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AddMemberPage from './pages/admin/AddMemberPage';
import MembersListPage from './pages/admin/MembersListPage';
import AdminPropertiesPage from './pages/admin/PropertiesPage';
import AdminBookingsPage from './pages/admin/BookingsPage';
import AdminReferralsPage from './pages/admin/ReferralsPage';
import AdminBillingPage from './pages/admin/BillingPage';
import AdminNotificationsPage from './pages/admin/NotificationsPage';
import AdminProfilePage from './pages/admin/ProfilePage';
import BranchMembersPage from './pages/admin/BranchMembersPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { getRoleHome } from './lib/role-home';
import DirectorLayout from './components/layout/DirectorLayout';
import DirectorDashboardPage from './pages/director/DirectorDashboardPage';
import DirectorTeamPage from './pages/director/DirectorTeamPage';
import DirectorNotificationsPage from './pages/director/DirectorNotificationsPage';
import DirectorMemberDetailsPage from './pages/director/DirectorMemberDetailsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
  // Global query error handler — only fires when there's no cached data to show
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) {
        // Background refetch failed — show non-intrusive toast
        toast.error(`Failed to refresh: ${getApiError(error)}`, { id: 'bg-refetch' });
      }
    },
  }),
  // Global mutation error handler — always notify on mutation failure
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(getApiError(error));
    },
  }),
});

function AppRoutes() {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/super-admin/dashboard"      element={<SuperAdminDashboardPage />} />
          <Route path="/super-admin/members"        element={<MembersPage />} />
          <Route path="/super-admin/branches"       element={<BranchesPage />} />
          <Route path="/super-admin/admins"         element={<AdminsPage />} />
          <Route path="/super-admin/properties"     element={<SuperAdminPropertiesPage />} />
          <Route path="/super-admin/bookings"       element={<SuperAdminBookingsPage />} />
          <Route path="/super-admin/billing"        element={<SuperAdminBillingPage />} />
          <Route path="/super-admin/notifications"  element={<SuperAdminNotificationsPage />} />
          <Route path="/super-admin/profile"        element={<SuperAdminProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard"     element={<AdminDashboardPage />} />
          <Route path="/admin/add-member"    element={<AddMemberPage />} />
          <Route path="/admin/members"       element={<MembersListPage />} />
          <Route path="/admin/properties"    element={<AdminPropertiesPage />} />
          <Route path="/admin/bookings"      element={<AdminBookingsPage />} />
          <Route path="/admin/referrals"     element={<AdminReferralsPage />} />
          <Route path="/admin/billing"       element={<AdminBillingPage />} />
          <Route path="/admin/notifications"   element={<AdminNotificationsPage />} />
          <Route path="/admin/profile"         element={<AdminProfilePage />} />
          <Route path="/admin/branch-members"  element={<BranchMembersPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['DIRECTOR']} />}>
        <Route element={<DirectorLayout />}>
          <Route path="/director/dashboard" element={<DirectorDashboardPage />} />
          <Route path="/director/team" element={<DirectorTeamPage />} />
          <Route path="/director/notifications" element={<DirectorNotificationsPage />} />
          <Route path="/director/team/:memberId" element={<DirectorMemberDetailsPage />} />
        </Route>
      </Route>

      <Route
        path="/"
        element={
          user
            ? <Navigate to={getRoleHome(user.role)} replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { fontSize: '14px', maxWidth: '420px' },
              error: { duration: 6000 },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
