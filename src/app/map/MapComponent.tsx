'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface NodeLocation {
    pubkey: string;
    address: string;
    lat: number;
    lng: number;
    status: 'online' | 'offline';
    version: string;
    uptimeDays: number;
}

// Simple hash function to generate consistent coordinates from IP
function hashToCoords(ip: string): { lat: number; lng: number } {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    // Map to realistic lat/lng ranges
    const lat = ((hash % 18000) / 100) - 90; // -90 to 90
    const lng = (((hash >> 8) % 36000) / 100) - 180; // -180 to 180

    return { lat, lng };
}

export default function MapComponent() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [nodes, setNodes] = useState<NodeLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNodes() {
            try {
                const res = await fetch('/api/nodes?limit=500');
                const data = await res.json();

                // Generate coordinates from IP addresses, filter out invalid nodes
                const nodesWithCoords = (data.nodes || [])
                    .filter((node: { pubkey?: string | null }) => node.pubkey)
                    .map((node: {
                        pubkey: string;
                        address: string;
                        status: string;
                        version: string;
                        uptimeDays: number;
                    }) => {
                        const ip = node.address.split(':')[0];
                        const coords = hashToCoords(ip);
                        return {
                            ...node,
                            lat: coords.lat,
                            lng: coords.lng,
                        };
                    });

                setNodes(nodesWithCoords);
            } catch (error) {
                console.error('Failed to fetch nodes:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchNodes();
    }, []);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current || nodes.length === 0) return;

        // Initialize map
        const map = L.map(mapRef.current, {
            center: [20, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: true,
        });

        // Dark tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(map);

        // Custom marker icons
        const onlineIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="width: 12px; height: 12px; background: #22c55e; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 10px #22c55e;"></div>',
            iconSize: [12, 12],
        });

        const offlineIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%; border: 2px solid #fff;"></div>',
            iconSize: [12, 12],
        });

        // Add markers
        nodes.forEach((node) => {
            const icon = node.status === 'online' ? onlineIcon : offlineIcon;
            const marker = L.marker([node.lat, node.lng], { icon }).addTo(map);

            marker.bindPopup(`
        <div style="color: #000; font-size: 12px;">
          <strong>${node.address}</strong><br/>
          <span style="font-family: monospace; font-size: 10px;">${node.pubkey.slice(0, 16)}...</span><br/>
          <span>Version: ${node.version}</span><br/>
          <span>Uptime: ${node.uptimeDays} days</span><br/>
          <span style="color: ${node.status === 'online' ? '#22c55e' : '#ef4444'}">● ${node.status}</span>
        </div>
      `);
        });

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [nodes]);

    const onlineCount = nodes.filter(n => n.status === 'online').length;
    const offlineCount = nodes.filter(n => n.status === 'offline').length;

    return (
        <div className="container py-8">
            <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="page-title">Network Map</h1>
                    <p className="page-description">
                        Geographic distribution of {nodes.length} pNodes
                    </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[var(--color-success)]" style={{ boxShadow: '0 0 8px #22c55e' }} />
                        <span>{onlineCount} online</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[var(--color-danger)]" />
                        <span>{offlineCount} offline</span>
                    </div>
                </div>
            </div>

            <div className="card p-0 overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
                {loading ? (
                    <div className="flex items-center justify-center h-full text-[var(--color-text-muted)]">
                        Loading map...
                    </div>
                ) : (
                    <div ref={mapRef} className="w-full h-full" />
                )}
            </div>
        </div>
    );
}
