import { EmailMessage } from '@/lib/types'
import EmailCard from '@/components/ui/EmailCard'

async function getEmails(): Promise<{ emails: EmailMessage[]; error?: string }> {
  try {
    const { fetchEmails } = await import('@/lib/gmail')
    const emails = await fetchEmails()
    return { emails }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Postboks] fetchEmails threw:', msg)
    return { emails: [], error: msg }
  }
}

export default async function PostboksPage() {
  const { emails, error } = await getEmails()
  const displayEmails = emails

  return (
    <div>
      <h2 className="font-display text-3xl text-stone-800 mb-2">Postboks</h2>
      <p className="font-handwritten text-sage text-xl mb-8">Brev til deg</p>

      {error && (
        <p className="font-body text-stone-400 text-sm mb-4 italic">
          (Gmail-feil: {error})
        </p>
      )}

      {displayEmails.map((email) => (
        <EmailCard key={email.id} email={email} />
      ))}
    </div>
  )
}
