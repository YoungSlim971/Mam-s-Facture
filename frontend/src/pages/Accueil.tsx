import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Plus, BarChart3, Users } from 'lucide-react';
import {
  QuoteCard,
  SunsetImageCard,
  StatsCarousel,
} from '@/components/cards';

export default function Accueil() {
  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Header */}
      <header
        className="bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white shadow-sm border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                MAM's FACTURE
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Gestion de factures simplifiée
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Bienvenue dans votre espace de facturation,{' '}
            <span className="text-indigo-600">Caroline MIRRE</span>
          </h2>
        <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
          Gérez vos factures facilement avec notre solution complète.
          Créez, modifiez et exportez vos factures en quelques clics.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <QuoteCard />
        <SunsetImageCard />
        <StatsCarousel />
      </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Toutes les factures */}
          <Link
            to="/factures"
            className="group relative bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-xl mb-6 group-hover:bg-indigo-200 transition-colors">
              <FileText className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Toutes les factures
            </h3>
            <p className="text-gray-600 mb-4">
              Consultez, recherchez et gérez toutes vos factures existantes. 
              Filtrez par période, client ou montant.
            </p>
            <div className="flex items-center text-indigo-600 font-semibold">
              Accéder à la liste
              <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Créer une nouvelle facture */}
          <Link
            to="/factures/nouvelle"
            className="group relative bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-white"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-xl mb-6 group-hover:bg-opacity-30 transition-colors">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">
              Créer une nouvelle facture
            </h3>
            <p className="text-indigo-100 mb-4">
              Créez rapidement une nouvelle facture avec notre formulaire intuitif. 
              Calculs automatiques et mise en forme professionnelle.
            </p>
            <div className="flex items-center font-semibold">
              Commencer maintenant
              <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Fonctionnalités principales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 mx-auto">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Gestion complète
              </h4>
              <p className="text-gray-600">
                Créez, modifiez, supprimez et exportez vos factures en PDF
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 mx-auto">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Gestion clients
              </h4>
              <p className="text-gray-600">
                Enregistrez les informations de vos clients pour un accès rapide
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4 mx-auto">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Export PDF
              </h4>
              <p className="text-gray-600">
                Générez des PDFs professionnels prêts à envoyer à vos clients
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 MAM's FACTURE. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
