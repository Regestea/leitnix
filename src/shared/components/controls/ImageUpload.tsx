import { Camera, CameraResultType } from "@capacitor/camera";
import styles from "./ImageUpload.module.css";

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
    <div className={styles.imageUpload}>
      <div className={styles.imageUploadHeader}>
        <span className={styles.imageUploadLabel}>Images</span>
        {canAddMore && (
          <button
            type="button"
            className={`${styles.imageUploadBtn} ${styles.cameraBtn}`}
            onClick={handleCamera}
          >
            + Add Image
          </button>
        )}
      </div>

      {images.length > 0 && (
        <div className={styles.imageUploadPreviews}>
          {images.map((src, i) => (
            <div key={i} className={styles.imageUploadThumb}>
              <img src={src} alt={`Upload ${i + 1}`} />
              <button
                type="button"
                className={styles.imageUploadRemove}
                onClick={() => handleRemove(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <span className={styles.imageUploadCount}>
        {images.length} / {max}
      </span>
    </div>
  );
}