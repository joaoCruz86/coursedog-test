import path from 'path';

export function samplePath(filename: string): string {
  return path.resolve(__dirname, 'uploads', filename);
}
