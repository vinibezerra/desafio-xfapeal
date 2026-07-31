import type { RequestHandler } from 'express'

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    error: {
      message: `Rota não encontrada: ${request.method} ${request.originalUrl}`,
    },
  })
}
