'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Gauge, Database, LineChart, GitCompare, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/', label: 'Dashboard', icon: Gauge },
    { href: '/nodes', label: 'Nodes', icon: Database },
    { href: '/history', label: 'History', icon: LineChart },
    { href: '/compare', label: 'Compare', icon: GitCompare },
    { href: '/status', label: 'Status', icon: Zap },
];

export function Header() {
    const pathname = usePathname();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
            <div className="container h-full flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/logo.png"
                        alt="Xanlytics"
                        width={32}
                        height={32}
                        className="rounded-lg"
                    />
                    <span className="font-semibold text-lg">Xanlytics</span>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                                    isActive
                                        ? 'bg-[var(--color-surface)] text-white'
                                        : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface)]/50'
                                )}
                            >
                                <Icon size={16} />
                                <span className="hidden sm:inline">{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Sync indicator */}
                <div className="flex items-center gap-2">
                    <span className="status-dot status-dot-online" />
                    <span className="text-xs text-[var(--color-text-muted)] mono hidden sm:inline">
                        LIVE
                    </span>
                </div>
            </div>
        </header>
    );
}
