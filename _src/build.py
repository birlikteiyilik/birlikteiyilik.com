#!/usr/bin/env python3
"""
Birlikte İyilik Akademi — Statik Site Üreticisi (SSG)
Jinja2 şablonlarını JSON içeriklerle birleştirip dist/ altına statik HTML üretir.
"""

import json
import os
import re
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

# ── Paths ──
BASE_DIR = Path(__file__).parent
REPO_DIR = BASE_DIR.parent
TEMPLATES_DIR = BASE_DIR / "templates"
CONTENT_DIR = REPO_DIR / "content"
STATIC_DIR = BASE_DIR / "static"
DIST_DIR = BASE_DIR / "dist"
SITE_URL = "https://birlikteiyilik.com"

# ── Turkish character map ──
TR_MAP = str.maketrans({
    'ş': 's', 'Ş': 's', 'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ü': 'u', 'Ü': 'u',
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g',
    'â': 'a', 'Â': 'a', 'î': 'i', 'Î': 'i',
    'û': 'u', 'Û': 'u',
})

TR_MONTHS = [
    '', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]


def slugify(text):
    """Türkçe karakter destekli slug üretici."""
    text = text.lower().translate(TR_MAP)
    text = unicodedata.normalize('NFKD', text)
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text).strip('-')
    return text


def tr_date(date_str):
    """ISO tarihini Türkçe formata çevirir: '2025-03-15' → '15 Mart 2025'"""
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        return f"{dt.day} {TR_MONTHS[dt.month]} {dt.year}"
    except (ValueError, IndexError):
        return date_str


def truncate_words(text, n=30):
    """Kelime bazlı kesme."""
    words = text.split()
    if len(words) <= n:
        return text
    return ' '.join(words[:n]) + '...'


def strip_html(html_text):
    """HTML etiketlerini temizler."""
    return re.sub(r'<[^>]+>', '', html_text or '')


def load_content():
    """content/ altındaki tüm JSON dosyalarını yükler."""
    data = {}
    for f in CONTENT_DIR.glob('*.json'):
        with open(f, 'r', encoding='utf-8') as fh:
            data[f.stem] = json.load(fh)
    return data


def build_site(base_path=''):
    """Ana derleme fonksiyonu. base_path: alt dizin prefix'i (ör. '/birlikteiyilik-v2')"""
    print("🔨 Birlikte İyilik Akademi sitesi derleniyor...")

    # Temizle ve yeniden oluştur
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True)

    # Statik dosyaları kopyala
    if STATIC_DIR.exists():
        shutil.copytree(STATIC_DIR, DIST_DIR, dirs_exist_ok=True)

    # İçerikleri yükle
    content = load_content()

    # Jinja2 ortamı
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(['html']),
        trim_blocks=True,
        lstrip_blocks=True,
    )

    # Özel filtreler
    env.filters['slugify'] = slugify
    env.filters['tr_date'] = tr_date
    env.filters['truncate_words'] = truncate_words
    env.filters['strip_html'] = strip_html

    # Global context
    ctx = {
        'site': content.get('site', {}),
        'nav': content.get('navigation', {}),
        'programs': content.get('programs', []),
        'news': content.get('news', []),
        'events': content.get('events', []),
        'articles': content.get('articles', []),
        'videos': content.get('videos', []),
        'faq': content.get('faq', []),
        'team': content.get('team', []),
        'stories': content.get('success-stories', []),
        'homepage': content.get('homepage', {}),
        'site_url': SITE_URL,
        'base': base_path,
        'noindex': bool(base_path),
        'now': datetime.now().strftime('%Y-%m-%d'),
    }

    page_count = 0

    # ── 1) Statik sayfalar ──
    pages_dir = TEMPLATES_DIR / "pages"
    for template_path in pages_dir.rglob('*.html'):
        rel = template_path.relative_to(TEMPLATES_DIR)
        template = env.get_template(str(rel))

        # Çıktı yolu: pages/index.html → dist/index.html
        out_rel = str(rel).replace('pages/', '', 1)
        if out_rel.endswith('/index.html') or out_rel == 'index.html':
            out_path = DIST_DIR / out_rel
        else:
            # hakkimizda.html → dist/hakkimizda/index.html
            name = out_rel.replace('.html', '')
            out_path = DIST_DIR / name / 'index.html'

        out_path.parent.mkdir(parents=True, exist_ok=True)

        # Sayfa bazlı context — canonical URL için temiz yol hesapla
        clean_path = str(out_path.relative_to(DIST_DIR)).replace('index.html', '').rstrip('/')
        page_ctx = {**ctx, 'current_path': '/' + clean_path if clean_path else '/'}
        html = template.render(**page_ctx)
        out_path.write_text(html, encoding='utf-8')
        page_count += 1

    # ── 2) Yazı detay sayfaları ──
    if 'articles' in content and content['articles']:
        detail_tpl = env.get_template('detail/yazi.html')
        for article in content['articles']:
            slug = article.get('slug', slugify(article.get('title', '')))
            out_path = DIST_DIR / 'yazilar' / slug / 'index.html'
            out_path.parent.mkdir(parents=True, exist_ok=True)
            page_ctx = {**ctx, 'article': article, 'current_path': f'/yazilar/{slug}'}
            html = detail_tpl.render(**page_ctx)
            out_path.write_text(html, encoding='utf-8')
            page_count += 1

    # ── 3) Haber detay sayfaları ──
    if 'news' in content and content['news']:
        detail_tpl = env.get_template('detail/haber.html')
        for item in content['news']:
            slug = item.get('slug', slugify(item.get('title', '')))
            out_path = DIST_DIR / 'haberler' / slug / 'index.html'
            out_path.parent.mkdir(parents=True, exist_ok=True)
            page_ctx = {**ctx, 'item': item, 'current_path': f'/haberler/{slug}'}
            html = detail_tpl.render(**page_ctx)
            out_path.write_text(html, encoding='utf-8')
            page_count += 1

    # ── 4) sitemap.xml ──
    # Jinja2'den üretilen + repo root'taki statik HTML sayfalar
    SITEMAP_EXCLUDE = {'yonetim', '404', '_src', 'node_modules', '.git'}
    STATIC_SCAN_DIRS = ['hakkimizda', 'egitimler', 'basvurular', 'destek-ol']
    sitemap_entries = set()

    # 4a) dist/ içinden Jinja2-üretilen sayfaları ekle
    for html_file in DIST_DIR.rglob('*.html'):
        rel = html_file.relative_to(DIST_DIR)
        rel_str = str(rel)
        if any(ex in rel_str for ex in SITEMAP_EXCLUDE):
            continue
        url_path = rel_str.replace('index.html', '').rstrip('/')
        if not url_path:
            url_path = ''
        sitemap_entries.add(f"{SITE_URL}/{url_path}")

    # 4b) Repo root'taki statik klasörlerden index.html'leri ekle
    for sub in STATIC_SCAN_DIRS:
        sub_path = REPO_DIR / sub
        if not sub_path.exists():
            continue
        for html_file in sub_path.rglob('index.html'):
            rel = html_file.relative_to(REPO_DIR)
            rel_str = str(rel)
            if any(ex in rel_str for ex in SITEMAP_EXCLUDE):
                continue
            if ' 2/' in rel_str or ' 2.' in rel_str:
                continue
            url_path = rel_str.replace('index.html', '').rstrip('/')
            if not url_path:
                url_path = ''
            sitemap_entries.add(f"{SITE_URL}/{url_path}")

    sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap_xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for url in sorted(sitemap_entries):
        sitemap_xml += f'  <url>\n    <loc>{url}</loc>\n    <lastmod>{ctx["now"]}</lastmod>\n  </url>\n'
    sitemap_xml += '</urlset>\n'
    (DIST_DIR / 'sitemap.xml').write_text(sitemap_xml, encoding='utf-8')
    print(f"✅ sitemap.xml: {len(sitemap_entries)} URL")

    # ── 5) robots.txt ──
    if base_path:
        robots = "User-agent: *\nDisallow: /\n\n# Staging ortami — domain tasinana kadar indeksleme kapali.\n"
    else:
        robots = f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n"
    (DIST_DIR / 'robots.txt').write_text(robots, encoding='utf-8')

    # ── 6) Base path post-processing ──
    if base_path:
        escaped_base = re.escape(base_path.lstrip('/'))
        for html_file in DIST_DIR.rglob('*.html'):
            text = html_file.read_text(encoding='utf-8')
            # href="/xxx" → href="/base/xxx" (skip already-prefixed and anchor-only URLs)
            text = re.sub(r'href="(/(?!' + escaped_base + r'))', f'href="{base_path}\\1', text)
            text = re.sub(r'src="(/(?!' + escaped_base + r'))', f'src="{base_path}\\1', text)
            html_file.write_text(text, encoding='utf-8')
        print(f"✅ Base path '{base_path}' uygulandı")

    print(f"✅ {page_count} sayfa üretildi → dist/")
    print(f"✅ sitemap.xml ve robots.txt oluşturuldu")

    # ── 7) Üretilen HTML'leri repo root'a kopyala (Vercel root'tan serve eder) ──
    if not base_path:
        copy_count = 0
        for src_file in DIST_DIR.rglob('*'):
            if src_file.is_file():
                rel = src_file.relative_to(DIST_DIR)
                dest = REPO_DIR / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_file, dest)
                copy_count += 1
        print(f"✅ {copy_count} dosya repo root'a kopyalandı")


if __name__ == '__main__':
    import sys
    # --base /birlikteiyilik-v2 for subdirectory deploy
    base = ''
    if '--base' in sys.argv:
        idx = sys.argv.index('--base')
        if idx + 1 < len(sys.argv):
            base = sys.argv[idx + 1].rstrip('/')
    # --output ../birlikteiyilik-v2 to override DIST_DIR
    if '--output' in sys.argv:
        idx = sys.argv.index('--output')
        if idx + 1 < len(sys.argv):
            DIST_DIR = Path(sys.argv[idx + 1])
    build_site(base_path=base)
