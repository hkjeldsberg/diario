'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          duration: 0.2,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
