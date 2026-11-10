/* Ders Odası — kodDers: tek akışlı ders.
   Tek anlatıcı kaydı dersin saatidir. Sahne, boyalı katmanların (kd-tuval.js) ve üstündeki yazıların
   o saate bağlı saf fonksiyonudur: sarınca aynı kare gelir. Saat bir durağa gelince ses durur, etkinlik
   aynı sahnenin içinde açılır; öğrenci bitirince anlatım kaldığı yerden sürer. Mp4 yoktur.

   Ders verisi : tur 'kodDers', ses, sure, k [[kelime, bas, son]…], cumleler [{m, bas, son}…],
                 duraklar [{id, zaman, tur, …}…], sahneDosya
   Sahne dosyası DO.KodDersSahne[blok.sahne] = function (api) {
                   return { hazir: Promise, ciz(t, a), durak(id, olay, veri), tutamac(id, deger), tutDeger(id, x, y) }; }
                 t ders saati, a ortam saati: durakta t durur, a yürür, sahne canlı kalır.
   Durak türleri: secim · kaydir · yerlestir · olmasa · eslestir · dizme · dokun · okuma. Çocuğa yazı yazdırılmaz.
   okuma (Elifbâ ve Kur'ân): kip 'birlikte' kâri okur çocuk tekrar eder, 'kulak' kâri okur çocuk bulur, 'tek' çocuk
   okur hoca Tamam/Bir daha der, 'av' tahtadaki bütün örnekleri bulur, 'ayir' iki kümeye ayırır (kalın, ince),
   'nokta' gövdeye noktaları koyup harfi kurar. parcalar [{m, ad, dinle}]; dinle kısa kâri kaydıdır (api.sesParca).
   Ders verisinde pullar varsa ilgili durak bitince kesilmemiş dörtgen baskı tepsiye uçar (bloklar-pul.js).
   Kanıt: bilgi durakları ilk denemede 10 puandır, yanlışta ceza yoktur; dizme ve dokun bitirene 10 puandır,
   seçim duraklarına puan verilmez, canlı derste hoca değerlendirir. İpucu kullanımı ayrı kaydedilir. */
(function () {
  'use strict';
  var DO = window.DO, el = DO.el, B = DO.Bloklar;
  DO.KodDersSahne = DO.KodDersSahne || {};
  var PUANLI = { yerlestir: 1, olmasa: 1, eslestir: 1, dizme: 1, dokun: 1 };
  var SVGNS = 'http://www.w3.org/2000/svg';

  function sureYaz(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function sinirla(x, a, b) { return Math.min(b, Math.max(a, x)); }

  /* Sahne dosyalarının ortak çizim araçları */
  var Ciz = {
    ic: function (t, bas, sure) { return sinirla((t - bas) / (sure || 1), 0, 1); },
    yumusak: function (x) { return x * x * (3 - 2 * x); },
    ogeler: function (ad, oz, ust) {
      var e = document.createElementNS(SVGNS, ad);
      Object.keys(oz || {}).forEach(function (k) { e.setAttribute(k, oz[k]); });
      if (ust) ust.appendChild(e);
      return e;
    },
    /* Kendini çizen çizgi: ilerle(0..1) */
    cizgi: function (ust, d, oz) {
      var p = Ciz.ogeler('path', Object.assign({ d: d, fill: 'none', pathLength: 1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, oz || {}), ust);
      p.ilerle = function (x) { p.setAttribute('stroke-dashoffset', 1 - sinirla(x, 0, 1)); p.style.opacity = x <= 0 ? 0 : ''; };
      return p;
    },
    yazi: function (ust, x, y, metin, oz) {
      var e = Ciz.ogeler('text', Object.assign({ x: x, y: y, 'text-anchor': 'middle' }, oz || {}), ust);
      e.textContent = metin;
      return e;
    }
  };
  DO.KodDersCiz = Ciz;

  B.kodDers = {
    // Canlı derste tek ekrandır; duraklar zaten kişiseldir, "herkes kendi oynasın" seçeneği sunulmaz
    zorunlu: true, xapiTur: 'media', canli: 'ortak',
    max: function (b) { return (b.duraklar || []).filter(function (d) { return PUANLI[d.tur]; }).length * 10; },
    ciz: function (ctx) {
      var b = ctx.blok, C = ctx.canli, O = ctx.oynatici;
      var kok = el('div', { class: 'kd' + (ctx.rol === 'ogretmen' ? ' hoca-rol' : '') });
      /* Sahne bir alanın içindedir: durak açılınca alan küçülüp yukarı çekilir, etkinlik altta açılır,
         sahneyi örtmez. Sahneye bağlı durak öğeleri (yuva, nokta, taş, Güneş tutamacı) sahneKat'tadır. */
      var alan = el('div', { class: 'kd-alan' });
      var svg = Ciz.ogeler('svg', { viewBox: '0 0 1600 900', class: 'kd-sahne', role: 'img', 'aria-label': b.baslik || 'Ders sahnesi' });
      var yaziKat = el('div', { class: 'kd-yazi' });
      var sahneKat = el('div', { class: 'kd-sahne-kat' });
      var katman = el('div', { class: 'kd-katman' });
      var bar = el('div', { class: 'kd-bar' });
      /* Canlı derste ekran tektir: anlatımı Hocamız yürütür (oynat, durdur, sar, durağı geç), öğrenci takip eder.
         Duraklarda her öğrenci kendi cevabını verir; hamlesi Hocamıza gider, sınıf şeridinde görünür.
         Birebirde Hocamızın paneli öğrencinin hamlesini aynen gösterir. */
      var hoca = ctx.rol === 'ogretmen';
      // Sunum kipi (birlikteiyilik.com/dijitallesme): sunan kişi hoca gibi serbestçe sarar, durakta da
      var serbestSar = hoca || !!window.DO_SUNUM;
      function tekEkran() { return ctx.ortak(); }
      function takipci() { return !hoca && tekEkran(); }
      function izleyen() { return hoca && tekEkran(); }
      function kontrol(ad, veri, sec) { return ctx.eylem(ad, veri, tekEkran() ? Object.assign({ ogretmen: true }, sec) : undefined); }
      function hamle(ad, veri) { return ctx.eylem(ad, Object.assign({ _d: acik ? acik.d.i : -1 }, veri), { kisisel: true }); }
      var oynatDug = el('button', { class: 'kd-oynat', type: 'button', 'aria-label': 'Oynat veya duraklat', onclick: function () { kontrol(oynuyor ? 'durdur' : 'oynat', { t: t }); } });
      // Hocamız durakta da sarabilir; öğrenci durağı bitirmeden saramaz
      var geriDug = el('button', { class: 'kd-geri', type: 'button', text: '↺ 10', 'aria-label': '10 saniye geri', onclick: function () { if (!acik || serbestSar) kontrol('sar', { t: Math.max(0, t - 10) }); } });
      var ileriDug = el('button', { class: 'kd-geri kd-ileri', type: 'button', text: '10 ↻', 'aria-label': '10 saniye ileri', onclick: function () { if (!acik || serbestSar) kontrol('sar', { t: Math.min(b.sure, t + 10) }); } });
      var serit = el('div', { class: 'kd-serit' }, [el('i')]);
      var sayac = el('span', { class: 'kd-sure' });
      bar.appendChild(oynatDug); bar.appendChild(geriDug); if (serbestSar) bar.appendChild(ileriDug); bar.appendChild(serit); bar.appendChild(sayac);
      alan.appendChild(svg); alan.appendChild(yaziKat); alan.appendChild(sahneKat);
      kok.appendChild(alan); kok.appendChild(katman); kok.appendChild(bar);
      ctx.kap.appendChild(kok);
      var tuval = DO.KdTuval(alan);
      // Ekrandaki nokta → sahne koordinatı (alan küçülmüş olsa da)
      function sahneNokta(o) { var r = alan.getBoundingClientRect(); return { x: (o.clientX - r.left) / r.width * 1600, y: (o.clientY - r.top) / r.height * 900 }; }
      function alanOlcek() { return alan.getBoundingClientRect().width / Math.max(1, kok.getBoundingClientRect().width); }
      /* Durakta etkinlik altta tam genişlikte bir tepside açılır; sahne küçülmez, yanlarda boşluk kalmaz.
         Tür başına [tepsi yüksekliği, sahnenin yukarı kayması]: durağın önemli kısmı tepsinin üstünde kalır.
         Durak verisinde tepsi ve ust ile değiştirilebilir. Defter ve eşleştirme sahnenin kendisinde açılır. */
      var YER = { kaydir: [150, 30], yerlestir: [240, 40], olmasa: [320, 130], dizme: [230, 150], dokun: [262, 0], secim: [320, 0], serit: [380, 0], okuma: [206, 0] };
      function yerAyarla(d) {
        if (d.duzen === 'defter' || d.tur === 'eslestir') { kok.dataset.yer = 'tam'; return; }
        var y = YER[d.duzen === 'serit' ? 'serit' : d.tur] || [300, 0], tepsi = d.tepsi || y[0];
        var ust = Math.min(d.ust != null ? d.ust : y[1], tepsi);   // sahnenin altı tepsinin arkasında kalır, boşluk açılmaz
        kok.dataset.yer = 'alt'; kok.style.setProperty('--kd-tepsi', tepsi + 'px'); kok.style.setProperty('--kd-ust', ust + 'px');
      }
      function izleKoy(v) { katman.classList.toggle('izle', v); sahneKat.classList.toggle('izle', v); }

      var ses = new Audio(ctx.yol(b.ses)); ses.preload = 'auto';
      var duraklar = (b.duraklar || []).map(function (d, i) { return Object.assign({ i: i, bitti: false, puan: 0 }, d); });
      duraklar.forEach(function (d) {
        serit.appendChild(el('b', { style: 'left:' + (d.zaman / b.sure * 100) + '%' }));
      });
      var t = 0, enUzak = 0, oynuyor = false, acik = null, bitti = false, son = 0, kare = null, yasiyor = true, notlar = {};
      var sahneHazir = false, onceki = 0, tutamac = null, notResim = {};
      var biten = {}, sinif = {}, bekleyen = [], hocaBasladi = false, sonSaat = 0, otoSayac = null, perdeDurdu = false, okumaSayac = null;
      // Canlı derste öğrenci, daha önce bitirdiği dersi de sınıfla birlikte yeniden yapar
      if (ctx.onceki && ctx.onceki.tamam) { bitti = true; if (!takipci()) { enUzak = b.sure; duraklar.forEach(function (d) { d.bitti = true; }); } }

      function sesAcik() { return O.ayar.anlatim !== false && ctx.sesBende(); }
      /* Kâri parçası: anlatımdan ayrı kısa kayıt, aynı anda tek parça çalar. Kur'ân sesinin hızı değiştirilmez. */
      var parca = null;
      function parcaDur() { if (parca) { parca.onended = null; parca.onerror = null; parca.pause(); parca = null; } }
      function parcaCal(dosya, bitince) {
        parcaDur();
        var bitti = false;
        function son() { if (bitti) return; bitti = true; if (bitince) bitince(); }
        if (!dosya || !sesAcik()) { setTimeout(son, 900); return; }
        var a = new Audio(ctx.yol(dosya)); parca = a;
        a.onended = function () { if (parca === a) parca = null; son(); };
        a.onerror = a.onended;
        var p = a.play(); if (p && p.catch) p.catch(function () { if (parca === a) parca = null; setTimeout(son, 900); });
      }
      var api = {
        svg: svg, ciz: Ciz, tuval: tuval, yazi: yaziKat, kok: kok, yol: ctx.yol, sesParca: parcaCal,
        t: function () { return t; },
        azHareket: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
        not: function (id) { return notlar[id] || ''; },
        notResim: function (id) { return notResim[id] ? ctx.yol(notResim[id]) : ''; },
        acikDurak: function () { return acik ? acik.d.id : null; },
        kelime: function (metin, n) {
          var c = 0, i, s = DO.kodSade(metin);
          for (i = 0; i < b.k.length; i++) if (DO.kodSade(b.k[i][0]) === s && ++c === (n || 1)) return b.k[i][1];
          console.warn('kodDers: kelime yok', metin, n); return 0;
        },
        cumle: function (i) { return b.cumleler[i].bas; },
        cumleSon: function (i) { return b.cumleler[i].son; },
        durak: function (id) { var d = duraklar.find(function (x) { return x.id === id; }); return d ? d.zaman : 0; },
        bitti: function (id) { var d = duraklar.find(function (x) { return x.id === id; }); return !!(d && d.bitti); }
      };
      var sahne = null;
      var tepsi = DO.PulTepsi ? DO.PulTepsi(kok, ctx, duraklar) : null;

      function ciz() {
        if (arac) aracYaz();
        serit.firstChild.style.width = (t / b.sure * 100) + '%';
        sayac.textContent = sureYaz(t) + ' / ' + sureYaz(b.sure);
        var c = b.cumleler.find(function (x) { return t >= x.bas && t <= x.son + 0.25; });
        ctx.altyazi(c && !acik && kok.classList.contains('basladi') && !(sahne && sahne.altyazisiz && sahne.altyazisiz(t)) ? c.m : '');
      }
      function dur() { oynuyor = false; ses.pause(); kok.classList.remove('oynuyor'); }
      function basla() {
        if (acik) return;
        if (t >= b.sure) t = 0;
        oynuyor = true; son = performance.now(); kok.classList.add('oynuyor'); kok.classList.add('basladi');
        ses.muted = !sesAcik();
        if (Math.abs(ses.currentTime - t) > 0.15) { try { ses.currentTime = t; } catch (e) { /* yüklenmedi */ } }
        var p = ses.play(); if (p && p.catch) p.catch(function () { /* izin yoksa saat yine yürür */ });
      }
      function dongu(simdi) {
        if (!yasiyor) return;
        kare = requestAnimationFrame(dongu);
        if (onceki) tuval.sureBildir(simdi - onceki);
        onceki = simdi;
        rolYaz();
        // Üst çubuktaki "Duraklat" anlatımı da durdurur; devam edince kaldığı yerden sürer
        if (ctx.oynatici.duraklatildi) { parcaDur(); if (oynuyor) { dur(); perdeDurdu = true; } }
        else if (perdeDurdu) { perdeDurdu = false; if (!acik && t < b.sure) basla(); }
        if (izleyen() && hocaBasladi && simdi - sonSaat > 3000) saatGonder();
        if (oynuyor) {
          var fark = (simdi - son) / 1000; son = simdi;
          t += Math.min(fark, 0.25);
          // Ses çalıyorsa saat sesten gelir; açılmadıysa kendi başına yürür
          if (!ses.paused && !ses.muted && Math.abs(ses.currentTime - t) > 0.2) t = ses.currentTime;
          enUzak = Math.max(enUzak, t);
          var d = duraklar.find(function (x) { return !x.bitti && t >= x.zaman; });
          if (d) { t = d.zaman; dur(); ac(d); }
          else if (t >= b.sure) { t = b.sure; dur(); bitir(); }
          ciz();
        }
        if (sahneHazir) {
          sahne.ciz(t, simdi / 1000);
          if (tutamac && acik) tutamacKoy();
        }
      }

      /* ——— durak kabuğu ——— */
      function panel(d, baslik) {
        var p = el('div', { class: 'kd-panel kd-' + d.tur + (d.duzen ? ' kd-duzen-' + d.duzen : '') + (d.ar ? ' kd-ar' : '') }, [
          el('span', { class: 'kd-etiket', text: d.etiket || 'Sıra sende' }),
          el('h3', { text: baslik || d.soru })
        ]);
        katman.innerHTML = ''; sahneKat.innerHTML = ''; katman.appendChild(p); katman.classList.add('acik');
        sahneKat.classList.toggle('kd-ar', !!d.ar);
        return p;
      }
      function ac(d) {
        acik = { d: d, deneme: 0, ipucu: false, bas: Date.now() };
        ciz();
        yerAyarla(d);
        kok.classList.add('durakta');
        if (sahne && sahne.durak) sahne.durak(d.id, 'ac');
        Kur[d.tur](d);
        if (izleyen()) {
          // Hocamız cevap vermez: paneli görür, sınıfı izler, gerekince durağı geçer
          izleKoy(true);
          sinif = {};
          sinifYaz();
          var bek = bekleyen.filter(function (x) { return x[2]._d === d.i; });
          bekleyen = bekleyen.filter(function (x) { return x[2]._d > d.i; });
          bek.forEach(function (x) { yansiAl(x[0], x[1], x[2]); });
        }
      }
      /* Durak sonucu yalnız cevabı veren cihazda kaydedilir */
      function durakKaydet(d, sonuc) {
        var a = acik && acik.d === d ? acik : null;
        ctx.kaydet('etkilesti', { id: 'durak-' + d.id, ad: d.etiket || d.id }, null, Object.assign({ durak: d.id, ipucu: a && a.ipucu ? 1 : 0, deneme: a ? a.deneme : 0 }, sonuc || {}));
      }
      function durakKabukKapat(d) {
        parcaDur(); clearTimeout(okumaSayac);
        katman.classList.remove('acik'); izleKoy(false); katman.innerHTML = ''; sahneKat.innerHTML = ''; acik = null; tutamac = null;
        kok.classList.remove('durakta'); kok.removeAttribute('data-yer');
        if (sahne && sahne.durak) sahne.durak(d.id, 'kapat');
      }
      function durakKapandi(d, sessiz) {
        d.bitti = true;
        if (acik && acik.d === d) durakKabukKapat(d);
        clearTimeout(otoSayac);
        if (tepsi) tepsi.ver(d.id, sessiz);
        ciz();
      }
      // Hocamız durağın gerisine sardı: durak bitmiş sayılmaz, anlatım oraya gelince yeniden açılır
      function durakBirak(d) {
        if (!acik || acik.d !== d) return;
        durakKabukKapat(d);
        clearTimeout(otoSayac);
      }
      // Kendi başına derste durak kapanır, anlatım sürer
      function kapat(d, sonuc) { durakKaydet(d, sonuc); durakKapandi(d); basla(); }
      /* Durağın işi bitti. Canlı derste öğrenci bekler, durağı Hocamız kapatır (herkes bitince kendiliğinden). */
      function durakBitir(d, sonuc) {
        if (!d || d.bitti || !acik || acik.d !== d) return;
        if (!tekEkran()) { kapat(d, sonuc); return; }
        if (hoca) return;               // Hocamızın paneli yalnız aynadır; sınıf şeridi bilgiyi taşır
        ogrenciBitti(d, sonuc);
      }
      function ogrenciBitti(d, sonuc, metin) {
        // Hocamız geri sarıp durağı yeniden açtıysa ikinci kez kaydedilmez, bekleme notu yine görünür
        if (!biten[d.id]) { biten[d.id] = true; durakKaydet(d, sonuc); }
        var p = katman.querySelector('.kd-panel');
        if (!p) return;
        p.classList.add('kd-bekle');
        var e = p.querySelector('.kd-bekle-not') || p.appendChild(el('p', { class: 'kd-bekle-not' }));
        e.textContent = metin || '✓ Tamam! Hocan devam ettirecek.';
      }
      function devamDug(p, d, metin, tikla) {
        var dug = el('button', { class: 'dug ana kd-devam', type: 'button', text: metin || 'Devam et', onclick: tikla || function () { hamle('kapat', { d: d.i }); } });
        p.appendChild(dug);
        return dug;
      }
      ctx.eylemTanimla('kapat', function (x) { durakBitir(duraklar[x.d]); });
      // Hocamız durağı herkes için kapatır; bitirmeyen öğrencide "atlandı" diye kaydedilir
      ctx.eylemTanimla('devam', function (x, kk) {
        var d = duraklar[x.d]; if (!d || d.bitti) return;
        if (!hoca && !biten[d.id] && !kk.tekrar && acik && acik.d === d) durakKaydet(d, { atlandi: 1 });
        durakKapandi(d, kk.tekrar);
        if (!kk.tekrar) basla();
      });
      function ipucuDug(p, d, metin) {
        var g = el('p', { class: 'kd-ipucu', hidden: true, text: metin });
        p.appendChild(el('button', { class: 'dug ikincil kd-ipucu-dug', type: 'button', text: 'İpucu', onclick: function () { hamle('ipucu', { d: d.i }); } }));
        p.appendChild(g);
        p._ipucu = g;
      }
      ctx.eylemTanimla('ipucu', function () { if (!acik) return; acik.ipucu = true; var g = katman.querySelector('.kd-ipucu'); if (g) g.hidden = false; });
      function geri(p, dogru, metin) {
        var e = p.querySelector('.kd-geri-bildirim'); if (!e) { e = el('p', { class: 'kd-geri-bildirim' }); p.appendChild(e); }
        // dogru null: yanlış değil, keşif (ör. "Güneş de muhtaç")
        e.className = 'kd-geri-bildirim ' + (dogru == null ? 'n' : dogru ? 'd' : 'y'); e.textContent = metin;
      }
      function geriSil(p) { var e = p.querySelector('.kd-geri-bildirim'); if (e) e.remove(); }
      function secenekMetni(o) { return typeof o === 'string' ? o : o.m; }
      // Seçimde ikinci soru seçilen şıkka göre değişebilir (ör. kar tanesi ile Ay'ın hâlleri ayrı düzen gösterir)
      function ikinciGrup(d, k) { var o = d.secenekler[k]; return (o && o.ikinci) || d.ikinci; }
      function olc(d, dogru, yanit, dogruYanit) {
        acik.deneme++;
        if (dogru && acik.deneme === 1 && !acik.ipucu && PUANLI[d.tur]) d.puan = 10;
      }
      ctx.eylemTanimla('metin', function (v, kk) {
        var d = duraklar[v.d]; if (!d || d.bitti) return;
        notlar[d.id] = v.m; notResim[d.id] = v.g;
        if (d.hoca && ctx.canliMi()) { hocaBekle(d, kk && kk.kim); return; }
        durakBitir(d);
      });
      /* Canlı derste çocuk seçimini sözle anlatır, hoca değerlendirir; imanı değil, açıklaması ölçülür */
      var HOCA_SONUC = [['bagimsiz', 'Kendi başına açıkladı'], ['yardimli', 'Yardımla açıkladı'], ['tekrar', 'Sonraki derste yeniden bakalım']];
      function hocaDugmeleri(d, ogr) {
        var k = el('div', { class: 'kd-hoca' });
        HOCA_SONUC.forEach(function (s) {
          k.appendChild(el('button', { class: 'dug ikincil', type: 'button', text: s[1], onclick: function () { kontrol('hoca', { d: d.i, sonuc: s[0], ad: s[1], ogr: ogr ? ogr.id : null }); } }));
        });
        return k;
      }
      function hocaBekle(d, kim) {
        var ogrAd = hoca && kim && kim.ad;
        var p = panel(d, ogrAd ? ogrAd + ' cevabını hocasına anlatıyor' : d.hocaBaslik || 'Seçimini hocana anlat');
        p.appendChild(el('blockquote', { class: 'kd-alinti', text: notlar[d.id] }));
        if (hoca) p.appendChild(hocaDugmeleri(d, kim));
        else p.appendChild(el('p', { class: 'kd-not', text: 'Hocan dinledikten sonra değerlendirecek.' }));
        if (izleyen()) { izleKoy(true); sinifYaz(); }
      }
      ctx.eylemTanimla('hoca', function (v, kk) {
        var d = duraklar[v.d]; if (!d || d.bitti) return;
        if (!tekEkran()) {
          if (kk.yerel) ctx.etkiles('hoca-' + d.id, 'Hoca değerlendirmesi: ' + (d.etiket || d.id), { sonuc: v.sonuc });
          kapat(d, { hoca: v.sonuc }); return;
        }
        if (hoca) { var s = sinif[v.ogr]; if (s) { s.hoca = v.ad; s.bitti = true; } sinifYaz(); otoDevam(); return; }
        if (!ctx.canli.ben || v.ogr !== ctx.canli.ben.id || biten[d.id]) return;
        if (!kk.tekrar) ctx.etkiles('hoca-' + d.id, 'Hoca değerlendirmesi: ' + (d.etiket || d.id), { sonuc: v.sonuc });
        ogrenciBitti(d, { hoca: v.sonuc }, '✓ Hocan: ' + v.ad);
      });

      /* ——— sınıf şeridi: Hocamız kimin ne yaptığını görür ——— */
      function ogrenciler() { return ctx.canli && ctx.canli.ogrenciler ? ctx.canli.ogrenciler() : []; }
      function hamleMetni(d, ad, v) {
        var o;
        if (ad === 'sk') { o = ((v.a ? ikinciGrup(d, v.k) : d) || {}).secenekler; o = o && o[v.i]; return o ? (o.geri ? '✗ ' : '✓ ') + o.m : ''; }
        if (ad === 'koy') return (d.adimlar[v.i] === v.a ? '✓ ' : '✗ ') + v.a;
        if (ad === 'esle') { var a = d.ciftler[v.sol], c = d.ciftler[v.sag]; return a && c ? (v.sol === v.sag ? '✓ ' : '✗ ') + a.a + ' · ' + c.b : ''; }
        if (ad === 'cikar') return (d.varliklar[v.i] || {}).ad + ' olmasaydı…';
        if (ad === 'sonuc') { o = d.varliklar[v.v]; return o && o.secenekler[v.i] != null ? (v.i === o.dogru ? '✓ ' : '✗ ') + secenekMetni(o.secenekler[v.i]) : ''; }
        if (ad === 'salla') return v.tur + '. kez salladı';
        if (ad === 'dizbasla' || ad === 'tas') return 'Taşları diziyor';
        if (ad === 'dene') return (d.varliklar[v.i] || {}).ad + ' denedi';
        if (ad === 'kulak') return (v.i === v.h ? '✓ ' : '✗ ') + ((d.parcalar[v.i] || {}).ad || '');
        if (ad === 'avla') return 'Harf arıyor';
        if (ad === 'kumele') return d.kumeler[v.i] + ' dedi';
        if (ad === 'noktala') return 'Nokta koyuyor';
        if (ad === 'hicbiri') return '✓ ' + d.dogru;
        if (ad === 'kaydir') return d.durum[v.v < d.aralik[0] ? 0 : v.v > d.aralik[1] ? 2 : 1];
        return '';
      }
      function sinifIsle(kim, ad, v) {
        var s = sinif[kim.id] || (sinif[kim.id] = { ad: kim.ad, hamle: 0, son: '', bitti: false, ipucu: false, hoca: null, sk: null });
        s.ad = kim.ad;
        if (ad === 'ipucu') s.ipucu = true;
        else if (ad === 'kapat') s.bitti = true;
        else if (ad === 'metin') { s.cevap = v.m; s.son = v.m; if (!acik.d.hoca) s.bitti = true; }
        else {
          s.hamle++;
          var m = hamleMetni(acik.d, ad, v); if (m) s.son = m;
          if (ad === 'sk' && !v.a) s.sk = v.i;
        }
      }
      function sinifYaz() {
        if (!izleyen() || !acik) return;
        var d = acik.d, liste = ogrenciler(), cok = liste.length > 1;
        var s = katman.querySelector('.kd-sinif');
        if (!s) s = katman.appendChild(el('div', { class: 'kd-sinif', role: 'status', 'aria-live': 'polite' }));
        s.innerHTML = '';
        var tamam = liste.filter(function (o) { return sinif[o.id] && sinif[o.id].bitti; }).length;
        s.appendChild(el('div', { class: 'kd-sinif-ust' }, [
          el('b', { text: liste.length ? (cok ? 'Sınıf ' + tamam + ' / ' + liste.length : (liste[0].ad || 'Öğrenci') + (tamam ? ' bitirdi' : d.hoca && (sinif[liste[0].id] || {}).cevap ? ' cevabını anlatıyor' : ' çalışıyor')) : 'Sınıfta öğrenci yok' }),
          el('button', { class: 'dug ana kd-sinif-devam', type: 'button', text: tamam === liste.length && liste.length ? 'Devam et' : (cok ? 'Herkes için devam et' : 'Durağı geç'), onclick: function () { clearTimeout(otoSayac); kontrol('devam', { d: d.i }); } })
        ]));
        var satirlar = el('div', { class: 'kd-sinif-liste' });
        liste.forEach(function (o) {
          var x = sinif[o.id] || {}, durum = x.bitti ? 'bitti' : x.cevap && d.hoca ? 'cevap' : x.hamle ? 'calisiyor' : 'bekliyor';
          var yazi = x.hoca ? '✓ ' + x.hoca : x.son || (durum === 'bekliyor' ? 'Düşünüyor…' : 'Çalışıyor…');
          var kart = el('div', { class: 'kd-kisi ' + durum }, [
            el('span', { class: 'kd-kisi-harf', text: String(o.ad || '?').slice(0, 1).toLocaleUpperCase('tr') }),
            el('span', { class: 'kd-kisi-govde' }, [el('b', { text: o.ad || 'Öğrenci' }), el('span', { text: yazi + (x.ipucu ? ' · ipucu aldı' : '') })])
          ]);
          if (cok && d.hoca && x.cevap && !x.hoca) kart.appendChild(hocaDugmeleri(d, { id: o.id, ad: o.ad }));
          satirlar.appendChild(kart);
        });
        s.appendChild(satirlar);
        // Birden çok öğrencide seçim kartlarında kimin neyi seçtiği görünür
        katman.querySelectorAll('.kd-rozetler').forEach(function (r) { r.remove(); });
        if (cok && d.tur === 'secim') {
          var kartlar = katman.querySelectorAll('.kd-panel .kd-kart');
          liste.forEach(function (o) {
            var x = sinif[o.id]; if (!x || x.sk == null || !kartlar[x.sk]) return;
            var r = kartlar[x.sk].querySelector('.kd-rozetler') || kartlar[x.sk].appendChild(el('span', { class: 'kd-rozetler' }));
            r.appendChild(el('i', { text: o.ad }));
          });
        }
      }
      function otoDevam() {
        clearTimeout(otoSayac);
        if (!izleyen() || !acik) return;
        var liste = ogrenciler(), d = acik.d;
        if (!liste.length || !liste.every(function (o) { return sinif[o.id] && sinif[o.id].bitti; })) return;
        otoSayac = setTimeout(function () { if (acik && acik.d === d) kontrol('devam', { d: d.i }); }, liste.length > 1 ? 1600 : 900);
      }
      /* Öğrencinin durak hamlesi Hocamıza gelir (oynatıcı iletir) */
      function yansiAl(kim, ad, v) {
        v = v || {};
        if (ad === '__saat') { saatBenimse(v); return; }
        if (!izleyen()) return;
        if (!acik || acik.d.i !== v._d) {
          var hd = duraklar[v._d];
          if (hd && !hd.bitti && (!acik || v._d > acik.d.i)) bekleyen.push([kim, ad, v]);
          return;
        }
        sinifIsle(kim, ad, v);
        // Birebirde ekran tektir: hamle Hocamızın panelinde de aynen oynar
        if (ogrenciler().length <= 1 && ctx.oynatici.aktifEylem) ctx.oynatici.aktifEylem.uygula(ad, v, { yerel: false, yansi: true, kim: kim });
        sinifYaz(); otoDevam();
      }

      /* ——— saat: Hocamızın anlatımı herkeste aynı yerde ——— */
      function durumOzeti() {
        return { t: Math.round(t * 100) / 100, o: oynuyor ? 1 : 0, a: acik ? acik.d.i : -1, s: kok.classList.contains('basladi') ? 1 : 0,
          b: duraklar.filter(function (d) { return d.bitti; }).map(function (d) { return d.i; }) };
      }
      function saatGonder() { sonSaat = performance.now(); kontrol('saat', durumOzeti(), { gunluksuz: true }); }
      ctx.eylemTanimla('saat', function (x) { if (!hoca) saatUygula(x); });
      ctx.eylemTanimla('saatIste', function () {
        if (!hoca && ctx.canli && ctx.canli.acik) ctx.canli.gonder('yansi', { blok: b.id, ad: '__saat', veri: durumOzeti() });
      });
      function saatUygula(x) {
        if (x.s) basladi();
        (x.b || []).forEach(function (i) {
          var d = duraklar[i]; if (!d || d.bitti) return;
          if (acik && acik.d === d && !biten[d.id]) durakKaydet(d, { atlandi: 1 });
          durakKapandi(d, true);
        });
        if (x.a >= 0) {
          var d = duraklar[x.a];
          if (d && !d.bitti && !acik) { dur(); t = d.zaman; enUzak = Math.max(enUzak, t); ac(d); }
          return;
        }
        if (acik) return;           // öğrenci durağa Hocamızdan biraz önce girmiş olabilir
        if (Math.abs(x.t - t) > 0.8) { t = sinirla(x.t, 0, b.sure); enUzak = Math.max(enUzak, t); try { ses.currentTime = t; } catch (e) { /* yüklenmedi */ } son = performance.now(); }
        if (x.o && !oynuyor && t < b.sure) basla(); else if (!x.o && oynuyor) dur();
        ciz();
      }
      // Hocamız sayfayı yenilediyse anlatımı öğrencinin kaldığı yerden alır
      function saatBenimse(v) {
        if (!izleyen() || hocaBasladi || !(v.t > 0.5)) return;
        if (v.s) basladi();
        (v.b || []).forEach(function (i) { var d = duraklar[i]; if (d && !d.bitti) durakKapandi(d, true); });
        t = sinirla(v.t, 0, b.sure); enUzak = Math.max(enUzak, t); try { ses.currentTime = t; } catch (e) { /* yüklenmedi */ }
        if (v.a >= 0 && duraklar[v.a] && !duraklar[v.a].bitti) { hocaBasladi = true; t = duraklar[v.a].zaman; ac(duraklar[v.a]); }
        else if (v.o) { hocaBasladi = true; basla(); }
        ciz();
      }
      ctx.dinle('durumIste', function () { if (izleyen() && hocaBasladi) saatGonder(); });
      ctx.dinle('katilim', function () {
        if (!izleyen()) return;
        if (acik) { sinifYaz(); otoDevam(); }
        if (!hocaBasladi) kontrol('saatIste', {}, { gunluksuz: true });
      });

      /* Öğrenci anlatımı izler: kumanda Hocamızdadır */
      var sonRol = null;
      function rolYaz() {
        var r = takipci() ? 'takip' : izleyen() ? 'hoca' : '';
        if (r === sonRol) return;
        sonRol = r;
        kok.classList.toggle('takipci', r === 'takip');
        kok.classList.toggle('canli-hoca', r === 'hoca');
        if (baslaDug.parentNode && sahneHazir) {
          baslaDug.disabled = r === 'takip';
          baslaYazi.textContent = r === 'takip' ? 'Hocan başlatınca birlikte başlayacağız' : bitti ? 'Yeniden dinle' : 'Derse başla';
        }
        if (r === 'hoca' && !hocaBasladi) kontrol('saatIste', {}, { gunluksuz: true });
      }
      function basladi() { if (baslaDug.parentNode) baslaDug.remove(); kok.classList.add('basladi'); }

      /* Hocamızın panelindeki anlatım kumandası: sahnedeki şerit gizlense de anlatım elinin altında */
      var arac = null, aracSon = '';
      function ogretmenAraci() {
        if (!izleyen()) return null;
        var oyn = el('button', { class: 'dug ana', type: 'button', onclick: function () { if (!acik) kontrol(oynuyor ? 'durdur' : 'oynat', { t: t }); } });
        var gec = el('button', { class: 'dug ikincil', type: 'button', text: 'Durağı geç', onclick: function () { if (acik) { clearTimeout(otoSayac); kontrol('devam', { d: acik.d.i }); } } });
        var zaman = el('span', { class: 'kd-arac-zaman' });
        // Hocamız anlatımın istediği yerine gider; durağın gerisine sararsa durak yeniden açılır
        var sur = el('input', { type: 'range', class: 'kd-arac-sur', min: 0, max: Math.ceil(b.sure), step: 1, value: 0, 'aria-label': 'Anlatımda istediğin yere git' });
        var surTut = false;
        sur.addEventListener('pointerdown', function () { surTut = true; });
        sur.addEventListener('input', function () { surTut = true; zaman.textContent = sureYaz(+sur.value) + ' / ' + sureYaz(b.sure); });
        sur.addEventListener('change', function () { surTut = false; kontrol('sar', { t: +sur.value }); });
        sur.addEventListener('blur', function () { surTut = false; });
        arac = { oyn: oyn, gec: gec, zaman: zaman, sur: sur, tutuluyor: function () { return surTut; }, kok: el('div', { class: 'kd-arac' }, [
          el('b', { text: 'Anlatım' }),
          el('div', { class: 'kd-arac-dugmeler' }, [oyn,
            el('button', { class: 'dug ikincil', type: 'button', text: '↺ 10', title: '10 saniye geri', onclick: function () { kontrol('sar', { t: Math.max(0, t - 10) }); } }),
            el('button', { class: 'dug ikincil', type: 'button', text: '10 ↻', title: '10 saniye ileri', onclick: function () { kontrol('sar', { t: Math.min(b.sure, t + 10) }); } }),
            gec]),
          sur, zaman]) };
        aracSon = ''; aracYaz(true);
        return arac.kok;
      }
      function aracYaz(zorla) {
        if (!arac || (!zorla && !arac.kok.isConnected)) return;
        var durum = acik ? 'durak' : oynuyor ? 'oynuyor' : bitti && t >= b.sure ? 'bitti' : kok.classList.contains('basladi') ? 'durdu' : 'bas';
        var metin = sureYaz(t) + ' / ' + sureYaz(b.sure) + (acik ? ' · ' + (acik.d.etiket || 'Durak') : '');
        if (durum + metin === aracSon) return;
        aracSon = durum + metin;
        arac.oyn.textContent = { durak: 'Durakta', oynuyor: '❚❚ Durdur', bitti: '▶ Baştan', durdu: '▶ Sürdür', bas: '▶ Başlat' }[durum];
        arac.oyn.disabled = durum === 'durak';
        arac.gec.hidden = durum !== 'durak';
        if (!arac.tutuluyor()) { arac.sur.value = Math.round(t); arac.zaman.textContent = metin; }
      }

      /* Anlatım sürerken sahneye dokunan çocuk küçük bir kıvılcım görür; sahne isterse kendi tepkisini de verir.
         Allahü teâlâdan söz edilen bölümde (sahne altyazısız, yalnız kâğıt ve yazı) oyun yoktur. */
      var sonKivilcim = 0;
      kok.addEventListener('pointerdown', function (o) {
        if (!sahneHazir || acik || !kok.classList.contains('basladi')) return;
        if (o.target !== kok && o.target !== alan && !(o.target.classList && o.target.classList.contains('kd-tuval'))) return;
        if (sahne.altyazisiz && sahne.altyazisiz(t)) return;
        var simdi = performance.now(); if (simdi - sonKivilcim < 140) return; sonKivilcim = simdi;
        var r = kok.getBoundingClientRect(), x = (o.clientX - r.left) / r.width * 1600, y = (o.clientY - r.top) / r.height * 900, sn = sahneNokta(o);
        if (sahne.dokun && sahne.dokun(sn.x, sn.y, simdi / 1000) === true) return;
        var k = el('div', { class: 'kd-kivilcim', style: 'left:' + x.toFixed(0) + 'px;top:' + y.toFixed(0) + 'px' });
        for (var i = 0; i < 8; i++) k.appendChild(el('i', { style: '--a:' + (i * 45) + 'deg' }));
        kok.appendChild(k);
        setTimeout(function () { k.remove(); }, 700);
        if (DO.efekt && DO.efekt.tik) DO.efekt.tik();
      });

      function titret(e) { if (!e) return; e.classList.remove('sars'); void e.offsetWidth; e.classList.add('sars'); }
      /* Tut ve sürükle: parmakla ya da fareyle. Sahne ölçeklendiği için hayalet sahnenin içinde, sahne
         koordinatında taşınır. Bırakılan yerdeki hedef bulunur; sürüklemeden dokunulursa birak(null). */
      function surukle(e, hedefSec, birak, sec) {
        sec = sec || {};
        e.addEventListener('pointerdown', function (o) {
          if (e.disabled || e.classList.contains('doldu') || o.button > 0) return;
          o.preventDefault();
          var k = kok.getBoundingClientRect(), olcek = 1600 / k.width, r = e.getBoundingClientRect();
          // Sahnedeki öğe küçülmüş alandadır: hayalet aynı boyda görünsün diye o oranda ölçeklenir
          var hs = sahneKat.contains(e) ? alanOlcek() : 1;
          var dx = (o.clientX - r.left) * olcek, dy = (o.clientY - r.top) * olcek, hayalet = null, ustunde = null, x0 = o.clientX, y0 = o.clientY;
          try { e.setPointerCapture(o.pointerId); } catch (x) { /* eski tarayıcı */ }
          // Parmak hedefin biraz dışında bırakılsa da en yakın hedef sayılır: çocuğun eli tam isabet etmez
          function hedef(x, y) {
            var h = document.elementFromPoint(x, y); h = h && h.closest ? h.closest(hedefSec) : null;
            if (h) return h;
            var en = null, enD = 60 / olcek;
            kok.querySelectorAll(hedefSec).forEach(function (c) {
              if (c === e || c.contains(e)) return;
              var b = c.getBoundingClientRect();
              if (!b.width || getComputedStyle(c).visibility === 'hidden') return;
              var d = Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom));
              if (d < enD) { enD = d; en = c; }
            });
            return en;
          }
          function hareket(m) {
            if (!hayalet) {
              if (Math.abs(m.clientX - x0) + Math.abs(m.clientY - y0) < 8) return;
              // Hayalet panelin dışına taşınır; panelden gelen görünümü yanında götürür
              var cs = getComputedStyle(e);
              hayalet = e.cloneNode(true);
              ['font', 'padding', 'background', 'color', 'border', 'borderRadius', 'textAlign', 'lineHeight', 'display', 'alignItems', 'justifyContent'].forEach(function (k) { hayalet.style[k] = cs[k]; });
              hayalet.classList.add('kd-hayalet');
              hayalet.style.width = (r.width * olcek / hs) + 'px'; hayalet.style.height = (r.height * olcek / hs) + 'px';
              hayalet.style.setProperty('--hs', hs);
              katman.appendChild(hayalet); e.classList.add('tasiniyor');
              if (sec.basladi) sec.basladi();
            }
            hayalet.style.left = ((m.clientX - k.left) * olcek - dx) + 'px';
            hayalet.style.top = ((m.clientY - k.top) * olcek - dy) + 'px';
            var h = hedef(m.clientX, m.clientY);
            if (h !== ustunde) { if (ustunde) ustunde.classList.remove('ustunde'); ustunde = h; if (h) h.classList.add('ustunde'); }
          }
          function birakti(m) {
            e.removeEventListener('pointermove', hareket); e.removeEventListener('pointerup', birakti); e.removeEventListener('pointercancel', birakti);
            if (ustunde) ustunde.classList.remove('ustunde');
            e.classList.remove('tasiniyor');
            if (sec.bitti) sec.bitti();
            if (!hayalet) { if (m.type === 'pointerup') { if (sec.dokun) sec.dokun(); else { titret(e); birak(null); } } return; }
            hayalet.remove();
            var h = m.type === 'pointerup' ? hedef(m.clientX, m.clientY) : null;
            if (h) birak(h); else titret(e);
          }
          e.addEventListener('pointermove', hareket); e.addEventListener('pointerup', birakti); e.addEventListener('pointercancel', birakti);
        });
      }

      /* Sürüklenen sahne öğesi (ör. Güneş): çocuk öğenin kendisini tutar; sahne yerini ve değerini söyler.
         Klavyede ok tuşları da değeri değiştirir. tutDeger'e tutulduğu andaki nokta ve değer de gider
         ({x, y, deger}): döndürülen bir kürede değer parmağın ne kadar kaydığından hesaplanabilir. */
      function tutamacKur(d, r) {
        var e = el('button', { class: 'kd-tut', type: 'button', role: 'slider', 'aria-label': d.tutAd || d.soru, 'aria-valuemin': 0, 'aria-valuemax': 100 }, [el('span', { class: 'kd-tut-ipucu', text: d.tutYazi || 'Tut ve sürükle' })]);
        sahneKat.appendChild(e);
        var basili = false, sonGonderim = 0, bas = null;
        function gonder(v) {
          v = Math.round(sinirla(v, 0, 100));
          var simdi = performance.now();
          if (ctx.canliMi() && simdi - sonGonderim < 70) return;
          sonGonderim = simdi; hamle('kaydir', { d: d.i, v: v });
        }
        e.addEventListener('pointerdown', function (o) {
          basili = true; e.setPointerCapture(o.pointerId); e.classList.add('tutuldu', 'denendi');
          var n = sahneNokta(o); bas = { x: n.x, y: n.y, deger: r() };
        });
        e.addEventListener('pointerup', function () { basili = false; e.classList.remove('tutuldu'); });
        e.addEventListener('pointercancel', function () { basili = false; e.classList.remove('tutuldu'); });
        e.addEventListener('pointermove', function (o) {
          if (!basili) return;
          var n = sahneNokta(o);
          gonder(sahne.tutDeger(d.id, n.x, n.y, bas));
        });
        e.addEventListener('keydown', function (o) {
          var adim = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5 }[o.key];
          if (!adim) return;
          o.preventDefault(); o.stopPropagation();   // ok tuşu oynatıcıya gitmez: sayfa ilerlemez, "Önce bu etkinliği tamamlayalım" uyarısı çıkmaz
          e.classList.add('denendi'); sonGonderim = 0; gonder(r() + adim);
        });
        tutamac = { e: e, d: d, deger: function () { return r(); } };
        tutamacKoy();
      }
      function tutamacKoy() {
        var y = sahne.tutamac(tutamac.d.id, tutamac.deger());
        var e = tutamac.e;
        e.style.left = y.x + 'px'; e.style.top = y.y + 'px'; e.style.width = e.style.height = y.r * 2 + 'px';
        e.classList.toggle('ust', !!y.ust);   // büyük tutamaçta ipucu yazısı üstte durur, tepsinin altında kalmaz
        e.setAttribute('aria-valuenow', Math.round(tutamac.deger()));
      }

      var Kur = {
        /* Çocuğa yazı yazdırılmaz: resim, nesne ya da şıktan seçer. geri taşıyan şık yanlıştır,
           açıklaması görünür, yeniden denenir. Bilgi sorusunda yalnız bir şık doğrudur; d.serbest ise
           çocuk anlatacağı şeyi seçer, her şık geçerlidir. İkinci soru seçilen şıkkın kendi ikinci'sinden
           ya da d.ikinci'den gelir. notGorsel kartta görünmez, deftere yazılan notla gider. */
        secim: function (d) {
          var p = panel(d), ilk = null, ilkI = -1, son = null, dug = null, kartlar = el('div', { class: 'kd-kartlar' });
          if (d.ilkNot && notlar[d.ilkNot]) p.appendChild(el('blockquote', { class: 'kd-alinti', html: '<b>Dersin başında bunu seçmiştin:</b> ' + DO.kacis(notlar[d.ilkNot]) }));
          if (d.ipucu) ipucuDug(p, d, d.ipucu);
          if (d.hoca) p.appendChild(el('p', { class: 'kd-not', text: ctx.canliMi() ? 'Seçimini hocana kendi sözlerinle anlat.' : 'Bunu sonraki derste hocana anlatacaksın.' }));
          p.appendChild(kartlar);
          function grupAl(adim, k) { return adim ? ikinciGrup(d, k) : d; }
          function diz(adim) {
            var grup = grupAl(adim, ilkI);
            if (adim) p.querySelector('h3').textContent = grup.soru;
            // İkinci soruda çocuk seçtiği resme bakarak cevaplar (defterde sol sayfada durur)
            if (adim && ilk && ilk.gorsel && d.duzen === 'defter' && !p.querySelector('.kd-secilen')) p.insertBefore(el('img', { class: 'kd-secilen', src: ctx.yol(ilk.gorsel), alt: ilk.m }), p.querySelector('.kd-not') || kartlar);
            kartlar.innerHTML = ''; kartlar.classList.toggle('resimli', !!grup.secenekler[0].gorsel);
            kartlar.classList.toggle('uclu', grup.secenekler.length === 3);
            grup.secenekler.forEach(function (o, i) {
              kartlar.appendChild(el('button', { class: 'kd-kart', type: 'button', onclick: function () { hamle('sk', { d: d.i, a: adim, i: i, k: adim ? ilkI : -1 }); } }, [o.gorsel ? el('img', { src: ctx.yol(o.gorsel), alt: '' }) : null, el('span', { text: o.m })]));
            });
          }
          ctx.eylemTanimla('sk', function (x, kk) {
            if (x.a && ilkI < 0 && x.k >= 0) { ilk = d.secenekler[x.k]; ilkI = x.k; diz(1); }   // geç gelen ekran
            var grup = grupAl(x.a, x.a ? ilkI : -1), o = grup && grup.secenekler[x.i]; if (!o) return;
            acik.deneme++;
            if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + (x.a ? '-2' : ''), ad: grup.soru, yanit: o.m, dogru: o.geri ? false : undefined, puan: 0, max: 0, deneme: acik.deneme, etkilesim: 'choice' });
            kartlar.querySelectorAll('.kd-kart').forEach(function (c, i) { c.classList.toggle('secili', i === x.i); c.classList.toggle('yanlis', i === x.i && !!o.geri); });
            // Sahne seçilen şıkkı gösterebilir (ör. terazinin kefesine konan şey); ilk sorunun şıkkı bildirilir
            if (!x.a && sahne && sahne.durak) sahne.durak(d.id, 'sec', x.i);
            if (o.geri) {
              geri(p, false, o.geri); son = null;
              if (dug) { dug.remove(); dug = null; }
              if (!kk.tekrar) DO.efekt.yanlis();
              return;
            }
            geriSil(p);
            if (!kk.tekrar) DO.efekt.dogru();
            if (!x.a && ikinciGrup(d, x.i)) { ilk = o; ilkI = x.i; diz(1); return; }
            son = x.a ? { m: ilk.m + ': ' + o.m, gorsel: ilk.gorsel || ilk.notGorsel } : { m: o.m, gorsel: o.gorsel || o.notGorsel };
            if (o.aciklama) geri(p, true, o.aciklama);
            if (!dug) dug = devamDug(p, d, d.dugme, function () { hamle('metin', { d: d.i, m: son.m, g: son.gorsel }); });
          });
          diz(0);
        },
        /* Çocuk sahnedeki öğeyi (Güneş) doğrudan tutup sürükler; kaydırma çubuğu yoktur.
           İki ucu da deneyip öğeyi yeniden ölçüsüne getirince devam edilir. d.hedefler üç adımın adıdır. */
        kaydir: function (d) {
          var p = panel(d), deger = d.bas, kisimOnce = 1, ad = 0;
          var hedefler = d.hedefler || ['Uzaklaştır', 'Yaklaştır', 'Yerine getir'];
          var adimlar = el('div', { class: 'kd-hedefler' }, hedefler.map(function (m) { return el('span', { text: m }); }));
          var n = el('p', { class: 'kd-durum', text: d.ilk || d.durum[1] });
          var dug = devamDug(p, d); dug.disabled = true;
          var govde = el('div', { class: 'kd-kaydir-govde' }, [adimlar, n]);
          p.insertBefore(govde, dug);
          ctx.eylemTanimla('kaydir', function (v) {
            deger = v.v;
            var kisim = deger < d.aralik[0] ? 0 : deger > d.aralik[1] ? 2 : 1;
            if (kisim !== kisimOnce && acik) { kisimOnce = kisim; acik.deneme++; }
            if (sahne && sahne.durak) sahne.durak(d.id, 'deger', deger);
            if (kisim !== 1) ad |= kisim === 0 ? 1 : 2;   // iki ucu da deneyince
            var hazir = ad === 3 && kisim === 1;
            adimlar.children[0].classList.toggle('oldu', !!(ad & 1));
            adimlar.children[1].classList.toggle('oldu', !!(ad & 2));
            adimlar.children[2].classList.toggle('oldu', hazir);
            dug.disabled = !hazir;
            n.className = 'kd-durum d' + kisim;
            n.textContent = hazir ? d.durum[1] + ' ' + (d.tamam || 'Şimdi devam edebilirsin.') : ad === 3 ? d.durum[kisim] + ' ' + (d.geriGetir || 'Şimdi yerine getir.') : d.durum[kisim];
            if (tutamac) { tutamac.e.classList.add('denendi'); tutamacKoy(); }   // Hocamızın aynasında da ipucu kalkar
          });
          if (sahne && sahne.durak) sahne.durak(d.id, 'deger', deger);
          if (sahne && sahne.tutamac) tutamacKur(d, function () { return deger; });
        },
        /* Yuvalar sahnenin üstündedir (d.yuvalar: adım başına {x, y}); adımlar alttaki şeritten tutulup yuvaya sürüklenir */
        yerlestir: function (d) {
          var p = panel(d), doldu = {};
          var yuvalar = el('div', { class: 'kd-yuvalar' });
          d.adimlar.forEach(function (a, i) {
            var bos = d.bos.indexOf(i) >= 0, y = d.yuvalar[i];
            yuvalar.appendChild(el('div', { class: 'kd-yuva' + (bos ? ' bos' : ' doldu'), 'data-i': i, style: 'left:' + y.x + 'px;top:' + y.y + 'px', text: bos ? '?' : a }));
          });
          sahneKat.appendChild(yuvalar);
          var cip = el('div', { class: 'cipler' });
          ctx.karistir(d.bos.map(function (i) { return d.adimlar[i]; }).concat(d.fazla || []), 'yer' + d.id).forEach(function (m) {
            var c = cip.appendChild(el('button', { class: 'cip kd-tut-cip', type: 'button', text: m }));
            surukle(c, '.kd-yuva.bos', function (h) {
              if (!h) { geri(p, null, 'Adımı tut, yukarıdaki soru işaretinin üstüne sürükle.'); return; }
              hamle('koy', { i: +h.dataset.i, a: m });
            }, { basladi: function () { yuvalar.classList.add('seciliyor'); }, bitti: function () { yuvalar.classList.remove('seciliyor'); } });
          });
          p.appendChild(cip);
          if (d.ipucu) ipucuDug(p, d, d.ipucu);
          ctx.eylemTanimla('koy', function (v, kk) {
            var li = yuvalar.querySelector('[data-i="' + v.i + '"]'); if (!li || doldu[v.i]) return;
            var dogru = d.adimlar[v.i] === v.a;
            olc(d, dogru);
            if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + '-' + v.i, ad: d.soru, yanit: v.a, dogru: dogru, dogruYanit: d.adimlar[v.i], puan: 0, max: 0, deneme: acik.deneme, etkilesim: 'sequencing' });
            if (!kk.tekrar) (dogru ? DO.efekt.dogru : DO.efekt.yanlis)();
            if (!dogru) { titret(li); geri(p, false, d.yanlis || 'Bu adım burada değil. Bir daha düşün.'); return; }
            doldu[v.i] = 1; li.textContent = v.a; li.classList.remove('bos'); li.classList.add('doldu');
            cip.querySelectorAll('.cip').forEach(function (c) { if (c.textContent === v.a) c.disabled = true; });
            geri(p, true, 'Yerine oturdu.');
            if (sahne && sahne.durak) sahne.durak(d.id, 'dogru', v.i);
            if (Object.keys(doldu).length === d.bos.length) {
              if (acik.deneme === d.bos.length && !acik.ipucu) d.puan = 10; else d.puan = 0;
              cip.remove(); var ipucuD = p.querySelector('.kd-ipucu-dug'); if (ipucuD) ipucuD.remove();
              if (d.sonMetin) geri(p, true, d.sonMetin);
              devamDug(p, d);
            }
          });
        },
        /* Çocuk sahnedeki varlığı tutup alttaki kutuya bırakır: varlık sahneden çıkar, sahne değişir,
           "o olmasaydı ne olurdu?" sorusu açılır. Doğru cevaba kadar başka bir varlıkla değiştirebilir.
           Şık metin ya da {m, geri} olabilir; geri o yanlışa özel açıklamadır. */
        olmasa: function (d) {
          var p = panel(d), dug = null, secilen = -1, noktalar = el('div', { class: 'kd-noktalar' }), soru = el('div', { class: 'kd-soru' });
          var sol = el('div', { class: 'kd-olmasa-sol' }), kutu = el('div', { class: 'kd-cikar-alan', text: d.kutu || 'Birini tutup buraya bırak' });
          var not = el('p', { class: 'kd-not kd-cikar-not' });
          [p.querySelector('.kd-etiket'), p.querySelector('h3')].forEach(function (e) { sol.appendChild(e); });
          sol.appendChild(kutu); sol.appendChild(not);
          d.varliklar.forEach(function (v, i) {
            var n = noktalar.appendChild(el('button', { class: 'kd-nokta kd-tut-cip', type: 'button', 'data-i': i, 'aria-label': v.ad, style: 'left:' + v.x + 'px;top:' + v.y + 'px' }, [el('span', { text: v.ad })]));
            surukle(n, '.kd-cikar-alan', function (h) {
              if (!h) { not.textContent = 'Tut ve aşağıdaki kutuya sürükle.'; return; }
              hamle('cikar', { i: i });
            }, { basladi: function () { kutu.classList.add('bekliyor'); not.textContent = ''; }, bitti: function () { kutu.classList.remove('bekliyor'); } });
          });
          sahneKat.appendChild(noktalar);
          p.appendChild(sol); p.appendChild(soru);
          ctx.eylemTanimla('cikar', function (x) {
            var v = d.varliklar[x.i]; if (!v || dug) return;
            secilen = x.i; soru.innerHTML = ''; not.textContent = '';
            kutu.textContent = v.ad + ' sahneden çıktı'; kutu.classList.add('dolu');
            // Çıkan varlığın noktası sahnede kalmaz; diğerleriyle değiştirmek hâlâ mümkündür
            noktalar.querySelectorAll('.kd-nokta').forEach(function (c, i) { c.classList.toggle('cikti', i === x.i); });
            p.classList.add('secildi');
            if (sahne && sahne.durak) sahne.durak(d.id, 'cikar', v.id);
            soru.appendChild(el('h4', { text: v.soru }));
            ctx.karistir(v.secenekler.map(function (m, i) { return { m: secenekMetni(m), i: i }; }), 'ol' + x.i).forEach(function (o) {
              soru.appendChild(el('button', { class: 'secenek', type: 'button', 'data-i': o.i, text: o.m, onclick: function () { hamle('sonuc', { v: x.i, i: o.i }); } }));
            });
            if (d.varliklar.length > 1) not.textContent = d.degistir || 'İstersen başka birini de kutuya bırakabilirsin.';
          });
          ctx.eylemTanimla('sonuc', function (x, kk) {
            var v = d.varliklar[x.v]; if (!v || x.v !== secilen || dug) return;
            var o = v.secenekler[x.i], dogru = x.i === v.dogru;
            olc(d, dogru);
            if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + '-' + v.id, ad: v.soru, yanit: secenekMetni(o), dogru: dogru, dogruYanit: secenekMetni(v.secenekler[v.dogru]), puan: 0, max: 0, deneme: acik.deneme });
            if (!kk.tekrar) (dogru ? DO.efekt.dogru : DO.efekt.yanlis)();
            soru.querySelectorAll('.secenek').forEach(function (c) { var bu = +c.dataset.i === x.i; c.classList.toggle('secili', bu); c.classList.toggle('yanlis', bu && !dogru); });
            geri(soru, dogru, dogru ? v.aciklama : (o && o.geri) || d.yanlis || 'Sahneye bir daha bak.');
            if (dogru) {
              soru.querySelectorAll('.secenek').forEach(function (c) { c.disabled = true; });
              noktalar.classList.add('bitti'); not.textContent = '';
              if (sahne && sahne.durak) sahne.durak(d.id, 'dogru', v.id);
              dug = devamDug(sol, d);   // sol sütunda yer var, soru sütunu taşmaz
            }
          });
        },
        /* Resimler üstte, cevaplar alttadır. Çocuk hangisini tutarsa tutsun eşleştirir: cevabı resmin
           üstüne ya da resmi cevabın üstüne sürükler. Seçip sonra tıklamak yoktur. */
        eslestir: function (d) {
          var p = panel(d), bitenler = {};
          var iki = el('div', { class: 'kd-esles' + (d.ciftler.length === 3 ? ' uc' : '') }), a = el('div', { class: 'kd-esles-a' }), c = el('div', { class: 'kd-esles-b' });
          var surukleIpucu = d.surukleIpucu || 'Resmi yazının üstüne ya da yazıyı resmin üstüne sürükle.';
          // Cevabın yeri baştan ayrılır (gizli): doğru eşleşmede resimler uzayıp yazılar aşağı kaymaz, çocuk kartı gördüğü yerde bulur
          d.ciftler.forEach(function (x, i) {
            var r = a.appendChild(el('div', { class: 'kd-canli kd-tut-resim', 'data-i': i, role: 'img', 'aria-label': x.a }, [
              el('img', { src: ctx.yol(x.gorsel), alt: '', draggable: 'false' }), el('span', { text: x.a }), el('b', { class: 'kd-canli-cevap gizli', text: x.b })
            ]));
            surukle(r, '.kd-esles-b .secenek:not(.doldu)', function (h) {
              if (!h) { geri(p, null, surukleIpucu); return; }
              hamle('esle', { sol: i, sag: +h.dataset.i });
            });
          });
          ctx.karistir(d.ciftler.map(function (x, i) { return { m: x.b, i: i }; }), 'es' + d.id).forEach(function (o) {
            var e = c.appendChild(el('button', { class: 'secenek kd-tut-cip', type: 'button', 'data-i': o.i, text: o.m }));
            surukle(e, '.kd-canli:not(.doldu)', function (h) {
              if (!h) { geri(p, null, surukleIpucu); return; }
              hamle('esle', { sol: +h.dataset.i, sag: o.i });
            });
          });
          iki.appendChild(a); iki.appendChild(c); p.appendChild(iki);
          if (d.ipucu) ipucuDug(p, d, d.ipucu);
          ctx.eylemTanimla('esle', function (x, kk) {
            var sol = x.sol, s = d.ciftler[sol], ae = a.querySelector('[data-i="' + sol + '"]');
            if (!s || !d.ciftler[x.sag] || bitenler[sol]) return;
            var dogru = sol === x.sag;
            olc(d, dogru);
            if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + '-' + sol, ad: s.a, yanit: d.ciftler[x.sag].b, dogru: dogru, dogruYanit: s.b, puan: 0, max: 0, deneme: acik.deneme, etkilesim: 'matching' });
            if (!kk.tekrar) (dogru ? DO.efekt.dogru : DO.efekt.yanlis)();
            if (!dogru) { titret(ae); geri(p, false, d.yanlis || 'Bir daha düşün.'); return; }
            bitenler[sol] = 1;
            var ce = c.querySelector('[data-i="' + x.sag + '"]');
            ae.classList.add('doldu'); ae.querySelector('.kd-canli-cevap').classList.remove('gizli'); ce.disabled = true; ce.classList.add('doldu');
            geri(p, true, s.aciklama || 'Doğru.');
            if (Object.keys(bitenler).length === d.ciftler.length) {
              if (acik.deneme === d.ciftler.length && !acik.ipucu) d.puan = 10; else d.puan = 0;
              var ipucuD = p.querySelector('.kd-ipucu-dug'); if (ipucuD) ipucuD.remove();
              devamDug(p, d);
            }
          });
        },
        /* Deneme ve sıralama: torba sallanınca taşlar rastgele dizilir, sonra çocuk 1'den başlayarak kendisi dizer.
           Karışık düzen ctx.karistir ile canlı derste herkeste aynı çıkar. */
        dizme: function (d) {
          var p = panel(d), n = d.sayi, tur = 0, siradaki = 1, taslar = [], kat = el('div', { class: 'kd-taslar' });
          var durum = el('p', { class: 'kd-durum' }), dugmeler = el('div', { class: 'kd-dugmeler' }), sayilar = [];
          function yer(e, x, y) { e.style.left = x + 'px'; e.style.top = y + 'px'; }
          function tasKur(no) {
            var e = el('button', { class: 'kd-tas', type: 'button', text: String(no), disabled: true, 'aria-label': no + ' numaralı taş', style: "background-image:url('" + ctx.yol(d.tas) + "')" });
            // Taşa dokunmak da olur, tutup yukarıdaki sıraya sürüklemek de
            surukle(e, '.kd-tas-sira', function () { hamle('tas', { no: no }); }, { dokun: function () { hamle('tas', { no: no }); } });
            yer(e, d.torba.x, d.torba.y); kat.appendChild(e); taslar[no] = e; sayilar.push(no);
          }
          for (var i = 1; i <= n; i++) tasKur(i);
          var sira = el('div', { class: 'kd-tas-sira', hidden: true, style: 'left:' + (d.hedef.x - 70) + 'px;top:' + (d.hedef.y - 70) + 'px;width:' + ((n - 1) * d.hedef.dx + 140) + 'px;height:140px' });
          kat.appendChild(sira);
          sahneKat.appendChild(kat);
          var sallaDug = el('button', { class: 'dug ana', type: 'button', text: d.dugme, onclick: function () { hamle('salla', { tur: tur + 1 }); } });
          var dizDug = el('button', { class: 'dug ikincil', type: 'button', text: d.ikinciDugme, hidden: true, onclick: function () { hamle('dizbasla', {}); } });
          dugmeler.appendChild(sallaDug); dugmeler.appendChild(dizDug); p.appendChild(durum); p.appendChild(dugmeler);
          ctx.eylemTanimla('salla', function (x, kk) {
            tur = x.tur;
            var dizi = ctx.karistir(sayilar, 'torba' + tur), yerinde = 0;
            // taşlar önce torbaya döner, sonra sırayla dökülür
            kat.classList.add('dondur');
            sayilar.forEach(function (no) { yer(taslar[no], d.torba.x, d.torba.y); taslar[no].classList.add('dokuluyor'); });
            void kat.offsetWidth;
            kat.classList.remove('dondur');
            dizi.forEach(function (no, k) {
              if (no === k + 1) yerinde++;
              taslar[no].style.transitionDelay = (k * 55) + 'ms';
              yer(taslar[no], d.sira.x + k * d.sira.dx, d.sira.y);
            });
            durum.textContent = tur + '. sallayış: ' + (yerinde ? n + ' taştan yalnız ' + yerinde + ' tanesi yerine düştü.' : 'hiçbir taş yerine düşmedi.') + (tur >= 2 ? ' ' + (d.sallaSon || 'Bir daha salla ya da kendin diz.') : '');
            if (acik) acik.deneme = tur;
            if (tur >= 2) dizDug.hidden = false;
            if (sahne && sahne.durak) sahne.durak(d.id, 'salla', tur);
            if (!kk.tekrar) DO.efekt.dogru();
          });
          ctx.eylemTanimla('dizbasla', function () {
            dugmeler.remove(); durum.remove();
            p.querySelector('h3').textContent = d.diziSoru;
            sayilar.forEach(function (no) { taslar[no].disabled = false; taslar[no].style.transitionDelay = '0ms'; taslar[no].classList.add('kd-tut-cip'); });
            sira.hidden = false;
            if (d.ipucu) ipucuDug(p, d, d.ipucu);
            if (sahne && sahne.durak) sahne.durak(d.id, 'dizbasla');
          });
          ctx.eylemTanimla('tas', function (x, kk) {
            var e = taslar[x.no]; if (!e || e.disabled) return;
            if (x.no !== siradaki) {
              e.classList.remove('sars'); void e.offsetWidth; e.classList.add('sars');
              geri(p, false, 'Şimdi ' + siradaki + ' numaralı taşı bul.');
              if (!kk.tekrar) DO.efekt.yanlis();
              return;
            }
            e.disabled = true; e.classList.add('yerinde'); e.classList.remove('kd-tut-cip');
            yer(e, d.hedef.x + (siradaki - 1) * d.hedef.dx, d.hedef.y);
            siradaki++;
            if (!kk.tekrar) DO.efekt.dogru();
            var g = p.querySelector('.kd-geri-bildirim'); if (g) g.remove();
            if (siradaki > n) {
              d.puan = 10; sira.hidden = true;
              if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id, ad: d.soru, yanit: tur + ' kez sallandı, sırayla dizildi', dogru: true, puan: 0, max: 0, deneme: tur, etkilesim: 'sequencing' });
              var ipucuD = p.querySelector('.kd-ipucu-dug'); if (ipucuD) ipucuD.remove();
              geri(p, true, d.sonMetin);
              if (sahne && sahne.durak) sahne.durak(d.id, 'dizildi');
              devamDug(p, d);
            }
          });
        },
        /* Sahnedeki varlıklar denenir, her birinin cevabı görünür; d.dogru düğmesi durağı bitirir */
        dokun: function (d) {
          var p = panel(d), dug = null, noktalar = el('div', { class: 'kd-noktalar' }), denenen = [];
          d.varliklar.forEach(function (v, i) {
            noktalar.appendChild(el('button', { class: 'kd-nokta', type: 'button', 'data-i': i, style: 'left:' + v.x + 'px;top:' + v.y + 'px', onclick: function () { hamle('dene', { i: i }); } }, [el('span', { text: v.ad })]));
          });
          sahneKat.appendChild(noktalar);
          p.appendChild(el('div', { class: 'kd-kartlar' }, [el('button', { class: 'kd-kart', type: 'button', onclick: function () { hamle('hicbiri', {}); } }, [el('span', { text: d.dogru })])]));
          if (d.ipucu) ipucuDug(p, d, d.ipucu);
          ctx.eylemTanimla('dene', function (x, kk) {
            var v = d.varliklar[x.i]; if (!v) return;
            acik.deneme++;
            if (denenen.indexOf(v.ad) < 0) denenen.push(v.ad);
            noktalar.querySelectorAll('.kd-nokta').forEach(function (c, i) { c.classList.toggle('secili', i === x.i); if (i === x.i) c.classList.add('denendi'); });
            // Denemek yanlış değildir: çocuk keşfediyor, açıklama nötr görünür
            geri(p, null, v.geri);
            if (sahne && sahne.durak) sahne.durak(d.id, 'dene', v.id);
            if (!kk.tekrar && DO.efekt.tik) DO.efekt.tik();
          });
          ctx.eylemTanimla('hicbiri', function (x, kk) {
            if (dug) return;
            d.puan = 10;
            if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id, ad: d.soru, yanit: d.dogru, dogru: true, puan: 0, max: 0, deneme: acik.deneme + 1 });
            noktalar.remove();
            var ipucuD = p.querySelector('.kd-ipucu-dug'); if (ipucuD) ipucuD.remove();
            var kart = p.querySelector('.kd-kart'); kart.classList.add('secili'); kart.disabled = true;
            geri(p, true, d.aciklama);
            if (sahne && sahne.durak) sahne.durak(d.id, 'bitti', denenen);
            if (!kk.tekrar) DO.efekt.dogru();
            dug = devamDug(p, d);
          });
        }
      };

      /* Okuma durağı: harfler sahnenin üstünde sağdan sola dizilir, panelde yalnız söz ve düğmeler durur.
         Yanlış okuma puanlanmaz; "Bir daha" kârinin okuyuşunu çalar, sonuç cevap olarak kaydedilir ki hocanın raporuna düşsün. */
      Kur.okuma = function (d) {
        var p = panel(d), k = d.kip || 'birlikte', sira = 0, dinlenen = {}, bitti_ = false, dug = null;
        // d.karisik: sıra ve kartların yeri her açılışta değişir, çocuk sırayı değil harfi öğrenir. Canlı derste herkeste aynıdır.
        function karis(a, ad) { return d.karisik ? ctx.karistir(a.slice(), ad + d.id) : a; }
        var hepsi = d.parcalar.map(function (x, i) { return i; }), adim = d.adim || 1;
        var liste = karis(d.sira || hepsi, 'oku'), tahta = k === 'av' ? karis(d.tahta, 'tahta') : null;
        var goster = k === 'kulak' ? karis(hepsi, 'kart') : k === 'av' ? tahta : k === 'nokta' ? [] : liste;
        var satir = el('div', { class: 'kd-okuma-satir kip-' + k + (d.boyut ? ' boy-' + d.boyut : ''), dir: 'rtl', lang: 'ar', style: 'top:' + (d.y || 400) + 'px' });
        var harfler = goster.map(function (pi, n) {
          return satir.appendChild(el('button', { class: 'kd-harf', type: 'button', 'aria-label': d.parcalar[pi].ad, disabled: k !== 'kulak' || null, text: d.parcalar[pi].m,
            onclick: function () { if (bitti_) return; if (k === 'kulak') hamle('kulak', { i: pi, h: liste[sira] }); else if (k === 'av') hamle('avla', { n: n, r: sira }); } }));
        });
        if (k === 'av') { satir.classList.add('kip-kulak'); harfler.forEach(function (h) { h.disabled = false; }); }
        sahneKat.appendChild(satir);
        var durum = el('p', { class: 'kd-durum' }), dugmeler = el('div', { class: 'kd-okuma-dug' });
        p.appendChild(durum); p.appendChild(dugmeler);
        function isaretle() {
          harfler.forEach(function (h, n) {
            if (k === 'kulak' || k === 'av') return;
            h.classList.toggle('simdi', n >= sira && n < sira + adim && !bitti_); h.classList.toggle('tamam', n < sira || bitti_);
          });
        }
        function bitir_(metin) {
          bitti_ = true; parcaDur(); clearTimeout(okumaSayac); isaretle(); dugmeler.innerHTML = '';
          durum.textContent = metin || d.sonMetin || 'Maşallah!';
          if (sahne && sahne.durak) sahne.durak(d.id, 'bitti');
          if (k === 'birlikte' && !takipci() && !izleyen()) dugmeler.appendChild(el('button', { class: 'dug ikincil', type: 'button', text: 'Bir daha okuyalım', onclick: function () { hamle('okubas', {}); } }));
          if (!izleyen()) dug = devamDug(dugmeler, d, d.dugme);
          else durakBitir(d, { okuma: Object.keys(dinlenen).length });
        }
        /* birlikte: kâri okur, çocuğa kendi süresi kadar boşluk bırakılır, sıradaki harfe geçilir */
        function birlikte() {
          if (bitti_) return;
          var o = d.parcalar[liste[sira]], bas = performance.now();
          isaretle(); durum.textContent = d.dinleMetin || 'Dinle…';
          parcaCal(o.dinle, function () {
            if (bitti_ || !acik || acik.d !== d) return;
            var sure = performance.now() - bas;
            durum.textContent = d.senMetin || 'Sen söyle!';
            harfler[sira].classList.add('sen');
            okumaSayac = setTimeout(function () {
              harfler[sira].classList.remove('sen');
              sira++;
              if (sira >= liste.length) bitir_(); else birlikte();
            }, Math.max(d.bekle || 1800, sure + 900));
          });
        }
        /* tek: çocuk okur. Kendi başına derste kendisi ilerler, canlı derste hoca dinleyip ilerletir. */
        function tek() {
          isaretle(); dugmeler.innerHTML = '';
          var o = d.parcalar[liste[sira]], canli = tekEkran();
          durum.textContent = canli && !hoca ? 'Yüksek sesle oku, hocan dinliyor.' : hoca ? 'Sıradaki: ' + (adim > 1 ? 'parlayan harfler' : o.ad) : (d.senMetin || 'Yüksek sesle oku.');
          if (canli && !hoca) return;
          var kutu = canli ? el('div', { class: 'kd-hoca kd-okuma-hoca' }) : dugmeler;
          kutu.appendChild(el('button', { class: 'dug ikincil', type: 'button', text: hoca ? 'Bir daha' : 'Hâfızı dinle', onclick: function () { kontrol('okunan', { d: d.i, i: sira, s: 0 }); } }));
          kutu.appendChild(el('button', { class: 'dug ana', type: 'button', text: hoca ? 'Tamam' : 'Okudum', onclick: function () { kontrol('okunan', { d: d.i, i: sira, s: 1 }); } }));
          if (canli) dugmeler.appendChild(kutu);
        }
        function kulak(yeni) {
          var o = d.parcalar[liste[sira]];
          durum.textContent = d.dinleMetin || 'Dinle ve dokun.';
          if (yeni) { dugmeler.innerHTML = ''; if (!izleyen()) dugmeler.appendChild(el('button', { class: 'dug ikincil', type: 'button', text: 'Bir daha dinle', onclick: function () { kulak(false); } })); }
          parcaCal(o.dinle);
        }
        /* av: kâri harfi okur, çocuk tahtadaki bütün örneklerini bulur */
        function avKalan() { return harfler.filter(function (h, n) { return tahta[n] === liste[sira] && !h.classList.contains('bulundu'); }).length; }
        function avTur(yeni) {
          var o = d.parcalar[liste[sira]];
          durum.textContent = o.ad + ': ' + avKalan() + ' tane bul.';
          if (yeni) { dugmeler.innerHTML = ''; if (!izleyen()) dugmeler.appendChild(el('button', { class: 'dug ikincil', type: 'button', text: 'Bir daha dinle', onclick: function () { parcaCal(d.parcalar[liste[sira]].dinle); } })); parcaCal(o.dinle); }
        }
        ctx.eylemTanimla('avla', function (v, kk) {
          if (bitti_ || v.r !== sira) return;
          var h = harfler[v.n], dogru = tahta[v.n] === liste[sira], o = d.parcalar[liste[sira]];
          if (!h || h.classList.contains('bulundu')) return;
          acik.deneme++;
          if (!kk.tekrar) (dogru ? DO.efekt.dogru : DO.efekt.yanlis)();
          if (!dogru) { h.classList.add('yanlis'); setTimeout(function () { h.classList.remove('yanlis'); }, 500); durum.textContent = (d.parcalar[tahta[v.n]] || {}).ad + ' değil. ' + o.ad + ' harfini bul.'; return; }
          h.classList.add('bulundu');
          if (avKalan()) { durum.textContent = o.ad + ': ' + avKalan() + ' tane kaldı.'; return; }
          if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + '-' + sira, ad: o.ad, yanit: 'Hepsini buldu', dogru: acik.deneme <= harfler.filter(function (x, n) { return tahta[n] === liste[sira]; }).length, puan: 0, max: 0, deneme: acik.deneme, etkilesim: 'choice' });
          sira++; acik.deneme = 0;
          if (sira >= liste.length) { bitir_(); return; }
          harfler.forEach(function (x) { x.classList.remove('bulundu'); });
          okumaSayac = setTimeout(function () { avTur(true); }, 700);
        });
        /* ayir: kâri okur, çocuk iki kümeden birini seçer */
        function ayirTur() {
          var o = d.parcalar[liste[sira]];
          isaretle(); durum.textContent = d.dinleMetin || 'Dinle ve seç.'; dugmeler.innerHTML = '';
          if (!izleyen()) {
            d.kumeler.forEach(function (m, i) { dugmeler.appendChild(el('button', { class: 'dug ana', type: 'button', text: m, onclick: function () { hamle('kumele', { i: i, s: sira }); } })); });
            dugmeler.appendChild(el('button', { class: 'dug ikincil', type: 'button', text: 'Bir daha dinle', onclick: function () { parcaCal(d.parcalar[liste[sira]].dinle); } }));
          }
          parcaCal(o.dinle);
        }
        ctx.eylemTanimla('kumele', function (v, kk) {
          if (bitti_ || v.s !== sira) return;
          var o = d.parcalar[liste[sira]], dogru = o.kume === v.i;
          acik.deneme++;
          if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + '-' + sira, ad: o.ad, yanit: d.kumeler[v.i], dogru: dogru, dogruYanit: d.kumeler[o.kume], puan: 0, max: 0, deneme: acik.deneme, etkilesim: 'choice' });
          if (!kk.tekrar) (dogru ? DO.efekt.dogru : DO.efekt.yanlis)();
          if (!dogru) { durum.textContent = d.yanlis || 'Bir daha dinle.'; if (!kk.tekrar) parcaCal(o.dinle); return; }
          sira++; acik.deneme = 0;
          if (sira >= liste.length) { bitir_(); return; }
          okumaSayac = setTimeout(ayirTur, 500);
        });
        /* nokta: gövde verilir, çocuk noktaları doğru yere koyar, harf kurulunca kâri okur */
        var nkKok = null, nkSay = 0;
        function noktaTur() {
          var o = d.parcalar[liste[sira]];
          satir.innerHTML = ''; nkSay = 0;
          nkKok = el('div', { class: 'kd-nk', lang: 'ar', dir: 'rtl' }, [el('span', { class: 'kd-nk-govde', text: o.govde })]);
          (d.yerler || ['ust', 'alt']).forEach(function (z) {
            nkKok.appendChild(el('button', { class: 'kd-nk-yer ' + z, type: 'button', 'aria-label': z === 'ust' ? 'Üstüne' : z === 'alt' ? 'Altına' : 'İçine', onclick: function () { hamle('noktala', { z: z, s: sira }); } }));
          });
          satir.appendChild(nkKok); satir.classList.add('kip-kulak');
          dugmeler.innerHTML = '';
          durum.textContent = o.ad + ' yap: noktayı koy.';
          if (o.nokta[1] === 0) { durum.textContent = o.ad + ': bu harfte nokta yok.'; dugmeler.appendChild(el('button', { class: 'dug ana', type: 'button', text: 'Noktası yok', onclick: function () { hamle('noktala', { z: 'yok', s: sira }); } })); }
        }
        ctx.eylemTanimla('noktala', function (v, kk) {
          if (bitti_ || v.s !== sira || !nkKok) return;
          var o = d.parcalar[liste[sira]], dogru = v.z === (o.nokta[1] ? o.nokta[0] : 'yok');
          acik.deneme++;
          if (!dogru) {
            if (!kk.tekrar) DO.efekt.yanlis();
            durum.textContent = d.yanlis || 'Oraya değil. Bir daha bak.'; nkKok.classList.add('titre'); setTimeout(function () { if (nkKok) nkKok.classList.remove('titre'); }, 400); return;
          }
          if (v.z !== 'yok') { nkSay++; nkKok.querySelector('.kd-nk-yer.' + v.z).appendChild(el('i')); }
          if (nkSay < o.nokta[1]) { if (!kk.tekrar && DO.efekt.tik) DO.efekt.tik(); durum.textContent = 'Bir nokta daha.'; return; }
          if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + '-' + sira, ad: o.ad, yanit: 'Harfi kurdu', dogru: acik.deneme === Math.max(1, o.nokta[1]), puan: 0, max: 0, deneme: acik.deneme, etkilesim: 'performance' });
          if (!kk.tekrar) DO.efekt.dogru();
          nkKok.innerHTML = ''; nkKok.appendChild(el('span', { class: 'kd-nk-govde tamam', text: o.m }));
          durum.textContent = 'İşte ' + o.ad + '!';
          sira++; acik.deneme = 0;
          parcaCal(o.dinle, function () {
            if (!acik || acik.d !== d) return;
            okumaSayac = setTimeout(function () { if (sira >= liste.length) bitir_(); else noktaTur(); }, 500);
          });
        });
        ctx.eylemTanimla('okubas', function () { bitti_ = false; sira = 0; dugmeler.innerHTML = ''; harfler.forEach(function (h) { h.classList.remove('tamam', 'simdi', 'sen'); }); birlikte(); });
        ctx.eylemTanimla('okunan', function (v, kk) {
          if (v.d !== d.i || v.i !== sira || bitti_) return;
          var o = d.parcalar[liste[sira]];
          if (!v.s) {
            dinlenen[sira] = (dinlenen[sira] || 0) + 1;
            if (!kk.tekrar) (function cal(n) { if (n < sira + adim && n < liste.length && acik && acik.d === d) parcaCal(d.parcalar[liste[n]].dinle, function () { cal(n + 1); }); })(sira);
            return;
          }
          if (!hoca && !kk.tekrar) ctx.cevap({ oge: 'durak-' + d.id + '-' + sira, ad: o.ad, yanit: dinlenen[sira] ? 'Bir daha ile okudu' : 'Kendi okudu', dogru: !dinlenen[sira], puan: 0, max: 0, deneme: (dinlenen[sira] || 0) + 1, etkilesim: 'performance' });
          sira += adim;
          if (sira >= liste.length) bitir_(); else tek();
        });
        ctx.eylemTanimla('kulak', function (v, kk) {
          if (bitti_ || v.h !== liste[sira]) return;
          var dogru = v.i === v.h, h = harfler[goster.indexOf(v.i)], o = d.parcalar[v.h];
          acik.deneme++;
          if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + '-' + sira, ad: o.ad, yanit: d.parcalar[v.i].ad, dogru: dogru, dogruYanit: o.ad, puan: 0, max: 0, deneme: acik.deneme, etkilesim: 'choice' });
          if (!kk.tekrar) (dogru ? DO.efekt.dogru : DO.efekt.yanlis)();
          if (!dogru) { h.classList.add('yanlis'); setTimeout(function () { h.classList.remove('yanlis'); }, 500); if (!kk.tekrar) kulak(false); durum.textContent = d.yanlis || 'Bir daha dinle.'; return; }
          h.classList.add('tamam'); parcaDur();
          setTimeout(function () { h.classList.remove('tamam'); }, 900);
          sira++; acik.deneme = 0;
          if (sira >= liste.length) { bitir_(); return; }
          okumaSayac = setTimeout(function () { kulak(false); }, 1000);
        });
        if (k === 'birlikte') birlikte();
        else if (k === 'kulak') kulak(true);
        else if (k === 'av') avTur(true);
        else if (k === 'ayir') ayirTur();
        else if (k === 'nokta') noktaTur();
        else tek();
      };

      /* Anlatım bitti: sıradaki ekran (pul makinesi, ders özeti) açıkça gösterilir. Canlı derste Hocamızın
         ekranı birkaç saniye sonra kendiliğinden geçer; dersin sonuna gelinmeden oturum kapanmasın. */
      var sonrakiAd = (function () {
        var n = ctx.oynatici.sira[ctx.oynatici.i + 1];
        return !n ? 'Devam et' : n.tur === 'pul' ? 'Pul makinesine geç' : n.tur === 'kapanis' ? 'Ders özetine geç' : 'Devam et';
      })();
      var bitisSayac = null;
      function bitir() {
        bitti = true; kok.classList.add('bitti');
        var puan = duraklar.reduce(function (s, d) { return s + (d.puan || 0); }, 0);
        ctx.tamamla({ puan: puan });
        var eski = kok.querySelector('.kd-son'); if (eski) eski.remove();
        clearInterval(bitisSayac);
        if (ctx.takipte()) {
          kok.appendChild(el('div', { class: 'kd-son kd-son-bekle', role: 'status' }, [el('b', { text: 'Ders bitti!' }), el('span', { text: sonrakiAd === 'Pul makinesine geç' ? 'Hocan şimdi pul makinesini açacak.' : 'Hocan sıradaki ekranı açacak.' })]));
          return;
        }
        var alt = el('small'), dug = el('button', { class: 'kd-basla kd-son', type: 'button', onclick: function () { clearInterval(bitisSayac); ctx.ileri(); } }, [el('b', { text: 'Ders tamamlandı' }), el('span', { text: sonrakiAd }), alt]);
        kok.appendChild(dug);
        if (izleyen()) {
          var kalan = 6;
          alt.textContent = kalan + ' saniye sonra kendiliğinden geçilecek';
          bitisSayac = setInterval(function () {
            if (!yasiyor || !dug.isConnected) { clearInterval(bitisSayac); return; }
            kalan--;
            if (kalan <= 0) { clearInterval(bitisSayac); ctx.ileri(); return; }
            alt.textContent = kalan + ' saniye sonra kendiliğinden geçilecek';
          }, 1000);
          kok.appendChild(el('button', { class: 'kd-son-bekle-dug', type: 'button', text: 'Bekle', onclick: function () { clearInterval(bitisSayac); alt.textContent = ''; this.remove(); } }));
        }
      }

      /* ——— oynat · durdur · sar: canlı derste herkesin saati birlikte yürür ——— */
      // Geç gelene yeniden oynatılan geçmiş (tekrar) yalnız bayrakları kurar; yeri "saat" taşır
      ctx.eylemTanimla('oynat', function (x, kk) {
        basladi();
        if (kk.kim && kk.kim.rol === 'ogretmen' && hoca) hocaBasladi = true;
        if (kk.tekrar || acik) return;
        t = x.t; basla(); ciz();
      });
      ctx.eylemTanimla('durdur', function (x, kk) { if (kk.tekrar) return; t = x.t; dur(); ciz(); });
      /* Hocamız serbestçe sarar, durakta da: ileri atladığı duraklar geçilmiş sayılır, açık durağın gerisine
         sararsa durak kapanır ve anlatım oraya gelince yeniden açılır. Öğrenci yalnız dinlediği yere kadar sarar. */
      ctx.eylemTanimla('sar', function (x, kk) {
        var serbest = serbestSar || (kk.kim && kk.kim.rol === 'ogretmen');
        var hedef = sinirla(x.t, 0, serbest ? b.sure : enUzak);
        if (acik && !serbest) return;
        if (acik && !kk.tekrar && hedef <= acik.d.zaman + 0.05) durakBirak(acik.d);
        if (serbest) duraklar.forEach(function (d) {
          if (d.bitti || d.zaman >= hedef - 0.05) return;
          if (!hoca && !kk.tekrar && !biten[d.id]) durakKaydet(d, { atlandi: 1 });
          durakKapandi(d, kk.tekrar);
        });
        if (kk.tekrar) return;
        t = hedef; enUzak = Math.max(enUzak, t);
        try { ses.currentTime = t; } catch (e) { /* yüklenmedi */ }
        son = performance.now(); ciz();
      });
      serit.addEventListener('click', function (e) {
        if (acik && !serbestSar) return;
        var r = serit.getBoundingClientRect();
        kontrol('sar', { t: (e.clientX - r.left) / r.width * b.sure });
      });

      var baslaYazi = el('span', { text: 'Hazırlanıyor…' });
      var baslaDug = el('button', { class: 'kd-basla', type: 'button', disabled: true, onclick: function () { kontrol('oynat', { t: t }); } }, [
        el('b', { text: b.baslik }), baslaYazi
      ]);
      kok.appendChild(baslaDug);
      ses.addEventListener('ended', function () { if (t >= b.sure - 0.6) t = b.sure; });

      function olcuGuncelle() { tuval.olcekle(kok.getBoundingClientRect().width); }
      var gozcu = window.ResizeObserver ? new ResizeObserver(olcuGuncelle) : null;
      if (gozcu) gozcu.observe(kok);
      window.addEventListener('resize', olcuGuncelle);

      function hareketGoster() {
        kok.classList.add('hareket');
        clearTimeout(hareketSayac);
        hareketSayac = setTimeout(function () { kok.classList.remove('hareket'); }, 2400);
      }
      var hareketSayac = null;
      kok.addEventListener('pointermove', hareketGoster);
      kok.addEventListener('pointerdown', hareketGoster);

      function kur() {
        if (!DO.KodDersSahne[b.sahne]) { console.error('kodDers: sahne yok', b.sahne); return; }
        sahne = DO.KodDersSahne[b.sahne](api);
        olcuGuncelle();
        Promise.resolve(sahne.hazir).then(function () {
          if (!yasiyor) return;
          sahneHazir = true;
          baslaYazi.textContent = bitti ? 'Yeniden dinle' : 'Derse başla';
          baslaDug.disabled = false;
          sonRol = null; rolYaz();
          ciz();
        });
      }
      api.yukleniyor = function (oran) { baslaYazi.textContent = 'Hazırlanıyor… %' + Math.round(oran * 100); };
      if (DO.KodDersSahne[b.sahne]) kur();
      else {
        var s = document.createElement('script');
        s.onerror = function () { baslaYazi.textContent = 'Ders açılamadı. Sayfayı yenileyin.'; };
        s.src = ctx.yol(b.sahneDosya); s.onload = function () { if (yasiyor) kur(); }; document.body.appendChild(s);
      }
      kare = requestAnimationFrame(dongu);
      O.temizlikler.push(function () {
        yasiyor = false; cancelAnimationFrame(kare); ses.pause(); ses.src = ''; ctx.altyazi(''); parcaDur(); clearTimeout(okumaSayac);
        clearTimeout(hareketSayac); if (gozcu) gozcu.disconnect();
        window.removeEventListener('resize', olcuGuncelle);
        tuval.temizle();
        clearTimeout(otoSayac); clearInterval(bitisSayac);
      });
      return { yansiAl: yansiAl, ogretmenAraci: ogretmenAraci };
    }
  };

  DO.kodSade = function (s) { return String(s).toLocaleLowerCase('tr').replace(/[^a-zçğıöşüâîû0-9]/g, ''); };
})();
