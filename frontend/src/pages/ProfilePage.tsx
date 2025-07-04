import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient, UserProfileJson } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { saveUserProfileToLocal } from '@/utils/userProfile';

// This interface represents the data structure used by the form in this component.
// It will be mapped to the JSON structure when sending to the backend.
interface FormProfileData {
  full_name: string; // maps to raison_sociale
  address_street: string; // maps to adresse
  address_postal_code: string; // maps to code_postal
  address_city: string; // maps to ville
  siret_siren: string; // maps to siret
  ape_naf_code: string; // maps to ape_naf
  vat_number?: string; // maps to tva_intra
  legal_form: string; // maps to forme_juridique
  rcs_rm: string; // maps to rcs_ou_rm
  // Fields not in the target JSON but kept in form for now (can be removed if not needed)
  email: string;
  phone: string;
  activity_start_date?: string;
  social_capital?: string;
}

const initialProfileData: FormProfileData = {
  full_name: '',
  address_street: '',
  address_postal_code: '',
  address_city: '',
  siret_siren: '',
  ape_naf_code: '',
  vat_number: '',
  email: '',
  phone: '',
  activity_start_date: '',
  legal_form: '',
  rcs_rm: '',
  social_capital: '',
  // Default other fields not in JSON (already defined above)
  // email: '', // Duplicate removed
  // phone: '', // Duplicate removed
  // activity_start_date: '', // Duplicate removed
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<FormProfileData>(initialProfileData);
  const [originalProfile, setOriginalProfile] = useState<FormProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileJson | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const dataFromApi = await apiClient.getUserProfile(); // This now fetches JSON structure
        if (dataFromApi) {
          const expected = [
            'raison_sociale',
            'adresse',
            'code_postal',
            'ville',
            'forme_juridique',
            'siret',
            'ape_naf',
            'tva_intra',
            'rcs_ou_rm',
            'email',
            'phone',
            'social_capital',
            'activity_start_date'
          ] as const;
          expected.forEach(field => {
            if (!dataFromApi[field]) {
              console.warn(`Champ manquant dans le profil utilisateur: ${field}`);
            }
          });
          // Map incoming JSON structure to form fields
          const formCompatibleData: FormProfileData = {
            full_name: dataFromApi.raison_sociale || '',
            address_street: dataFromApi.adresse || '',
            address_postal_code: dataFromApi.code_postal || '',
            address_city: dataFromApi.ville || '',
            siret_siren: dataFromApi.siret || '',
            ape_naf_code: dataFromApi.ape_naf || '',
            vat_number: dataFromApi.tva_intra || '',
            legal_form: dataFromApi.forme_juridique || '',
            rcs_rm: dataFromApi.rcs_ou_rm || '',
            // For fields not in JSON, try to get them if they were part of old structure, or default
            // This part might need adjustment based on whether these fields are still stored anywhere else
            // or if they should be removed from the form if not part of the new spec.
            // For now, we assume they might come from an older profile or should be empty.
            email: dataFromApi.email || 'demo@example.com',
            phone: dataFromApi.phone || '0000000000',
            activity_start_date: dataFromApi.activity_start_date || '1970-01-01',
            social_capital: dataFromApi.social_capital || '0',
          };
          setProfile(formCompatibleData);
          setOriginalProfile(formCompatibleData);
          setIsDirty(false);
          setUserProfile(dataFromApi);
          setIsEditing(false);
        }
      } catch (error: any) {
        if (error.message && error.message.includes('404')) {
          // Profile not found, it's okay, user can create one.
          // Set form to initial (empty) state.
          setProfile(initialProfileData);
          setOriginalProfile(initialProfileData);
          setIsDirty(false);
          setUserProfile(null);
          setIsEditing(false);
           toast({
            title: 'Profil non trouvé',
            description: 'Veuillez compléter vos informations pour créer votre profil.',
            variant: 'default',
          });
        } else {
          console.error('Failed to fetch profile:', error);
          setUserProfile(null);
          setIsEditing(false);
          toast({
            title: 'Erreur de chargement',
            description: 'Impossible de charger les informations du profil existant.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => {
      const updated = { ...prev, [name]: value };
      if (originalProfile) {
        const changed = Object.keys(updated).some(
          key => (updated as any)[key] !== (originalProfile as any)[key]
        );
        setIsDirty(changed);
      }
      return updated;
    });
  };

  const validateProfile = (data: FormProfileData): boolean => {
    const requiredFormFields: { key: keyof FormProfileData, name: string }[] = [
        { key: 'full_name', name: "Nom / Raison sociale" },
        { key: 'address_street', name: "Adresse de l’entreprise (rue)" },
        { key: 'address_postal_code', name: "Code postal" },
        { key: 'address_city', name: "Ville" },
        { key: 'legal_form', name: "Forme juridique" },
        { key: 'siret_siren', name: "Numéro SIRET / SIREN" },
        { key: 'ape_naf_code', name: "Code APE / NAF" },
        // rcs_rm and tva_intra are optional in the form as per original ProfilePage structure
    ];

    for (const field of requiredFormFields) {
        if (!data[field.key] || String(data[field.key]).trim() === '') {
            toast({
                title: 'Champ requis manquant',
                description: `Le champ '${field.name}' est obligatoire.`,
                variant: 'destructive',
            });
            return false;
        }
    }
    // Basic SIRET/SIREN format check (9 or 14 digits) - can be enhanced
    if (data.siret_siren && !/^\d{9}(\d{5})?$/.test(data.siret_siren.replace(/\s/g, ''))) {
        toast({
            title: 'Format SIRET/SIREN invalide',
            description: 'Le numéro SIRET/SIREN doit contenir 9 ou 14 chiffres.',
            variant: 'destructive',
        });
        return false;
    }
    // Basic CP format check (5 digits for France) - can be enhanced
    if (data.address_postal_code && !/^\d{5}$/.test(data.address_postal_code)) {
         toast({
            title: 'Format Code Postal invalide',
            description: 'Le code postal doit contenir 5 chiffres.',
            variant: 'destructive',
        });
        return false;
    }

    return true;
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateProfile(profile)) {
        return;
    }

    setIsSaving(true);

    // Map form data to the structure expected by the backend (matching profil_utilisateur.json keys)
    const dataToSave = {
        // These keys match the backend's `profileToSave` object in server.js
        // which in turn maps to `writeUserProfile` that expects the JSON keys.
        full_name: profile.full_name, // This will be mapped to raison_sociale by apiClient or backend
        address_street: profile.address_street, // Mapped to adresse
        address_postal_code: profile.address_postal_code, // Mapped to code_postal
        address_city: profile.address_city, // Mapped to ville
        legal_form: profile.legal_form, // Mapped to forme_juridique
        siret_siren: profile.siret_siren, // Mapped to siret
        ape_naf_code: profile.ape_naf_code, // Mapped to ape_naf
        vat_number: profile.vat_number, // Mapped to tva_intra
        rcs_rm: profile.rcs_rm, // Mapped to rcs_ou_rm
        // Other fields from FormProfileData (email, phone, etc.) are not part of the target JSON structure.
        // If apiClient.updateUserProfile expects them (e.g. due to a shared ProfileData type there),
        // they can be included here, but the backend will only pick the ones it needs for the JSON.
        // For clarity, only include what's relevant for the JSON or what apiClient strictly requires.
        // Assuming apiClient.updateUserProfile can handle the FormProfileData structure and the backend
        // correctly picks the fields for the JSON.
        // The apiClient.updateUserProfile in api.ts expects a ProfileData type, which is similar to FormProfileData.
        // The backend has a mapping step, so sending FormProfileData should be fine.
        ...profile // Send the whole form profile, backend will pick
    };

    try {
      const saved = await apiClient.updateUserProfile(dataToSave);
      saveUserProfileToLocal(saved);
      toast({
        title: 'Modifications enregistrées avec succès ✅',
        variant: 'default'
      });
      const refreshed = await apiClient.getUserProfile();
      const formData: FormProfileData = {
        full_name: refreshed.raison_sociale || '',
        address_street: refreshed.adresse || '',
        address_postal_code: refreshed.code_postal || '',
        address_city: refreshed.ville || '',
        siret_siren: refreshed.siret || '',
        ape_naf_code: refreshed.ape_naf || '',
        vat_number: refreshed.tva_intra || '',
        legal_form: refreshed.forme_juridique || '',
        rcs_rm: refreshed.rcs_ou_rm || '',
        email: refreshed.email || 'demo@example.com',
        phone: refreshed.phone || '0000000000',
        activity_start_date: refreshed.activity_start_date || '1970-01-01',
        social_capital: refreshed.social_capital || '0'
      };
      setProfile(formData);
      setOriginalProfile(formData);
      setIsDirty(false);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      toast({
        title: 'Erreur Enregistrement',
        description: error.response?.data?.details || error.message || 'Impossible d’enregistrer les informations du profil.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setIsEditing(false);
      const updated = await apiClient.getUserProfile();
      setUserProfile(updated);
    }
  };

  if (isLoading) {
    return <div>Chargement des informations du profil...</div>;
  }

  if (!isEditing) {
    if (userProfile) {
      return (
        <div className="container mx-auto p-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Résumé de votre profil utilisateur</CardTitle>
              <CardDescription>Voici les informations légales enregistrées pour votre entreprise.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-500">Raison Sociale</p>
                  <p className="text-gray-900">{userProfile.raison_sociale || '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Forme Juridique</p>
                  <p className="text-gray-900">{userProfile.forme_juridique || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-medium text-gray-500">Adresse complète</p>
                  <p className="text-gray-900">{`${userProfile.adresse || ''}, ${userProfile.code_postal || ''} ${userProfile.ville || ''}`}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">SIRET</p>
                  <p className="text-gray-900">{userProfile.siret || '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Code APE/NAF</p>
                  <p className="text-gray-900">{userProfile.ape_naf || '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">N° TVA Intracommunautaire</p>
                  <p className="text-gray-900">{userProfile.tva_intra || '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">RCS ou RM</p>
                  <p className="text-gray-900">{userProfile.rcs_ou_rm || '-'}</p>
                </div>
              </div>
              <div className="pt-6 text-center">
                <Button onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Aucune information enregistrée.</p>
        <Button onClick={() => setIsEditing(true)} className="mt-4">Ajouter mes informations</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mes informations</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <Label htmlFor="full_name">Nom / Raison sociale</Label>
          <Input id="full_name" name="full_name" value={profile.full_name} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="address_street">Adresse de l’entreprise (rue)</Label>
          <Input id="address_street" name="address_street" value={profile.address_street} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="address_postal_code">Code postal</Label>
            <Input id="address_postal_code" name="address_postal_code" value={profile.address_postal_code} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="address_city">Ville</Label>
            <Input id="address_city" name="address_city" value={profile.address_city} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <Label htmlFor="legal_form">Forme juridique</Label>
          <Input id="legal_form" name="legal_form" value={profile.legal_form} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="siret_siren">Numéro SIRET / SIREN</Label>
          <Input id="siret_siren" name="siret_siren" value={profile.siret_siren} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="ape_naf_code">Code APE / NAF</Label>
          <Input id="ape_naf_code" name="ape_naf_code" value={profile.ape_naf_code} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="vat_number">Numéro de TVA intracommunautaire (facultatif)</Label>
          <Input id="vat_number" name="vat_number" value={profile.vat_number || ''} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="rcs_rm">RCS ou RM</Label>
          <Input id="rcs_rm" name="rcs_rm" value={profile.rcs_rm} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input id="email" name="email" type="email" value={profile.email} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input id="phone" name="phone" type="tel" value={profile.phone} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <Label htmlFor="social_capital">Capital social (facultatif)</Label>
          <Input id="social_capital" name="social_capital" value={profile.social_capital || ''} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="activity_start_date">Date de début d’activité (facultatif)</Label>
          <Input id="activity_start_date" name="activity_start_date" type="date" value={profile.activity_start_date || ''} onChange={handleChange} />
        </div>

        <Button type="submit" disabled={isSaving || !isDirty}>
          {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </form>
    </div>
  );
}
