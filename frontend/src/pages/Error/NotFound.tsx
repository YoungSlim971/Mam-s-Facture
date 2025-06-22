import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  const goHome = () => navigate('/');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-4">
      <h1 className="text-3xl font-bold">Page non trouvée</h1>
      <p className="text-gray-600">La page demandée n'existe pas.</p>
      <button
        onClick={goHome}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Retour à l'accueil
      </button>
    </div>
  );
}
