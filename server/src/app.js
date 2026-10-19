import cors from 'cors'
import express from 'express'
import adminRouter from './routes/admin.js'
import healthRouter from './routes/health.js'
import menusRouter from './routes/menus.js'
import ordersRouter from './routes/orders.js'

const app = express()
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))
app.use('/api/health', healthRouter)
app.use('/api/menus', menusRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/admin', adminRouter)

app.use('/api', (_request, response) => {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found',
    },
  })
})

app.use((error, _request, response, _next) => {
  const statusCode = Number.isInteger(error.status) ? error.status : 500
  if (statusCode >= 500) {
    console.error('Unhandled API error:', error)
  }
  response.status(statusCode).json({
    error: {
      code:
        error.code ??
        (statusCode === 400 ? 'INVALID_JSON' : 'INTERNAL_SERVER_ERROR'),
      message:
        statusCode >= 500
          ? statusCode === 503
            ? 'Database is unavailable'
            : 'An unexpected server error occurred'
          : error.message,
    },
  })
})

export default app
