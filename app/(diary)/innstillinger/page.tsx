import { hasToken } from '@/lib/token-store'
import ConnectButton from './ConnectButton'

export default async function InnstillingerPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string }
}) {
  const [gmailOk, photosOk, photosPartnerOk] = await Promise.all([
    hasToken('gmail', 'primary'),
    hasToken('photos', 'primary'),
    hasToken('photos', 'partner'),
  ])

  const connections = [
    {
      label: 'Gmail',
      description: 'Tilgang til innboks for Postboks-funksjonen',
      service: 'gmail',
      userId: 'primary',
      connected: gmailOk,
    },
    {
      label: 'Google Foto (deg)',
      description: 'Bildevalgsfunksjon for dine bilder',
      service: 'photos',
      userId: 'primary',
      connected: photosOk,
    },
    {
      label: 'Google Foto (partner)',
      description: 'Bildevalgsfunksjon for partnerens bilder',
      service: 'photos',
      userId: 'partner',
      connected: photosPartnerOk,
    },
  ]

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="font-display text-2xl text-terracotta">Innstillinger</h2>

      {searchParams.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Tilkobling mislyktes: {searchParams.error}
        </div>
      )}

      {searchParams.connected && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Tilkobling vellykket
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-body text-sm font-medium text-stone-500 uppercase tracking-wide">
          Google-tilkoblinger
        </h3>
        {connections.map((conn) => (
          <div
            key={`${conn.service}_${conn.userId}`}
            className="flex items-center justify-between rounded-xl border border-dusty-rose/30 bg-white/60 px-5 py-4"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-body text-sm font-medium text-stone-700">{conn.label}</span>
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    conn.connected ? 'bg-green-400' : 'bg-stone-300'
                  }`}
                />
              </div>
              <p className="font-body text-xs text-stone-400">{conn.description}</p>
            </div>
            <ConnectButton service={conn.service} userId={conn.userId} connected={conn.connected} />
          </div>
        ))}
      </div>
    </div>
  )
}
