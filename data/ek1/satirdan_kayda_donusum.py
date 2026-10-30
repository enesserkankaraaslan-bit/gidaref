import json, re, collections, csv
rows=[json.loads(l) for l in open('/tmp/x/satirlar.jsonl',encoding='utf-8')]
dip=json.load(open('/tmp/x/dipnotlar.json',encoding='utf-8'))
AILE=[('1.1','Aflatoksin','Mikotoksinler'),('1.2','Okratoksin A','Mikotoksinler'),('1.3','Patulin','Mikotoksinler'),('1.4','Deoksinivalenol (DON)','Mikotoksinler'),
('1.5','Zearalenon','Mikotoksinler'),('1.6','Fumonisin','Mikotoksinler'),('1.7','Ergot sklerotları ve alkaloitleri','Mikotoksinler'),
('2.1','Erusik asit','Bitki toksinleri'),('2.2','Tropan alkaloitleri','Bitki toksinleri'),('2.3','Hidrosiyanik asit','Bitki toksinleri'),
('2.4','Pirolizidin alkaloitleri','Bitki toksinleri'),('2.5','Afyon alkaloitleri','Bitki toksinleri'),('2.6','Delta-9-THC','Bitki toksinleri'),
('3.1','Kurşun','Metaller'),('3.2','Kadmiyum','Metaller'),('3.3','Cıva','Metaller'),('3.4','Arsenik','Metaller'),('3.5','İnorganik kalay','Metaller'),
('4.1','Dioksinler ve PCB','Kalıcı organik kirleticiler'),('4.2','PFAS (perfloroalkil bileşikleri)','Kalıcı organik kirleticiler'),
('5.1','PAH (benzo(a)piren)','İşleme bulaşanları'),('5.2','3-MCPD (serbest)','İşleme bulaşanları'),('5.3','3-MCPD ve esterleri','İşleme bulaşanları'),
('5.4','Glisidil esterleri','İşleme bulaşanları'),('6.1','Nitrat','Diğer bulaşanlar'),('6.2','Melamin','Diğer bulaşanlar'),('6.3','Perklorat','Diğer bulaşanlar')]
def aile(m):
    for p,a,g in AILE:
        if m==p or m.startswith(p+'.'): return a,g
    raise Exception(m)
def temiz_not(n):
    n=re.sub(r'^Aşamalı değer[;.]?\s*(tarihli satırlara bakınız)?\s*','',n).strip(' ;.')
    return n
gruplar=collections.OrderedDict()
for r in rows:
    k=(r['madde'],r['urun_ifadesi'])
    gruplar.setdefault(k,[]).append(r)
dogrulanan={('1.1.10','Aflatoksin B1','8,0'),('1.1.10','Toplam aflatoksin (B1+B2+G1+G2)','15,0'),('1.1.11','Aflatoksin B1','5,0'),('1.1.11','Toplam aflatoksin (B1+B2+G1+G2)','10,0'),
 ('1.1.16','Aflatoksin M1','0,050'),('3.2.12.3','Kadmiyum','0,15'),('3.4.1.1','İnorganik arsenik (As III + As V)','0,15'),('3.4.1.2','İnorganik arsenik (As III + As V)','0,25')}
kayitlar=[]; sayac=collections.Counter()
for (m,u),rs in gruplar.items():
    sayac[m]+=1
    a,g=aile(m)
    kat=[]; [kat.append(t.strip()) for r in rs for t in r['kategori'].split(';') if t.strip() and t.strip() not in kat]
    dn=[]; [dn.append(x.strip()) for r in rs for x in r['dipnot'].split(';') if x.strip() and x.strip() not in dn]
    notlar=[]; [notlar.append(temiz_not(r['not'])) for r in rs if temiz_not(r['not']) and temiz_not(r['not']) not in notlar]
    an=collections.OrderedDict()
    for r in rs:
        an.setdefault(r['analit'],[]).append({'d':r['deger'],'b':r['birim'],'e':r['esas'],'t':r['tarih']})
    ok=all((m,x,v['d']) in dogrulanan for x,vs in an.items() for v in vs)
    kayitlar.append({'id':m+('' if sayac[m]==1 else '-'+str(sayac[m])),'madde':m,'sayfa':int(rs[0]['sayfa']),'kaynak':'e1','tur':'limit',
      'urun':u,'kat':kat,'istisna':rs[0]['istisna'],'aile':a,'grup':g,'dipnot':dn,'not':notlar,
      'analitler':[{'ad':x,'degerler':vs} for x,vs in an.items()],'durum':'eslesti' if ok else 'okundu'})
# 1.1.5 ilk grup kimliğini -1 yap
for k in kayitlar:
    if k['madde']=='1.1.5' and k['id']=='1.1.5': k['id']='1.1.5-1'
# Bakanlık talimatı karşılaştırma değerleri (6 kayıt, daha önce doğrulandı)
old=list(csv.DictReader(open('/mnt/user-data/outputs/kontrol_edilmis_limitler_24.csv',encoding='utf-8-sig')))
TL={'BL-009':('Sert kabuklu meyveler (kestane, çam fıstığı, ceviz ve kaju hariç)',['sert kabuklu meyve'],'Kestane, çam fıstığı, ceviz ve kaju hariç (bunlar için 10 mg/kg)','Nikel','3,5','mg/kg','yenilebilir kısım','Talimat Ek-2 / 2. Nikel',10,'Nikel'),
 'BL-010':('Patates kızartması (tüketime hazır)',['patates kızartması','patates ürünü'],'','Akrilamid','500','µg/kg','','Talimat Ek-2 / 1. Akrilamid',9,'Akrilamid'),
 'BL-011':('Kavrulmuş kahve',['kahve','kavrulmuş kahve'],'','Akrilamid','400','µg/kg','','Talimat Ek-2 / 1. Akrilamid',9,'Akrilamid'),
 'BL-012':('İşlenmiş domates ürünleri',['domates','domates ürünü','salça'],'','Alternariol (AOH)','10','µg/kg','','Talimat Ek-2 / 4. Alternaria toksinleri',14,'Alternaria toksinleri'),
 'BL-013':('İşlenmiş domates ürünleri',['domates','domates ürünü','salça'],'','Alternariol monometil eter (AME)','5','µg/kg','','Talimat Ek-2 / 4. Alternaria toksinleri',14,'Alternaria toksinleri'),
 'BL-014':('İşlenmiş domates ürünleri',['domates','domates ürünü','salça'],'','Tenuazonik asit (TeA)','500','µg/kg','','Talimat Ek-2 / 4. Alternaria toksinleri',14,'Alternaria toksinleri')}
tl={}
for bid,(u,kat,ist,an,d,b,e,satir,s,ai) in TL.items():
    key=(u,ai)
    if key in tl: tl[key]['analitler'].append({'ad':an,'degerler':[{'d':d,'b':b,'e':e,'t':''}]}); continue
    tl[key]={'id':bid,'madde':satir.replace('Talimat ',''),'sayfa':s,'kaynak':'tl','tur':'karsilastirma','urun':u,'kat':kat,'istisna':ist,'aile':ai,'grup':'Bakanlık karşılaştırma değerleri',
      'dipnot':[],'not':['Bakanlık talimatındaki karşılaştırma değeridir; resmî maksimum limit değildir.'],'analitler':[{'ad':an,'degerler':[{'d':d,'b':b,'e':e,'t':''}]}],'durum':'eslesti'}
kayitlar+=list(tl.values())
json.dump({'kayitlar':kayitlar,'dipnotlar':dip,'aileler':[{'onek':p,'ad':a,'grup':g} for p,a,g in AILE]},open('/tmp/v2/veri.json','w',encoding='utf-8'),ensure_ascii=False)
# dışa aktarım: satır düzeyi CSV
with open('/mnt/user-data/outputs/GidaRef_Ek1_tum_satirlar.csv','w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f); w.writerow(['sayfa','madde','urun_ifadesi','kategori','istisna','analit','deger','birim','olcum_esasi','tarih_itibaren','dipnot','not','dogrulama'])
    for r in rows:
        w.writerow([r['sayfa'],r['madde'],r['urun_ifadesi'],r['kategori'],r['istisna'],r['analit'],r['deger'],r['birim'],r['esas'],r['tarih'],r['dipnot'],r['not'],
          'belgeyle eşleşti (2. okuma)' if (r['madde'],r['analit'],r['deger']) in dogrulanan else 'tek okuma, ikinci kontrol bekliyor'])
print(len(kayitlar),'kayıt (madde grubu);', sum(1 for k in kayitlar if k['durum']=='eslesti'),'doğrulanmış grup')
