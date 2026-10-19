import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { pool } from '../db/pool.js'

const migrationPath = new URL('../../migrations/001_initial_schema.sql', import.meta.url)

try {
  const migration = await readFile(fileURLToPath(migrationPath), 'utf8')
  await pool.query(migration)
  console.log('Database schema is up to date.')
} catch (error) {
  console.error('Database migration failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
