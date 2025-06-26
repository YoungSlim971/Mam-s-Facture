import { useState, useEffect, FormEvent } from 'react'
import { Plus, X, Edit, Save, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL, apiClient } from '@/lib/api'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'; // Added useToast

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
  forme_juridique?: string
  tva?: string; // This will be "Numéro de TVA intracommunautaire"
  rcs_number?: string
  rcs?: string
  adresse_facturation_rue?: string;
  adresse_facturation_cp?: string;
  adresse_facturation_ville?: string;
  adresse_livraison_rue?: string;
  adresse_livraison_cp?: string;
  adresse_livraison_ville?: string;
  totalInvoices?: number;
  unpaidInvoices?: number;
  factures: number[]
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  // New client form state
  const [nom, setNom] = useState('') // Nom / Raison sociale (uses nom_client for individual, entreprise for company)
  const [entreprise, setEntreprise] = useState('') // Nom / Raison sociale (entreprise part)
  const [telephone, setTelephone] = useState('') // Not in spec for new client form, but exists
  const [email, setEmail] = useState('') // Not in spec for new client form, but exists

  const [adresseFacturationRue, setAdresseFacturationRue] = useState('')
  const [adresseFacturationCp, setAdresseFacturationCp] = useState('')
  const [adresseFacturationVille, setAdresseFacturationVille] = useState('')

  const [adresseLivraisonIdentique, setAdresseLivraisonIdentique] = useState(true)
  const [adresseLivraisonRue, setAdresseLivraisonRue] = useState('')
  const [adresseLivraisonCp, setAdresseLivraisonCp] = useState('')
  const [adresseLivraisonVille, setAdresseLivraisonVille] = useState('')

  const [tvaClient, setTvaClient] = useState('') // Numéro de TVA intracommunautaire (facultatif)

  // Existing state for other fields (potentially for edit form or if they are kept generally)
  const [intitule, setIntitule] = useState('')
  const [siren, setSiren] = useState('')
  const [siret, setSiret] = useState('')
  const [legalForm, setLegalForm] = useState('')
  const [rcsNumber, setRcsNumber] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const { toast } = useToast(); // Initialize useToast

  // Edit form state (to be updated similarly if full edit functionality is maintained for new fields)
  const [editNom, setEditNom] = useState('')
  const [editEntreprise, setEditEntreprise] = useState('')
  const [editTelephone, setEditTelephone] = useState('')
  // const [editAdresse, setEditAdresse] = useState('') // Old field
  const [editEmail, setEditEmail] = useState('')
  const [editIntitule, setEditIntitule] = useState('')
  const [editSiren, setEditSiren] = useState('')
  const [editSiret, setEditSiret] = useState('')
  const [editLegalForm, setEditLegalForm] = useState('')
  // const [editTva, setEditTva] = useState('') // Will become editTvaClient
  const [editRcsNumber, setEditRcsNumber] = useState('')

  // New edit state for structured addresses and client TVA
  const [editAdresseFacturationRue, setEditAdresseFacturationRue] = useState('');
  const [editAdresseFacturationCp, setEditAdresseFacturationCp] = useState('');
  const [editAdresseFacturationVille, setEditAdresseFacturationVille] = useState('');
  const [editAdresseLivraisonIdentique, setEditAdresseLivraisonIdentique] = useState(true);
  const [editAdresseLivraisonRue, setEditAdresseLivraisonRue] = useState('');
  const [editAdresseLivraisonCp, setEditAdresseLivraisonCp] = useState('');
  const [editAdresseLivraisonVille, setEditAdresseLivraisonVille] = useState('');
  const [editTvaClient, setEditTvaClient] = useState('');


  const chargerClients = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiClient.getClients();
      console.log('Clients récupérés:', data)
      setClients(data);
    } catch (err: any) {
      console.error('Erreur chargement clients:', err);
      setError('Erreur lors du chargement des clients.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    chargerClients()
  }, [])

  const creerClient = async (e: FormEvent) => {
    e.preventDefault()
    if (!nom.trim()) return
    try {
      await apiClient.createClient({
        nom_client: nom,
        nom_entreprise: entreprise,
        telephone,
        email,
        intitule,
        siren,
        siret,
        legal_form: legalForm,
        rcs_number: rcsNumber,

      adresse_facturation_rue: adresseFacturationRue,
      adresse_facturation_cp: adresseFacturationCp,
      adresse_facturation_ville: adresseFacturationVille,

      adresse_livraison_rue: adresseLivraisonIdentique ? adresseFacturationRue : adresseLivraisonRue,
      adresse_livraison_cp: adresseLivraisonIdentique ? adresseFacturationCp : adresseLivraisonCp,
      adresse_livraison_ville: adresseLivraisonIdentique ? adresseFacturationVille : adresseLivraisonVille,

      tva: tvaClient,
      });
      toast({
        title: 'Client créé',
        description: `Le client ${nom} ${entreprise ? '('+entreprise+')' : ''} a été créé avec succès.`,
      });
      setNom('')
      setEntreprise('')
      setTelephone('')
      setEmail('')
      setIntitule('')
      setSiren('')
      setSiret('')
      setLegalForm('')
      setRcsNumber('')

      setAdresseFacturationRue('')
      setAdresseFacturationCp('')
      setAdresseFacturationVille('')
      setAdresseLivraisonIdentique(true)
      setAdresseLivraisonRue('')
      setAdresseLivraisonCp('')
      setAdresseLivraisonVille('')
      setTvaClient('')

      setShowForm(false)
      chargerClients()
    } catch (error: any) {
      toast({
        title: 'Erreur de création',
        description: error.message || 'Erreur lors de la création du client.',
        variant: 'destructive',
      });
    }
  }

  const majClient = async (e: FormEvent) => {
    e.preventDefault()
    if (editingId === null) return
    if (!editNom.trim()) return
    try {
      await apiClient.updateClient(editingId, {
        nom_client: editNom,
        nom_entreprise: editEntreprise,
        telephone: editTelephone,
        email: editEmail,
        intitule: editIntitule,
        siren: editSiren,
        siret: editSiret,
        legal_form: editLegalForm,
        rcs_number: editRcsNumber,

        adresse_facturation_rue: editAdresseFacturationRue,
        adresse_facturation_cp: editAdresseFacturationCp,
        adresse_facturation_ville: editAdresseFacturationVille,

        adresse_livraison_rue: editAdresseLivraisonIdentique ? editAdresseFacturationRue : editAdresseLivraisonRue,
        adresse_livraison_cp: editAdresseLivraisonIdentique ? editAdresseFacturationCp : editAdresseLivraisonCp,
        adresse_livraison_ville: editAdresseLivraisonIdentique ? editAdresseFacturationVille : editAdresseLivraisonVille,

        tva: editTvaClient,
      });
      setEditingId(null)
      // Reset edit form states
      setEditNom('')
      setEditEntreprise('')
      setEditTelephone('')
      setEditEmail('')
      setEditIntitule('')
      setEditSiren('')
      setEditSiret('')
      setEditLegalForm('')
      setEditRcsNumber('')
      setEditAdresseFacturationRue('');
      setEditAdresseFacturationCp('');
      setEditAdresseFacturationVille('');
      setEditAdresseLivraisonIdentique(true);
      setEditAdresseLivraisonRue('');
      setEditAdresseLivraisonCp('');
      setEditAdresseLivraisonVille('');
      setEditTvaClient('');
      chargerClients(); // Keep this to refresh the list if the user navigates back
      toast({
        title: 'Client mis à jour',
        description: `Le client ${editNom} ${editEntreprise ? '('+editEntreprise+')' : ''} a été mis à jour.`,
      });
      navigate(`/clients/${editingId}`); // Redirect to the client's profile page
    } catch (error: any) {
      toast({
        title: 'Erreur de mise à jour',
        description: error.message || 'Erreur lors de la mise à jour du client.',
        variant: 'destructive',
      });
    }
  }

  if (isLoading) {
    return <div className="p-6 text-center">Chargement des clients...</div>
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>
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
              <div>
                <Label htmlFor="nom_client_form">Nom du contact / Particulier *</Label>
                <Input id="nom_client_form" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Prénom Nom" />
              </div>
              <div>
                <Label htmlFor="entreprise_form">Raison sociale (si applicable)</Label>
                <Input id="entreprise_form" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} placeholder="Nom de l'entreprise" />
              </div>

              <fieldset className="border border-gray-200 p-3 rounded-md space-y-3">
                <legend className="text-sm font-medium px-1">Adresse de facturation</legend>
                <div>
                  <Label htmlFor="adresse_facturation_rue">Rue *</Label>
                  <Input id="adresse_facturation_rue" value={adresseFacturationRue} onChange={(e) => setAdresseFacturationRue(e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="adresse_facturation_cp">Code postal *</Label>
                    <Input id="adresse_facturation_cp" value={adresseFacturationCp} onChange={(e) => setAdresseFacturationCp(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="adresse_facturation_ville">Ville *</Label>
                    <Input id="adresse_facturation_ville" value={adresseFacturationVille} onChange={(e) => setAdresseFacturationVille(e.target.value)} required />
                  </div>
                </div>
              </fieldset>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="adresse_livraison_identique" checked={adresseLivraisonIdentique} onChange={(e) => setAdresseLivraisonIdentique(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                  <Label htmlFor="adresse_livraison_identique" className="text-sm font-medium">Adresse de livraison identique à l’adresse de facturation</Label>
                </div>

                {!adresseLivraisonIdentique && (
                  <fieldset className="border border-gray-200 p-3 rounded-md space-y-3">
                    <legend className="text-sm font-medium px-1">Adresse de livraison</legend>
                    <div>
                      <Label htmlFor="adresse_livraison_rue">Rue</Label>
                      <Input id="adresse_livraison_rue" value={adresseLivraisonRue} onChange={(e) => setAdresseLivraisonRue(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="adresse_livraison_cp">Code postal</Label>
                        <Input id="adresse_livraison_cp" value={adresseLivraisonCp} onChange={(e) => setAdresseLivraisonCp(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="adresse_livraison_ville">Ville</Label>
                        <Input id="adresse_livraison_ville" value={adresseLivraisonVille} onChange={(e) => setAdresseLivraisonVille(e.target.value)} />
                      </div>
                    </div>
                  </fieldset>
                )}
              </div>

              <div>
                <Label htmlFor="tva_client_form">Numéro de TVA intracommunautaire (facultatif)</Label>
                <Input id="tva_client_form" value={tvaClient} onChange={(e) => setTvaClient(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="siren_form">N° SIREN (facultatif)</Label>
                <Input id="siren_form" value={siren} onChange={(e) => setSiren(e.target.value)} placeholder="9 chiffres" />
              </div>
              <div>
                <Label htmlFor="siret_form">N° SIRET (facultatif)</Label>
                <Input id="siret_form" value={siret} onChange={(e) => setSiret(e.target.value)} placeholder="14 chiffres" />
              </div>

              {/* Optional: Keep other existing fields if needed, or remove them if they are not part of the "Créer un client" spec */}
              {/* For example, telephone and email are not in the spec but might be useful to keep */}
              <div>
                <Label htmlFor="telephone_form">Téléphone (facultatif)</Label>
                <Input id="telephone_form" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email_form">Email (facultatif)</Label>
                <Input type="email" id="email_form" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>


              <div className="flex gap-2">
                <Button type="submit">Ajouter</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNom('')
                    setEntreprise('')
                    setAdresseFacturationRue('')
                    setAdresseFacturationCp('')
                    setAdresseFacturationVille('')
                    setAdresseLivraisonIdentique(true)
                    setAdresseLivraisonRue('')
                    setAdresseLivraisonCp('')
                    setAdresseLivraisonVille('')
                    setTvaClient('')
                    setTelephone('') // Reset optional fields too
                    setEmail('')     // Reset optional fields too
                    // Reset other non-spec fields if they were shown in form
                    setIntitule('')
                    setSiren('')
                    setSiret('')
                    setLegalForm('')
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
        {clients.length === 0 && (
          <div className="col-span-full text-center text-gray-500">
            Aucun client trouvé
          </div>
        )}
        {clients.map((c) => (
          editingId === c.id ? (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>Modifier {c.nom_client || c.nom_entreprise}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Update Edit Form similarly to Create Form */}
                <form onSubmit={majClient} className="space-y-4">
                  <div>
                    <Label>Nom du contact / Particulier *</Label>
                    <Input value={editNom} onChange={(e) => setEditNom(e.target.value)} />
                  </div>
                  <div>
                    <Label>Raison sociale (si applicable)</Label>
                    <Input value={editEntreprise} onChange={(e) => setEditEntreprise(e.target.value)} />
                  </div>

                  <fieldset className="border border-gray-200 p-3 rounded-md space-y-3">
                    <legend className="text-sm font-medium px-1">Adresse de facturation</legend>
                    <div><Label htmlFor="edit_adr_fact_rue">Rue *</Label><Input id="edit_adr_fact_rue" value={editAdresseFacturationRue} onChange={e => setEditAdresseFacturationRue(e.target.value)} required /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><Label htmlFor="edit_adr_fact_cp">Code postal *</Label><Input id="edit_adr_fact_cp" value={editAdresseFacturationCp} onChange={e => setEditAdresseFacturationCp(e.target.value)} required /></div>
                      <div><Label htmlFor="edit_adr_fact_ville">Ville *</Label><Input id="edit_adr_fact_ville" value={editAdresseFacturationVille} onChange={e => setEditAdresseFacturationVille(e.target.value)} required /></div>
                    </div>
                  </fieldset>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id={`edit_adr_liv_identique_${c.id}`} checked={editAdresseLivraisonIdentique} onChange={(e) => setEditAdresseLivraisonIdentique(e.target.checked)} />
                      <Label htmlFor={`edit_adr_liv_identique_${c.id}`} className="text-sm font-medium">Adresse de livraison identique</Label>
                    </div>
                    {!editAdresseLivraisonIdentique && (
                      <fieldset className="border border-gray-200 p-3 rounded-md space-y-3">
                        <legend className="text-sm font-medium px-1">Adresse de livraison</legend>
                        <div><Label htmlFor="edit_adr_liv_rue">Rue</Label><Input id="edit_adr_liv_rue" value={editAdresseLivraisonRue} onChange={e => setEditAdresseLivraisonRue(e.target.value)} /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div><Label htmlFor="edit_adr_liv_cp">Code postal</Label><Input id="edit_adr_liv_cp" value={editAdresseLivraisonCp} onChange={e => setEditAdresseLivraisonCp(e.target.value)} /></div>
                          <div><Label htmlFor="edit_adr_liv_ville">Ville</Label><Input id="edit_adr_liv_ville" value={editAdresseLivraisonVille} onChange={e => setEditAdresseLivraisonVille(e.target.value)} /></div>
                        </div>
                      </fieldset>
                    )}
                  </div>
                  <div>
                    <Label>Numéro de TVA intracommunautaire (facultatif)</Label>
                    <Input value={editTvaClient} onChange={(e) => setEditTvaClient(e.target.value)} />
                  </div>
                  {/* Keep other editable fields like telephone, email etc. as they were */}
                  <div><Label>Téléphone</Label><Input value={editTelephone} onChange={e => setEditTelephone(e.target.value)} /></div>
                  <div><Label>Email</Label><Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} /></div>


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
                  <CardTitle>{c.nom_client || c.nom_entreprise}</CardTitle>
                  <button
                    onClick={() => {
                      setEditingId(c.id)
                      setEditNom(c.nom_client)
                      setEditEntreprise(c.nom_entreprise || '')
                      setEditTelephone(c.telephone || '')
                      // setEditAdresse(c.adresse || '') // Old field
                      setEditEmail(c.email || '')
                      setEditIntitule(c.intitule || '')
                      setEditSiren(c.siren || '')
                      setEditSiret(c.siret || '')
                      setEditLegalForm(c.legal_form || '')
                      // setEditTva(c.tva || '') // Old field
                      setEditRcsNumber(c.rcs_number || '')

                      // Populate new structured address fields for editing
                      setEditAdresseFacturationRue(c.adresse_facturation_rue || '');
                      setEditAdresseFacturationCp(c.adresse_facturation_cp || '');
                      setEditAdresseFacturationVille(c.adresse_facturation_ville || '');

                      // If delivery address is same as billing (all delivery fields are null/empty OR same as billing)
                      // This logic might need refinement based on how "sameness" is determined if old data exists
                      const isDeliverySame = (!c.adresse_livraison_rue && !c.adresse_livraison_cp && !c.adresse_livraison_ville) ||
                                             (c.adresse_livraison_rue === c.adresse_facturation_rue &&
                                              c.adresse_livraison_cp === c.adresse_facturation_cp &&
                                              c.adresse_livraison_ville === c.adresse_facturation_ville);
                      setEditAdresseLivraisonIdentique(isDeliverySame);
                      setEditAdresseLivraisonRue(c.adresse_livraison_rue || '');
                      setEditAdresseLivraisonCp(c.adresse_livraison_cp || '');
                      setEditAdresseLivraisonVille(c.adresse_livraison_ville || '');
                      setEditTvaClient(c.tva || ''); // Use existing 'tva' field for client's TVA
                    }}
                    className="p-1 text-gray-600 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {c.nom_entreprise && <div>{c.nom_entreprise}</div>}
                {/* Display new structured address fields if available */}
                {c.adresse_facturation_rue && <div>{`${c.adresse_facturation_rue}, ${c.adresse_facturation_cp} ${c.adresse_facturation_ville}`}</div>}
                {c.telephone && <div>Tél : {c.telephone}</div>}
                {c.email && <div>Email : {c.email}</div>}
                {c.tva && <div>TVA: {c.tva}</div>}
                <div className="text-xs text-zinc-500">
                  {c.totalInvoices ?? (c.factures || []).length} factures, {c.unpaidInvoices ?? 0} impayées
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
