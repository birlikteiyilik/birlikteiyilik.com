"""Regenerate the shared QR artwork and 3D module coordinates (qrcode==8.2)."""
from pathlib import Path
import json
import qrcode

ROOT = Path(__file__).resolve().parent.parent
URL = "https://birlikteiyilik.com/qr"
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, border=4)
qr.add_data(URL)
qr.make(fit=True)
rows = ["".join("1" if cell else "0" for cell in row) for row in qr.modules]
size = len(rows) + 8
path = " ".join(f"M{x + 4},{y + 4}h1v1h-1z" for y, row in enumerate(rows) for x, cell in enumerate(row) if cell == "1")
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="410" height="410" viewBox="0 0 {size} {size}" role="img" aria-label="Birlikte İyilik Akademi bağlantıları QR kodu"><title>{URL}</title><rect width="{size}" height="{size}" fill="#fff"/><path d="{path}" fill="#123c32" shape-rendering="crispEdges"/></svg>'''
code = f'export const QR_URL = {json.dumps(URL)};\nexport const QR_ROWS = {json.dumps(rows)};\n'
for directory in [ROOT, ROOT / "_src/static"]:
    (directory / "assets/qr").mkdir(parents=True, exist_ok=True)
    (directory / "assets/qr/birlikteiyilik-v1.svg").write_text(svg)
    (directory / "js/qr-tree-code-v1.js").write_text(code)
print(f"Generated QR version {qr.version}, {len(rows)}×{len(rows)} modules, correction H, quiet zone 4: {URL}")
