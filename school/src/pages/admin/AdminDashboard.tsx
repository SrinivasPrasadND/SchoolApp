import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Users,
  GraduationCap,
  Wallet,
  AlertCircle,
  TrendingUp,
  CalendarCheck,
  ClipboardCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { CardsSkeleton } from '@/components/feedback/Loading';
import { ErrorState } from '@/components/feedback/States';
import { PaymentStatusBadge } from '@/components/common/StatusBadge';
import { useGetAdminDashboardQuery } from '@/services/api/endpoints';
import { CHART_COLORS } from '@/constants';
import { formatCurrency, formatDate, percentage } from '@/utils';

export function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useGetAdminDashboardQuery();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="School-wide operational and financial overview" />
        <CardsSkeleton count={4} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  const { fees } = data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="School-wide operational and financial overview"
      />

      {/* Financial summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Fees Expected"
          value={formatCurrency(fees.expected)}
          icon={<Wallet className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Fees Collected"
          value={formatCurrency(fees.collected)}
          hint={`${fees.collectionPercentage}% collection rate`}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(fees.outstanding)}
          icon={<AlertCircle className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(fees.overdue)}
          icon={<AlertCircle className="h-5 w-5" />}
          tone="danger"
        />
      </div>

      {/* Operational summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Students" value={data.totalStudents} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Staff" value={data.totalStaff} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Classes" value={data.totalClasses} icon={<ClipboardCheck className="h-5 w-5" />} />
        <StatCard
          label="Attendance Today"
          value={`${data.studentAttendanceToday}%`}
          icon={<CalendarCheck className="h-5 w-5" />}
          tone="success"
        />
        <StatCard label="Staff On Leave" value={data.staffOnLeaveToday} tone="warning" />
        <StatCard label="Pending Actions" value={data.pendingApprovals} tone="danger" />
      </div>

      {/* Collection status pills */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Fully Paid Students" value={data.fees.fullyPaidStudents} tone="success" />
        <StatCard label="Partially Paid" value={data.fees.partiallyPaidStudents} tone="warning" />
        <StatCard label="Unpaid Students" value={data.fees.unpaidStudents} tone="danger" />
      </div>

      {/* Charts */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Monthly Fee Collection Trend"
          description="Collected vs expected per month"
          summary={`Monthly collection ranges around ${formatCurrency(
            data.monthlyCollection[0]?.collected ?? 0,
          )}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthlyCollection} margin={{ left: -10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="collected" stroke={CHART_COLORS[0]} strokeWidth={2} name="Collected" />
              <Line type="monotone" dataKey="expected" stroke={CHART_COLORS[2]} strokeWidth={2} name="Expected" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Fee Collection by Class"
          description="Collected and outstanding amounts"
          summary="Bar chart of collected versus outstanding fees per class."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.collectionByClass} margin={{ left: -10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="className" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="collected" fill={CHART_COLORS[1]} name="Collected" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outstanding" fill={CHART_COLORS[3]} name="Outstanding" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Collection by Fee Category"
          summary="Bar chart of collected amounts grouped by fee category."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.collectionByCategory} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="amount" fill={CHART_COLORS[4]} name="Collected" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Paid vs Pending"
          summary={`Collected ${formatCurrency(fees.collected)} of ${formatCurrency(fees.expected)}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.paidVsPending}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                label={(e) => `${e.name}: ${percentage(e.value, fees.expected)}%`}
              >
                {data.paidVsPending.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? CHART_COLORS[1] : CHART_COLORS[2]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Upcoming + recent */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-4 sm:p-5" aria-label="Upcoming fee due dates">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Upcoming Fee Due Dates</h3>
          {data.upcomingDueDates.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming due dates.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.upcomingDueDates.map((d) => (
                <li key={d.name} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{d.name}</p>
                    <p className="text-xs text-slate-400">Due {formatDate(d.dueDate)}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(d.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4 sm:p-5" aria-label="Recent payments">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent Payment Transactions</h3>
          {data.recentPayments.length === 0 ? (
            <p className="text-sm text-slate-400">No recent payments.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.reference}</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(p.date)} · {p.method}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-success-600">
                      {formatCurrency(p.amount)}
                    </span>
                    <PaymentStatusBadge status="paid" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
