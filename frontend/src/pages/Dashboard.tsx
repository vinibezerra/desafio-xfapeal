import { useEffect, useState } from 'react'

import BreakdownChart from '../components/Charts/BreakdownChart'
import RankingChart from '../components/Charts/RankingChart'
import TimeSeriesChart from '../components/Charts/TimeSeriesChart'
import DataTable from '../components/DataTable'
import Filters from '../components/Filters'
import IndicatorCard from '../components/IndicatorCard'
import {
  getDashboardBreakdown,
  getDashboardRanking,
  getDashboardSeries,
  getDashboardSummary,
  getEducationData,
  getFilterOptions,
} from '../services/api'
import type {
  AggregateResponse,
  DashboardFilters,
  DashboardSummary,
  FilterOptions,
  PaginatedEducationData,
  SeriesResponse,
  UploadResult,
} from '../types/educacao'

const emptyOptions: FilterOptions = {
  municipalities: [],
  years: [],
  networks: [],
  educationTypes: [],
  variables: [],
}

const integerFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})
const percentageFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})

function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined
    ? 'Sem dado'
    : integerFormatter.format(value)
}

function formatPercentage(value: number | null | undefined): string {
  return value === null || value === undefined
    ? 'Sem dado'
    : `${percentageFormatter.format(value)}%`
}

type DashboardPageProps = {
  uploadResult?: UploadResult
  onImportAnother: () => void
}

export default function DashboardPage({
  uploadResult,
  onImportAnother,
}: DashboardPageProps) {
  const [options, setOptions] = useState<FilterOptions>(emptyOptions)
  const [filters, setFilters] = useState<DashboardFilters>({ municipalities: [] })
  const [variable, setVariable] = useState('Matrícula')
  const [dimension, setDimension] = useState<'network' | 'educationType'>('network')
  const [page, setPage] = useState(1)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<DashboardSummary>()
  const [series, setSeries] = useState<SeriesResponse>()
  const [ranking, setRanking] = useState<AggregateResponse>()
  const [breakdown, setBreakdown] = useState<AggregateResponse>()
  const [table, setTable] = useState<PaginatedEducationData>()

  useEffect(() => {
    const controller = new AbortController()

    getFilterOptions(controller.signal)
      .then((result) => {
        setOptions(result)
        const firstYear = result.years[0]
        const lastYear = result.years.at(-1)
        setFilters({
          municipalities: [],
          yearStart: firstYear,
          yearEnd: lastYear,
        })
        if (!result.variables.includes('Matrícula') && result.variables[0]) {
          setVariable(result.variables[0])
        }
        setReady(true)
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar os filtros.',
        )
        setLoading(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!ready || options.years.length === 0) return

    let controller: AbortController | undefined
    const timer = window.setTimeout(() => {
      controller = new AbortController()
      setLoading(true)
      setError(null)

      Promise.all([
        getDashboardSummary(filters, controller.signal),
        getDashboardSeries(filters, variable, controller.signal),
        getDashboardRanking(filters, variable, controller.signal),
        getDashboardBreakdown(filters, variable, dimension, controller.signal),
        getEducationData(filters, page, 20, controller.signal),
      ])
        .then(([summaryResult, seriesResult, rankingResult, breakdownResult, tableResult]) => {
          setSummary(summaryResult)
          setSeries(seriesResult)
          setRanking(rankingResult)
          setBreakdown(breakdownResult)
          setTable(tableResult)
        })
        .catch((requestError: unknown) => {
          if (requestError instanceof DOMException && requestError.name === 'AbortError') return
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Não foi possível atualizar o dashboard.',
          )
        })
        .finally(() => setLoading(false))
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller?.abort()
    }
  }, [dimension, filters, options.years.length, page, ready, variable])

  function updateFilters(nextFilters: DashboardFilters) {
    setFilters(nextFilters)
    setPage(1)
  }

  if (ready && options.years.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Nenhum dado importado</h2>
          <p className="mt-3 text-slate-600">
            Importe o CSV para gerar os filtros, indicadores e gráficos.
          </p>
          <button
            type="button"
            onClick={onImportAnother}
            className="mt-6 inline-flex rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800"
          >
            Importar arquivo CSV
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              Dados educacionais
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Visão geral de Alagoas
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Explore os dados importados. Percentuais são ponderados e redes hierárquicas não são somadas.
            </p>
          </div>
          <button
            type="button"
            onClick={onImportAnother}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Importar outro CSV
          </button>
        </div>

        {uploadResult && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              uploadResult.rejectedRows > 0
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}
          >
            <p>
              {uploadResult.importedRows.toLocaleString('pt-BR')} linhas importadas
              de {uploadResult.fileName}.
              {uploadResult.rejectedRows > 0 &&
                ` ${uploadResult.rejectedRows.toLocaleString('pt-BR')} linha(s) rejeitada(s).`}
            </p>
            {uploadResult.errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Ver rejeições</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {uploadResult.errors.slice(0, 10).map((issue, index) => (
                    <li key={`${issue.line}-${issue.column}-${index}`}>
                      Linha {issue.line}, {issue.column}: {issue.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        <Filters
          options={options}
          filters={filters}
          variable={variable}
          dimension={dimension}
          disabled={!ready}
          onFiltersChange={updateFilters}
          onVariableChange={(nextVariable) => {
            setVariable(nextVariable)
            setPage(1)
          }}
          onDimensionChange={setDimension}
        />

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <IndicatorCard title="Matrículas" value={formatNumber(summary?.enrollments)} loading={loading} note="Soma na rede Total por padrão" />
          <IndicatorCard title={summary?.schoolsLabel ?? 'Ofertas de ensino'} value={formatNumber(summary?.educationOffers)} loading={loading} note="Sem etapa fixa, representa ofertas" />
          <IndicatorCard title="Taxa de aprovação" value={formatPercentage(summary?.approvalRate)} loading={loading} note={summary?.percentageAggregation} />
          <IndicatorCard title="Taxa de abandono" value={formatPercentage(summary?.abandonmentRate)} loading={loading} note={summary?.percentageAggregation} />
          <IndicatorCard title="Municípios com dados" value={summary ? integerFormatter.format(summary.municipalities) : '—'} loading={loading} />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TimeSeriesChart
            data={series?.points ?? []}
            title={variable}
            isPercentage={series?.isPercentage ?? false}
            aggregation={series?.aggregation}
            loading={loading}
          />
          <RankingChart
            data={(ranking?.points ?? []).map((point) => ({ name: point.key, value: point.value }))}
            title={variable}
            isPercentage={ranking?.isPercentage ?? false}
            loading={loading}
          />
          <BreakdownChart
            data={(breakdown?.points ?? []).map((point) => ({ name: point.key, value: point.value }))}
            title={variable}
            dimensionLabel={dimension === 'network' ? 'rede' : 'etapa'}
            isPercentage={breakdown?.isPercentage ?? false}
            loading={loading}
          />
        </section>

        <div className="mt-6">
          <DataTable data={table} loading={loading} onPageChange={setPage} />
        </div>
      </div>
    </main>
  )
}
