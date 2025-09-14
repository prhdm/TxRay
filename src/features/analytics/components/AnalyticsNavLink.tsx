'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {BarChart3} from 'lucide-react'

export function AnalyticsNavLink() {
    const pathname = usePathname()
    const isActive = pathname === '/analytics'

    return (
        <Link
            href="/analytics"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
        >
            <BarChart3 className="h-4 w-4"/>
            Analytics
        </Link>
    )
}


