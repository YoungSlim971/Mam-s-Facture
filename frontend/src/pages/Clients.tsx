import { useState, useEffect, FormEvent } from 'react'
import { Plus, X, Edit, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import { API_URL } from '@/lib/api'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

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
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNom, setEditNom] = useState('')
  const [editEntreprise, setEditEntreprise] = useState('')
  const [editTelephone, setEditTelephone] = useState('')
  const [editAdresse, setEditAdresse] = useState('')

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
      setShowForm(false)
      chargerClients()
    } else {
      const data = await res.json().catch(() => null)
      alert(data?.error || 'Erreur lors de la création du client')
    }
  }

  const majClient = async (e: FormEvent) => {
    e.preventDefault()
    if (editingId === null) return
    if (!editNom.trim()) return
    const res = await fetch(`${API_URL}/clients/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom_client: editNom,
        nom_entreprise: editEntreprise,
        telephone: editTelephone,
        adresse: editAdresse
      })
    })
    if (res.ok) {
      setEditingId(null)
      setEditNom('')
      setEditEntreprise('')
      setEditTelephone('')
      setEditAdresse('')
      chargerClients()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Gestion des clients</h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col justify-center items-center p-6">
          {!showForm ? (
            <button
              className="flex flex-col items-center space-y-2"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-8 w-8" />
              <span className="font-semibold">Nouveau client</span>
            </button>
          ) : (
            <form onSubmit={creerClient} className="w-full space-y-2">
              <div>
                <Label>Nom *</Label>
                <Input value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
              <div>
                <Label>Entreprise</Label>
                <Input
                  value={entreprise}
                  onChange={(e) => setEntreprise(e.target.value)}
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                />
              </div>
              <div>
                <Label>Adresse</Label>
                <Input
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Ajouter</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNom('')
                    setEntreprise('')
                    setTelephone('')
                    setAdresse('')
                    setShowForm(false)
                  }}
                >
                  <X className="h-4 w-4 mr-1" /> Annuler
                </Button>
              </div>
            </form>
          )}
        </Card>
        {clients.map((c) => (
          editingId === c.id ? (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>Modifier {c.nom_client}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={majClient} className="space-y-2">
                  <div>
                    <Label>Nom *</Label>
                    <Input value={editNom} onChange={(e) => setEditNom(e.target.value)} />
                  </div>
                  <div>
                    <Label>Entreprise</Label>
                    <Input value={editEntreprise} onChange={(e) => setEditEntreprise(e.target.value)} />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input value={editTelephone} onChange={(e) => setEditTelephone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Adresse</Label>
                    <Input value={editAdresse} onChange={(e) => setEditAdresse(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit"><Save className="h-4 w-4 mr-1" /> Sauvegarder</Button>
                    <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4 mr-1" /> Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{c.nom_client}</CardTitle>
                  <button
                    onClick={() => {
                      setEditingId(c.id)
                      setEditNom(c.nom_client)
                      setEditEntreprise(c.nom_entreprise || '')
                      setEditTelephone(c.telephone || '')
                      setEditAdresse(c.adresse || '')
                    }}
                    className="p-1 text-gray-600 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {c.nom_entreprise && <div>{c.nom_entreprise}</div>}
                {c.telephone && <div>{c.telephone}</div>}
                {c.adresse && <div>{c.adresse}</div>}
                <div className="text-xs text-zinc-500">
                  {(c.factures || []).length} facture(s)
                </div>
                <div>
                  <Link
                    to={`/clients/${c.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Voir profil
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>
    </div>
  )
}
