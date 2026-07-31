import { databasePool } from '../database/client.js'

export type DashboardFilters = {
  municipalities: string[]
  yearStart?: number
  yearEnd?: number
  network?: string
  educationType?: string
}

export type FilterOptions = {
  municipalities: Array<{ code: string; name: string }>
  years: number[]
  networks: string[]
  educationTypes: string[]
  variables: string[]
}

export type AggregatePoint = {
  key: string
  value: number | null
}

export type EducationDataItem = {
  id: number
  municipalityCode: string
  municipalityName: string
  year: number
  source: string
  variable: string
  educationNetwork: string
  educationType: string
  value: number
}

export type PaginatedEducationData = {
  items: EducationDataItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type ParameterizedQuery = {
  clauses: string[]
  values: unknown[]
}

type GroupDimension = 'year' | 'municipality' | 'network' | 'educationType'

const performanceVariables = new Set([
  'Taxa de Aprovação',
  'Taxa de Reprovação',
  'Taxa de Abandono',
])

const demographicRateVariables = new Set([
  'Taxa de Alfabetização',
  'Taxa de Analfabetismo',
])

function getWeightVariable(variable: string): string | undefined {
  if (performanceVariables.has(variable)) return 'Matrícula'
  if (demographicRateVariables.has(variable)) return 'Pessoas Total'
  return undefined
}

function addParameter(query: ParameterizedQuery, value: unknown): string {
  query.values.push(value)
  return `$${query.values.length}`
}

function addFilterClauses(
  query: ParameterizedQuery,
  filters: DashboardFilters,
  alias = 'd',
): void {
  if (filters.municipalities.length > 0) {
    const parameter = addParameter(query, filters.municipalities)
    query.clauses.push(`${alias}.co_mun = ANY(${parameter}::varchar[])`)
  }

  if (filters.yearStart !== undefined) {
    const parameter = addParameter(query, filters.yearStart)
    query.clauses.push(`${alias}.ano >= ${parameter}`)
  }

  if (filters.yearEnd !== undefined) {
    const parameter = addParameter(query, filters.yearEnd)
    query.clauses.push(`${alias}.ano <= ${parameter}`)
  }

  if (filters.network !== undefined) {
    const parameter = addParameter(query, filters.network)
    query.clauses.push(`${alias}.ensino_rede = ${parameter}`)
  }

  if (filters.educationType !== undefined) {
    const parameter = addParameter(query, filters.educationType)
    query.clauses.push(`${alias}.ensino_tipo = ${parameter}`)
  }
}

function whereClause(query: ParameterizedQuery): string {
  return query.clauses.length > 0
    ? `WHERE ${query.clauses.join(' AND ')}`
    : ''
}

function groupConfiguration(dimension: GroupDimension): {
  select: string
  groupBy: string
  orderBy: string
} {
  switch (dimension) {
    case 'year':
      return {
        select: 'd.ano::text AS key',
        groupBy: 'd.ano',
        orderBy: 'd.ano ASC',
      }
    case 'municipality':
      return {
        select: 'd.no_mun AS key',
        groupBy: 'd.co_mun, d.no_mun',
        orderBy: 'value DESC, d.no_mun ASC',
      }
    case 'network':
      return {
        select: 'd.ensino_rede AS key',
        groupBy: 'd.ensino_rede',
        orderBy: 'value DESC, d.ensino_rede ASC',
      }
    case 'educationType':
      return {
        select: 'd.ensino_tipo AS key',
        groupBy: 'd.ensino_tipo',
        orderBy: 'value DESC, d.ensino_tipo ASC',
      }
  }
}

export class EducationDashboardRepository {
  async getFilterOptions(): Promise<FilterOptions> {
    const [municipalities, years, networks, educationTypes, variables] =
      await Promise.all([
        databasePool.query<{ code: string; name: string }>(`
          SELECT DISTINCT co_mun AS code, no_mun AS name
          FROM dados_educacao
          ORDER BY name ASC
        `),
        databasePool.query<{ year: number }>(`
          SELECT DISTINCT ano AS year
          FROM dados_educacao
          ORDER BY year ASC
        `),
        databasePool.query<{ network: string }>(`
          SELECT DISTINCT ensino_rede AS network
          FROM dados_educacao
          ORDER BY network ASC
        `),
        databasePool.query<{ education_type: string }>(`
          SELECT DISTINCT ensino_tipo AS education_type
          FROM dados_educacao
          ORDER BY education_type ASC
        `),
        databasePool.query<{ variable: string }>(`
          SELECT DISTINCT variavel AS variable
          FROM dados_educacao
          ORDER BY variable ASC
        `),
      ])

    return {
      municipalities: municipalities.rows,
      years: years.rows.map((row) => row.year),
      networks: networks.rows.map((row) => row.network),
      educationTypes: educationTypes.rows.map((row) => row.education_type),
      variables: variables.rows.map((row) => row.variable),
    }
  }

  async aggregateValue(
    variable: string,
    filters: DashboardFilters,
  ): Promise<number | null> {
    const weightVariable = getWeightVariable(variable)
    const query: ParameterizedQuery = { clauses: [], values: [] }
    const variableParameter = addParameter(query, variable)
    query.clauses.push(`d.variavel = ${variableParameter}`)
    addFilterClauses(query, filters)

    if (!weightVariable) {
      const result = await databasePool.query<{ value: number | null }>(
        `
          SELECT SUM(d.valor)::double precision AS value
          FROM dados_educacao d
          ${whereClause(query)}
        `,
        query.values,
      )

      return result.rows[0]?.value ?? null
    }

    const weightParameter = addParameter(query, weightVariable)
    const result = await databasePool.query<{ value: number | null }>(
      `
        SELECT (
          SUM(d.valor * weight.valor) /
          NULLIF(SUM(weight.valor), 0)
        )::double precision AS value
        FROM dados_educacao d
        INNER JOIN dados_educacao weight
          ON weight.co_mun = d.co_mun
          AND weight.ano = d.ano
          AND weight.ensino_rede = d.ensino_rede
          AND weight.ensino_tipo = d.ensino_tipo
          AND weight.variavel = ${weightParameter}
        ${whereClause(query)}
      `,
      query.values,
    )

    return result.rows[0]?.value ?? null
  }

  async countMunicipalities(filters: DashboardFilters): Promise<number> {
    const query: ParameterizedQuery = { clauses: [], values: [] }
    addFilterClauses(query, filters)

    const result = await databasePool.query<{ total: number }>(
      `
        SELECT COUNT(DISTINCT d.co_mun)::int AS total
        FROM dados_educacao d
        ${whereClause(query)}
      `,
      query.values,
    )

    return result.rows[0]?.total ?? 0
  }

  async aggregateBy(
    variable: string,
    filters: DashboardFilters,
    dimension: GroupDimension,
    limit?: number,
  ): Promise<AggregatePoint[]> {
    const weightVariable = getWeightVariable(variable)
    const group = groupConfiguration(dimension)
    const query: ParameterizedQuery = { clauses: [], values: [] }
    const variableParameter = addParameter(query, variable)
    query.clauses.push(`d.variavel = ${variableParameter}`)
    addFilterClauses(query, filters)

    const limitClause =
      limit === undefined ? '' : `LIMIT ${addParameter(query, limit)}`

    if (!weightVariable) {
      const result = await databasePool.query<AggregatePoint>(
        `
          SELECT ${group.select}, SUM(d.valor)::double precision AS value
          FROM dados_educacao d
          ${whereClause(query)}
          GROUP BY ${group.groupBy}
          ORDER BY ${group.orderBy}
          ${limitClause}
        `,
        query.values,
      )

      return result.rows
    }

    const weightParameter = addParameter(query, weightVariable)
    const result = await databasePool.query<AggregatePoint>(
      `
        SELECT ${group.select}, (
          SUM(d.valor * weight.valor) /
          NULLIF(SUM(weight.valor), 0)
        )::double precision AS value
        FROM dados_educacao d
        INNER JOIN dados_educacao weight
          ON weight.co_mun = d.co_mun
          AND weight.ano = d.ano
          AND weight.ensino_rede = d.ensino_rede
          AND weight.ensino_tipo = d.ensino_tipo
          AND weight.variavel = ${weightParameter}
        ${whereClause(query)}
        GROUP BY ${group.groupBy}
        ORDER BY ${group.orderBy}
        ${limitClause}
      `,
      query.values,
    )

    return result.rows
  }

  async getTimelineYears(filters: DashboardFilters): Promise<number[]> {
    const query: ParameterizedQuery = { clauses: [], values: [] }

    if (filters.municipalities.length > 0) {
      const parameter = addParameter(query, filters.municipalities)
      query.clauses.push(`d.co_mun = ANY(${parameter}::varchar[])`)
    }
    if (filters.yearStart !== undefined) {
      const parameter = addParameter(query, filters.yearStart)
      query.clauses.push(`d.ano >= ${parameter}`)
    }
    if (filters.yearEnd !== undefined) {
      const parameter = addParameter(query, filters.yearEnd)
      query.clauses.push(`d.ano <= ${parameter}`)
    }

    const result = await databasePool.query<{ year: number }>(
      `
        SELECT DISTINCT d.ano AS year
        FROM dados_educacao d
        ${whereClause(query)}
        ORDER BY year ASC
      `,
      query.values,
    )

    return result.rows.map((row) => row.year)
  }

  async getPaginatedData(
    filters: DashboardFilters,
    page: number,
    pageSize: number,
  ): Promise<PaginatedEducationData> {
    const query: ParameterizedQuery = { clauses: [], values: [] }
    addFilterClauses(query, filters)
    const where = whereClause(query)

    const countResult = await databasePool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM dados_educacao d ${where}`,
      query.values,
    )

    const limitParameter = addParameter(query, pageSize)
    const offsetParameter = addParameter(query, (page - 1) * pageSize)
    const dataResult = await databasePool.query<EducationDataItem>(
      `
        SELECT
          d.id,
          d.co_mun AS "municipalityCode",
          d.no_mun AS "municipalityName",
          d.ano AS year,
          d.fonte AS source,
          d.variavel AS variable,
          d.ensino_rede AS "educationNetwork",
          d.ensino_tipo AS "educationType",
          d.valor::double precision AS value
        FROM dados_educacao d
        ${where}
        ORDER BY d.ano DESC, d.no_mun ASC, d.variavel ASC
        LIMIT ${limitParameter}
        OFFSET ${offsetParameter}
      `,
      query.values,
    )

    const total = countResult.rows[0]?.total ?? 0

    return {
      items: dataResult.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }
}
