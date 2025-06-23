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
import ProfilePage from './pages/ProfilePage' // Import the new ProfilePage
import NotFound from './pages/Error/NotFound'
import { ErrorBoundary } from './components/ErrorBoundary'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { useState, useEffect } from 'react'
import { useIsMobile } from './hooks/use-mobile'
// import { ThemeProvider } from './context/ThemeContext' // Removed ThemeProvider
import { Toaster } from './components/ui/sonner'

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
          <Route path="/profile" element={<ProfilePage />} /> {/* Add route for ProfilePage */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  return (
    <ErrorBoundary>
      {/* <ThemeProvider> */}
      <Router>
        <Toaster />
        <div className="flex h-screen overflow-hidden">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <div className="flex flex-col flex-1">
            <TopBar onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 overflow-auto pt-16 px-4 py-6 pl-0 md:pl-56">
              <AnimatedRoutes />
            </main>
          </div>
        </div>
      </Router>
      {/* </ThemeProvider> */}
    </ErrorBoundary>
  )
}

export default App
