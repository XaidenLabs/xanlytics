'use client';

import dynamic from 'next/dynamic';

const DashboardMap = dynamic(() => import('./DashboardMap'), {
    ssr: false,
    loading: () => (
        <div className="card h-[320px] flex items-center justify-center">
            <p className="text-[var(--color-text-muted)]">Loading map...</p>
        </div>
    ),
});

export default function MapWrapper() {
    return <DashboardMap />;
}
