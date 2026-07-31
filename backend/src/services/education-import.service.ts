import { createHash } from 'node:crypto'

import { EducationRepository } from '../repositories/education.repository.js'
import {
  parseEducationCsv,
  type EducationCsvRow,
  type ValidationIssue,
} from './education-csv.service.js'

export type ImportResult = {
  readRows: number
  importedRows: number
  rejectedRows: number
  errors: ValidationIssue[]
  totalRows: number
}

export function calculateEducationDataHash(rows: EducationCsvRow[]): string {
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex')
}

export class EducationImportService {
  constructor(
    private readonly educationRepository = new EducationRepository(),
  ) {}

  async import(
    buffer: Buffer,
    fileName = 'arquivo.csv',
  ): Promise<ImportResult> {
    const parsedCsv = parseEducationCsv(buffer)
    let importedRows = 0

    if (parsedCsv.rows.length > 0) {
      const fileHash = calculateEducationDataHash(parsedCsv.rows)
      importedRows = await this.educationRepository.insertMany(parsedCsv.rows, {
        fileHash,
        fileName,
      })
    }

    const totalRows = await this.educationRepository.countRows()

    return {
      readRows: parsedCsv.readRows,
      importedRows,
      rejectedRows: parsedCsv.rejectedRows,
      errors: parsedCsv.errors,
      totalRows,
    }
  }
}
