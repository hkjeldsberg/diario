'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { EmailMessage } from '@/lib/types'

// DOMPurify only runs in browser (it needs the DOM).
// We import it lazily to avoid SSR issues.
function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return ''
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require('dompurify')
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'span', 'div', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'img', 'figure', 'figcaption', 'hr',
    ],
    ALLOWED_ATTR: ['href', 'style', 'src', 'alt', 'width', 'height', 'align', 'valign', 'colspan', 'rowspan'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
  })
}

function stripTags(html: string): string {
  if (typeof window === 'undefined') return html
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent ?? tmp.innerText ?? ''
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}


function getSenderName(from: string): string {
  const match = from.match(/^([^<]+)/)
  return (match?.[1] ?? "")
    .replace(/["']/g, "")
    .trim()
}

interface EmailCardProps {
  email: EmailMessage
}

export default function EmailCard({ email }: EmailCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const senderName = getSenderName(email.from)
  const initial = senderName[0]
  const formattedDate = formatDate(email.date)

  const sanitizedBody = expanded && email.isHtml ? sanitizeHtml(email.body) : null
  const plainFallback = expanded && email.isHtml && !sanitizedBody && email.body
    ? stripTags(email.body)
    : null
  const attachmentUrls = email.attachmentUrls ?? []
  const hasImages = attachmentUrls.length > 0

  function handlePrev() {
    setCurrentImageIndex((i) => Math.max(0, i - 1))
  }

  function handleNext() {
    setCurrentImageIndex((i) => Math.min(attachmentUrls.length - 1, i + 1))
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (delta > 50) handleNext()
    else if (delta < -50) handlePrev()
    touchStartX.current = null
  }

  return (
    <article
      className="bg-white rounded-2xl border border-dusty-rose/30 shadow-sm mb-4 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setExpanded((prev) => !prev)}
    >
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-dusty-rose/30 flex items-center justify-center">
          <span className="font-handwritten text-terracotta text-lg">{initial}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-body font-medium text-stone-800 truncate">{senderName}</p>
            <time className="font-handwritten text-stone-400 text-sm flex-shrink-0">{formattedDate}</time>
          </div>
          <p className="font-body text-stone-700 text-sm mt-0.5 font-medium">{email.subject}</p>
          {!expanded && (
            <p className="font-body text-stone-400 text-sm mt-1 line-clamp-2">{email.snippet}</p>
          )}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-cream-dark">
          <div className={`mt-4 flex gap-6 items-start ${hasImages ? 'flex-col md:flex-row' : ''}`}>
            {/* Text — 60% */}
            <div className={hasImages ? 'md:w-3/5' : 'w-full'}>
              {email.isHtml && sanitizedBody ? (
                <div
                  className="font-body text-stone-700 text-sm leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                />
              ) : (
                <pre className="font-body text-stone-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {plainFallback || (!email.isHtml ? email.body : null) || email.snippet}
                </pre>
              )}
            </div>

            {/* Image carousel — 40% */}
            {hasImages && (
              <div
                className="md:w-2/5 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="relative"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Image — taller, click to zoom */}
                  <img
                    src={attachmentUrls[currentImageIndex]}
                    alt={`Vedlegg ${currentImageIndex + 1} av ${attachmentUrls.length}`}
                    className="w-full rounded-xl object-cover max-h-96 cursor-zoom-in"
                    onClick={() => setZoomed(true)}
                  />

                  {/* Bottom nav bar: arrows + dots together */}
                  {attachmentUrls.length > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={currentImageIndex === 0}
                        className="text-stone-500 hover:text-terracotta disabled:opacity-30 text-lg font-body transition-colors px-1"
                        aria-label="Forrige bilde"
                      >
                        ←
                      </button>
                      {attachmentUrls.map((_, idx) => (
                        <span
                          key={idx}
                          className={
                            idx === currentImageIndex
                              ? 'w-2 h-2 rounded-full bg-terracotta'
                              : 'w-2 h-2 rounded-full bg-stone-300'
                          }
                        />
                      ))}
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={currentImageIndex === attachmentUrls.length - 1}
                        className="text-stone-500 hover:text-terracotta disabled:opacity-30 text-lg font-body transition-colors px-1"
                        aria-label="Neste bilde"
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>

                {/* Lightbox */}
                <AnimatePresence>
                  {zoomed && (
                    <motion.div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-zoom-out"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setZoomed(false)}
                    >
                      <motion.img
                        src={attachmentUrls[currentImageIndex]}
                        alt=""
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.85, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
