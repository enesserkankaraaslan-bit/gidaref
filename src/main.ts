/* Yazı tipleri: yalnız Türkçe için gereken latin + latin-ext alt kümeleri (Google Fonts'a istek yok). */
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-ext-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-ext-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-sans/latin-ext-600.css';
import '@fontsource/source-serif-4/latin-500.css';
import '@fontsource/source-serif-4/latin-ext-500.css';
import '@fontsource/source-serif-4/latin-700.css';
import '@fontsource/source-serif-4/latin-ext-700.css';
import './stil.css';
import './stil-ek.css';
import { aramaDizini } from './core';
import { VERI } from './veri';
import { baslat } from './ui/uygulama';

/* Yayın bilgisi (vite.config.ts'de derleme anında doldurulur) */
const onizleme = import.meta.env.VITE_ONIZLEME !== '0';
document.getElementById('onizleme')!.hidden = !onizleme;
if (!onizleme) document.getElementById('kontrolBaglanti')?.remove();
document.getElementById('surumBilgi')!.textContent =
  'Sürüm ' + __SURUM__ + (__COMMIT__ ? ' · ' + __COMMIT__ : '') + (__VERI_TARIHI__ ? ' · veri ' + __VERI_TARIHI__.split('-').reverse().join('.') : '');

baslat(aramaDizini(VERI), VERI);
