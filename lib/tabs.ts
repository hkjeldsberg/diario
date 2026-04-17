export interface TabDefinition {
  key: string
  href: string
  label: string
  getDateRange?: (birthDate: Date) => { from: Date; to: Date }
}

export const TAB_DEFINITIONS: TabDefinition[] = [
  {
    key: 'de-forste-dagene',
    href: '/de-forste-dagene',
    label: 'De første dagene',
    getDateRange: (birthDate) => ({
      from: new Date(birthDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      to: new Date(birthDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    }),
  },
  {
    key: 'de-forste-ukene',
    href: '/de-forste-ukene',
    label: 'De første ukene',
    getDateRange: (birthDate) => ({
      from: new Date(birthDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      to: new Date(birthDate.getTime() + 56 * 24 * 60 * 60 * 1000),
    }),
  },
  {
    key: 'de-forste-maanedene',
    href: '/de-forste-maanedene',
    label: 'De første månedene',
    getDateRange: (birthDate) => ({
      from: new Date(birthDate.getTime() + 56 * 24 * 60 * 60 * 1000),
      to: new Date(birthDate.getTime() + 365 * 24 * 60 * 60 * 1000),
    }),
  },
  {
    key: 'de-forste-aarene',
    href: '/de-forste-aarene',
    label: 'De første årene',
    getDateRange: (birthDate) => ({
      from: new Date(birthDate.getTime() + 365 * 24 * 60 * 60 * 1000),
      to: new Date(birthDate.getTime() + 1825 * 24 * 60 * 60 * 1000),
    }),
  },
  {
    key: 'postboks',
    href: '/postboks',
    label: 'Postboks',
  },
  {
    key: 'din-ordbok',
    href: '/din-ordbok',
    label: 'Din ordbok',
  },
]

export function getBirthDate(): Date {
  const raw = process.env.BIRTH_DATE
  if (!raw) {
    throw new Error('BIRTH_DATE environment variable is not set')
  }
  const parsed = new Date(raw)
  if (isNaN(parsed.getTime())) {
    throw new Error(`BIRTH_DATE "${raw}" is not a valid ISO date string`)
  }
  return parsed
}

export function getTabByKey(key: string): TabDefinition | undefined {
  return TAB_DEFINITIONS.find((t) => t.key === key)
}

export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0]
}
