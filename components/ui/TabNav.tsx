'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { TAB_DEFINITIONS } from '@/lib/tabs'

export default function TabNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeTab = TAB_DEFINITIONS.find(
    (t) => pathname === t.href || pathname.startsWith(t.href + '/')
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on navigation
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <nav className="w-full border-b border-dusty-rose/30 bg-cream/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* App title */}
        <div className="pt-6 pb-2 text-center">
          <h1 className="font-display text-3xl text-terracotta">Diario</h1>
        </div>

        {/* Desktop: horizontal tab list */}
        <div className="hidden md:flex justify-center gap-1 overflow-x-auto pb-0 -mb-px scrollbar-none">
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

        {/* Mobile: active tab label + hamburger */}
        <div className="md:hidden flex items-center justify-between pb-3" ref={menuRef}>
          <span className="font-body text-sm text-terracotta font-medium">
            {activeTab?.label ?? ''}
          </span>
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-2 -mr-2 text-stone-500 hover:text-stone-700 transition-colors"
            aria-label="Åpne meny"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="17" y2="6" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="14" x2="17" y2="14" />
              </svg>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute top-full left-0 right-0 bg-cream/95 backdrop-blur-sm border-b border-dusty-rose/30 shadow-sm py-2">
              {TAB_DEFINITIONS.map((tab) => {
                const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    className={`
                      block px-6 py-3 font-body text-sm transition-colors
                      ${isActive
                        ? 'text-terracotta font-medium bg-dusty-rose/10'
                        : 'text-stone-600 hover:text-stone-800 hover:bg-dusty-rose/5'
                      }
                    `}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
