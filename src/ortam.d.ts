/* vite.config.ts → define */
declare const __SURUM__: string;
declare const __COMMIT__: string;
/** YYYY-AA-GG: veri dosyasının son commit tarihi */
declare const __VERI_TARIHI__: string;

interface ImportMetaEnv {
  /** "0" → herkese açık sürüm (indekslenebilir, önizleme şeridi yok); başka her değer → önizleme */
  readonly VITE_ONIZLEME?: string;
}
