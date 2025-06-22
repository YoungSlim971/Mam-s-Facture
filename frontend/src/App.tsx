import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import './App.css'
import Accueil from './pages/Accueil'
import ListeFactures from './pages/ListeFactures'
import CreerFacture from './pages/CreerFacture'
import ModifierFacture from './pages/ModifierFacture'
import DetailFacture from './pages/DetailFacture'
import Clients from './pages/Clients'
import ClientProfile from './pages/profiles/ClientProfile'
import NotFound from './pages/Error/NotFound'
import { ErrorBoundary } from './components/ErrorBoundary'
import Sidebar from './components/Sidebar'
import { ThemeProvider } from './context/ThemeContext'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.4 }}
      >
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Accueil />} />
          <Route path="/factures" element={<ListeFactures />} />
          <Route path="/factures/nouvelle" element={<CreerFacture />} />
          <Route path="/factures/:id" element={<DetailFacture />} />
          <Route path="/factures/:id/modifier" element={<ModifierFacture />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <div className="flex">
            <Sidebar />
            <main className="ml-64 flex-1 min-h-screen p-0">
              <AnimatedRoutes />
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
