import React from "react";

export interface ClientType {
  id: number;
  nom_client: string;
  nom_entreprise?: string;
  email?: string;
  telephone?: string;
  siren?: string;
  siret?: string;
}

interface ClientCardProps {
  client: ClientType;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client }) => (
  <div className="border rounded p-4 space-y-1">
    <h3 className="text-lg font-semibold">{client.nom_client}</h3>
    {client.nom_entreprise && <div>{client.nom_entreprise}</div>}
    {client.email && <div>Email : {client.email}</div>}
    {client.telephone && <div>Téléphone : {client.telephone}</div>}
    {client.siren && <div>SIREN : {client.siren}</div>}
    {client.siret && <div>SIRET : {client.siret}</div>}
  </div>
);
