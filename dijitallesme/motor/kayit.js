/* Ders Odası — kayıt (izleme) katmanı
   Dersin içinde olan her şey xAPI biçiminde bir "ifade" olarak üretilir ve
   aynı anda birden çok hedefe yazılır:
     • yerel  : tarayıcı deposu (rapor ekranı buradan okur, her zaman açık)
     • scorm  : LMS'in SCORM 1.2 (window.API) veya 2004 (API_1484_11) arayüzü
     • xapi   : ?endpoint=…&auth=… ile gelen LRS (TinCan başlatma biçimi)
     • platform: dersi iframe içinde gösteren ana platforma postMessage
   Hangi hedef bulunursa ona yazılır; hiçbiri yoksa yalnızca yerel kayıt tutulur. */
(function () {
  'use strict';
  var DO = window.DO;

  var FIIL = {
    basladi: 'http://adlnet.gov/expapi/verbs/initialized',
    deneyimledi: 'http://adlnet.gov/expapi/verbs/experienced',
    cevapladi: 'http://adlnet.gov/expapi/verbs/answered',
    etkilesti: 'http://adlnet.gov/expapi/verbs/interacted',
    tamamladi: 'http://adlnet.gov/expapi/verbs/completed',
    gecti: 'http://adlnet.gov/expapi/verbs/passed',
    kaldi: 'http://adlnet.gov/expapi/verbs/failed',
    ilerledi: 'http://adlnet.gov/expapi/verbs/progressed',
    devamEtti: 'http://adlnet.gov/expapi/verbs/resumed',
    ayrildi: 'http://adlnet.gov/expapi/verbs/suspended',
    bitirdi: 'http://adlnet.gov/expapi/verbs/terminated',
    oynatti: 'https://w3id.org/xapi/video/verbs/played',
    durdurdu: 'https://w3id.org/xapi/video/verbs/paused',
    atladi: 'https://w3id.org/xapi/video/verbs/seeked',
    elKaldirdi: 'https://w3id.org/xapi/adl/verbs/commented',
    paylasti: 'http://adlnet.gov/expapi/verbs/shared'
  };
  var KOK = 'https://raufenc.com/ders-odasi/';

  var Kayit = DO.Kayit = {
    ifadeler: [],
    hedefler: [],
    ders: null, ogrenci: null, oturum: null, rol: 'bireysel', oda: null,
    baslangic: Date.now(),
    olay: DO.yayin()
  };

  /* ---------- Başlat ---------- */
  Kayit.baslat = function (o) {
    Kayit.ders = o.ders;
    Kayit.ogrenci = o.ogrenci;           // {id, ad}
    Kayit.rol = o.rol || 'bireysel';
    Kayit.oda = o.oda || null;
    Kayit.oturum = DO.uuid();
    Kayit.baslangic = Date.now();
    if (DO.LmsDers && DO.LmsDers.aktif) Kayit.hedefler = [DO.LmsDers.hedef()];
    else {
    Kayit.hedefler = [yerelHedef()];
    var s = scormHedef(); if (s) Kayit.hedefler.push(s);
    var x = xapiHedef(); if (x) Kayit.hedefler.push(x);
    // Platform köprüsü: ?host= verilmişse ya da LMS dışında bir çerçevede açılmışsa
    var p = (DO.param('host') || !s) ? platformHedef() : null; if (p) Kayit.hedefler.push(p);
    }
    Kayit.hedefler.forEach(function (h) { if (h.baslat) h.baslat(); });
    window.addEventListener('pagehide', Kayit.kapat);
    window.addEventListener('beforeunload', Kayit.kapat);
    return Kayit.hedefAdlari();
  };
  Kayit.hedefAdlari = function () { return Kayit.hedefler.map(function (h) { return h.ad; }); };

  /* LMS'ten gelen öğrenci adı/kimliği (varsa) */
  Kayit.lmsOgrenci = function () {
    for (var i = 0; i < Kayit.hedefler.length; i++) {
      var h = Kayit.hedefler[i];
      if (h.ogrenci) { var o = h.ogrenci(); if (o && o.ad) return o; }
    }
    return null;
  };
  /* Kaldığı yer (SCORM suspend_data veya yerel) */
  Kayit.devamVerisi = function () {
    for (var i = 0; i < Kayit.hedefler.length; i++) {
      var h = Kayit.hedefler[i];
      if (h.devamOku) { var d = h.devamOku(); if (d) return d; }
    }
    return null;
  };
  Kayit.devamYaz = function (veri) {
    Kayit.hedefler.forEach(function (h) { if (h.devamYaz) h.devamYaz(veri); });
  };

  /* ---------- İfade üret ---------- */
  Kayit.kaydet = function (fiil, nesne, sonuc, ek) {
    var ifade = {
      id: DO.uuid(),
      actor: { objectType: 'Agent', name: Kayit.ogrenci.ad, account: { homePage: KOK, name: Kayit.ogrenci.id } },
      verb: { id: FIIL[fiil] || FIIL.etkilesti, display: { 'tr-TR': fiil } },
      object: {
        objectType: 'Activity',
        id: KOK + Kayit.ders.id + (nesne && nesne.id ? '/' + nesne.id : ''),
        definition: {
          name: { 'tr-TR': (nesne && nesne.ad) || Kayit.ders.ad },
          type: (nesne && nesne.tur) ? 'http://adlnet.gov/expapi/activities/' + nesne.tur : 'http://adlnet.gov/expapi/activities/lesson'
        }
      },
      context: {
        registration: Kayit.oturum,
        platform: 'Ders Odası',
        language: 'tr-TR',
        extensions: {}
      },
      timestamp: new Date().toISOString()
    };
    var ext = ifade.context.extensions;
    ext[KOK + 'rol'] = Kayit.rol;
    if (Kayit.oda) ext[KOK + 'oda'] = Kayit.oda;
    if (ek) for (var k in ek) ext[KOK + k] = ek[k];
    if (sonuc) {
      var r = {};
      if (sonuc.basari != null) r.success = !!sonuc.basari;
      if (sonuc.tamam != null) r.completion = !!sonuc.tamam;
      if (sonuc.yanit != null) r.response = String(sonuc.yanit);
      if (sonuc.puan != null && sonuc.max) r.score = { raw: sonuc.puan, min: 0, max: sonuc.max, scaled: Math.round(sonuc.puan / sonuc.max * 1000) / 1000 };
      if (sonuc.sureMs != null) r.duration = DO.isoSure(sonuc.sureMs);
      ifade.result = r;
    }
    // Rapor ekranı için sade alanlar (xAPI'ye ek, LRS bunları uzantı olarak saklar)
    ifade._ = {
      fiil: fiil,
      nesne: nesne ? nesne.id : null,
      nesneAd: nesne ? nesne.ad : null,
      blok: nesne ? nesne.blok : null,
      etkilesimTuru: nesne ? nesne.etkilesim : null,
      dogruYanit: nesne ? nesne.dogruYanit : null,
      t: Date.now()
    };
    Kayit.ifadeler.push(ifade);
    Kayit.hedefler.forEach(function (h) { try { h.yaz(ifade); } catch (e) { console.warn('Kayıt hedefi hata verdi:', h.ad, e); } });
    Kayit.olay.emit('ifade', ifade);
    return ifade;
  };

  /* Puan ve tamamlanma durumunu LMS'e bildir */
  Kayit.durum = function (d) {
    // d: {puan, max, tamam, esik, konum}
    Kayit.sonDurum = d;
    Kayit.hedefler.forEach(function (h) { if (h.durum) h.durum(d); });
  };

  Kayit.kapat = function () {
    if (Kayit.kapandi) return;
    Kayit.kapandi = true;
    Kayit.hedefler.forEach(function (h) { try { if (h.kapat) h.kapat(); } catch (e) { /* sayfa kapanıyor */ } });
  };

  /* Başka bir öğrenciden (canlı derste) gelen ifadeyi öğretmen tarafında sakla */
  Kayit.disaridanSakla = function (ifade) {
    if (DO.LmsDers && DO.LmsDers.aktif) return;
    yerelYaz(ifade, true);
  };

  /* =====================================================================
     YEREL HEDEF — localStorage
     do:oturumlar          → oturum özetleri listesi
     do:ifade:<oturumId>   → o oturumun bütün ifadeleri
     do:devam:<ders>:<öğr> → kaldığı yer
     ===================================================================== */
  function oturumOzet(ifade) {
    var ext = ifade.context.extensions || {};
    return {
      oturum: ifade.context.registration,
      ders: ifade.object.id.replace(KOK, '').split('/')[0],
      ogrenciId: ifade.actor.account.name,
      ad: ifade.actor.name,
      rol: ext[KOK + 'rol'] || 'bireysel',
      oda: ext[KOK + 'oda'] || null,
      baslangic: ifade._ ? ifade._.t : Date.now(),
      son: ifade._ ? ifade._.t : Date.now(),
      adet: 0
    };
  }
  function yerelYaz(ifade, disaridan) {
    var anahtar = 'do:ifade:' + ifade.context.registration;
    var liste = DO.depo.oku(anahtar, []);
    if (disaridan && liste.some(function (x) { return x.id === ifade.id; })) return;
    liste.push(ifade);
    if (liste.length > 4000) liste = liste.slice(-4000);
    DO.depo.yaz(anahtar, liste);
    var oturumlar = DO.depo.oku('do:oturumlar', []);
    var o = oturumlar.find(function (x) { return x.oturum === ifade.context.registration; });
    if (!o) { o = oturumOzet(ifade); oturumlar.push(o); }
    o.son = ifade._ ? ifade._.t : Date.now();
    o.adet = liste.length;
    if (ifade.result && ifade.result.score && ifade._ && ifade._.fiil === 'tamamladi' && !ifade._.blok) {
      o.puan = ifade.result.score.raw; o.max = ifade.result.score.max;
    }
    if (ifade._ && ifade._.fiil === 'ilerledi' && ifade.result && ifade.result.score) {
      o.puan = ifade.result.score.raw; o.max = ifade.result.score.max;
    }
    if (ifade._ && (ifade._.fiil === 'tamamladi' && !ifade._.blok)) o.durum = 'tamamlandı';
    if (oturumlar.length > 300) oturumlar = oturumlar.slice(-300);
    DO.depo.yaz('do:oturumlar', oturumlar);
  }
  function yerelHedef() {
    var devamAnahtar = function () { return 'do:devam:' + Kayit.ders.id + ':' + Kayit.ogrenci.id; };
    return {
      ad: 'yerel',
      yaz: function (ifade) { yerelYaz(ifade); },
      devamOku: function () { return DO.depo.oku(devamAnahtar(), null); },
      devamYaz: function (v) { DO.depo.yaz(devamAnahtar(), v); }
    };
  }

  /* =====================================================================
     SCORM HEDEFİ — 1.2 ve 2004
     ===================================================================== */
  function apiBul() {
    var w = window, n = 0;
    while (w && n < 12) {
      try {
        if (w.API_1484_11) return { surum: '2004', api: w.API_1484_11 };
        if (w.API) return { surum: '1.2', api: w.API };
      } catch (e) { break; }
      if (w.parent === w) break;
      w = w.parent; n++;
    }
    try {
      if (window.opener) {
        if (window.opener.API_1484_11) return { surum: '2004', api: window.opener.API_1484_11 };
        if (window.opener.API) return { surum: '1.2', api: window.opener.API };
      }
    } catch (e) { /* farklı köken */ }
    return null;
  }
  function scormHedef() {
    if (DO.param('scorm') === '0') return null;
    var bulunan = apiBul();
    if (!bulunan) return null;
    var api = bulunan.api, v12 = bulunan.surum === '1.2';
    var al = function (k) { try { return v12 ? api.LMSGetValue(k) : api.GetValue(k); } catch (e) { return ''; } };
    var ver = function (k, d) { try { return v12 ? api.LMSSetValue(k, String(d)) : api.SetValue(k, String(d)); } catch (e) { return false; } };
    var isle = function () { try { return v12 ? api.LMSCommit('') : api.Commit(''); } catch (e) { return false; } };
    var sayac = 0, sonIsleme = 0, tamamlandi = false, acik = false;
    function seyrekIsle(zorla) {
      var simdi = Date.now();
      if (zorla || simdi - sonIsleme > 8000) { isle(); sonIsleme = simdi; }
    }
    function kimlik(s) { return String(s).replace(/[^A-Za-z0-9_\-]/g, '_').slice(0, 250); }
    return {
      ad: 'SCORM ' + bulunan.surum,
      baslat: function () {
        acik = v12 ? api.LMSInitialize('') : api.Initialize('');
        acik = String(acik) === 'true' || acik === true;
        if (!acik) return;
        var durum = v12 ? al('cmi.core.lesson_status') : al('cmi.completion_status');
        tamamlandi = durum === 'completed' || durum === 'passed';
        if (!tamamlandi) {
          if (v12) { if (durum === 'not attempted' || !durum) ver('cmi.core.lesson_status', 'incomplete'); }
          else ver('cmi.completion_status', 'incomplete');
        }
        sayac = parseInt(al('cmi.interactions._count'), 10) || 0;
        isle();
      },
      ogrenci: function () {
        if (!acik) return null;
        var ad = v12 ? al('cmi.core.student_name') : al('cmi.learner_name');
        var id = v12 ? al('cmi.core.student_id') : al('cmi.learner_id');
        if (!ad) return null;
        // LMS'ler genelde "Soyad, Ad" verir
        if (ad.indexOf(',') > 0) ad = ad.split(',').reverse().map(function (s) { return s.trim(); }).join(' ');
        return { ad: ad, id: 'lms-' + id };
      },
      devamOku: function () {
        if (!acik) return null;
        try { var s = al('cmi.suspend_data'); return s ? JSON.parse(s) : null; } catch (e) { return null; }
      },
      devamYaz: function (veri) {
        if (!acik) return;
        var s = JSON.stringify(veri);
        if (v12 && s.length > 4000) s = JSON.stringify({ b: veri.b, p: veri.p });
        ver('cmi.suspend_data', s);
        ver(v12 ? 'cmi.core.lesson_location' : 'cmi.location', String(veri.b));
        seyrekIsle();
      },
      yaz: function (ifade) {
        if (!acik || !ifade._ || ifade._.fiil !== 'cevapladi') return;
        var n = sayac++, on = 'cmi.interactions.' + n + '.';
        var basari = ifade.result && ifade.result.success;
        var yanit = (ifade.result && ifade.result.response) || '';
        if (v12) {
          ver(on + 'id', kimlik(ifade._.nesne || ('soru' + n)));
          ver(on + 'type', 'performance');
          ver(on + 'student_response', yanit.slice(0, 250));
          ver(on + 'result', basari == null ? 'neutral' : (basari ? 'correct' : 'wrong'));
          ver(on + 'time', new Date().toTimeString().slice(0, 8));
          if (ifade.result && ifade.result.duration) ver(on + 'latency', DO.scorm12Sure(sureMs(ifade.result.duration)));
        } else {
          ver(on + 'id', 'urn:ders-odasi:' + kimlik(Kayit.ders.id) + ':' + kimlik(ifade._.nesne || ('soru' + n)));
          ver(on + 'type', 'other');
          ver(on + 'timestamp', new Date().toISOString().slice(0, 19));
          ver(on + 'learner_response', yanit.slice(0, 4000));
          ver(on + 'result', basari == null ? 'neutral' : (basari ? 'correct' : 'incorrect'));
          if (ifade._.nesneAd) ver(on + 'description', String(ifade._.nesneAd).slice(0, 250));
          if (ifade.result && ifade.result.duration) ver(on + 'latency', ifade.result.duration);
        }
        seyrekIsle();
      },
      durum: function (d) {
        if (!acik) return;
        var oran = d.max ? d.puan / d.max : 0;
        if (v12) {
          ver('cmi.core.score.min', 0); ver('cmi.core.score.max', 100);
          ver('cmi.core.score.raw', Math.round(oran * 100));
          if (d.tamam) {
            ver('cmi.core.lesson_status', d.esik != null ? (oran >= d.esik ? 'passed' : 'failed') : 'completed');
            tamamlandi = true;
          }
        } else {
          ver('cmi.score.min', 0); ver('cmi.score.max', d.max || 0); ver('cmi.score.raw', d.puan || 0);
          ver('cmi.score.scaled', Math.round(oran * 1000) / 1000);
          ver('cmi.progress_measure', Math.min(1, Math.round((d.ilerleme || 0) * 100) / 100));
          if (d.tamam) {
            ver('cmi.completion_status', 'completed');
            if (d.esik != null) ver('cmi.success_status', oran >= d.esik ? 'passed' : 'failed');
            tamamlandi = true;
          }
        }
        seyrekIsle(d.tamam);
      },
      kapat: function () {
        if (!acik) return;
        var sure = Date.now() - Kayit.baslangic;
        if (v12) {
          ver('cmi.core.session_time', DO.scorm12Sure(sure));
          ver('cmi.core.exit', tamamlandi ? '' : 'suspend');
          api.LMSCommit(''); api.LMSFinish('');
        } else {
          ver('cmi.session_time', DO.isoSure(sure));
          ver('cmi.exit', tamamlandi ? 'normal' : 'suspend');
          api.Commit(''); api.Terminate('');
        }
        acik = false;
      }
    };
  }
  function sureMs(iso) {
    var m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/.exec(iso || '');
    if (!m) return 0;
    return ((+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0)) * 1000;
  }
  DO.isoSureMs = sureMs;

  /* =====================================================================
     xAPI HEDEFİ — ?endpoint=https://lrs/xapi/&auth=Basic%20…&actor={…}
     ===================================================================== */
  function xapiHedef() {
    var uc = DO.param('endpoint');
    if (!uc) return null;
    if (uc.slice(-1) !== '/') uc += '/';
    var yetki = DO.param('auth', '');
    var kayitNo = DO.param('registration');
    var aktor = null;
    try { aktor = JSON.parse(DO.param('actor', 'null')); } catch (e) { aktor = null; }
    var kuyruk = [], zamanlayici = null;
    function gonder(beacon) {
      if (!kuyruk.length) return;
      var paket = kuyruk.splice(0, kuyruk.length);
      var govde = JSON.stringify(paket);
      var basliklar = { 'Content-Type': 'application/json', 'X-Experience-API-Version': '1.0.3' };
      if (yetki) basliklar.Authorization = yetki;
      fetch(uc + 'statements', { method: 'POST', headers: basliklar, body: govde, keepalive: !!beacon })
        .then(function (r) { if (!r.ok) throw new Error('LRS ' + r.status); })
        .catch(function (e) { console.warn('xAPI gönderilemedi, sıraya geri alındı', e); kuyruk = paket.concat(kuyruk); });
    }
    return {
      ad: 'xAPI',
      ogrenci: function () {
        if (!aktor) return null;
        var ad = aktor.name || (aktor.account && aktor.account.name) || (aktor.mbox || '').replace('mailto:', '');
        return { ad: ad, id: 'xapi-' + ((aktor.account && aktor.account.name) || aktor.mbox || ad) };
      },
      yaz: function (ifade) {
        var kopya = JSON.parse(JSON.stringify(ifade));
        delete kopya._;
        if (aktor) kopya.actor = aktor;
        if (kayitNo) kopya.context.registration = kayitNo;
        kuyruk.push(kopya);
        clearTimeout(zamanlayici);
        zamanlayici = setTimeout(gonder, 1500);
      },
      kapat: function () { gonder(true); }
    };
  }

  /* =====================================================================
     PLATFORM HEDEFİ — ders bir platformun içinde iframe ile açıldıysa
     ana pencereye { kaynak:'ders-odasi', tur:'ifade'|'durum', veri } gönderilir.
     ===================================================================== */
  function platformHedef() {
    if (window.parent === window) return null;
    var hedefKoken = DO.param('host');
    if (!hedefKoken) {
      try { hedefKoken = document.referrer ? new URL(document.referrer).origin : null; } catch (e) { hedefKoken = null; }
    }
    if (!hedefKoken) return null;
    function ilet(tur, veri) {
      try { window.parent.postMessage({ kaynak: 'ders-odasi', tur: tur, veri: veri }, hedefKoken); } catch (e) { /* yok */ }
    }
    return {
      ad: 'platform',
      baslat: function () { ilet('hazir', { ders: Kayit.ders.id, ogrenci: Kayit.ogrenci, rol: Kayit.rol }); },
      yaz: function (ifade) { var k = JSON.parse(JSON.stringify(ifade)); ilet('ifade', k); },
      durum: function (d) { ilet('durum', d); },
      kapat: function () { ilet('kapandi', { sureMs: Date.now() - Kayit.baslangic }); }
    };
  }
})();
