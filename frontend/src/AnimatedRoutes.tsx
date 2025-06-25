import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Accueil from './pages/Accueil'
import ListeFactures from './pages/ListeFactures'
import CreerFacture from './pages/CreerFacture'
import ModifierFacture from './pages/ModifierFacture'
import DetailFacture from './pages/DetailFacture'
import Clients from './pages/Clients'
import ClientProfile from './pages/profiles/ClientProfile'
import ProfilePage from './pages/ProfilePage'
import AfficherProfilUtilisateur from './pages/AfficherProfilUtilisateur'
import NotFound from './pages/Error/NotFound'

export default function AnimatedRoutes() {
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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profil-utilisateur" element={<AfficherProfilUtilisateur />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
