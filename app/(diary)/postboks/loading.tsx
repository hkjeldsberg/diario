export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-9 w-32 bg-stone-200 rounded mb-3" />
      <div className="h-6 w-24 bg-sage/20 rounded mb-8" />
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-dusty-rose/20 p-5 shadow-sm">
            <div className="flex justify-between mb-3">
              <div className="h-4 w-40 bg-stone-200 rounded" />
              <div className="h-4 w-24 bg-stone-100 rounded" />
            </div>
            <div className="h-5 w-2/3 bg-stone-200 rounded mb-4" />
            <div className="flex gap-6">
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-stone-100 rounded" />
                <div className="h-3 bg-stone-100 rounded w-5/6" />
                <div className="h-3 bg-stone-100 rounded w-4/6" />
                <div className="h-3 bg-stone-100 rounded w-3/4" />
              </div>
              <div className="hidden md:flex w-2/5 gap-2">
                <div className="flex-1 bg-stone-100 rounded-lg" style={{ minHeight: 140 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
