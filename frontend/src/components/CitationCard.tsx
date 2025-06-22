import React from "react";

interface CitationProps {
  texte: string;
  auteur: string;
}

const CitationCard: React.FC<CitationProps> = ({ texte, auteur }) => {
  // Ajustement dynamique de la taille de la police
  const tailleTexte = texte.length > 180 ? "text-base" : texte.length > 100 ? "text-lg" : "text-xl";

  return (
    <div className="bg-neutral-900 rounded-xl shadow-lg p-6 flex flex-col justify-center items-center text-white transition-all max-w-2xl mx-auto animate-fade-in">
      <p
        className={`italic leading-relaxed text-center font-serif ${tailleTexte}`}
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        “{texte}”
      </p>
      <span className="mt-4 text-sm text-gray-400">— {auteur}</span>
    </div>
  );
};

export default CitationCard;
