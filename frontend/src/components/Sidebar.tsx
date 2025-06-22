import { NavLink } from 'react-router-dom'
import { Home, FileText, PlusCircle, CircleAlert, Sun, Users, Menu, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/use-mobile'
import { useState, useEffect } from 'react'

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(!isMobile)

  useEffect(() => {
    setOpen(!isMobile)
  }, [isMobile])

  const sidebar = (
    <aside
      className={`fixed left-0 top-0 z-50 h-full w-64 bg-sidebar p-6 text-sidebar-foreground shadow-lg transform transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {isMobile && (
        <button onClick={() => setOpen(false)} className="absolute top-2 right-2 p-1">
          <X className="h-5 w-5" />
        </button>
      )}
      <nav className="space-y-4 mt-6">
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

  return (
    <>
      {isMobile && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-2 left-2 z-40 p-2 bg-sidebar text-sidebar-foreground rounded-md shadow md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      {isMobile && open && (
        <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)} />
      )}
      {sidebar}
    </>
  )
}
