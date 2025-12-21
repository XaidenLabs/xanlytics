import { Server, HardDrive, Clock, Activity, TrendingUp, Wifi } from 'lucide-react';
import MapWrapper from '@/components/dashboard/MapWrapper';

interface StatsResponse {
  overview: {
    totalNodes: number;
    onlineNodes: number;
    offlineNodes: number;
    uptimePercent: number;
    totalStorageTb: string;
    usedStorageTb: string;
    avgStorageUsagePercent: number;
    avgUptimeDays: number;
    maxUptimeDays: number;
  };
  versions: { version: string; count: number }[];
  sync: {
    lastSyncAt: string | null;
    status: string;
    durationMs: number;
  };
}

async function getStats(): Promise<StatsResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stats`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'text-[var(--color-primary)]'
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}) {
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg bg-[var(--color-surface-elevated)] ${color}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-semibold mono tabular-nums">{value}</p>
          {subValue && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function VersionDistribution({ versions }: { versions: { version: string; count: number }[] }) {
  const total = versions.reduce((sum, v) => sum + v.count, 0);

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
        Version Distribution
      </h3>
      <div className="space-y-3">
        {versions.map((v) => {
          const percent = total > 0 ? (v.count / total) * 100 : 0;
          return (
            <div key={v.version}>
              <div className="flex justify-between text-sm mb-1">
                <span className="mono">v{v.version}</span>
                <span className="text-[var(--color-text-muted)]">{v.count} nodes</span>
              </div>
              <div className="h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary)] rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SyncStatus({ sync }: { sync: StatsResponse['sync'] }) {
  const lastSync = sync.lastSyncAt ? new Date(sync.lastSyncAt) : null;
  const statusColor = sync.status === 'success' ? 'status-online' : sync.status === 'error' ? 'status-offline' : 'status-syncing';

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
        Sync Status
      </h3>
      <div className="flex items-center gap-3 mb-3">
        <span className={`status-dot status-dot-${sync.status === 'success' ? 'online' : sync.status === 'error' ? 'offline' : 'syncing'}`} />
        <span className={`text-sm capitalize ${statusColor}`}>{sync.status}</span>
      </div>
      {lastSync && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Last sync</span>
            <span className="mono">{lastSync.toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Duration</span>
            <span className="mono">{sync.durationMs}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="container py-8">
        <div className="card text-center py-12">
          <Activity size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
          <p className="text-[var(--color-text-muted)] mb-4">
            Run a sync to populate the database with node data.
          </p>
          <a href="/api/cron/sync" className="btn btn-primary">
            Trigger Sync
          </a>
        </div>
      </div>
    );
  }

  const { overview, versions, sync } = stats;

  return (
    <div className="container py-8">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Network Overview</h1>
        <p className="page-description">
          Real-time analytics for {overview.totalNodes} pNodes
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Server}
          label="Total Nodes"
          value={overview.totalNodes}
          subValue={`${overview.onlineNodes} online`}
          color="text-[var(--color-primary)]"
        />
        <StatCard
          icon={Wifi}
          label="Uptime"
          value={`${overview.uptimePercent}%`}
          subValue="Network availability"
          color="text-[var(--color-success)]"
        />
        <StatCard
          icon={HardDrive}
          label="Storage"
          value={`${overview.totalStorageTb} TB`}
          subValue={`${overview.avgStorageUsagePercent}% used avg`}
          color="text-[var(--color-warning)]"
        />
        <StatCard
          icon={Clock}
          label="Avg Uptime"
          value={`${overview.avgUptimeDays}d`}
          subValue={`Max: ${overview.maxUptimeDays}d`}
          color="text-purple-400"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Online Nodes"
          value={overview.onlineNodes}
          color="text-[var(--color-success)]"
        />
        <StatCard
          icon={Activity}
          label="Offline Nodes"
          value={overview.offlineNodes}
          color="text-[var(--color-danger)]"
        />
        <StatCard
          icon={HardDrive}
          label="Used Storage"
          value={`${overview.usedStorageTb} TB`}
          color="text-[var(--color-warning)]"
        />
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        <VersionDistribution versions={versions} />
        <SyncStatus sync={sync} />
      </div>

      {/* Network Map */}
      <MapWrapper />
    </div>
  );
}
