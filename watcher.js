import chokidar from 'chokidar'
import { readFile } from 'fs/promises'

const API_URL  = 'https://bus-training-api.onrender.com'
const USERNAME = 'admin'
const PASSWORD = 'admin123'

const WATCH_FILES = [
  { path: 'D:\\PBI\\CSV file\\In service Master sheet.csv',  type: 'inservice' },
  { path: 'D:\\PBI\\CSV file\\Pre service Master.csv',       type: 'preservice' },
  { path: 'D:\\PBI\\CSV file\\Recruitment Master.csv',       type: 'recruitment' },
  { path: 'D:\\PBI\\CSV file\\Taxi & Limousine Master.csv',  type: 'taxi' },
]

const CHUNK_SIZE = 2000
let token = null

async function login() {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  })
  const data = await res.json()
  if (!data.token) throw new Error('Login failed')
  token = data.token
  console.log('Login OK')
}

async function uploadChunk(type, csvHeader, rows) {
  const csvData = csvHeader + '\n' + rows.join('\n')
  const res = await fetch(`${API_URL}/api/upload/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ type, csvData })
  })
  if (res.status === 401) { token = null; await login(); return uploadChunk(type, csvHeader, rows) }
  return await res.json()
}

async function uploadFile(filePath, type) {
  try {
    console.log(`\n[${new Date().toLocaleTimeString()}] Change detected: ${type}`)
    const text = await readFile(filePath, 'utf8')
    const lines = text.split('\n').filter(l => l.trim())
    const header = lines[0]
    const dataLines = lines.slice(1)
    console.log(`${dataLines.length} rows — uploading...`)

    let totalInserted = 0, totalSkipped = 0

    for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
      const chunk = dataLines.slice(i, i + CHUNK_SIZE)
      const result = await uploadChunk(type, header, chunk)
      if (result.ok) { totalInserted += result.inserted; totalSkipped += result.skipped }
      await new Promise(r => setTimeout(r, 300))
    }

    console.log(`DONE: ${totalInserted} inserted, ${totalSkipped} skipped`)
  } catch (err) {
    console.error('Error:', err.message)
    token = null
  }
}

const timers = {}
function handleChange(filePath, type) {
  if (timers[type]) clearTimeout(timers[type])
  timers[type] = setTimeout(() => uploadFile(filePath, type), 3000)
}

async function start() {
  await login()
  console.log('\nWatching files for changes:')
  WATCH_FILES.forEach(({ path, type }) => {
    console.log(`  [${type}] ${path}`)
    chokidar.watch(path, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 3000, pollInterval: 500 }
    }).on('change', () => handleChange(path, type))
  })
  console.log('\nReady. Save any CSV file to auto-upload to dashboard.\n')
}

start().catch(err => { console.error(err.message); process.exit(1) })