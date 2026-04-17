#!/usr/bin/env node
/**
 * OCR Import Script
 *
 * Transcribes a photo of handwritten diary text using Claude's vision API,
 * lets you review/edit it, then saves it as a diary entry in Supabase.
 *
 * Usage:
 *   node scripts/ocr-import.js <photo-path> --date <YYYY-MM-DD>
 *
 * Example:
 *   node scripts/ocr-import.js ./photos/page1.jpg --date 2024-03-15
 */

require('dotenv').config({ path: '.env.local' })

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const Anthropic = require('@anthropic-ai/sdk').default
const { createClient } = require('@supabase/supabase-js')

// ─── Parse args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const photoPath = args[0]
const dateIdx = args.indexOf('--date')
const dateArg = dateIdx !== -1 ? args[dateIdx + 1] : null

if (!photoPath || !dateArg) {
  console.error('Usage: node scripts/ocr-import.js <photo-path> --date <YYYY-MM-DD>')
  console.error('Example: node scripts/ocr-import.js ./photo.jpg --date 2024-03-15')
  process.exit(1)
}

if (!fs.existsSync(photoPath)) {
  console.error(`File not found: ${photoPath}`)
  process.exit(1)
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error(`Invalid date format: ${dateArg} — use YYYY-MM-DD`)
  process.exit(1)
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function editInEditor(text) {
  // Write to a temp file, open in default editor, read back
  const tmp = path.join(require('os').tmpdir(), `diario-ocr-${Date.now()}.txt`)
  fs.writeFileSync(tmp, text, 'utf8')

  const editor = process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'nano')
  const { execSync } = require('child_process')

  try {
    execSync(`${editor} "${tmp}"`, { stdio: 'inherit' })
  } catch {
    // Notepad on Windows returns non-zero sometimes — ignore
  }

  const edited = fs.readFileSync(tmp, 'utf8')
  fs.unlinkSync(tmp)
  return edited
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Read image
  const imageBuffer = fs.readFileSync(photoPath)
  const base64 = imageBuffer.toString('base64')
  const ext = path.extname(photoPath).toLowerCase()
  const mediaTypeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' }
  const mediaType = mediaTypeMap[ext] || 'image/jpeg'

  console.log(`\n📷 Transcribing ${path.basename(photoPath)} (${dateArg})...`)

  // 2. Send to Claude for transcription
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
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
            text: 'This is a photo of a handwritten diary entry. Please transcribe the text exactly as written, preserving line breaks and paragraph structure. Output only the transcribed text — no commentary, no quotes around it.',
          },
        ],
      },
    ],
  })

  const transcribed = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  if (!transcribed) {
    console.error('No text could be extracted from the image.')
    process.exit(1)
  }

  // 3. Show transcription and ask what to do
  console.log('\n─────────────────────────────────────────')
  console.log('Transcribed text:\n')
  console.log(transcribed)
  console.log('\n─────────────────────────────────────────')

  const action = await ask('\nSave as-is (s), edit first (e), or discard (d)? [s/e/d]: ')

  let finalText = transcribed

  if (action.toLowerCase() === 'd') {
    console.log('Discarded.')
    process.exit(0)
  }

  if (action.toLowerCase() === 'e') {
    finalText = await editInEditor(transcribed)
    console.log('\nEdited text:\n')
    console.log(finalText)
    const confirm = await ask('\nSave this? [y/n]: ')
    if (confirm.toLowerCase() !== 'y') {
      console.log('Discarded.')
      process.exit(0)
    }
  }

  // 4. Save to Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { db: { schema: 'sofia' } }
  )

  const { data, error } = await supabase
    .from('entries')
    .insert({ date: dateArg, text: finalText, media_urls: [] })
    .select()
    .single()

  if (error) {
    console.error('\nFailed to save to Supabase:', error.message)
    process.exit(1)
  }

  console.log(`\n✓ Entry saved (id: ${data.id})`)
  console.log(`  Date: ${data.date}`)
  console.log(`  Text: ${finalText.slice(0, 80)}${finalText.length > 80 ? '...' : ''}`)
}

main().catch((err) => {
  console.error('\nError:', err.message)
  process.exit(1)
})
