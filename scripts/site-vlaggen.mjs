// Kleine vlaggen voor de taalkeuze op de site (SVG, ook zichtbaar waar emoji-vlaggen ontbreken)
const ster = (cx, cy, r, draai = 0) => {
  const punten = [];
  for (let i = 0; i < 10; i++) {
    const hoek = ((i * 36 + draai - 90) * Math.PI) / 180;
    const straal = i % 2 ? r * 0.382 : r;
    punten.push(
      `${(cx + straal * Math.cos(hoek)).toFixed(2)},${(cy + straal * Math.sin(hoek)).toFixed(2)}`,
    );
  }
  return `<polygon points="${punten.join(' ')}" fill="#FFDE00"/>`;
};

const VLAGGEN = {
  nl: '<rect width="30" height="20" fill="#21468B"/><rect width="30" height="13.33" fill="#fff"/><rect width="30" height="6.67" fill="#AE1C28"/>',
  en: '<clipPath id="vl-uk"><rect width="30" height="20"/></clipPath><g clip-path="url(#vl-uk)"><rect width="30" height="20" fill="#012169"/><path d="M0,0 30,20M30,0 0,20" stroke="#fff" stroke-width="4"/><path d="M0,0 30,20M30,0 0,20" stroke="#C8102E" stroke-width="1.6"/><path d="M15,0V20M0,10H30" stroke="#fff" stroke-width="6"/><path d="M15,0V20M0,10H30" stroke="#C8102E" stroke-width="3.4"/></g>',
  es: '<rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/>',
  de: '<rect width="30" height="20" fill="#FFCE00"/><rect width="30" height="13.33" fill="#DD0000"/><rect width="30" height="6.67" fill="#000"/>',
  fr: '<rect width="30" height="20" fill="#EF4135"/><rect width="20" height="20" fill="#fff"/><rect width="10" height="20" fill="#0055A4"/>',
  zh: `<rect width="30" height="20" fill="#EE1C25"/>${ster(5, 5, 3)}${ster(10, 2, 1, 23)}${ster(12, 4, 1, 45)}${ster(12, 7, 1, 70)}${ster(10, 9, 1, 20)}`,
};

export function vlag(taal) {
  return `<svg class="vlag" width="24" height="16" viewBox="0 0 30 20" aria-hidden="true">${VLAGGEN[taal]}</svg>`;
}
