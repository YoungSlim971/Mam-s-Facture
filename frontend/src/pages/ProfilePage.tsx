import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast'; // Corrected import path
import { apiClient } from '@/lib/api'; // Import the actual apiClient

interface ProfileData {
  full_name: string;
  address_street: string;
  address_postal_code: string;
  address_city: string;
  siret_siren: string;
  ape_naf_code: string;
  vat_number?: string;
  email: string;
  phone: string;
  activity_start_date?: string;
  legal_form: string; // Added: Forme juridique
  rcs_rm: string; // Added: RCS ou RM
  social_capital?: string; // Added: Capital social (facultatif)
}

const initialProfileData: ProfileData = {
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
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(initialProfileData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.getUserProfile();
        if (data) {
          // Ensure all fields are at least empty strings if null/undefined from API
          const sanitizedData: ProfileData = {
            full_name: data.full_name || '',
            address_street: data.address_street || '',
            address_postal_code: data.address_postal_code || '',
            address_city: data.address_city || '',
            siret_siren: data.siret_siren || '',
            ape_naf_code: data.ape_naf_code || '',
            vat_number: data.vat_number || '',
            email: data.email || '',
            phone: data.phone || '',
            activity_start_date: data.activity_start_date || '',
            legal_form: data.legal_form || '',
            rcs_rm: data.rcs_rm || '',
            social_capital: data.social_capital || '',
          };
          setProfile(sanitizedData);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les informations du profil.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.updateUserProfile(profile);
      toast({
        title: 'Succès',
        description: 'Informations du profil mises à jour.',
      });
      // Optionally re-fetch data or update state if API returns the updated object
      const updatedData = await apiClient.getUserProfile();
      if (updatedData) {
         const sanitizedData: ProfileData = {
            full_name: updatedData.full_name || '',
            address_street: updatedData.address_street || '',
            address_postal_code: updatedData.address_postal_code || '',
            address_city: updatedData.address_city || '',
            siret_siren: updatedData.siret_siren || '',
            ape_naf_code: updatedData.ape_naf_code || '',
            vat_number: updatedData.vat_number || '',
            email: updatedData.email || '',
            phone: updatedData.phone || '',
            activity_start_date: updatedData.activity_start_date || '',
            legal_form: updatedData.legal_form || '',
            rcs_rm: updatedData.rcs_rm || '',
            social_capital: updatedData.social_capital || '',
          };
        setProfile(sanitizedData);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d’enregistrer les informations du profil.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Chargement des informations du profil...</div>;
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

        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </form>
    </div>
  );
}
