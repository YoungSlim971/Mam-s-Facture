import { BrowserRouter as Router } from 'react-router-dom'
import './App.css'
import Layout from './Layout'
import { InvoicesProvider } from './context/InvoicesContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from 'next-themes'
import { Toaster } from './components/ui/sonner'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <InvoicesProvider>
          <Router>
            <Toaster />
            <Layout />
          </Router>
        </InvoicesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
