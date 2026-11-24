// Turns a picture the user picked into a small square JPEG, ready to upload.
// The server accepts at most 100 KB, so we crop to the middle and shrink here first.

export const AVATAR_SIZE = 256;
export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class ImageError extends Error {}

export function checkImageFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageError('Please choose a JPEG, PNG or WebP picture.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageError('That picture is too large. Please choose one under 10 MB.');
  }
}

// The largest centred square inside a width x height picture
export function centerSquare(width: number, height: number) {
  const side = Math.min(width, height);
  return { x: (width - side) / 2, y: (height - side) / 2, side };
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function prepareAvatar(file: File, maxBytes = 100 * 1024): Promise<Blob> {
  checkImageFile(file);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageError('That file could not be read as a picture.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new ImageError('Your browser cannot resize pictures.');

  const { x, y, side } = centerSquare(bitmap.width, bitmap.height);
  context.drawImage(bitmap, x, y, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();

  // Lower the quality until it fits; 256 px almost always fits on the first try
  for (const quality of [0.9, 0.8, 0.7, 0.55, 0.4]) {
    const blob = await toBlob(canvas, quality);
    if (blob && blob.size <= maxBytes) return blob;
  }
  throw new ImageError('That picture could not be made small enough. Try another one.');
}
