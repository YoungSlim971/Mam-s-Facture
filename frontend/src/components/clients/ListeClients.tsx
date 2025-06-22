import { useEffect, useState } from 'react'
import FormulaireClient from './FormulaireClient'
import CarteClient, { Client } from './CarteClient'
import { Input } from '@/components/ui/input'
import { API_URL } from '@/lib/api'

export default function ListeClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')

  const load = async () => {
    const res = await fetch(`${API_URL}/clients`)
    if (res.ok) {
      const data = await res.json()
      setClients(data)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = clients.filter(c => {
    const term = search.toLowerCase()
    return (
      c.nom_client.toLowerCase().includes(term) ||
      (c.prenom_client && c.prenom_client.toLowerCase().includes(term)) ||
      (c.nom_entreprise && c.nom_entreprise.toLowerCase().includes(term)) ||
      (c.telephone && c.telephone.toLowerCase().includes(term))
    )
  })

  return (
    <div className="space-y-6">
      <Input
        placeholder="Rechercher..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 border rounded">
          <FormulaireClient onCreated={load} />
        </div>
        {filtered.map(c => (
          <CarteClient key={c.id} client={c} />
        ))}
      </div>
    </div>
  )
}
