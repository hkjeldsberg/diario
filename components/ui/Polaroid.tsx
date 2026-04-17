'use client'

import Image from 'next/image'
import { motion } from 'motion/react'

interface PolaroidProps {
  src: string
  caption?: string
  index: number
}

export default function Polaroid({ src, caption, index }: PolaroidProps) {
  // Deterministic rotation from index — range approximately -7.5° to +7.5°
  const targetRotation = ((index % 7) - 3) * 2.5

  return (
    <motion.div
      initial={{ rotate: 0, y: -20, opacity: 0 }}
      animate={{ rotate: targetRotation, y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 60,
        damping: 12,
        mass: 1.2,
        delay: index * 0.08,
        opacity: { duration: 0.3 },
      }}
      whileHover={{
        scale: 2.5,
        zIndex: 50,
        rotate: 0,
        transition: {
          type: 'spring',
          stiffness: 150,
          damping: 20,
        },
      }}
      className="bg-white p-3 pb-10 shadow-lg cursor-pointer select-none"
      style={{ willChange: 'transform', transformOrigin: 'center center' }}
    >
      <div className="relative w-full aspect-square overflow-hidden bg-cream-dark">
        <Image
          src={src}
          alt={caption || 'Minne'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 45vw, 220px"
          loading="lazy"
        />
      </div>
      {caption && (
        <p className="font-handwritten text-stone-600 text-sm text-center mt-2 px-1 leading-tight">
          {caption}
        </p>
      )}
    </motion.div>
  )
}
