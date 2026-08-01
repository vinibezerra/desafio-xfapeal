import { useState } from 'react'

import UploadArea from '../components/UploadArea'
import { uploadFile } from '../services/api'
import type { UploadResult } from '../types/educacao'

type UploadPageProps = {
  onImported: (result: UploadResult) => void
}

export default function UploadPage({ onImported }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload() {
    if (!file) return

    setIsUploading(true)
    setResult(null)
    setError(null)

    try {
      const uploadResult = await uploadFile(file)
      setResult(uploadResult)

      if (uploadResult.importedRows > 0 || uploadResult.totalRows > 0) {
        onImported(uploadResult)
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Não foi possível importar o CSV.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="min-h-[calc(100vh-64px)] bg-slate-50 px-8 py-7">
      <h2 className="text-2xl font-semibold text-slate-900">Upload de dados</h2>
      <p className="mt-1 text-slate-600">
        Importe o CSV para a tabela dados_educacao do PostgreSQL.
      </p>

      <UploadArea
        file={file}
        isUploading={isUploading}
        onFileChange={(selectedFile) => {
          setFile(selectedFile)
          setResult(null)
          setError(null)
        }}
        onSubmit={handleUpload}
      />

      {result && (
        <div
          className="mt-4 max-w-2xl rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
          role="status"
        >
          <p className="font-medium">{result.message}</p>
          <p className="mt-1 text-sm">
            {result.readRows.toLocaleString('pt-BR')} linhas lidas,{' '}
            {result.importedRows.toLocaleString('pt-BR')} importadas e{' '}
            {result.rejectedRows.toLocaleString('pt-BR')} rejeitadas. A tabela
            agora contém {result.totalRows.toLocaleString('pt-BR')} registros.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {result.errors.slice(0, 10).map((issue, index) => (
                <li key={`${issue.line}-${issue.column}-${index}`}>
                  Linha {issue.line}, coluna {issue.column}: {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div
          className="mt-4 max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}
    </section>
  )
}
