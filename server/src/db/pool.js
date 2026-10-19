import pg from 'pg'

const { Pool } = pg

export const pool = new Pool()

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error)
})
