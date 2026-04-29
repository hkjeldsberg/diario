'use client'

interface Props {
  service: string
  userId: string
  connected: boolean
}

export default function ConnectButton({ service, userId, connected }: Props) {
  const href = `/api/auth/google/connect?service=${service}&userId=${userId}`

  return (
    <a
      href={href}
      className={`
        font-body text-xs px-4 py-2 rounded-lg border transition-colors whitespace-nowrap
        ${connected
          ? 'border-dusty-rose/40 text-stone-500 hover:border-terracotta hover:text-terracotta'
          : 'border-terracotta bg-terracotta text-white hover:bg-terracotta/90'
        }
      `}
    >
      {connected ? 'Koble til på nytt' : 'Koble til'}
    </a>
  )
}
