// Store-screenshots met koptekst: het echte scherm in een telefoon onder een korte belofte.
// Bron: docs/store/screenshots; uitvoer: docs/store/screenshots-tekst/<taal>/<formaat>/.
// Gebruik: node scripts/store-screenshots-tekst.mjs (opnieuw draaien na nieuwe screenshots)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRON = path.join(ROOT, 'docs', 'store', 'screenshots');
const DOEL = path.join(ROOT, 'docs', 'store', 'screenshots-tekst');

// Formaat: breedte en hoogte in punten (×3 = pixels zoals de stores ze vragen)
const FORMATEN = { 'ios-6.9': [440, 956], 'ios-6.5': [428, 926], android: [360, 780] };
const SCHERMEN = ['01-vandaag', '02-alarmen', '03-alarm-instellen', '04-progressie', '05-klaar'];

const KOPPEN = {
  nl: [
    ['Begin elke dag', 'met een overwinning'],
    ['Jij bepaalt', 'hoe streng'],
    ['16 missies, of', 'bedenk je eigen'],
    ['Bouw een streak', 'die blijft'],
    ['Stopt pas', 'als jij beweegt'],
  ],
  en: [
    ['Start every day', 'with a win'],
    ['You decide', 'how strict'],
    ['16 missions, or', 'create your own'],
    ['Build a streak', 'that sticks'],
    ['Only stops', 'when you move'],
  ],
  es: [
    ['Empieza cada día', 'con una victoria'],
    ['Tú decides', 'lo estricto'],
    ['16 misiones, o', 'crea la tuya'],
    ['Construye una racha', 'que dura'],
    ['Solo para', 'cuando te mueves'],
  ],
  de: [
    ['Starte jeden Tag', 'mit einem Erfolg'],
    ['Du bestimmst,', 'wie streng'],
    ['16 Missionen, oder', 'deine eigene'],
    ['Bau eine Serie auf,', 'die bleibt'],
    ['Hört erst auf,', 'wenn du dich bewegst'],
  ],
  fr: [
    ['Commence chaque jour', 'par une victoire'],
    ['Tu choisis', 'le niveau'],
    ['16 missions, ou', 'crée la tienne'],
    ['Construis une série', 'qui dure'],
    ['Ne s’arrête que', 'quand tu bouges'],
  ],
  zh: [
    ['每天都以', '一次胜利开始'],
    ['严格程度', '由你决定'],
    ['16 个任务，', '或自己创建'],
    ['打造一个', '能坚持的连续纪录'],
    ['只有你动起来', '才会停'],
  ],
};

function html(beeld, [regel1, regel2], [b, h]) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;width:${b}px;height:${h}px;background:#101714;overflow:hidden;position:relative;font-family:'Space Grotesk','PingFang SC','Noto Sans SC','WenQuanYi Zen Hei',Arial}
body::before{content:"";position:absolute;left:-30%;right:-30%;bottom:-25%;height:65%;background:radial-gradient(closest-side,rgba(216,251,89,.3),transparent)}
h1{position:relative;margin:${h * 0.075}px ${b * 0.08}px 0;font-size:${b * 0.095}px;line-height:1.02;letter-spacing:-.045em;color:#fff;text-align:center}
h1 span{display:block;color:#D8FB59}
.tel{position:absolute;left:50%;transform:translateX(-50%);top:${h * 0.27}px;width:${b * 0.8}px;border-radius:${b * 0.1}px;padding:${b * 0.022}px;background:#0B100D;box-shadow:0 0 0 1px #2B3730,0 30px 60px -20px rgba(0,0,0,.8)}
.tel img{display:block;width:100%;border-radius:${b * 0.082}px}
</style></head><body>
<h1>${regel1}<span>${regel2}</span></h1>
<div class="tel"><img src="${beeld}"></div>
</body></html>`;
}

const browser = await chromium.launch();
for (const [taal, koppen] of Object.entries(KOPPEN).filter(
  ([t]) => !process.env.TALEN || process.env.TALEN.split(',').includes(t),
)) {
  for (const [formaat, maat] of Object.entries(FORMATEN)) {
    const map = path.join(DOEL, taal, formaat);
    fs.mkdirSync(map, { recursive: true });
    const pagina = await browser.newPage({
      viewport: { width: maat[0], height: maat[1] },
      deviceScaleFactor: 3,
    });
    for (const [i, scherm] of SCHERMEN.entries()) {
      const bron = path.join(BRON, ...(taal === 'nl' ? [] : [taal]), formaat, `${scherm}.png`);
      const beeld = `data:image/png;base64,${fs.readFileSync(bron).toString('base64')}`;
      await pagina.setContent(html(beeld, koppen[i], maat), { waitUntil: 'networkidle' });
      await pagina.screenshot({ path: path.join(map, `${scherm}.jpg`), type: 'jpeg', quality: 92 });
    }
    await pagina.close();
    console.log('klaar', taal, formaat);
  }
}
await browser.close();
