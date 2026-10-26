"""Publish curriculum PDFs with academy branding and no lesson-duration labels."""
from collections import Counter
from pathlib import Path
import re

import fitz

BRAND = 'Birlikte İyilik'
TIME_PREFIX = re.compile(r'^\s*40(?:\s*\+\s*40)?\s*(?:dkk|dk)\s*', re.IGNORECASE)


def _font():
    choices = ['/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
               '/System/Library/Fonts/Supplemental/Georgia.ttf']
    return next((path for path in choices if Path(path).exists()), None)


def _tokens(text):
    return Counter(re.findall(r'\S+', text))


def publish_pdf(source: Path, target: Path, age: str):
    document = fitz.open(source)
    font_file = _font()
    if not font_file:
        raise RuntimeError('A Turkish-capable DejaVu Serif or Georgia font is required.')
    font = fitz.Font(fontfile=font_file)
    original_text = [page.get_text() for page in document]
    cover = document[0]
    cover_spans = [span for block in cover.get_text('dict')['blocks'] for line in block.get('lines', [])
                   for span in line['spans'] if span['size'] > 50 and span['text'].strip()]
    assert len(cover_spans) == 2, 'Unexpected source cover layout'
    old_cover_names = [span['text'].strip() for span in cover_spans]
    shared_images = {item[0] for item in cover.get_images(full=True)}
    assert len(shared_images) == 1, 'Unexpected source branding images'
    # These supplied files each use one shared branding image, on every page.
    # Replacing that image removes the old logo without touching foreground text.
    for xref in shared_images:
        assert all(any(image[0] == xref for image in page.get_images(full=True)) for page in document)
        cover.delete_image(xref)

    changed_rows = 0
    for index, page in enumerate(document):
        edits = []
        if index == 0:
            for span in cover_spans:
                page.add_redact_annot(fitz.Rect(span['bbox']), fill=False)
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                text = ''.join(span['text'] for span in line['spans']).strip()
                if TIME_PREFIX.match(text):
                    method = TIME_PREFIX.sub('', text).lstrip(' –-')
                    edits.append((text, method, line['bbox'], line['spans'][0]['origin'], False))
                    changed_rows += 1
                elif text in ('SÜRE', 'SÜRE VE METOT'):
                    edits.append((text, 'YÖNTEM', line['bbox'], line['spans'][0]['origin'], True))
        for _, _, bbox, _, _ in edits:
            page.add_redact_annot(fitz.Rect(bbox), fill=False)
        if edits or index == 0:
            page.apply_redactions(images=0, graphics=0)
        page.insert_font(fontname='AcademySerif', fontfile=font_file)
        for _, replacement, bbox, origin, label in edits:
            available = 760 - origin[0] if not label else 120
            size = min(9, available / max(font.text_length(replacement, fontsize=1), 1))
            page.insert_text(origin, replacement, fontname='AcademySerif', fontsize=size, color=(0, 0, 0))
        if index == 0:
            page.insert_textbox(fitz.Rect(135, 210, 707, 320), BRAND, fontname='AcademySerif',
                                fontsize=62, align=1, color=(.09, .28, .24))
            page.insert_textbox(fitz.Rect(160, 335, 682, 380), 'Ahlak Eğitim Programı',
                                fontname='AcademySerif', fontsize=25, align=1, color=(.3, .38, .33))
            page.insert_textbox(fitz.Rect(200, 397, 642, 435), age.replace('-', '–') + ' yaş',
                                fontname='AcademySerif', fontsize=19, align=1, color=(.3, .38, .33))
        page.insert_text((63, page.rect.height - 26), BRAND, fontname='AcademySerif', fontsize=8,
                         color=(.38, .45, .4))
        if index > 0:
            expected = original_text[index]
            actual = page.get_text().replace(BRAND, '')
            for old, new, *_ in edits:
                expected = re.sub(r'(?m)^[ \t]*' + re.escape(old) + r'[ \t]*$', '', expected)
                actual = actual.replace(new, '', 1)
            assert _tokens(expected) == _tokens(actual), f'Unexpected content change on page {index + 1}: missing {_tokens(expected) - _tokens(actual)}, extra {_tokens(actual) - _tokens(expected)}'
    assert changed_rows in (56, 59), 'Unexpected lesson-method count'
    metadata = dict(document.metadata)
    metadata.update(title=f'{BRAND} · Ahlak Eğitim Programı · {age} yaş', subject='Ahlak eğitim programı')
    document.set_metadata(metadata)
    document.subset_fonts()
    document.save(target, garbage=4, deflate=True)
    document.close()
    with fitz.open(target) as result:
        assert all(not page.search_for(name) for page in result for name in old_cover_names)
        assert all(not TIME_PREFIX.match(line.strip()) for page in result for line in page.get_text().splitlines())
        assert BRAND in result[0].get_text()
    return changed_rows
