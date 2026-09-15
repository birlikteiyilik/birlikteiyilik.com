'use strict';
const events = [
  {
    "id": "nuh",
    "n": "01",
    "name": "Nuh Albayrak",
    "month": "Ekim",
    "field": "Güncel meseleler · Medya",
    "title": "Gençlik, Medya ve Değişen Dünya",
    "description": "Haberin hızlandığı, yorumun çoğaldığı bir dünyada neye, nasıl bakıyoruz? Medyayı ve güncel meseleleri gençlerin sorularıyla birlikte tartacağımız bir buluşma.",
    "topics": [
      "Haber ile yorum arasındaki fark",
      "Değişen dünyada gençlerin bakışı",
      "Bilgi karşısında kendi ölçünü kurmak"
    ]
  },
  {
    "id": "hayati",
    "n": "02",
    "name": "Hayati İnanç",
    "month": "Ekim",
    "field": "Edebiyat · İnsan",
    "title": "İnsan, Edebiyat ve Hayata Dair",
    "description": "Bir beyit bugünün insanına ne söyler? Edebiyatın insanı anlama gücünden yola çıkarak sözü, anlamı ve hayatı birlikte düşüneceğimiz bir buluşma.",
    "topics": [
      "Edebiyatın hayata açtığı pencereler",
      "Bir beyitte saklı insan tecrübesi",
      "Sözün anlamı ve hayattaki karşılığı"
    ]
  },
  {
    "id": "ahmet",
    "n": "03",
    "name": "Ahmet Şimşirgil",
    "month": "Kasım",
    "field": "Tarih · Medeniyet",
    "title": "Tarihten Bugüne: Nereden Geldik, Nereye Gidiyoruz?",
    "description": "Geçmişe bakmak, bugünü anlamak için nasıl bir imkân sunar? Tarih ve medeniyet üzerine gençlerin sorularını merkeze alan bir buluşma.",
    "topics": [
      "Geçmiş ile bugün arasında bağ kurmak",
      "Tarih okurken sorulması gereken sorular",
      "Medeniyet birikimi ve gelecek fikri"
    ]
  },
  {
    "id": "ramazan",
    "n": "04",
    "name": "Ramazan Ayvallı",
    "month": "Kasım",
    "field": "İlim · Kültür · Tecrübe",
    "title": "İlim, Kültür ve Hayatın İçinden",
    "description": "Bilgi, kültür ve hayat tecrübesi birbirini nasıl besler? Öğrenmenin ve birikimi hayata taşımanın anlamı üzerine bir buluşma.",
    "topics": [
      "Öğrenmenin hayat boyu süren yolculuğu",
      "Kültür ile gündelik hayat arasındaki bağ",
      "Tecrübeden gençliğe kalan ölçüler"
    ]
  }
];
const dialog = document.querySelector('#event-dialog');
let lastTrigger;
function showEvent(id, trigger) {
  const item = events.find(event => event.id === id);
  if (!item) return;
  lastTrigger = trigger;
  document.querySelector('#dialog-name').textContent = item.name;
  document.querySelector('#dialog-meta').textContent = 'MİHENK #' + item.n + ' · ' + item.month + ' 2026';
  document.querySelector('#dialog-title').textContent = item.title;
  document.querySelector('#dialog-description').textContent = item.description;
  document.querySelector('#dialog-poster').src = '/mihenk/assets/' + item.id + '.webp';
  document.querySelector('#dialog-poster').alt = item.name + ' — ' + item.title;
  document.querySelector('#dialog-download').href = '/mihenk/assets/' + item.id + '.png';
  document.querySelector('#dialog-download').download = 'mihenk-' + item.n + '-' + item.id + '.png';
  const list = document.querySelector('#dialog-topics');
  list.replaceChildren(...item.topics.map(text => {
    const li = document.createElement('li'); li.textContent = text; return li;
  }));
  dialog.showModal();
  clearTimeout(autoTimer);
  document.body.classList.add('dialog-open');
}
document.querySelectorAll('[data-event]').forEach(button => {
  button.addEventListener('click', () => showEvent(button.dataset.event, button));
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  lastTrigger?.focus({preventScroll:true});
});

const preference = matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.querySelector('#motion-toggle');
let motionStopped = preference.matches;
let scrollFrame = 0;
const running = new Set();
const easing = 'cubic-bezier(.16,1,.3,1)';
function play(element, frames, options = {}) {
  if (motionStopped || !element || !element.animate) return;
  const animation = element.animate(frames, {duration:850, easing, ...options});
  running.add(animation);
  animation.finished.then(() => running.delete(animation)).catch(() => running.delete(animation));
}
function syncMotion() {
  document.documentElement.classList.toggle('motion-off', motionStopped);
  toggle.setAttribute('aria-pressed', String(motionStopped));
  toggle.textContent = motionStopped ? 'Hareketi aç' : 'Hareketi durdur';
  if (motionStopped) {
    running.forEach(animation => animation.cancel());
    running.clear();
  }
}
toggle.addEventListener('click', () => {motionStopped = !motionStopped; syncMotion(); updateFlow();});
preference.addEventListener('change', event => {motionStopped = event.matches; syncMotion(); updateFlow();});
syncMotion();
const seen = new WeakSet();
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting || seen.has(entry.target)) continue;
    seen.add(entry.target);
    const order = entry.target.matches('.event,.flow-step') ? Array.from(entry.target.parentElement.children).indexOf(entry.target) : 0;
    play(entry.target, [{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}], {delay:Math.min(order*70,210)});
    observer.unobserve(entry.target);
  }
},{threshold:.1});
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
document.fonts.ready.then(() => {
  play(document.querySelector('.hero-wordmark'), [{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}], {duration:1000});
  play(document.querySelector('.hero-copy'), [{opacity:0,transform:'translateY(15px)'},{opacity:1,transform:'translateY(0)'}], {delay:150});
  play(document.querySelector('.hero-art'), [{opacity:0,transform:'translateY(25px)'},{opacity:1,transform:'translateY(0)'}], {delay:250,duration:1100});
});

// Predecoded imagery and a coalesced input queue avoid cutting off a transition.
const hero = document.querySelector('.hero');
const showcase = document.querySelector('.showcase');
const stage = document.querySelector('.poster-stage');
const stageButton = document.querySelector('.stage-poster');
const stageImage = stageButton.querySelector('img');
const curtain = document.querySelector('.theme-curtain');
let activeSlide = 0;
let slideAnimations = [];
let slideBusy = false;
let queuedDirection = 0;
const slideImages = events.map(item => {
  const img = new Image(); img.src = '/mihenk/assets/' + item.id + '.webp';
  img.decode().catch(() => {});
  return img;
});
function slideAnimation(el, frames, options) {
  if (motionStopped) return null;
  const a = el.animate(frames, {duration:850,easing,...options});
  running.add(a); slideAnimations.push(a);
  a.finished.finally(() => running.delete(a)).catch(() => {});
  return a;
}
async function changeSlide(direction) {
  clearTimeout(autoTimer);
  if(slideBusy) {queuedDirection = direction;return;}
  slideBusy = true;
  const next = (activeSlide + direction + events.length) % events.length;
  showcase.classList.add('is-transitioning');
  slideAnimations = [];
  const caption = document.querySelector('#slide-caption');
  const ghost = stageImage.cloneNode();
  ghost.className='poster-ghost';ghost.alt='';ghost.setAttribute('aria-hidden','true');
  if(!motionStopped) stage.append(ghost);
  activeSlide = next;
  const item = events[activeSlide];
  hero.dataset.theme = item.id;
  stageButton.dataset.event = item.id;
  stageButton.setAttribute('aria-label',item.name + ' buluşma ayrıntıları');
  stageImage.src = '/mihenk/assets/' + item.id + '.webp'; stageImage.alt = item.name + ' — ' + item.title;
  document.querySelector('#slide-number').textContent = item.n;
  document.querySelector('#slide-month').textContent = item.month + ' 2026';
  document.querySelector('#slide-field').textContent = item.field;
  document.querySelector('#slide-name').textContent = item.name;
  const details = document.querySelector('#slide-details');
  details.dataset.event = item.id; details.setAttribute('aria-label',item.name + ' ayrıntıları');
  document.querySelector('.slide-progress span').style.transform = 'translateX(' + activeSlide*100 + '%)';
  if (!motionStopped) {
    slideAnimation(ghost,[{transform:'translateX(0)',opacity:1},{transform:'translateX(' + -direction*24 + 'px)',opacity:0}],{duration:620,fill:'forwards'});
    const enter = slideAnimation(stageImage,[{transform:'translateX(' + direction*24 + 'px)',opacity:.25},{transform:'translateX(0)',opacity:1}],{duration:620});
    slideAnimation(caption,[{opacity:.4,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:500});
    await enter.finished.catch(() => {});
  }
  curtain.style.visibility = 'hidden';
  ghost.remove();
  slideAnimations.forEach(a => a.cancel());slideAnimations = [];
  showcase.classList.remove('is-transitioning');
  slideBusy = false;
  if(queuedDirection) {const queued=queuedDirection;queuedDirection=0;changeSlide(queued);}
  else scheduleAuto();
}
document.querySelector('#slide-next').addEventListener('click', () => changeSlide(1));
document.querySelector('#slide-prev').addEventListener('click', () => changeSlide(-1));
showcase.addEventListener('keydown',event => {
  if(event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault(); changeSlide(event.key === 'ArrowRight' ? 1 : -1);
  }
});
let touchStart;
stage.addEventListener('touchstart',event => {touchStart = {x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});
stage.addEventListener('touchend',event => {
  if(!touchStart) return;
  const dx = event.changedTouches[0].clientX-touchStart.x;
  const dy = event.changedTouches[0].clientY-touchStart.y;
  if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.4) changeSlide(dx<0?1:-1);
  touchStart = null;
},{passive:true});
stage.addEventListener('touchcancel',() => {touchStart=null;},{passive:true});

// Rendered Remotion film. Native modal gives Escape, focus containment and an
// explicit skip; a blocked/slow video can never prevent entering the website.
const intro = document.querySelector('#brand-intro');
const film = document.querySelector('#brand-film');
const skipIntro = document.querySelector('#skip-intro');
const replay = document.querySelector('#replay-intro');
let introTimer;
let introTrigger;
let introExit;
function closeIntro() {
  clearTimeout(introTimer);
  introExit?.cancel(); introExit = null;
  film.pause();
  if(intro.open) intro.close();
  document.body.classList.remove('intro-playing');
}
intro.addEventListener('close',() => {
  clearTimeout(introTimer); film.pause();
  document.body.classList.remove('intro-playing');
  if(introTrigger) introTrigger.focus({preventScroll:true});
});
skipIntro.addEventListener('click',closeIntro);
film.addEventListener('ended',() => {
  clearTimeout(introTimer);
  if(motionStopped || !intro.open) {closeIntro();return;}
  introExit = intro.animate([{transform:'translateY(0)'},{transform:'translateY(-102%)'}],{duration:650,easing:'cubic-bezier(.76,0,.24,1)'});
  introExit.finished.then(closeIntro).catch(() => {});
});
film.addEventListener('error',closeIntro);
film.addEventListener('playing',() => {clearTimeout(introTimer);introTimer=setTimeout(closeIntro,6500);});
preference.addEventListener('change',event => {if(event.matches) closeIntro();});
toggle.addEventListener('click',() => {if(motionStopped) closeIntro();});
async function startIntro(explicit=false) {
  if(!explicit && (motionStopped || location.hash)) return;
  introTrigger = explicit ? replay : null;
  if(explicit) intro.dataset.replay = 'true'; else delete intro.dataset.replay;
  film.src = '/mihenk/assets/mihenk-opening.mp4'; film.currentTime = 0;
  intro.showModal(); document.body.classList.add('intro-playing');
  skipIntro.focus({preventScroll:true});
  introTimer = setTimeout(closeIntro,3000);
  try {await film.play();} catch {closeIntro();}
}
replay.addEventListener('click',() => startIntro(true));
let introSeen = false;
try {introSeen = sessionStorage.getItem('mihenk-intro-v2-seen') === '1';sessionStorage.setItem('mihenk-intro-v2-seen','1');} catch {}
if(!introSeen) startIntro();
addEventListener('pagehide',closeIntro);

// Accessible automatic rotation: a complete seven-second reading interval.
// Pause while inspecting, using the keyboard, reading a modal or in another tab.
const autoToggle = document.querySelector('#autoplay-toggle');
let autoPaused = false;
let autoTimer;
function scheduleAuto() {
  clearTimeout(autoTimer);
  const stopped = autoPaused || motionStopped;
  if(stopped) queuedDirection = 0;
  autoToggle.setAttribute('aria-pressed',String(stopped));
  autoToggle.setAttribute('aria-label',stopped ? 'Otomatik geçişi başlat' : 'Otomatik geçişi durdur');
  autoToggle.firstElementChild.textContent = stopped ? '▶' : 'Ⅱ';
  document.querySelector('.control-hint').textContent = stopped ? 'ELLE GEÇİŞ' : 'OTOMATİK · 7 SN';
  document.querySelector('#slide-caption').setAttribute('aria-live',stopped ? 'polite' : 'off');
  if(stopped || slideBusy || document.hidden || dialog.open || intro.open || stage.matches(':hover') || (showcase.matches(':focus-within') && document.activeElement !== autoToggle)) return;
  autoTimer = setTimeout(() => {
    if(autoPaused || motionStopped || dialog.open || intro.open || document.hidden || stage.matches(':hover') || (showcase.matches(':focus-within') && document.activeElement !== autoToggle)) scheduleAuto();
    else changeSlide(1);
  },7000);
}
autoToggle.addEventListener('click',() => {
  if(motionStopped) {motionStopped=false;syncMotion();autoPaused=false;} else autoPaused=!autoPaused;
  scheduleAuto();
});
stage.addEventListener('pointerenter',() => clearTimeout(autoTimer));
stage.addEventListener('pointerleave',scheduleAuto);
showcase.addEventListener('focusin',() => clearTimeout(autoTimer));
showcase.addEventListener('focusout',() => setTimeout(scheduleAuto,0));
document.addEventListener('visibilitychange',scheduleAuto);
dialog.addEventListener('close',scheduleAuto);
intro.addEventListener('close',scheduleAuto);
film.addEventListener('playing',() => clearTimeout(autoTimer));
toggle.addEventListener('click',scheduleAuto);
preference.addEventListener('change',scheduleAuto);
addEventListener('pagehide',() => clearTimeout(autoTimer));
scheduleAuto();
const flow = document.querySelector('.flow-track');
function updateFlow() {
  scrollFrame = 0;
  const rect = flow.getBoundingClientRect();
  const progress = motionStopped ? 1 : Math.max(0,Math.min(1,(innerHeight*.92 - rect.top)/(innerHeight*.5)));
  flow.firstElementChild.style.transform = 'scaleX(' + progress + ')';
}
function requestFlow() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateFlow); }
addEventListener('scroll', requestFlow, {passive:true});
addEventListener('resize', requestFlow, {passive:true});
updateFlow();
addEventListener('pagehide', () => {
  if(scrollFrame) cancelAnimationFrame(scrollFrame);
  running.forEach(animation => animation.cancel());
});
