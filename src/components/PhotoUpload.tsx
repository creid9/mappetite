import { useRef, useState } from 'react';
import { uploadPhoto } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface PhotoUploadProps {
  currentUrl: string | null;
  onUpload: (url: string) => void;
}

export default function PhotoUpload({ currentUrl, onUpload }: PhotoUploadProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const url = await uploadPhoto(user.id, file);
      onUpload(url);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {currentUrl && (
        <img src={currentUrl} alt="Restaurant" className="w-full h-40 object-cover rounded-lg mb-2" />
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : currentUrl ? 'Change Photo' : 'Upload Photo'}
      </button>
    </div>
  );
}
