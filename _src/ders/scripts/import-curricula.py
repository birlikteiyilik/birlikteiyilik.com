"""Import the two supplied TACEV PDFs without modifying their original files.

Requires PyMuPDF. Run with --junior <7-10.pdf> --senior <11-14.pdf>.
"""
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

import fitz

PUBLIC = Path(__file__).resolve().parents[1] / 'public'
LABELS = [
    ('age', r'YAŞ SEVİYESİ'), ('outcomes', r'ÖĞRENME ÇIKTILARI'),
    ('materials', r'SÜREÇTE'), ('duration', r'^SÜRE'),
    ('concepts', r'ANAHTAR(?: KAVRAMLAR)?$'), ('messages', r'VERİLECEK'),
    ('sayings', r'EHL-İ SÜNNET|BÜYÜKLER|İSLAM ÂLİMLERİNDEN'), ('explanation', r'AÇIKLAMALAR'),
    ('stories', r'KONU(?:YLA| İLE) İLGİLİ'), ('questions', r'DERS SONUNDA'), ('sources', r'KAYNAKLAR|KAYNKALAR|KAYNAKÇA'),
]
LABEL_CONTINUATIONS = re.compile(r'^(?:\(KAZANIMLAR\)|VE SÜREÇ BİLEŞENLERİ|KULLANILABİLECEK|'
    r'OYUNLAR\s*/\s*MATERYALLER|MENKIBE(?:/LER|LER)?|MİSAL/LER|BİR SÖZ ÖĞRENİYORUM|'
    r'SÖZ ÖĞRENİYORUM|NE KAZANDIK\?|ANLADIK, NE KAZANDIK\?|ANLADIK, NE|'
    r'NE ANLADIK, NE KAZANDIK\?|BÜYÜKLERİNDEN BİR|KAVRAMLAR|VE SÜREÇ|BİLEŞENLERİ|'
    r'\(KAZANIMLAR\) VE SÜREÇ|OYUNLAR|MATERYALLER|OYUNLAR MATERYALLER)$')


def clean(text):
    return text.replace('\uf0b7', '•').replace('\xad', '').strip()


def import_pdf(source, age, expected_pages, expected_topics, edition):
    document = fitz.open(source)
    assert len(document) == expected_pages, 'Unexpected PDF page count'
    folder = PUBLIC / 'assets' / 'ahlak-mufredati' / age
    folder.mkdir(parents=True, exist_ok=True)
    pdf_name = f'ahlak-egitim-programi-{age}-yas.pdf'
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    target = PUBLIC / 'data' / f'ahlak-mufredati-{age}.json'
    shutil.copyfile(source, folder / pdf_name)
    topics = []
    current_section = None
    for index, page in enumerate(document):
        number = index + 1
        raw = clean(page.get_text())
        lines = [line.strip() for line in raw.splitlines() if line.strip()]
        header = next((i for i, line in enumerate(lines[:18]) if line == 'YAŞ SEVİYESİ'), None)
        if header is not None:
            topic_number = max(i for i in range(header) if lines[i].isdigit())
            topic = {'number': int(lines[topic_number]), 'title': ' '.join(lines[topic_number + 1:header]),
                     'startPage': number, 'endPage': number, 'sections': [], 'links': []}
            assert topic['number'] == len(topics) + 1
            topics.append(topic)
            current_section = None
        if topics:
            topic = topics[-1]
            topic['endPage'] = number
            # These tagged Word exports keep their logical reading order even
            # when border detection merges entire table rows. Parse that stream
            # directly, carrying the active section across page boundaries.
            content_lines = lines[header:] if header is not None else lines[:]
            if content_lines and content_lines[0] == str(number):
                content_lines = content_lines[1:]
            for line in content_lines:
                key = next((key for key, pattern in LABELS if len(line) < 85 and re.match(pattern, line)), None)
                if key:
                    current_section = next((section for section in topic['sections'] if section['key'] == key), None)
                    if current_section is None:
                        current_section = {'key': key, 'text': '', 'pages': []}
                        topic['sections'].append(current_section)
                    continue
                if LABEL_CONTINUATIONS.fullmatch(line):
                    continue
                if current_section is not None:
                    current_section['text'] += ('\n' if current_section['text'] else '') + line
                    if number not in current_section['pages']:
                        current_section['pages'].append(number)
            for link in page.get_links():
                uri = link.get('uri', '')
                if uri.startswith(('https://', 'http://')) and uri not in topic['links']:
                    topic['links'].append(uri)
    assert len(topics) == expected_topics
    incomplete = [(topic['number'], topic['title'], [section['key'] for section in topic['sections']]) for topic in topics if not topic['title'] or len(topic['sections']) < 8]
    if incomplete:
        print('Incomplete:', incomplete, flush=True)
    assert not incomplete
    assert all(any(section['key'] == 'outcomes' and section['text'] for section in topic['sections']) for topic in topics)
    payload = {'id': age, 'title': 'Ahlak Eğitim Programı', 'ageLabel': f'{age.replace("-", "–")} yaş',
               'publisher': 'TACEV Eğitim Vakfı', 'edition': edition, 'pageCount': len(document),
               'topicCount': len(topics), 'pdfFile': pdf_name, 'sourceSha256': source_hash,
               'topics': topics}
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    print(f'{age}: {len(topics)} topics, {len(document)} pages, {target.stat().st_size} bytes of text', flush=True)
    print('Section counts:', {key: sum(any(section['key'] == key and section['text'] for section in topic['sections']) for topic in topics) for key, _ in LABELS}, flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--junior', type=Path, required=True)
    parser.add_argument('--senior', type=Path, required=True)
    args = parser.parse_args()
    import_pdf(args.junior, '7-10', 175, 56, 'Nisan 2025')
    import_pdf(args.senior, '11-14', 187, 59, 'Mayıs 2025')
