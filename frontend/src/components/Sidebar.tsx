import { NavLink } from 'react-router-dom'
import { Home, FileText, PlusCircle, CircleAlert, Sun, Users } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar p-6 text-sidebar-foreground shadow-lg">
      <nav className="space-y-4">
        <NavLink to="/" className="flex items-center space-x-2 hover:text-primary">
          <Home className="h-5 w-5" />
          <span>Accueil</span>
        </NavLink>
        <NavLink to="/factures" className="flex items-center space-x-2 hover:text-primary">
          <FileText className="h-5 w-5" />
          <span>Toutes les factures</span>
        </NavLink>
        <NavLink to="/factures/nouvelle" className="flex items-center space-x-2 hover:text-primary">
          <PlusCircle className="h-5 w-5" />
          <span>Créer une facture</span>
        </NavLink>
        <NavLink to="/factures?status=unpaid" className="flex items-center space-x-2 hover:text-primary">
          <CircleAlert className="h-5 w-5" />
          <span>Factures non payées</span>
        </NavLink>
        <NavLink to="/clients" className="flex items-center space-x-2 hover:text-primary">
          <Users className="h-5 w-5" />
          <span>Clients</span>
        </NavLink>
        <button onClick={toggleTheme} className="flex items-center space-x-2 hover:text-primary">
          <Sun className="h-5 w-5" />
          <span>Changer le thème ({theme})</span>
        </button>
      </nav>
    </aside>
  )
}
