import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Menu, MoreHorizontal, X } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { useLogoutMutation } from '@/services/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME, ROLE_LABELS } from '@/constants';
import { cn } from '@/utils';
import { Avatar } from '@/components/common/Avatar';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { ChildSelector } from '@/components/navigation/ChildSelector';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { mobileNavFor, type NavItem } from '@/components/navigation/navConfig';
import { useToast } from '@/hooks/useToast';

interface AppShellProps {
  nav: NavItem[];
  sectionLabel: string;
}

export function AppShell({ nav, sectionLabel }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutMutation();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Even if the mock call fails, clear the local session.
    }
    dispatch(logout());
    toast('You have been signed out.', 'info');
    navigate('/login', { replace: true });
  };

  const mobileItems = role ? mobileNavFor(role) : nav.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
          <GraduationCap className="h-7 w-7 text-brand-600" aria-hidden />
          <div className="leading-tight">
            <span className="block text-sm font-semibold text-slate-900">{APP_NAME}</span>
            <span className="block text-xs text-slate-400">{sectionLabel}</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
          {nav.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile slide-in menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileMenuOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl animate-fade-in">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-brand-600" aria-hidden />
                <span className="text-sm font-semibold text-slate-900">{APP_NAME}</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="p-1">
                <X className="h-5 w-5 text-slate-500" aria-hidden />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Mobile navigation">
              {nav.map((item) => (
                <SidebarLink key={item.to} item={item} onClick={() => setMobileMenuOpen(false)} />
              ))}
            </nav>
            <div className="border-t border-slate-100 p-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" aria-hidden /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <span className="text-sm font-medium text-slate-500 sm:hidden">{sectionLabel}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ChildSelector />
            <NotificationBell />
            <div className="flex items-center gap-2">
              <Avatar name={user?.name ?? 'User'} color={user?.avatarColor} size="sm" />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-400">{role && ROLE_LABELS[role]}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:pb-10" id="main-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-slate-200 bg-white/95 py-1.5 backdrop-blur lg:hidden"
        aria-label="Bottom navigation"
      >
        {mobileItems.map((item) => (
          <BottomLink key={item.to} item={item} />
        ))}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-1 text-slate-500"
          aria-label="More options"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </div>
  );
}

function SidebarLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {item.label}
    </NavLink>
  );
}

function BottomLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-0.5 py-1',
          isActive ? 'text-brand-600' : 'text-slate-500',
        )
      }
    >
      <Icon className="h-5 w-5" aria-hidden />
      <span className="text-[10px] font-medium">{item.label}</span>
    </NavLink>
  );
}
