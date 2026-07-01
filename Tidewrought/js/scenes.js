/*
 * Tidewrought — scene artwork. Flat, layered SVG (viewBox 960x540).
 * Hotspots are <g data-hotspot="id"> groups; game.js decides which are live.
 * Day/night is toggled with the body class "night" (see CSS).
 */
(function (root) {
  const TW = (root.TW = root.TW || {});

  // ------------------------------------------------------------ shared bits
  const DEFS = `
  <defs>
    <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8ecfdf"/><stop offset="0.7" stop-color="#cfe8dd"/><stop offset="1" stop-color="#f2dfb4"/>
    </linearGradient>
    <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0c1230"/><stop offset="0.75" stop-color="#1d2a4d"/><stop offset="1" stop-color="#2c3a5e"/>
    </linearGradient>
    <linearGradient id="seaDay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b7f8f"/><stop offset="1" stop-color="#175d6e"/>
    </linearGradient>
    <linearGradient id="seaNight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#14304d"/><stop offset="1" stop-color="#0a1e33"/>
    </linearGradient>
    <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e6d3a3"/><stop offset="1" stop-color="#cdb684"/>
    </linearGradient>
    <radialGradient id="spirit" cx="0.5" cy="0.35" r="0.75">
      <stop offset="0" stop-color="#bdf3e6" stop-opacity="0.95"/>
      <stop offset="0.55" stop-color="#6fc7c9" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#2b7f8f" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="flame" cx="0.5" cy="0.7" r="0.7">
      <stop offset="0" stop-color="#fff8dc"/><stop offset="0.6" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff9d45" stop-opacity="0.1"/>
    </radialGradient>
    <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffdf9e" stop-opacity="0.8"/><stop offset="1" stop-color="#ffdf9e" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

  function sky(w) {
    return `
    <g class="only-day"><rect width="${w}" height="360" fill="url(#skyDay)"/>
      <circle cx="790" cy="86" r="38" fill="#fff3c8" opacity="0.95"/>
      <circle cx="790" cy="86" r="52" fill="#fff3c8" opacity="0.25"/>
      <ellipse cx="240" cy="90" rx="90" ry="16" fill="#ffffff" opacity="0.5"/>
      <ellipse cx="520" cy="140" rx="60" ry="11" fill="#ffffff" opacity="0.4"/>
    </g>
    <g class="only-night"><rect width="${w}" height="360" fill="url(#skyNight)"/>
      <circle cx="700" cy="90" r="30" fill="#e8ecf5" opacity="0.95"/>
      <circle cx="690" cy="84" r="7" fill="#c9d2e4" opacity="0.6"/><circle cx="710" cy="100" r="5" fill="#c9d2e4" opacity="0.5"/>
      ${[
        [60,40],[150,90],[260,50],[340,120],[430,30],[520,100],[610,60],[850,50],[910,130],[80,160],[200,180],[560,170],[890,200],[380,80],[480,190],[760,180],[30,110],[330,200],[630,150],[940,90]
      ].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#dfe7f7" opacity="0.9"/>`).join('')}
    </g>`;
  }

  function seaBand(y, h, w) {
    return `
    <g class="only-day"><rect y="${y}" width="${w}" height="${h}" fill="url(#seaDay)"/></g>
    <g class="only-night"><rect y="${y}" width="${w}" height="${h}" fill="url(#seaNight)"/></g>
    <g opacity="0.35">
      <path d="M0 ${y + 18} Q 120 ${y + 10}, 240 ${y + 18} T 480 ${y + 18} T 720 ${y + 18} T 960 ${y + 18}" stroke="#bfe8ea" stroke-width="3" fill="none"/>
      <path d="M0 ${y + 46} Q 150 ${y + 38}, 300 ${y + 46} T 600 ${y + 46} T 900 ${y + 46} L 960 ${y + 46}" stroke="#a8dade" stroke-width="2.5" fill="none"/>
      <path d="M0 ${y + 80} Q 100 ${y + 73}, 200 ${y + 80} T 400 ${y + 80} T 600 ${y + 80} T 800 ${y + 80} T 960 ${y + 80}" stroke="#8fccd2" stroke-width="2" fill="none"/>
    </g>`;
  }

  // Simple characterful figures
  function figNimi(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M -10 34 C -12 12, -8 0, 0 0 C 8 0, 12 12, 10 34 Z" fill="#c96f4a"/>
      <circle cx="0" cy="-8" r="9.5" fill="#e8b48a"/>
      <path d="M -9 -12 C -6 -20, 8 -21, 10 -11 C 6 -16, -4 -17, -9 -12 Z" fill="#4a3128"/>
      <path d="M 10 -11 L 14 -16" stroke="#4a3128" stroke-width="3" stroke-linecap="round"/>
      <path d="M -10 12 L -18 22" stroke="#c96f4a" stroke-width="5" stroke-linecap="round"/>
      <path d="M 10 12 L 19 18" stroke="#c96f4a" stroke-width="5" stroke-linecap="round"/>
    </g>`;
  }
  function figTuro(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M -14 44 C -16 16, -10 0, 0 0 C 10 0, 16 16, 14 44 Z" fill="#5d6b5a"/>
      <circle cx="0" cy="-9" r="10.5" fill="#caa27a"/>
      <path d="M -14 -13 L 14 -13 L 10 -21 L -10 -21 Z" fill="#8a7550"/>
      <path d="M -16 -13 L 16 -13" stroke="#6e5c3e" stroke-width="3"/>
      <path d="M -6 -3 C -2 -1, 2 -1, 6 -3" stroke="#8a6f4d" stroke-width="2" fill="none"/>
      <path d="M -13 14 L -24 30 M 13 14 L 22 26" stroke="#5d6b5a" stroke-width="6" stroke-linecap="round"/>
    </g>`;
  }
  function figMara(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M -13 42 C -15 14, -9 0, 0 0 C 9 0, 15 14, 13 42 Z" fill="#7d4f63"/>
      <path d="M -11 22 L 11 22 L 9 42 L -9 42 Z" fill="#d9c9a8"/>
      <circle cx="0" cy="-9" r="10" fill="#d8a97e"/>
      <path d="M -10 -14 C -12 -4, 12 -4, 10 -14 C 6 -20, -6 -20, -10 -14 Z" fill="#c96f2f"/>
      <path d="M -12 12 L -20 20 M 12 12 L 20 20" stroke="#7d4f63" stroke-width="5" stroke-linecap="round"/>
    </g>`;
  }
  function figNauro(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M -17 44 C -19 14, -11 0, 0 0 C 11 0, 19 14, 17 44 Z" fill="#3f5266"/>
      <circle cx="0" cy="-9" r="11" fill="#b98d63"/>
      <path d="M -15 -12 C -15 -22, 15 -22, 15 -12 L 18 -10 L -18 -10 Z" fill="#2e3a48"/>
      <path d="M -16 16 L -26 28 M 16 16 L 26 28" stroke="#3f5266" stroke-width="7" stroke-linecap="round"/>
    </g>`;
  }
  function figVillager(x, y, s, hue) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M -11 38 C -13 12, -8 0, 0 0 C 8 0, 13 12, 11 38 Z" fill="${hue}"/>
      <circle cx="0" cy="-8" r="9" fill="#d3a67c"/>
    </g>`;
  }

  function houseShape(x, y, s, wall, roof) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <rect x="0" y="30" width="90" height="60" fill="${wall}"/>
      <path d="M -8 32 L 45 0 L 98 32 Z" fill="${roof}"/>
      <rect x="14" y="52" width="18" height="38" fill="#4c3a2c"/>
      <rect x="56" y="52" width="16" height="16" fill="#2c3a48" class="win"/>
      <g class="only-night"><rect x="56" y="52" width="16" height="16" fill="#ffce7a" opacity="0.85"/></g>
    </g>`;
  }

  function boatShape(x, y, s, hull) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M 0 0 C 20 26, 100 26, 120 0 L 104 20 C 80 34, 40 34, 16 20 Z" fill="${hull}"/>
      <path d="M 0 0 C 20 26, 100 26, 120 0" fill="none" stroke="#22333b" stroke-width="3" opacity="0.4"/>
    </g>`;
  }

  // ---------------------------------------------------------------- scenes
  const SCENES = {};

  SCENES.shore = {
    anchors: { nimi: [332, 320], turo: [600, 330] },
    svg: `
      ${DEFS}
      ${sky(960)}
      <g data-hotspot="sea">${seaBand(240, 130, 960)}</g>
      <rect y="352" width="960" height="188" fill="url(#sand)"/>
      <path d="M0 352 Q 240 340, 480 352 T 960 352 L 960 368 Q 720 378, 480 368 T 0 368 Z" fill="#f4e8c6" opacity="0.7"/>
      <g data-hotspot="path">
        <path d="M 860 260 L 960 245 L 960 300 L 880 305 Z" fill="#d8c491"/>
        <path d="M 872 268 L 950 256 M 880 285 L 952 276" stroke="#bfa871" stroke-width="4" opacity="0.7"/>
        <path d="M 900 210 L 925 195 L 950 208 L 950 232 L 900 232 Z" fill="#8a7550" opacity="0.9"/>
      </g>
      <g data-hotspot="wreck">
        <path d="M 60 430 C 55 380, 70 350, 95 340 M 110 435 C 108 385, 120 355, 145 348 M 165 438 C 165 395, 172 372, 190 362" stroke="#5f4a38" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M 40 300 L 52 440" stroke="#4c3a2c" stroke-width="8" stroke-linecap="round"/>
        <path d="M 52 330 L 110 316" stroke="#4c3a2c" stroke-width="6" stroke-linecap="round"/>
        <path d="M 30 440 L 210 440 L 195 455 L 45 455 Z" fill="#6e5843"/>
      </g>
      <g data-hotspot="fishflop">
        <ellipse cx="405" cy="392" rx="17" ry="7" fill="#9fc6c9"/>
        <path d="M 420 392 L 432 384 L 432 400 Z" fill="#9fc6c9"/>
        <circle cx="396" cy="390" r="1.8" fill="#26414a"/>
        <path d="M 380 402 Q 405 408, 435 402" stroke="#c8e4e2" stroke-width="2" fill="none" opacity="0.7"/>
      </g>
      <g data-hotspot="rock">
        <path d="M 730 420 C 720 380, 760 362, 795 372 C 830 358, 862 385, 855 420 Z" fill="#5c5c6c"/>
        <path d="M 745 405 C 760 392, 790 388, 815 396" stroke="#6f6f80" stroke-width="4" fill="none"/>
      </g>
      <g data-hotspot="bird">
        <path d="M 795 352 C 792 344, 798 338, 805 340 C 812 332, 822 336, 820 344 C 826 346, 826 352, 820 354 Z" fill="#cfd6dd"/>
        <circle cx="816" cy="341" r="1.5" fill="#333"/>
        <path d="M 820 344 L 828 342" stroke="#e5a03c" stroke-width="2.5"/>
        <path d="M 803 354 L 803 360 M 810 354 L 810 360" stroke="#e5a03c" stroke-width="2"/>
      </g>
      <g data-hotspot="boat">${boatShape(520, 372, 1, '#3e7d8a')}
        <path d="M 545 372 L 545 330 M 545 330 L 590 342" stroke="#4c3a2c" stroke-width="4"/>
      </g>
      <g data-hotspot="hut">
        <g transform="translate(690,250) scale(0.9)">
          <rect x="0" y="28" width="76" height="52" fill="#7a6248"/>
          <path d="M -10 30 L 38 -4 L 86 30 Z" fill="#54606b"/>
          <rect x="28" y="46" width="20" height="34" fill="#3d2f22"/>
          <g class="only-night"><ellipse cx="38" cy="60" rx="42" ry="26" fill="url(#lamp)"/></g>
        </g>
      </g>
      <g data-hotspot="basket">
        <path d="M 560 420 L 605 420 L 598 448 L 567 448 Z" fill="#a9895d"/>
        <path d="M 560 420 L 605 420" stroke="#8a6f45" stroke-width="4"/>
        <path d="M 566 414 C 574 404, 590 404, 598 414" stroke="#9fc6c9" stroke-width="5" fill="none"/>
      </g>
      <g data-hotspot="turo">${figTuro(600, 330, 1.15)}
        <path d="M 575 372 C 600 358, 640 362, 655 378 C 630 384, 592 384, 575 372 Z" fill="#8aa5a0" opacity="0.7"/>
      </g>
      <g data-hotspot="nimi">${figNimi(332, 320, 1.05)}</g>
    `,
  };

  SCENES.village = {
    anchors: { nimi: [180, 350], mara: [560, 330], villager1: [300, 300], villager2: [370, 302] },
    svg: `
      ${DEFS}
      ${sky(960)}
      <rect y="330" width="960" height="210" fill="#c9b287"/>
      <path d="M 0 330 L 960 330 L 960 340 L 0 340 Z" fill="#b39c72" opacity="0.6"/>
      ${houseShape(40, 200, 1.1, '#e7ddc8', '#a8643e')}
      ${houseShape(180, 220, 0.9, '#dccfb4', '#8e5a3a')}
      ${houseShape(740, 205, 1.05, '#e7ddc8', '#96552f')}
      <g data-hotspot="pathShore">
        <path d="M 0 400 L 90 380 L 130 420 L 0 460 Z" fill="#d8c491"/>
      </g>
      <g data-hotspot="pathJetty">
        <path d="M 960 390 L 870 380 L 840 420 L 960 452 Z" fill="#d8c491"/>
        <path d="M 900 355 L 935 338 L 958 352 L 958 372 L 905 372 Z" fill="#8a7550" opacity="0.9"/>
      </g>
      <g data-hotspot="well">
        <g transform="translate(300,368)">
          <ellipse cx="0" cy="28" rx="42" ry="12" fill="#7d7d8d"/>
          <path d="M -40 28 L -40 -2 C -40 -14, 40 -14, 40 -2 L 40 28" fill="#8d8d9d"/>
          <path d="M -40 -2 C -40 -14, 40 -14, 40 -2 C 40 8, -40 8, -40 -2 Z" fill="#5c5c6c"/>
          <path d="M -34 -8 L -34 -46 M 34 -8 L 34 -46 M -40 -46 L 40 -46" stroke="#6e5843" stroke-width="6"/>
          <rect x="-9" y="-42" width="18" height="14" fill="#a9895d"/>
        </g>
      </g>
      <g data-hotspot="stall">
        <g transform="translate(470,270)">
          <path d="M -20 20 L 220 20 L 200 -16 L 0 -16 Z" fill="#b0413e"/>
          <path d="M -20 20 L 220 20 L 220 30 L -20 30 Z" fill="#8f3431"/>
          <rect x="0" y="30" width="14" height="110" fill="#6e5843"/><rect x="186" y="30" width="14" height="110" fill="#6e5843"/>
          <rect x="-6" y="92" width="212" height="16" fill="#8a6f4d"/>
          <ellipse cx="40" cy="88" rx="22" ry="8" fill="#9fc6c9"/>
          <ellipse cx="95" cy="88" rx="20" ry="9" fill="#dbb46a"/>
          <ellipse cx="150" cy="88" rx="18" ry="8" fill="#c98d5f"/>
          <rect x="20" y="34" width="70" height="40" fill="#efe4c8" rx="3" class="priceboard"/>
        </g>
      </g>
      <g data-hotspot="saltpouch">
        <g transform="translate(628,342)">
          <path d="M 0 18 C -8 18, -8 2, 0 0 C 2 -6, 12 -6, 14 0 C 22 2, 22 18, 14 18 Z" fill="#e8e2d2"/>
          <path d="M 4 0 C 6 -4, 10 -4, 12 0" stroke="#b8ae96" stroke-width="2" fill="none"/>
        </g>
      </g>
      <g data-hotspot="baskets">
        <g transform="translate(700,380)">
          <path d="M 0 0 L 58 0 L 50 34 L 8 34 Z" fill="#a9895d"/>
          <path d="M 78 0 L 136 0 L 128 34 L 86 34 Z" fill="#a9895d"/>
          <path d="M 0 0 L 58 0 M 78 0 L 136 0" stroke="#8a6f45" stroke-width="4"/>
          <rect x="10" y="-24" width="38" height="18" fill="#efe4c8" rx="2"/>
          <rect x="84" y="-24" width="46" height="18" fill="#efe4c8" rx="2"/>
        </g>
      </g>
      <g data-hotspot="villagers">
        ${figVillager(300, 300, 1, '#6b7d8f')}
        ${figVillager(370, 302, 0.95, '#8f6b57')}
      </g>
      <g data-hotspot="mara">${figMara(560, 330, 1.1)}</g>
      <g data-hotspot="nimi">${figNimi(180, 350, 1.05)}</g>
    `,
  };

  SCENES.jetty = {
    anchors: { nimi: [250, 360], nauro: [620, 330] },
    svg: `
      ${DEFS}
      ${sky(960)}
      ${seaBand(250, 290, 960)}
      <g data-hotspot="towerFar">
        <path d="M 815 250 L 823 130 L 837 130 L 845 250 Z" fill="#20242e"/>
        <path d="M 800 250 L 860 250 L 866 262 L 794 262 Z" fill="#161a22"/>
        <circle cx="830" cy="124" r="7" fill="#20242e"/>
      </g>
      <g data-hotspot="jetty">
        <path d="M 80 540 L 700 380 L 760 380 L 260 540 Z" fill="#8a6f4d"/>
        <path d="M 80 540 L 700 380 M 260 540 L 760 380" stroke="#6e5843" stroke-width="5"/>
        <path d="M 300 470 L 300 520 M 420 440 L 420 490 M 540 410 L 540 458 M 660 388 L 660 430" stroke="#5d4a37" stroke-width="9" stroke-linecap="round"/>
      </g>
      <g data-hotspot="ferryboat">${boatShape(640, 400, 1.15, '#4c5a66')}
        <path d="M 700 400 L 700 350" stroke="#3a2e22" stroke-width="4"/>
      </g>
      <g data-hotspot="nauro">
        ${figNauro(620, 330, 1.15)}
        <path d="M 585 372 L 596 300" stroke="#54606b" stroke-width="5" stroke-linecap="round"/>
      </g>
      <g data-hotspot="nimi">${figNimi(250, 360, 1.05)}</g>
      <g data-hotspot="pathVillage">
        <path d="M 0 380 L 100 360 L 140 400 L 0 440 Z" fill="#d8c491"/>
      </g>
    `,
  };

  SCENES.crossing = {
    anchors: { nauro: [430, 300] },
    svg: `
      ${DEFS}
      ${sky(960)}
      ${seaBand(230, 310, 960)}
      <g>
        <path d="M 610 350 L 640 120 L 680 120 L 710 350 Z" fill="#191d26"/>
        <circle cx="660" cy="110" r="18" fill="#191d26"/>
        <path d="M 560 350 L 760 350 L 780 380 L 540 380 Z" fill="#12151c"/>
      </g>
      ${boatShape(330, 340, 1.5, '#4c5a66')}
      ${figNauro(430, 300, 1.1)}
      <g transform="translate(360,300) scale(1.05)">
        <path d="M -11 38 C -13 12, -8 0, 0 0 C 8 0, 13 12, 11 38 Z" fill="#7a6a52"/>
        <circle cx="0" cy="-8" r="9" fill="#d8b48e"/>
      </g>
      <path d="M 470 322 L 520 360" stroke="#54606b" stroke-width="5" stroke-linecap="round"/>
      <path d="M 200 470 Q 330 455, 480 470 T 760 468" stroke="#bfe8ea" stroke-width="3" fill="none" opacity="0.4"/>
    `,
  };

  SCENES.tower = {
    anchors: { nauro: [130, 420], anu: [480, 260] },
    svg: `
      ${DEFS}
      ${sky(960)}
      ${seaBand(300, 120, 960)}
      <path d="M 0 400 C 200 360, 340 372, 480 388 C 660 372, 820 380, 960 400 L 960 540 L 0 540 Z" fill="#23262f"/>
      <path d="M 60 420 C 220 388, 700 388, 920 424" stroke="#31353f" stroke-width="8" fill="none" opacity="0.7"/>
      <g data-hotspot="towerbody">
        <path d="M 380 400 L 410 60 L 550 60 L 580 400 Z" fill="#191d26"/>
        <path d="M 400 60 C 420 30, 540 30, 560 60 Z" fill="#12151c"/>
        <path d="M 420 120 L 540 120 M 428 200 L 532 200 M 434 290 L 526 290" stroke="#23262f" stroke-width="5"/>
      </g>
      <g data-hotspot="door">
        <path d="M 445 400 L 448 300 C 448 280, 512 280, 512 300 L 515 400 Z" fill="#2c3140" class="doorSlab"/>
        <g class="doorOpen" style="display:none">
          <path d="M 445 400 L 448 300 C 448 280, 512 280, 512 300 L 515 400 Z" fill="#05070c"/>
        </g>
        <rect x="440" y="252" width="80" height="40" fill="#20242e"/>
      </g>
      <g data-hotspot="stairs">
        <path d="M 460 398 L 466 330 L 494 330 L 500 398 Z" fill="#0a0d14" opacity="0.001"/>
      </g>
      <g data-hotspot="brazier">
        <path d="M 640 356 L 640 420" stroke="#3a3f4c" stroke-width="8" stroke-linecap="round"/>
        <path d="M 616 356 L 664 356 L 656 336 L 624 336 Z" fill="#4a505e"/>
        <g class="brazierFlame">
          <ellipse cx="640" cy="322" rx="30" ry="34" fill="url(#flame)"/>
          <path d="M 640 300 C 630 312, 632 322, 640 334 C 648 322, 650 312, 640 300 Z" fill="#fff4cf"/>
        </g>
      </g>
      <g data-hotspot="pool">
        <ellipse cx="230" cy="480" rx="90" ry="26" fill="#1d4a5c"/>
        <ellipse cx="230" cy="477" rx="80" ry="20" fill="#2b6d80"/>
        <path d="M 175 474 Q 230 466, 285 474" stroke="#9fd4da" stroke-width="2.5" fill="none" opacity="0.6"/>
      </g>
      <g data-hotspot="carvings">
        <path d="M 388 380 L 572 380 M 392 364 L 568 364" stroke="#31353f" stroke-width="4"/>
        <rect x="398" y="340" width="164" height="16" fill="#23262f"/>
      </g>
      <g data-hotspot="nauroBoat">${boatShape(60, 440, 1, '#4c5a66')}${figNauro(130, 420, 0.9)}</g>
    `,
  };

  SCENES.summit = {
    anchors: { anu: [480, 220] },
    svg: `
      ${DEFS}
      ${sky(960)}
      <rect y="330" width="960" height="210" fill="#191d26"/>
      <path d="M 0 330 L 960 330 L 940 360 L 20 360 Z" fill="#20242e"/>
      <path d="M 60 330 L 60 240 M 900 330 L 900 240 M 60 244 L 900 244" stroke="#20242e" stroke-width="14"/>
      <g data-hotspot="pool2">
        <ellipse cx="480" cy="420" rx="180" ry="48" fill="#0f3a4a"/>
        <ellipse cx="480" cy="415" rx="164" ry="40" fill="#175d6e"/>
        <path d="M 350 410 Q 480 396, 610 410" stroke="#8fd0d6" stroke-width="3" fill="none" opacity="0.5"/>
        <path d="M 380 424 Q 480 414, 580 424" stroke="#6db6be" stroke-width="2.5" fill="none" opacity="0.4"/>
      </g>
      <g data-hotspot="anu" class="spiritBody">
        <ellipse cx="480" cy="250" rx="120" ry="150" fill="url(#spirit)"/>
        <path d="M 420 320 C 430 240, 450 190, 480 170 C 510 190, 530 240, 540 320" fill="none" stroke="#d8fff4" stroke-width="3" opacity="0.5"/>
        <circle cx="458" cy="222" r="6" fill="#eafffa" opacity="0.9"/>
        <circle cx="502" cy="222" r="6" fill="#eafffa" opacity="0.9"/>
      </g>
    `,
  };

  TW.scenes = SCENES;
})(typeof window !== 'undefined' ? window : globalThis);
