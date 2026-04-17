'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TAB_DEFINITIONS } from '@/lib/tabs'

export default function TabNav() {
  const pathname = usePathname()

  return (
    <nav className="w-full border-b border-dusty-rose/30 bg-cream/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* App title */}
        <div className="pt-6 pb-2 text-center">
          <h1 className="font-display text-3xl text-terracotta">Diario</h1>
        </div>

        {/* Tab list — horizontal scroll on mobile */}
        <div className="flex gap-1 overflow-x-auto pb-0 -mb-px scrollbar-none">
          {TAB_DEFINITIONS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`
                  flex-shrink-0 px-4 py-3 text-sm font-body border-b-2 transition-colors whitespace-nowrap
                  ${isActive
                    ? 'border-terracotta text-terracotta font-medium'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-dusty-rose/50'
                  }
                `}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
