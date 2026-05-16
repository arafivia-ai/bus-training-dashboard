// This script reads Excel files directly and uploads to dashboard
// Run this instead of watcher.js for Excel files

import { readFile } from 'fs/promises'
import { watch } from 'fs'

const XLSX = await import('./node_modules/xlsx/xlsx.mjs').catch(() => {
  const { default: x } = require('./node_modules/xlsx')
  return { default: x }
})

const API_URL  = 'https://bus-training-api.onrender.com'
const USERNAME = 'admin'
const PASSWORD = 'admin123'

const WATCH_FILES = [
  {
    path: 'D:\\PBI\\In service power BI project.xlsx',
    type: 'inservice',
    sheet: 0,
    headerRow: 0
  },
  {
    path: 'D:\\PBI\\Pre service PBI.xlsx',
    type: 'preservice',
    sheet: 0,
    headerRow: 0
  },
  {
    path: 'D:\\PBI\\Recruitment_PB_PowerBI_Ready_2025.xlsx',
    type: 'recruitment',
    sheet: '🧹 Recruitment_Clean',
    headerRow: 1
  },
  {
    path: 'D:\\PBI\\Update version PBI\\Taxi_Limousine_Cleaned_PBI.xlsx',
    type: 'taxi',
    sheet: 0,
    headerRow: 0
  },
]

const CHUNK_SIZE = 1000
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

function readExcel(filePath, sheetIndex, headerRow) {
  const XLSX = require('./node_modules/xlsx')
  const wb = XLSX.readFile(filePath, { cellDates: true })
  const ws = typeof sheetIndex === 'string'
    ? wb.Sheets[sheetIndex]
    : wb.Sheets[wb.SheetNames[sheetIndex]]
  const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
  const headers = allRows[headerRow]
  const dataRows = allRows.slice(headerRow + 1).filter(r => r.some(v => v !== null && v !== ''))
  return { headers, dataRows }
}

function formatDate(val) {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().split('T')[0]
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000)
    return date.toISOString().split('T')[0]
  }
  const str = val.toString().trim()
  const mo = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11}
  const p = str.split('-')
  if (p.length === 3) {
    let d = parseInt(p[0]), m = mo[p[1]?.toLowerCase()], y = parseInt(p[2])
    if (!isNaN(d) && m !== undefined && !isNaN(y)) {
      if (y < 100) y += 2000
      return new Date(y, m, d).toISOString().split('T')[0]
    }
  }
  const t = Date.parse(str)
  return isNaN(t) ? null : new Date(t).toISOString().split('T')[0]
}

function mapRow(type, headers, row) {
  const r = {}
  headers.forEach((h, i) => { if (h) r[h] = row[i] })

  if (type === 'inservice') return {
    sl:            parseInt(r['SL']) || null,
    training_date: formatDate(r['Training Date']),
    staff_id:      r['Staff ID']?.toString().trim() || null,
    driver_name:   r['Driver Name']?.toString().trim() || null,
    nationality:   r['Nationality']?.toString().trim() || null,
    depot:         r['Depot']?.toString().trim() || null,
    training_type: r['Type of Training']?.toString().trim() || null,
    course_name:   r['Training Course Name']?.toString().trim() || null,
    duration:      r['Duration']?.toString().trim() || null,
    trainer:       r['Trainer']?.toString().trim() || null,
    attendance:    r['Attendance']?.toString().trim() || null,
  }

  if (type === 'preservice') return {
    sl:                       parseInt(r['SL']) || null,
    rta_id:                   r['RTA ID ']?.toString().trim() || r['RTA ID']?.toString().trim() || null,
    license_no:               r['License No.']?.toString().trim() || null,
    driver_name:              r['Driver Name']?.toString().trim() || null,
    nationality:              r['Nationality']?.toString().trim() || null,
    dob:                      formatDate(r['DOB']),
    license_issued:           formatDate(r['Date of issued']),
    license_expired:          formatDate(r['Date of expired']),
    place_of_issue:           r['Place of issue']?.toString().trim() || null,
    traffic_file:             r['Traffic file no']?.toString().trim() || null,
    contact:                  r['Contact']?.toString().trim() || null,
    age:                      parseFloat(r['Age']) || null,
    company:                  r['Company']?.toString().trim() || null,
    road_test_date:           formatDate(r['Date of Road test']),
    trainer_name:             r['Name of Trainer']?.toString().trim() || null,
    interview_date:           formatDate(r['Date of Interview']),
    mode_of_hire:             r['Mode of Hire']?.toString().trim() || null,
    payment_date:             formatDate(r['Payment Date']),
    sales_order:              r['Sales Order #']?.toString().trim() || null,
    revenue:                  r['Revenue']?.toString().trim() || null,
    join_date:                formatDate(r['Join Date']),
    training_batch:           r['Training Batch']?.toString().trim() || null,
    trainer_classroom:        r['Name of trainer -  Class Room']?.toString().trim() || null,
    trainer_wheel:            r['Name of Trainer - Behind the wheel']?.toString().trim() || null,
    post_etest_date:          formatDate(r['Date of Post e test']),
    post_etest_result:        r[' Post E test']?.toString().trim() || null,
    occ_date:                 formatDate(r['Date of OCC']),
    occ_result:               r['OCC']?.toString().trim() || null,
    training_date:            formatDate(r['Date']),
    fire_fighting:            r['Fire Fighting']?.toString().trim() || null,
    road_assessment_date:     formatDate(r['Date of Road Asssesment']),
    final_assessment_trainer: r['Final Asssement Trainer']?.toString().trim() || null,
    final_assessment:         r['Final assesment']?.toString().trim() || null,
    scenario_date:            formatDate(r['Date of Scenario']),
    scenario_result:          r['Scenario Result']?.toString().trim() || null,
    graduation_date:          formatDate(r['Graduation date']),
    number_of_days:           parseInt(r['Number of Days']) || null,
    transfer_date:            formatDate(r['Date of transfer operation ']),
    status:                   r['Status']?.toString().trim() || null,
    notes:                    r['Additional notes Regarding training']?.toString().trim() || null,
    weekly_report:            r['weekly Report']?.toString().trim() || null,
    weekly_report2:           r['weekly Report 2']?.toString().trim() || null,
  }

  if (type === 'recruitment') return {
    sl:               parseInt(r['SL']) || null,
    rta_id:           r['RTA ID']?.toString().trim() || null,
    license_no:       r['License No.']?.toString().trim() || null,
    full_name:        r['Name as per Driving License']?.toString().trim() || null,
    nationality:      r['Nationality']?.toString().trim() || null,
    dob:              formatDate(r['DOB']),
    age:              parseFloat(r['Age']) || null,
    license_issued:   formatDate(r['Date of issued']),
    license_expired:  formatDate(r['Date of expired']),
    place_of_issue:   r['Place of issue']?.toString().trim() || null,
    license_class:    r['Class of License']?.toString().trim() || null,
    traffic_file:     r['Traffic file no']?.toString().trim() || null,
    contact:          r['Contact']?.toString().trim() || null,
    company:          r['Company']?.toString().trim() || null,
    road_test_date:   formatDate(r['Date of Road test']),
    road_test_result: r['Road Test Result']?.toString().trim() || null,
    interview_date:   formatDate(r['Date of Interview']),
    interview_result: r['Interview Result']?.toString().trim() || null,
    status:           r['Status 1']?.toString().trim() || null,
    remarks:          r['Remarks']?.toString().trim() || null,
    training_batch:   r['Training Batch']?.toString().trim() || null,
    training_start:   formatDate(r['Date of join Training']),
    graduation_date:  formatDate(r['Date of Graduation']),
    transfer_date:    formatDate(r['Date of Transfer operation']),
  }

  if (type === 'taxi') return {
    sl:             parseInt(r['SL']) || null,
    license:        r['License']?.toString().trim() || null,
    full_name:      r['Name']?.toString().trim() || null,
    nationality:    r['Nationality']?.toString().trim() || null,
    franchise:      r['Franchise/Limousine']?.toString().trim() || null,
    traffic_file:   r['Traffic File']?.toString().trim() || null,
    company:        r['Company']?.toString().trim() || null,
    institute:      r['Institute']?.toString().trim() || null,
    training_type:  r['Training Type']?.toString().trim() || null,
    apply_date:     formatDate(r['Apply Date']),
    training_start: formatDate(r['Training Start']),
    training_end:   formatDate(r['Training End']),
    attendance:     r['Attendance']?.toString().trim() || null,
  }

  return null
}

async function uploadBatch(type, rows) {
  if (!token) await login()
  const res = await fetch(`${API_URL}/api/upload/excel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ type, rows })
  })
  if (res.status === 401) { token = null; await login(); return uploadBatch(type, rows) }
  return await res.json()
}

async function processFile(filePath, type, sheetIndex, headerRow) {
  try {
    console.log(`\n[${new Date().toLocaleTimeString()}] Processing [${type}]...`)
    const { headers, dataRows } = readExcel(filePath, sheetIndex, headerRow)
    console.log(`  ${dataRows.length} rows found`)

    let inserted = 0, skipped = 0

    for (let i = 0; i < dataRows.length; i += CHUNK_SIZE) {
      const chunk = dataRows.slice(i, i + CHUNK_SIZE)
      const mapped = chunk.map(row => mapRow(type, headers, row)).filter(r => r !== null)
      const result = await uploadBatch(type, mapped)
      if (result?.ok) {
        inserted += result.inserted
        skipped += result.skipped
        process.stdout.write('.')
      }
      await new Promise(r => setTimeout(r, 200))
    }

    console.log(`\n  DONE: ${inserted} inserted, ${skipped} skipped`)
  } catch(e) {
    console.error(`  ERROR: ${e.message}`)
  }
}

const timers = {}
function handleChange(file) {
  if (timers[file.type]) clearTimeout(timers[file.type])
  timers[file.type] = setTimeout(() => {
    processFile(file.path, file.type, file.sheet, file.headerRow)
  }, 3000)
}

async function start() {
  console.log('Bus Training Dashboard — Excel Auto-Sync')
  console.log('==========================================')
  await login()

  console.log('\nWatching Excel files:')
  WATCH_FILES.forEach(file => {
    console.log(`  [${file.type}] ${file.path}`)
    watch(file.path, () => handleChange(file))
  })

  console.log('\nReady! Edit any Excel file and save — dashboard updates automatically.\n')
}

start().catch(err => { console.error(err.message); process.exit(1) })