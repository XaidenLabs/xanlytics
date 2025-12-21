import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Node, Snapshot } from '@/lib/models';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/nodes/[id]
 * Returns single node details with recent history
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        await connectToDatabase();

        const { id } = await params;

        const node = await Node.findOne({ pubkey: id }).lean();

        if (!node) {
            return NextResponse.json(
                { error: 'Node not found' },
                { status: 404 }
            );
        }

        // Get historical snapshots (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const history = await Snapshot.find({
            pubkey: id,
            timestamp: { $gte: sevenDaysAgo },
        })
            .sort({ timestamp: 1 })
            .lean();

        return NextResponse.json({
            node,
            history,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
