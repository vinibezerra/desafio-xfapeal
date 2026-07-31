import 'dotenv/config'

import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

import { closeDatabaseConnection } from '../database/client.js'
import { EducationImportService } from '../services/education-import.service.js'

const filePath = process.argv[2]

if (!filePath) {
  throw new Error(
    'Informe o CSV: npm run import:csv -- caminho/arquivo.csv',
  )
}

try {
  const absolutePath = resolve(filePath)
  const buffer = await readFile(absolutePath)
  const result = await new EducationImportService().import(
    buffer,
    basename(absolutePath),
  )

  console.log(
    `Importação concluída: ${result.readRows} linhas lidas, ` +
      `${result.importedRows} registros inseridos, ` +
      `${result.rejectedRows} linhas rejeitadas; ` +
      `${result.totalRows} registros na tabela dados_educacao.`,
  )
} finally {
  await closeDatabaseConnection()
}
