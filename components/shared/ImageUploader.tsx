'use client';

import { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadPesantrenLogo, uploadPesantrenPhoto, uploadAvatar, uploadProductImage } from '@/lib/supabase/storage';
import { createClient } from '@/lib/supabase/client';

interface ImageUploaderProps {
  name: string;
  label: string;
  defaultValue?: string | null;
  type: 'logo' | 'photo' | 'avatar' | 'product';
  userId: string;
  bucket?: string;
}

export function ImageUploader({ name, label, defaultValue, type, userId, bucket }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(defaultValue || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);
    setIsUploading(true);

    // Create local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload to Supabase Storage
    let uploadFn;
    if (type === 'logo') uploadFn = uploadPesantrenLogo;
    else if (type === 'photo') uploadFn = uploadPesantrenPhoto;
    else if (type === 'product') uploadFn = uploadProductImage;
    else uploadFn = uploadAvatar;
    
    const { url, error: uploadError } = await uploadFn(file, userId);

    if (uploadError) {
      setError(uploadError);
      setPreview(defaultValue || null); // Revert preview on error
      setUploadedUrl(defaultValue || null);
    } else if (url) {
      setUploadedUrl(url);
    }

    setIsUploading(false);
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isAvatar = type === 'avatar';
  const containerShape = isAvatar ? 'aspect-square rounded-full' : 'aspect-video rounded-xl';

  return (
    <div className="space-y-2 flex flex-col items-center">
      {label && <label className="text-sm font-semibold text-slate-700 w-full text-left">{label}</label>}
      
      {/* Hidden input for Server Action to read the final URL */}
      <input type="hidden" name={name} value={uploadedUrl || ''} />

      <div className={`relative border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden transition-all hover:bg-slate-100 group w-full ${containerShape}`}>
        
        {preview ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black/5">
            <img 
              src={preview} 
              alt="Preview" 
              className={`w-full h-full ${isAvatar ? 'object-cover' : 'object-contain'} ${type === 'logo' ? 'p-4' : ''}`}
            />
            {isUploading ? (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                {!isAvatar && <span className="text-sm font-bold text-blue-800">Mengunggah...</span>}
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-slate-100 transition-colors"
                >
                  Ganti
                </button>
                <button 
                  type="button"
                  onClick={handleRemove}
                  className="bg-red-500 text-white p-1.5 rounded-lg shadow hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center"
          >
            <div className={`w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center ${isAvatar ? 'mb-1' : 'mb-3'}`}>
              <UploadCloud className="w-5 h-5" />
            </div>
            {!isAvatar && (
              <>
                <p className="text-sm font-bold text-slate-700 mb-1">Klik untuk unggah</p>
                <p className="text-[10px] text-slate-500">
                  {type === 'logo' ? 'JPG/PNG/WEBP (Max 2MB)' : 'JPG/PNG/WEBP (Max 5MB)'}
                </p>
              </>
            )}
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
