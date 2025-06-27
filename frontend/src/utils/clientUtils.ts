export interface ClientInfo {
  id: number;
  nom_client: string;
  prenom_client?: string;
  nom_entreprise?: string;
}

export function getClientName(id: number | undefined, clients: ClientInfo[]): string {
  if (!id) return 'Client inconnu';
  const client = clients.find(c => c.id === id);
  if (!client) return 'Client inconnu';
  return (
    client.nom_entreprise ||
    [client.nom_client, client.prenom_client].filter(Boolean).join(' ')
  );
}
