import React, { useState, useRef } from 'react';
import { apiClient } from '../../lib/axios';
import { Camera, Loader2, Check } from 'lucide-react';

interface AvatarUploadProps {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  label?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentUrl,
  onUploaded,
  label = 'Upload Profile Avatar',
}) => {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await apiClient.post('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = res.data.data.avatarUrl;
      onUploaded(uploadedUrl);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Avatar upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#60d1d4] shadow-sm bg-[#e2f7f9] flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 flex flex-col items-center justify-center p-2 text-center">
              <Camera className="w-8 h-8 text-[#60d1d4] mb-1" />
              <span className="text-[10px] text-[#062224] font-medium">No photo</span>
            </div>
          )}

          {/* Uploading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-[#062224]/60 flex items-center justify-center backdrop-blur-xs">
              <Loader2 className="w-6 h-6 text-[#60d1d4] animate-spin" />
            </div>
          )}

          {/* Success Badge */}
          {success && (
            <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1 shadow-md">
              <Check className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Change button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute -bottom-2 -right-2 bg-white text-[#062224] border border-[#95dfdd] hover:bg-[#e2f7f9] p-2 rounded-xl shadow-md transition-all hover:scale-105"
          title="Choose photo"
        >
          <Camera className="w-4 h-4 text-[#3eb8bb]" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <p className="mt-3 text-xs font-semibold text-[#062224]">{label}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">JPEG, PNG or WEBP up to 5MB</p>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
