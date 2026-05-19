import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const home =
    user?.role === 'SUPER_ADMIN' ? '/super-admin/dashboard'
    : user?.role === 'ADMIN'     ? '/admin/dashboard'
    : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="text-center max-w-md">
        <p className="text-gold text-6xl font-black mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-8">
          The page you're looking for doesn't exist or you don't have access to it.
        </p>
        <button
          onClick={() => navigate(home)}
          className="px-6 py-3 rounded-lg text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))' }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
