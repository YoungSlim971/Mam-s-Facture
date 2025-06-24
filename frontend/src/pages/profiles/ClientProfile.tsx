import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

interface Client {
  id: number
  nom_client: string
  prenom_client?: string
  nom_entreprise?: string
  telephone?: string
  email?: string
  adresse_facturation?: string
  adresse_livraison?: string
  adresse_facturation_rue?: string
  adresse_facturation_cp?: string
  adresse_facturation_ville?: string
  adresse_livraison_rue?: string
  adresse_livraison_cp?: string
  adresse_livraison_ville?: string
  intitule?: string
  siren?: string
  siret?: string
  legal_form?: string
  forme_juridique?: string
  tva?: string
  rcs_number?: string
  rcs?: string
  logo?: string
  factures: number[]
}

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)

  useEffect(() => {
    const fetchClient = async () => {
      const data = await apiClient.getClient(Number(id))
      setClient(data)
    }
    if (id) fetchClient()
  }, [id])

  if (!client) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="text-blue-600 hover:underline flex items-center mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </button>
        <p>Client introuvable.</p>
      </div>
    )
  }

  const billingAddress = client.adresse_facturation
    || (client.adresse_facturation_rue && client.adresse_facturation_cp && client.adresse_facturation_ville
      ? `${client.adresse_facturation_rue}, ${client.adresse_facturation_cp} ${client.adresse_facturation_ville}`
      : '')

  const deliveryAddress = client.adresse_livraison
    || (client.adresse_livraison_rue && client.adresse_livraison_cp && client.adresse_livraison_ville
      ? `${client.adresse_livraison_rue}, ${client.adresse_livraison_cp} ${client.adresse_livraison_ville}`
      : '')

  return (
    <div className="p-6 space-y-6">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        className="text-blue-600 hover:underline flex items-center"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Retour
      </button>
      <Card>
        <CardHeader>
          <CardTitle>{client.nom_client}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {client.logo ? (
            <img src={client.logo} alt="logo" className="h-20 object-contain" />
          ) : (
            <div className="h-20 w-20 bg-zinc-100 flex items-center justify-center rounded-md text-zinc-400">
              Aucune image
            </div>
          )}
          <div>Entreprise : {client.nom_entreprise || '-'}</div>
          <div>Téléphone : {client.telephone || '-'}</div>
          <div>Adresse facturation : {billingAddress || '-'}</div>
          <div>Adresse livraison : {deliveryAddress || '-'}</div>
          <div>Intitulé : {client.intitule || '-'}</div>

          <fieldset className="border border-gray-200 rounded-md p-2 shadow-sm space-y-1">
            <legend className="text-sm font-medium">Informations légales</legend>
            <div>Email : {client.email || '-'}</div>
            <div>SIREN : {client.siren || '-'}</div>
            <div>SIRET : {client.siret || '-'}</div>
            <div>RCS : {client.rcs_number || '-'}</div>
            <div>Forme juridique : {client.legal_form || '-'}</div>
            <div>N° TVA : {client.tva || '-'}</div>
          </fieldset>

          <div>{(client.factures || []).length} facture(s)</div>
        </CardContent>
      </Card>
    </div>
  )
}
