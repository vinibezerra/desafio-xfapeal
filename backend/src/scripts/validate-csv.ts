import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { AppError } from '../errors/app-error.js'
import { parseEducationCsv } from '../services/education-csv.service.js'

const filePath = process.argv[2]

if (!filePath) {
  throw new Error(
    'Informe o CSV: npm run validate:csv -- caminho/arquivo.csv',
  )
}

try {
  const buffer = await readFile(resolve(filePath))
  const result = parseEducationCsv(buffer)

  console.log(
    `Validação concluída: ${result.readRows} linhas lidas, ` +
      `${result.rows.length} válidas e ` +
      `${result.rejectedRows} rejeitadas.`,
  )

  for (const issue of result.errors) {
    console.log(
      `Linha ${issue.line}, coluna ${issue.column}: ${issue.message}`,
    )
  }
} catch (error) {
  if (error instanceof AppError) {
    console.error(error.message)
    process.exitCode = 1
  } else {
    throw error
  }
}
