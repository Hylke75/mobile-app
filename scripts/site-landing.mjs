// Presentatiepagina van Mooove, per taal. Wordt aangeroepen vanuit scripts/bouw-site.mjs.
import { LANDING } from './site-teksten.mjs';

// Vul de store-links in zodra de app live staat; tot dan tonen de knoppen "Binnenkort"
const APP_STORE_URL = null;
const PLAY_STORE_URL = null;

const SCHERMEN = ['01-vandaag', '02-alarmen', '03-alarm-instellen', '04-progressie', '05-klaar'];
const NIVEAU_KLEUREN = ['#E7F6C2', '#D8FB59', '#B9E35A', '#7FB04A', '#101714'];

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23D8FB59'/%3E%3Ctext x='29' y='46' font-family='Arial' font-weight='700' font-size='42' text-anchor='middle' fill='%23101714'%3Em%3C/text%3E%3Ccircle cx='50' cy='42' r='5' fill='%23569126'/%3E%3C/svg%3E";

const CSS = `
:root{--ink:#101714;--ink2:#1B2520;--lime:#D8FB59;--lime2:#C4EC3C;--paper:#F3F3ED;--card:#fff;--muted:#5F6B63;--line:#E2E6DA;--groen:#3F6B2A;--accent:#569126}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.6 'DM Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:inherit}
.wrap{max-width:1160px;margin:0 auto;padding:0 24px}
.kop{font:700 clamp(34px,5.2vw,60px)/1.02 'Space Grotesk',Arial;letter-spacing:-.045em;margin:0}
.kop2{font:700 clamp(28px,3.8vw,44px)/1.05 'Space Grotesk',Arial;letter-spacing:-.04em;margin:0 0 14px}
.kicker{font-weight:800;font-size:12px;letter-spacing:.14em;color:var(--groen);margin:0 0 14px}
.lead{font-size:clamp(17px,1.6vw,19px);color:#36423A;max-width:560px}
section{padding:88px 0}
@media (max-width:700px){section{padding:64px 0}}

/* Navigatie */
.nav{position:sticky;top:0;z-index:20;background:rgba(16,23,20,.92);backdrop-filter:saturate(1.4) blur(10px);-webkit-backdrop-filter:saturate(1.4) blur(10px)}
.nav .wrap{display:flex;align-items:center;gap:22px;height:68px}
.merk{display:flex;align-items:center;gap:9px;text-decoration:none;color:#F3F3ED}
.glyph{width:36px;height:36px;border-radius:12px;background:var(--lime);color:var(--ink);display:grid;place-items:center;font:700 27px/1 'Space Grotesk',Arial;letter-spacing:-3px;padding-right:5px}
.glyph i{font-style:normal;color:var(--accent)}
.woord{font:700 28px 'Space Grotesk',Arial;letter-spacing:-2px}.woord span{color:var(--lime)}
.links{display:flex;gap:20px;margin-left:18px}
.links a{color:#C7D1C7;text-decoration:none;font-size:14px;font-weight:600}
.links a:hover{color:#fff}
.talen{margin-left:auto;display:flex;gap:2px;font-size:12px;font-weight:800}
.talen a,.talen strong{padding:5px 7px;border-radius:8px;color:#9AA79D;text-decoration:none}
.talen strong{color:var(--ink);background:var(--lime)}
.talen a:hover{color:#fff}
.nav .knop{padding:10px 16px;font-size:14px}
@media (max-width:980px){.links{display:none}}
@media (max-width:560px){.nav .knop{display:none}.talen{gap:0}.talen a,.talen strong{padding:5px 5px}}

.knop{display:inline-flex;align-items:center;gap:10px;background:var(--lime);color:var(--ink);font-weight:800;text-decoration:none;border-radius:16px;padding:15px 22px;border:0}
.knop:hover{background:var(--lime2)}
.store{display:inline-flex;align-items:center;gap:12px;background:var(--ink);color:#F3F3ED;border-radius:16px;padding:11px 18px;text-decoration:none;border:1px solid #2B3730;min-width:186px}
.store svg{flex:none}
.store small{display:block;font-size:11px;color:#9AA79D;font-weight:600;letter-spacing:.02em}
.store b{display:block;font-size:17px;line-height:1.15}
.store[aria-disabled="true"]{cursor:default}
.stores{display:flex;gap:12px;flex-wrap:wrap}

/* Telefoon */
.tel{position:relative;border-radius:46px;padding:10px;background:#0B100D;box-shadow:0 1px 0 #2a352e inset,0 40px 80px -30px rgba(16,23,20,.55),0 18px 40px -20px rgba(16,23,20,.35)}
.tel img{border-radius:37px;width:100%;height:auto;background:#F3F3ED}
.tel::before{content:"";position:absolute;top:20px;left:50%;transform:translateX(-50%);width:30%;height:22px;border-radius:12px;background:#0B100D;z-index:1}

/* Hero */
.hero{background:var(--ink);color:#F3F3ED;padding:72px 0 0;overflow:hidden;position:relative}
.hero::after{content:"";position:absolute;inset:auto -20% -40% -20%;height:70%;background:radial-gradient(closest-side,rgba(216,251,89,.22),transparent);pointer-events:none}
.hero .wrap{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center;position:relative;z-index:1}
.hero .kicker{color:var(--lime)}
.hero .kop{color:#fff}.hero .kop span{color:var(--lime);display:block}
.hero .lead{color:#C7D1C7;margin:22px 0 26px}
.punten{list-style:none;padding:0;margin:0 0 30px;display:grid;gap:10px}
.punten li{display:flex;gap:10px;align-items:flex-start;color:#E4EBE2;font-weight:600;font-size:15px}
.punten li::before{content:"✓";flex:none;width:22px;height:22px;border-radius:8px;background:var(--lime);color:var(--ink);display:grid;place-items:center;font-size:13px;font-weight:800;margin-top:1px}
.hero-tel{position:relative;height:640px}
.hero-tel .tel{position:absolute;width:290px}
.hero-tel .t1{left:50%;transform:translateX(-50%);top:10px;z-index:3}
.wissel{display:grid}
.wissel img{grid-area:1/1;animation:wissel 16s infinite;opacity:0}
.wissel img:nth-child(1){animation-delay:0s}.wissel img:nth-child(2){animation-delay:4s}
.wissel img:nth-child(3){animation-delay:8s}.wissel img:nth-child(4){animation-delay:12s}
@keyframes wissel{0%{opacity:0}4%,25%{opacity:1}29%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.wissel img{animation:none}.wissel img:first-child{opacity:1}}
.hero-tel .t2{left:0;top:110px;transform:rotate(-8deg) scale(.86);opacity:.9;z-index:2}
.hero-tel .t3{right:0;top:110px;transform:rotate(8deg) scale(.86);opacity:.9;z-index:2}
@media (max-width:980px){.hero .wrap{grid-template-columns:1fr}.hero-tel{height:560px;margin:0 auto;width:100%;max-width:560px}.hero-tel .tel{width:250px}}
@media (max-width:560px){.hero{padding-top:48px}.hero-tel{height:470px}.hero-tel .tel{width:215px}.hero-tel .t2{left:-30px}.hero-tel .t3{right:-30px}}

/* Probleem / oplossing */
.duo{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.duo>div{border-radius:28px;padding:38px}
.duo .los{background:var(--card);border:1px solid var(--line)}
.duo .ja{background:var(--lime)}
.duo .ja .kicker{color:var(--ink)}
.duo p{margin:0;color:#36423A}
.duo h3{font:700 clamp(24px,2.6vw,32px)/1.1 'Space Grotesk',Arial;letter-spacing:-.035em;margin:0 0 14px}
.snooze{display:flex;gap:8px;margin-top:24px;flex-wrap:wrap}
.snooze span{font-size:13px;font-weight:800;border-radius:999px;padding:6px 12px;background:#EEF0E8;color:#8A948C;text-decoration:line-through}
@media (max-width:820px){.duo{grid-template-columns:1fr}.duo>div{padding:28px}}

/* Stappen */
.stappen{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:44px}
.stap{background:var(--card);border:1px solid var(--line);border-radius:28px;padding:26px 26px 0;overflow:hidden;display:flex;flex-direction:column;max-height:640px}
.stap .nr{width:38px;height:38px;border-radius:13px;background:var(--ink);color:var(--lime);display:grid;place-items:center;font:700 18px 'Space Grotesk',Arial}
.stap h3{font:700 22px/1.15 'Space Grotesk',Arial;letter-spacing:-.03em;margin:16px 0 8px}
.stap p{margin:0 0 24px;color:var(--muted);font-size:15px}
.stap .tel{width:64%;margin:auto auto -150px;border-radius:40px 40px 0 0;padding-bottom:0}
.stap .tel img{border-radius:31px 31px 0 0}
@media (max-width:900px){.stappen{grid-template-columns:1fr}.stap .tel{width:62%;max-width:280px}}

/* Voordelen */
.voordelen{background:var(--card);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.raster{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px}
.voordeel{border-radius:24px;padding:28px;background:var(--paper);border:1px solid var(--line)}
.voordeel .emoji{font-size:30px;line-height:1;width:58px;height:58px;border-radius:18px;background:var(--card);display:grid;place-items:center;border:1px solid var(--line)}
.voordeel h3{font:700 21px/1.15 'Space Grotesk',Arial;letter-spacing:-.03em;margin:18px 0 8px}
.voordeel p{margin:0;color:var(--muted);font-size:15px}
.voordeel:first-child{background:var(--ink);color:#F3F3ED;border-color:var(--ink)}
.voordeel:first-child p{color:#B4C0B4}
.voordeel:first-child .emoji{background:var(--lime);border-color:var(--lime)}
@media (max-width:900px){.raster{grid-template-columns:1fr 1fr}}
@media (max-width:600px){.raster{grid-template-columns:1fr}}

/* Schermen */
.schermen{overflow:hidden}
.strook{display:flex;gap:26px;overflow-x:auto;scroll-snap-type:x mandatory;padding:36px 24px 30px;margin:0 -24px;scrollbar-width:thin}
.strook figure{margin:0;flex:0 0 250px;scroll-snap-align:center}
.strook figcaption{text-align:center;font-weight:700;font-size:14px;margin-top:16px}
@media (min-width:1100px){.strook{justify-content:center;overflow:visible}.strook figure{flex-basis:196px}}

/* Functies */
.functies{background:var(--ink);color:#F3F3ED}
.functies .kicker{color:var(--lime)}
.functies .kop2{color:#fff}
.flijst{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#26322B;border:1px solid #26322B;border-radius:26px;overflow:hidden;margin-top:40px}
.functie{background:var(--ink);padding:28px}
.functie h3{font:700 18px/1.2 'Space Grotesk',Arial;letter-spacing:-.02em;margin:0 0 8px;display:flex;gap:10px;align-items:center}
.functie h3::before{content:"";width:10px;height:10px;border-radius:3px;background:var(--lime);flex:none}
.functie p{margin:0;color:#A9B5AB;font-size:14.5px}
@media (max-width:980px){.flijst{grid-template-columns:1fr 1fr}}
@media (max-width:560px){.flijst{grid-template-columns:1fr}}

/* Niveaus */
.nlijst{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:40px}
.niveau{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:22px;display:flex;flex-direction:column;gap:10px}
.niveau .meter{display:flex;gap:4px}
.niveau .meter i{flex:1;height:6px;border-radius:3px;background:#E6EADF}
.niveau h3{font:700 20px 'Space Grotesk',Arial;letter-spacing:-.03em;margin:4px 0 0}
.niveau p{margin:0;color:var(--muted);font-size:14.5px}
.niveau:last-child{background:var(--ink);border-color:var(--ink);color:#fff}
.niveau:last-child p{color:#B4C0B4}
.niveau:last-child .meter i{background:#2A362F}
@media (max-width:1000px){.nlijst{grid-template-columns:1fr 1fr}}
@media (max-width:560px){.nlijst{grid-template-columns:1fr}}

/* Privacy */
.prive .kaart{background:var(--lime);border-radius:32px;padding:56px;display:grid;grid-template-columns:auto 1fr;gap:40px;align-items:center}
.prive .slot{width:120px;height:120px;border-radius:36px;background:var(--ink);display:grid;place-items:center}
.prive .kicker{color:var(--ink)}
.prive p{margin:0 0 18px;max-width:640px;color:#26302A}
.prive a{font-weight:800}
@media (max-width:720px){.prive .kaart{grid-template-columns:1fr;padding:32px}.prive .slot{width:84px;height:84px;border-radius:26px}}

/* FAQ */
.faq details{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:4px 22px;margin-bottom:10px}
.faq summary{cursor:pointer;list-style:none;font-weight:800;padding:16px 30px 16px 0;position:relative}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";position:absolute;right:0;top:12px;font-size:24px;font-weight:600;color:var(--groen)}
.faq details[open] summary::after{content:"–"}
.faq details p{margin:0 0 18px;color:var(--muted)}
.faq .wrap{max-width:820px}

/* Slot */
.slotcta{background:var(--ink);color:#fff;border-radius:36px;padding:64px 40px;text-align:center;position:relative;overflow:hidden}
.slotcta::before{content:"";position:absolute;inset:-40% 20% auto 20%;height:120%;background:radial-gradient(closest-side,rgba(216,251,89,.25),transparent)}
.slotcta>*{position:relative}
.slotcta .kop{color:#fff}.slotcta .kop span{color:var(--lime)}
.slotcta p{color:#C7D1C7;margin:16px auto 28px;max-width:520px}
.slotcta .stores{justify-content:center}
.wachtlijst{margin:44px auto 0;max-width:560px;text-align:left;background:#1B2520;border:1px solid #2B3730;border-radius:24px;padding:28px}
.wachtlijst h3{font:700 22px 'Space Grotesk',Arial;letter-spacing:-.03em;margin:0;color:#fff}
.wachtlijst p{margin:8px 0 18px;color:#B4C0B4;font-size:15px;max-width:none}
.wachtlijst .veld{display:flex;gap:10px;flex-wrap:wrap}
.wachtlijst input{flex:1 1 220px;font:inherit;font-size:16px;padding:14px 16px;border-radius:14px;border:1px solid #33413A;background:#101714;color:#fff}
.wachtlijst input:focus{outline:2px solid var(--lime);outline-offset:1px}
.wachtlijst button{font:inherit;font-weight:800;border:0;border-radius:14px;padding:14px 20px;background:var(--lime);color:var(--ink);cursor:pointer}
.wachtlijst button:disabled{opacity:.6;cursor:default}
.wachtlijst .wl-melding{min-height:22px;margin:12px 0 4px;color:var(--lime);font-weight:700}
.wachtlijst small{color:#8A968C;font-size:12.5px}.wachtlijst small a{color:#C7D1C7}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
footer{padding:44px 0 56px;color:var(--muted);font-size:14px}
footer .wrap{display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center}
footer a{color:var(--muted)}
footer .gezond{flex-basis:100%;font-size:13px}
:focus-visible{outline:3px solid var(--accent);outline-offset:3px;border-radius:6px}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;

const APPLE = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.5 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.9-1.7 0-3.2 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.3-3.7zM14 5.3c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z"/></svg>`;
const PLAY = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 2.8v18.4c0 .5.5.8 1 .6l15.9-9.2c.5-.3.5-.9 0-1.2L5 2.2c-.5-.2-1 .1-1 .6zm2 2.6 8.3 6.6L6 18.6z"/></svg>`;

function storeKnop(x, soort) {
  const url = soort === 'apple' ? APP_STORE_URL : PLAY_STORE_URL;
  const naam = soort === 'apple' ? x.appStore : x.playStore;
  const icoon = soort === 'apple' ? APPLE : PLAY;
  const inhoud = `${icoon}<span><small>${esc(url ? x.download : x.binnenkort)}</small><b>${esc(naam)}</b></span>`;
  return url
    ? `<a class="store" href="${url}">${inhoud}</a>`
    : `<span class="store" aria-disabled="true">${inhoud}</span>`;
}

function telefoon(taal, scherm, alt, klasse = '', laden = 'lazy') {
  return `<div class="tel ${klasse}"><img src="/beelden/${taal}/${scherm}.webp" width="640" height="1391" alt="${esc(alt)}" loading="${laden}" decoding="async"></div>`;
}

export function landing(
  taal,
  { talen, taalnamen, url, hreflang, privacyLabel, verwijderLabel, mail, domein, wachtlijstUrl },
) {
  const x = LANDING[taal];
  const b = x.schermen.bijschriften;
  const stores = `<div class="stores">${storeKnop(x, 'apple')}${storeKnop(x, 'play')}</div>`;
  const taalLinks = talen
    .map((t) =>
      t === taal
        ? `<strong aria-current="true">${t.toUpperCase()}</strong>`
        : `<a href="${url(t, 'index')}" hreflang="${t}" lang="${t}" title="${taalnamen[t]}">${t.toUpperCase()}</a>`,
    )
    .join('');

  return `<!doctype html><html lang="${taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(x.titel)}</title><meta name="description" content="${esc(x.beschrijving)}">
<meta property="og:title" content="${esc(x.titel)}"><meta property="og:description" content="${esc(x.beschrijving)}"><meta property="og:type" content="website"><meta property="og:url" content="${domein}${url(taal, 'index')}"><meta property="og:image" content="${domein}/beelden/${taal}/deel.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(x.titel)}"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#101714"><link rel="icon" href="${FAVICON}">${hreflang('index')}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="/beelden/${taal}/01-vandaag.webp">
<style>${CSS}</style></head><body>

<nav class="nav" aria-label="Mooove"><div class="wrap">
  <a class="merk" href="${url(taal, 'index')}" aria-label="Mooove"><span class="glyph"><b>m<i>.</i></b></span><span class="woord">mooove<span>.</span></span></a>
  <div class="links"><a href="#hoe">${esc(x.nav.hoe)}</a><a href="#voordelen">${esc(x.nav.voordelen)}</a><a href="#functies">${esc(x.nav.functies)}</a><a href="#niveaus">${esc(x.nav.niveaus)}</a><a href="#faq">${esc(x.nav.faq)}</a></div>
  <div class="talen">${taalLinks}</div>
  <a class="knop" href="#download">${esc(x.download)}</a>
</div></nav>

<header class="hero"><div class="wrap">
  <div>
    <p class="kicker">${esc(x.hero.kicker)}</p>
    <h1 class="kop">${esc(x.hero.titel)}<span>${esc(x.hero.accent)}</span></h1>
    <p class="lead">${esc(x.hero.tekst)}</p>
    <ul class="punten">${x.hero.punten.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    ${stores}
  </div>
  <div class="hero-tel" aria-hidden="false">
    ${telefoon(taal, '02-alarmen', b[1], 't2', 'eager')}
    ${telefoon(taal, '04-progressie', b[3], 't3', 'eager')}
    <div class="tel t1 wissel">${['01-vandaag', '03-alarm-instellen', '05-klaar', '04-progressie']
      .map(
        (scherm, i) =>
          `<img src="/beelden/${taal}/${scherm}.webp" width="640" height="1391" alt="${i === 0 ? esc(b[0]) : ''}" ${i ? 'aria-hidden="true" loading="lazy"' : 'loading="eager"'} decoding="async">`,
      )
      .join('')}</div>
  </div>
</div></header>

<main>
<section><div class="wrap duo">
  <div class="los"><p class="kicker">${esc(x.probleem.kicker)}</p><h3>${esc(x.probleem.titel)}</h3><p>${esc(x.probleem.tekst)}</p>
    <div class="snooze" aria-hidden="true"><span>Snooze 06:30</span><span>Snooze 06:39</span><span>Snooze 06:48</span></div></div>
  <div class="ja"><p class="kicker">${esc(x.probleem.oplossingKicker)}</p><h3>${esc(x.probleem.oplossingTitel)}</h3><p>${esc(x.probleem.oplossingTekst)}</p></div>
</div></section>

<section id="hoe" style="padding-top:20px"><div class="wrap">
  <p class="kicker">${esc(x.hoe.kicker)}</p><h2 class="kop2">${esc(x.hoe.titel)}</h2>
  <div class="stappen">
    ${x.hoe.stappen
      .map(
        (s, i) =>
          `<article class="stap"><span class="nr">${i + 1}</span><h3>${esc(s.titel)}</h3><p>${esc(s.tekst)}</p>${telefoon(taal, ['03-alarm-instellen', '05-klaar', '04-progressie'][i], [b[2], b[4], b[3]][i])}</article>`,
      )
      .join('')}
  </div>
</div></section>

<section id="voordelen" class="voordelen"><div class="wrap">
  <p class="kicker">${esc(x.voordelen.kicker)}</p><h2 class="kop2">${esc(x.voordelen.titel)}</h2>
  <div class="raster">
    ${x.voordelen.lijst.map((v) => `<article class="voordeel"><div class="emoji" aria-hidden="true">${v.emoji}</div><h3>${esc(v.titel)}</h3><p>${esc(v.tekst)}</p></article>`).join('')}
  </div>
</div></section>

<section class="schermen"><div class="wrap">
  <p class="kicker">${esc(x.schermen.kicker)}</p><h2 class="kop2">${esc(x.schermen.titel)}</h2>
  <div class="strook">
    ${SCHERMEN.map((s, i) => `<figure>${telefoon(taal, s, b[i])}<figcaption>${esc(b[i])}</figcaption></figure>`).join('')}
  </div>
</div></section>

<section id="functies" class="functies"><div class="wrap">
  <p class="kicker">${esc(x.functies.kicker)}</p><h2 class="kop2">${esc(x.functies.titel)}</h2>
  <div class="flijst">
    ${x.functies.lijst.map((f) => `<article class="functie"><h3>${esc(f.titel)}</h3><p>${esc(f.tekst)}</p></article>`).join('')}
  </div>
</div></section>

<section id="niveaus"><div class="wrap">
  <p class="kicker">${esc(x.niveaus.kicker)}</p><h2 class="kop2">${esc(x.niveaus.titel)}</h2>
  <div class="nlijst">
    ${x.niveaus.lijst
      .map(
        (n, i) =>
          `<article class="niveau"><div class="meter" aria-hidden="true">${[0, 1, 2, 3, 4].map((j) => `<i${j <= i ? ` style="background:${i === 4 ? '#D8FB59' : NIVEAU_KLEUREN[Math.min(j + 1, 3)]}"` : ''}></i>`).join('')}</div><h3>${esc(n.naam)}</h3><p>${esc(n.tekst)}</p></article>`,
      )
      .join('')}
  </div>
</div></section>

<section class="prive" style="padding-top:0"><div class="wrap"><div class="kaart">
  <div class="slot" aria-hidden="true"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#D8FB59" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.5" fill="#D8FB59"/></svg></div>
  <div><p class="kicker">${esc(x.privacy.kicker)}</p><h2 class="kop2">${esc(x.privacy.titel)}</h2><p>${esc(x.privacy.tekst)}</p><a href="${url(taal, 'privacy')}">${esc(x.privacy.link)} →</a></div>
</div></div></section>

<section id="faq" class="faq" style="padding-top:0"><div class="wrap">
  <p class="kicker">${esc(x.faq.kicker)}</p><h2 class="kop2">${esc(x.faq.titel)}</h2>
  ${x.faq.lijst.map((f) => `<details><summary>${esc(f.v)}</summary><p>${esc(f.a)}</p></details>`).join('')}
</div></section>

<section id="download" style="padding-top:20px"><div class="wrap"><div class="slotcta">
  <h2 class="kop">${esc(x.hero.titel)}<span> ${esc(x.cta.titel)}</span></h2>
  <p>${esc(x.cta.tekst)}</p>
  ${stores}
  <form class="wachtlijst" id="wachtlijst" novalidate>
    <h3>${esc(x.wachtlijst.titel)}</h3>
    <p>${esc(x.wachtlijst.tekst)}</p>
    <div class="veld">
      <label class="sr" for="wl-email">E-mail</label>
      <input id="wl-email" type="email" name="email" autocomplete="email" required placeholder="${esc(x.wachtlijst.plaats)}">
      <button type="submit">${esc(x.wachtlijst.knop)}</button>
    </div>
    <p class="wl-melding" role="status" aria-live="polite"></p>
    <small>${esc(x.wachtlijst.klein)} <a href="${url(taal, 'privacy')}">→</a></small>
  </form>
</div></div></section>
<script>
(() => {
  const form = document.getElementById('wachtlijst');
  const melding = form.querySelector('.wl-melding');
  const knop = form.querySelector('button');
  const teksten = ${JSON.stringify({ bezig: x.wachtlijst.bezig, gelukt: x.wachtlijst.gelukt, fout: x.wachtlijst.fout, ongeldig: x.wachtlijst.ongeldig, teVaak: x.wachtlijst.teVaak, knop: x.wachtlijst.knop })};
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^ @]+@[^ @]+[.][^ @]{2,}$/.test(email)) { melding.textContent = teksten.ongeldig; return; }
    knop.disabled = true; knop.textContent = teksten.bezig; melding.textContent = '';
    try {
      const antwoord = await fetch('${wachtlijstUrl}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, taal: '${taal}' }) });
      if (antwoord.ok) { form.classList.add('klaar'); melding.textContent = teksten.gelukt; form.email.value = ''; }
      else melding.textContent = antwoord.status === 429 ? teksten.teVaak : antwoord.status === 400 ? teksten.ongeldig : teksten.fout;
    } catch { melding.textContent = teksten.fout; }
    knop.disabled = false; knop.textContent = teksten.knop;
  });
})();
</script>
</main>

<footer><div class="wrap">
  <span>© 2026 Hylke Thiry</span>
  <a href="${url(taal, 'privacy')}">${esc(privacyLabel)}</a>
  <a href="${url(taal, 'verwijderen')}">${esc(verwijderLabel)}</a>
  <a href="mailto:${mail}">${mail}</a>
  <span class="gezond">${esc(x.gezondheid)}</span>
</div></footer>
</body></html>
`;
}
