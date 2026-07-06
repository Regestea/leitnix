import { useRef } from "react";
import "./ImageUpload.css";

const MAX_DEFAULT = 5;

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

export default function ImageUpload({
  images,
  onChange,
  max = MAX_DEFAULT,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const remaining = max - images.length;
    const toProcess = Array.from(files).slice(0, remaining);

    if (toProcess.length === 0) return;

    let loaded = 0;
    const newImages: string[] = [];

    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          newImages.push(dataUrl);
        }
        loaded++;
        if (loaded === toProcess.length) {
          onChange([...images, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  };

  const canAddMore = images.length < max;

  return (
    <div className="image-upload">
      <div className="image-upload-header">
        <span className="image-upload-label">Images</span>
        {canAddMore && (
          <button
            type="button"
            className="image-upload-btn"
            onClick={() => inputRef.current?.click()}
          >
            + Add Image
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {images.length > 0 && (
        <div className="image-upload-previews">
          {images.map((src, i) => (
            <div key={i} className="image-upload-thumb">
              <img src={src} alt={`Upload ${i + 1}`} />
              <button
                type="button"
                className="image-upload-remove"
                onClick={() => handleRemove(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <span className="image-upload-count">
        {images.length} / {max}
      </span>
    </div>
  );
}
