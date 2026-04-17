'use client'

import Polaroid from './Polaroid'

interface Photo {
  url: string
  caption?: string
  date: string
}

interface PhotoCollageProps {
  photos: Photo[]
}

// Pre-computed positions for asymmetric scrapbook layout
// alternating left/center/right columns with varied vertical offsets
function getPosition(index: number): { left: string; top: string } {
  const positions = [
    { left: '2%',  top: '0px' },
    { left: '45%', top: '30px' },
    { left: '22%', top: '220px' },
    { left: '60%', top: '180px' },
    { left: '5%',  top: '420px' },
    { left: '50%', top: '400px' },
    { left: '28%', top: '600px' },
    { left: '65%', top: '580px' },
  ]
  return positions[index % positions.length]
}

export default function PhotoCollage({ photos }: PhotoCollageProps) {
  if (photos.length === 0) return null

  // On mobile: vertical stack. On desktop: absolute positioned scrapbook
  return (
    <>
      {/* Mobile: simple vertical stack */}
      <div className="md:hidden flex flex-col gap-4 mb-8 overflow-visible">
        {photos.map((photo, i) => (
          <div key={`${photo.url}-${i}`} className="w-44 mx-auto">
            <Polaroid src={photo.url} caption={photo.caption} index={i} />
          </div>
        ))}
      </div>

      {/* Desktop: scrapbook scatter layout */}
      <div
        className="hidden md:block relative w-full mb-8 overflow-visible"
        style={{ height: `${Math.ceil(photos.length / 2) * 220 + 200}px` }}
      >
        {photos.map((photo, i) => {
          const { left, top } = getPosition(i)
          return (
            <div
              key={`${photo.url}-${i}`}
              className="absolute w-52"
              style={{ left, top }}
            >
              <Polaroid src={photo.url} caption={photo.caption} index={i} />
            </div>
          )
        })}
      </div>
    </>
  )
}
