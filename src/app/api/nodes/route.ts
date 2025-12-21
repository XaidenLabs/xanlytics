import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Node } from '@/lib/models';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nodes
 * Returns all nodes from MongoDB (cached data)
 */
export async function GET(request: Request) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const sortBy = searchParams.get('sortBy') || 'uptimeDays';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
        const limit = parseInt(searchParams.get('limit') || '100');

        // Build query
        const query: Record<string, unknown> = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { pubkey: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
            ];
        }

        const nodes = await Node.find(query)
            .sort({ [sortBy]: sortOrder })
            .limit(limit)
            .lean();

        // Get counts
        const totalCount = await Node.countDocuments();
        const onlineCount = await Node.countDocuments({ status: 'online' });
        const offlineCount = await Node.countDocuments({ status: 'offline' });

        return NextResponse.json({
            nodes,
            meta: {
                total: totalCount,
                online: onlineCount,
                offline: offlineCount,
                returned: nodes.length,
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
