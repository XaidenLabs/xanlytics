'use client';

import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface HistoricalData {
    date: string;
    totalNodes: number;
    onlineNodes: number;
    avgUptime: number;
    totalStorageTb: number;
}

// Generate mock historical data (in production, this would come from snapshots)
function generateMockHistory(currentTotal: number, currentOnline: number): HistoricalData[] {
    const data: HistoricalData[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Add some variance
        const variance = Math.random() * 0.1 - 0.05; // -5% to +5%
        const dayTotal = Math.round(currentTotal * (0.85 + (i / 29) * 0.15 + variance));
        const dayOnline = Math.round(dayTotal * (0.95 + Math.random() * 0.05));

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            totalNodes: dayTotal,
            onlineNodes: dayOnline,
            avgUptime: Math.round(50 + Math.random() * 50),
            totalStorageTb: Math.round(100 + (i / 29) * 20 + Math.random() * 10),
        });
    }

    return data;
}

export default function HistoryPage() {
    const [data, setData] = useState<HistoricalData[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/stats');
                const stats = await res.json();

                const totalNodes = stats.overview?.totalNodes || 200;
                const onlineNodes = stats.overview?.onlineNodes || 196;

                // Generate historical data based on current stats
                const history = generateMockHistory(totalNodes, onlineNodes);
                setData(history);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
                setData(generateMockHistory(200, 196));
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredData = (() => {
        switch (timeRange) {
            case '7d': return data.slice(-7);
            case '14d': return data.slice(-14);
            default: return data;
        }
    })();

    if (loading) {
        return (
            <div className="container py-8">
                <div className="card text-center py-12">
                    <p className="text-[var(--color-text-muted)]">Loading historical data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="page-title">Network History</h1>
                    <p className="page-description">
                        Historical trends and analytics
                    </p>
                </div>
                <div className="flex gap-2">
                    {(['7d', '14d', '30d'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${timeRange === range
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-white'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Node count chart */}
            <div className="card mb-6">
                <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
                    Node Count Over Time
                </h3>
                <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a25',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="totalNodes"
                                name="Total Nodes"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                            />
                            <Area
                                type="monotone"
                                dataKey="onlineNodes"
                                name="Online Nodes"
                                stroke="#22c55e"
                                fillOpacity={1}
                                fill="url(#colorOnline)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Uptime and Storage charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
                        Average Uptime (days)
                    </h3>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1a1a25',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avgUptime"
                                    stroke="#a855f7"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
                        Total Storage (TB)
                    </h3>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1a1a25',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="totalStorageTb"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Info note */}
            <div className="card mt-6 bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30">
                <p className="text-sm text-[var(--color-text-secondary)]">
                    <strong>Note:</strong> Historical data is populated from hourly snapshots.
                    The more the sync worker runs, the richer this data becomes.
                    Currently showing simulated trends based on current network state.
                </p>
            </div>
        </div>
    );
}
