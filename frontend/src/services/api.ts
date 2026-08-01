import type {
  AggregateResponse,
  DashboardFilters,
  DashboardSummary,
  FilterOptions,
  PaginatedEducationData,
  SeriesResponse,
  UploadResult,
} from '../types/educacao'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api'

type ApiErrorBody = {
  error?: {
    message?: string
  }
}

async function request<T extends object>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { signal })
  const body = (await response.json()) as T | ApiErrorBody

  if (!response.ok) {
    const message = 'error' in body ? body.error?.message : undefined
    throw new Error(message ?? 'Não foi possível consultar os dados.')
  }

  return body as T
}

function dashboardQuery(
  filters: DashboardFilters,
  extra: Record<string, string | number | undefined> = {},
): string {
  const params = new URLSearchParams()

  for (const municipality of filters.municipalities) {
    params.append('municipality', municipality)
  }
  if (filters.yearStart !== undefined) {
    params.set('yearStart', String(filters.yearStart))
  }
  if (filters.yearEnd !== undefined) {
    params.set('yearEnd', String(filters.yearEnd))
  }
  if (filters.network) params.set('network', filters.network)
  if (filters.educationType) {
    params.set('educationType', filters.educationType)
  }

  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined) params.set(key, String(value))
  }

  return params.toString()
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/education/import`, {
    method: 'POST',
    body: formData,
  })
  const body = (await response.json()) as UploadResult | ApiErrorBody

  if (!response.ok) {
    const errorMessage = 'error' in body ? body.error?.message : undefined
    throw new Error(errorMessage ?? 'Não foi possível importar o CSV.')
  }

  return body as UploadResult
}

export function getFilterOptions(signal?: AbortSignal) {
  return request<FilterOptions>('/education/filters', signal)
}

export function getDashboardSummary(
  filters: DashboardFilters,
  signal?: AbortSignal,
) {
  return request<DashboardSummary>(
    `/education/summary?${dashboardQuery(filters)}`,
    signal,
  )
}

export function getDashboardSeries(
  filters: DashboardFilters,
  variable: string,
  signal?: AbortSignal,
) {
  return request<SeriesResponse>(
    `/education/series?${dashboardQuery(filters, { variable })}`,
    signal,
  )
}

export function getDashboardRanking(
  filters: DashboardFilters,
  variable: string,
  signal?: AbortSignal,
) {
  return request<AggregateResponse>(
    `/education/ranking?${dashboardQuery(filters, { variable })}`,
    signal,
  )
}

export function getDashboardBreakdown(
  filters: DashboardFilters,
  variable: string,
  dimension: 'network' | 'educationType',
  signal?: AbortSignal,
) {
  return request<AggregateResponse>(
    `/education/breakdown?${dashboardQuery(filters, {
      variable,
      dimension,
    })}`,
    signal,
  )
}

export function getEducationData(
  filters: DashboardFilters,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
) {
  return request<PaginatedEducationData>(
    `/education/data?${dashboardQuery(filters, { page, pageSize })}`,
    signal,
  )
}
