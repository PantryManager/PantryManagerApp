'use client'

import { ReactNode } from 'react'
import { AppNav } from './AppNav'

interface AppLayoutProps {
    children: ReactNode
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
}

export function AppLayout({ children, maxWidth = 'xl' }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <AppNav />
            <main className={`container mx-auto px-6 py-8 ${maxWidthClasses[maxWidth]}`}>
                {children}
            </main>
        </div>
    )
}
