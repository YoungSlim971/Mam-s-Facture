import { NavLink } from 'react-router-dom'
import { Home, FileText, PlusCircle, CircleAlert, Users, X, LogOut } from 'lucide-react' // Removed Sun
import ThemeToggle from './ThemeToggle' // Added ThemeToggle import
import { useIsMobile } from '../hooks/use-mobile'

import { handleQuitApp } from '../utils/system'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  // const { theme, toggleTheme } = useTheme() // Removed useTheme
  const isMobile = useIsMobile()

  const sidebar = (
    <aside
      className={`${isMobile ? 'fixed left-0 top-0 z-50 h-full' : ''} w-56 min-w-[14rem] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 flex flex-col justify-between transition-all duration-300 transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {isMobile && (
        <button onClick={() => setOpen(false)} className="absolute top-2 right-2 p-1 text-gray-700 dark:text-gray-300">
          <X className="h-5 w-5" />
        </button>
      )}
      <div className="flex flex-col justify-between h-full">
        <h1 className="text-center font-bold text-xl mb-6 text-gray-900 dark:text-white">MAM’s FACTURE</h1>
        <div className="space-y-2">
        <NavLink to="/" className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-sky-400">
          <Home className="h-5 w-5" />
          <span>Accueil</span>
        </NavLink>
        <NavLink to="/factures" className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-sky-400">
          <FileText className="h-5 w-5" />
          <span>Toutes les factures</span>
        </NavLink>
        <NavLink to="/factures?statut=nonpayee" className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-sky-400">
          <CircleAlert className="h-5 w-5" />
          <span>Factures non payées</span>
        </NavLink>
        <NavLink to="/factures?statut=payee" className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-sky-400">
          <CircleAlert className="h-5 w-5" />
          <span>Factures payées</span>
        </NavLink>
        <NavLink to="/factures/nouvelle" className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-sky-400">
          <PlusCircle className="h-5 w-5" />
          <span>Créer une facture</span>
        </NavLink>
        <NavLink to="/clients" className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-sky-400">
          <Users className="h-5 w-5" />
          <span>Clients</span>
        </NavLink>
        </div>
        <div className="space-y-2 pb-4">
        <NavLink to="/profile" className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-sky-400">
          {/* Using Users icon as a placeholder, replace with a more appropriate one if available */}
          <Users className="h-5 w-5" />
          <span>Mes informations</span>
        </NavLink>
        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
          <ThemeToggle />
          <span>Changer le thème</span>
        </div>
        <button
          onClick={() => handleQuitApp()}
          aria-label="Déconnexion"
          className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-red-400 dark:hover:text-red-500"
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {isMobile && open && (
        <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)} />
      )}
      {sidebar}
    </>
  )
}
