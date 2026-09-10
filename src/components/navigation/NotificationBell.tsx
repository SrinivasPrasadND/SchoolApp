import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/services/api/endpoints';
import { formatDate, cn } from '@/utils';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-3">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden /> Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <li className="p-4 text-center text-sm text-slate-400">No notifications</li>
              )}
              {notifications.map((n) => {
                const content = (
                  <div className="flex gap-2">
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        n.read ? 'bg-transparent' : 'bg-brand-500',
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{n.title}</p>
                      <p className="truncate text-xs text-slate-500">{n.message}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(n.createdAt)}</p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id} className="border-b border-slate-50 last:border-0">
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => {
                          markRead(n.id);
                          setOpen(false);
                        }}
                        className="block p-3 hover:bg-slate-50"
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        onClick={() => markRead(n.id)}
                        className="block w-full p-3 text-left hover:bg-slate-50"
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
