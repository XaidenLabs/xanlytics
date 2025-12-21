'use client';

import { useState, useEffect } from 'react';
import { Search, X, Plus, ArrowUpDown } from 'lucide-react';
import { cn, truncateAddress } from '@/lib/utils';

interface NodeData {
    pubkey: string;
    address: string;
    version: string;
    uptimeDays: number;
    uptime: number;
    storageCommitted: number;
    storageUsed: number;
    storageUsagePercent: number;
    status: 'online' | 'offline';
    lastSeen: string;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    if (bytes < 1024 ** 4) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    return `${(bytes / 1024 ** 4).toFixed(2)} TB`;
}

function CompareMetric({
    label,
    values,
    format = 'number',
    highlightBest = true
}: {
    label: string;
    values: (number | string | null)[];
    format?: 'number' | 'bytes' | 'days' | 'percent' | 'text';
    highlightBest?: boolean;
}) {
    const formatValue = (val: number | string | null) => {
        if (val === null) return '—';
        if (typeof val === 'string') return val;
        switch (format) {
            case 'bytes': return formatBytes(val);
            case 'days': return `${val} days`;
            case 'percent': return `${val.toFixed(2)}%`;
            default: return val.toLocaleString();
        }
    };

    // Find best value (highest for most metrics)
    const numericValues = values.filter((v): v is number => typeof v === 'number');
    const bestValue = highlightBest && numericValues.length > 1 ? Math.max(...numericValues) : null;

    return (
        <div className="grid grid-cols-[140px,1fr,1fr,1fr] gap-4 py-3 border-b border-[var(--color-border)]">
            <div className="text-sm text-[var(--color-text-muted)]">{label}</div>
            {values.map((val, i) => (
                <div
                    key={i}
                    className={cn(
                        'text-sm mono',
                        val !== null && val === bestValue && 'text-[var(--color-success)] font-medium'
                    )}
                >
                    {formatValue(val)}
                </div>
            ))}
        </div>
    );
}

export default function ComparePage() {
    const [allNodes, setAllNodes] = useState<NodeData[]>([]);
    const [selectedNodes, setSelectedNodes] = useState<NodeData[]>([]);
    const [search, setSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNodes() {
            try {
                const res = await fetch('/api/nodes?limit=500');
                const data = await res.json();
                // Filter out nodes with null/undefined pubkey
                const validNodes = (data.nodes || []).filter((n: { pubkey?: string | null }) => n.pubkey);
                setAllNodes(validNodes);
            } catch (error) {
                console.error('Failed to fetch nodes:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchNodes();
    }, []);

    const addNode = (node: NodeData) => {
        if (selectedNodes.length < 3 && !selectedNodes.find(n => n.pubkey === node.pubkey)) {
            setSelectedNodes([...selectedNodes, node]);
        }
        setSearch('');
        setShowDropdown(false);
    };

    const removeNode = (pubkey: string) => {
        setSelectedNodes(selectedNodes.filter(n => n.pubkey !== pubkey));
    };

    const availableNodes = allNodes.filter(
        (n) => !selectedNodes.find(s => s.pubkey === n.pubkey) &&
            (n.pubkey.toLowerCase().includes(search.toLowerCase()) ||
                n.address.toLowerCase().includes(search.toLowerCase()))
    ).slice(0, 8);

    // Pad values array to always have 3 slots
    const getValues = <T,>(getter: (n: NodeData) => T): (T | null)[] => {
        const values: (T | null)[] = [];
        for (let i = 0; i < 3; i++) {
            values.push(selectedNodes[i] ? getter(selectedNodes[i]) : null);
        }
        return values;
    };

    return (
        <div className="container py-8">
            <div className="page-header mb-6">
                <h1 className="page-title">Compare Nodes</h1>
                <p className="page-description">
                    Select up to 3 nodes to compare side-by-side
                </p>
            </div>

            {/* Node selector */}
            <div className="card mb-6 relative">
                <div className="flex items-center gap-2 mb-4">
                    <Plus size={16} className="text-[var(--color-primary)]" />
                    <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">
                        Add Node ({selectedNodes.length}/3)
                    </span>
                </div>

                {selectedNodes.length < 3 && (
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search by pubkey or address..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                            onFocus={() => setShowDropdown(true)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]"
                        />

                        {showDropdown && availableNodes.length > 0 && (
                            <>
                                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl max-h-64 overflow-y-auto">
                                    {availableNodes.map((node) => (
                                        <button
                                            key={node.pubkey}
                                            onClick={() => addNode(node)}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-surface-elevated)] transition-colors text-left"
                                        >
                                            <div>
                                                <div className="mono text-sm">{truncateAddress(node.pubkey, 12)}</div>
                                                <div className="text-xs text-[var(--color-text-muted)]">{node.address}</div>
                                            </div>
                                            <span className={`status-dot status-dot-${node.status}`} />
                                        </button>
                                    ))}
                                </div>
                                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                            </>
                        )}
                    </div>
                )}

                {/* Selected nodes pills */}
                {selectedNodes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {selectedNodes.map((node, index) => (
                            <div
                                key={node.pubkey}
                                className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-elevated)] rounded-lg"
                            >
                                <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center font-medium">
                                    {index + 1}
                                </span>
                                <span className="mono text-sm">{truncateAddress(node.pubkey, 8)}</span>
                                <button
                                    onClick={() => removeNode(node.pubkey)}
                                    className="p-1 hover:bg-[var(--color-danger)]/20 rounded"
                                >
                                    <X size={14} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Comparison table */}
            {selectedNodes.length > 0 ? (
                <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                        <ArrowUpDown size={16} className="text-[var(--color-primary)]" />
                        <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">
                            Comparison
                        </span>
                    </div>

                    {/* Header */}
                    <div className="grid grid-cols-[140px,1fr,1fr,1fr] gap-4 py-3 border-b border-[var(--color-border)]">
                        <div className="text-sm font-medium">Metric</div>
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="text-sm font-medium">
                                {selectedNodes[i] ? (
                                    <div>
                                        <span className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-xs mr-2">
                                            {i + 1}
                                        </span>
                                        {truncateAddress(selectedNodes[i].pubkey, 6)}
                                    </div>
                                ) : (
                                    <span className="text-[var(--color-text-muted)]">—</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Metrics */}
                    <CompareMetric label="Address" values={getValues(n => n.address)} format="text" highlightBest={false} />
                    <CompareMetric label="Status" values={getValues(n => n.status)} format="text" highlightBest={false} />
                    <CompareMetric label="Version" values={getValues(n => n.version)} format="text" highlightBest={false} />
                    <CompareMetric label="Uptime" values={getValues(n => n.uptimeDays)} format="days" />
                    <CompareMetric label="Storage Committed" values={getValues(n => n.storageCommitted)} format="bytes" />
                    <CompareMetric label="Storage Used" values={getValues(n => n.storageUsed)} format="bytes" />
                    <CompareMetric label="Usage %" values={getValues(n => n.storageUsagePercent)} format="percent" highlightBest={false} />
                </div>
            ) : (
                <div className="card text-center py-12">
                    <ArrowUpDown size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Nodes Selected</h2>
                    <p className="text-[var(--color-text-muted)]">
                        Search and add up to 3 nodes above to compare them side-by-side.
                    </p>
                </div>
            )}
        </div>
    );
}
