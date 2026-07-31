import { extname } from 'node:path'

import { Router } from 'express'
import multer from 'multer'

import { importEducationCsv } from '../controllers/education.controller.js'
import {
  getEducationBreakdown,
  getEducationData,
  getEducationFilters,
  getEducationRanking,
  getEducationSeries,
  getEducationSummary,
} from '../controllers/education-dashboard.controller.js'
import { AppError } from '../errors/app-error.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (extname(file.originalname).toLowerCase() !== '.csv') {
      callback(new AppError('Apenas arquivos com extensão .csv são aceitos.'))
      return
    }

    callback(null, true)
  },
})

export const educationRouter = Router()

educationRouter.post('/import', upload.single('file'), importEducationCsv)
educationRouter.get('/filters', getEducationFilters)
educationRouter.get('/summary', getEducationSummary)
educationRouter.get('/series', getEducationSeries)
educationRouter.get('/ranking', getEducationRanking)
educationRouter.get('/breakdown', getEducationBreakdown)
educationRouter.get('/data', getEducationData)
