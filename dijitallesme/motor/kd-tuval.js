/* Ders Odası — kodDers tuvali: boyalı katmanları tek tuvalde canlandırır.
   Her kare saf çağrılardan oluşur: bas() → ciz(ad, {…}) … → bitir(). Saat sahnededir, burada durum tutulmaz.
   WebGL'de altın varak parıltısı, akan su, rüzgâr, bükülme ve mevsim geçişi vardır; WebGL yoksa
   aynı çağrılar 2B tuvale düşer, ders akmaya devam eder.

   ciz seçenekleri:
     x, y     sahne noktası (1600×900), ax/ay çapa (0..1, varsayılan orta)
     g, h     çizim boyutu (biri verilirse oran korunur), s ölçek, r derece
     o        saydamlık, d derinlik (0 kameraya yapışık … 1 tam kamera; katman paralaksı)
     carp     [r,g,b] çarpım, ekle [r,g,b], doy doygunluk
     parilti  varak parıltısı, su akış, ruzgar piksel rüzgârı
     buk      gövde bükülmesi (piksel), sal salınım (piksel), faz
     gecis    {k, ac, sil, yumusak, yon} katman altındakini açarak silinir ya da belirir; k 0..1
              yon 0 lekeyle, 1 alttan, 2 soldan, 3 ortadan
     kure     {boylam, egim, bakis, isik, gunes:[x,y,z], gece, duz, yedek} görseli küre olarak çizer.
              Adı "-harita" ile biten görsel eşdikdörtgen haritadır: kendi ekseninde döner (boylam, radyan),
              ekseni ekranda egim kadar sağa yatar, bakis kadar yukarıdan görülür (kuzey kutbu izleyene eğilir).
              Haritadaki bir noktanın ekrandaki yeri DO.KdTuval.kureNokta ile bulunur. duz: true ise görsel olduğu gibi kalır, yalnız küre gibi
              aydınlanır (Ay). gunes ışığın geldiği yöndür (x sağ, y yukarı, z izleyene doğru); isik 0..1 gece
              yarısının koyuluğu, gece 0..1 gece yarısının saydamlığı (1 tam görünür). WebGL yoksa yedek çizilir. */
(function () {
  'use strict';
  var DO = window.DO;

  var KOSE = [
    'attribute vec2 p;',
    'uniform mat3 m; uniform vec2 olcu; uniform vec4 buk;',
    'varying vec2 uv;',
    'void main(){',
    '  float h=1.0-p.y;',
    '  vec2 q=p; q.x+=(buk.x+buk.y*sin(buk.z+buk.w*1.3+h*2.4))*h*h;',
    '  vec3 s=m*vec3(q,1.0);',
    '  vec2 c=s.xy/olcu*2.0-1.0;',
    '  gl_Position=vec4(c.x,-c.y,0.0,1.0); uv=p;',
    '}'
  ].join('\n');

  var PARCA = [
    'precision mediump float;',
    'varying vec2 uv;',
    'uniform sampler2D t0;',
    'uniform vec4 carp; uniform vec3 ekle; uniform float doy;',
    'uniform vec4 etki; uniform vec4 gec; uniform vec4 kure; uniform vec4 kure2; uniform float kgece;',
    'float rs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float gur(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);',
    '  return mix(mix(rs(i),rs(i+vec2(1,0)),f.x),mix(rs(i+vec2(0,1)),rs(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){return gur(p)*.55+gur(p*2.1+3.7)*.3+gur(p*4.3+9.1)*.15;}',
    'void main(){',
    '  vec2 q=uv; float z=etki.w; vec4 c; vec3 nn=vec3(0.0,0.0,1.0); float kenar=1.0;',
    '  if(kure.x>0.5){',
    // küre: kare içindeki daire; harita kipinde enlem ve boylamdan doku okunur
    '    vec2 p=vec2(uv.x*2.0-1.0,1.0-uv.y*2.0); float r2=dot(p,p); if(r2>1.0) discard;',
    '    kenar=1.0-smoothstep(.982,1.0,sqrt(r2)); nn=vec3(p,sqrt(1.0-r2));',
    '    if(kure.x<1.5){float ce=cos(kure.z),se=sin(kure.z);',
    '      float yy=nn.x*se+nn.y*ce, bx=nn.x*ce-nn.y*se, cb=cos(kure.w), sb=sin(kure.w);',
    '      float by=yy*cb+nn.z*sb, bz=nn.z*cb-yy*sb;',
    '      float en=asin(clamp(by,-1.0,1.0)), bo=atan(bx,bz)+kure.y;',
    '      q=vec2(fract(bo*.15915494+.5),clamp(.5-en*.31830989,.001,.999));}',
    '    c=texture2D(t0,q);',
    '  } else {',
    '  if(etki.z>0.0){float y=uv.y; q.x+=etki.z*.0016*sin(z*1.7+uv.y*46.0+uv.x*22.0)*y;q.y+=etki.z*.0009*sin(z*1.3+uv.x*34.0)*y;}',
    '  c=texture2D(t0,q);',
    '  if(etki.y>0.0&&c.a>.02){vec3 k=c.rgb/c.a; float su=smoothstep(.04,.2,k.b-k.r)*smoothstep(.1,.28,k.g-k.r);',
    '    if(su>.01){vec2 d=vec2(sin(z*.9+uv.y*90.0+uv.x*14.0)*.0028,cos(z*.7+uv.x*70.0)*.0016);',
    '      vec4 e=texture2D(t0,q+d*etki.y); c=mix(c,e,su);',
    '      c.rgb+=c.a*su*.05*sin(z*1.1+uv.x*60.0+uv.y*120.0);}}',
    '  }',
    '  if(gec.z>0.0){float n=fbm(uv*vec2(5.0,3.0)); if(gec.w>.5){float y=gec.w<1.5?1.0-uv.y:gec.w<2.5?uv.x:length((uv-.5)*vec2(1.6,.9))*1.15; n=n*.4+y*.6;}',
    '    float w=gec.y, e=gec.x*(1.0+w*2.0)-w; float k=1.0-smoothstep(e-w,e+w,n); c*=gec.z>1.5?k:1.0-k;}',
    '  if(c.a<.003) discard;',
    '  vec3 r=c.rgb/c.a;',
    '  if(doy!=1.0){float l=dot(r,vec3(.3,.59,.11)); r=mix(vec3(l),r,doy);}',
    '  if(etki.x>0.0){float a=smoothstep(.1,.42,(r.r+r.g)*.5-r.b)*smoothstep(.45,.75,r.r);',
    '    float s=sin((uv.x*1.2+uv.y*.7)*9.0-z*.55+gur(uv*7.0)*2.4); s=pow(max(s,0.0),6.0);',
    '    r+=vec3(1.0,.82,.46)*a*s*.26*etki.x;}',
    '  if(kure.x>0.5){float d=dot(nn,kure2.xyz), l=smoothstep(-.14,.2,d);',
    // gece yarısı lacivertle kararır; kenara doğru hafif koyulaşır, küre hacim kazanır
    '    r=mix(r,mix(r*vec3(.09,.12,.28),r,l),kure2.w); r*=.8+.2*nn.z;',
    '    c*=kenar*mix(1.0,mix(kgece,1.0,l),kure2.w);}',
    '  r=r*carp.rgb+ekle;',
    '  gl_FragColor=vec4(r*c.a*carp.a,c.a*carp.a);',
    '}'
  ].join('\n');

  var IZ_KOSE = [
    'attribute vec2 p; attribute vec2 u; attribute vec4 r;',
    'uniform vec2 olcu; varying vec2 v; varying vec4 c;',
    'void main(){vec2 s=p/olcu*2.0-1.0; gl_Position=vec4(s.x,-s.y,0.0,1.0); v=u; c=r;}'
  ].join('\n');
  var IZ_PARCA = [
    'precision mediump float; varying vec2 v; varying vec4 c;',
    'void main(){float d=length(v); float a=1.0-smoothstep(.45,1.0,d); gl_FragColor=vec4(c.rgb*c.a*a,c.a*a);}'
  ].join('\n');

  function program(gl, kaynakK, kaynakP) {
    function derle(tur, kaynak) {
      var s = gl.createShader(tur); gl.shaderSource(s, kaynak); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error('kdTuval gölgelendirici', gl.getShaderInfoLog(s));
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, derle(gl.VERTEX_SHADER, kaynakK)); gl.attachShader(p, derle(gl.FRAGMENT_SHADER, kaynakP));
    gl.linkProgram(p);
    return p;
  }

  DO.KdTuval = function (kap, sec) {
    sec = sec || {};
    var GEN = 1600, YUK = 900;
    var canvas = document.createElement('canvas');
    canvas.className = 'kd-tuval'; canvas.width = GEN; canvas.height = YUK;
    kap.insertBefore(canvas, kap.firstChild);
    var gl = null, c2 = null, tex = {}, resim = {}, zaman = 0, kam = { x: 800, y: 450, z: 1 };
    var ana, iz, kafes, kafesN = 0, iu = {}, izu = {}, izTampon, izVeri = new Float32Array(8 * 6 * 900), izN = 0;
    var olcek = 1, kareler = 0, sayac = 0;

    function glKur() {
      var ayar = { alpha: false, antialias: false, premultipliedAlpha: true, powerPreference: 'default' };
      gl = canvas.getContext('webgl2', ayar) || canvas.getContext('webgl', ayar);
      if (!gl) { c2 = canvas.getContext('2d'); return; }
      ana = program(gl, KOSE, PARCA); iz = program(gl, IZ_KOSE, IZ_PARCA);
      ['m', 'olcu', 'buk', 't0', 'carp', 'ekle', 'doy', 'etki', 'gec', 'kure', 'kure2', 'kgece'].forEach(function (a) { iu[a] = gl.getUniformLocation(ana, a); });
      izu.olcu = gl.getUniformLocation(iz, 'olcu');
      // Bükülme için ince ızgara: bitkiler gövdesinden eğilir
      var NX = 8, NY = 28, v = [], i, j;
      for (j = 0; j < NY; j++) for (i = 0; i <= NX; i++) {
        v.push(i / NX, j / NY, i / NX, (j + 1) / NY);
        if (i === NX && j < NY - 1) v.push(i / NX, (j + 1) / NY, 0, (j + 1) / NY);
      }
      kafes = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, kafes);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
      kafesN = v.length / 2;
      izTampon = gl.createBuffer();
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      Object.keys(resim).forEach(function (ad) { yukleDoku(ad); });
    }
    function yukleDoku(ad) {
      var im = resim[ad], t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      var iki = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // Küre haritası boylam dikişinde mipmap seviyesi sıçramasın diye düz süzülür
      if (iki && !/-harita$/.test(ad)) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      tex[ad] = { t: t, g: im.naturalWidth, h: im.naturalHeight };
    }
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); gl = null; tex = {}; });
    canvas.addEventListener('webglcontextrestored', glKur);
    glKur();

    // Tam sahne görselleri %6 taşar: kamera bu payın dışına çıkıp kenarı göstermez
    function kameraSinir(k) {
      var z = Math.max(1, k.z), mx = 848 - 800 / z, my = 477 - 450 / z;
      return { x: Math.min(800 + mx, Math.max(800 - mx, k.x)), y: Math.min(450 + my, Math.max(450 - my, k.y)), z: z };
    }

    var api = {
      canvas: canvas,
      webgl: function () { return !!gl; },
      /* liste {ad: adres}; her görsel inince ilerleme(oran) */
      yukle: function (liste, ilerleme) {
        var adlar = Object.keys(liste), biten = 0;
        return Promise.all(adlar.map(function (ad) {
          return new Promise(function (coz) {
            var im = new Image(); im.decoding = 'async';
            im.onload = function () { resim[ad] = im; if (gl) yukleDoku(ad); biten++; if (ilerleme) ilerleme(biten / adlar.length); coz(); };
            im.onerror = function () { console.error('kdTuval görsel yok', ad); biten++; if (ilerleme) ilerleme(biten / adlar.length); coz(); };
            if (/^https?:/.test(liste[ad])) im.crossOrigin = 'anonymous';   // dış medya kaynağı: doku için izin gerekir
            im.src = liste[ad];
          });
        }));
      },
      boyut: function (ad) { var i = resim[ad]; return i ? { g: i.naturalWidth, h: i.naturalHeight } : { g: 1, h: 1 }; },
      /* görünen boyuta göre tuval çözünürlüğü; yavaş cihazda kendiliğinden düşer */
      olcekle: function (gorunen) {
        var dpr = Math.min(window.devicePixelRatio || 1, 2), hedef = Math.min(1, Math.max(0.5, gorunen * dpr / GEN)) * olcek;
        var g = Math.round(GEN * Math.max(hedef, 0.5)), h = Math.round(g * 9 / 16);
        if (canvas.width !== g) { canvas.width = g; canvas.height = h; }
      },
      sureBildir: function (ms) {
        kareler++; sayac += ms;
        if (kareler < 90) return;
        var ort = sayac / kareler; kareler = 0; sayac = 0;
        if (ort > 34 && olcek > 0.6) olcek -= 0.15;
      },
      /* sahne noktasının ekrandaki yeri: yazılar kamerayla birlikte gitsin */
      ekran: function (x, y, d) {
        d = d == null ? 1 : d;
        var z = 1 + (kam.z - 1) * d;
        return { x: (x - 800 - (kam.x - 800) * d) * z + 800, y: (y - 450 - (kam.y - 450) * d) * z + 450 };
      },
      /* kameranın sahne ortasında değişmesi: iki bölüm üst üste binerken */
      bas2: function (kamera) { kam = kameraSinir(kamera); },
      bas: function (t, kamera) {
        zaman = t % 400; kam = kameraSinir(kamera || { x: 800, y: 450, z: 1 });
        if (gl) {
          gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0.07, 0.09, 0.2, 1); gl.clear(gl.COLOR_BUFFER_BIT);
          gl.useProgram(ana); gl.uniform2f(iu.olcu, GEN, YUK); gl.uniform1i(iu.t0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, kafes);
          var yer = gl.getAttribLocation(ana, 'p'); gl.enableVertexAttribArray(yer); gl.vertexAttribPointer(yer, 2, gl.FLOAT, false, 0, 0);
        } else if (c2) { c2.setTransform(1, 0, 0, 1, 0, 0); c2.fillStyle = '#121733'; c2.fillRect(0, 0, canvas.width, canvas.height); }
      },
      ciz: function (ad, o) {
        var bilgi = resim[ad]; if (!bilgi) return;
        o = o || {};
        var kure = o.kure;
        if (kure && !gl && kure.yedek && resim[kure.yedek]) { bilgi = resim[kure.yedek]; kure = { duz: true }; }
        var saydam = o.o == null ? 1 : o.o; if (saydam <= 0.002) return;
        var og = bilgi.naturalWidth, oh = bilgi.naturalHeight;
        var g = o.g || (o.h ? o.h * og / oh : og), h = o.h || (o.g ? o.g * oh / og : oh);
        if (kure && !kure.duz) h = g;   // harita küre olarak kare içine çizilir
        var s = o.s == null ? 1 : o.s, ax = o.ax == null ? 0.5 : o.ax, ay = o.ay == null ? 0.5 : o.ay;
        var d = o.d == null ? 1 : o.d;                               // 0: ekrana yapışık
        var z = 1 + (kam.z - 1) * d, kx = (kam.x - 800) * d, ky = (kam.y - 450) * d;
        var x = (o.x == null ? 800 : o.x), y = (o.y == null ? 450 : o.y);
        var sx = (x - 800 - kx) * z + 800, sy = (y - 450 - ky) * z + 450;
        var r = (o.r || 0) * Math.PI / 180, co = Math.cos(r), si = Math.sin(r);
        var gg = g * s * z, hh = h * s * z;
        if (!gl) {
          if (!c2) return;
          var kk = canvas.width / GEN;
          var gs = o.gecis ? (o.gecis.ac ? o.gecis.k : 1 - o.gecis.k) : 1;
          c2.save(); c2.scale(kk, kk); c2.globalAlpha = saydam * gs; c2.translate(sx, sy); c2.rotate(r);
          if (kure) { c2.beginPath(); c2.arc((0.5 - ax) * gg, (0.5 - ay) * hh, Math.min(gg, hh) / 2, 0, 7); c2.clip(); }
          c2.drawImage(bilgi, -ax * gg, -ay * hh, gg, hh); c2.restore();
          return;
        }
        var t = tex[ad]; if (!t) return;
        // kare (0..1) → sahne pikseli
        var m = [gg * co, gg * si, 0, -hh * si, hh * co, 0, sx - ax * gg * co + ay * hh * si, sy - ax * gg * si - ay * hh * co, 1];
        gl.uniformMatrix3fv(iu.m, false, m);
        gl.uniform4f(iu.buk, (o.buk || 0) / g, (o.sal || 0) / g, o.faz || 0, zaman);
        var c = o.carp || [1, 1, 1], e = o.ekle || [0, 0, 0];
        gl.uniform4f(iu.carp, c[0], c[1], c[2], saydam);
        gl.uniform3f(iu.ekle, e[0], e[1], e[2]);
        gl.uniform1f(iu.doy, o.doy == null ? 1 : o.doy);
        gl.uniform4f(iu.etki, o.parilti || 0, o.su || 0, o.ruzgar || 0, zaman);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t.t);
        var gc = o.gecis;
        if (gc) gl.uniform4f(iu.gec, gc.k, gc.yumusak || 0.09, gc.ac ? 2 : 1, gc.yon == null ? 0 : gc.yon);
        else gl.uniform4f(iu.gec, 0, 0, 0, 0);
        if (kure) {
          var gy = kure.gunes || [1, 0, 0], gb = Math.hypot(gy[0], gy[1], gy[2]) || 1;
          gl.uniform4f(iu.kure, kure.duz ? 2 : 1, kure.boylam || 0, kure.egim || 0, kure.bakis || 0);
          gl.uniform4f(iu.kure2, gy[0] / gb, gy[1] / gb, gy[2] / gb, kure.isik == null ? 0.9 : kure.isik);
          gl.uniform1f(iu.kgece, kure.gece == null ? 1 : kure.gece);
        } else gl.uniform4f(iu.kure, 0, 0, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, kafesN);
      },
      /* Parçacık: yuvarlak ya da uzun ince (rx ≠ ry, a açısı). Tek çağrıda toplu çizilir. */
      iz: function (x, y, rx, ry, a, r, g, b, o) {
        if (!gl) { if (c2) { var k = canvas.width / GEN; c2.save(); c2.scale(k, k); c2.globalAlpha = Math.min(1, o); c2.fillStyle = 'rgb(' + (r * 255 | 0) + ',' + (g * 255 | 0) + ',' + (b * 255 | 0) + ')'; c2.beginPath(); c2.ellipse(x, y, rx, ry, a, 0, 7); c2.fill(); c2.restore(); } return; }
        if (izN >= 900) return;
        var co = Math.cos(a), si = Math.sin(a), n = izN * 48, v = izVeri;
        var kos = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
        for (var i = 0; i < 6; i++) {
          var u = kos[i][0], w = kos[i][1], px = u * rx, py = w * ry;
          v[n++] = x + px * co - py * si; v[n++] = y + px * si + py * co;
          v[n++] = u; v[n++] = w; v[n++] = r; v[n++] = g; v[n++] = b; v[n++] = o;
        }
        izN++;
      },
      izBitir: function () {
        if (!gl || !izN) { izN = 0; return; }
        gl.useProgram(iz); gl.uniform2f(izu.olcu, GEN, YUK);
        gl.bindBuffer(gl.ARRAY_BUFFER, izTampon);
        gl.bufferData(gl.ARRAY_BUFFER, izVeri.subarray(0, izN * 48), gl.DYNAMIC_DRAW);
        var p = gl.getAttribLocation(iz, 'p'), u = gl.getAttribLocation(iz, 'u'), r = gl.getAttribLocation(iz, 'r');
        gl.enableVertexAttribArray(p); gl.enableVertexAttribArray(u); gl.enableVertexAttribArray(r);
        gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 32, 0);
        gl.vertexAttribPointer(u, 2, gl.FLOAT, false, 32, 8);
        gl.vertexAttribPointer(r, 4, gl.FLOAT, false, 32, 16);
        gl.drawArrays(gl.TRIANGLES, 0, izN * 6);
        gl.disableVertexAttribArray(u); gl.disableVertexAttribArray(r);
        izN = 0;
        gl.useProgram(ana); gl.bindBuffer(gl.ARRAY_BUFFER, kafes);
        var yer = gl.getAttribLocation(ana, 'p'); gl.enableVertexAttribArray(yer); gl.vertexAttribPointer(yer, 2, gl.FLOAT, false, 0, 0);
      },
      temizle: function () {
        Object.keys(tex).forEach(function (ad) { if (gl) gl.deleteTexture(tex[ad].t); });
        tex = {}; resim = {};
        var u = gl && gl.getExtension('WEBGL_lose_context'); if (u) u.loseContext();
        canvas.remove();
      }
    };
    return api;
  };

  /* Haritadaki bir noktanın (enlem, boylam; radyan) dönen kürede ekrandaki yeri; ön: izleyene bakıyorsa > 0.
     Gölgelendiricideki dönüşümün tersidir: önce bakış açısı, sonra ekrandaki eğim. */
  DO.KdTuval.kureNokta = function (cx, cy, R, en, bo, k) {
    k = k || {};
    var d = bo - (k.boylam || 0), bx = Math.cos(en) * Math.sin(d), by = Math.sin(en), bz = Math.cos(en) * Math.cos(d);
    var cb = Math.cos(k.bakis || 0), sb = Math.sin(k.bakis || 0), ce = Math.cos(k.egim || 0), se = Math.sin(k.egim || 0);
    var y1 = by * cb - bz * sb, z1 = by * sb + bz * cb;
    return { x: cx + R * (bx * ce + y1 * se), y: cy - R * (-bx * se + y1 * ce), on: z1 };
  };
})();
