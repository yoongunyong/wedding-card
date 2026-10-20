const sharp = require('sharp');
const path = require('path');

const svg = `
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAF8F5"/>
      <stop offset="100%" stop-color="#F2EDE6"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C5A880"/>
      <stop offset="50%" stop-color="#DFCAAA"/>
      <stop offset="100%" stop-color="#B8976C"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="640" height="640" fill="url(#bgGrad)"/>

  <!-- Subtle Border Frame -->
  <rect x="36" y="36" width="568" height="568" rx="20" fill="none" stroke="url(#goldGrad)" stroke-width="2" opacity="0.6"/>
  <rect x="48" y="48" width="544" height="544" rx="14" fill="none" stroke="#C5A880" stroke-width="0.8" opacity="0.3"/>

  <!-- Interlocking Rings Emblem -->
  <g transform="translate(320, 210)" stroke="url(#goldGrad)" stroke-width="3.5" fill="none">
    <circle cx="-20" cy="0" r="42" stroke-dasharray="210 35"/>
    <circle cx="20" cy="0" r="42"/>
    <!-- Diamond Accent -->
    <path d="M-20 -48 L-16 -42 L-20 -36 L-24 -42 Z" fill="url(#goldGrad)" stroke="none"/>
  </g>

  <!-- Brand Typography -->
  <text x="320" y="348" text-anchor="middle" font-family="serif, Georgia, 'Times New Roman'" font-size="36" font-weight="600" letter-spacing="6" fill="#1C1917">
    ATELIER DE MUKIRU
  </text>

  <!-- Divider Line with Diamond -->
  <line x1="210" y1="388" x2="290" y2="388" stroke="#C5A880" stroke-width="1.2" opacity="0.75"/>
  <polygon points="320,384 324,388 320,392 316,388" fill="#C5A880"/>
  <line x1="350" y1="388" x2="430" y2="388" stroke="#C5A880" stroke-width="1.2" opacity="0.75"/>

  <!-- Subtitle -->
  <text x="320" y="428" text-anchor="middle" font-family="sans-serif, Arial, Helvetica" font-size="14" font-weight="500" letter-spacing="7" fill="#78716C">
    PREMIUM WEDDING CARD
  </text>
</svg>
`;

const outputPath = path.join(__dirname, '../public/atelier-de-mukiru-profile.png');

sharp(Buffer.from(svg))
  .png()
  .toFile(outputPath)
  .then(() => console.log('Successfully generated: ' + outputPath))
  .catch(err => console.error(err));
