import { useRef, type ChangeEvent } from 'react'

type UploadAreaProps = {
  file: File | null
  isUploading: boolean
  onFileChange: (file: File | null) => void
  onSubmit: () => void
}

export default function UploadArea({
  file,
  isUploading,
  onFileChange,
  onSubmit,
}: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0] ?? null)
  }

  return (
    <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".csv,text/csv"
        onChange={handleChange}
      />

      <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
        <p className="font-medium text-slate-800">
          {file ? file.name : 'Selecione o arquivo de dados educacionais'}
        </p>
        <p className="mt-1 text-sm text-slate-500">CSV em UTF-8, até 20 MB</p>
        <button
          className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          Escolher CSV
        </button>
      </div>

      <button
        className="mt-4 w-full rounded-md bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={!file || isUploading}
        onClick={onSubmit}
      >
        {isUploading ? 'Importando…' : 'Importar para o PostgreSQL'}
      </button>
    </div>
  )
}
