import express from 'express'
import cors from 'cors'
import { seedAdmin } from './dataloader'
import adminRoutes from './routes/admin'

const PORT = process.env.PORT ?? 3001
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'

const app = express()

app.use(cors({ origin: FRONTEND_URL }))
app.use(express.json())

app.use('/api/admin', adminRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

seedAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`[backend] Serveur démarré sur http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('[backend] Erreur au démarrage :', err)
  process.exit(1)
})
