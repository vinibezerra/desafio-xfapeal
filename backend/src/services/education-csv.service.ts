import { parse } from 'csv-parse/sync'
import { z } from 'zod'

import { AppError } from '../errors/app-error.js'

const expectedColumns = [
  'co_mun',
  'no_mun',
  'ano',
  'fonte',
  'variavel',
  'ensino_rede',
  'ensino_tipo',
  'valor',
] as const

const sources = [
  'censo_escolar',
  'indicadores_rendimento',
  'censo_demografico',
] as const

const variablesBySource = {
  censo_escolar: ['Escolas', 'Matrícula'],
  indicadores_rendimento: [
    'Taxa de Aprovação',
    'Taxa de Reprovação',
    'Taxa de Abandono',
  ],
  censo_demografico: [
    'Pessoas Alfabetizadas',
    'Pessoas Total',
    'Taxa de Alfabetização',
    'Taxa de Analfabetismo',
  ],
} as const

export const educationVariables = [
  ...variablesBySource.censo_escolar,
  ...variablesBySource.indicadores_rendimento,
  ...variablesBySource.censo_demografico,
] as const

const percentageVariables = new Set<string>([
  ...variablesBySource.indicadores_rendimento,
  'Taxa de Alfabetização',
  'Taxa de Analfabetismo',
])

const absoluteVariables = new Set<string>([
  ...variablesBySource.censo_escolar,
  'Pessoas Alfabetizadas',
  'Pessoas Total',
])

const educationNetworks = [
  'Estadual',
  'Municipal',
  'Federal',
  'Privada',
  'Pública',
  'Total',
  'Não se aplica',
] as const

const educationTypes = [
  'Educação Infantil',
  'Ensino Fundamental',
  'Ensino Médio',
  'Educação de Jovens e Adultos (EJA)',
  'Educação Profissional',
  'Pessoas de 15 anos ou mais de idade',
] as const

const csvRowSchema = z
  .object({
    co_mun: z.string().regex(/^\d{7}$/, 'deve conter 7 dígitos'),
    no_mun: z.string().min(1, 'é obrigatório'),
    ano: z.coerce.number().int().min(2007).max(2025),
    fonte: z.enum(sources, 'não corresponde a uma fonte aceita'),
    variavel: z.enum(
      educationVariables,
      'não corresponde a uma variável aceita',
    ),
    ensino_rede: z.enum(
      educationNetworks,
      'não corresponde a uma rede aceita',
    ),
    ensino_tipo: z.enum(
      educationTypes,
      'não corresponde a uma etapa aceita',
    ),
    valor: z
      .string()
      .min(1, 'é obrigatório')
      .refine((value) => Number.isFinite(Number(value)), 'deve ser numérico'),
  })
  .superRefine((row, context) => {
    if (!variablesBySource[row.fonte].includes(row.variavel as never)) {
      context.addIssue({
        code: 'custom',
        path: ['variavel'],
        message: `não pertence à fonte ${row.fonte}`,
      })
    }

    const value = Number(row.valor)

    if (Number.isFinite(value) && value < 0) {
      context.addIssue({
        code: 'custom',
        path: ['valor'],
        message: 'não pode ser negativo',
      })
    }

    if (
      Number.isFinite(value) &&
      percentageVariables.has(row.variavel) &&
      value > 100
    ) {
      context.addIssue({
        code: 'custom',
        path: ['valor'],
        message: 'deve estar entre 0 e 100 para percentuais',
      })
    }

    if (
      Number.isFinite(value) &&
      absoluteVariables.has(row.variavel) &&
      !Number.isInteger(value)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['valor'],
        message: 'deve ser inteiro para contagens absolutas',
      })
    }
  })

export type EducationCsvRow = {
  municipalityCode: string
  municipalityName: string
  year: number
  source: string
  variable: string
  educationNetwork: string
  educationType: string
  value: string
}

export type ValidationIssue = {
  line: number
  column: string
  message: string
}

export type ParsedEducationCsv = {
  rows: EducationCsvRow[]
  readRows: number
  rejectedRows: number
  errors: ValidationIssue[]
}

export function parseEducationCsv(buffer: Buffer): ParsedEducationCsv {
  const content = buffer.toString('utf8')

  if (content.includes('\uFFFD')) {
    throw new AppError(
      'O CSV não está codificado em UTF-8. Salve-o como UTF-8 e tente novamente.',
      400,
    )
  }

  let records: string[][]

  try {
    records = parse(content, {
      bom: true,
      skip_empty_lines: true,
      trim: true,
    }) as string[][]
  } catch (error) {
    throw new AppError(
      'Não foi possível ler o CSV.',
      400,
      error instanceof Error ? error.message : undefined,
    )
  }

  if (records.length === 0) {
    throw new AppError('O arquivo CSV está vazio.', 400)
  }

  const header = records[0] ?? []
  const hasExpectedHeader =
    header.length === expectedColumns.length &&
    expectedColumns.every((column, index) => header[index] === column)

  if (!hasExpectedHeader) {
    throw new AppError(
      'As colunas do CSV não correspondem ao formato esperado.',
      400,
      {
        expected: expectedColumns,
        received: header,
      },
    )
  }

  if (records.length === 1) {
    throw new AppError('O CSV não contém registros para importar.', 400)
  }

  const rows: EducationCsvRow[] = []
  const issues: ValidationIssue[] = []
  let rejectedRows = 0

  for (let index = 1; index < records.length; index += 1) {
    const record = records[index] ?? []
    const line = index + 1

    if (record.length !== expectedColumns.length) {
      rejectedRows += 1
      issues.push({
        line,
        column: 'linha',
        message: `esperadas ${expectedColumns.length} colunas, recebidas ${record.length}`,
      })
      continue
    }

    const rawRow = Object.fromEntries(
      expectedColumns.map((column, columnIndex) => [
        column,
        record[columnIndex] ?? '',
      ]),
    )
    const parsedRow = csvRowSchema.safeParse(rawRow)

    if (!parsedRow.success) {
      rejectedRows += 1
      for (const issue of parsedRow.error.issues) {
        issues.push({
          line,
          column: String(issue.path[0] ?? 'linha'),
          message: issue.message,
        })
      }
      continue
    }

    rows.push({
      municipalityCode: parsedRow.data.co_mun,
      municipalityName: parsedRow.data.no_mun,
      year: parsedRow.data.ano,
      source: parsedRow.data.fonte,
      variable: parsedRow.data.variavel,
      educationNetwork: parsedRow.data.ensino_rede,
      educationType: parsedRow.data.ensino_tipo,
      value: parsedRow.data.valor,
    })
  }

  return {
    rows,
    readRows: records.length - 1,
    rejectedRows,
    errors: issues.slice(0, 100),
  }
}
