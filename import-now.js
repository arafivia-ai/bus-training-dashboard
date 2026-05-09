import { readFile } from 'fs/promises'

const API_URL  = 'https://bus-training-api.onrender.com'
const USERNAME = 'admin'
const PASSWORD = 'admin123'

const FILES = [
  { path: 'D:\\PBI\\CSV file\\Pre service Master.csv',  type: 'preservice' },
  { path: 'D:\\PBI\\CSV file\\Recruitment Master.csv',  type: 'recruitment' },
]

const CHUNK_SIZE = 2000

async function login() {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  })
  const data = await res.json()
  if (!data.token) throw new Error('Login failed')
  return data.token
}

async function importFile(token, path, type) {
  console.log(`\nImporting [${type}]...`)
  const text = await readFile(path, 'utf8')
  const lines = text.split('\n').filter(l => l.trim())
  const header = lines[0]
  const dataLines = lines.slice(1)
  console.log(`Total rows: ${dataLines.length}`)

  let totalInserted = 0, totalSkipped = 0

  for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
    const chunk = dataLines.slice(i, i + CHUNK_SIZE)
    const from = i + 1
    const to = Math.min(i + CHUNK_SIZE, dataLines.length)
    process.stdout.write(`  Rows ${from}-${to}... `)

    const csvData = header + '\n' + chunk.join('\n')
    const res = await fetch(`${API_URL}/api/upload/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, csvData })
    })
    const result = await res.json()
    if (result.ok) {
      totalInserted += result.inserted
      totalSkipped += result.skipped
      console.log(`OK (${result.inserted} inserted)`)
    } else {
      console.log(`FAILED: ${result.error}`)
    }
    await new Promise(r => setTimeout(r, 300))
  }
  console.log(`DONE: ${totalInserted} inserted, ${totalSkipped} skipped`)
}

async function main() {
  console.log('Logging in...')
  const token = await login()
  console.log('Login OK')
  for (const { path, type } of FILES) {
    await importFile(token, path, type)
  }
  console.log('\nAll done!')
}

main().catch(console.error)