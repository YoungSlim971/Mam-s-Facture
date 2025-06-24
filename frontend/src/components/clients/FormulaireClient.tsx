import { useState, FormEvent } from 'react'
import LogoDropzone from '@/components/LogoDropzone'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'

interface Props {
  onCreated?: () => void
}

export default function FormulaireClient({ onCreated }: Props) {
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [entreprise, setEntreprise] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [adresseFact, setAdresseFact] = useState('')
  const [adresseLiv, setAdresseLiv] = useState('')
  const [siret, setSiret] = useState('')
  const [tva, setTva] = useState('')
  const [logo, setLogo] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!nom.trim()) return
    try {
      await apiClient.createClient({
        nom_client: nom,
        prenom_client: prenom,
        nom_entreprise: entreprise,
        telephone,
        email,
        adresse_facturation: adresseFact,
        adresse_livraison: adresseLiv,
        siret,
        tva,
        logo
      })
      setNom('')
      setPrenom('')
      setEntreprise('')
      setTelephone('')
      setEmail('')
      setAdresseFact('')
      setAdresseLiv('')
      setSiret('')
      setTva('')
      setLogo('')
      onCreated?.()
    } catch (error) {
      console.error('Erreur création client', error)
    }
      setNom('')
      setPrenom('')
      setEntreprise('')
      setTelephone('')
      setEmail('')
      setAdresseFact('')
      setAdresseLiv('')
      setSiret('')
      setTva('')
      setLogo('')
      onCreated?.()
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nom *</Label>
          <Input value={nom} onChange={e => setNom(e.target.value)} />
        </div>
        <div>
          <Label>Prénom</Label>
          <Input value={prenom} onChange={e => setPrenom(e.target.value)} />
        </div>
        <div>
          <Label>Entreprise</Label>
          <Input value={entreprise} onChange={e => setEntreprise(e.target.value)} />
        </div>
        <div>
          <Label>Téléphone</Label>
          <Input value={telephone} onChange={e => setTelephone(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Email</Label>
          <Input value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Adresse de facturation</Label>
          <Textarea value={adresseFact} onChange={e => setAdresseFact(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Adresse de livraison</Label>
          <Textarea value={adresseLiv} onChange={e => setAdresseLiv(e.target.value)} />
        </div>
        <div>
          <Label>Numéro SIRET</Label>
          <Input value={siret} onChange={e => setSiret(e.target.value)} />
        </div>
        <div>
          <Label>Numéro TVA</Label>
          <Input value={tva} onChange={e => setTva(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Logo</Label>
          <LogoDropzone uploadUrl="/upload/logo-client" onUploaded={setLogo} />
        </div>
      </div>
      <Button type="submit">Ajouter</Button>
    </form>
  )
}
