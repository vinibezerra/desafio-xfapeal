export type UploadIssue = {
  line: number
  column: string
  message: string
}

export interface UploadResult {
  fileName: string
  message: string
  readRows: number
  importedRows: number
  rejectedRows: number
  errors: UploadIssue[]
  totalRows: number
}

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
