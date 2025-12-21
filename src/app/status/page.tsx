import { Activity, Server, Clock, Database, AlertCircle, CheckCircle } from 'lucide-react';

interface SyncStatusData {
    lastSyncAt: string | null;
    status: 'success' | 'error' | 'running' | 'unknown';
    durationMs: number;
    nodesCount?: number;
    errorMessage?: string;
}

interface StatsData {
    overview: {
        totalNodes: number;
        onlineNodes: number;
    };
    sync: SyncStatusData;
}

async function getStatus(): Promise<StatsData | null> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stats`,
            { cache: 'no-store' }
        );
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default async function StatusPage() {
    const data = await getStatus();

    const syncStatus = data?.sync || { status: 'unknown', lastSyncAt: null, durationMs: 0 };
    const lastSync = syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt) : null;
    const isHealthy = syncStatus.status === 'success' && data && data.overview.totalNodes > 0;

    return (
        <div className="container py-8">
            {/* Page header */}
            <div className="page-header">
                <h1 className="page-title">System Status</h1>
                <p className="page-description">
                    API health, sync status, and database connectivity
                </p>
            </div>

            {/* Overall health */}
            <div className={`card mb-6 border-2 ${isHealthy ? 'border-[var(--color-success)]' : 'border-[var(--color-warning)]'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-xl ${isHealthy ? 'bg-[var(--color-success)]/15' : 'bg-[var(--color-warning)]/15'}`}>
                        {isHealthy ? (
                            <CheckCircle size={32} className="text-[var(--color-success)]" />
                        ) : (
                            <AlertCircle size={32} className="text-[var(--color-warning)]" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold">
                            {isHealthy ? 'All Systems Operational' : 'Attention Required'}
                        </h2>
                        <p className="text-[var(--color-text-muted)]">
                            {isHealthy
                                ? 'Sync worker running, database connected, data flowing.'
                                : 'Sync worker may need attention or database is empty.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Sync Status */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity size={18} className="text-[var(--color-primary)]" />
                        <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">Sync Status</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`status-dot status-dot-${syncStatus.status === 'success' ? 'online' : syncStatus.status === 'error' ? 'offline' : 'syncing'}`} />
                        <span className={`capitalize ${syncStatus.status === 'success' ? 'text-[var(--color-success)]' : syncStatus.status === 'error' ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'}`}>
                            {syncStatus.status}
                        </span>
                    </div>
                    {lastSync && (
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Last: {lastSync.toLocaleString()}
                        </p>
                    )}
                </div>

                {/* Database */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <Database size={18} className="text-purple-400" />
                        <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">Database</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`status-dot ${data ? 'status-dot-online' : 'status-dot-offline'}`} />
                        <span className={data ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                            {data ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        {data?.overview.totalNodes || 0} nodes stored
                    </p>
                </div>

                {/* API */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <Server size={18} className="text-[var(--color-warning)]" />
                        <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">API</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="status-dot status-dot-online" />
                        <span className="text-[var(--color-success)]">Healthy</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        Response time: {syncStatus.durationMs}ms
                    </p>
                </div>
            </div>

            {/* Manual sync */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <Clock size={18} className="text-[var(--color-primary)]" />
                    <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">Manual Sync</span>
                </div>
                <p className="text-[var(--color-text-muted)] mb-4">
                    Trigger a manual sync to fetch the latest data from pRPC.
                    Make sure your pNode tunnel is active.
                </p>
                <a href="/api/cron/sync" className="btn btn-primary">
                    Trigger Sync Now
                </a>
            </div>
        </div>
    );
}
