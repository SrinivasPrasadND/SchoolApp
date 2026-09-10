import { useState } from 'react';
import { RotateCcw, LogOut, User as UserIcon } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { useResetDemoDataMutation } from '@/services/api/endpoints';
import { ROLE_LABELS } from '@/constants';
import { useToast } from '@/hooks/useToast';
import { storage } from '@/services/storage/persistence';
import { STORAGE_KEYS } from '@/constants';

export function SettingsPage() {
  const { user, role } = useAuth();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [resetData, { isLoading }] = useResetDemoDataMutation();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = async () => {
    try {
      await resetData().unwrap();
      // Clear persisted mock DB so a fresh seed is rebuilt on reload.
      storage.remove(STORAGE_KEYS.db);
      toast('Demo data reset. Reloading…', 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast('Failed to reset demo data.', 'error');
    } finally {
      setConfirmReset(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and demo data" />

      <section className="card mb-4 p-5" aria-label="Profile">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <UserIcon className="h-4 w-4" aria-hidden /> Profile
        </h2>
        <div className="flex items-center gap-4">
          <Avatar name={user?.name ?? 'User'} color={user?.avatarColor} size="lg" />
          <div>
            <p className="font-semibold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="text-xs text-slate-400">{role && ROLE_LABELS[role]}</p>
          </div>
        </div>
      </section>

      <section className="card mb-4 p-5" aria-label="Demo data">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Demo Data</h2>
        <p className="mb-4 text-sm text-slate-500">
          Reset all mock data (fees, attendance, leaves, notes, payments) back to the original seeded
          state. This affects only your browser.
        </p>
        <Button variant="secondary" onClick={() => setConfirmReset(true)}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Reset demo data
        </Button>
      </section>

      <section className="card p-5" aria-label="Session">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Session</h2>
        <p className="mb-4 text-sm text-slate-500">Sign out of your current session on this device.</p>
        <Button variant="danger" onClick={() => dispatch(logout())}>
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </Button>
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        message="This will restore all mock data to its original state and reload the app. Any changes you made will be lost."
        confirmLabel="Reset"
        tone="danger"
        loading={isLoading}
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
