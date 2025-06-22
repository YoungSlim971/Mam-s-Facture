import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_URL } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

interface Client {
  id: number
  nom_client: string
  nom_entreprise?: string
  telephone?: string
  adresse?: string
  factures: number[]
}

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)

  useEffect(() => {
    const fetchClient = async () => {
      const res = await fetch(`${API_URL}/clients/${id}`)
      if (res.ok) {
        const data = await res.json()
        setClient(data)
      }
    }
    if (id) fetchClient()
  }, [id])

  if (!client) {
    return (
      <div className="p-6">
        <Link to="/clients" className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Link>
        <p>Client introuvable.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Link to="/clients" className="text-blue-600 hover:underline flex items-center">
        <ArrowLeft className="h-4 w-4 mr-1" /> Retour
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{client.nom_client}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {client.nom_entreprise && <div>Entreprise : {client.nom_entreprise}</div>}
          {client.telephone && <div>Téléphone : {client.telephone}</div>}
          {client.adresse && <div>Adresse : {client.adresse}</div>}
          <div>{(client.factures || []).length} facture(s)</div>
        </CardContent>
      </Card>
    </div>
  )
}
