import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Accueil from './pages/Accueil'
import ListeFactures from './pages/ListeFactures'
import CreerFacture from './pages/CreerFacture'
import ModifierFacture from './pages/ModifierFacture'
import DetailFacture from './pages/DetailFacture'
import { ErrorBoundary } from './components/ErrorBoundary'
import Sidebar from './components/Sidebar'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <div className="flex">
            <Sidebar />
            <main className="ml-64 flex-1 min-h-screen p-0">
              <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/factures" element={<ListeFactures />} />
                <Route path="/factures/nouvelle" element={<CreerFacture />} />
                <Route path="/factures/:id" element={<DetailFacture />} />
                <Route path="/factures/:id/modifier" element={<ModifierFacture />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
