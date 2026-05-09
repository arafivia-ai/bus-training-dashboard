import chokidar from 'chokidar'
import { readFile } from 'fs/promises'
import fetch from 'node-fetch'

const API_URL  = 'https://bus-training-api.onrender.com'
const USERNAME = 'admin'
const PASSWORD = 'admin123'

const WATCH_FILES = [
  { path: 'D:\\PBI\\CSV file\\In service Master sheet.csv',  type: 'inservice' },
  { path: 'D:\\PBI\\CSV file\\Pre service Master.csv',       type: 'preservice' },
  { path: 'D:\\PBI\\CSV file\\Recruitment Master.csv',       type: 'recruitment' },
]

let token = null

async function login() {
  console.log('Logging in...')
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  })
  const data = await res.json()
  if (!data.token) throw new Error('Login failed: ' + JSON.stringify(data))
  token = data.token
  console.log('Login OK')
}

async function uploadFile(filePath, type) {
  try {
    console.log(`\n[${new Date().toLocaleTimeString()}] Detected change: ${type}`)
    const csvData = await readFile(filePath, 'utf8')
    if (!token) await login()

    console.log(`Uploading ${type}...`)
    const res = await fetch(`${API_URL}/api/upload/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, csvData })
    })

    if (res.status === 401) {
      token = null
      await login()
      return uploadFile(filePath, type)
    }

    const data = await res.json()
    if (data.ok) {
      console.log(`SUCCESS: ${data.inserted} inserted, ${data.skipped} skipped, ${data.total} total`)
    } else {
      console.error('FAILED:', data.error)
    }
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
  console.log('\nWatching files:')
  WATCH_FILES.forEach(({ path, type }) => {
    console.log(`  ${type}: ${path}`)
    chokidar.watch(path, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 3000, pollInterval: 500 }
    }).on('change', () => handleChange(path, type))
  })
  console.log('\nReady. Save any CSV file to auto-upload.\n')
}

start().catch(err => { console.error(err.message); process.exit(1) })