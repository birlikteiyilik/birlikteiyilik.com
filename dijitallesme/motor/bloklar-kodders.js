/* Ders Odası — kodDers: tek akışlı ders.
   Tek anlatıcı kaydı dersin saatidir. Sahne, boyalı katmanların (kd-tuval.js) ve üstündeki yazıların
   o saate bağlı saf fonksiyonudur: sarınca aynı kare gelir. Saat bir durağa gelince ses durur, etkinlik
   aynı sahnenin içinde açılır; öğrenci bitirince anlatım kaldığı yerden sürer. Mp4 yoktur.

   Ders verisi : tur 'kodDers', ses, sure, k [[kelime, bas, son]…], cumleler [{m, bas, son}…],
                 duraklar [{id, zaman, tur, …}…], sahneDosya
   Sahne dosyası DO.KodDersSahne[blok.sahne] = function (api) {
                   return { hazir: Promise, ciz(t, a), durak(id, olay, veri), tutamac(id, deger), tutDeger(id, x, y) }; }
                 t ders saati, a ortam saati: durakta t durur, a yürür, sahne canlı kalır.
   Atlama     : atla [[bas, son]…] saniye, sıralı ve çakışmasız. Saat [bas, son) içine düşünce son'a atlar; ses dosyası
                 yeniden kesilmeden anlatımdan cümle çıkarılabilir. Aralığın içinde durak olmaz.
   Durak türleri: secim · kaydir · yerlestir · olmasa · eslestir · dizme · dokun · okuma · sira. Çocuğa yazı yazdırılmaz.
   sira       : "söyle" durağı, anlatım durur, çocuk yüksek sesle söyler, hoca (kendi başına derste çocuk) devam ettirir.
                {id, tur:'sira', zaman, sonra, etiket, soru}; sonra verilirse devam saniyesi odur (gömülü sessizlik atlanır).
                Cevap ve puan kaydı yoktur.
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

  /* Durak özellikleri (veri şeması) ve sahneye giden olaylar; sahne.durak(id, olay, veri) alır, ayrıntı skill'deki motor.md'de.
     dokun   hepsi: true → bitiren kart(lar) her varlık denenene kadar kapalı, panelde "n / N"; olay 'ilerleme' {n, N}, 'hepsi'
             secenekler [metin], dogru (sıra), geri [metin], aciklama → tek kart yerine şıklar (hepsi varsa keşiften sonra); olay 'bitti'
     olmasa  hepsi: true → her doğru cevapta nokta ✓ ve kapalı, olay 'dondur' (varlık sırası), kalanlar açılır; Devam hepsi bitince; puan öğe başına ilk denemeden
     dizme   tut: true, torbaG, torbaH, tutYazi, toplaDugme, torbaYazi → torba tutulup sallanır; olaylar 'tut' {dx, dy, enerji}, 'birak', 'topla', 'hazir'
     yerlestir canli [{ad, gorsel, x, y, g|h, sol?}] + yuvalar[i] {x, y, g, h, ad?, ix?, iy?} → sahnede resim sürükleme; olaylar 'tut' i, 'birak' i, 'dogru' i
     secim   duzen: 'orta' → kararan sahne, ortada kart (tepsi yok)
     her tür tepsi, ust → tepsi yüksekliği ve sahnenin yukarı kayması (≤ 200 tepsi sıkı düzene geçer)
     api     sfx(dosya, {dongu, ses}) → {dur(), ses(v), bitti()}; sfxHepsiniDur(); acikDurakIlerleme() → {n, N} | null */
  var YER = { kaydir: [150, 30], sira: [176, 0], yerlestir: [240, 40], olmasa: [320, 130], dizme: [230, 150], dokun: [262, 0], secim: [320, 0], serit: [380, 0], okuma: [206, 0] };
  /* Durağın yerleşimi: yer 'alt' (tepsi + sahne kayması), 'tam' (sahnenin kendisinde) ya da 'orta' (kararan sahne, ortada kart) */
  function yerHesapla(d) {
    if (d.duzen === 'defter' || d.tur === 'eslestir') return { yer: 'tam', tepsi: 0, ust: 0 };
    if (d.tur === 'secim' && d.duzen === 'orta') return { yer: 'orta', tepsi: 0, ust: 0 };
    var y = YER[d.duzen === 'serit' ? 'serit' : d.tur] || [300, 0], tepsi = d.tepsi || y[0];
    return { yer: 'alt', tepsi: tepsi, ust: Math.min(d.ust != null ? d.ust : y[1], tepsi) };   // sahnenin altı tepsinin arkasında kalır, boşluk açılmaz
  }

  B.kodDers = {
    // Canlı derste tek ekrandır; duraklar zaten kişiseldir, "herkes kendi oynasın" seçeneği sunulmaz
    zorunlu: true, xapiTur: 'media', canli: 'ortak', YER: YER, yerHesapla: yerHesapla,
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
      function tekEkran() { return ctx.ortak(); }
      function takipci() { return !hoca && tekEkran(); }
      function izleyen() { return hoca && tekEkran(); }
      // Sunum kipi (birlikteiyilik.com/dijitallesme): sunan kişi hoca gibi serbestçe sarar, durakta da
      var serbestSar = hoca || !!window.DO_SUNUM;
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
         Tür başına YER [tepsi yüksekliği, sahnenin yukarı kayması]: durağın önemli kısmı tepsinin üstünde kalır.
         Durak verisinde tepsi ve ust ile değiştirilebilir (her tür için). Defter ve eşleştirme sahnenin kendisinde açılır.
         secim + duzen:'orta' tepsi açmaz: sahne kararır, ortada kâğıt bir kart durur. */
      function yerAyarla(d) {
        var y = yerHesapla(d);
        kok.dataset.yer = y.yer;
        kok.removeAttribute('data-ince');
        if (y.yer === 'tam') return;
        kok.style.setProperty('--kd-tepsi', y.tepsi + 'px'); kok.style.setProperty('--kd-ust', y.ust + 'px');
        // Alçak tepsilerde (≤ 200) panel sıkı düzene geçer: etiket ve soru aynı satırda, geri bildirim düğmenin yanında
        if (y.yer === 'alt' && y.tepsi <= 200) kok.dataset.ince = '1';
      }
      function izleKoy(v) { katman.classList.toggle('izle', v); sahneKat.classList.toggle('izle', v); }
      // Küçük ekranda tepsi sahnenin altına iner; tepsi açılıp kapandıkça ve yüksekliği değiştikçe yerleşim yeniden hesaplanır.
      function tepsiOlc() { if (O && O.olcekle) O.olcekle(); }
      var tepsiGozcu = window.ResizeObserver ? new ResizeObserver(tepsiOlc) : null;
      if (tepsiGozcu) { tepsiGozcu.observe(katman); ctx.oynatici.temizlikler.push(function () { tepsiGozcu.disconnect(); setTimeout(tepsiOlc, 0); }); }
      // Büyük ekranda katmanın boyu değişmez: durağın açılıp kapanması ve panelin boyu ayrıca izlenir.
      if (window.MutationObserver) {
        var tepsiIzle = new MutationObserver(function () { var p = katman.querySelector(':scope > .kd-panel'); if (p && tepsiGozcu) tepsiGozcu.observe(p); tepsiOlc(); });
        tepsiIzle.observe(kok, { attributes: true, attributeFilter: ['class', 'data-yer'] }); tepsiIzle.observe(katman, { childList: true });
        ctx.oynatici.temizlikler.push(function () { tepsiIzle.disconnect(); });
      }

      var ses = new Audio(ctx.yol(b.ses)); ses.preload = 'auto';
      var duraklar = (b.duraklar || []).map(function (d, i) { return Object.assign({ i: i, bitti: false, puan: 0 }, d); });
      duraklar.forEach(function (d) {
        serit.appendChild(el('b', { style: 'left:' + (d.zaman / b.sure * 100) + '%' }));
      });
      var t = 0, enUzak = 0, oynuyor = false, acik = null, bitti = false, son = 0, kare = null, yasiyor = true, notlar = {};
      /* atla: [[bas, son]…] aralıklarında saat son'a sıçrar (anlatımdan çıkarılan cümleler) */
      var atlaAr = (b.atla || []).filter(function (r) { return r && r.length === 2 && r[1] > r[0]; }).sort(function (x, y) { return x[0] - y[0]; });
      function atlaSon(x) { atlaAr.forEach(function (r) { if (x >= r[0] && x < r[1]) x = r[1]; }); return x; }
      var sahneHazir = false, onceki = 0, tutamac = null, notResim = {};
      var biten = {}, sinif = {}, bekleyen = [], hocaBasladi = false, sonSaat = 0, otoSayac = null, perdeDurdu = false, okumaSayac = null;
      /* Hazırlık: ders, sahne (görseller) ve anlatım sesi birlikte hazır olunca başlar. Canlı derste her öğrenci
         hazır olduğunu Hocamıza bildirir; Hocamız herkes hazır olmadan dersi başlatmaz. */
      var sesHazir = false, sesSayac = null, hazirYapildi = false, gorselOran = null, durguCiz = true;
      var hazirlar = {}, bekleBas = 0, hazirIsteSon = -1e9, hazirSonOran = -1, bekleyenOynat = null, bekleyenSaat = null;
      var BEKLEME_SINIRI = 25000, SES_SINIRI = 5000;
      // Canlı derste öğrenci, daha önce bitirdiği dersi de sınıfla birlikte yeniden yapar
      if (ctx.onceki && ctx.onceki.tamam) { bitti = true; if (!takipci()) { enUzak = b.sure; duraklar.forEach(function (d) { d.bitti = true; }); } }

      function sesAcik() { return O.ayar.anlatim !== false && ctx.sesBende(); }
      /* Kâri parçası: anlatımdan ayrı kısa kayıt, aynı anda tek parça çalar. Kur'ân sesinin hızı değiştirilmez. */
      var parca = null, parcaSayac = null, parcaNesil = 0, parcaHata = null;
      function parcaDur() {
        parcaNesil++; clearTimeout(parcaSayac);
        if (parca) { parca.onended = null; parca.onerror = null; parca.pause(); parca = null; }
        if (parcaHata) { parcaHata.remove(); parcaHata = null; }
      }
      function parcaCal(dosya, bitince) {
        parcaDur();
        var nesil = parcaNesil, bitti = false;
        function gecerli() { return yasiyor && nesil === parcaNesil && !bitti; }
        function son() { if (!gecerli()) return; bitti = true; parca = null; if (bitince) bitince(); }
        function hata() {
          if (!gecerli() || parcaHata) return;
          if (parca) { parca.onended = null; parca.onerror = null; parca.pause(); parca = null; }
          parcaHata = el('div', { class: 'kd-ses-hata', role: 'alert' }, [
            el('span', { text: 'Ses açılamadı' }),
            el('button', { type: 'button', text: 'Yeniden dene', onclick: function () { parcaCal(dosya, bitince); } })
          ]);
          kok.appendChild(parcaHata);
        }
        // Bilinçli sessiz mod süreyi yürütür; eksik dosya ve oynatma hatası yürütmez.
        if (!sesAcik()) { parcaSayac = setTimeout(son, 900); return; }
        if (!dosya) { hata(); return; }
        var a = new Audio(ctx.yol(dosya)); parca = a;
        a.onended = son; a.onerror = hata;
        try { var p = a.play(); if (p && p.catch) p.catch(hata); } catch (_) { hata(); }
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

      /* ——— sahne için durak ilerlemesi ve ses efektleri ———
         api.acikDurakIlerleme(): açık durak "hepsini dene" ise {n, N}, değilse null (sahne de 'ilerleme' olayını alır).
         api.sfx(dosya, {dongu, ses}): kısa ses efekti; {dur(), ses(v), bitti()} tutamacı döner. Katman katman çalınabilir.
         Kapalı ses (anlatım ayarı, canlı derste "ses hocanın cihazında", ♫ efekt düğmesi) sessiz çalar; ders duraklatılınca
         durur; durak kapanınca, sarılınca ve ders kapanınca kesilir. Dosya yoksa ses çıkmaz, uyarı çıkmaz. */
      var sfxler = [];
      function sfxSesli() { return sesAcik() && DO.sesAcik !== false; }
      function sfxBitir(h) {
        if (h.bitti) return;
        h.bitti = true;
        var i = sfxler.indexOf(h); if (i >= 0) sfxler.splice(i, 1);
        if (h.a) { h.a.onended = null; h.a.onerror = null; try { h.a.pause(); } catch (e) { /* kapalı */ } }
      }
      function sfxHepsiniDur() { sfxler.slice().forEach(sfxBitir); }
      function sfxCal(h) {
        try { var p = h.a.play(); if (p && p.catch) p.catch(function () { sfxBitir(h); }); } catch (e) { sfxBitir(h); }
      }
      function sfxEsitle() {
        var dur_ = !!ctx.oynatici.duraklatildi;
        sfxler.slice().forEach(function (h) {
          h.a.muted = !sfxSesli();
          if (dur_ && !h.durdu) { h.durdu = true; h.a.pause(); }
          else if (!dur_ && h.durdu) { h.durdu = false; sfxCal(h); }
        });
      }
      api.sfx = function (dosya, sec) {
        sec = sec || {};
        var h = { a: null, ses: sec.ses == null ? 1 : sinirla(+sec.ses || 0, 0, 1), bitti: false, durdu: false };
        var tutamaci = {
          dur: function () { sfxBitir(h); },
          ses: function (v) { h.ses = sinirla(+v || 0, 0, 1); if (h.a) h.a.volume = h.ses; },
          bitti: function () { return h.bitti; }
        };
        if (!dosya || !yasiyor) { h.bitti = true; return tutamaci; }
        try {
          var a = new Audio(ctx.yol(dosya)); h.a = a;
          a.loop = !!sec.dongu; a.volume = h.ses; a.muted = !sfxSesli();
          a.onended = function () { if (!a.loop) sfxBitir(h); };
          a.onerror = function () { sfxBitir(h); };
        } catch (e) { h.bitti = true; return tutamaci; }
        sfxler.push(h);
        if (ctx.oynatici.duraklatildi) h.durdu = true; else sfxCal(h);
        return tutamaci;
      };
      api.sfxHepsiniDur = sfxHepsiniDur;
      api.acikDurakIlerleme = function () { return acik && acik.ilerleme ? { n: acik.ilerleme.n, N: acik.ilerleme.N } : null; };
      var sfxSayac = setInterval(sfxEsitle, 150);
      ctx.oynatici.temizlikler.push(function () { clearInterval(sfxSayac); sfxHepsiniDur(); });
      // Durağın "n / N" ilerlemesi: panelde sayaç, sahnede 'ilerleme' olayı
      function ilerlet(n, N) {
        if (acik) acik.ilerleme = { n: n, N: N };
        if (sahne && sahne.durak && acik) sahne.durak(acik.d.id, 'ilerleme', { n: n, N: N });
      }

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
        if (!hazirMi()) return;                // sahne ve ses hazır olmadan anlatım saati yürümez (ekranda çizili bir şey yokken ders akmaz)
        if (t >= b.sure) t = 0;
        t = atlaSon(t);
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
        if (!hazirYapildi) yuklemeYaz();
        else if (baslaDug.parentNode && izleyen()) baslaYaz();
        if (oynuyor) {
          var fark = (simdi - son) / 1000; son = simdi;
          t += Math.min(fark, 0.25);
          // Ses çalıyorsa saat sesten gelir; açılmadıysa kendi başına yürür
          if (!ses.paused && !ses.muted && Math.abs(ses.currentTime - t) > 0.2) t = ses.currentTime;
          var atlanan = atlaSon(t);
          if (atlanan !== t) { t = Math.min(atlanan, b.sure); try { ses.currentTime = t; } catch (e) { /* yüklenmedi */ } }
          enUzak = Math.max(enUzak, t);
          var d = duraklar.find(function (x) { return !x.bitti && t >= x.zaman; });
          if (d) { t = d.zaman; dur(); ac(d); }
          else if (t >= b.sure) { t = b.sure; dur(); bitir(); }
          ciz();
        }
        /* Ders başlamadan sahne oynamaz: ilk kare bir kez (ölçü değişince yeniden) durağan çizilir */
        var oynadi = kok.classList.contains('basladi') || !!acik;
        if (sahneHazir && (oynadi || durguCiz)) {
          durguCiz = false;
          sahne.ciz(t, oynadi ? simdi / 1000 : 0);
          if (tutamac && acik) tutamacKoy();
        }
      }

      /* ——— durak kabuğu ——— */
      function panel(d, baslik) {
        var p = el('div', { 'data-durak': d.id, class: 'kd-panel kd-' + d.tur + (d.duzen ? ' kd-duzen-' + d.duzen : '') + (d.ar ? ' kd-ar' : '') }, [
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
        Kur[d.tur](d); surukleErisim();
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
        if (d.tur === 'sira') return;      // söyle durağı cevap ve puan üretmez
        var a = acik && acik.d === d ? acik : null;
        ctx.kaydet('etkilesti', { id: 'durak-' + d.id, ad: d.etiket || d.id }, null, Object.assign({ durak: d.id, ipucu: a && a.ipucu ? 1 : 0, deneme: a ? a.deneme : 0 }, sonuc || {}));
      }
      function durakKabukKapat(d) {
        secimiBirak(); parcaDur(); clearTimeout(okumaSayac);
        kok.querySelectorAll('.kd-hayalet').forEach(function (e) { e.remove(); });
        katman.classList.remove('acik'); izleKoy(false); katman.innerHTML = ''; sahneKat.innerHTML = ''; acik = null; tutamac = null;
        kok.classList.remove('durakta'); kok.removeAttribute('data-yer');
        if (sahne && sahne.durak) sahne.durak(d.id, 'kapat');
        sfxHepsiniDur();
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
      function kapat(d, sonuc) { durakKaydet(d, sonuc); durakKapandi(d); donus(d); basla(); }
      // Durak kapanınca anlatım d.zaman'dan, söyle durağında (sonra varsa) gömülü sessizlikten sonra sürer
      function donus(d) {
        if (d.sonra != null && d.sonra > d.zaman && t <= d.zaman + 0.05) { t = Math.min(d.sonra, b.sure); enUzak = Math.max(enUzak, t); try { ses.currentTime = t; } catch (e) { /* yüklenmedi */ } }
      }
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
        gorunsun(e);
      }
      function devamDug(p, d, metin, tikla) {
        var dug = el('button', { class: 'dug ana kd-devam', type: 'button', text: metin || 'Devam et', onclick: tikla || function () { hamle('kapat', { d: d.i }); } });
        p.appendChild(dug);
        gorunsun(dug);
        return dug;
      }
      ctx.eylemTanimla('kapat', function (x) { durakBitir(duraklar[x.d]); });
      // Hocamız durağı herkes için kapatır; bitirmeyen öğrencide "atlandı" diye kaydedilir.
      // Okuyup bitiren (biten) ve söyle durağı (kayıt üretmez) atlandı sayılmaz.
      ctx.eylemTanimla('devam', function (x, kk) {
        var d = duraklar[x.d]; if (!d || d.bitti) return;
        if (!hoca && !biten[d.id] && !kk.tekrar && acik && acik.d === d) durakKaydet(d, { atlandi: 1 });
        durakKapandi(d, kk.tekrar);
        if (!kk.tekrar) { donus(d); basla(); }
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
        gorunsun(e);
      }
      /* Küçük ekranda tepsi kaydırılır; cevaptan sonra gelen yazı ve düğme tepsinin altında kalmasın.
         Yalnız gereken kadar kaydırılır, sayfa yerinden oynamaz. Tepsi küçültülmüş olabilir: kayma tepsi ölçeğinde hesaplanır. */
      function gorunsun(e) {
        requestAnimationFrame(function () {
          if (!e.isConnected) return;
          for (var k = e.parentElement; k && k !== kok; k = k.parentElement) {
            if (k.scrollHeight <= k.clientHeight + 1 || !/auto|scroll/.test(getComputedStyle(k).overflowY)) continue;
            // Düğme ya da bekleme notu gelince üstündeki açıklama da görünür kalır
            var g = e.parentElement.querySelector('.kd-geri-bildirim'), r = e.getBoundingClientRect();
            var bas = g ? Math.min(g.getBoundingClientRect().top, r.top) : r.top;
            var kr = k.getBoundingClientRect(), olcek = kr.height / k.offsetHeight || 1;
            var ust = Math.max(kr.top, 0), alt = Math.min(kr.bottom, innerHeight);
            if (r.bottom > alt) k.scrollTop += Math.min(r.bottom - alt + 8, bas - ust - 8) / olcek;
            else if (bas < ust) k.scrollTop -= (ust - bas + 8) / olcek;
            return;
          }
        });
      }
      function geriSil(p) { var e = p.querySelector('.kd-geri-bildirim'); if (e) e.remove(); }
      function secenekMetni(o) { return typeof o === 'string' ? o : o.m; }
      // Seçimde ikinci soru seçilen şıkka göre değişebilir (ör. kar tanesi ile Ay'ın hâlleri ayrı düzen gösterir)
      function ikinciGrup(d, k) { var o = d.secenekler[k]; return (o && o.ikinci) || d.ikinci; }
      // oge verilirse ilk deneme öğe başına sayılır (acik.ilk: ilk denemede bilinen öğe sayısı); verilmezse tüm durak için
      function olc(d, dogru, oge) {
        acik.deneme++;
        if (oge == null) { if (dogru && acik.deneme === 1 && !acik.ipucu && PUANLI[d.tur]) d.puan = 10; return; }
        var m = acik.ogeDeneme || (acik.ogeDeneme = {});
        m[oge] = (m[oge] || 0) + 1;
        if (dogru && m[oge] === 1 && !acik.ipucu && PUANLI[d.tur]) acik.ilk = (acik.ilk || 0) + 1;
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
        if (ad === 'topla') return 'Taşları torbaya topluyor';
        if (ad === 'dsec') return d.secenekler[v.i] != null ? (v.i === d.dogru ? '✓ ' : '✗ ') + secenekMetni(d.secenekler[v.i]) : '';
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
            var x = sinif[o.id]; if (!x || x.sk == null) return;
            var kart = Array.from(kartlar).find(function (e) { return +e.dataset.i === x.sk; }); if (!kart) return;
            var r = kart.querySelector('.kd-rozetler') || kart.appendChild(el('span', { class: 'kd-rozetler' }));
            r.appendChild(el('i', { text: o.ad }));
          });
        }
      }
      function otoDevam() {
        clearTimeout(otoSayac);
        if (!izleyen() || !acik) return;
        var liste = ogrenciler(), d = acik.d;
        if (d.tur === 'sira') return;       // söyleyeni hoca dinler; yalnız hoca devam ettirir
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
      ctx.eylemTanimla('saat', function (x) {
        if (hoca) return;
        if (takipci() && !hazirMi()) { bekleyenSaat = x; return; }   // sahne ve ses hazır olunca uygulanır
        saatUygula(x);
      });
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
        var xt = atlaSon(x.t);      // Hocamızın saati atlanan aralıktaysa sonuna alınır, saat düzeltmesi savaşmaz
        if (Math.abs(xt - t) > 0.8) { sfxHepsiniDur(); t = sinirla(xt, 0, b.sure); enUzak = Math.max(enUzak, t); try { ses.currentTime = t; } catch (e) { /* yüklenmedi */ } son = performance.now(); }
        if (x.o && !oynuyor && t < b.sure) basla(); else if (!x.o && oynuyor) dur();
        ciz();
      }
      // Hocamız sayfayı yenilediyse anlatımı öğrencinin kaldığı yerden alır
      function saatBenimse(v) {
        if (!izleyen() || hocaBasladi || !(v.t > 0.5) || !hazirMi()) return;   // hazır olunca rolYaz saati yeniden ister
        if (v.s) basladi();
        (v.b || []).forEach(function (i) { var d = duraklar[i]; if (d && !d.bitti) durakKapandi(d, true); });
        t = atlaSon(sinirla(v.t, 0, b.sure)); enUzak = Math.max(enUzak, t); try { ses.currentTime = t; } catch (e) { /* yüklenmedi */ }
        if (v.a >= 0 && duraklar[v.a] && !duraklar[v.a].bitti) { hocaBasladi = true; t = duraklar[v.a].zaman; ac(duraklar[v.a]); }
        else if (v.o) { hocaBasladi = true; basla(); }
        ciz();
      }
      ctx.dinle('durumIste', function () { if (izleyen() && hocaBasladi) saatGonder(); });
      ctx.dinle('katilim', function () {
        if (!izleyen()) return;
        // Sınıftan ayrılan öğrencinin hazırlık kaydı düşer; tanımadığımız öğrenciden durumunu iste
        var liste = ogrenciler(), var_ = {};
        liste.forEach(function (o) { var_[o.id] = 1; });
        Object.keys(hazirlar).forEach(function (id) { if (!var_[id]) delete hazirlar[id]; });
        if (baslaDug.parentNode) {
          baslaYaz();
          if (liste.some(function (o) { return !hazirlar[o.id]; }) && performance.now() - hazirIsteSon > 2000) hazirIsteGonder();
        }
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
        baslaYaz();
        if (r === 'takip') hazirGonder();
        if (r === 'hoca') { hazirIsteGonder(); if (!hocaBasladi) kontrol('saatIste', {}, { gunluksuz: true }); }
      }
      function basladi() { if (baslaDug.parentNode) baslaDug.remove(); beklemedenDug.remove(); kok.classList.add('basladi'); }

      /* ——— hazırlık: sahne + anlatım sesi ———
         Yükleme katmanı ikisi de hazır olana dek sahneyi örter. Ses hazır: canplaythrough ya da readyState >= 3;
         yavaş ağ dersi sonsuza dek tutmasın diye SES_SINIRI sonra hazır sayılır. */
      function hazirMi() { return sahneHazir && sesHazir; }
      function sesHazirla() { if (sesHazir) return; sesHazir = true; clearTimeout(sesSayac); hazirKontrol(); }
      function sesOrani() {
        try { var u = ses.buffered, d = ses.duration; if (u && u.length && d > 0 && isFinite(d)) return sinirla(u.end(u.length - 1) / d, 0, 1); } catch (e) { /* ölçülemedi */ }
        return 0;
      }
      // 0..1; görsel ilerlemesi henüz bilinmiyorsa null (belirsiz)
      function yukleOrani() {
        if (hazirMi()) return 1;
        if (gorselOran == null) return null;
        return sinirla(0.85 * gorselOran + 0.15 * (sesHazir ? 1 : sesOrani()), 0, 1);
      }
      var yuzdeSon = -2;
      function yuklemeYaz() {
        if (hazirYapildi) return;
        if (!sesHazir && ses.readyState >= sesEsik) sesHazirla();
        if (hazirYapildi) return;
        var o = yukleOrani(), yuzde = o == null ? -1 : Math.round(o * 100);
        if (yuzde !== yuzdeSon) {
          yuzdeSon = yuzde;
          yukleme.classList.toggle('belirsiz', yuzde < 0);
          yukIc.style.width = (yuzde < 0 ? 0 : yuzde) + '%';
          yukYuzde.textContent = yuzde < 0 ? '' : '%' + yuzde;
          yukCubuk.setAttribute('aria-valuenow', yuzde < 0 ? '' : String(yuzde));
        }
        if (takipci() && Math.floor((o || 0) * 4) > hazirSonOran) hazirGonder();
      }
      function yukleHata(metin) {
        yukleme.classList.remove('belirsiz'); yukleme.classList.add('hata');
        yukNot.textContent = metin; yukYuzde.textContent = '';
      }
      function hazirKontrol() {
        if (hazirYapildi || !yasiyor || !hazirMi()) return;
        hazirYapildi = true;
        yukleme.remove();
        durguCiz = true;                  // ilk kare durağan çizilir, ders başlayana dek sahne oynamaz
        sonRol = null; baslaSon = ''; rolYaz(); baslaYaz();
        var oy = bekleyenOynat, sa = bekleyenSaat; bekleyenOynat = bekleyenSaat = null;
        // Hazır olunca, beklerken kaçan başlatma uygulanır; Hocamızın güncel saati istenir
        if (oy) {
          basladi();
          if (!oy.tekrar && !acik) { t = sinirla(oy.t + (performance.now() - oy.an) / 1000, 0, b.sure); enUzak = Math.max(enUzak, t); basla(); }
        }
        if (sa) saatUygula(sa);
        if ((oy || sa) && takipci() && ctx.canli && ctx.canli.acik && ctx.canli.gonder) ctx.canli.gonder('durumIste', { blok: b.id });
        ciz();
      }
      /* Canlı derste her öğrenci hazır olduğunu Hocamıza bildirir (yükleme ilerlemesiyle birlikte) */
      function hazirGonder() {
        if (!takipci() || !ctx.canli || !ctx.canli.acik || !ctx.canli.gonder) return;
        var h = hazirMi(), o = h ? 1 : Math.min(0.99, yukleOrani() || 0);
        hazirSonOran = Math.max(hazirSonOran, Math.floor(o * 4));
        ctx.canli.gonder('ders-hazir', { v: 1, blok: b.id, hazir: h, oran: Math.round(o * 100) / 100 });
      }
      function hazirIsteGonder() {
        if (!izleyen()) return;
        hazirIsteSon = performance.now();
        kontrol('hazirIste', {}, { gunluksuz: true });
      }
      ctx.eylemTanimla('hazirIste', function () { if (takipci()) hazirGonder(); });
      ctx.dinle('ders-hazir', function (m) {
        var v = m && m.veri, kim = m && m.gonderen;
        if (!izleyen() || !v || !kim || kim.rol !== 'ogrenci' || v.blok !== b.id || typeof v.hazir !== 'boolean') return;
        hazirlar[kim.id] = { hazir: v.hazir, oran: sinirla(+v.oran || 0, 0, 1) };
        baslaYaz();
      });
      // Bağlantı yenilenince öğrenci durumunu yeniden bildirir, Hocamız yeniden sorar; Hocamız yeniden gelirse öğrenci cevap verir
      ctx.dinle('baglanti', function () {
        if (takipci()) hazirGonder(); else if (izleyen() && baslaDug.parentNode) hazirIsteGonder();
      });
      ctx.dinle('merhaba', function (m) {
        if (takipci() && m && m.gonderen && m.gonderen.rol === 'ogretmen') hazirGonder();
      });
      /* Başlat düğmesi: öğrenci Hocamızı bekler. Hocamız için sınıftaki herkes (ve kendi sahnesi) hazır olana dek kapalıdır;
         BEKLEME_SINIRI sonra "Beklemeden başla" çıkar. Sınıfta öğrenci yoksa hemen başlar. */
      var baslaSon = '', baslaIzin = false;   // baslaIzin: Hocamızın panelindeki "Başlat" da aynı koşula bağlıdır
      function baslaYaz() {
        if (!baslaDug.parentNode || !hazirMi()) return;
        var yazi = bitti ? 'Yeniden dinle' : 'Derse başla', kapali = false, ikinci = false;
        if (takipci()) { kapali = true; yazi = 'Hocan başlatınca birlikte başlayacağız'; }
        else if (izleyen()) {
          var liste = ogrenciler(), hazir = liste.filter(function (o) { return hazirlar[o.id] && hazirlar[o.id].hazir; }).length;
          if (liste.length && hazir < liste.length) {
            var simdi = performance.now();
            kapali = true; yazi = 'Öğrenciler hazırlanıyor · ' + hazir + '/' + liste.length + ' hazır';
            if (!bekleBas) bekleBas = simdi;
            ikinci = simdi - bekleBas >= BEKLEME_SINIRI;
          } else bekleBas = 0;
        }
        baslaIzin = !kapali || ikinci;
        var imza = yazi + '|' + kapali + '|' + ikinci;
        if (imza === baslaSon) return;
        baslaSon = imza;
        if (arac) aracYaz();
        baslaDug.disabled = kapali; baslaYazi.textContent = yazi;
        if (ikinci) { if (!beklemedenDug.parentNode) kok.appendChild(beklemedenDug); } else beklemedenDug.remove();
      }

      /* Hocamızın panelindeki anlatım kumandası: sahnedeki şerit gizlense de anlatım elinin altında */
      var arac = null, aracSon = '';
      function ogretmenAraci() {
        if (!izleyen()) return null;
        var oyn = el('button', { class: 'dug ana', type: 'button', onclick: function () { if (acik || (!kok.classList.contains('basladi') && !baslaIzin)) return; kontrol(oynuyor ? 'durdur' : 'oynat', { t: t }); } });
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
        var izin = durum !== 'bas' || baslaIzin;
        if (durum + metin + izin === aracSon) return;
        aracSon = durum + metin + izin;
        arac.oyn.textContent = { durak: 'Durakta', oynuyor: '❚❚ Durdur', bitti: '▶ Baştan', durdu: '▶ Sürdür', bas: '▶ Başlat' }[durum];
        arac.oyn.disabled = durum === 'durak' || !izin;
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
      var seciliSurukle = null, surukleTikEngel = null;
      function secimiBirak() {
        if (!seciliSurukle) return;
        seciliSurukle.e.classList.remove('kd-secili-oge');
        seciliSurukle.e.setAttribute('aria-pressed', 'false');
        seciliSurukle = null;
        var durum = katman.querySelector('.kd-secim-durum'); if (durum) durum.remove();
      }
      function surukleErisim(hedefSec) {
        if (hedefSec) {
          kok.querySelectorAll(hedefSec).forEach(function (h, i) {
            if (h.tagName !== 'BUTTON') { h.setAttribute('role', 'button'); h.tabIndex = 0; }
            if (!h.getAttribute('aria-label')) h.setAttribute('aria-label', (h.textContent.trim() && h.textContent.trim() !== '?' ? h.textContent.trim() : (i + 1) + '. boş yuva') + ' · Yerleştirme hedefi');
          });
        } else kok.querySelectorAll('[data-kd-kaynak]').forEach(function (e) { surukleErisim(e._kdSurukle.hedef); });
      }
      kok.addEventListener('click', function (o) {
        if (surukleTikEngel) { surukleTikEngel = null; o.preventDefault(); return; }
        var e = o.target.closest('[data-kd-kaynak]');
        if (izleyen()) return;
        if (seciliSurukle && (!kok.contains(seciliSurukle.e) || seciliSurukle.e.disabled || seciliSurukle.e.classList.contains('doldu'))) secimiBirak();
        if (seciliSurukle) {
          var h = o.target.closest(seciliSurukle.hedef);
          if (h && kok.contains(h) && h !== seciliSurukle.e && !h.disabled && !h.classList.contains('doldu')) {
            var onceki = seciliSurukle; secimiBirak(); onceki.birak(h); return;
          }
        }
        if (!e || e.disabled || e.classList.contains('doldu')) return;
        var ayni = seciliSurukle && seciliSurukle.e === e; secimiBirak();
        if (ayni) return;
        if (e._kdSurukle.dokun) { e._kdSurukle.dokun(); return; }
        seciliSurukle = e._kdSurukle; e.classList.add('kd-secili-oge'); e.setAttribute('aria-pressed', 'true');
        var p = katman.querySelector('.kd-panel');
        if (p) { var durum = p.querySelector('.kd-secim-durum') || p.appendChild(el('p', { class: 'kd-secim-durum', role: 'status' })); durum.textContent = (e.getAttribute('aria-label') || e.textContent) + ' seçildi. Şimdi hedefi seç.'; gorunsun(durum); }
      });
      kok.addEventListener('keydown', function (o) {
        if (o.key === 'Escape') { secimiBirak(); return; }
        if ((o.key === 'Enter' || o.key === ' ') && o.target.getAttribute('role') === 'button' && o.target.tagName !== 'BUTTON') { o.preventDefault(); o.stopPropagation(); o.target.click(); }
      });
      function surukle(e, hedefSec, birak, sec) {
        sec = sec || {};
        e.setAttribute('data-kd-kaynak', ''); e.setAttribute('aria-pressed', 'false');
        if (e.tagName !== 'BUTTON') { e.setAttribute('role', 'button'); e.tabIndex = 0; }
        e._kdSurukle = { e: e, hedef: hedefSec, birak: birak, dokun: sec.dokun };
        surukleErisim(hedefSec);
        e.addEventListener('pointerdown', function (o) {
          if (e.disabled || e.classList.contains('doldu') || o.button > 0) return;
          o.preventDefault(); e.focus();
          var k = kok.getBoundingClientRect(), olcek = 1600 / k.width, r = e.getBoundingClientRect();
          // Sahnedeki öğe küçülmüş alandadır: hayalet aynı boyda görünsün diye o oranda ölçeklenir
          var hs = sahneKat.contains(e) ? alanOlcek() : O.dom && O.dom.sahne.classList.contains('kompakt-kontrol') ? 1 / O.olcek : 1;
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
              secimiBirak();
              // Hayalet panelin dışına taşınır; panelden gelen görünümü yanında götürür
              var cs = getComputedStyle(e);
              hayalet = e.cloneNode(true);
              ['font', 'padding', 'background', 'color', 'border', 'borderRadius', 'textAlign', 'lineHeight', 'display', 'alignItems', 'justifyContent'].forEach(function (k) { hayalet.style[k] = cs[k]; });
              hayalet.classList.add('kd-hayalet'); hayalet.setAttribute('aria-hidden', 'true'); hayalet.inert = true;
              hayalet.style.width = (r.width * olcek / hs) + 'px'; hayalet.style.height = (r.height * olcek / hs) + 'px';
              hayalet.style.setProperty('--hs', hs);
              kok.appendChild(hayalet); e.classList.add('tasiniyor');
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
            if (!hayalet) return;
            surukleTikEngel = e; setTimeout(function () { surukleTikEngel = null; }, 0);
            hayalet.remove();
            var h = m.type === 'pointerup' ? hedef(m.clientX, m.clientY) : null;
            // Bırakılan yer (öğenin merkezinin ekran noktası): canlı resimler sahne noktasına çevirip oradan yerine kayar
            var bn = { clientX: m.clientX - (o.clientX - r.left - r.width / 2), clientY: m.clientY - (o.clientY - r.top - r.height / 2) };
            if (h) birak(h, bn); else { titret(e); if (sec.iptal) sec.iptal(bn); }
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

      /* "n / N" sayacı: panelin sağ üst köşesinde durur (akışa girmez, alçak tepside de yer tutmaz) */
      function sayacKur(p, N) {
        var e = el('span', { class: 'kd-sayac', role: 'status' });
        p.appendChild(e);
        return function (n) { e.textContent = n + ' / ' + N; e.setAttribute('aria-label', n + ' / ' + N + ' tamamlandı'); ilerlet(n, N); };
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
            ctx.karistir(grup.secenekler.map(function (o, i) { return { o: o, i: i }; }), 'secim-' + d.id + '-' + adim + '-' + ilkI).forEach(function (kart) {
              var o = kart.o, i = kart.i;
              kartlar.appendChild(el('button', { class: 'kd-kart', type: 'button', 'data-i': i, onclick: function () { hamle('sk', { d: d.i, a: adim, i: i, k: adim ? ilkI : -1 }); } }, [o.gorsel ? el('img', { src: ctx.yol(o.gorsel), alt: '' }) : null, el('span', { text: o.m })]));
            });
          }
          ctx.eylemTanimla('sk', function (x, kk) {
            if (x.a && ilkI < 0 && x.k >= 0) { ilk = d.secenekler[x.k]; ilkI = x.k; diz(1); }   // geç gelen ekran
            var grup = grupAl(x.a, x.a ? ilkI : -1), o = grup && grup.secenekler[x.i]; if (!o) return;
            acik.deneme++;
            if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + (x.a ? '-2' : ''), ad: grup.soru, yanit: o.m, dogru: o.geri ? false : undefined, puan: 0, max: 0, deneme: acik.deneme, etkilesim: 'choice' });
            kartlar.querySelectorAll('.kd-kart').forEach(function (c) { var secili = +c.dataset.i === x.i; c.classList.toggle('secili', secili); c.classList.toggle('yanlis', secili && !!o.geri); });
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
        /* Yuvalar sahnenin üstündedir (d.yuvalar: adım başına {x, y}); adımlar alttaki şeritten tutulup yuvaya sürüklenir.
           d.canli [{ad, gorsel, x, y, g|h}]: şerit yerine sahnede bekleyen resimler (x, y merkezdir) tutulup sürüklenir;
           yuvalar[i] {x, y, g, h, ad?} yumuşak kesikli bölge olur. Bölgenin içi ya da 60 px yakını hedeftir.
           Doğru: resim bölgenin merkezine (yuvalar[i].ix, iy varsa oraya) kayar ve kalır (canli[i].sol: true ise solar);
           yanlış: bekleme yerine döner. Sahne 'tut' i / 'birak' i ve 'dogru' i alır. */
        yerlestir: function (d) {
          var p = panel(d), doldu = {}, canli = d.canli && d.canli.length ? d.canli : null, resimler = {}, dusen = null;
          var yuvalar = el('div', { class: 'kd-yuvalar' });
          d.adimlar.forEach(function (a, i) {
            var bos = d.bos.indexOf(i) >= 0, y = d.yuvalar[i];
            if (canli) {
              if (!bos) return;      // dolu adımı sahnenin kendisi çizer
              yuvalar.appendChild(el('div', { class: 'kd-yuva bos kd-bolge', 'data-i': i, 'aria-label': (y.ad || (i + 1) + '. boş yuva') + ' · Yerleştirme hedefi',
                style: 'left:' + y.x + 'px;top:' + y.y + 'px;width:' + (y.g || 220) + 'px;height:' + (y.h || 220) + 'px' }, y.ad ? [el('span', { text: y.ad })] : null));
              return;
            }
            yuvalar.appendChild(el('div', { class: 'kd-yuva' + (bos ? ' bos' : ' doldu'), 'data-i': i, style: 'left:' + y.x + 'px;top:' + y.y + 'px', text: bos ? '?' : a }));
          });
          sahneKat.appendChild(yuvalar);
          var cip = null;
          // Canlı resim bir noktadan ötekine kayar; bx verilmezse bulunduğu yerden. Tekrar oynatmada anında.
          function kaydir_(e, bx, by, hx, hy, anlik) {
            if (bx != null || anlik) {
              e.style.transition = 'none';
              if (bx != null) { e.style.left = bx + 'px'; e.style.top = by + 'px'; }
              if (anlik) { e.style.left = hx + 'px'; e.style.top = hy + 'px'; }
              void e.offsetWidth; e.style.transition = '';
            }
            e.style.left = hx + 'px'; e.style.top = hy + 'px';
          }
          if (canli) {
            var kat = el('div', { class: 'kd-canli-kat' }); sahneKat.appendChild(kat);
            var liste = d.bos.map(function (i) { return canli.find(function (c) { return c.ad === d.adimlar[i]; }) || canli[i]; })
              .concat(canli.filter(function (c) { return d.adimlar.indexOf(c.ad) < 0; })).filter(function (c, k, a) { return c && a.indexOf(c) === k; });
            liste.forEach(function (c) {
              var ci = canli.indexOf(c);
              var e = kat.appendChild(el('img', { class: 'kd-canli-img kd-tut-cip', src: ctx.yol(c.gorsel), alt: c.ad, 'aria-label': c.ad, draggable: 'false',
                style: 'left:' + c.x + 'px;top:' + c.y + 'px;' + (c.g ? 'width:' + c.g + 'px' : 'height:' + (c.h || 200) + 'px') }));
              resimler[c.ad] = { e: e, c: c };
              surukle(e, '.kd-yuva.bos', function (h, ek) {
                dusen = ek ? sahneNokta(ek) : null;
                hamle('koy', { i: +h.dataset.i, a: c.ad });
                dusen = null;
              }, {
                basladi: function () { yuvalar.classList.add('seciliyor'); if (sahne && sahne.durak) sahne.durak(d.id, 'tut', ci); },
                bitti: function () { yuvalar.classList.remove('seciliyor'); if (sahne && sahne.durak) sahne.durak(d.id, 'birak', ci); },
                iptal: function (ek) { var nk = sahneNokta(ek); kaydir_(e, nk.x, nk.y, c.x, c.y); geri(p, null, 'Resmi tut, kesikli yerin üstüne sürükle ya da dokunarak yerleştir.'); }
              });
            });
          } else {
            cip = el('div', { class: 'cipler' });
            ctx.karistir(d.bos.map(function (i) { return d.adimlar[i]; }).concat(d.fazla || []), 'yer' + d.id).forEach(function (m) {
              var c = cip.appendChild(el('button', { class: 'cip kd-tut-cip', type: 'button', text: m }));
              surukle(c, '.kd-yuva.bos', function (h) {
                if (!h) { geri(p, null, 'Adımı tut, yukarıdaki soru işaretinin üstüne sürükle ya da dokunarak yerleştir.'); return; }
                hamle('koy', { i: +h.dataset.i, a: m });
              }, { basladi: function () { yuvalar.classList.add('seciliyor'); }, bitti: function () { yuvalar.classList.remove('seciliyor'); } });
            });
            p.appendChild(cip);
          }
          if (d.ipucu) ipucuDug(p, d, d.ipucu);
          ctx.eylemTanimla('koy', function (v, kk) {
            var li = yuvalar.querySelector('[data-i="' + v.i + '"]'); if (!li || doldu[v.i] || d.bos.indexOf(v.i) < 0) return;
            var dogru = d.adimlar[v.i] === v.a, im = resimler[v.a];
            olc(d, dogru);
            if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + '-' + v.i, ad: d.soru, yanit: v.a, dogru: dogru, dogruYanit: d.adimlar[v.i], puan: 0, max: 0, deneme: acik.deneme, etkilesim: 'sequencing' });
            if (!kk.tekrar) (dogru ? DO.efekt.dogru : DO.efekt.yanlis)();
            if (!dogru) {
              titret(li); geri(p, false, d.yanlis || 'Bu adım burada değil. Bir daha düşün.');
              if (im) kaydir_(im.e, dusen ? dusen.x : null, dusen ? dusen.y : null, im.c.x, im.c.y, kk.tekrar);
              return;
            }
            doldu[v.i] = 1; li.classList.remove('bos'); li.classList.add('doldu');
            if (canli) {
              if (im) {
                var y = d.yuvalar[v.i];
                im.e.classList.add('doldu');
                kaydir_(im.e, dusen ? dusen.x : null, dusen ? dusen.y : null, y.ix != null ? y.ix : y.x, y.iy != null ? y.iy : y.y, kk.tekrar);
                if (im.c.sol) { if (kk.tekrar) im.e.classList.add('soldu'); else setTimeout(function () { im.e.classList.add('soldu'); }, 450); }
              }
            } else {
              li.textContent = v.a;
              cip.querySelectorAll('.cip').forEach(function (c) { if (c.textContent === v.a) c.disabled = true; });
            }
            geri(p, true, 'Yerine oturdu.');
            if (sahne && sahne.durak) sahne.durak(d.id, 'dogru', v.i);
            if (Object.keys(doldu).length === d.bos.length) {
              if (acik.deneme === d.bos.length && !acik.ipucu) d.puan = 10; else d.puan = 0;
              if (cip) cip.remove(); var ipucuD = p.querySelector('.kd-ipucu-dug'); if (ipucuD) ipucuD.remove();
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
          var sol = el('div', { class: 'kd-olmasa-sol' }), kutu = el('div', { class: 'kd-cikar-alan', text: d.kutu || 'Birini buraya bırak ya da dokun' });
          var not = el('p', { class: 'kd-not kd-cikar-not' });
          // d.hepsi: çocuk her varlığı sırayla dener; her doğru cevapta o nokta ✓ olur, varlık sahneye döner, hepsi bitince Devam çıkar
          var hepsi = !!d.hepsi, N = d.varliklar.length, tamam = {}, sayacYaz = hepsi ? sayacKur(p, N) : null;
          function kac() { return Object.keys(tamam).length; }
          if (sayacYaz) sayacYaz(0);
          [p.querySelector('.kd-etiket'), p.querySelector('h3')].forEach(function (e) { sol.appendChild(e); });
          sol.appendChild(kutu); sol.appendChild(not);
          d.varliklar.forEach(function (v, i) {
            var n = noktalar.appendChild(el('button', { class: 'kd-nokta kd-tut-cip', type: 'button', 'data-i': i, 'aria-label': v.ad, style: 'left:' + v.x + 'px;top:' + v.y + 'px' }, [el('span', { text: v.ad })]));
            surukle(n, '.kd-cikar-alan', function (h) {
              if (!h) { not.textContent = 'Tut ve aşağıdaki kutuya sürükle ya da dokunarak koy.'; return; }
              hamle('cikar', { i: i });
            }, { basladi: function () { kutu.classList.add('bekliyor'); not.textContent = ''; }, bitti: function () { kutu.classList.remove('bekliyor'); } });
          });
          sahneKat.appendChild(noktalar);
          p.appendChild(sol); p.appendChild(soru);
          ctx.eylemTanimla('cikar', function (x) {
            var v = d.varliklar[x.i]; if (!v || dug || (hepsi && tamam[x.i])) return;
            // Cevaplamadan başka varlığa geçilirse önceki varlık sahneye döner
            if (hepsi && secilen >= 0 && secilen !== x.i && !tamam[secilen] && sahne && sahne.durak) sahne.durak(d.id, 'dondur', secilen);
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
            olc(d, dogru, hepsi ? x.v : null);
            if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + '-' + v.id, ad: v.soru, yanit: secenekMetni(o), dogru: dogru, dogruYanit: secenekMetni(v.secenekler[v.dogru]), puan: 0, max: 0, deneme: acik.deneme });
            if (!kk.tekrar) (dogru ? DO.efekt.dogru : DO.efekt.yanlis)();
            soru.querySelectorAll('.secenek').forEach(function (c) { var bu = +c.dataset.i === x.i; c.classList.toggle('secili', bu); c.classList.toggle('yanlis', bu && !dogru); });
            geri(soru, dogru, dogru ? v.aciklama : (o && o.geri) || d.yanlis || 'Sahneye bir daha bak.');
            if (!dogru) return;
            soru.querySelectorAll('.secenek').forEach(function (c) { c.disabled = true; });
            if (sahne && sahne.durak) sahne.durak(d.id, 'dogru', v.id);
            if (!hepsi) {
              noktalar.classList.add('bitti'); not.textContent = '';
              dug = devamDug(sol, d);   // sol sütunda yer var, soru sütunu taşmaz
              return;
            }
            // Bu varlık tamam: noktası ✓ olur ve kapanır, varlık sahneye döner, kalan noktalar yeniden açılır
            tamam[x.v] = 1; secilen = -1;
            noktalar.querySelectorAll('.kd-nokta').forEach(function (c, i) {
              c.classList.remove('cikti');
              if (tamam[i]) { c.classList.add('tamam', 'doldu'); c.disabled = true; c.setAttribute('aria-label', d.varliklar[i].ad + ' tamam'); }
            });
            kutu.textContent = v.ad + ' sahneye döndü'; kutu.classList.remove('dolu');
            if (sahne && sahne.durak) sahne.durak(d.id, 'dondur', x.v);
            sayacYaz(kac());
            if (kac() < N) { not.textContent = d.siradaki || 'Şimdi başka birini dene.'; return; }
            d.puan = Math.round(10 * (acik.ilk || 0) / N);
            noktalar.classList.add('bitti'); not.textContent = '';
            dug = devamDug(sol, d);
          });
        },
        /* Resimler üstte, cevaplar alttadır. Çocuk hangisini tutarsa tutsun eşleştirir: cevabı resmin
           üstüne ya da resmi cevabın üstüne sürükler; öğe ve hedef sırayla seçilerek de eşleştirilir. */
        eslestir: function (d) {
          var p = panel(d), bitenler = {};
          var iki = el('div', { class: 'kd-esles' + (d.ciftler.length === 3 ? ' uc' : '') }), a = el('div', { class: 'kd-esles-a' }), c = el('div', { class: 'kd-esles-b' });
          var surukleIpucu = d.surukleIpucu || 'Resmi yazının üstüne ya da yazıyı resmin üstüne sürükle; dokunarak da eşleştirebilirsin.';
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
           Karışık düzen ctx.karistir ile canlı derste herkeste aynı çıkar.
           d.tut: torba sahnede tutulup sallanır (düğme yok). Taşlar dökülünce "Taşları torbaya koy" (topla) çıkar,
           taşlar tek tek torbaya döner, torba yeniden hazır olur. Klavye/okuyucu tıklaması ve azaltılmış hareket ya da
           ~8 sn sallanamazsa "Dokunarak salla" yedek düğmesi sallar. Sahne 'tut' {dx, dy, enerji} ve 'birak' alır. */
        dizme: function (d) {
          var p = panel(d), n = d.sayi, tur = 0, siradaki = 1, taslar = [], kat = el('div', { class: 'kd-taslar' });
          var durum = el('p', { class: 'kd-durum' }), dugmeler = el('div', { class: 'kd-dugmeler' }), sayilar = [];
          var tut = !!d.tut, torbada = true, silahSon = 0, dizmede = false, toplamaNo = 0, tutBtn = null, yedekSayac = null;
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
          function silahli() { return tut && torbada && !dizmede && performance.now() >= silahSon; }
          function sallaIste() { if (!tut || silahli()) hamle('salla', { tur: tur + 1 }); }
          var sallaDug = el('button', { class: 'dug ana', type: 'button', text: d.dugme, onclick: sallaIste });
          var dizDug = el('button', { class: 'dug ikincil', type: 'button', text: d.ikinciDugme, hidden: true, onclick: function () { hamle('dizbasla', {}); } });
          var toplaDug = el('button', { class: 'dug ikincil kd-topla', type: 'button', text: d.toplaDugme || 'Taşları torbaya koy', hidden: true, onclick: function () { hamle('topla', {}); } });
          var dokunDug = el('button', { class: 'dug ikincil kd-dokunarak', type: 'button', text: 'Dokunarak salla', hidden: true, onclick: sallaIste });
          if (tut) { dugmeler.appendChild(dokunDug); dugmeler.appendChild(toplaDug); durum.textContent = d.tutYazi || 'Torbayı tut ve salla.'; } else dugmeler.appendChild(sallaDug);
          dugmeler.appendChild(dizDug); p.appendChild(durum); p.appendChild(dugmeler);
          // Yedek yol: azaltılmış harekette hemen, değilse ~8 sn sallanamazsa "Dokunarak salla" çıkar
          function yedekBekle() {
            clearTimeout(yedekSayac); dokunDug.hidden = true;
            if (!tut || !torbada || dizmede) return;
            if (api.azHareket) { dokunDug.hidden = false; return; }
            yedekSayac = setTimeout(function () { if (silahli() && acik && acik.d === d) dokunDug.hidden = false; }, 8000);
          }
          /* Torbayı tut: sahne parmağı izler ('tut'), ters yönlü hareketler sayılır, 5 ters hareket torbayı sallar */
          function torbaTut() {
            var ESIK = 24, TERS = 5, PENCERE = 450, SOGUMA = 1200;
            var tutuyor = false, g0 = null, dx = 0, dy = 0, hiz = 0, sonT = 0, sonHareket = 0, ek = null, sayac = 0, sonTers = 0, sonEksen = '', sogumaSon = 0, tik_ = null;
            function enerji(simdi) { return sinirla(hiz * Math.exp(-(simdi - sonHareket) / 180) / 0.9, 0, 1); }
            function gonder() { if (sahne && sahne.durak) sahne.durak(d.id, 'tut', { dx: dx, dy: dy, enerji: enerji(performance.now()) }); }
            function birak() {
              if (!tutuyor) return;
              tutuyor = false; clearInterval(tik_); tutBtn.classList.remove('tutuldu');
              if (sahne && sahne.durak) sahne.durak(d.id, 'birak');
            }
            function tik() {
              if (!yasiyor || !acik || acik.d !== d) { tutuyor = false; clearInterval(tik_); return; }
              if (sayac && performance.now() - sonTers > PENCERE) sayac = 0;   // beklenince sayaç söner
              gonder();
            }
            function ters(eksen, simdi) {
              if (simdi < sogumaSon) return;
              if (eksen !== sonEksen && simdi - sonTers < 40) return;           // aynı vuruşun öbür ekseni ikinci kez sayılmaz
              if (simdi - sonTers > PENCERE) sayac = 0;
              sayac++; sonTers = simdi; sonEksen = eksen;
              if (sayac >= TERS) { sayac = 0; if (silahli()) { sogumaSon = simdi + SOGUMA; hamle('salla', { tur: tur + 1 }); } }
            }
            function eksen(ad, pos, simdi) {
              var e = ek[ad];
              if (!e.yon) { if (Math.abs(pos - e.uc) > ESIK) { e.yon = pos > e.uc ? 1 : -1; e.uc = pos; } return; }
              if (e.yon > 0) { if (pos > e.uc) e.uc = pos; else if (e.uc - pos > ESIK) { e.yon = -1; e.uc = pos; ters(ad, simdi); } }
              else if (pos < e.uc) e.uc = pos; else if (pos - e.uc > ESIK) { e.yon = 1; e.uc = pos; ters(ad, simdi); }
            }
            tutBtn.addEventListener('pointerdown', function (o) {
              if (izleyen() || tutuyor || o.button > 0) return;
              if (o.preventDefault) o.preventDefault();
              try { tutBtn.setPointerCapture(o.pointerId); } catch (x) { /* eski tarayıcı */ }
              var nk = sahneNokta(o), simdi = performance.now();
              tutuyor = true; g0 = { x: nk.x, y: nk.y, px: nk.x, py: nk.y }; dx = 0; dy = 0; hiz = 0; sonT = simdi; sonHareket = simdi; sayac = 0; sonTers = 0;
              ek = { x: { yon: 0, uc: nk.x }, y: { yon: 0, uc: nk.y } };
              tutBtn.classList.add('tutuldu'); tutBtn.focus();
              clearInterval(tik_); tik_ = setInterval(tik, 33);
              gonder();
            });
            tutBtn.addEventListener('pointermove', function (o) {
              if (!tutuyor) return;
              var nk = sahneNokta(o), simdi = performance.now(), gec = Math.max(1, simdi - sonT);
              hiz = hiz * 0.55 + Math.hypot(nk.x - g0.px, nk.y - g0.py) / gec * 0.45;
              g0.px = nk.x; g0.py = nk.y; sonT = simdi; sonHareket = simdi;
              dx = nk.x - g0.x; dy = nk.y - g0.y;
              eksen('x', nk.x, simdi); eksen('y', nk.y, simdi);
              gonder();
            });
            tutBtn.addEventListener('pointerup', birak);
            tutBtn.addEventListener('pointercancel', birak);
            tutBtn.addEventListener('lostpointercapture', birak);
            // Klavye (Enter, Boşluk) ve ekran okuyucu tıklaması da sallar; fareyle ya da parmakla tıklama (detail ≥ 1) sayılmaz
            tutBtn.addEventListener('click', function (o) { if (!o.detail && !izleyen()) sallaIste(); });
          }
          if (tut) {
            var TG = d.torbaG || 220, TH = d.torbaH || 250;
            tutBtn = el('button', { class: 'kd-torba-tut', type: 'button', 'aria-label': 'Torbayı tut ve salla', style: 'left:' + d.torba.x + 'px;top:' + d.torba.y + 'px;width:' + TG + 'px;height:' + TH + 'px' });
            sahneKat.appendChild(tutBtn);
            yedekBekle();
            torbaTut();
          }
          function dok(k) { return ctx.karistir(sayilar, 'torba' + k); }
          ctx.eylemTanimla('salla', function (x, kk) {
            if (tut && (!torbada || dizmede)) return;      // taşlar dışarıdayken önce toplanır; örtük ışınlanma yok
            tur = x.tur;
            var dizi = dok(tur), yerinde = 0;
            if (tut) {
              // taşlar torbadadır: yalnız görünür olur, sıra sıra dökülür
              sayilar.forEach(function (no) { taslar[no].classList.add('dokuluyor'); });
              torbada = false; toplamaNo++; clearTimeout(yedekSayac); dokunDug.hidden = true; toplaDug.hidden = false; dizDug.hidden = true;
            } else {
              // taşlar önce torbaya döner, sonra sırayla dökülür
              kat.classList.add('dondur');
              sayilar.forEach(function (no) { yer(taslar[no], d.torba.x, d.torba.y); taslar[no].classList.add('dokuluyor'); });
              void kat.offsetWidth;
              kat.classList.remove('dondur');
            }
            dizi.forEach(function (no, k) {
              if (no === k + 1) yerinde++;
              taslar[no].style.transitionDelay = (k * 55) + 'ms';
              yer(taslar[no], d.sira.x + k * d.sira.dx, d.sira.y);
            });
            durum.textContent = tur + '. sallayış: ' + (yerinde ? n + ' taştan yalnız ' + yerinde + ' tanesi yerine düştü.' : 'hiçbir taş yerine düşmedi.') + (tur >= 2 ? ' ' + (d.sallaSon || (tut ? 'Torbaya koyup bir daha salla ya da kendin diz.' : 'Bir daha salla ya da kendin diz.')) : tut ? ' Taşları torbaya koyup bir daha salla.' : '');
            if (acik) acik.deneme = tur;
            if (tur >= 2) dizDug.hidden = false;
            if (sahne && sahne.durak) sahne.durak(d.id, 'salla', tur);
            if (!kk.tekrar) DO.efekt.dogru();
          });
          /* topla: dökülen taşlar tek tek torbaya döner; bitince torba yeniden hazırdır ('topla', sonra 'hazir') */
          ctx.eylemTanimla('topla', function (x, kk) {
            if (!tut || torbada || dizmede) return;
            torbada = true; var no_ = ++toplamaNo, bekle = kk.tekrar ? 0 : (n - 1) * 55 + 650;
            toplaDug.hidden = true; dizDug.hidden = true; dokunDug.hidden = true;
            silahSon = performance.now() + bekle;
            if (kk.tekrar) kat.classList.add('dondur');
            dok(tur).forEach(function (no, k) {
              taslar[no].style.transitionDelay = (kk.tekrar ? 0 : k * 55) + 'ms';
              yer(taslar[no], d.torba.x, d.torba.y);
              if (kk.tekrar) taslar[no].classList.remove('dokuluyor');
              else setTimeout(function () { if (toplamaNo === no_) taslar[no].classList.remove('dokuluyor'); }, k * 55 + 520);
            });
            if (kk.tekrar) { void kat.offsetWidth; kat.classList.remove('dondur'); }
            durum.textContent = d.torbaYazi || 'Taşlar torbada. Torbayı tutup tekrar salla.';
            if (sahne && sahne.durak) sahne.durak(d.id, 'topla');
            function hazirOl() {
              if (toplamaNo !== no_ || !acik || acik.d !== d) return;
              if (sahne && sahne.durak) sahne.durak(d.id, 'hazir');
              yedekBekle();
            }
            if (kk.tekrar) hazirOl(); else setTimeout(hazirOl, bekle);
          });
          ctx.eylemTanimla('dizbasla', function () {
            if (tut && torbada) return;                    // taşlar torbadayken dizilmez
            dizmede = true; clearTimeout(yedekSayac); if (tutBtn) tutBtn.remove();
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
        /* Sahnedeki varlıklar denenir, her birinin cevabı görünür; d.dogru düğmesi durağı bitirir.
           d.hepsi: bitiren kart(lar) her varlık denenene kadar kapalıdır, panelde "n / N" görünür.
           d.secenekler [metin], d.dogru (sıra), d.geri [metin], d.aciklama: tek kart yerine şıklar çıkar
           (hepsi varsa yalnız hepsi denenince); yanlış şık geri[i] gösterir, doğru şık aciklama gösterir. */
        dokun: function (d) {
          var p = panel(d), dug = null, noktalar = el('div', { class: 'kd-noktalar' }), denenen = [], dokunuldu = {};
          var N = d.varliklar.length, hepsi = !!d.hepsi, secenekli = !!(d.secenekler && d.secenekler.length), secDeneme = 0;
          var kartlar = el('div', { class: 'kd-kartlar' + (secenekli ? ' kd-dokun-sec' : '') }), tek = null, sayacYaz = hepsi ? sayacKur(p, N) : null;
          function kac() { return Object.keys(dokunuldu).length; }
          function hazirMi() { return !hepsi || kac() >= N; }
          if (sayacYaz) sayacYaz(0);
          d.varliklar.forEach(function (v, i) {
            noktalar.appendChild(el('button', { class: 'kd-nokta', type: 'button', 'data-i': i, style: 'left:' + v.x + 'px;top:' + v.y + 'px', onclick: function () { hamle('dene', { i: i }); } }, [el('span', { text: v.ad })]));
          });
          sahneKat.appendChild(noktalar);
          function kartlariKur() {
            if (kartlar.children.length) return;
            if (secenekli) {
              ctx.karistir(d.secenekler.map(function (m, i) { return { m: secenekMetni(m), i: i }; }), 'dsec-' + d.id).forEach(function (o) {
                kartlar.appendChild(el('button', { class: 'kd-kart', type: 'button', 'data-i': o.i, onclick: function () { hamle('dsec', { d: d.i, i: o.i }); } }, [el('span', { text: o.m })]));
              });
            } else {
              tek = kartlar.appendChild(el('button', { class: 'kd-kart', type: 'button', disabled: !hazirMi(), onclick: function () { hamle('hicbiri', {}); } }, [el('span', { text: d.dogru })]));
            }
          }
          // Şıklar keşiften sonra çıkar; tek kart baştan görünür ama hepsi denenene kadar kapalıdır
          if (!secenekli || hazirMi()) kartlariKur();
          p.appendChild(kartlar);
          if (d.ipucu) ipucuDug(p, d, d.ipucu);
          function bitirDokun(kk, yanit) {
            if (kk.yerel && !secenekli) ctx.cevap({ oge: 'durak-' + d.id, ad: d.soru, yanit: yanit, dogru: true, puan: 0, max: 0, deneme: acik.deneme + 1 });   // şıklı durakta cevap dsec'te kaydedilir
            d.puan = 10;
            noktalar.remove();
            var ipucuD = p.querySelector('.kd-ipucu-dug'); if (ipucuD) ipucuD.remove();
            if (sahne && sahne.durak) sahne.durak(d.id, 'bitti', denenen);
            if (!kk.tekrar) DO.efekt.dogru();
          }
          ctx.eylemTanimla('dene', function (x, kk) {
            var v = d.varliklar[x.i]; if (!v || dug) return;
            acik.deneme++;
            if (denenen.indexOf(v.ad) < 0) denenen.push(v.ad);
            noktalar.querySelectorAll('.kd-nokta').forEach(function (c, i) { c.classList.toggle('secili', i === x.i); if (i === x.i) c.classList.add('denendi'); });
            // Denemek yanlış değildir: çocuk keşfediyor, açıklama nötr görünür
            geri(p, null, v.geri);
            if (sahne && sahne.durak) sahne.durak(d.id, 'dene', v.id);
            if (!kk.tekrar && DO.efekt.tik) DO.efekt.tik();
            if (!dokunuldu[x.i]) {
              dokunuldu[x.i] = 1;
              if (sayacYaz) sayacYaz(kac());
              if (hepsi && kac() >= N) {
                if (secenekli) kartlariKur(); else if (tek) tek.disabled = false;
                if (sahne && sahne.durak) sahne.durak(d.id, 'hepsi');
              }
            }
          });
          ctx.eylemTanimla('hicbiri', function (x, kk) {
            if (dug || secenekli || !hazirMi()) return;
            bitirDokun(kk, d.dogru);
            var kart = p.querySelector('.kd-kart'); kart.classList.add('secili'); kart.disabled = true;
            geri(p, true, d.aciklama);
            dug = devamDug(p, d);
          });
          ctx.eylemTanimla('dsec', function (x, kk) {
            if (dug || !secenekli || !hazirMi() || d.secenekler[x.i] == null) return;
            var dogru = x.i === d.dogru, m = secenekMetni(d.secenekler[x.i]);
            secDeneme++;
            if (kk.yerel) ctx.cevap({ oge: 'durak-' + d.id + '-s', ad: d.soru, yanit: m, dogru: dogru, dogruYanit: secenekMetni(d.secenekler[d.dogru]), puan: 0, max: 0, deneme: secDeneme, etkilesim: 'choice' });
            var kart = Array.from(kartlar.querySelectorAll('.kd-kart')).find(function (c) { return +c.dataset.i === x.i; });
            if (!dogru) {
              if (kart) { kart.classList.add('yanlis'); titret(kart); }
              geri(p, false, (d.geri && d.geri[x.i]) || d.yanlis || 'Bir daha düşün.');
              if (!kk.tekrar) DO.efekt.yanlis();
              return;
            }
            kartlar.querySelectorAll('.kd-kart').forEach(function (c) { c.classList.remove('yanlis'); c.disabled = true; });
            if (kart) kart.classList.add('secili');
            geri(p, true, d.aciklama || 'Doğru.');
            bitirDokun(kk, m);
            dug = devamDug(p, d);
          });
        }
      };

      /* Sıra durağı: "şimdi sen söyle". Anlatım durur, çocuk yüksek sesle söyler, hocası dinler ve devam ettirir.
         Canlı derste öğrencide düğme yoktur (bitirmiş sayılmaz, kendiliğinden geçilmez); kendi başına derste çocuk "Söyledim" der.
         Cevap, puan ve kayıt üretmez. d.sonra: devamda anlatım oradan sürer. */
      Kur.sira = function (d) {
        var p = panel(d), canli = tekEkran();
        p.appendChild(el('p', { class: 'kd-durum kd-sira-durum' }, [
          el('span', { class: 'kd-sira-ikon', 'aria-hidden': 'true', text: '🎙️' }),
          el('span', { text: canli && !hoca ? 'Yüksek sesle söyle, hocan dinliyor.' : hoca && canli ? 'Çocuk söylüyor, dinle.' : 'Yüksek sesle söyle.' })
        ]));
        if (canli && !hoca) return;
        if (canli) {
          var kutu = el('div', { class: 'kd-hoca kd-okuma-hoca kd-sira-hoca' });
          kutu.appendChild(el('button', { class: 'dug ana kd-devam', type: 'button', text: 'Söyledi · Devam et', onclick: function () { clearTimeout(otoSayac); kontrol('devam', { d: d.i }); } }));
          p.appendChild(kutu); gorunsun(kutu);
        } else devamDug(p, d, 'Söyledim · Devam');
      };

      /* Okuma durağı: harfler sahnenin üstünde sağdan sola dizilir, panelde yalnız söz ve düğmeler durur.
         Yanlış okuma puanlanmaz; "Bir daha" kârinin okuyuşunu çalar, sonuç cevap olarak kaydedilir ki hocanın raporuna düşsün. */
      Kur.okuma = function (d) {
        var p = panel(d), k = d.kip || 'birlikte', sira = 0, dinlenen = {}, bitti_ = false, dug = null;
        // d.karisik: sıra ve kartların yeri her açılışta değişir, çocuk sırayı değil harfi öğrenir. Canlı derste herkeste aynıdır.
        function karis(a, ad) { return d.karisik || k === 'kulak' || k === 'tek' ? ctx.karistir(a.slice(), ad + d.id) : a; }
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
        /* Hocanın dinleyip onayladığı kipler (tek, birlikte): canlı derste hocanın son "Tamam" ı yeter. Öğrenci düğme görmez,
           durak bitmiş kaydedilir (atlandı değil); hoca kısa bir bekleyişten sonra herkes için devam ettirir. */
        function hocaOnayli() { return (k === 'tek' || k === 'birlikte') && tekEkran(); }
        function bitir_(metin, tekrar) {
          bitti_ = true; parcaDur(); clearTimeout(okumaSayac); isaretle(); dugmeler.innerHTML = '';
          durum.textContent = metin || d.sonMetin || 'Maşallah!';
          if (sahne && sahne.durak) sahne.durak(d.id, 'bitti');
          if (hocaOnayli()) {
            if (takipci()) { if (!tekrar && !biten[d.id]) { biten[d.id] = true; durakKaydet(d, { okuma: Object.keys(dinlenen).length }); } }
            else if (!tekrar) { var an = acik; okumaSayac = setTimeout(function () { if (acik === an && an && bitti_) kontrol('devam', { d: d.i }); }, 1000); }
            return;
          }
          if (k === 'birlikte' && !takipci() && !izleyen()) dugmeler.appendChild(el('button', { class: 'dug ikincil', type: 'button', text: 'Bir daha okuyalım', onclick: function () { hamle('okubas', {}); } }));
          if (!izleyen()) dug = devamDug(dugmeler, d, d.dugme);
          else durakBitir(d, { okuma: Object.keys(dinlenen).length });
        }
        /* birlikte: kâri okur, çocuk yüksek sesle tekrar eder. Süre sayılmaz: sıradaki harfe hoca "Söyledi" deyince
           (kendi başına derste çocuk "Söyledim" deyince) geçilir. Canlı derste öğrencide düğme yoktur. */
        function birlikte(sessiz) {
          if (bitti_) return;
          var o = d.parcalar[liste[sira]];
          isaretle(); dugmeler.innerHTML = ''; durum.textContent = d.dinleMetin || 'Dinle…';
          if (sessiz) { sen(); return; }
          parcaCal(o.dinle, function () { if (bitti_ || !acik || acik.d !== d) return; sen(); });
        }
        function sen() {
          var canli = tekEkran();
          durum.textContent = canli && !hoca ? 'Yüksek sesle söyle, hocan dinliyor.' : (d.senMetin || 'Sen söyle!');
          harfler[sira].classList.add('sen');
          dugmeler.innerHTML = '';
          if (canli && !hoca) return;
          var kutu = canli ? el('div', { class: 'kd-hoca kd-okuma-hoca' }) : dugmeler;
          kutu.appendChild(el('button', { class: 'dug ikincil', type: 'button', text: hoca && canli ? 'Bir daha' : 'Bir daha dinle', onclick: function () { kontrol('okunan', { d: d.i, i: sira, s: 0 }); } }));
          kutu.appendChild(el('button', { class: 'dug ana', type: 'button', text: canli ? 'Söyledi · Devam' : 'Söyledim', onclick: function () { kontrol('soyledi', { d: d.i, i: sira }); } }));
          if (canli) dugmeler.appendChild(kutu);
        }
        ctx.eylemTanimla('soyledi', function (v, kk) {
          if (v.d !== d.i || v.i !== sira || bitti_) return;
          harfler[sira].classList.remove('sen'); parcaDur();
          sira++;
          if (sira >= liste.length) bitir_(null, kk.tekrar); else birlikte(kk.tekrar);
        });
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
          if (sira >= liste.length) bitir_(null, kk.tekrar); else tek();
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
        // Öğrenci hazır değilse başlatmayı hatırlar, yükleme katmanı açık kalır; hazır olunca normal başlar ve saat istenir
        if (takipci() && !hazirMi()) {
          if (!bekleyenOynat || !kk.tekrar) bekleyenOynat = { t: x.t, tekrar: !!kk.tekrar, an: performance.now() };
          return;
        }
        basladi();
        if (kk.kim && kk.kim.rol === 'ogretmen' && hoca) hocaBasladi = true;
        if (kk.tekrar || acik) return;
        t = x.t; basla(); ciz();
      });
      ctx.eylemTanimla('durdur', function (x, kk) { if (kk.tekrar) return; t = atlaSon(x.t); durguCiz = true; dur(); ciz(); });
      /* Hocamız serbestçe sarar, durakta da: ileri atladığı duraklar geçilmiş sayılır, açık durağın gerisine
         sararsa durak kapanır ve anlatım oraya gelince yeniden açılır. Öğrenci yalnız dinlediği yere kadar sarar. */
      ctx.eylemTanimla('sar', function (x, kk) {
        sfxHepsiniDur();
        var serbest = serbestSar || (kk.kim && kk.kim.rol === 'ogretmen');
        var hedef = atlaSon(sinirla(x.t, 0, serbest ? b.sure : enUzak));
        if (acik && !serbest) return;
        // Sunum kipi: açık durağın içinden sarınca anlatım kendiliğinden sürer
        var surdur = !!window.DO_SUNUM && !!acik && !kk.tekrar;
        if (acik && !kk.tekrar && hedef <= acik.d.zaman + 0.05) durakBirak(acik.d);
        if (serbest) duraklar.forEach(function (d) {
          if (d.bitti || d.zaman >= hedef - 0.05) return;
          if (!hoca && !kk.tekrar && !biten[d.id]) durakKaydet(d, { atlandi: 1 });
          durakKapandi(d, kk.tekrar);
        });
        if (kk.tekrar) return;
        t = hedef; enUzak = Math.max(enUzak, t); durguCiz = true;   // ders başlamadan sarılınca da sahne o ana çizilir
        try { ses.currentTime = t; } catch (e) { /* yüklenmedi */ }
        son = performance.now(); ciz();
        if (surdur && !acik && !oynuyor && t < b.sure) basla();
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
      // Hocamız beklemeye razı değilse (öğrenci geç hazırlanıyor) dersi beklemeden başlatır
      var beklemedenDug = el('button', { class: 'kd-beklemeden', type: 'button', text: 'Beklemeden başla', onclick: function () { kontrol('oynat', { t: t }); } });
      /* Yükleme katmanı: sahne ve ses hazır olana dek sahnenin üstünü opak olarak örter */
      var yukIc = el('i'), yukYuzde = el('span', { class: 'kd-yukleme-yuzde' }), yukNot = el('p', { class: 'kd-yukleme-not', text: 'Ders hazırlanıyor' });
      var yukCubuk = el('div', { class: 'kd-yukleme-cubuk', role: 'progressbar', 'aria-label': 'Ders yükleniyor', 'aria-valuemin': '0', 'aria-valuemax': '100' }, [yukIc]);
      var yukleme = el('div', { class: 'kd-yukleme belirsiz', role: 'status', 'aria-live': 'polite' }, [
        el('div', { class: 'kd-yukleme-kart' }, [
          el('span', { class: 'kd-yukleme-isaret', 'aria-hidden': 'true' }, [el('i'), el('i'), el('i')]),
          el('b', { class: 'kd-yukleme-baslik', text: b.baslik || 'Ders' }),
          yukNot, yukCubuk, yukYuzde
        ])
      ]);
      kok.appendChild(yukleme);
      ses.addEventListener('ended', function () { if (t >= b.sure - 0.6) t = b.sure; });
      /* iOS/iPadOS Safari, dokunuş olmadan sesi önyüklemez (preload yok sayılır): canplaythrough gelmeyebilir.
         Orada meta verinin gelmesi (readyState >= 1) hazır sayılır; diğer platformlarda canplaythrough / readyState >= 3. */
      var ios = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
      var sesEsik = ios ? 1 : 3;
      ses.addEventListener('canplaythrough', sesHazirla);
      if (ios) ses.addEventListener('loadedmetadata', sesHazirla);
      ses.addEventListener('error', sesHazirla);       // ses açılmasa da ders kilitli kalmaz; saat kendi başına yürür
      if (ses.readyState >= sesEsik) sesHazir = true; else sesSayac = setTimeout(sesHazirla, SES_SINIRI);

      function olcuGuncelle() { tuval.olcekle(kok.getBoundingClientRect().width); durguCiz = true; }
      var gozcu = window.ResizeObserver ? new ResizeObserver(olcuGuncelle) : null;
      if (gozcu) gozcu.observe(kok);
      window.addEventListener('resize', olcuGuncelle);

      function hareketGoster() {
        kok.classList.add('hareket');
        clearTimeout(hareketSayac);
        hareketSayac = setTimeout(function () { kok.classList.remove('hareket'); }, window.DO_SUNUM ? 4000 : 2400);
      }
      var hareketSayac = null;
      kok.addEventListener('pointermove', hareketGoster);
      kok.addEventListener('pointerdown', hareketGoster);

      function kur() {
        if (!DO.KodDersSahne[b.sahne]) { console.error('kodDers: sahne yok', b.sahne); yukleHata('Ders açılamadı. Sayfayı yenileyin.'); return; }
        sahne = DO.KodDersSahne[b.sahne](api);
        olcuGuncelle();
        Promise.resolve(sahne.hazir).then(function () {
          if (!yasiyor) return;
          sahneHazir = true; gorselOran = 1;
          hazirKontrol();
        }, function () { if (yasiyor) yukleHata('Ders açılamadı. Sayfayı yenileyin.'); });
      }
      api.yukleniyor = function (oran) { gorselOran = sinirla(+oran || 0, 0, 1); yuklemeYaz(); };
      if (DO.KodDersSahne[b.sahne]) kur();
      else {
        var s = document.createElement('script');
        s.onerror = function () { yukleHata('Ders açılamadı. Sayfayı yenileyin.'); };
        s.src = ctx.yol(b.sahneDosya); s.onload = function () { if (yasiyor) kur(); }; document.body.appendChild(s);
      }
      kare = requestAnimationFrame(dongu);
      O.temizlikler.push(function () {
        yasiyor = false; cancelAnimationFrame(kare); ses.pause(); ses.src = ''; ctx.altyazi(''); parcaDur(); clearTimeout(okumaSayac); clearTimeout(sesSayac);
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
