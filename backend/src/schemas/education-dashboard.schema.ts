import { z } from 'zod'

import { AppError } from '../errors/app-error.js'
import type { DashboardFilters } from '../repositories/education-dashboard.repository.js'
import { educationVariables } from '../services/education-csv.service.js'

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z.coerce.number().int().optional(),
)

const optionalString = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z.string().min(1).optional(),
)

const filterShape = {
  municipality: z
    .union([z.string(), z.array(z.string())])
    .optional(),
  yearStart: optionalNumber,
  yearEnd: optionalNumber,
  network: optionalString,
  educationType: optionalString,
}

const filterSchema = z.object(filterShape)
const variableSchema = z.object({
  ...filterShape,
  variable: z.enum(educationVariables),
})
const breakdownSchema = z.object({
  ...filterShape,
  variable: z.enum(educationVariables),
  dimension: z.enum(['network', 'educationType']).default('network'),
})
const dataSchema = z.object({
  ...filterShape,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

type ParsedFilterShape = z.infer<typeof filterSchema>

function parseOrThrow<T>(schema: z.ZodType<T>, query: unknown): T {
  const result = schema.safeParse(query)

  if (!result.success) {
    throw new AppError('Os filtros informados são inválidos.', 400, result.error.issues)
  }

  return result.data
}

function toDashboardFilters(parsed: ParsedFilterShape): DashboardFilters {
  if (
    parsed.yearStart !== undefined &&
    parsed.yearEnd !== undefined &&
    parsed.yearStart > parsed.yearEnd
  ) {
    throw new AppError('O ano inicial não pode ser maior que o ano final.', 400)
  }

  const municipalityValues = Array.isArray(parsed.municipality)
    ? parsed.municipality
    : parsed.municipality?.split(',') ?? []

  return {
    municipalities: municipalityValues
      .map((value) => value.trim())
      .filter(Boolean),
    yearStart: parsed.yearStart,
    yearEnd: parsed.yearEnd,
    network: parsed.network,
    educationType: parsed.educationType,
  }
}

export function parseDashboardFilters(query: unknown): DashboardFilters {
  return toDashboardFilters(parseOrThrow(filterSchema, query))
}

export function parseVariableDashboardQuery(query: unknown): {
  filters: DashboardFilters
  variable: (typeof educationVariables)[number]
} {
  const parsed = parseOrThrow(variableSchema, query)
  return {
    filters: toDashboardFilters(parsed),
    variable: parsed.variable,
  }
}

export function parseBreakdownDashboardQuery(query: unknown): {
  filters: DashboardFilters
  variable: (typeof educationVariables)[number]
  dimension: 'network' | 'educationType'
} {
  const parsed = parseOrThrow(breakdownSchema, query)
  return {
    filters: toDashboardFilters(parsed),
    variable: parsed.variable,
    dimension: parsed.dimension,
  }
}

export function parseDataDashboardQuery(query: unknown): {
  filters: DashboardFilters
  page: number
  pageSize: number
} {
  const parsed = parseOrThrow(dataSchema, query)
  return {
    filters: toDashboardFilters(parsed),
    page: parsed.page,
    pageSize: parsed.pageSize,
  }
}
