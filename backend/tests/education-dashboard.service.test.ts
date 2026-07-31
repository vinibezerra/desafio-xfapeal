import { describe, expect, it } from 'vitest'

import type { EducationDashboardRepositoryPort } from '../src/services/education-dashboard.service.js'
import { EducationDashboardService } from '../src/services/education-dashboard.service.js'

function createRepository(
  overrides: Partial<EducationDashboardRepositoryPort> = {},
): EducationDashboardRepositoryPort {
  return {
    getFilterOptions: async () => ({
      municipalities: [],
      years: [],
      networks: [],
      educationTypes: [],
      variables: [],
    }),
    aggregateValue: async () => null,
    countMunicipalities: async () => 0,
    aggregateBy: async () => [],
    getTimelineYears: async () => [],
    getPaginatedData: async (_filters, page, pageSize) => ({
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }),
    ...overrides,
  }
}

describe('EducationDashboardService', () => {
  it('mantém zero explícito e usa null nos anos sem linha', async () => {
    let receivedNetwork: string | undefined
    const repository = createRepository({
      aggregateBy: async (_variable, filters) => {
        receivedNetwork = filters.network
        return [
          { key: '2010', value: 12.5 },
          { key: '2021', value: 0 },
        ]
      },
      getTimelineYears: async () => [2010, 2019, 2021],
    })
    const service = new EducationDashboardService(repository)

    const result = await service.getSeries('Matrícula', {
      municipalities: [],
    })

    expect(receivedNetwork).toBe('Total')
    expect(result.points).toEqual([
      { year: 2010, value: 12.5 },
      { year: 2019, value: null },
      { year: 2021, value: 0 },
    ])
  })

  it('remove redes agregadas da quebra para não duplicar contagens', async () => {
    const repository = createRepository({
      aggregateBy: async () => [
        { key: 'Total', value: 100 },
        { key: 'Pública', value: 70 },
        { key: 'Estadual', value: 30 },
        { key: 'Municipal', value: 40 },
        { key: 'Privada', value: 30 },
      ],
    })
    const service = new EducationDashboardService(repository)

    const result = await service.getBreakdown(
      'Matrícula',
      { municipalities: [] },
      'network',
    )

    expect(result.points.map((point) => point.key)).toEqual([
      'Estadual',
      'Municipal',
      'Privada',
    ])
  })
})
