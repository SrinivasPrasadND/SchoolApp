import { useAppSelector } from '@/app/hooks';

/** Returns the currently authenticated user (or null) and role helpers. */
export function useAuth() {
  const session = useAppSelector((s) => s.auth.session);
  const user = session?.user ?? null;
  return {
    user,
    isAuthenticated: !!session,
    role: user?.role ?? null,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    isParent: user?.role === 'parent',
    isStudent: user?.role === 'student',
  };
}
