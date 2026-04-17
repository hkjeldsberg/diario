'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Feil passord')
      }
    } catch {
      setError('Noe gikk galt. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Title */}
        <h1 className="font-display text-4xl text-terracotta text-center mb-2">
          Diario
        </h1>
        <p className="font-handwritten text-sage text-center text-xl mb-10">
          Minnebok
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-dusty-rose/30 p-8">
          <label htmlFor="password" className="block font-body text-stone-600 mb-2 text-sm">
            Passord
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-cream-dark rounded-lg px-4 py-3 bg-cream/50 font-body text-stone-800 focus:outline-none focus:ring-2 focus:ring-dusty-rose/50 mb-4"
            placeholder="Skriv inn passord..."
            autoFocus
            required
          />

          {error && (
            <p className="text-terracotta text-sm font-body mb-4" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-terracotta text-cream font-body rounded-lg py-3 hover:bg-terracotta/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Logger inn...' : 'Logg inn'}
          </button>
        </form>
      </div>
    </main>
  )
}
