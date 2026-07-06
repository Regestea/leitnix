import { Camera, CameraResultType } from "@capacitor/camera";
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
  const handleCamera = async () => {
    if (images.length >= max) return;
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        quality: 80,
      });
      const base64Url = `data:image/jpeg;base64,${photo.base64String}`;
      onChange([...images, base64Url]);
    } catch (err) {
      // User cancelled or camera not available — silently ignore
      console.warn("Camera canceled:", err);
    }
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
            className="image-upload-btn camera-btn"
            onClick={handleCamera}
          >
            + Add Image
          </button>
        )}
      </div>

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
