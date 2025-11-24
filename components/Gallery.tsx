import React from 'react';
import { GeneratedImage } from '../types';
import { Download, Sparkles, Trash2 } from 'lucide-react';

interface GalleryProps {
  images: GeneratedImage[];
  onDelete: (id: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ images, onDelete }) => {
  if (images.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-400">
        <Sparkles size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium opacity-50">No hairstyles generated yet</p>
        <p className="text-sm opacity-40">Your transformations will appear here</p>
      </div>
    );
  }

  const handleDownload = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `hairstyle-ai-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
      {images.map((img) => (
        <div key={img.id} className="group relative aspect-square bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100">
          <img 
            src={img.url} 
            alt="Generated Hairstyle" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <div className="flex justify-between items-center text-white">
              <span className="text-sm font-medium capitalize">
                {img.type === 'lucky' ? '✨ Lucky Style' : '✂️ Style Swap'}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDownload(img.url, img.id)}
                  className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button 
                  onClick={() => onDelete(img.id)}
                  className="p-2 bg-red-500/50 hover:bg-red-500/80 backdrop-blur-md rounded-full transition-colors text-white"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
