"""Replace Wordwall activities that no longer open, in the curriculum data and the published PDFs.

Requires PyMuPDF. Run from any folder: python3 scripts/replace-wordwall-links.py
Each entry names the topic, the link printed in the PDF (and its target, when it differs), and the
activities that take its place: the main suggestion first, then any extra option. The materials text
and link list of the topic are updated, and in the PDF the old link text, underline and link area are
replaced in the same table cell. Running it again changes nothing.
"""
import hashlib
import json
from collections import Counter
from pathlib import Path
import re

import pymupdf as fitz

PUBLIC = Path(__file__).resolve().parents[1] / 'public'
DELETED = 'https://wordwall.net/tr/resource/28325043'
FRIENDS = 'https://wordwall.net/tr/resource/28323897'
SIBLINGS = 'https://wordwall.net/tr/resource/10789139/aile-oyunu/karde%C5%9Flik'

REPLACEMENTS = {
    '7-10': {
        9: (['https://wordwall.net/tr/resource/28326684'], [  # Kanaatkârlık
            'https://wordwall.net/tr/resource/80589610/evimizdeki-kaynaklar',
            'https://wordwall.net/es/resource/69834740/temel-ihtiya%C3%A7lar-ve-istekler']),
        10: (['https://wordwall.net/tr/resource/28326729'], [  # Emanete Riayet Etmek
            'https://wordwall.net/tr/resource/6085955/sosyal-beceri-kartlar%C4%B1',
            'https://wordwall.net/tr/resource/8999179/1-s%C4%B1n%C4%B1f-de%C4%9Ferler-e%C4%9Fitimi-kar%C4%B1%C5%9F%C4%B1k-sorular']),
        25: (['https://wordwall.net/tr-tr/community/konu%C5%9Fma-ileti%C5%9Fim-adab%C4%B1'], [  # Konuşma Adabı
            'https://wordwall.net/tr/resource/57703911/hayat-bilgisi/nezaket-ifadeleri']),
        27: ([DELETED], ['https://wordwall.net/tr/resource/35336535/evdeki-g%C3%B6rev-ve-sorumluluklarimiz']),  # Mesuliyet
        34: ([FRIENDS], ['https://wordwall.net/tr/resource/9852648/sevgi-sayg%C4%B1']),  # Sevgi
        35: ([FRIENDS], ['https://wordwall.net/resource/56408917/arkada%C5%9Fl%C4%B1k-dostluk']),  # Arkadaşlık ve Dostluk
        39: ([DELETED], ['https://wordwall.net/resource/73489025/t%C3%BCrk%C3%A7e/milli-ve-dini-bayramlar']),  # Millî / Dinî Değerler
        42: ([FRIENDS], ['https://wordwall.net/bg/resource/37787104/akraba']),  # Sıla-i Rahim
        55: ([SIBLINGS], ['https://wordwall.net/tr/resource/100098370/4-s%C4%B1n%C4%B1f-aile-i%C3%A7i-ileti%C5%9Fim']),  # Kardeşlik
    },
    '11-14': {
        16: ([SIBLINGS], [  # Kardeşlik
            'https://wordwall.net/id/resource/57993169/muhacir-ve-ensar-aras%C4%B1ndaki-karde%C5%9Flik-antla%C5%9Fmas%C4%B1']),
        18: ([DELETED], [  # Millî / Dinî Değerler
            'https://wordwall.net/resource/70514559/dini-k%C3%BClt%C3%BCr-ve-etik/temel-de%C4%9Ferlerimiz-6s%C4%B1n%C4%B1f',
            'https://wordwall.net/tr/resource/89880710/sosyal-bilgiler/k%C3%BClt%C3%BCrel-ba%C4%9Flar%C4%B1m%C4%B1z']),
        20: ([FRIENDS], ['https://wordwall.net/resource/83836795/insan-ili%C5%9Fkileri-sevgi-ve-sayg%C4%B1']),  # Sevgi
        22: ([FRIENDS], [  # Arkadaşlık ve Dostluk
            'https://wordwall.net/tr/resource/79821292/olumlu-olumsuz-arkada%C5%9Fl%C4%B1k-ili%C5%9Fkileri']),
        # Terbiye: the PDF prints ".../9718215a", which is what the book links to.
        25: (['https://wordwall.net/tr/resource/9718215a', 'https://wordwall.net/tr/resource/9718215'], [
            'https://wordwall.net/resource/27768041/adab-ve-nezaket-kurallar%C4%B1-tekrar-oyunu-5-s%C4%B1n%C4%B1f',
            'https://wordwall.net/tr/resource/88133149/g%C3%B6rg%C3%BC-ve-nezaket/g%C3%B6rg%C3%BC-kurallar%C4%B1-ve-nezaket-7-s%C4%B1n%C4%B1f']),
        28: ([DELETED], ['https://wordwall.net/tr/resource/89097948/ahilik-ve-lonca']),  # İş Ahlakı
        59: ([DELETED], ['https://wordwall.net/tr/resource/87214016/sosyal-bilgiler/hak-ve-sorumluluk']),  # Mesûliyet
    },
}

FONT = fitz.Font('tiro')  # Times-Roman, as in the earlier Vatan Sevgisi replacement.
LINK_BLUE = (0.0196, 0.388, 0.757)
ASCENT, DESCENT = 0.72, 0.22


def update_topic(topic, printed, target, new):
    materials = next(section for section in topic['sections'] if section['key'] == 'materials')
    if printed in materials['text'].split():
        materials['text'] = re.sub(r'(?<!\S)' + re.escape(printed) + r'(?!\S)', '\n'.join(new), materials['text'])
    links = topic['links']
    if target in links:
        index = links.index(target)
        links[index:index + 1] = [href for href in new if href not in links]
    assert materials['text'].split() == new, f"{topic['number']}: {materials['text']!r}"
    assert all(href in links for href in new) and target not in links


def cell_bounds(page, bbox):
    """The table cell around a line of text: the nearest rules above and below, and the right edge.
    Rules start at the cell's left border, a few points left of the text; link underlines do not."""
    rules, edges = [], []
    for drawing in page.get_drawings():
        for item in drawing['items']:
            if item[0] != 're':
                continue
            rect = item[1]
            if rect.height < 2 and rect.x0 < bbox.x0 - 3 and rect.x1 > bbox.x0 + 100:
                rules.append(rect)
            if rect.width < 2 and rect.y0 <= bbox.y0 and rect.y1 >= bbox.y1 and rect.x0 > bbox.x1:
                edges.append(rect.x0)
    top = max(rect.y1 for rect in rules if rect.y1 <= bbox.y0 + 1)
    bottom = min(rect.y0 for rect in rules if rect.y0 >= bbox.y1 - 3)
    return top, bottom, min(edges)


def replace_in_pdf(page, printed, target, new):
    lines = [line for block in page.get_text('dict')['blocks'] for line in block.get('lines', [])
             if ''.join(span['text'] for span in line['spans']).strip() == printed]
    assert len(lines) == 1, f'page {page.number + 1}: {printed} printed {len(lines)} times'
    bbox = fitz.Rect(lines[0]['bbox'])
    links = [link for link in page.get_links() if link.get('uri') == target]
    assert len(links) == 1, f'page {page.number + 1}: {len(links)} links to {target}'
    top, bottom, right = cell_bounds(page, bbox)
    # Clear the text and its underline (a thin rule just below the text, inside the cell).
    page.add_redact_annot(fitz.Rect(bbox.x0 - 1, bbox.y0, bbox.x1 + 1, min(bbox.y1 + 1.5, bottom - 0.5)), fill=False)
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED)
    page = page.parent.reload_page(page)  # The redaction also removes the old link area.
    assert not any(link.get('uri') == target for link in page.get_links())

    left = bbox.x0
    width = right - 6 - left
    widest = max(FONT.text_length(href, fontsize=1) for href in new)
    size = min(10, width / widest, (bottom - top - 3) / (len(new) * 1.15 + ASCENT + DESCENT - 1.15))
    leading = size * 1.15
    block = leading * (len(new) - 1) + (ASCENT + DESCENT) * size
    baseline = lines[0]['spans'][0]['origin'][1] if len(new) == 1 and size == 10 else top + (bottom - top - block) / 2 + ASCENT * size
    for href in new:
        length = FONT.text_length(href, fontsize=size)
        page.insert_text((left, baseline), href, fontname='tiro', fontsize=size, color=LINK_BLUE)
        page.draw_rect(fitz.Rect(left, baseline + .1 * size, left + length, baseline + .16 * size), color=None, fill=LINK_BLUE)
        page.insert_link({'kind': fitz.LINK_URI, 'uri': href,
                          'from': fitz.Rect(left, baseline - ASCENT * size - 1, left + length, baseline + DESCENT * size + 1)})
        baseline += leading
    return page.parent.reload_page(page), size


def tokens(text):
    return Counter(re.findall(r'\S+', text))


def run(age, replacements):
    data_file = PUBLIC / 'data' / f'ahlak-mufredati-{age}.json'
    data = json.loads(data_file.read_text())
    pdf_file = PUBLIC / 'assets' / 'ahlak-mufredati' / age / data['pdfFile']
    document = fitz.open(pdf_file)
    changed = False
    for number, (old, new) in replacements.items():
        printed, target = old[0], old[-1]
        topic = data['topics'][number - 1]
        assert topic['number'] == number
        pages = range(topic['startPage'] - 1, topic['endPage'])
        page = next((document[index] for index in pages if printed in document[index].get_text()), None)
        if page is None:
            assert all(any(href in document[index].get_text() for index in pages) for href in new), f'{age} {number}'
            continue
        before = page.get_text()
        page, size = replace_in_pdf(page, printed, target, new)
        after = page.get_text()
        expected = tokens(before) - Counter([printed])
        assert tokens(after) == expected + Counter(new), f'{age} {number}: unexpected text change'
        assert sorted(link['uri'] for link in page.get_links() if 'wordwall' in link.get('uri', '')) == sorted(new)
        update_topic(topic, printed, target, new)
        changed = True
        print(f'{age} konu {number} ({topic["title"]}), sayfa {page.number + 1}: {len(new)} etkinlik, {size:.1f} pt')
    if not changed:
        return
    temporary = pdf_file.with_suffix('.tmp.pdf')
    document.save(temporary, garbage=4, deflate=True)
    document.close()
    temporary.replace(pdf_file)
    data['pdfSha256'] = hashlib.sha256(pdf_file.read_bytes()).hexdigest()
    data_file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    for age, replacements in REPLACEMENTS.items():
        run(age, replacements)
