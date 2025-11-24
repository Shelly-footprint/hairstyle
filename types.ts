export interface GeneratedImage {
  id: string;
  url: string;
  type: 'swap' | 'lucky';
  timestamp: number;
}

export interface ImageUploadProps {
  label: string;
  image: string | null;
  onImageUpload: (base64: string) => void;
  onClear: () => void;
  placeholderText?: string;
}
