import {
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_UPLOAD_URL,
} from './config'

type CloudinaryUploadResponse = {
  secure_url: string
}

export async function uploadProfilePhoto(
  file: File,
  userId: string,
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', 'profiles')
  formData.append('public_id', userId)

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('No se pudo subir la foto.')
  }

  const data = (await response.json()) as CloudinaryUploadResponse
  return data.secure_url
}
