type HeaderProps = {
  title?: string
  page: 'upload' | 'dashboard'
  onNavigate: (page: 'upload' | 'dashboard') => void
}

export default function Header({
  title = 'Educação Alagoas',
  page,
  onNavigate,
}: HeaderProps) {
  const navigation = [
    { page: 'upload', label: 'Importar CSV' },
    { page: 'dashboard', label: 'Dashboard' },
  ] as const

  return (
    <header className="border-b border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Análise de dados educacionais
          </p>
        </div>
        <nav className="flex items-center gap-1" aria-label="Navegação principal">
          {navigation.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate(item.page)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                page === item.page
                  ? 'bg-white text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
