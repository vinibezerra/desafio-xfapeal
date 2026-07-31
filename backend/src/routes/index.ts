import { Router } from 'express'

import { educationRouter } from './education.routes.js'
import { healthRouter } from './health.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/education', educationRouter)
