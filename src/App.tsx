import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { NumberSystemPage } from './pages/NumberSystemPage'
import { InstructionDecoderPage } from './pages/InstructionDecoderPage'
import { DatapathPage } from './pages/DatapathPage'
import { PipelinePage } from './pages/PipelinePage'
import { CachePage } from './pages/CachePage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="number-system" element={<NumberSystemPage />} />
          <Route path="instruction-decoder" element={<InstructionDecoderPage />} />
          <Route path="datapath" element={<DatapathPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="cache" element={<CachePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
