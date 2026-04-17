#!/usr/bin/env node
/**
 * OCR Import Script — Batch Mode
 *
 * Scans diary_img/ for handwritten diary photos, transcribes them via Claude,
 * then uses a second Claude pass to extract and group entries by date.
 * Handles pages with multiple dates AND entries that span multiple pages.
 * Lets you review/edit each entry before saving to Supabase.
 *
 * Usage:
 *   node scripts/ocr-import.js [--dir <path>]
 *
 * Options:
 *   --dir   Image directory (default: diary_img/)
 */

require('dotenv').config({ path: '.env.local' })

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const Anthropic = require('@anthropic-ai/sdk').default
const { createClient } = require('@supabase/supabase-js')

// ─── Config ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dirIdx = args.indexOf('--dir')
const imageDir = dirIdx !== -1 ? args[dirIdx + 1] : 'img/jpg'

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const MEDIA_TYPE_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

// ─── Validate env ─────────────────────────────────────────────────────────────

const missingEnv = []
if (!process.env.ANTHROPIC_API_KEY) missingEnv.push('ANTHROPIC_API_KEY')
if (!process.env.SUPABASE_URL) missingEnv.push('SUPABASE_URL')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY')

if (missingEnv.length > 0) {
  console.error(`Missing environment variables in .env.local:\n  ${missingEnv.join('\n  ')}`)
  process.exit(1)
}

const birthDate = process.env.BIRTH_DATE || '2024-11-01'
const birthYear = parseInt(birthDate.split('-')[0])

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()))
  })
}

function closeRl() {
  rl.close()
}

async function editInEditor(text) {
  const tmp = path.join(require('os').tmpdir(), `diario-ocr-${Date.now()}.txt`)
  fs.writeFileSync(tmp, text, 'utf8')
  const editor = process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'nano')
  const { execSync } = require('child_process')
  try {
    execSync(`${editor} "${tmp}"`, { stdio: 'inherit' })
  } catch {
    // notepad on Windows exits non-zero — ignore
  }
  const edited = fs.readFileSync(tmp, 'utf8').trim()
  fs.unlinkSync(tmp)
  return edited
}

function hr(char = '─', width = 60) {
  console.log(char.repeat(width))
}

// ─── Step 1: Collect images ───────────────────────────────────────────────────

function collectImages(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Image directory not found: ${dir}`)
    process.exit(1)
  }
  const files = fs.readdirSync(dir)
    .filter(f => SUPPORTED_EXTS.has(path.extname(f).toLowerCase()))
    .sort()  // alphabetical = chronological
  if (files.length === 0) {
    console.error(`No images found in ${dir}/ (supported: jpg, jpeg, png, webp, gif)`)
    process.exit(1)
  }
  return files.map(f => path.join(dir, f))
}

// ─── Step 2: Transcribe each image ───────────────────────────────────────────

async function transcribePage(client, imagePath) {
  const buffer = fs.readFileSync(imagePath)
  const base64 = buffer.toString('base64')
  const ext = path.extname(imagePath).toLowerCase()
  const mediaType = MEDIA_TYPE_MAP[ext] || 'image/jpeg'

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: [
              'This is a page from a handwritten diary.',
              'Transcribe ALL text exactly as written — including any date headers,',
              'headings, or labels you see at the top or within the page.',
              'Preserve paragraph breaks and line structure.',
              'Output only the transcribed text. No commentary, no quotes.',
            ].join(' '),
          },
        ],
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}

// ─── Step 3: Parse and group by date ─────────────────────────────────────────

async function parseIntoEntries(client, pages) {
  const combined = pages
    .map((text, i) => `=== PAGE ${i + 1} ===\n${text}`)
    .join('\n\n')

  const prompt = `You are parsing a Norwegian baby/child diary. The text below was transcribed from ${pages.length} handwritten page(s) in chronological order. Pages are separated by "=== PAGE N ===".

Child's birth date: ${birthDate}
Likely years covered: ${birthYear}–${birthYear + 2}

Rules:
1. Find every date header in the text. Norwegian formats: "15. november", "15. nov", "15/11", "15.11.2024", "15. november 2024", "tirsdag 15. november", etc.
2. All text below a date header (until the next date header or end of input) belongs to that date — even if it continues across page boundaries.
3. If a page has no date header at the top, its text continues the previous date.
4. If text appears before the very first date header, mark it with date "unknown".
5. Infer the year from context. Assume entries run from ${birthDate} forward. If not clear, use ${birthYear} for the first year and ${birthYear + 1} for later entries.
6. Do NOT include the date header line itself in the entry text.
7. Merge all text for the same date into a single entry (joining with a blank line between page segments).
8. Return ONLY a valid JSON array — no markdown fences, no explanation.

Format:
[
  { "date": "YYYY-MM-DD", "text": "diary content" },
  ...
]

Transcribed pages:

${combined}`

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'

  // Strip markdown code fences if Claude wrapped the JSON
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.error('\nCould not find JSON array in Claude response. Raw output:')
    console.error(raw.slice(0, 500))
    process.exit(1)
  }

  try {
    const entries = JSON.parse(jsonMatch[0])
    // Sort by date, unknowns last
    return entries.sort((a, b) => {
      if (a.date === 'unknown') return 1
      if (b.date === 'unknown') return -1
      return a.date.localeCompare(b.date)
    })
  } catch (e) {
    console.error('\nFailed to parse JSON:', e.message)
    console.error('Raw match:', jsonMatch[0].slice(0, 500))
    process.exit(1)
  }
}

// ─── Step 4: Interactive review ───────────────────────────────────────────────

async function reviewEntries(entries) {
  const confirmed = []

  console.log(`\nExtracted ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}:\n`)
  entries.forEach((e, i) => {
    const preview = e.text.replace(/\n+/g, ' ').slice(0, 65)
    const ellipsis = e.text.length > 65 ? '…' : ''
    console.log(`  ${String(i + 1).padStart(2)}. ${e.date.padEnd(12)}  ${preview}${ellipsis}`)
  })

  console.log()
  const bulk = await ask('Save all (s), review each (r), or abort (a)? [s/r/a]: ')

  if (bulk.toLowerCase() === 'a') {
    console.log('Aborted.')
    closeRl()
    process.exit(0)
  }

  if (bulk.toLowerCase() === 's') {
    closeRl()
    return entries
  }

  // Review one by one
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]

    hr()
    console.log(`Entry ${i + 1} / ${entries.length}  —  Date: ${entry.date}\n`)
    console.log(entry.text)
    hr()
    console.log('\n  [s] save   [e] edit text   [c] change date   [x] skip   [q] quit\n')

    const action = await ask('Action: ')

    if (action === 'q' || action === 'Q') {
      console.log(`\nStopped. ${confirmed.length} entries queued for saving.`)
      break
    }

    if (action === 'x' || action === 'X') {
      console.log('  Skipped.')
      continue
    }

    if (action === 'c' || action === 'C') {
      const newDate = await ask(`  New date [YYYY-MM-DD, current: ${entry.date}]: `)
      if (/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        entry.date = newDate
        console.log(`  Date set to ${entry.date}.`)
      } else {
        console.log('  Invalid format — date unchanged.')
      }
      confirmed.push(entry)
      continue
    }

    if (action === 'e' || action === 'E') {
      console.log('  Opening editor...')
      entry.text = await editInEditor(entry.text)
      console.log('  Updated.')
      // Optionally also change date after editing
      const changeDate = await ask(`  Change date too? [y/n, current: ${entry.date}]: `)
      if (changeDate.toLowerCase() === 'y') {
        const newDate = await ask('  New date [YYYY-MM-DD]: ')
        if (/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
          entry.date = newDate
        } else {
          console.log('  Invalid format — date unchanged.')
        }
      }
    }

    confirmed.push(entry)
  }

  closeRl()
  return confirmed
}

// ─── Step 5: Insert into Supabase ─────────────────────────────────────────────

async function insertEntries(entries) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { db: { schema: 'sofia' } }
  )

  let saved = 0
  let failed = 0

  for (const entry of entries) {
    const { data, error } = await supabase
      .from('entries')
      .insert({ date: entry.date, text: entry.text, media_urls: [] })
      .select()
      .single()

    if (error) {
      console.error(`  ✗ ${entry.date}: ${error.message}`)
      failed++
    } else {
      const preview = entry.text.replace(/\n+/g, ' ').slice(0, 50)
      console.log(`  ✓ ${data.date}  (id: ${data.id})  ${preview}${entry.text.length > 50 ? '…' : ''}`)
      saved++
    }
  }

  return { saved, failed }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📓 Diario OCR Import — Batch Mode')
  console.log(`   Directory: ${imageDir}/`)
  console.log(`   Birth date: ${birthDate}\n`)

  // 1. Collect
  const imagePaths = collectImages(imageDir)
  console.log(`Found ${imagePaths.length} image(s):`)
  imagePaths.forEach((p, i) => console.log(`  ${i + 1}. ${path.basename(p)}`))

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // 2. Transcribe
  console.log('\nTranscribing pages...')
  const pages = []
  for (const imgPath of imagePaths) {
    process.stdout.write(`  ${path.basename(imgPath)}... `)
    const text = await transcribePage(client, imgPath)
    if (!text) {
      console.log('(no text — skipped)')
    } else {
      console.log(`✓  ${text.length} chars`)
      pages.push({ file: path.basename(imgPath), text })
    }
  }

  if (pages.length === 0) {
    console.error('\nNo text could be extracted from any image.')
    process.exit(1)
  }

  // 3. Parse into dated entries
  console.log('\nExtracting dated entries...')
  const entries = await parseIntoEntries(client, pages.map(p => p.text))
  console.log(`  → ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} found`)

  if (entries.length === 0) {
    console.error('No entries could be parsed. Check the transcribed text and try again.')
    process.exit(1)
  }

  // 4. Review
  const confirmed = await reviewEntries(entries)

  if (confirmed.length === 0) {
    console.log('\nNothing to save. Done.')
    process.exit(0)
  }

  // 5. Insert
  console.log(`\nSaving ${confirmed.length} entr${confirmed.length === 1 ? 'y' : 'ies'} to Supabase...`)
  const { saved, failed } = await insertEntries(confirmed)

  console.log(`\n${saved} saved${failed > 0 ? `, ${failed} failed` : ''}. Done.`)
}

main().catch((err) => {
  closeRl()
  console.error('\nError:', err.message)
  process.exit(1)
})
