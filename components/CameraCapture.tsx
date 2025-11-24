import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally for mirror effect natural feel
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(base64);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-red-500/80 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="relative aspect-[3/4] bg-black w-full">
           {error ? (
             <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6">
               <p>{error}</p>
             </div>
           ) : (
             <video 
               ref={videoRef}
               autoPlay 
               playsInline 
               className="w-full h-full object-cover transform -scale-x-100" // Mirror effect css
             />
           )}
           <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 bg-slate-800 flex justify-center">
          <button
            onClick={takePhoto}
            className="w-16 h-16 rounded-full bg-white border-4 border-slate-300 hover:border-indigo-500 hover:scale-105 transition-all shadow-lg flex items-center justify-center text-indigo-600"
          >
            <Camera size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};