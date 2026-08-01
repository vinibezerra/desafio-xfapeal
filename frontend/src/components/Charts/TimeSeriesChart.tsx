import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type TimeSeriesChartProps = {
  data: Array<{ year: number; value: number | null }>
  title: string
  isPercentage: boolean
  aggregation?: string
  loading?: boolean
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})
const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})

export default function TimeSeriesChart({
  data,
  title,
  isPercentage,
  aggregation,
  loading = false,
}: TimeSeriesChartProps) {
  const formatValue = (value: number) =>
    isPercentage
      ? `${percentFormatter.format(value)}%`
      : numberFormatter.format(value)
  const hasData = data.some((point) => point.value !== null)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900">Evolução de {title}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {aggregation ?? 'Agregação do período'} · lacunas representam ausência de dado
        </p>
      </div>
      {loading ? (
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      ) : !hasData ? (
        <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
          Sem dados para este indicador no recorte selecionado.
        </div>
      ) : (
        <div className="h-72" role="img" aria-label={`Série temporal de ${title}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis
                width={74}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formatValue(Number(value))}
              />
              <Tooltip
                formatter={(value) => [formatValue(Number(value)), title]}
                labelFormatter={(label) => `Ano ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name={title}
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
