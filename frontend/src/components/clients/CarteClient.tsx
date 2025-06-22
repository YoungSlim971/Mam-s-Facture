import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

export interface Client {
  id: number
  nom_client: string
  prenom_client?: string
  nom_entreprise?: string
  telephone?: string
  email?: string
  adresse_facturation?: string
  adresse_livraison?: string
  siret?: string
  tva?: string
  logo?: string
  factures: number[]
}

export default function CarteClient({ client }: { client: Client }) {
  return (
    <Card className="p-4 flex flex-col items-center text-center space-y-2">
      {client.logo && (
        <img src={client.logo} className="h-16 object-contain" alt={client.nom_client} />
      )}
      <div className="font-semibold">
        {client.prenom_client ? `${client.prenom_client} ${client.nom_client}` : client.nom_client}
      </div>
      {client.nom_entreprise && <div>{client.nom_entreprise}</div>}
      {client.telephone && <div className="text-sm text-gray-500">{client.telephone}</div>}
      <div className="text-xs text-gray-500">
        {client.factures ? client.factures.length : 0} facture(s)
      </div>
      <Link to={`/clients/${client.id}`} className="text-blue-600 text-sm hover:underline">
        Voir fiche
      </Link>
    </Card>
  )
}
