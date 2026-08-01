import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type RankingChartProps = {
  data: Array<{ name: string; value: number }>
  title: string
  isPercentage: boolean
  loading?: boolean
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})
const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})

export default function RankingChart({
  data,
  title,
  isPercentage,
  loading = false,
}: RankingChartProps) {
  const formatValue = (value: number) =>
    isPercentage
      ? `${percentFormatter.format(value)}%`
      : numberFormatter.format(value)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900">Ranking municipal</h3>
        <p className="mt-1 text-xs text-slate-500">{title} no recorte selecionado</p>
      </div>
      {loading ? (
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      ) : data.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
          Nenhum município possui dados para este recorte.
        </div>
      ) : (
        <div className="h-72" role="img" aria-label={`Ranking municipal de ${title}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 20, left: 34, bottom: 4 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formatValue(Number(value))}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={112}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(value) => formatValue(Number(value))} />
              <Bar dataKey="value" name={title} fill="#0f766e" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
