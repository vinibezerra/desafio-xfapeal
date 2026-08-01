import { useEffect, useState } from 'react'

import DataTable from '../components/DataTable'
import Filters from '../components/Filters'
import { getEducationData, getFilterOptions } from '../services/api'
import type {
  DashboardFilters,
  FilterOptions,
  PaginatedEducationData,
  UploadResult,
} from '../types/educacao'

const emptyOptions: FilterOptions = {
  municipalities: [],
  years: [],
  networks: [],
  educationTypes: [],
  variables: [],
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
  const [page, setPage] = useState(1)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [table, setTable] = useState<PaginatedEducationData>()

  useEffect(() => {
    const controller = new AbortController()

    getFilterOptions(controller.signal)
      .then((result) => {
        setOptions(result)
        setFilters({
          municipalities: [],
          yearStart: result.years[0],
          yearEnd: result.years.at(-1),
        })
        setReady(true)
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === 'AbortError'
        ) {
          return
        }
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

      getEducationData(filters, page, 20, controller.signal)
        .then(setTable)
        .catch((requestError: unknown) => {
          if (
            requestError instanceof DOMException &&
            requestError.name === 'AbortError'
          ) {
            return
          }
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Não foi possível atualizar a tabela.',
          )
        })
        .finally(() => setLoading(false))
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller?.abort()
    }
  }, [filters, options.years.length, page, ready])

  function updateFilters(nextFilters: DashboardFilters) {
    setFilters(nextFilters)
    setPage(1)
  }

  if (ready && options.years.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">
            Nenhum dado importado
          </h2>
          <p className="mt-3 text-slate-600">
            Importe o CSV para gerar os filtros e a tabela.
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
              Use os filtros para consultar as linhas importadas.
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
            {uploadResult.importedRows.toLocaleString('pt-BR')} linhas importadas
            de {uploadResult.fileName}.
          </div>
        )}

        {error && (
          <div
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        <Filters
          options={options}
          filters={filters}
          disabled={!ready}
          onFiltersChange={updateFilters}
        />

        <div className="mt-6">
          <DataTable data={table} loading={loading} onPageChange={setPage} />
        </div>
      </div>
    </main>
  )
}
