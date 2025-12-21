import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Node, SyncStatus } from '@/lib/models';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats
 * Returns network overview statistics
 */
export async function GET() {
    try {
        await connectToDatabase();

        // Aggregate stats
        const [stats] = await Node.aggregate([
            {
                $group: {
                    _id: null,
                    totalNodes: { $sum: 1 },
                    onlineNodes: {
                        $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] },
                    },
                    offlineNodes: {
                        $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] },
                    },
                    totalStorageCommitted: { $sum: '$storageCommitted' },
                    totalStorageUsed: { $sum: '$storageUsed' },
                    avgStorageUsagePercent: { $avg: '$storageUsagePercent' },
                    avgUptimeDays: { $avg: '$uptimeDays' },
                    maxUptimeDays: { $max: '$uptimeDays' },
                },
            },
        ]);

        // Get version distribution
        const versions = await Node.aggregate([
            { $group: { _id: '$version', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);

        // Get sync status
        const syncStatus = await SyncStatus.findOne().lean();

        // Calculate uptime percentage
        const uptimePercent = stats
            ? ((stats.onlineNodes / stats.totalNodes) * 100).toFixed(1)
            : '0';

        return NextResponse.json({
            overview: {
                totalNodes: stats?.totalNodes || 0,
                onlineNodes: stats?.onlineNodes || 0,
                offlineNodes: stats?.offlineNodes || 0,
                uptimePercent: parseFloat(uptimePercent),
                totalStorageTb: ((stats?.totalStorageCommitted || 0) / 1e12).toFixed(2),
                usedStorageTb: ((stats?.totalStorageUsed || 0) / 1e12).toFixed(2),
                avgStorageUsagePercent: Math.round(stats?.avgStorageUsagePercent || 0),
                avgUptimeDays: Math.round(stats?.avgUptimeDays || 0),
                maxUptimeDays: Math.round(stats?.maxUptimeDays || 0),
            },
            versions: versions.map((v) => ({ version: v._id, count: v.count })),
            sync: {
                lastSyncAt: syncStatus?.lastSyncAt || null,
                status: syncStatus?.status || 'unknown',
                durationMs: syncStatus?.lastSyncDurationMs || 0,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
