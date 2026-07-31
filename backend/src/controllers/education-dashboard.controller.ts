import type { RequestHandler } from 'express'

import {
  parseBreakdownDashboardQuery,
  parseDashboardFilters,
  parseDataDashboardQuery,
  parseVariableDashboardQuery,
} from '../schemas/education-dashboard.schema.js'
import { EducationDashboardService } from '../services/education-dashboard.service.js'

const dashboardService = new EducationDashboardService()

export const getEducationFilters: RequestHandler = async (_request, response) => {
  response.json(await dashboardService.getFilterOptions())
}

export const getEducationSummary: RequestHandler = async (request, response) => {
  response.json(
    await dashboardService.getSummary(parseDashboardFilters(request.query)),
  )
}

export const getEducationSeries: RequestHandler = async (request, response) => {
  const { filters, variable } = parseVariableDashboardQuery(request.query)
  response.json(await dashboardService.getSeries(variable, filters))
}

export const getEducationRanking: RequestHandler = async (request, response) => {
  const { filters, variable } = parseVariableDashboardQuery(request.query)
  response.json(await dashboardService.getRanking(variable, filters))
}

export const getEducationBreakdown: RequestHandler = async (
  request,
  response,
) => {
  const { filters, variable, dimension } = parseBreakdownDashboardQuery(
    request.query,
  )
  response.json(
    await dashboardService.getBreakdown(variable, filters, dimension),
  )
}

export const getEducationData: RequestHandler = async (request, response) => {
  const { filters, page, pageSize } = parseDataDashboardQuery(request.query)
  response.json(await dashboardService.getData(filters, page, pageSize))
}
