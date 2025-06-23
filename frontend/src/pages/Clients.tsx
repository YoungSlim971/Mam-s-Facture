import { useState, useEffect, FormEvent } from 'react'
import { Plus, X, Edit, Save, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
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
  email?: string
  intitule?: string
  siren?: string
  siret?: string
  legal_form?: string
  tva?: string
  rcs_number?: string
  factures: number[]
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const navigate = useNavigate()
  const [nom, setNom] = useState('')
  const [entreprise, setEntreprise] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [email, setEmail] = useState('')
  const [intitule, setIntitule] = useState('')
  const [siren, setSiren] = useState('')
  const [siret, setSiret] = useState('')
  const [legalForm, setLegalForm] = useState('')
  const [tva, setTva] = useState('')
  const [rcsNumber, setRcsNumber] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNom, setEditNom] = useState('')
  const [editEntreprise, setEditEntreprise] = useState('')
  const [editTelephone, setEditTelephone] = useState('')
  const [editAdresse, setEditAdresse] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editIntitule, setEditIntitule] = useState('')
  const [editSiren, setEditSiren] = useState('')
  const [editSiret, setEditSiret] = useState('')
  const [editLegalForm, setEditLegalForm] = useState('')
  const [editTva, setEditTva] = useState('')
  const [editRcsNumber, setEditRcsNumber] = useState('')

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
        adresse,
        email,
        intitule,
        siren,
        siret,
        legal_form: legalForm,
        tva,
        rcs_number: rcsNumber
      })
    })
    if (res.ok) {
      setNom('')
      setEntreprise('')
      setTelephone('')
      setAdresse('')
      setEmail('')
      setIntitule('')
      setSiren('')
      setSiret('')
      setLegalForm('')
      setTva('')
      setRcsNumber('')
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
        adresse: editAdresse,
        email: editEmail,
        intitule: editIntitule,
        siren: editSiren,
        siret: editSiret,
        legal_form: editLegalForm,
        tva: editTva,
        rcs_number: editRcsNumber
      })
    })
    if (res.ok) {
      setEditingId(null)
      setEditNom('')
      setEditEntreprise('')
      setEditTelephone('')
      setEditAdresse('')
      setEditEmail('')
      setEditIntitule('')
      setEditSiren('')
      setEditSiret('')
      setEditLegalForm('')
      setEditTva('')
      setEditRcsNumber('')
      chargerClients()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        className="text-blue-600 hover:underline flex items-center"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Retour
      </button>
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
            <form onSubmit={creerClient} className="w-full space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              </div>

              <fieldset className="border border-gray-200 p-2 rounded-md">
                <legend className="text-sm font-medium">Informations légales</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label>Email</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label>Intitulé</Label>
                    <Input value={intitule} onChange={(e) => setIntitule(e.target.value)} />
                  </div>
                  <div>
                    <Label>SIREN</Label>
                    <Input value={siren} onChange={(e) => setSiren(e.target.value)} />
                  </div>
                  <div>
                    <Label>SIRET</Label>
                    <Input value={siret} onChange={(e) => setSiret(e.target.value)} />
                  </div>
                  <div>
                    <Label>Forme juridique</Label>
                    <Input value={legalForm} onChange={(e) => setLegalForm(e.target.value)} />
                  </div>
                  <div>
                    <Label>N° TVA</Label>
                    <Input value={tva} onChange={(e) => setTva(e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>N° RCS</Label>
                    <Input value={rcsNumber} onChange={(e) => setRcsNumber(e.target.value)} />
                  </div>
                </div>
              </fieldset>

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
                    setEmail('')
                    setIntitule('')
                    setSiren('')
                    setSiret('')
                    setLegalForm('')
                    setTva('')
                    setRcsNumber('')
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
                <form onSubmit={majClient} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  </div>

                  <fieldset className="border border-gray-200 p-2 rounded-md">
                    <legend className="text-sm font-medium">Informations légales</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div>
                        <Label>Email</Label>
                        <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                      </div>
                      <div>
                        <Label>Intitulé</Label>
                        <Input value={editIntitule} onChange={(e) => setEditIntitule(e.target.value)} />
                      </div>
                      <div>
                        <Label>SIREN</Label>
                        <Input value={editSiren} onChange={(e) => setEditSiren(e.target.value)} />
                      </div>
                      <div>
                        <Label>SIRET</Label>
                        <Input value={editSiret} onChange={(e) => setEditSiret(e.target.value)} />
                      </div>
                      <div>
                        <Label>Forme juridique</Label>
                        <Input value={editLegalForm} onChange={(e) => setEditLegalForm(e.target.value)} />
                      </div>
                      <div>
                        <Label>N° TVA</Label>
                        <Input value={editTva} onChange={(e) => setEditTva(e.target.value)} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>N° RCS</Label>
                        <Input value={editRcsNumber} onChange={(e) => setEditRcsNumber(e.target.value)} />
                      </div>
                    </div>
                  </fieldset>

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
                      setEditEmail(c.email || '')
                      setEditIntitule(c.intitule || '')
                      setEditSiren(c.siren || '')
                      setEditSiret(c.siret || '')
                      setEditLegalForm(c.legal_form || '')
                      setEditTva(c.tva || '')
                      setEditRcsNumber(c.rcs_number || '')
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
                {c.email && <div>{c.email}</div>}
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
