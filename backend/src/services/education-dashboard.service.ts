import {
  EducationDashboardRepository,
  type AggregatePoint,
  type DashboardFilters,
} from '../repositories/education-dashboard.repository.js'

export type EducationDashboardRepositoryPort = Pick<
  EducationDashboardRepository,
  | 'getFilterOptions'
  | 'aggregateValue'
  | 'countMunicipalities'
  | 'aggregateBy'
  | 'getTimelineYears'
  | 'getPaginatedData'
>

const demographicVariables = new Set([
  'Pessoas Alfabetizadas',
  'Pessoas Total',
  'Taxa de Alfabetização',
  'Taxa de Analfabetismo',
])

const percentageVariables = new Set([
  'Taxa de Aprovação',
  'Taxa de Reprovação',
  'Taxa de Abandono',
  'Taxa de Alfabetização',
  'Taxa de Analfabetismo',
])

function filtersForVariable(
  variable: string,
  filters: DashboardFilters,
): DashboardFilters {
  const isDemographic = demographicVariables.has(variable)

  return {
    ...filters,
    network:
      filters.network ?? (isDemographic ? 'Não se aplica' : 'Total'),
    educationType:
      filters.educationType ??
      (isDemographic ? 'Pessoas de 15 anos ou mais de idade' : undefined),
  }
}

function removeHierarchicalNetworkTotals(
  points: AggregatePoint[],
): AggregatePoint[] {
  return points.filter(
    (point) => point.key !== 'Total' && point.key !== 'Pública',
  )
}

export class EducationDashboardService {
  constructor(
    private readonly repository: EducationDashboardRepositoryPort =
      new EducationDashboardRepository(),
  ) {}

  getFilterOptions() {
    return this.repository.getFilterOptions()
  }

  async getSummary(filters: DashboardFilters) {
    const schoolFilters = filtersForVariable('Matrícula', filters)
    const [enrollments, educationOffers, approvalRate, abandonmentRate, municipalities] =
      await Promise.all([
        this.repository.aggregateValue('Matrícula', schoolFilters),
        this.repository.aggregateValue('Escolas', schoolFilters),
        this.repository.aggregateValue(
          'Taxa de Aprovação',
          filtersForVariable('Taxa de Aprovação', filters),
        ),
        this.repository.aggregateValue(
          'Taxa de Abandono',
          filtersForVariable('Taxa de Abandono', filters),
        ),
        this.repository.countMunicipalities(schoolFilters),
      ])

    return {
      enrollments,
      educationOffers,
      approvalRate,
      abandonmentRate,
      municipalities,
      schoolsLabel: filters.educationType ? 'Escolas' : 'Ofertas de ensino',
      percentageAggregation: 'Média ponderada por matrículas',
    }
  }

  async getSeries(variable: string, filters: DashboardFilters) {
    const [points, years] = await Promise.all([
      this.repository.aggregateBy(
        variable,
        filtersForVariable(variable, filters),
        'year',
      ),
      this.repository.getTimelineYears(filters),
    ])
    const valuesByYear = new Map(
      points.map((point) => [Number(point.key), point.value]),
    )

    return {
      variable,
      isPercentage: percentageVariables.has(variable),
      aggregation: percentageVariables.has(variable)
        ? 'Média ponderada'
        : 'Soma',
      points: years.map((year) => ({
        year,
        value: valuesByYear.get(year) ?? null,
      })),
    }
  }

  async getRanking(
    variable: string,
    filters: DashboardFilters,
    limit = 10,
  ) {
    const points = await this.repository.aggregateBy(
      variable,
      filtersForVariable(variable, filters),
      'municipality',
      limit,
    )

    return {
      variable,
      isPercentage: percentageVariables.has(variable),
      points: points.filter((point) => point.value !== null),
    }
  }

  async getBreakdown(
    variable: string,
    filters: DashboardFilters,
    dimension: 'network' | 'educationType',
  ) {
    let breakdownFilters = filtersForVariable(variable, filters)

    if (
      dimension === 'network' &&
      filters.network === undefined &&
      !demographicVariables.has(variable)
    ) {
      breakdownFilters = { ...breakdownFilters, network: undefined }
    }
    if (dimension === 'educationType' && filters.educationType === undefined) {
      breakdownFilters = { ...breakdownFilters, educationType: undefined }
    }

    let points = await this.repository.aggregateBy(
      variable,
      breakdownFilters,
      dimension,
    )

    if (
      dimension === 'network' &&
      filters.network === undefined &&
      !demographicVariables.has(variable)
    ) {
      points = removeHierarchicalNetworkTotals(points)
    }

    return {
      variable,
      dimension,
      isPercentage: percentageVariables.has(variable),
      points: points.filter((point) => point.value !== null),
    }
  }

  getData(
    filters: DashboardFilters,
    page: number,
    pageSize: number,
  ) {
    return this.repository.getPaginatedData(filters, page, pageSize)
  }
}
