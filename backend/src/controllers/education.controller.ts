import type { RequestHandler } from 'express'

import { AppError } from '../errors/app-error.js'
import { EducationImportService } from '../services/education-import.service.js'

const educationImportService = new EducationImportService()

export const importEducationCsv: RequestHandler = async (request, response) => {
  if (!request.file) {
    throw new AppError(
      'Envie um arquivo CSV no campo "file" do formulário.',
      400,
    )
  }

  const result = await educationImportService.import(
    request.file.buffer,
    request.file.originalname,
  )

  response.status(200).json({
    message:
      result.rejectedRows === 0
        ? 'CSV importado com sucesso.'
        : 'CSV processado com linhas rejeitadas.',
    fileName: request.file.originalname,
    ...result,
  })
}
