'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface NodeLocation {
    pubkey: string;
    lat: number;
    lng: number;
    status: 'online' | 'offline';
}

function hashToCoords(ip: string): { lat: number; lng: number } {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const lat = ((Math.abs(hash) % 12000) / 100) - 60;
    const lng = (((Math.abs(hash >> 8)) % 32000) / 100) - 160;
    return { lat, lng };
}

export default function DashboardMap() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [nodes, setNodes] = useState<NodeLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNodes() {
            try {
                const res = await fetch('/api/nodes?limit=500');
                const data = await res.json();
                const nodesWithCoords = (data.nodes || [])
                    .filter((node: { pubkey?: string | null }) => node.pubkey)
                    .map((node: { pubkey: string; address: string; status: string }) => {
                        const ip = node.address.split(':')[0];
                        const coords = hashToCoords(ip);
                        return {
                            pubkey: node.pubkey,
                            lat: coords.lat,
                            lng: coords.lng,
                            status: node.status as 'online' | 'offline',
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

        const container = mapRef.current;
        const containerWidth = container.clientWidth;

        // Calculate zoom: at zoom N, world width = 256 * 2^N pixels
        // We need: 256 * 2^zoom >= containerWidth
        // Add 1 to ensure we definitely fill the width
        const calculatedZoom = Math.max(2, Math.ceil(Math.log2(containerWidth / 256)) + 1);

        const worldBounds = L.latLngBounds(
            L.latLng(-85, -180),
            L.latLng(85, 180)
        );

        const map = L.map(container, {
            center: [20, 0],
            zoom: calculatedZoom,
            minZoom: calculatedZoom,
            maxZoom: 10,
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: true,
            dragging: true,
            doubleClickZoom: true,
            maxBounds: worldBounds,
            maxBoundsViscosity: 1.0,
        });

        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 19,
            noWrap: true,
        }).addTo(map);

        nodes.forEach((node) => {
            L.circleMarker([node.lat, node.lng], {
                radius: 5,
                fillColor: node.status === 'online' ? '#22c55e' : '#ef4444',
                color: node.status === 'online' ? '#22c55e' : '#ef4444',
                weight: 0,
                opacity: 1,
                fillOpacity: 0.8,
            }).addTo(map);
        });

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [nodes]);

    const onlineCount = nodes.filter(n => n.status === 'online').length;
    const offlineCount = nodes.filter(n => n.status === 'offline').length;

    if (loading) {
        return (
            <div className="card h-[280px] flex items-center justify-center">
                <p className="text-[var(--color-text-muted)]">Loading map...</p>
            </div>
        );
    }

    return (
        <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                    Network Distribution
                </h3>
                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                        <span>{onlineCount} online</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-danger)]" />
                        <span>{offlineCount} offline</span>
                    </div>
                </div>
            </div>
            <div ref={mapRef} className="w-full h-[280px]" />
        </div>
    );
}
