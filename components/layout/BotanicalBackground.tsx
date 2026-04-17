export default function BotanicalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Top-left botanical */}
      <img
        src="/svgs/botanical-1.svg"
        alt=""
        className="absolute -top-4 -left-8 w-40 opacity-[0.12] rotate-12"
      />
      {/* Bottom-right fern */}
      <img
        src="/svgs/botanical-2.svg"
        alt=""
        className="absolute -bottom-8 -right-4 w-44 opacity-[0.12] -rotate-6"
      />
      {/* Top-right branch */}
      <img
        src="/svgs/botanical-3.svg"
        alt=""
        className="absolute top-8 -right-4 w-64 opacity-[0.10] -rotate-12"
      />
      {/* Bottom-left small accent */}
      <img
        src="/svgs/botanical-1.svg"
        alt=""
        className="absolute bottom-16 -left-6 w-24 opacity-[0.08] -rotate-6"
      />
    </div>
  )
}
