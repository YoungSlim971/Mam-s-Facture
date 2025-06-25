import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Client } from './CarteClient'

export default function FicheClient() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)

  useEffect(() => {
    ;(async () => {
      if (id) {
        try {
          const data = await apiClient.getClient(Number(id))
          setClient(data)
        } catch (error) {
          console.error('Erreur chargement client', error)
        }
      }
    })()
  }, [id])

  if (!client) return <p>Chargement...</p>

  const billingAddress =
    client.adresse_facturation ||
    (client.adresse_facturation_rue && client.adresse_facturation_cp && client.adresse_facturation_ville
      ? `${client.adresse_facturation_rue}, ${client.adresse_facturation_cp} ${client.adresse_facturation_ville}`
      : '')

  const deliveryAddress =
    client.adresse_livraison ||
    (client.adresse_livraison_rue && client.adresse_livraison_cp && client.adresse_livraison_ville
      ? `${client.adresse_livraison_rue}, ${client.adresse_livraison_cp} ${client.adresse_livraison_ville}`
      : '')

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
        {billingAddress && (
          <div>
            <h4 className="font-medium">Adresse de facturation</h4>
            <p>{billingAddress}</p>
          </div>
        )}
        {deliveryAddress && (
          <div>
            <h4 className="font-medium">Adresse de livraison</h4>
            <p>{deliveryAddress}</p>
          </div>
        )}
        {(client.siren || client.siret || client.rcs_number || client.legal_form || client.tva) && (
          <div>
            <h4 className="font-medium">Informations légales</h4>
            {client.siren && <p>SIREN : {client.siren}</p>}
            {client.siret && <p>SIRET : {client.siret}</p>}
            {client.rcs_number && <p>RCS : {client.rcs_number}</p>}
            {client.legal_form && <p>Forme juridique : {client.legal_form}</p>}
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
