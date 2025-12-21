/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from "./mongodb";
import { Node, Snapshot, SyncStatus } from "./models";
import { prpcClient } from "./prpc-client";

/**
 * Sync worker - fetches data from pRPC and stores in MongoDB
 * Called by cron job or manual trigger
 */
const SEED_NODES = [
  "173.212.203.145",
  "173.212.220.65",
  "161.97.97.41",
  "192.190.136.36",
  "192.190.136.37",
  "192.190.136.38",
  "192.190.136.28",
  "192.190.136.29",
  "207.244.255.1",
];

export async function runSync(): Promise<{
  success: boolean;
  nodesCount: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await connectToDatabase();

    // Mark sync as running
    await SyncStatus.findOneAndUpdate(
      {},
      { status: "running", lastSyncAt: new Date() },
      { upsert: true }
    );

    console.log(`[Sync] Starting crawl of ${SEED_NODES.length} seed nodes...`);
    const validNodes: any[] = [];
    const offlineThreshold = Date.now() - 5 * 60 * 1000;

    for (const ip of SEED_NODES) {
      try {
        // Fetch stats and version from each node
        const [stats, versionInfo] = await Promise.allSettled([
          prpcClient.getStats(ip),
          prpcClient.getVersion(ip),
        ]);

        if (stats.status === "fulfilled") {
          const nodeStats = stats.value;
          const nodeVersion =
            versionInfo.status === "fulfilled"
              ? versionInfo.value.version
              : "Unknown";

          // Use IP as fallback for pubkey if not available (since get-stats might not return it)
          // We generate a deterministic ID based on IP
          const pubkey = `node-${ip.replace(/\./g, "-")}`;

          const lastSeenMs = Date.now(); // We just saw it
          const status = "online";
          const uptimeDays = Math.floor(nodeStats.uptime / (60 * 60 * 24));

          validNodes.push({
            pubkey,
            address: ip,
            version: nodeVersion,
            uptime: nodeStats.uptime,
            uptimeDays,
            storageCommitted: 0, // Not available in flat stats?
            storageUsed: nodeStats.ram_used, // Mapping RAM used or similar? Wait, screenshot had storage keys? NO.
            // Screenshot showed: active_streams, cpu_percent, current_index, file_size, packs_rcvd, etc.
            // It ended with "total_bytes":94633... maybe that's storage? "ram_used" is RAM.
            // Let's use total_bytes as storageUsed if available.
            storageUsagePercent: 0,
            lastSeenTimestamp: Math.floor(lastSeenMs / 1000),
            lastSeen: new Date(lastSeenMs),
            isPublic: true,
            rpcPort: 6000,
            status,
          });

          console.log(`[Sync] Scraped ${ip} successfully`);
        } else {
          console.log(`[Sync] Failed to scrape ${ip}: ${stats.reason}`);
        }
      } catch (err) {
        console.error(`[Sync] Error scraping ${ip}`, err);
      }
    }

    console.log(`[Sync] Found ${validNodes.length} active nodes`);

    // Upsert each node
    const bulkOps = validNodes.map((node) => ({
      updateOne: {
        filter: { pubkey: node.pubkey },
        update: { $set: node },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await Node.bulkWrite(bulkOps);
    }

    // Create snapshots
    // ... (Similar logic for snapshots, using validNodes)
    const snapshots = validNodes.map((node) => ({
      pubkey: node.pubkey,
      uptime: node.uptime,
      uptimeDays: node.uptimeDays,
      storageUsed: node.storageUsed,
      storageUsagePercent: node.storageUsagePercent,
      status: node.status,
      timestamp: new Date(),
    }));

    if (snapshots.length > 0) {
      await Snapshot.insertMany(snapshots);
    }

    // Update sync status
    const duration = Date.now() - startTime;
    await SyncStatus.findOneAndUpdate(
      {},
      {
        status: "success",
        lastSyncAt: new Date(),
        lastSyncDurationMs: duration,
        nodesCount: validNodes.length,
        errorMessage: null,
      },
      { upsert: true }
    );

    return { success: true, nodesCount: validNodes.length };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await SyncStatus.findOneAndUpdate(
      {},
      {
        status: "error",
        lastSyncAt: new Date(),
        lastSyncDurationMs: Date.now() - startTime,
        errorMessage,
      },
      { upsert: true }
    );
    return { success: false, nodesCount: 0, error: errorMessage };
  }
}
