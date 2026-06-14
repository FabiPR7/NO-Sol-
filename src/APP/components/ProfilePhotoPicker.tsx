import { useId, useRef, type ChangeEvent } from 'react'
import './ProfilePhotoPicker.css'

type ProfilePhotoPickerProps = {
  photoUrl: string | null
  fallbackLabel: string
  onFileSelect: (file: File, previewUrl: string) => void
  onError?: (message: string) => void
  disabled?: boolean
}

const MAX_FILE_SIZE_MB = 5

function ProfilePhotoPicker({
  photoUrl,
  fallbackLabel,
  onFileSelect,
  onError,
  disabled = false,
}: ProfilePhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      onError?.('Elige una imagen válida (JPG, PNG o WEBP).')
      event.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      onError?.(`La imagen no puede superar ${MAX_FILE_SIZE_MB} MB.`)
      event.target.value = ''
      return
    }

    onFileSelect(file, URL.createObjectURL(file))
    event.target.value = ''
  }

  return (
    <div className="profile-photo-picker">
      <div className="profile-photo-picker__preview">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="profile-photo-picker__image" />
        ) : (
          <div className="profile-photo-picker__fallback">
            {fallbackLabel.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="profile-photo-picker__actions">
        <label
          htmlFor={inputId}
          className={`profile-photo-picker__button${
            disabled ? ' profile-photo-picker__button--disabled' : ''
          }`}
        >
          Elegir foto
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="profile-photo-picker__input"
          onChange={handleChange}
          disabled={disabled}
        />
        <p className="profile-photo-picker__hint">
          Desde tu galería o archivos. JPG, PNG o WEBP, máx. {MAX_FILE_SIZE_MB} MB.
        </p>
      </div>
    </div>
  )
}

export default ProfilePhotoPicker
