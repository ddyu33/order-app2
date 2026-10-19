import { Router } from 'express'
import { pool } from '../db/pool.js'
import { HttpError } from '../lib/http-error.js'

const router = Router()

router.get('/', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    next(new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database is unavailable', { cause: error }))
  }
})

export default router
