declare module 'node-webpmux' {
  export class Image {
    load(buffer: Buffer): Promise<void>;
    save(path: string | null): Promise<Buffer>;
    exif: Buffer;
    width: number;
    height: number;
    hasAlpha: boolean;
    hasAnim: boolean;
  }
  const defaultExport: { Image: typeof Image };
  export default defaultExport;
}
