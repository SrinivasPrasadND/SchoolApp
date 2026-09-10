import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_HOME } from '@/constants';
import type { UserRole } from '@/types';

/** Requires an authenticated session; otherwise redirects to login. */
export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/** Requires the user's role to be within the allowed set. */
export function RequireRole({ allow }: { allow: UserRole[] }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}

/** Prevents authenticated users from viewing guest-only pages (e.g. login). */
export function GuestOnlyRoute() {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated && role) {
    return <Navigate to={ROLE_HOME[role]} replace />;
  }
  return <Outlet />;
}
