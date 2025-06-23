import { Menu, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../hooks/use-mobile'

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow py-3 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {isMobile && (
          <button onClick={onMenuClick} className="mr-2 md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        )}
        <h1 className="font-bold text-lg">MAM’s FACTURE</h1>
      </div>
      <button onClick={() => navigate('/')} className="flex items-center space-x-1 text-sm">
        <Home className="h-4 w-4" />
        <span>Accueil</span>
      </button>
    </header>
  )
}
