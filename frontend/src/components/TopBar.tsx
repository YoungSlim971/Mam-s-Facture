import { Menu, Home } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useIsMobile } from '../hooks/use-mobile'

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()

  const titles: Record<string, string> = {
    '/': 'Accueil',
    '/factures': 'Toutes les factures',
    '/factures/payees': 'Factures payées',
    '/factures/non-payees': 'Factures non payées',
    '/clients': 'Clients',
  }

  const title = titles[location.pathname] || 'MAM\u2019s FACTURE'

  return (
    <header className="fixed top-0 right-0 z-50 bg-slate-900 text-gray-50 shadow py-3 px-4 flex items-center justify-between md:left-56">
      {isMobile && (
        <button onClick={onMenuClick} className="mr-2 md:hidden">
          <Menu className="h-6 w-6" />
        </button>
      )}
      <h1 className="absolute left-1/2 -translate-x-1/2 font-bold text-lg">{title}</h1>
      <button onClick={() => navigate('/')} className="flex items-center space-x-1 text-sm">
        <Home className="h-4 w-4" />
        <span>Accueil</span>
      </button>
    </header>
  )
}
