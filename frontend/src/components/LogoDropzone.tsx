import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { API_URL } from '@/lib/api';

interface Props {
  onUploaded: (path: string) => void;
  uploadUrl?: string;
}

export default function LogoDropzone({ onUploaded, uploadUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setError("Format d'image invalide");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image trop volumineuse (max 2 Mo)');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await fetch(`${API_URL}${uploadUrl || '/upload/logo'}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Upload échoué');
      const data = await res.json();
      onUploaded(data.path || `/uploads/${data.filename}`);
    } catch {
      setError("Erreur lors de l'upload");
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
      >
        {preview ? (
          <img src={preview} alt="Logo" className="mx-auto max-h-24" />
        ) : (
          <p className="text-gray-500">Glissez votre logo ici ou cliquez pour sélectionner</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={onChange}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
