'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowUpDown, Server, Download } from 'lucide-react';
import { cn, truncateAddress, timeAgo } from '@/lib/utils';

interface NodeData {
    _id: string;
    pubkey: string;
    address: string;
    version: string;
    uptimeDays: number;
    storageUsed: number;
    storageUsagePercent: number;
    status: 'online' | 'syncing' | 'offline';
    lastSeen: string;
}

interface NodesMeta {
    total: number;
    online: number;
    offline: number;
    returned: number;
}

export default function NodesPage() {
    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [meta, setMeta] = useState<NodesMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [sortBy, setSortBy] = useState<'uptimeDays' | 'storageUsed' | 'lastSeen'>('uptimeDays');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        async function fetchNodes() {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    sortBy,
                    sortOrder,
                    ...(statusFilter !== 'all' && { status: statusFilter }),
                    ...(search && { search }),
                });
                const res = await fetch(`/api/nodes?${params}`);
                const data = await res.json();
                setNodes(data.nodes || []);
                setMeta(data.meta || null);
            } catch (error) {
                console.error('Failed to fetch nodes:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchNodes();
    }, [search, statusFilter, sortBy, sortOrder]);

    const toggleSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const exportCSV = () => {
        const headers = ['Pubkey', 'Address', 'Version', 'Uptime (days)', 'Storage Used', 'Status', 'Last Seen'];
        const rows = nodes.map(n => [
            n.pubkey,
            n.address,
            n.version,
            n.uptimeDays,
            n.storageUsed,
            n.status,
            n.lastSeen,
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xanlytics-nodes-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="container py-8">
            {/* Page header */}
            <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Nodes</h1>
                    <p className="page-description">
                        {meta ? `${meta.total} total · ${meta.online} online · ${meta.offline} offline` : 'Loading...'}
                    </p>
                </div>
                <button onClick={exportCSV} className="btn btn-ghost">
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search by pubkey or address..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'online', 'offline'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm capitalize transition-colors',
                                statusFilter === status
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-white'
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Node</th>
                                <th>Version</th>
                                <th>
                                    <button
                                        onClick={() => toggleSort('uptimeDays')}
                                        className="flex items-center gap-1 hover:text-white"
                                    >
                                        Uptime
                                        <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th>
                                    <button
                                        onClick={() => toggleSort('storageUsed')}
                                        className="flex items-center gap-1 hover:text-white"
                                    >
                                        Storage
                                        <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th>Status</th>
                                <th>
                                    <button
                                        onClick={() => toggleSort('lastSeen')}
                                        className="flex items-center gap-1 hover:text-white"
                                    >
                                        Last Seen
                                        <ArrowUpDown size={12} />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-[var(--color-text-muted)]">
                                        Loading...
                                    </td>
                                </tr>
                            ) : nodes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8">
                                        <Server size={32} className="mx-auto text-[var(--color-text-muted)] mb-2" />
                                        <p className="text-[var(--color-text-muted)]">No nodes found</p>
                                    </td>
                                </tr>
                            ) : (
                                nodes.map((node) => (
                                    <tr key={node.pubkey}>
                                        <td>
                                            <Link href={`/nodes/${node.pubkey}`} className="hover:text-[var(--color-primary)]">
                                                <div className="mono text-sm">{truncateAddress(node.pubkey, 10)}</div>
                                                <div className="text-xs text-[var(--color-text-muted)]">{node.address}</div>
                                            </Link>
                                        </td>
                                        <td className="mono text-sm">v{node.version}</td>
                                        <td className="mono">{node.uptimeDays}d</td>
                                        <td className="mono">{node.storageUsagePercent < 0.01 ? '0%' : `${node.storageUsagePercent.toFixed(2)}%`}</td>
                                        <td>
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs capitalize',
                                                node.status === 'online' ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]' :
                                                    node.status === 'offline' ? 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]' :
                                                        'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'
                                            )}>
                                                <span className={`status-dot status-dot-${node.status}`} />
                                                {node.status}
                                            </span>
                                        </td>
                                        <td className="text-[var(--color-text-muted)] text-sm">
                                            {timeAgo(node.lastSeen)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
