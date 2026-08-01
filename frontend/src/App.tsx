import { useState } from 'react'

import Header from './components/Header'
import DashboardPage from './pages/Dashboard'
import UploadPage from './pages/Upload'
import type { UploadResult } from './types/educacao'

type Page = 'upload' | 'dashboard'

function App() {
  const [page, setPage] = useState<Page>('upload')
  const [uploadResult, setUploadResult] = useState<UploadResult>()

  return (
    <>
      <Header
        title="Educação Alagoas"
        page={page}
        onNavigate={setPage}
      />

      {page === 'upload' ? (
        <UploadPage
          onImported={(result) => {
            setUploadResult(result)
            setPage('dashboard')
          }}
        />
      ) : (
        <DashboardPage
          uploadResult={uploadResult}
          onImportAnother={() => setPage('upload')}
        />
      )}
    </>
  )
}

export default App
