import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { useIsMobile } from './hooks/use-mobile'
import AnimatedRoutes from './AnimatedRoutes'

export default function Layout() {
  const location = useLocation()
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  const smallMarginRoutes = [
    '/',
    '/factures',
    '/factures/nouvelle',
    '/factures/payees',
    '/factures/non-payees',
    '/clients',
    '/profil',
    '/profile',
    '/profil-utilisateur',
  ]
  const useSmallMargin = smallMarginRoutes.some((path) => location.pathname.startsWith(path))

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1">
        <TopBar onMenuClick={() => setSidebarOpen(true)} useSmallMargin={useSmallMargin} />
        <main className={`flex-1 overflow-auto pt-16 px-4 py-6 ml-0 ${useSmallMargin ? 'md:ml-2' : 'md:ml-56'}`}>
          <AnimatedRoutes />
        </main>
      </div>
    </div>
  )
}
