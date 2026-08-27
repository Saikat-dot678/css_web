export interface StoredFile {
  url: string;
  mimeType: string;
  size: number;
}

export interface SaveFormFileOptions {
  formId: string;
  fieldId: string;
  allowedTypes?: string[];
  maxBytes: number;
}

export interface FileStorage {
  saveFormFile(file: File, options: SaveFormFileOptions): Promise<StoredFile>;
}
