import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env manually
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

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function init() {
  console.log('Setting up database...')

  // Create tables using Supabase SQL editor
  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100),
        password_hash VARCHAR(200) NOT NULL,
        role VARCHAR(20) DEFAULT 'Management',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public_bus_inservice (
        id SERIAL PRIMARY KEY,
        staff_id VARCHAR(20),
        driver_name VARCHAR(150),
        nationality VARCHAR(60),
        depot VARCHAR(60),
        training_date DATE,
        training_type VARCHAR(80),
        course VARCHAR(100),
        duration_hours NUMERIC(5,1),
        trainer VARCHAR(100),
        attendance VARCHAR(20),
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public_bus_preservice (
        id SERIAL PRIMARY KEY,
        staff_id VARCHAR(20),
        driver_name VARCHAR(150),
        nationality VARCHAR(60),
        depot VARCHAR(60),
        training_date DATE,
        training_type VARCHAR(80),
        course VARCHAR(100),
        trainer VARCHAR(100),
        attendance VARCHAR(20),
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS recruitment (
        id SERIAL PRIMARY KEY,
        rta_id VARCHAR(20),
        full_name VARCHAR(150),
        nationality VARCHAR(60),
        company VARCHAR(60),
        road_test_date DATE,
        road_test_result VARCHAR(20),
        interview_date DATE,
        interview_result VARCHAR(40),
        status VARCHAR(40),
        license_class VARCHAR(40),
        remarks VARCHAR(200),
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS school_bus_drivers (
        id SERIAL PRIMARY KEY,
        staff_id VARCHAR(20),
        driver_name VARCHAR(150),
        nationality VARCHAR(60),
        school VARCHAR(100),
        training_date DATE,
        training_type VARCHAR(80),
        course VARCHAR(100),
        trainer VARCHAR(100),
        attendance VARCHAR(20),
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS school_bus_supervisors (
        id SERIAL PRIMARY KEY,
        staff_id VARCHAR(20),
        supervisor_name VARCHAR(150),
        nationality VARCHAR(60),
        school VARCHAR(100),
        training_date DATE,
        training_type VARCHAR(80),
        course VARCHAR(100),
        trainer VARCHAR(100),
        attendance VARCHAR(20),
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `
  })

  if (e1) {
    // Tables might already exist or RPC not available, try direct approach
    console.log('Note:', e1.message)
  }

  // Seed admin user
  const hash = await bcrypt.hash('admin123', 10)
  const { error: e2 } = await supabase
    .from('users')
    .upsert([
      { username: 'admin', email: 'arafivia@gmail.com', password_hash: hash, role: 'Administrator' },
    ], { onConflict: 'username' })

  if (e2) console.log('User seed note:', e2.message)
  else console.log('OK admin user seeded (admin/admin123)')

  console.log('Done! Check Supabase dashboard to verify tables.')
  process.exit(0)
}

init().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})