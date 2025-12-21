import Link from 'next/link';
import { ArrowLeft, Server, Clock, HardDrive, Wifi, Activity } from 'lucide-react';

interface NodeData {
    pubkey: string;
    address: string;
    version: string;
    uptime: number;
    uptimeDays: number;
    storageCommitted: number;
    storageUsed: number;
    storageUsagePercent: number;
    status: 'online' | 'syncing' | 'offline';
    lastSeen: string;
    isPublic: boolean;
    rpcPort: number;
}

interface HistoryData {
    timestamp: string;
    uptimeDays: number;
    storageUsagePercent: number;
    status: string;
}

interface NodeDetailResponse {
    node: NodeData;
    history: HistoryData[];
}

async function getNodeDetail(id: string): Promise<NodeDetailResponse | null> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/nodes/${id}`,
            { cache: 'no-store' }
        );
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

function formatBytes(bytes: number): string {
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    if (bytes < 1024 ** 4) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    return `${(bytes / 1024 ** 4).toFixed(2)} TB`;
}

function StatCard({
    icon: Icon,
    label,
    value,
    color = 'text-[var(--color-primary)]'
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color?: string;
}) {
    return (
        <div className="card">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-[var(--color-surface-elevated)] ${color}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase">{label}</p>
                    <p className="text-xl font-semibold mono">{value}</p>
                </div>
            </div>
        </div>
    );
}

export default async function NodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getNodeDetail(id);

    if (!data) {
        return (
            <div className="container py-8">
                <Link href="/nodes" className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-white mb-6">
                    <ArrowLeft size={16} />
                    Back to Nodes
                </Link>
                <div className="card text-center py-12">
                    <Server size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Node Not Found</h2>
                    <p className="text-[var(--color-text-muted)]">
                        The node with ID {id.slice(0, 16)}... could not be found.
                    </p>
                </div>
            </div>
        );
    }

    const { node, history } = data;
    const statusColor = node.status === 'online' ? 'text-[var(--color-success)]' :
        node.status === 'offline' ? 'text-[var(--color-danger)]' :
            'text-[var(--color-warning)]';

    return (
        <div className="container py-8">
            {/* Back link */}
            <Link href="/nodes" className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-white mb-6">
                <ArrowLeft size={16} />
                Back to Nodes
            </Link>

            {/* Header */}
            <div className="card mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${node.status === 'online' ? 'bg-[var(--color-success)]/15' : 'bg-[var(--color-danger)]/15'}`}>
                                <Server size={20} className={statusColor} />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">Node {node.address}</h1>
                                <p className="text-sm text-[var(--color-text-muted)] mono">{node.pubkey}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`status-dot status-dot-${node.status}`} />
                        <span className={`capitalize ${statusColor}`}>{node.status}</span>
                    </div>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon={Clock}
                    label="Uptime"
                    value={`${node.uptimeDays} days`}
                    color="text-[var(--color-success)]"
                />
                <StatCard
                    icon={HardDrive}
                    label="Storage Used"
                    value={formatBytes(node.storageUsed)}
                    color="text-[var(--color-warning)]"
                />
                <StatCard
                    icon={Activity}
                    label="Usage"
                    value={`${node.storageUsagePercent}%`}
                    color="text-purple-400"
                />
                <StatCard
                    icon={Wifi}
                    label="Version"
                    value={`v${node.version}`}
                    color="text-[var(--color-primary)]"
                />
            </div>

            {/* Details */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Node info */}
                <div className="card">
                    <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
                        Node Details
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                            <span className="text-[var(--color-text-muted)]">Address</span>
                            <span className="mono">{node.address}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                            <span className="text-[var(--color-text-muted)]">RPC Port</span>
                            <span className="mono">{node.rpcPort}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                            <span className="text-[var(--color-text-muted)]">Public</span>
                            <span>{node.isPublic ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                            <span className="text-[var(--color-text-muted)]">Committed</span>
                            <span className="mono">{formatBytes(node.storageCommitted)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-[var(--color-text-muted)]">Last Seen</span>
                            <span className="mono">{new Date(node.lastSeen).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="card">
                    <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
                        Recent History ({history.length} snapshots)
                    </h3>
                    {history.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {history.slice(-10).reverse().map((h, i) => (
                                <div key={i} className="flex justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                                    <span className="text-sm text-[var(--color-text-muted)]">
                                        {new Date(h.timestamp).toLocaleString()}
                                    </span>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="mono">{h.uptimeDays}d</span>
                                        <span className="mono">{h.storageUsagePercent}%</span>
                                        <span className={`status-dot status-dot-${h.status}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[var(--color-text-muted)] text-sm">
                            No historical data yet. Snapshots are taken hourly.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
