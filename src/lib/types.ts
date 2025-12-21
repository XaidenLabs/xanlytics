// TypeScript interfaces for pRPC responses

export interface PrpcPeerWithStats {
  address: string;
  is_public: boolean;
  last_seen_timestamp: number;
  pubkey: string;
  rpc_port: number;
  storage_committed: number;
  storage_usage_percent: number;
  storage_used: number;
  uptime: number;
  version: string;
}

export interface PrpcPodsResponse {
  pods: PrpcPeerWithStats[];
}

export interface PrpcVersionResponse {
  version: string;
  release: string;
}

export interface PrpcStatsResponse {
  active_streams: number;
  cpu_percent: number;
  current_index?: number;
  file_size?: number;
  last_updated?: number;
  packets_received: number;
  packets_sent: number;
  ram_total: number;
  ram_used: number;
  total_bytes?: number;
  total_pages?: number;
  uptime: number;
}
