import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncStatus extends Document {
    lastSyncAt: Date;
    lastSyncDurationMs: number;
    nodesCount: number;
    status: 'success' | 'error' | 'running';
    errorMessage?: string;
}

const SyncStatusSchema = new Schema<ISyncStatus>(
    {
        lastSyncAt: { type: Date, default: Date.now },
        lastSyncDurationMs: { type: Number, default: 0 },
        nodesCount: { type: Number, default: 0 },
        status: { type: String, enum: ['success', 'error', 'running'], default: 'success' },
        errorMessage: { type: String },
    },
    {
        timestamps: true,
        capped: { size: 1024 * 10, max: 1 }, // Only keep 1 document
    }
);

export const SyncStatus = mongoose.models.SyncStatus || mongoose.model<ISyncStatus>('SyncStatus', SyncStatusSchema);
