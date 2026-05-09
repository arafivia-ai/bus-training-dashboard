import { readFile } from 'fs/promises'

const API_URL  = 'https://bus-training-api.onrender.com'
const USERNAME = 'admin'
const PASSWORD = 'admin123'

const FILES = [
  { path: 'D:\\PBI\\CSV file\\In service Master sheet.csv',  type: 'inservice' },
  { path: 'D:\\PBI\\CSV file\\Pre service Master.csv',       type: 'preservice' },
  { path: 'D:\\PBI\\CSV file\\Recruitment Master.csv',       type: 'recruitment' },
]

async function main() {
  // Login
  console.log('Logging in...')
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  })
  const { token } = await loginRes.json()
  if (!token) { console.error('Login failed'); process.exit(1) }
  console.log('Login OK\n')

  for (const { path, type } of FILES) {
    console.log(`Importing ${type} from ${path}...`)
    const csvData = await readFile(path, 'utf8')
    console.log(`File size: ${(csvData.length/1024).toFixed(1)} KB`)

    const res = await fetch(`${API_URL}/api/upload/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, csvData })
    })

    const data = await res.json()
    if (data.ok) {
      console.log(`SUCCESS: ${data.inserted} inserted, ${data.skipped} skipped out of ${data.total} total`)
    } else {
      console.error(`FAILED: ${data.error}`)
    }
    console.log('')
  }
}

main().catch(console.error)