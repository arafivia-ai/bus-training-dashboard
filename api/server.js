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
} catch(e) {}

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const JWT_SECRET = process.env.JWT_SECRET

function parseDate(s) {
  if (!s || !s.toString().trim() || s.toString().trim() === '0') return null
  const str = s.toString().trim()
  const mo = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11}
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d,m,y] = str.split('/')
    return new Date(parseInt(y), parseInt(m)-1, parseInt(d)).toISOString().split('T')[0]
  }
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

// AUTH
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Required' })
    const { data: users } = await supabase.from('users').select('*').eq('username', username).limit(1)
    const user = users?.[0]
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' })
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// USERS
app.get('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { data } = await supabase.from('users').select('id,username,email,role,created_at').order('created_at')
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, email, password, role } = req.body
    if (!username || !password || password.length < 6) return res.status(400).json({ error: 'Invalid' })
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

// FILTER OPTIONS — returns unique values from actual data
app.get('/api/inservice/filters', auth, async (req, res) => {
  try {
    const [depots, types, trainers, nats] = await Promise.all([
      supabase.from('public_bus_inservice').select('depot').eq('is_deleted', false),
      supabase.from('public_bus_inservice').select('training_type').eq('is_deleted', false),
      supabase.from('public_bus_inservice').select('trainer').eq('is_deleted', false),
      supabase.from('public_bus_inservice').select('nationality').eq('is_deleted', false),
    ])
    const unique = (arr, key) => [...new Set((arr.data||[]).map(r => r[key]).filter(Boolean))].sort()
    res.json({
      depots:        unique(depots, 'depot'),
      types:         unique(types, 'training_type'),
      trainers:      unique(trainers, 'trainer'),
      nationalities: unique(nats, 'nationality'),
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/preservice/filters', auth, async (req, res) => {
  try {
    const [companies, statuses, batches, nats] = await Promise.all([
      supabase.from('public_bus_preservice').select('company').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('status').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('training_batch').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('nationality').eq('is_deleted', false),
    ])
    const unique = (arr, key) => [...new Set((arr.data||[]).map(r => r[key]).filter(Boolean))].sort()
    res.json({
      companies:     unique(companies, 'company'),
      statuses:      unique(statuses, 'status'),
      batches:       unique(batches, 'training_batch'),
      nationalities: unique(nats, 'nationality'),
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/recruitment/filters', auth, async (req, res) => {
  try {
    const [companies, statuses, batches, nats, roadTests] = await Promise.all([
      supabase.from('recruitment').select('company').eq('is_deleted', false),
      supabase.from('recruitment').select('status').eq('is_deleted', false),
      supabase.from('recruitment').select('training_batch').eq('is_deleted', false),
      supabase.from('recruitment').select('nationality').eq('is_deleted', false),
      supabase.from('recruitment').select('road_test_result').eq('is_deleted', false),
    ])
    const unique = (arr, key) => [...new Set((arr.data||[]).map(r => r[key]).filter(Boolean))].sort()
    res.json({
      companies:     unique(companies, 'company'),
      statuses:      unique(statuses, 'status'),
      batches:       unique(batches, 'training_batch'),
      nationalities: unique(nats, 'nationality'),
      roadTests:     unique(roadTests, 'road_test_result'),
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/taxi/filters', auth, async (req, res) => {
  try {
    const [companies, types, franchises, nats, institutes] = await Promise.all([
      supabase.from('taxi_limousine').select('company').eq('is_deleted', false),
      supabase.from('taxi_limousine').select('training_type').eq('is_deleted', false),
      supabase.from('taxi_limousine').select('franchise').eq('is_deleted', false),
      supabase.from('taxi_limousine').select('nationality').eq('is_deleted', false),
      supabase.from('taxi_limousine').select('institute').eq('is_deleted', false),
    ])
    const unique = (arr, key) => [...new Set((arr.data||[]).map(r => r[key]).filter(Boolean))].sort()
    res.json({
      companies:     unique(companies, 'company'),
      types:         unique(types, 'training_type'),
      franchises:    unique(franchises, 'franchise'),
      nationalities: unique(nats, 'nationality'),
      institutes:    unique(institutes, 'institute'),
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// IN-SERVICE
app.get('/api/inservice', auth, async (req, res) => {
  try {
    const { depot, training_type, attendance, nationality, trainer, from, to, page=1, limit=100 } = req.query
    let query = supabase.from('public_bus_inservice').select('*', { count:'exact' }).eq('is_deleted', false)
    if (depot)         query = query.eq('depot', depot)
    if (training_type) query = query.eq('training_type', training_type)
    if (attendance)    query = query.eq('attendance', attendance)
    if (nationality)   query = query.eq('nationality', nationality)
    if (trainer)       query = query.eq('trainer', trainer)
    if (from)          query = query.gte('training_date', from)
    if (to)            query = query.lte('training_date', to)
    const offset = (parseInt(page)-1)*parseInt(limit)
    query = query.order('training_date', { ascending:false }).range(offset, offset+parseInt(limit)-1)
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
    const { data, error } = await supabase.from('public_bus_inservice').update(req.body).eq('id', req.params.id).select()
    if (error) return res.status(400).json({ error: error.message })
    res.json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/inservice/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('public_bus_inservice').update({ is_deleted:true }).eq('id', req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PRE-SERVICE
app.get('/api/preservice', auth, async (req, res) => {
  try {
    const { company, status, nationality, training_batch, from, to, page=1, limit=100 } = req.query
    let query = supabase.from('public_bus_preservice').select('*', { count:'exact' }).eq('is_deleted', false)
    if (company)        query = query.eq('company', company)
    if (status)         query = query.eq('status', status)
    if (nationality)    query = query.eq('nationality', nationality)
    if (training_batch) query = query.eq('training_batch', training_batch)
    if (from)           query = query.gte('join_date', from)
    if (to)             query = query.lte('join_date', to)
    const offset = (parseInt(page)-1)*parseInt(limit)
    query = query.order('id', { ascending:false }).range(offset, offset+parseInt(limit)-1)
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

app.delete('/api/preservice/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('public_bus_preservice').update({ is_deleted:true }).eq('id', req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// RECRUITMENT
app.get('/api/recruitment', auth, async (req, res) => {
  try {
    const { status, company, nationality, road_test, training_batch, page=1, limit=100 } = req.query
    let query = supabase.from('recruitment').select('*', { count:'exact' }).eq('is_deleted', false)
    if (status)         query = query.ilike('status', status)
    if (company)        query = query.ilike('company', company)
    if (nationality)    query = query.eq('nationality', nationality)
    if (road_test)      query = query.ilike('road_test_result', road_test)
    if (training_batch) query = query.eq('training_batch', training_batch)
    const offset = (parseInt(page)-1)*parseInt(limit)
    query = query.order('id', { ascending:false }).range(offset, offset+parseInt(limit)-1)
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

app.delete('/api/recruitment/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('recruitment').update({ is_deleted:true }).eq('id', req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// TAXI & LIMOUSINE
app.get('/api/taxi', auth, async (req, res) => {
  try {
    const { company, training_type, franchise, nationality, attendance, from, to, page=1, limit=100 } = req.query
    let query = supabase.from('taxi_limousine').select('*', { count:'exact' }).eq('is_deleted', false)
    if (company)       query = query.eq('company', company)
    if (training_type) query = query.eq('training_type', training_type)
    if (franchise)     query = query.eq('franchise', franchise)
    if (nationality)   query = query.eq('nationality', nationality)
    if (attendance)    query = query.eq('attendance', attendance)
    if (from)          query = query.gte('training_start', from)
    if (to)            query = query.lte('training_start', to)
    const offset = (parseInt(page)-1)*parseInt(limit)
    query = query.order('id', { ascending:false }).range(offset, offset+parseInt(limit)-1)
    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json({ data, total: count, page: parseInt(page) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/taxi', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('taxi_limousine').insert([req.body]).select()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/taxi/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('taxi_limousine').update({ is_deleted:true }).eq('id', req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// SCHOOL BUS DRIVERS
app.get('/api/schoolbus/drivers', auth, async (req, res) => {
  try {
    const { school, training_type, attendance, from, to, page=1, limit=100 } = req.query
    let query = supabase.from('school_bus_drivers').select('*', { count:'exact' }).eq('is_deleted', false)
    if (school)        query = query.eq('school', school)
    if (training_type) query = query.eq('training_type', training_type)
    if (attendance)    query = query.eq('attendance', attendance)
    if (from)          query = query.gte('training_date', from)
    if (to)            query = query.lte('training_date', to)
    const offset = (parseInt(page)-1)*parseInt(limit)
    query = query.order('training_date', { ascending:false }).range(offset, offset+parseInt(limit)-1)
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

app.delete('/api/schoolbus/drivers/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('school_bus_drivers').update({ is_deleted:true }).eq('id', req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// SCHOOL BUS SUPERVISORS
app.get('/api/schoolbus/supervisors', auth, async (req, res) => {
  try {
    const { school, training_type, attendance, from, to, page=1, limit=100 } = req.query
    let query = supabase.from('school_bus_supervisors').select('*', { count:'exact' }).eq('is_deleted', false)
    if (school)        query = query.eq('school', school)
    if (training_type) query = query.eq('training_type', training_type)
    if (attendance)    query = query.eq('attendance', attendance)
    if (from)          query = query.gte('training_date', from)
    if (to)            query = query.lte('training_date', to)
    const offset = (parseInt(page)-1)*parseInt(limit)
    query = query.order('training_date', { ascending:false }).range(offset, offset+parseInt(limit)-1)
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

app.delete('/api/schoolbus/supervisors/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('school_bus_supervisors').update({ is_deleted:true }).eq('id', req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ANALYTICS
app.get('/api/analytics', auth, async (req, res) => {
  try {
    const [
      isCount, psCount, recCount, taxiCount, sbdCount, sbsCount,
      isDepot, isType, isAtt, isNat,
      psCompany, psStatus, psNat, psBatch,
      psFinal, psScenario, psEtest, psOcc, psFire,
      recStatus, recCompany, recNat, recRoad,
      taxiCompany, taxiType, taxiAtt, taxiFranchise,
    ] = await Promise.all([
      supabase.from('public_bus_inservice').select('id', { count:'exact', head:true }).eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('id', { count:'exact', head:true }).eq('is_deleted', false),
      supabase.from('recruitment').select('id', { count:'exact', head:true }).eq('is_deleted', false),
      supabase.from('taxi_limousine').select('id', { count:'exact', head:true }).eq('is_deleted', false),
      supabase.from('school_bus_drivers').select('id', { count:'exact', head:true }).eq('is_deleted', false),
      supabase.from('school_bus_supervisors').select('id', { count:'exact', head:true }).eq('is_deleted', false),
      supabase.from('public_bus_inservice').select('depot').eq('is_deleted', false),
      supabase.from('public_bus_inservice').select('training_type').eq('is_deleted', false),
      supabase.from('public_bus_inservice').select('attendance').eq('is_deleted', false),
      supabase.from('public_bus_inservice').select('nationality').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('company').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('status').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('nationality').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('training_batch').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('final_assessment').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('scenario_result').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('post_etest_result').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('occ_result').eq('is_deleted', false),
      supabase.from('public_bus_preservice').select('fire_fighting').eq('is_deleted', false),
      supabase.from('recruitment').select('status').eq('is_deleted', false),
      supabase.from('recruitment').select('company').eq('is_deleted', false),
      supabase.from('recruitment').select('nationality').eq('is_deleted', false),
      supabase.from('recruitment').select('road_test_result').eq('is_deleted', false),
      supabase.from('taxi_limousine').select('company').eq('is_deleted', false),
      supabase.from('taxi_limousine').select('training_type').eq('is_deleted', false),
      supabase.from('taxi_limousine').select('attendance').eq('is_deleted', false),
      supabase.from('taxi_limousine').select('franchise').eq('is_deleted', false),
    ])

    function countBy(arr, key) {
      const obj = {}
      ;(arr?.data||[]).forEach(r => { const v = r[key]||'Unknown'; obj[v]=(obj[v]||0)+1 })
      return obj
    }

    function passRate(arr, key) {
      const data = arr?.data||[]
      if (!data.length) return 0
      return Math.round(data.filter(r=>(r[key]||'').toLowerCase().includes('pass')).length/data.length*100)
    }

    function attendanceRate(arr) {
      const data = arr?.data||[]
      if (!data.length) return 0
      return Math.round(data.filter(r=>(r.attendance||'').toLowerCase()==='present').length/data.length*100)
    }

    res.json({
      inservice: {
        total:          isCount.count||0,
        attendanceRate: attendanceRate(isAtt),
        byDepot:        countBy(isDepot,'depot'),
        byType:         countBy(isType,'training_type'),
        byNationality:  countBy(isNat,'nationality'),
        byAttendance:   countBy(isAtt,'attendance'),
      },
      preservice: {
        total:               psCount.count||0,
        byCompany:           countBy(psCompany,'company'),
        byStatus:            countBy(psStatus,'status'),
        byNationality:       countBy(psNat,'nationality'),
        byBatch:             countBy(psBatch,'training_batch'),
        finalAssessPassRate: passRate(psFinal,'final_assessment'),
        scenarioPassRate:    passRate(psScenario,'scenario_result'),
        postEtestPassRate:   passRate(psEtest,'post_etest_result'),
        occPassRate:         passRate(psOcc,'occ_result'),
        firePassRate:        passRate(psFire,'fire_fighting'),
      },
      recruitment: {
        total:         recCount.count||0,
        byStatus:      countBy(recStatus,'status'),
        byCompany:     countBy(recCompany,'company'),
        byNationality: countBy(recNat,'nationality'),
        byRoadTest:    countBy(recRoad,'road_test_result'),
      },
      taxi: {
        total:          taxiCount.count||0,
        attendanceRate: attendanceRate(taxiAtt),
        byCompany:      countBy(taxiCompany,'company'),
        byType:         countBy(taxiType,'training_type'),
        byFranchise:    countBy(taxiFranchise,'franchise'),
        byAttendance:   countBy(taxiAtt,'attendance'),
      },
      schoolDrivers: {
        total:    sbdCount.count||0,
      },
      schoolSupervisors: {
        total:    sbsCount.count||0,
      }
    })
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }) }
})

// CSV UPLOAD
app.post('/api/upload/csv', auth, adminOnly, async (req, res) => {
  try {
    const { type, csvData } = req.body
    if (!csvData) return res.status(400).json({ error: 'No CSV data' })

    const records = parse(csvData, {
      columns: true, skip_empty_lines: true, trim: true,
      relax_column_count: true, relax_quotes: true, bom: true
    })

    if (!records.length) return res.status(400).json({ error: 'CSV is empty' })
    console.log(`Upload [${type}]: ${records.length} rows`)

    let inserted = 0, skipped = 0

    if (type === 'inservice') {
      let batch = []
      for (const r of records) {
        try {
          const row = {
            sl:            parseInt(r['SL'])||null,
            training_date: parseDate(r['Training Date']),
            staff_id:      r['Staff ID']?.trim()||null,
            driver_name:   r['Driver Name']?.trim()||null,
            nationality:   r['Nationality']?.trim()||null,
            depot:         r['Depot']?.trim()||null,
            training_type: r['Type of Training']?.trim()||null,
            course_name:   r['Training Course Name']?.trim()||null,
            duration:      r['Duration']?.trim()||null,
            trainer:       r['Trainer']?.trim()||null,
            attendance:    r['Attendance']?.trim()||null
          }
          if (!row.driver_name && !row.staff_id) { skipped++; continue }
          batch.push(row)
          if (batch.length === 200) {
            const { error } = await supabase.from('public_bus_inservice').insert(batch)
            if (error) { console.error('IS:', error.message); skipped+=batch.length } else inserted+=batch.length
            batch = []
          }
        } catch(e) { skipped++ }
      }
      if (batch.length > 0) {
        const { error } = await supabase.from('public_bus_inservice').insert(batch)
        if (error) skipped+=batch.length; else inserted+=batch.length
      }
      return res.json({ ok:true, inserted, skipped, total:records.length })
    }

    if (type === 'preservice') {
      let batch = []
      for (const r of records) {
        try {
          const row = {
            sl:                       parseInt(r['SL'])||null,
            rta_id:                   r['RTA ID']?.trim()||r['RTA ID ']?.trim()||null,
            license_no:               r['License No.']?.trim()||null,
            driver_name:              r['Driver Name']?.trim()||null,
            nationality:              r['Nationality']?.trim()||null,
            dob:                      parseDate(r['DOB']),
            license_issued:           parseDate(r['Date of issued']),
            license_expired:          parseDate(r['Date of expired']),
            place_of_issue:           r['Place of issue']?.trim()||null,
            traffic_file:             r['Traffic file no']?.trim()||null,
            contact:                  r['Contact']?.trim()||null,
            age:                      parseFloat(r['Age'])||null,
            company:                  r['Company']?.trim()||null,
            road_test_date:           parseDate(r['Date of Road test']),
            trainer_name:             r['Name of Trainer']?.trim()||null,
            interview_date:           parseDate(r['Date of Interview']),
            mode_of_hire:             r['Mode of Hire']?.trim()||null,
            payment_date:             parseDate(r['Payment Date']),
            sales_order:              r['Sales Order #']?.trim()||null,
            revenue:                  r['Revenue']?.trim()||null,
            join_date:                parseDate(r['Join Date']),
            training_batch:           r['Training Batch']?.trim()||null,
            trainer_classroom:        r['Name of trainer -  Class Room']?.trim()||null,
            trainer_wheel:            r['Name of Trainer - Behind the wheel']?.trim()||null,
            post_etest_date:          parseDate(r['Date of Post e test']),
            post_etest_result:        r[' Post E test']?.trim()||r['Post E test']?.trim()||null,
            occ_date:                 parseDate(r['Date of OCC']),
            occ_result:               r['OCC']?.trim()||null,
            training_date:            parseDate(r['Date']),
            fire_fighting:            r['Fire Fighting']?.trim()||null,
            road_assessment_date:     parseDate(r['Date of Road Asssesment']),
            final_assessment_trainer: r['Final Asssement Trainer']?.trim()||null,
            final_assessment:         r['Final assesment']?.trim()||null,
            scenario_date:            parseDate(r['Date of Scenario']),
            scenario_result:          r['Scenario Result']?.trim()||null,
            graduation_date:          parseDate(r['Graduation date']),
            number_of_days:           parseInt(r['Number of Days'])||null,
            transfer_date:            parseDate(r['Date of transfer operation ']),
            status:                   r['Status']?.trim()||null,
            notes:                    r['Additional notes Regarding training']?.trim()||null,
            weekly_report:            r['weekly Report']?.trim()||null,
            weekly_report2:           r['weekly Report 2']?.trim()||null
          }
          if (!row.driver_name) { skipped++; continue }
          batch.push(row)
          if (batch.length === 100) {
            const { error } = await supabase.from('public_bus_preservice').insert(batch)
            if (error) { console.error('PS:', error.message); skipped+=batch.length } else inserted+=batch.length
            batch = []
          }
        } catch(e) { skipped++ }
      }
      if (batch.length > 0) {
        const { error } = await supabase.from('public_bus_preservice').insert(batch)
        if (error) skipped+=batch.length; else inserted+=batch.length
      }
      return res.json({ ok:true, inserted, skipped, total:records.length })
    }

    if (type === 'recruitment') {
      let batch = []
      for (const r of records) {
        try {
          const row = {
            sl:               parseInt(r['SL'])||null,
            rta_id:           r['RTA ID']?.trim()||null,
            license_no:       r['License No.']?.trim()||null,
            full_name:        r['Name as per Driving License']?.trim()||null,
            nationality:      r['Nationality']?.trim()||null,
            dob:              parseDate(r['DOB']),
            license_issued:   parseDate(r['Date of issued']),
            license_expired:  parseDate(r['Date of expired']),
            place_of_issue:   r['Place of issue']?.trim()||null,
            license_class:    r['Class of License']?.trim()||null,
            traffic_file:     r['Traffic file no']?.trim()||null,
            contact:          r['Contact']?.trim()||null,
            age:              parseFloat(r['Age'])||null,
            company:          r['Company']?.trim()||null,
            road_test_date:   parseDate(r['Date of Road test']),
            road_test_result: r['Road test result ']?.trim()||r['Road test result']?.trim()||null,
            interview_date:   parseDate(r['Date of Interview']),
            interview_result: r['Interview Result']?.trim()||null,
            remarks:          r['Remarks ']?.trim()||r['Remarks']?.trim()||null,
            status:           r['Status 1']?.trim()||r['Status']?.trim()||null,
            training_batch:   r['Training Batch #']?.trim()||null,
            training_start:   parseDate(r['Date of join Training']),
            graduation_date:  parseDate(r['Date of Graduation']),
            transfer_date:    parseDate(r['Date of Transfer operation'])
          }
          if (!row.full_name) { skipped++; continue }
          batch.push(row)
          if (batch.length === 200) {
            const { error } = await supabase.from('recruitment').insert(batch)
            if (error) { console.error('REC:', error.message); skipped+=batch.length } else inserted+=batch.length
            batch = []
          }
        } catch(e) { skipped++ }
      }
      if (batch.length > 0) {
        const { error } = await supabase.from('recruitment').insert(batch)
        if (error) skipped+=batch.length; else inserted+=batch.length
      }
      return res.json({ ok:true, inserted, skipped, total:records.length })
    }

    if (type === 'taxi') {
      let batch = []
      for (const r of records) {
        try {
          const row = {
            sl:             parseInt(r['SL'])||null,
            license:        r['License']?.trim()||null,
            full_name:      r['Name']?.trim()||null,
            nationality:    r['Nationality']?.trim()||null,
            franchise:      r['Franchise/Limousine']?.trim()||null,
            traffic_file:   r['Traffic File']?.trim()||null,
            apply_date:     parseDate(r['Apply Date ']),
            training_start: parseDate(r['Training Start ']),
            training_end:   parseDate(r['Training End']),
            attendance:     r['Attendance']?.trim()||null,
            training_type:  r['Training Type']?.trim()||null,
            institute:      r['Institute']?.trim()||null,
            company:        r['Company ']?.trim()||r['Company']?.trim()||null,
          }
          if (!row.full_name && !row.license) { skipped++; continue }
          batch.push(row)
          if (batch.length === 200) {
            const { error } = await supabase.from('taxi_limousine').insert(batch)
            if (error) { console.error('TAXI:', error.message); skipped+=batch.length } else inserted+=batch.length
            batch = []
          }
        } catch(e) { skipped++ }
      }
      if (batch.length > 0) {
        const { error } = await supabase.from('taxi_limousine').insert(batch)
        if (error) skipped+=batch.length; else inserted+=batch.length
      }
      return res.json({ ok:true, inserted, skipped, total:records.length })
    }

    if (type === 'sbdrivers') {
      let batch = []
      for (const r of records) {
        try {
          const row = {
            staff_id:      r['Staff ID']?.trim()||null,
            driver_name:   r['Driver Name']?.trim()||r['Name']?.trim()||null,
            nationality:   r['Nationality']?.trim()||null,
            school:        r['School']?.trim()||null,
            training_date: parseDate(r['Training Date']||r['Date']),
            training_type: r['Training Type']?.trim()||r['Type']?.trim()||null,
            course:        r['Course']?.trim()||null,
            trainer:       r['Trainer']?.trim()||null,
            attendance:    r['Attendance']?.trim()||null
          }
          if (!row.driver_name) { skipped++; continue }
          batch.push(row)
          if (batch.length === 200) {
            const { error } = await supabase.from('school_bus_drivers').insert(batch)
            if (error) skipped+=batch.length; else inserted+=batch.length
            batch = []
          }
        } catch(e) { skipped++ }
      }
      if (batch.length > 0) {
        const { error } = await supabase.from('school_bus_drivers').insert(batch)
        if (error) skipped+=batch.length; else inserted+=batch.length
      }
      return res.json({ ok:true, inserted, skipped, total:records.length })
    }

    if (type === 'sbsupervisors') {
      let batch = []
      for (const r of records) {
        try {
          const row = {
            staff_id:        r['Staff ID']?.trim()||null,
            supervisor_name: r['Supervisor Name']?.trim()||r['Name']?.trim()||null,
            nationality:     r['Nationality']?.trim()||null,
            school:          r['School']?.trim()||null,
            training_date:   parseDate(r['Training Date']||r['Date']),
            training_type:   r['Training Type']?.trim()||r['Type']?.trim()||null,
            course:          r['Course']?.trim()||null,
            trainer:         r['Trainer']?.trim()||null,
            attendance:      r['Attendance']?.trim()||null
          }
          if (!row.supervisor_name) { skipped++; continue }
          batch.push(row)
          if (batch.length === 200) {
            const { error } = await supabase.from('school_bus_supervisors').insert(batch)
            if (error) skipped+=batch.length; else inserted+=batch.length
            batch = []
          }
        } catch(e) { skipped++ }
      }
      if (batch.length > 0) {
        const { error } = await supabase.from('school_bus_supervisors').insert(batch)
        if (error) skipped+=batch.length; else inserted+=batch.length
      }
      return res.json({ ok:true, inserted, skipped, total:records.length })
    }

    res.status(400).json({ error: 'Invalid type' })
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }) }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))