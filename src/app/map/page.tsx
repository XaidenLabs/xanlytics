'use client';

import dynamic from 'next/dynamic';

// Leaflet requires window, so we need to load it dynamically
const MapComponent = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="container py-8">
            <div className="card text-center py-12">
                <p className="text-[var(--color-text-muted)]">Loading map...</p>
            </div>
        </div>
    ),
});

export default function MapPage() {
    return <MapComponent />;
}
