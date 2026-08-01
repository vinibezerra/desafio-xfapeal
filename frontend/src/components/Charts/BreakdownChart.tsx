import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type BreakdownChartProps = {
  data: Array<{ name: string; value: number }>
  title: string
  dimensionLabel: string
  isPercentage: boolean
  loading?: boolean
}

const formatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})

export default function BreakdownChart({
  data,
  title,
  dimensionLabel,
  isPercentage,
  loading = false,
}: BreakdownChartProps) {
  const formatValue = (value: number) =>
    isPercentage
      ? `${percentFormatter.format(value)}%`
      : formatter.format(value)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900">{title} por {dimensionLabel}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {dimensionLabel === 'rede'
            ? 'Categorias agregadas de rede são excluídas para evitar dupla contagem.'
            : 'Cada barra representa a etapa selecionada no arquivo importado.'}
        </p>
      </div>
      {loading ? (
        <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
      ) : data.length === 0 ? (
        <div className="flex h-80 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
          Não há dados para esta quebra no recorte selecionado.
        </div>
      ) : (
        <div className="h-80" role="img" aria-label={`${title} por ${dimensionLabel}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 20, left: 10, bottom: 54 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-20}
                textAnchor="end"
                height={72}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                width={78}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formatValue(Number(value))}
              />
              <Tooltip formatter={(value) => formatValue(Number(value))} />
              <Bar dataKey="value" name={title} fill="#d97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
