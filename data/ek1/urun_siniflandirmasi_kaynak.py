import json
U={
 'fındık':(['sert kabuklu meyve'],['findik','iç fındık']),'badem':(['sert kabuklu meyve'],[]),'antep fıstığı':(['sert kabuklu meyve'],['şam fıstığı','fıstık']),
 'çam fıstığı':(['sert kabuklu meyve'],[]),'ceviz':(['sert kabuklu meyve'],[]),'kaju':(['sert kabuklu meyve'],[]),'kayısı çekirdeği':(['sert kabuklu meyve'],[]),
 'yerfıstığı':(['yağlı tohum'],['yer fıstığı']),'ayçiçeği çekirdeği':(['yağlı tohum'],['ay çekirdeği']),'kabak çekirdeği':(['yağlı tohum'],[]),
 'susam':(['yağlı tohum'],['tahin']),'keten tohumu':(['yağlı tohum'],[]),'haşhaş tohumu':(['yağlı tohum'],['haşhaş']),'kenevir tohumu':(['yağlı tohum'],[]),
 'soya':(['yağlı tohum'],['soya fasulyesi']),'kanola':(['yağlı tohum'],['kolza']),'hardal tohumu':(['yağlı tohum'],[]),
 'incir':(['kuru meyve'],['kuru incir']),'kuru üzüm':(['kuru meyve'],['üzüm kurusu']),'kuru kayısı':(['kuru meyve'],['kayısı kurusu']),
 'pirinç':(['tahıl'],['çeltik']),'mısır':(['tahıl'],[]),'buğday':(['tahıl'],[]),'durum buğdayı':(['tahıl'],[]),'arpa':(['tahıl'],[]),'çavdar':(['tahıl'],[]),
 'yulaf':(['tahıl'],[]),'karabuğday':(['tahıl'],[]),'darı':(['tahıl'],[]),'sorgum':(['tahıl'],[]),'kinoa':(['tahıl'],[]),
 'un':(['tahıl ürünü'],['buğday unu']),'bulgur':(['tahıl ürünü'],[]),'makarna':(['tahıl ürünü'],[]),'ekmek':(['fırıncılık ürünü','tahıl ürünü'],[]),
 'bisküvi':(['fırıncılık ürünü','pastacılık ürünü','tahıl ürünü'],[]),'gofret':(['fırıncılık ürünü','tahıl ürünü'],[]),'kek':(['fırıncılık ürünü','pastacılık ürünü'],[]),
 'kraker':(['fırıncılık ürünü','tahıl atıştırmalığı'],[]),
 'kırmızı biber':(['baharat'],['pul biber','isot']),'paprika':(['baharat'],[]),'karabiber':(['baharat'],[]),'kimyon':(['baharat'],[]),'zerdeçal':(['baharat'],['turmerik']),
 'zencefil':(['baharat'],[]),'tarçın':(['baharat'],[]),'kekik':(['baharat','kurutulmuş ot'],[]),'nane':(['bitkisel infüzyon','kurutulmuş ot'],[]),
 'çiğ süt':(['süt'],[]),'içme sütü':(['süt'],['pastörize süt','uht süt']),'peynir':(['süt ürünü'],[]),'yoğurt':(['süt ürünü'],[]),'tereyağı':(['süt ürünü','yağ'],[]),
 'sığır eti':(['et','kırmızı et'],['dana eti','dana','sığır','kıyma']),'kuzu eti':(['et','kırmızı et'],['koyun eti','kuzu']),
 'tavuk eti':(['et','kanatlı eti'],['tavuk','hindi','piliç']),'domuz eti':(['et'],[]),'at eti':(['et'],[]),'sucuk':(['et ürünü','et'],['salam','sosis','pastırma']),
 'karaciğer':(['sakatat','et'],['ciğer']),'böbrek':(['sakatat','et'],[]),
 'hamsi':(['balık','su ürünü'],[]),'sardalya':(['balık','su ürünü'],[]),'uskumru':(['balık','su ürünü'],[]),'ton balığı':(['balık','su ürünü'],['tuna','orkinos']),
 'somon':(['balık','su ürünü'],[]),'alabalık':(['balık','su ürünü'],[]),'levrek':(['balık','su ürünü'],[]),'çipura':(['balık','su ürünü'],[]),
 'palamut':(['balık','su ürünü'],['torik']),'midye':(['çift kabuklu yumuşakça','su ürünü'],[]),'karides':(['kabuklu','su ürünü'],[]),
 'kalamar':(['kafadanbacaklı','su ürünü'],['ahtapot']),
 'domates':(['meyveli sebze','sebze'],[]),'biber':(['meyveli sebze','sebze'],['sivri biber','dolmalık biber']),'patlıcan':(['meyveli sebze','sebze'],[]),
 'ıspanak':(['yapraklı sebze','sebze'],[]),'marul':(['yapraklı sebze','sebze'],[]),'roka':(['yapraklı sebze','sebze'],[]),'patates':(['kök sebze','sebze'],[]),
 'havuç':(['kök sebze','sebze'],[]),'soğan':(['soğanlı sebze','sebze'],[]),'sarımsak':(['soğanlı sebze','sebze'],[]),'pırasa':(['saplı sebze','sebze'],[]),
 'elma':(['meyve','taze meyve'],[]),'üzüm':(['meyve','üzümsü meyve'],[]),'çilek':(['meyve','üzümsü meyve'],[]),'portakal':(['meyve','turunçgil'],['limon','mandalina']),
 'zeytinyağı':(['bitkisel yağ','yağ'],['zeytin yağı']),'ayçiçek yağı':(['bitkisel yağ','yağ'],['ayçiçeği yağı']),'mısır yağı':(['bitkisel yağ','yağ'],[]),
 'palm yağı':(['bitkisel yağ','yağ'],[]),'margarin':(['bitkisel yağ','yağ'],[]),
 'sütlü çikolata':(['çikolata','kakao ürünü'],[]),'bitter çikolata':(['çikolata','kakao ürünü'],[]),'kakao tozu':(['kakao','kakao ürünü'],[]),
 'bal':([],[]),'çay':([],[]),'kahve':([],[]),'yumurta':([],[]),'tuz':([],[]),'şarap':(['alkollü içecek'],[]),
 'elma suyu':(['meyve suyu'],[]),'üzüm suyu':(['meyve suyu'],[]),'patates kızartması':(['patates ürünü'],['patates cipsi']),'salça':(['domates ürünü'],['domates salçası']),
}
KAT_ES={'bebek gıdası':['bebek maması','mama','bebek beslenmesi','bebek ürünü'],'devam formülü':['devam maması'],'sert kabuklu meyve':['kuruyemiş','çerez'],
 'tahıl':['hububat'],'bitkisel infüzyon':['bitki çayı','bitkisel çay'],'takviye edici gıda':['takviye','gıda takviyesi'],'alkollü içecek':['alkol','alkollü içki'],
 'su ürünü':['deniz ürünü','su ürünleri'],'et':['et ürünleri','etler']}
AILE_ES={'Aflatoksin':['aflatoksin','aflatoxin'],'Okratoksin A':['okratoksin','ota','ochratoxin'],'Patulin':['patulin'],
 'Deoksinivalenol (DON)':['deoksinivalenol','don','vomitoksin'],'Zearalenon':['zearalenon','zen'],'Fumonisin':['fumonisin'],
 'Ergot sklerotları ve alkaloitleri':['ergot','çavdarmahmuzu','ergot alkaloidi'],'Erusik asit':['erusik','erusik asit'],
 'Tropan alkaloitleri':['tropan','atropin','skopolamin'],'Hidrosiyanik asit':['hidrosiyanik','siyanür','hcn','siyanojenik'],
 'Pirolizidin alkaloitleri':['pirolizidin'],'Afyon alkaloitleri':['afyon','morfin','kodein','opium'],'Delta-9-THC':['thc','tetrahidrokannabinol','delta 9 thc'],
 'Kurşun':['kurşun','pb'],'Kadmiyum':['kadmiyum','cd'],'Cıva':['cıva','civa','hg'],'Arsenik':['arsenik','inorganik arsenik'],'İnorganik kalay':['kalay','inorganik kalay'],
 'Dioksinler ve PCB':['dioksin','pcb','furan'],'PFAS (perfloroalkil bileşikleri)':['pfas','pfos','pfoa','pfna','pfhxs','perflor','perfloroalkil'],
 'PAH (benzo(a)piren)':['pah','benzo(a)piren','benzopiren','bap','polisiklik aromatik'],'3-MCPD (serbest)':['3 mcpd','mcpd'],'3-MCPD ve esterleri':['3 mcpd','mcpd'],
 'Glisidil esterleri':['glisidil','glisidol'],'Nitrat':['nitrat'],'Melamin':['melamin'],'Perklorat':['perklorat'],
 'Nikel':['nikel'],'Akrilamid':['akrilamid'],'Alternaria toksinleri':['alternaria','alternariol','tenuazonik']}
GRUP_ES={'Mikotoksinler':['mikotoksin','küf toksini'],'Metaller':['ağır metal','metal'],'Bitki toksinleri':['bitki toksini'],
 'İşleme bulaşanları':['işleme bulaşanı'],'Kalıcı organik kirleticiler':['kalıcı organik kirletici']}
ONERI=['Aflatoksin','Fındık','Pirinç','Bebek maması','Et','Kurşun','Fındıkta aflatoksin','Pirinçte kadmiyum','Sütte aflatoksin M1','Ette kurşun','Ağır metal','PFAS','Çikolata','Domates']
d=json.load(open('/tmp/v2/veri.json',encoding='utf-8'))
d.update({'urunler':{k:{'ust':v[0],'es':v[1]} for k,v in U.items()},'katEs':KAT_ES,'aileEs':AILE_ES,'grupEs':GRUP_ES,'oneriler':ONERI})
json.dump(d,open('/tmp/v2/veri_tam.json','w',encoding='utf-8'),ensure_ascii=False)
print('ürün',len(U),'kayıt',len(d['kayitlar']))
