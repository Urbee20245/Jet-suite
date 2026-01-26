import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../integrations/supabase/client';
import { AdminPanel } from '../tools/AdminPanel';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface AdminProps {
  navigate: (path: string) => void;
}

export default function Admin({ navigate }: AdminProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        navigate('/');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/');
        return;
      }

      // Admin email authorization
      const adminEmails = [
        'theivsightcompany@gmail.com',
      ];

      const isAdmin = adminEmails.includes(user.email || '');

      if (!isAdmin) {
        navigate('/app');
        return;
      }

      setIsAuthorized(true);
      setLoading(false);

    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/app');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-blue-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">JetSuite Admin</h1>
                <p className="text-blue-100 text-sm">Administrative Control Panel</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm font-medium transition-colors"
            >
              Back to App
            </button>
          </div>
        </div>
      </div>

      {/* Admin Panel Content */}
      <AdminPanel />
    </div>
  );
}