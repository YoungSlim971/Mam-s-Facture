import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiClient, UserProfileJson } from '@/lib/api'; // Assuming UserProfileJson is exported from api.ts
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit3 } from 'lucide-react';

const AfficherProfilUtilisateur: React.FC = () => {
  const [profile, setProfile] = useState<UserProfileJson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.getUserProfile(); // Fetches the JSON structure
        if (data) {
          setProfile(data);
        } else {
          // This case should ideally be handled by the 404 catch block
          toast({
            title: 'Profil non trouvé',
            description: 'Aucun profil utilisateur configuré. Veuillez compléter vos informations.',
            variant: 'default',
          });
          navigate('/profile');
        }
      } catch (error: any) {
        console.error('Failed to fetch profile for display:', error);
        if (error.message && error.message.includes('404')) {
           toast({
            title: 'Profil non trouvé',
            description: 'Veuillez compléter vos informations pour créer votre profil.',
            variant: 'default',
          });
        } else {
            toast({
                title: 'Erreur de chargement',
                description: 'Impossible de charger les informations du profil.',
                variant: 'destructive',
            });
        }
        navigate('/profile'); // Redirect to edit page if profile doesn't exist or error
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate, toast]);

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Chargement du profil...</div>;
  }

  if (!profile) {
    // This is a fallback, useEffect should already redirect
    return (
        <div className="container mx-auto p-4 text-center">
            <p>Profil non trouvé. Vous allez être redirigé...</p>
        </div>
    );
  }

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));


  return (
    <div className="container mx-auto p-4">
        <Button variant="ghost" onClick={goBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Résumé de votre profil utilisateur</CardTitle>
          <CardDescription>Voici les informations légales enregistrées pour votre entreprise.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-500">Raison Sociale</p>
              <p className="text-gray-900">{profile.raison_sociale || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Forme Juridique</p>
              <p className="text-gray-900">{profile.forme_juridique || 'N/A'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="font-medium text-gray-500">Adresse complète</p>
              <p className="text-gray-900">{`${profile.adresse || ''}, ${profile.code_postal || ''} ${profile.ville || ''}`}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">SIRET</p>
              <p className="text-gray-900">{profile.siret || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Code APE/NAF</p>
              <p className="text-gray-900">{profile.ape_naf || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">N° TVA Intracommunautaire</p>
              <p className="text-gray-900">{profile.tva_intra || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">RCS ou RM</p>
              <p className="text-gray-900">{profile.rcs_ou_rm || 'N/A'}</p>
            </div>
          </div>
          <div className="pt-6 text-center">
            <Button asChild>
              <Link to="/profile">
                <Edit3 className="mr-2 h-4 w-4" /> Modifier mes informations
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AfficherProfilUtilisateur;
