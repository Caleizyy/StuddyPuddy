// Looks at the first bytes of a file to find out what it really is. The Content-Type header and the
// file name are written by the sender, so they prove nothing.
export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export function detectImageType(bytes: Buffer): ImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((byte, index) => bytes[index] === byte)) return 'image/png';
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null; // anything else, including SVG, which can carry scripts
}

export function toDataUrl(avatar?: { data: Buffer; contentType: string } | null): string | null {
  if (!avatar?.data) return null;
  return `data:${avatar.contentType};base64,${Buffer.from(avatar.data).toString('base64')}`;
}
