import 'dotenv/config'
import app from './app.js'

const port = Number.parseInt(process.env.PORT ?? '3000', 10)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}

app.listen(port, () => {
  console.log(`COZY API server listening on http://localhost:${port}`)
})
