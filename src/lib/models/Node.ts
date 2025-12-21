import mongoose, { Schema, Document } from 'mongoose';

export interface INode extends Document {
    pubkey: string;
    address: string;
    version: string;
    uptime: number;
    uptimeDays: number;
    storageCommitted: number;
    storageUsed: number;
    storageUsagePercent: number;
    lastSeenTimestamp: number;
    lastSeen: Date;
    isPublic: boolean;
    rpcPort: number;
    status: 'online' | 'syncing' | 'offline';
    createdAt: Date;
    updatedAt: Date;
}

const NodeSchema = new Schema<INode>(
    {
        pubkey: { type: String, required: true, unique: true, index: true },
        address: { type: String, required: true },
        version: { type: String, required: true },
        uptime: { type: Number, default: 0 },
        uptimeDays: { type: Number, default: 0 },
        storageCommitted: { type: Number, default: 0 },
        storageUsed: { type: Number, default: 0 },
        storageUsagePercent: { type: Number, default: 0 },
        lastSeenTimestamp: { type: Number, default: 0 },
        lastSeen: { type: Date, default: Date.now },
        isPublic: { type: Boolean, default: false },
        rpcPort: { type: Number, default: 6000 },
        status: { type: String, enum: ['online', 'syncing', 'offline'], default: 'online' },
    },
    {
        timestamps: true,
    }
);

// Prevent model recompilation in development
export const Node = mongoose.models.Node || mongoose.model<INode>('Node', NodeSchema);
