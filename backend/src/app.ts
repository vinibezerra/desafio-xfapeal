import cors from 'cors'
import express from 'express'

import { errorHandler } from './errors/error-handler.js'
import { notFoundHandler } from './errors/not-found-handler.js'
import { apiRouter } from './routes/index.js'
import { env } from './schemas/env.schema.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(cors({ origin: env.CORS_ORIGIN }))
  app.use(express.json({ limit: '1mb' }))

  app.use('/api', apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export const app = createApp()
