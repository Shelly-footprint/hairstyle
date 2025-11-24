import React, { useRef } from 'react';
import { ImageUploadProps } from '../types';
import { Upload, X, Camera } from 'lucide-react';

interface ExtendedImageUploadProps extends ImageUploadProps {
  onCameraClick?: () => void;
}

export const ImageUploader: React.FC<ExtendedImageUploadProps> = ({ 
  label, 
  image, 
  onImageUpload, 
  onClear,
  onCameraClick,
  placeholderText = "Click to upload"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onImageUpload(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex justify-between items-center">
        {label}
      </label>
      
      <div className="flex gap-2 h-32">
        {/* Main Upload / Preview Area */}
        <div 
          className={`
            relative flex-1 group flex flex-col items-center justify-center 
            border-2 border-dashed rounded-lg transition-all duration-300 overflow-hidden
            ${image ? 'border-indigo-500 bg-slate-900' : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50 cursor-pointer'}
          `}
          onClick={!image ? triggerUpload : undefined}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          {image ? (
            <>
              <img 
                src={image} 
                alt="Uploaded" 
                className="w-full h-full object-contain" 
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="absolute top-1 right-1 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-sm"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-2 text-center">
              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-full group-hover:scale-110 transition-transform">
                <Upload size={18} />
              </div>
              <p className="text-xs font-medium text-slate-500">{placeholderText}</p>
            </div>
          )}
        </div>

        {/* Camera Button (Only if no image) */}
        {!image && onCameraClick && (
           <button 
             onClick={onCameraClick}
             className="w-16 flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-all"
             title="Take photo"
           >
             <Camera size={20} />
             <span className="text-[10px] font-medium">Camera</span>
           </button>
        )}
      </div>
    </div>
  );
};