type IndicatorCardProps = {
  title: string
  value: string
  note?: string
  loading?: boolean
}

export default function IndicatorCard({
  title,
  value,
  note,
  loading = false,
}: IndicatorCardProps) {
  return (
    <article className="min-h-36 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      {loading ? (
        <div className="mt-4 h-9 w-2/3 animate-pulse rounded bg-slate-200" />
      ) : (
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {value}
        </p>
      )}
      {note && <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p>}
    </article>
  )
}
