import type { ErrorRequestHandler } from 'express'
import multer from 'multer'

import { AppError } from './app-error.js'

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        message: error.message,
        details: error.details,
      },
    })
    return
  }

  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === 'LIMIT_FILE_SIZE'

    response.status(isTooLarge ? 413 : 400).json({
      error: {
        message: isTooLarge
          ? 'O arquivo excede o limite de 20 MB.'
          : 'Não foi possível receber o arquivo.',
        details: error.message,
      },
    })
    return
  }

  response.status(500).json({
    error: {
      message: 'Erro interno do servidor.',
    },
  })
}
