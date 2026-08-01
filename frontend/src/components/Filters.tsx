import type { DashboardFilters, FilterOptions } from '../types/educacao'

type FiltersProps = {
  options: FilterOptions
  filters: DashboardFilters
  disabled?: boolean
  onFiltersChange: (filters: DashboardFilters) => void
}

export default function Filters({
  options,
  filters,
  disabled = false,
  onFiltersChange,
}: FiltersProps) {
  function toggleMunicipality(code: string) {
    const selected = filters.municipalities.includes(code)
      ? filters.municipalities.filter((item) => item !== code)
      : [...filters.municipalities, code]

    onFiltersChange({ ...filters, municipalities: selected })
  }

  const municipalityLabel =
    filters.municipalities.length === 0
      ? 'Todos os municípios'
      : `${filters.municipalities.length} município(s)`

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Filtros do recorte
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A tabela responde aos filtros selecionados.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          disabled={disabled}
          onClick={() =>
            onFiltersChange({
              municipalities: [],
              yearStart: options.years[0],
              yearEnd: options.years.at(-1),
            })
          }
        >
          Limpar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-sm font-medium text-slate-700">
          Municípios
          <details className="relative mt-1">
            <summary className="cursor-pointer list-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-800 marker:hidden">
              {municipalityLabel}
            </summary>
            <div className="absolute z-20 mt-2 max-h-72 w-full min-w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <button
                type="button"
                className="mb-2 text-xs font-semibold text-blue-700 hover:underline"
                onClick={() =>
                  onFiltersChange({ ...filters, municipalities: [] })
                }
              >
                Selecionar todos
              </button>
              <div className="space-y-2">
                {options.municipalities.map((municipality) => (
                  <label
                    className="flex cursor-pointer items-center gap-2 font-normal text-slate-700"
                    key={municipality.code}
                  >
                    <input
                      type="checkbox"
                      checked={filters.municipalities.includes(municipality.code)}
                      onChange={() => toggleMunicipality(municipality.code)}
                    />
                    {municipality.name}
                  </label>
                ))}
              </div>
            </div>
          </details>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Ano inicial
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-800"
            value={filters.yearStart ?? ''}
            disabled={disabled}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                yearStart: Number(event.target.value),
              })
            }
          >
            {options.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Ano final
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-800"
            value={filters.yearEnd ?? ''}
            disabled={disabled}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                yearEnd: Number(event.target.value),
              })
            }
          >
            {options.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Rede
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-800"
            value={filters.network ?? ''}
            disabled={disabled}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                network: event.target.value || undefined,
              })
            }
          >
            <option value="">Total consolidado</option>
            {options.networks.map((network) => (
              <option key={network} value={network}>
                {network}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Etapa
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-800"
            value={filters.educationType ?? ''}
            disabled={disabled}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                educationType: event.target.value || undefined,
              })
            }
          >
            <option value="">Todas as etapas</option>
            {options.educationTypes.map((educationType) => (
              <option key={educationType} value={educationType}>
                {educationType}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
