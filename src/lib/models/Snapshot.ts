import mongoose, { Schema, Document } from "mongoose";

export interface ISnapshot extends Document {
  pubkey: string;
  uptime: number;
  uptimeDays: number;
  storageUsed: number;
  storageUsagePercent: number;
  status: "online" | "syncing" | "offline";
  timestamp: Date;
}

const SnapshotSchema = new Schema<ISnapshot>({
  pubkey: { type: String, required: true, index: true },
  uptime: { type: Number, default: 0 },
  uptimeDays: { type: Number, default: 0 },
  storageUsed: { type: Number, default: 0 },
  storageUsagePercent: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["online", "syncing", "offline"],
    default: "online",
  },
  timestamp: { type: Date, default: Date.now },
});

// TTL index: auto-delete snapshots older than 30 days
SnapshotSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

// Compound index for efficient queries
SnapshotSchema.index({ pubkey: 1, timestamp: -1 });

export const Snapshot =
  mongoose.models.Snapshot ||
  mongoose.model<ISnapshot>("Snapshot", SnapshotSchema);
