import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env
try {
  const envFile = readFileSync(join(__dirname, '..', '.env'), 'utf8')
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eq = trimmed.indexOf('=')
    if (eq === -1) return
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  })
} catch(e) { console.log('.env not found, using system env') }

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const JWT_SECRET = process.env.JWT_SECRET

// ── HELPERS ──────────────────────────────────────────────────────────────────
function parseDate(s) {
  if (!s || !s.toString().trim()) return null
  const str = s.toString().trim()
  // Handle Excel serial numbers
  if (!isNaN(str) && str.length < 6) {
    const date = new Date((parseFloat(str) - 25569) * 86400 * 1000)
    return date.toISOString().split('T')[0]
  }
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

function auth(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Invalid token' }) }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'Administrator') return res.status(403).json({ error: 'Admin only' })
  next()
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
    const { data: users } = await supabase.from('users').select('*').eq('username', username).limit(1)
    const user = users?.[0]
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' })
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } })
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }) }
})

// ── USERS ─────────────────────────────────────────────────────────────────────
app.get('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { data } = await supabase.from('users').select('id,username,email,role,created_at').order('created_at')
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, email, password, role } = req.body
    if (!username || !password || password.length < 6) return res.status(400).json({ error: 'Invalid input' })
    const hash = await bcrypt.hash(password, 10)
    const { data, error } = await supabase.from('users').insert([{ username, email, password_hash: hash, role: role || 'Management' }]).select()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('users').delete().eq('id', req.params.id).neq('username', 'admin')
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── PUBLIC BUS IN-SERVICE ─────────────────────────────────────────────────────
app.get('/api/inservice', auth, async (req, res) => {
  try {
    const { depot, training_type, attendance, nationality, from, to, page = 1, limit = 100 } = req.query
    let query = supabase.from('public_bus_inservice').select('*', { count: 'exact' }).eq('is_deleted', false)
    if (depot)         query = query.eq('depot', depot)
    if (training_type) query = query.eq('training_type', training_type)
    if (attendance)    query = query.eq('attendance', attendance)
    if (nationality)   query = query.eq('nationality', nationality)
    if (from)          query = query.gte('training_date', from)
    if (to)            query = query.lte('training_date', to)
    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query.order('training_date', { ascending: false }).range(offset, offset + parseInt(limit) - 1)
    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json({ data, total: count, page: parseInt(page) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/inservice', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('public_bus_inservice').insert([req.body]).select()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/inservice/:id', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('public_bus_inservice').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select()
    if (error) return res.status(400).json({ error: error.message })
    res.json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/inservice/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('public_bus_inservice').update({ is_deleted: true }).eq('id', req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── PUBLIC BUS PRE-SERVICE ────────────────────────────────────────────────────
app.get('/api/preservice', auth, async (req, res) => {
  try {
    const { depot, training_type, attendance, from, to, page = 1, limit = 100 } = req.query
    let query = supabase.from('public_bus_preservice').select('*', { count: 'exact' }).eq('is_deleted', false)
    if (depot)         query = query.eq('depot', depot)
    if (training_type) query = query.eq('training_type', training_type)
    if (attendance)    query = query.eq('attendance', attendance)
    if (from)          query = query.gte('training_date', from)
    if (to)            query = query.lte('training_date', to)
    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query.order('training_date', { ascending: false }).range(offset, offset + parseInt(limit) - 1)
    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json({ data, total: count, page: parseInt(page) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/preservice', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('public_bus_preservice').insert([req.body]).select()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/preservice/:id', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('public_bus_preservice').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select()
    if (error) return res.status(400).json({ error: error.message })
    res.json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/preservice/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('public_bus_preservice').update({ is_deleted: true }).eq('id', req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── RECRUITMENT ───────────────────────────────────────────────────────────────
app.get('/api/recruitment', auth, async (req, res) => {
  try {
    const { status, company, nationality, road_test, page = 1, limit = 100 } = req.query
    let query = supabase.from('recruitment').select('*', { count: 'exact' }).eq('is_deleted', false)
    if (status)    query = query.ilike('status', status)
    if (company)   query = query.ilike('company', company)
    if (nationality) query = query.eq('nationality', nationality)
    if (road_test) query = query.ilike('road_test_result', road_test)
    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1)
    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json({ data, total: count, page: parseInt(page) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/recruitment', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('recruitment').insert([req.body]).select()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/recruitment/:id', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('recruitment').update(req.body).eq('id', req.params.id).select()
    if (error) return res.status(400).json({ error: error.message })
    res.json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/recruitment/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('recruitment').update({ is_deleted: true }).eq('id', req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── SCHOOL BUS DRIVERS ────────────────────────────────────────────────────────
app.get('/api/schoolbus/drivers', auth, async (req, res) => {
  try {
    const { school, training_type, attendance, from, to, page = 1, limit = 100 } = req.query
    let query = supabase.from('school_bus_drivers').select('*', { count: 'exact' }).eq('is_deleted', false)
    if (school)        query = query.eq('school', school)
    if (training_type) query = query.eq('training_type', training_type)
    if (attendance)    query = query.eq('attendance', attendance)
    if (from)          query = query.gte('training_date', from)
    if (to)            query = query.lte('training_date', to)
    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query.order('training_date', { ascending: false }).range(offset, offset + parseInt(limit) - 1)
    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json({ data, total: count, page: parseInt(page) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/schoolbus/drivers', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('school_bus_drivers').insert([req.body]).select()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/schoolbus/drivers/:id', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('school_bus_drivers').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select()
    if (error) return res.status(400).json({ error: error.message })
    res.json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/schoolbus/drivers/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('school_bus_drivers').update({ is_deleted: true }).eq('id', req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── SCHOOL BUS SUPERVISORS ────────────────────────────────────────────────────
app.get('/api/schoolbus/supervisors', auth, async (req, res) => {
  try {
    const { school, training_type, attendance, from, to, page = 1, limit = 100 } = req.query
    let query = supabase.from('school_bus_supervisors').select('*', { count: 'exact' }).eq('is_deleted', false)
    if (school)        query = query.eq('school', school)
    if (training_type) query = query.eq('training_type', training_type)
    if (attendance)    query = query.eq('attendance', attendance)
    if (from)          query = query.gte('training_date', from)
    if (to)            query = query.lte('training_date', to)
    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query.order('training_date', { ascending: false }).range(offset, offset + parseInt(limit) - 1)
    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json({ data, total: count, page: parseInt(page) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/schoolbus/supervisors', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('school_bus_supervisors').insert([req.body]).select()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/schoolbus/supervisors/:id', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('school_bus_supervisors').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select()
    if (error) return res.status(400).json({ error: error.message })
    res.json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/schoolbus/supervisors/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('school_bus_supervisors').update({ is_deleted: true }).eq('id', req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
app.get('/api/analytics', auth, async (req, res) => {
  try {
    const [is, ps, rec, sbd, sbs] = await Promise.all([
      supabase.from('public_bus_inservice').select('depot, training_type, attendance, nationality, training_date').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('depot, training_type, attendance, training_date').eq('is_deleted', false),
      supabase.from('recruitment').select('status, company, nationality, road_test_result').eq('is_deleted', false),
      supabase.from('school_bus_drivers').select('school, training_type, attendance, training_date').eq('is_deleted', false),
      supabase.from('school_bus_supervisors').select('school, training_type, attendance, training_date').eq('is_deleted', false)
    ])

    function countBy(arr, key) {
      const obj = {}
      arr.forEach(r => { const v = r[key] || 'Unknown'; obj[v] = (obj[v] || 0) + 1 })
      return obj
    }

    function attendanceRate(arr) {
      if (!arr.length) return 0
      const present = arr.filter(r => (r.attendance || '').toLowerCase() === 'present').length
      return Math.round(present / arr.length * 100)
    }

    function monthlyTrend(arr, dateField = 'training_date') {
      const obj = {}
      arr.forEach(r => {
        if (!r[dateField]) return
        const month = r[dateField].slice(0, 7)
        obj[month] = (obj[month] || 0) + 1
      })
      return Object.fromEntries(Object.entries(obj).sort())
    }

    res.json({
      inservice: {
        total: is.data.length,
        attendanceRate: attendanceRate(is.data),
        byDepot: countBy(is.data, 'depot'),
        byType: countBy(is.data, 'training_type'),
        byNationality: countBy(is.data, 'nationality'),
        byAttendance: countBy(is.data, 'attendance'),
        trend: monthlyTrend(is.data)
      },
      preservice: {
        total: ps.data.length,
        attendanceRate: attendanceRate(ps.data),
        byDepot: countBy(ps.data, 'depot'),
        byType: countBy(ps.data, 'training_type'),
        byAttendance: countBy(ps.data, 'attendance'),
        trend: monthlyTrend(ps.data)
      },
      recruitment: {
        total: rec.data.length,
        byStatus: countBy(rec.data, 'status'),
        byCompany: countBy(rec.data, 'company'),
        byNationality: countBy(rec.data, 'nationality'),
        byRoadTest: countBy(rec.data, 'road_test_result')
      },
      schoolDrivers: {
        total: sbd.data.length,
        attendanceRate: attendanceRate(sbd.data),
        bySchool: countBy(sbd.data, 'school'),
        byType: countBy(sbd.data, 'training_type'),
        trend: monthlyTrend(sbd.data)
      },
      schoolSupervisors: {
        total: sbs.data.length,
        attendanceRate: attendanceRate(sbs.data),
        bySchool: countBy(sbs.data, 'school'),
        byType: countBy(sbs.data, 'training_type'),
        trend: monthlyTrend(sbs.data)
      }
    })
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }) }
})

// ── CSV UPLOAD ────────────────────────────────────────────────────────────────
app.post('/api/upload/csv', auth, adminOnly, async (req, res) => {
  try {
    const { type, csvData } = req.body
    if (!csvData) return res.status(400).json({ error: 'No CSV data' })
    const records = parse(csvData, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true })
    if (!records.length) return res.status(400).json({ error: 'CSV is empty' })

    let inserted = 0, skipped = 0
    const tableMap = {
      inservice:    'public_bus_inservice',
      preservice:   'public_bus_preservice',
      recruitment:  'recruitment',
      sbdrivers:    'school_bus_drivers',
      sbsupervisors:'school_bus_supervisors'
    }

    const table = tableMap[type]
    if (!table) return res.status(400).json({ error: 'Invalid type' })

    const fieldMaps = {
      inservice: r => ({
        staff_id: r['Staff ID'] || r['STAFF ID'] || null,
        driver_name: r['Driver Name'] || r['Name'] || r['DRIVER NAME'] || null,
        nationality: r['Nationality'] || r['NATIONALITY'] || null,
        depot: r['Depot'] || r['DEPOT'] || null,
        training_date: parseDate(r['Training Date'] || r['DATE'] || r['Date']),
        training_type: r['Training Type'] || r['Type'] || r['TYPE'] || null,
        course: r['Course'] || r['COURSE'] || null,
        duration_hours: parseFloat(r['Duration'] || r['Hours'] || '0') || null,
        trainer: r['Trainer'] || r['TRAINER'] || null,
        attendance: r['Attendance'] || r['ATTENDANCE'] || null
      }),
      preservice: r => ({
        staff_id: r['Staff ID'] || r['STAFF ID'] || null,
        driver_name: r['Driver Name'] || r['Name'] || null,
        nationality: r['Nationality'] || null,
        depot: r['Depot'] || null,
        training_date: parseDate(r['Training Date'] || r['Date']),
        training_type: r['Training Type'] || r['Type'] || null,
        course: r['Course'] || null,
        trainer: r['Trainer'] || null,
        attendance: r['Attendance'] || null
      }),
      recruitment: r => ({
        rta_id: r['RTA ID'] || null,
        full_name: r['Name'] || r['Full Name'] || r['Name as per Driving License'] || null,
        nationality: r['Nationality'] || null,
        company: r['Company'] || null,
        road_test_date: parseDate(r['Road Test Date'] || r['Date of Road test']),
        road_test_result: (r['Road Test Result'] || r['Road test result '] || '').trim() || null,
        interview_date: parseDate(r['Interview Date'] || r['Date of Interview']),
        interview_result: (r['Interview Result'] || '').trim() || null,
        status: (r['Status'] || r['Status 1'] || '').trim() || null,
        license_class: r['License Class'] || r['Class of License'] || null,
        remarks: (r['Remarks'] || r['Remarks '] || '').trim() || null
      }),
      sbdrivers: r => ({
        staff_id: r['Staff ID'] || null,
        driver_name: r['Driver Name'] || r['Name'] || null,
        nationality: r['Nationality'] || null,
        school: r['School'] || r['SCHOOL'] || null,
        training_date: parseDate(r['Training Date'] || r['Date']),
        training_type: r['Training Type'] || r['Type'] || null,
        course: r['Course'] || null,
        trainer: r['Trainer'] || null,
        attendance: r['Attendance'] || null
      }),
      sbsupervisors: r => ({
        staff_id: r['Staff ID'] || null,
        supervisor_name: r['Supervisor Name'] || r['Name'] || null,
        nationality: r['Nationality'] || null,
        school: r['School'] || null,
        training_date: parseDate(r['Training Date'] || r['Date']),
        training_type: r['Training Type'] || r['Type'] || null,
        course: r['Course'] || null,
        trainer: r['Trainer'] || null,
        attendance: r['Attendance'] || null
      })
    }

    const mapper = fieldMaps[type]
    const batch = []

    for (const r of records) {
      try {
        const row = mapper(r)
        batch.push(row)
        if (batch.length === 100) {
          const { error } = await supabase.from(table).upsert(batch)
          if (error) { console.error('Batch error:', error.message); skipped += batch.length }
          else inserted += batch.length
          batch.length = 0
        }
      } catch (e) { skipped++ }
    }

    if (batch.length > 0) {
      const { error } = await supabase.from(table).upsert(batch)
      if (error) { skipped += batch.length }
      else inserted += batch.length
    }

    res.json({ ok: true, inserted, skipped, total: records.length })
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }) }
})

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))