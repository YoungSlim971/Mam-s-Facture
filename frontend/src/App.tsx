import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Accueil from './pages/Accueil'
import ListeFactures from './pages/ListeFactures'
import CreerFacture from './pages/CreerFacture'
import ModifierFacture from './pages/ModifierFacture'
import DetailFacture from './pages/DetailFacture'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/factures" element={<ListeFactures />} />
            <Route path="/factures/nouvelle" element={<CreerFacture />} />
            <Route path="/factures/:id" element={<DetailFacture />} />
            <Route path="/factures/:id/modifier" element={<ModifierFacture />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
