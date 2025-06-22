import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { API_URL } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Client } from './CarteClient'

export default function FicheClient() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`${API_URL}/clients/${id}`)
      if (res.ok) setClient(await res.json())
    })()
  }, [id])

  if (!client) return <p>Chargement...</p>

  return (
    <div className="space-y-4 p-4">
      <Button variant="outline" onClick={() => navigate(-1)}>
        Retour
      </Button>
      <Card className="p-6 space-y-2">
        {client.logo && (
          <img src={client.logo} alt="logo" className="h-20 object-contain" />
        )}
        <div className="text-xl font-semibold">
          {client.prenom_client ? `${client.prenom_client} ${client.nom_client}` : client.nom_client}
        </div>
        {client.nom_entreprise && <div>{client.nom_entreprise}</div>}
        {client.telephone && <div>{client.telephone}</div>}
        {client.email && <div>{client.email}</div>}
        {client.adresse_facturation && (
          <div>
            <h4 className="font-medium">Adresse de facturation</h4>
            <p>{client.adresse_facturation}</p>
          </div>
        )}
        {client.adresse_livraison && (
          <div>
            <h4 className="font-medium">Adresse de livraison</h4>
            <p>{client.adresse_livraison}</p>
          </div>
        )}
        {(client.siret || client.tva) && (
          <div>
            <h4 className="font-medium">Informations légales</h4>
            {client.siret && <p>SIRET : {client.siret}</p>}
            {client.tva && <p>TVA : {client.tva}</p>}
          </div>
        )}
      </Card>
      {client.factures && client.factures.length > 0 && (
        <Link to={`/factures?client=${client.id}`} className="text-blue-600 hover:underline">
          Voir ses factures
        </Link>
      )}
    </div>
  )
}
