// Maakt per taal het deelplaatje (Open Graph, 1200×630) in site/beelden/<taal>/deel.png.
// Gebruik: node scripts/site-deelplaatje.mjs (opnieuw draaien na nieuwe screenshots)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

import { LANDING } from './site-teksten.mjs';

const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');

const beeld = (taal, naam) =>
  `data:image/webp;base64,${fs.readFileSync(path.join(SITE, 'beelden', taal, `${naam}.webp`)).toString('base64')}`;

function html(taal) {
  const x = LANDING[taal];
  return `<!doctype html><html lang="${taal}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@600;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#101714;color:#fff;font-family:'DM Sans',Arial;overflow:hidden;position:relative}
body::after{content:"";position:absolute;right:-120px;bottom:-260px;width:820px;height:640px;background:radial-gradient(closest-side,rgba(216,251,89,.28),transparent)}
.tekst{position:absolute;left:72px;top:70px;width:560px;z-index:2}
.merk{display:flex;align-items:center;gap:12px;margin-bottom:56px}
.glyph{width:54px;height:54px;border-radius:17px;background:#D8FB59;color:#101714;display:grid;place-items:center;font:700 40px/1 'Space Grotesk';letter-spacing:-4px;padding-right:6px}
.glyph i{font-style:normal;color:#569126}
.woord{font:700 42px 'Space Grotesk';letter-spacing:-3px}.woord span{color:#D8FB59}
.kicker{font-weight:800;font-size:17px;letter-spacing:.14em;color:#D8FB59;margin:0 0 18px}
h1{font:700 82px/0.98 'Space Grotesk','PingFang SC','Noto Sans CJK SC','Noto Sans SC','WenQuanYi Zen Hei',sans-serif;letter-spacing:-.05em;margin:0}:lang(zh) h1,:lang(zh) .kicker{letter-spacing:0}h1 span{display:block;color:#D8FB59}
.tel{position:absolute;width:250px;border-radius:40px;padding:9px;background:#0B100D;box-shadow:0 30px 70px -20px rgba(0,0,0,.7);z-index:2}
.tel img{width:100%;border-radius:32px;display:block}
.t1{right:250px;top:60px;transform:rotate(-5deg)}.t2{right:40px;top:110px;transform:rotate(6deg)}
</style></head><body>
<div class="tekst">
  <div class="merk"><span class="glyph"><b>m<i>.</i></b></span><span class="woord">mooove<span>.</span></span></div>
  <p class="kicker">${x.hero.kicker}</p>
  <h1>${x.hero.titel}<span>${x.hero.accent}</span></h1>
</div>
<div class="tel t1"><img src="${beeld(taal, '01-vandaag')}"></div>
<div class="tel t2"><img src="${beeld(taal, '05-klaar')}"></div>
</body></html>`;
}

const browser = await chromium.launch();
const pagina = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const taal of Object.keys(LANDING)) {
  await pagina.setContent(html(taal), { waitUntil: 'networkidle' });
  await pagina.screenshot({ path: path.join(SITE, 'beelden', taal, 'deel.png') });
  console.log('deelplaatje', taal);
}
await browser.close();
