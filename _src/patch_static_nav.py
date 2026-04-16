#!/usr/bin/env python3
"""
Eski statik HTML sayfalarındaki nav başlığını günceller:
1. nav-logo img → nav-logo-img class + nav-logo-name span
2. Uygulama indirme banner'ı ekler (appBanner)
"""

import os
import sys
from pathlib import Path

REPO = Path(__file__).parent.parent

OLD_NAV_LOGO = '''    <a href="/" class="nav-logo" aria-label="Birlikte Iyilik Akademi Ana Sayfa">
      <img src="/images/logo_icon.png" alt="Birlikte Iyilik Akademi">
    </a>'''

NEW_NAV_LOGO = '''    <a href="/" class="nav-logo" aria-label="Birlikte İyilik Akademi Ana Sayfa">
      <img src="/images/logo_icon.png" alt="" class="nav-logo-img" aria-hidden="true">
      <span class="nav-logo-name">BİRLİKTE İYİLİK AKADEMİ</span>
    </a>'''

APP_BANNER_HTML = '''  <!-- App Download Banner -->
  <div id="appBanner" class="app-banner" role="banner" aria-label="Uygulama indirme bandı">
    <div class="app-banner-inner">
      <div class="app-banner-logo">
        <img src="/images/logo_icon.png" alt="" class="app-banner-logo-icon" aria-hidden="true">
        <span class="app-banner-logo-text">BİRLİKTE İYİLİK AKADEMİ</span>
      </div>
      <span class="app-banner-sep" aria-hidden="true"></span>
      <span class="app-banner-tagline">Uygulamayı ücretsiz indir!</span>
      <div class="app-banner-btns">
        <a href="https://play.google.com/store/apps/details?id=com.biri.uygulamasi&hl=tr" class="app-banner-btn app-banner-btn-gp" target="_blank" rel="noopener" data-track="click_banner_googleplay" aria-label="Google Play&#39;den indir">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.18 23.76c.39.22.83.24 1.24.07l11.37-6.57-2.54-2.54-10.07 9.04zm-1.43-19.9A1.5 1.5 0 001.5 5v14a1.5 1.5 0 00.25.84l.1.1 7.84-7.84v-.19L1.85 4.06l-.1.1zm16.24 8.28l-2.32-1.34-2.85 2.85 2.85 2.85 2.35-1.36a1.67 1.67 0 000-3.0zm-14.8-9.03l10.07 9.04 2.54-2.54L4.42.25C4 .07 3.57.1 3.18.32L1.99 3.11z"/></svg>
          Google Play
        </a>
        <a href="https://apps.apple.com/us/app/birlikte-i-yilik-akademi/id1576298699" class="app-banner-btn app-banner-btn-as" target="_blank" rel="noopener" data-track="click_banner_appstore" aria-label="App Store&#39;dan indir">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          App Store
        </a>
      </div>
      <button class="app-banner-close" onclick="closeBanner()" aria-label="Bandı kapat">&times;</button>
    </div>
  </div>
  <style>
  .app-banner{background:#E20439;color:#fff;padding:9px 0;position:fixed;top:0;left:0;right:0;z-index:2000;border-bottom:1px solid rgba(0,0,0,0.12);}
  .app-banner-inner{max-width:1200px;margin:0 auto;padding:0 20px;display:flex;align-items:center;gap:16px;flex-wrap:nowrap;}
  .app-banner-logo{display:flex;align-items:center;gap:10px;flex-shrink:0;}
  .app-banner-logo-icon{width:34px;height:34px;object-fit:contain;filter:brightness(0) invert(1);}
  .app-banner-logo-text{font-family:'Inter',sans-serif;font-size:.82rem;font-weight:700;letter-spacing:.06em;color:#fff;white-space:nowrap;text-transform:uppercase;}
  .app-banner-sep{width:1px;height:22px;background:rgba(255,255,255,0.35);flex-shrink:0;}
  .app-banner-tagline{font-size:.8rem;opacity:.9;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .app-banner-btns{display:flex;gap:8px;flex-shrink:0;margin-left:auto;}
  .app-banner-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;font-size:.78rem;font-weight:600;text-decoration:none;transition:opacity .2s,transform .1s;white-space:nowrap;}
  .app-banner-btn:hover{opacity:.9;transform:translateY(-1px);}
  .app-banner-btn-gp{background:#fff;color:#E20439;}
  .app-banner-btn-as{background:rgba(255,255,255,0.15);color:#fff;border:1.5px solid rgba(255,255,255,0.55);}
  .app-banner-close{background:none;border:none;color:rgba(255,255,255,0.65);font-size:1.4rem;cursor:pointer;padding:0 2px;margin-left:8px;flex-shrink:0;line-height:1;transition:color .2s;}
  .app-banner-close:hover{color:#fff;}
  @media(max-width:700px){
    .app-banner-sep,.app-banner-tagline{display:none;}
    .app-banner-logo-text{font-size:.72rem;}
    .app-banner-btn{padding:5px 10px;font-size:.72rem;}
  }
  </style>
  <script>
  (function(){
    var b=document.getElementById('appBanner');
    if(!b)return;
    if(localStorage.getItem('appBannerClosed')==='1'){b.style.display='none';return;}
    function _applyOffset(){
      var h=b.offsetHeight;
      var nav=document.querySelector('.site-nav');
      var main=document.getElementById('main-content');
      if(nav)nav.style.top=h+'px';
      if(main)main.style.paddingTop=(72+h)+'px';
    }
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',_applyOffset);}
    else{_applyOffset();}
  })();
  function closeBanner(){
    var b=document.getElementById('appBanner');
    var nav=document.querySelector('.site-nav');
    var main=document.getElementById('main-content');
    if(b){b.style.transition='opacity .25s';b.style.opacity='0';
      setTimeout(function(){
        b.style.display='none';
        if(nav){nav.style.transition='top .2s ease';nav.style.top='0';}
        if(main){main.style.transition='padding-top .2s ease';main.style.paddingTop='72px';}
      },260);
    }
    localStorage.setItem('appBannerClosed','1');
  }
  </script>'''

SKIP_LINK = '  <a href="#main-content" class="skip-link">Ana içeriğe geç</a>'

# Directories/files to skip
SKIP_DIRS = {'_src', '.git', 'yonetim', 'node_modules'}

def should_skip(path: Path) -> bool:
    parts = path.parts
    for skip in SKIP_DIRS:
        if skip in parts:
            return True
    return False

def patch_file(filepath: Path) -> bool:
    text = filepath.read_text(encoding='utf-8')
    modified = False

    # 1) Fix nav-logo img
    if OLD_NAV_LOGO in text:
        text = text.replace(OLD_NAV_LOGO, NEW_NAV_LOGO)
        modified = True

    # 2) Add app banner if not already present
    if 'id="appBanner"' not in text and SKIP_LINK in text:
        # Insert banner after skip link
        text = text.replace(
            SKIP_LINK + '\n',
            SKIP_LINK + '\n\n' + APP_BANNER_HTML + '\n'
        )
        modified = True

    if modified:
        filepath.write_text(text, encoding='utf-8')
        print(f'  ✅ {filepath.relative_to(REPO)}')
    return modified

def main():
    count = 0
    for html_file in sorted(REPO.rglob('index.html')):
        if should_skip(html_file):
            continue
        # Only patch files with old nav-logo OR missing banner
        text = html_file.read_text(encoding='utf-8')
        needs_nav = OLD_NAV_LOGO in text
        needs_banner = 'id="appBanner"' not in text and SKIP_LINK in text
        if needs_nav or needs_banner:
            if patch_file(html_file):
                count += 1

    print(f'\n✅ {count} dosya güncellendi.')

if __name__ == '__main__':
    main()
