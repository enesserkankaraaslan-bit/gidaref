/* Kontrol kararlarını veriye işler.
 *
 *   npm run kontrol:uygula -- [indirilen_kayitlar.jsonl ...]          → yalnız rapor (hiçbir dosya değişmez)
 *   npm run kontrol:uygula -- [indirilen_kayitlar.jsonl ...] --yaz    → yedek alır, sonra yazar
 *
 * Yapılan: verilen dosyalar data/ek1/kontrol_gecmisi.jsonl'e eklenir (yalnız ekleme);
 * tüm değerleri eşleşen madde grupları okundu → eslesti olur; CSV "dogrulama" sütunu güncellenir.
 * Yapılmayan: düzeltme önerileri hiçbir zaman otomatik işlenmez (yalnız listelenir); "guncel" durumu verilmez. */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CSV_ESLESTI, csvAyristir, csvYaz, gecmisBirlestir, jsonlOku, jsonlYaz, kontrolSatirlari, mikroJsonlOku, mikroUygulamaPlani, pyJson, satirAnahtari, uygulamaPlani, type Veri
} from '../src/core';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VERI_DIZINI = join(KOK, 'data', 'ek1');
const yol = (ad: string) => join(VERI_DIZINI, ad);

const argv = process.argv.slice(2);
const yaz = argv.includes('--yaz');
const girdiler = argv.filter(a => a !== '--yaz');

const jsonMetin = readFileSync(yol('gidaref_kayitlar_v2.json'), 'utf8');
const veri = JSON.parse(jsonMetin) as Veri;
const gecmisMetin = existsSync(yol('kontrol_gecmisi.jsonl')) ? readFileSync(yol('kontrol_gecmisi.jsonl'), 'utf8') : '';
let { gecmis, eklenen } = { gecmis: jsonlOku(gecmisMetin), eklenen: [] as ReturnType<typeof jsonlOku> };
for (const g of girdiler) {
  const r = gecmisBirlestir(gecmis, jsonlOku(readFileSync(resolve(g), 'utf8')));
  gecmis = r.gecmis; eklenen = eklenen.concat(r.eklenen);
}

const plan = uygulamaPlani(veri, gecmis);
const oncekiEslesen = kontrolSatirlari(veri).filter(s => s.veriDurumu !== 'okundu').length;

console.log('Kontrol geçmişi: ' + (gecmis.length - eklenen.length) + ' kayıt' + (eklenen.length ? ' + ' + eklenen.length + ' yeni' : ''));
console.log('Eşleşen satır: ' + plan.eslesenSatirlar.length + ' / ' + kontrolSatirlari(veri).length + ' (veride şu an ' + oncekiEslesen + ')');
console.log('okundu → eslesti olacak madde grubu: ' + (plan.eslesenGruplar.length ? plan.eslesenGruplar.join(', ') : 'yok'));
if (plan.duzeltmeler.length) {
  console.log('\nDüzeltme önerileri (OTOMATİK İŞLENMEZ; her biri onay, yedek ve testle ayrıca yapılır):');
  for (const k of plan.duzeltmeler) console.log('  - ' + k.madde + ' s.' + k.sayfa + ' | ' + k.alan + ': "' + (k.eski ?? '') + '" → "' + k.yeni + '"' + (k.not ? ' | not: ' + k.not : '') + ' | ' + k.kontrol_eden + ', ' + k.zaman);
}
if (plan.bilinmeyen.length) console.log('\nUYARI: veride karşılığı olmayan anahtarlar (veri değişmiş olabilir):\n  ' + plan.bilinmeyen.join('\n  '));

/* Mikrobiyolojik kriterler: satır kimliği MK-xxx; durum tek_okuma → eslesti */
const MIKRO_DIZINI = join(KOK, 'data', 'mikro');
const mikroYol = join(MIKRO_DIZINI, 'mikrobiyolojik_kriterler.jsonl');
const mikroMetin = readFileSync(mikroYol, 'utf8');
const mikroPlan = mikroUygulamaPlani(mikroJsonlOku(mikroMetin), gecmis);
console.log('\nMikrobiyolojik kriterler: tek_okuma → eslesti olacak satır: ' + (mikroPlan.eslesenIdler.length ? mikroPlan.eslesenIdler.join(', ') : 'yok'));
for (const k of mikroPlan.duzeltmeler) console.log('  - düzeltme önerisi (OTOMATİK İŞLENMEZ): ' + k.anahtar + ' | ' + k.alan + ': "' + (k.eski ?? '') + '" → "' + k.yeni + '"' + (k.not ? ' | not: ' + k.not : '') + ' | ' + k.kontrol_eden);
if (mikroPlan.bilinmeyen.length) console.log('UYARI: mikrobiyolojik veride karşılığı olmayan anahtarlar:\n  ' + mikroPlan.bilinmeyen.join('\n  '));

if (!yaz) {
  console.log('\nRapor modu: hiçbir dosya değişmedi. Yazmak için --yaz ekleyin.');
  process.exit(0);
}

// Yedek: depo dışında, ../yedekler/ altında
const damga = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const yedek = resolve(KOK, '..', 'yedekler', 'ek1_' + damga + '_kontrol-uygula');
mkdirSync(yedek, { recursive: true });
cpSync(VERI_DIZINI, yedek, { recursive: true });
cpSync(MIKRO_DIZINI, join(yedek, 'mikro'), { recursive: true });
console.log('\nYedek: ' + yedek);

writeFileSync(yol('kontrol_gecmisi.jsonl'), jsonlYaz(gecmis), 'utf8');

const gruplar = new Set(plan.eslesenGruplar);
for (const k of veri.kayitlar) if (gruplar.has(k.id) && k.durum === 'okundu') k.durum = 'eslesti';
writeFileSync(yol('gidaref_kayitlar_v2.json'), pyJson(veri), 'utf8');

const csvMetin = readFileSync(yol('ek1_tum_satirlar.csv'), 'utf8');
const EOL = csvMetin.includes('\r\n') ? '\r\n' : '\n';
const eslesen = new Set(plan.eslesenSatirlar);
let degisen = 0;
const csvYeni = csvMetin.split(EOL).map((l, i) => {
  if (i === 0 || !l) return l;
  const f = csvAyristir(l);
  if (eslesen.has(satirAnahtari(f[1], f[2], f[5], f[9])) && f[12] !== CSV_ESLESTI) { f[12] = CSV_ESLESTI; degisen++; return csvYaz(f); }
  return l;
}).join(EOL);
writeFileSync(yol('ek1_tum_satirlar.csv'), csvYeni, 'utf8');

const mikroEs = new Set(mikroPlan.eslesenIdler);
if (mikroEs.size) {
  writeFileSync(mikroYol, mikroMetin.split('\n').map(l => {
    if (!l) return l;
    const o = JSON.parse(l) as { id: string; durum: string };
    if (!mikroEs.has(o.id) || o.durum !== 'tek_okuma') return l;
    o.durum = 'eslesti'; return pyJson(o);
  }).join('\n'), 'utf8');
  const mcsvYol = join(MIKRO_DIZINI, 'mikrobiyolojik_kriterler.csv'), mcsv = readFileSync(mcsvYol, 'utf8');
  const MEOL = mcsv.includes('\r\n') ? '\r\n' : '\n', satirlar = mcsv.split(MEOL);
  const baslik = csvAyristir(satirlar[0].replace(/^﻿/, '')), iDurum = baslik.indexOf('durum');
  writeFileSync(mcsvYol, satirlar.map((l, i) => {
    if (i === 0 || !l) return l;
    const f = csvAyristir(l);
    if (mikroEs.has(f[0]) && f[iDurum] === 'tek_okuma') { f[iDurum] = 'eslesti'; return csvYaz(f); }
    return l;
  }).join(MEOL), 'utf8');
  console.log('Yazıldı: mikrobiyolojik_kriterler.jsonl/.csv (' + mikroEs.size + ' satır eslesti).');
}
console.log('Yazıldı: kontrol_gecmisi.jsonl, gidaref_kayitlar_v2.json (' + plan.eslesenGruplar.length + ' grup), ek1_tum_satirlar.csv (' + degisen + ' satır).');
console.log('Sonra: npm test — kabul testlerindeki "iki kez eşleşen grup" sayısını yeni değere güncelleyin ve değişikliği testle birlikte commit edin.');
