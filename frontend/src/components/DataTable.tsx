import type { PaginatedEducationData } from '../types/educacao'

type DataTableProps = {
  data?: PaginatedEducationData
  loading?: boolean
  onPageChange: (page: number) => void
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 4,
})

export default function DataTable({
  data,
  loading = false,
  onPageChange,
}: DataTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">Dados do recorte</h2>
          <p className="mt-1 text-xs text-slate-500">
            Linhas originais, sem preencher combinações ausentes.
          </p>
        </div>
        <span className="text-sm text-slate-500">
          {data ? `${data.total.toLocaleString('pt-BR')} registro(s)` : '—'}
        </span>
      </div>

      {loading ? (
        <div className="m-5 h-64 animate-pulse rounded-xl bg-slate-100" />
      ) : !data || data.items.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          Nenhum dado encontrado para os filtros selecionados.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Município</th>
                  <th className="px-4 py-3">Ano</th>
                  <th className="px-4 py-3">Variável</th>
                  <th className="px-4 py-3">Rede</th>
                  <th className="px-4 py-3">Etapa</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                      {item.municipalityName}
                    </td>
                    <td className="px-4 py-3">{item.year}</td>
                    <td className="whitespace-nowrap px-4 py-3">{item.variable}</td>
                    <td className="px-4 py-3">{item.educationNetwork}</td>
                    <td className="min-w-56 px-4 py-3">{item.educationType}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {numberFormatter.format(item.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={data.page <= 1}
              onClick={() => onPageChange(data.page - 1)}
            >
              Anterior
            </button>
            <span className="text-sm text-slate-500">
              Página {data.page} de {Math.max(data.totalPages, 1)}
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={data.page >= data.totalPages}
              onClick={() => onPageChange(data.page + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </section>
  )
}
