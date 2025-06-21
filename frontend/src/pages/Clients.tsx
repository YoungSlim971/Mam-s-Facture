import { useState, useEffect, FormEvent } from 'react'
import { API_URL } from '@/lib/api'

interface Client {
  id: number
  nom_client: string
  nom_entreprise?: string
  telephone?: string
  adresse?: string
  factures: number[]
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [nom, setNom] = useState('')
  const [entreprise, setEntreprise] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')

  const chargerClients = async () => {
    const res = await fetch(`${API_URL}/clients`)
    if (res.ok) {
      const data = await res.json()
      setClients(data)
    }
  }

  useEffect(() => {
    chargerClients()
  }, [])

  const creerClient = async (e: FormEvent) => {
    e.preventDefault()
    if (!nom.trim()) return
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom_client: nom,
        nom_entreprise: entreprise,
        telephone,
        adresse
      })
    })
    if (res.ok) {
      setNom('')
      setEntreprise('')
      setTelephone('')
      setAdresse('')
      chargerClients()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Clients récurrents</h2>
      <form onSubmit={creerClient} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium">Nom *</label>
          <input
            className="border rounded w-full px-2 py-1"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Entreprise</label>
          <input
            className="border rounded w-full px-2 py-1"
            value={entreprise}
            onChange={(e) => setEntreprise(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Téléphone</label>
          <input
            className="border rounded w-full px-2 py-1"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Adresse</label>
          <input
            className="border rounded w-full px-2 py-1"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Ajouter
        </button>
      </form>
      <ul className="space-y-2">
        {clients.map((c) => (
          <li key={c.id} className="border p-2 rounded">
            <div className="font-semibold">{c.nom_client}</div>
            {c.nom_entreprise && <div>{c.nom_entreprise}</div>}
            <div className="text-sm">{c.factures.length} facture(s)</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
