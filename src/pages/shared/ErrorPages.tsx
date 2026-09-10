import { Link } from 'react-router-dom';
import { ShieldX, FileQuestion } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_HOME } from '@/constants';

function ErrorLayout({
  icon,
  code,
  title,
  message,
}: {
  icon: React.ReactNode;
  code: string;
  title: string;
  message: string;
}) {
  const { role, isAuthenticated } = useAuth();
  const home = isAuthenticated && role ? ROLE_HOME[role] : '/login';
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-card">
        {icon}
      </div>
      <p className="text-sm font-semibold text-brand-600">{code}</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">{message}</p>
      <div className="mt-6 flex gap-3">
        <Link to={home}>
          <Button>Back to dashboard</Button>
        </Link>
        <Link to="/login">
          <Button variant="secondary">Go to login</Button>
        </Link>
      </div>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <ErrorLayout
      icon={<ShieldX className="h-8 w-8 text-danger-600" aria-hidden />}
      code="403"
      title="Access denied"
      message="You don't have permission to view this page with your current role."
    />
  );
}

export function NotFoundPage() {
  return (
    <ErrorLayout
      icon={<FileQuestion className="h-8 w-8 text-slate-500" aria-hidden />}
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist or may have been moved."
    />
  );
}
