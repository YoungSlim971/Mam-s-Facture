import { BrowserRouter as Router } from 'react-router-dom'
import './App.css'
import Layout from './Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from 'next-themes'
import { Toaster } from './components/ui/sonner'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Router>
          <Toaster />
          <Layout />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
