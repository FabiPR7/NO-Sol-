import {
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_UPLOAD_URL,
  CLOUDINARY_VIDEO_UPLOAD_URL,
} from './config'

type CloudinaryUploadResponse = {
  secure_url: string
}

async function uploadToCloudinary(
  file: File | Blob,
  uploadUrl: string,
  folder: string,
  filename: string,
): Promise<string> {
  const payload =
    file instanceof File
      ? file
      : new File([file], filename, { type: file.type || 'application/octet-stream' })

  const formData = new FormData()
  formData.append('file', payload)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', folder)

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('No se pudo subir el archivo.')
  }

  const data = (await response.json()) as CloudinaryUploadResponse
  return data.secure_url
}

function chatFolder(chatId: string): string {
  return `chats/${chatId}`
}

export async function uploadChatImage(
  file: File,
  chatId: string,
  userId: string,
): Promise<string> {
  const extension = file.name.split('.').pop() ?? 'jpg'

  return uploadToCloudinary(
    file,
    CLOUDINARY_UPLOAD_URL,
    chatFolder(chatId),
    `${userId}-${Date.now()}.${extension}`,
  )
}

export async function uploadChatAudio(
  blob: Blob,
  chatId: string,
  userId: string,
): Promise<string> {
  const extension = blob.type.includes('mp4') ? 'm4a' : 'webm'

  return uploadToCloudinary(
    blob,
    CLOUDINARY_VIDEO_UPLOAD_URL,
    chatFolder(chatId),
    `${userId}-${Date.now()}.${extension}`,
  )
}
