# Zet de store-screenshots (docs/store/screenshots) om naar lichte webbeelden voor de site.
# Gebruik: python3 scripts/site-beelden.py  (opnieuw draaien na nieuwe screenshots)
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRON = ROOT / 'docs' / 'store' / 'screenshots'
DOEL = ROOT / 'site' / 'beelden'
BREEDTE = 640

for taal in ['nl', 'en', 'es', 'de', 'fr', 'zh']:
    map_ = BRON / 'ios-6.9' if taal == 'nl' else BRON / taal / 'ios-6.9'
    uit = DOEL / taal
    uit.mkdir(parents=True, exist_ok=True)
    for png in sorted(map_.glob('*.png')):
        beeld = Image.open(png).convert('RGB')
        hoogte = round(beeld.height * BREEDTE / beeld.width)
        beeld.resize((BREEDTE, hoogte), Image.LANCZOS).save(uit / f'{png.stem}.webp', 'WEBP', quality=82, method=6)
    print(taal, len(list(uit.glob('*.webp'))))
