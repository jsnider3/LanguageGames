// SongData.js — 5 procedurally-defined cyberpunk songs for NeonPulse rhythm game
// Each song contains instrument synthesis patterns AND rhythm game charts at 3 difficulties.

// ---------------------------------------------------------------------------
// Helper: build a chart by stamping pattern notes relative to section starts
// ---------------------------------------------------------------------------
function buildChart(sections, patternLib) {
    const notes = [];
    for (const { pattern, startBeat, bars } of sections) {
        const pat = patternLib[pattern];
        if (!pat) continue;
        const len = bars * 4;
        for (const n of pat) {
            if (n[0] >= len) continue;
            const abs = [startBeat + n[0], n[1], n[2]];
            if (n.length === 4) abs.push(startBeat + n[3]);
            notes.push(abs);
        }
    }
    notes.sort((a, b) => a[0] - b[0]);
    return { notes };
}

// ---------------------------------------------------------------------------
// 1. NEON HIGHWAY  —  BPM 128, 90s, C minor
// Sections: intro(4) verse(8) chorus(8) verse(8) chorus(8) bridge(4) chorus(8) outro(4)
// Beat offsets: 0, 16, 48, 80, 112, 144, 160, 192  total=208 beats
// ---------------------------------------------------------------------------
const neonHighway = {
    id: 'neon_highway',
    name: 'Neon Highway',
    artist: 'SYNTH//GRID',
    bpm: 128,
    duration: 90,
    difficulty: { easy: 2, normal: 5, hard: 8 },
    instruments: {
        drums: {
            patterns: {
                intro: [
                    [0, 'hat'], [0.5, 'hat'], [1, 'hat'], [1.5, 'hat'],
                    [2, 'hat'], [2.5, 'hat'], [3, 'hat'], [3.5, 'hat']
                ],
                verse: [
                    [0, 'kick'], [0.5, 'hat'], [1, 'snare'], [1.5, 'hat'],
                    [2, 'kick'], [2.5, 'hat'], [3, 'snare'], [3.5, 'hat']
                ],
                chorus: [
                    [0, 'kick'], [0.5, 'hat'], [1, 'snare'], [1, 'clap'], [1.5, 'kick'],
                    [2, 'kick'], [2.5, 'hat'], [3, 'snare'], [3, 'clap'], [3.5, 'kick']
                ],
                bridge: [
                    [0, 'kick'], [1, 'snare'], [2, 'kick'], [2.5, 'kick'], [3, 'snare'], [3.5, 'hat']
                ],
                outro: [
                    [0, 'kick'], [0.5, 'hat'], [1, 'snare'], [2, 'kick'], [3, 'hat']
                ]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'chorus', startBeat: 48, bars: 8 },
                { pattern: 'verse', startBeat: 80, bars: 8 },
                { pattern: 'chorus', startBeat: 112, bars: 8 },
                { pattern: 'bridge', startBeat: 144, bars: 4 },
                { pattern: 'chorus', startBeat: 160, bars: 8 },
                { pattern: 'outro', startBeat: 192, bars: 4 }
            ]
        },
        bass: {
            patterns: {
                intro: [[0, 65.41], [2, 65.41]],
                verse: [[0, 65.41], [1.5, 77.78], [2, 87.31], [3, 98]],
                chorus: [[0, 65.41], [1, 77.78], [1.5, 87.31], [2, 98], [3, 116.54], [3.5, 65.41]],
                bridge: [[0, 87.31], [1, 98], [2, 116.54], [3, 65.41]],
                outro: [[0, 65.41], [2, 77.78]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'chorus', startBeat: 48, bars: 8 },
                { pattern: 'verse', startBeat: 80, bars: 8 },
                { pattern: 'chorus', startBeat: 112, bars: 8 },
                { pattern: 'bridge', startBeat: 144, bars: 4 },
                { pattern: 'chorus', startBeat: 160, bars: 8 },
                { pattern: 'outro', startBeat: 192, bars: 4 }
            ]
        },
        lead: {
            patterns: {
                intro: [],
                verse: [
                    [0, 523.25, 0.5], [0.5, 587.33, 0.5], [1, 622.25, 0.5], [2, 523.25, 1],
                    [3, 466.16, 0.5], [3.5, 523.25, 0.5]
                ],
                chorus: [
                    [0, 622.25, 1], [1, 698.46, 0.5], [1.5, 783.99, 0.5],
                    [2, 622.25, 0.5], [2.5, 523.25, 0.5], [3, 466.16, 1]
                ],
                bridge: [
                    [0, 349.23, 1], [1, 392, 1], [2, 466.16, 1], [3, 523.25, 1]
                ],
                outro: [[0, 523.25, 2], [2, 466.16, 2]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'chorus', startBeat: 48, bars: 8 },
                { pattern: 'verse', startBeat: 80, bars: 8 },
                { pattern: 'chorus', startBeat: 112, bars: 8 },
                { pattern: 'bridge', startBeat: 144, bars: 4 },
                { pattern: 'chorus', startBeat: 160, bars: 8 },
                { pattern: 'outro', startBeat: 192, bars: 4 }
            ]
        },
        pad: {
            patterns: {
                intro: [[0, 130.81, 4]],
                verse: [[0, 130.81, 4]],
                chorus: [[0, 155.56, 2], [2, 174.61, 2]],
                bridge: [[0, 174.61, 4]],
                outro: [[0, 130.81, 4]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'chorus', startBeat: 48, bars: 8 },
                { pattern: 'verse', startBeat: 80, bars: 8 },
                { pattern: 'chorus', startBeat: 112, bars: 8 },
                { pattern: 'bridge', startBeat: 144, bars: 4 },
                { pattern: 'chorus', startBeat: 160, bars: 8 },
                { pattern: 'outro', startBeat: 192, bars: 4 }
            ]
        }
    },
    charts: (() => {
        const secs = [
            { name: 'intro', startBeat: 0, bars: 4 },
            { name: 'verse', startBeat: 16, bars: 8 },
            { name: 'chorus', startBeat: 48, bars: 8 },
            { name: 'verse2', startBeat: 80, bars: 8 },
            { name: 'chorus2', startBeat: 112, bars: 8 },
            { name: 'bridge', startBeat: 144, bars: 4 },
            { name: 'chorus3', startBeat: 160, bars: 8 },
            { name: 'outro', startBeat: 192, bars: 4 }
        ];

        // EASY ~120 notes: whole beats, every other beat in calm sections
        const easyPat = {
            intro: (() => { const n = []; for (let b = 0; b < 16; b += 4) n.push([b, 0, 'tap']); return n; })(),
            verse: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 2) n.push([b, (b >> 1) % 4, 'tap']);
                return n;
            })(),
            chorus: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) n.push([b, b % 4, 'tap']);
                return n;
            })(),
            verse2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 2) n.push([b, (b + 2) % 4, 'tap']);
                return n;
            })(),
            chorus2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) n.push([b, (b + 1) % 4, 'tap']);
                return n;
            })(),
            bridge: (() => { const n = []; for (let b = 0; b < 16; b += 4) n.push([b, (b >> 2) % 4, 'tap']); return n; })(),
            chorus3: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 2) n.push([b, (b + 3) % 4, 'tap']);
                return n;
            })(),
            outro: (() => { const n = []; for (let b = 0; b < 16; b += 4) n.push([b, b % 4, 'tap']); return n; })()
        };

        // NORMAL ~240 notes: half-beats in active sections, occasional doubles
        const normalPat = {
            intro: (() => { const n = []; for (let b = 0; b < 16; b += 2) n.push([b, b % 4, 'tap']); return n; })(),
            verse: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) n.push([b, b % 4, 'tap']);
                for (let b = 1; b < 32; b += 4) n.push([b + 0.5, (b + 1) % 4, 'tap']);
                return n;
            })(),
            chorus: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 1) % 4, 'tap']);
                    if (b % 2 === 0) n.push([b + 0.5, (b + 2) % 4, 'tap']);
                }
                return n;
            })(),
            verse2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) n.push([b, (b + 2) % 4, 'tap']);
                for (let b = 3; b < 32; b += 4) n.push([b + 0.5, (b + 3) % 4, 'tap']);
                return n;
            })(),
            chorus2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, b % 4, 'tap']);
                    if (b % 4 === 0) n.push([b, 2, 'tap']);
                    if (b % 2 === 1) n.push([b + 0.5, (b + 3) % 4, 'tap']);
                }
                return n;
            })(),
            bridge: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 1) n.push([b, b % 4, 'tap']);
                return n;
            })(),
            chorus3: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 3) % 4, 'tap']);
                    if (b % 2 === 0) n.push([b + 0.5, (b + 1) % 4, 'tap']);
                }
                return n;
            })(),
            outro: (() => { const n = []; for (let b = 0; b < 16; b += 2) n.push([b, b % 4, 'tap']); return n; })()
        };

        // HARD ~480 notes: 8th & 16th notes, doubles, holds
        const hardPat = {
            intro: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                return n;
            })(),
            verse: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                for (let b = 0; b < 32; b += 4) n.push([b + 0.25, (b + 1) % 4, 'tap']);
                n.push([8, 1, 'hold', 12]);
                return n;
            })(),
            chorus: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, (Math.floor(b * 2) + 1) % 4, 'tap']);
                    if (b % 2 === 0) n.push([b, (Math.floor(b) + 3) % 4, 'tap']);
                }
                for (let b = 0; b < 32; b += 4) n.push([b + 0.25, Math.floor(b) % 4, 'tap']);
                n.push([4, 2, 'hold', 6]); n.push([20, 0, 'hold', 22]);
                return n;
            })(),
            verse2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) n.push([b, Math.floor(b * 2 + 1) % 4, 'tap']);
                for (let b = 2; b < 32; b += 4) n.push([b + 0.25, (b + 2) % 4, 'tap']);
                n.push([16, 3, 'hold', 20]);
                return n;
            })(),
            chorus2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, (Math.floor(b * 2) + 2) % 4, 'tap']);
                    if (b % 2 === 1) n.push([b, Math.floor(b) % 4, 'tap']);
                }
                for (let b = 1; b < 32; b += 4) n.push([b + 0.25, (b + 3) % 4, 'tap']);
                n.push([8, 1, 'hold', 10]); n.push([24, 3, 'hold', 26]);
                return n;
            })(),
            bridge: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.25) n.push([b, Math.floor(b * 4) % 4, 'tap']);
                n.push([0, 2, 'hold', 4]);
                return n;
            })(),
            chorus3: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, Math.floor(b * 2) % 4, 'tap']);
                    if (b % 4 === 0) n.push([b, 2, 'tap']);
                }
                for (let b = 0; b < 32; b += 8) n.push([b + 6, 0, 'hold', b + 8]);
                return n;
            })(),
            outro: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                n.push([0, 2, 'hold', 8]);
                return n;
            })()
        };

        const secE = secs.map(s => ({ pattern: s.name, startBeat: s.startBeat, bars: s.bars }));
        return {
            easy: buildChart(secE, easyPat),
            normal: buildChart(secE, normalPat),
            hard: buildChart(secE, hardPat)
        };
    })()
};

// ---------------------------------------------------------------------------
// 2. DIGITAL RAIN  —  BPM 140, 95s, A minor
// Sections: intro(4) verse(8) prechorus(4) chorus(8) verse(8) chorus(8) breakdown(4) chorus(8) outro(2)
// Beats:    0        16       48           64        96       128       160          176        208
// Total = 216 beats
// ---------------------------------------------------------------------------
const digitalRain = {
    id: 'digital_rain',
    name: 'Digital Rain',
    artist: 'NULLPTR',
    bpm: 140,
    duration: 95,
    difficulty: { easy: 3, normal: 6, hard: 9 },
    instruments: {
        drums: {
            patterns: {
                intro: [
                    [0, 'kick'], [1, 'hat'], [1.5, 'hat'], [2, 'kick'], [3, 'hat'], [3.5, 'hat']
                ],
                verse: [
                    [0, 'kick'], [0.75, 'hat'], [1, 'snare'], [1.5, 'hat'],
                    [2, 'kick'], [2.5, 'kick'], [3, 'snare'], [3.5, 'hat']
                ],
                prechorus: [
                    [0, 'kick'], [0.5, 'hat'], [1, 'snare'], [1.5, 'hat'],
                    [2, 'kick'], [2.5, 'hat'], [3, 'snare'], [3.25, 'hat'], [3.5, 'snare'], [3.75, 'hat']
                ],
                chorus: [
                    [0, 'kick'], [0.5, 'hat'], [1, 'snare'], [1, 'clap'], [1.5, 'hat'],
                    [2, 'kick'], [2.25, 'kick'], [2.5, 'hat'], [3, 'snare'], [3, 'clap'], [3.5, 'hat']
                ],
                breakdown: [
                    [0, 'kick'], [2, 'kick'], [3, 'hat'], [3.5, 'hat'], [3.75, 'hat']
                ],
                outro: [
                    [0, 'kick'], [1, 'snare'], [2, 'kick']
                ]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'prechorus', startBeat: 48, bars: 4 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'breakdown', startBeat: 160, bars: 4 },
                { pattern: 'chorus', startBeat: 176, bars: 8 },
                { pattern: 'outro', startBeat: 208, bars: 2 }
            ]
        },
        bass: {
            patterns: {
                intro: [[0, 110]],
                verse: [[0, 110], [1, 82.41], [2, 87.31], [3, 98], [3.5, 110]],
                prechorus: [[0, 87.31], [1, 98], [2, 110], [3, 82.41]],
                chorus: [[0, 110], [0.5, 110], [1, 82.41], [2, 87.31], [2.5, 98], [3, 110], [3.5, 82.41]],
                breakdown: [[0, 110], [2, 87.31]],
                outro: [[0, 110], [2, 82.41]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'prechorus', startBeat: 48, bars: 4 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'breakdown', startBeat: 160, bars: 4 },
                { pattern: 'chorus', startBeat: 176, bars: 8 },
                { pattern: 'outro', startBeat: 208, bars: 2 }
            ]
        },
        lead: {
            patterns: {
                intro: [[0, 440, 1], [2, 523.25, 1]],
                verse: [
                    [0, 440, 0.25], [0.5, 523.25, 0.25], [1, 587.33, 0.5],
                    [2, 659.25, 0.25], [2.5, 587.33, 0.25], [3, 523.25, 0.5], [3.5, 440, 0.5]
                ],
                prechorus: [
                    [0, 587.33, 0.5], [0.5, 659.25, 0.5], [1, 698.46, 0.5], [1.5, 783.99, 0.5],
                    [2, 698.46, 0.5], [2.5, 659.25, 0.5], [3, 587.33, 1]
                ],
                chorus: [
                    [0, 880, 0.5], [0.5, 783.99, 0.5], [1, 659.25, 0.5], [1.5, 587.33, 0.25],
                    [2, 440, 0.5], [2.5, 523.25, 0.5], [3, 659.25, 1]
                ],
                breakdown: [[0, 440, 2], [2, 523.25, 2]],
                outro: [[0, 440, 2]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'prechorus', startBeat: 48, bars: 4 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'breakdown', startBeat: 160, bars: 4 },
                { pattern: 'chorus', startBeat: 176, bars: 8 },
                { pattern: 'outro', startBeat: 208, bars: 2 }
            ]
        },
        pad: {
            patterns: {
                intro: [[0, 220, 4]],
                verse: [[0, 220, 4]],
                prechorus: [[0, 174.61, 2], [2, 196, 2]],
                chorus: [[0, 220, 2], [2, 174.61, 2]],
                breakdown: [[0, 220, 4]],
                outro: [[0, 220, 4]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'prechorus', startBeat: 48, bars: 4 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'breakdown', startBeat: 160, bars: 4 },
                { pattern: 'chorus', startBeat: 176, bars: 8 },
                { pattern: 'outro', startBeat: 208, bars: 2 }
            ]
        }
    },
    charts: (() => {
        const secs = [
            { name: 'intro', startBeat: 0, bars: 4 },
            { name: 'verse', startBeat: 16, bars: 8 },
            { name: 'prechorus', startBeat: 48, bars: 4 },
            { name: 'chorus', startBeat: 64, bars: 8 },
            { name: 'verse2', startBeat: 96, bars: 8 },
            { name: 'chorus2', startBeat: 128, bars: 8 },
            { name: 'breakdown', startBeat: 160, bars: 4 },
            { name: 'chorus3', startBeat: 176, bars: 8 },
            { name: 'outro', startBeat: 208, bars: 2 }
        ];

        // EASY ~140 notes
        const easyPat = {
            intro: (() => { const n = []; for (let b = 0; b < 16; b += 4) n.push([b, 0, 'tap']); return n; })(),
            verse: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b >> 1) % 4, 'tap']); return n; })(),
            prechorus: (() => { const n = []; for (let b = 0; b < 16; b += 1) n.push([b, b % 4, 'tap']); return n; })(),
            chorus: (() => { const n = []; for (let b = 0; b < 32; b += 1) n.push([b, (b + 2) % 4, 'tap']); return n; })(),
            verse2: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b + 1) % 4, 'tap']); return n; })(),
            chorus2: (() => { const n = []; for (let b = 0; b < 32; b += 1) n.push([b, (b + 3) % 4, 'tap']); return n; })(),
            breakdown: (() => { const n = []; for (let b = 0; b < 16; b += 4) n.push([b, (b >> 2) % 4, 'tap']); return n; })(),
            chorus3: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, b % 4, 'tap']); return n; })(),
            outro: (() => { const n = []; for (let b = 0; b < 8; b += 4) n.push([b, 0, 'tap']); return n; })()
        };

        // NORMAL ~260 notes
        const normalPat = {
            intro: (() => { const n = []; for (let b = 0; b < 16; b += 2) n.push([b, b % 4, 'tap']); return n; })(),
            verse: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) n.push([b, (b + 1) % 4, 'tap']);
                for (let b = 1; b < 32; b += 4) n.push([b + 0.5, (b + 2) % 4, 'tap']);
                return n;
            })(),
            prechorus: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.5) { if (b % 1 === 0) n.push([b, b % 4, 'tap']); else n.push([b, (Math.floor(b) + 2) % 4, 'tap']); }
                return n;
            })(),
            chorus: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 2) % 4, 'tap']);
                    if (b % 4 === 0) n.push([b, 0, 'tap']);
                    if (b % 2 === 0) n.push([b + 0.5, (b + 1) % 4, 'tap']);
                }
                return n;
            })(),
            verse2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) n.push([b, b % 4, 'tap']);
                for (let b = 3; b < 32; b += 4) n.push([b + 0.5, (b + 3) % 4, 'tap']);
                return n;
            })(),
            chorus2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 3) % 4, 'tap']);
                    if (b % 4 === 2) n.push([b, 1, 'tap']);
                    if (b % 2 === 1) n.push([b + 0.5, (b + 2) % 4, 'tap']);
                }
                return n;
            })(),
            breakdown: (() => { const n = []; for (let b = 0; b < 16; b += 1) n.push([b, b % 4, 'tap']); return n; })(),
            chorus3: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 1) % 4, 'tap']);
                    if (b % 2 === 0) n.push([b + 0.5, (b + 3) % 4, 'tap']);
                }
                return n;
            })(),
            outro: (() => { const n = []; for (let b = 0; b < 8; b += 1) n.push([b, b % 4, 'tap']); return n; })()
        };

        // HARD ~500 notes
        const hardPat = {
            intro: (() => { const n = []; for (let b = 0; b < 16; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']); return n; })(),
            verse: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) n.push([b, Math.floor(b * 2 + 1) % 4, 'tap']);
                for (let b = 0; b < 32; b += 4) n.push([b + 0.25, b % 4, 'tap']);
                n.push([8, 2, 'hold', 12]);
                return n;
            })(),
            prechorus: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.25) n.push([b, Math.floor(b * 4) % 4, 'tap']);
                n.push([0, 2, 'hold', 4]);
                return n;
            })(),
            chorus: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, (Math.floor(b * 2) + 2) % 4, 'tap']);
                    if (b % 2 === 0) n.push([b, Math.floor(b) % 4, 'tap']);
                }
                for (let b = 0; b < 32; b += 4) n.push([b + 0.25, (b + 1) % 4, 'tap']);
                n.push([4, 1, 'hold', 6]); n.push([20, 3, 'hold', 22]);
                return n;
            })(),
            verse2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                for (let b = 2; b < 32; b += 4) n.push([b + 0.25, (b + 2) % 4, 'tap']);
                n.push([16, 0, 'hold', 20]);
                return n;
            })(),
            chorus2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, (Math.floor(b * 2) + 3) % 4, 'tap']);
                    if (b % 2 === 1) n.push([b, (Math.floor(b) + 1) % 4, 'tap']);
                }
                for (let b = 1; b < 32; b += 4) n.push([b + 0.25, (b + 3) % 4, 'tap']);
                n.push([8, 0, 'hold', 10]); n.push([24, 2, 'hold', 26]);
                return n;
            })(),
            breakdown: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                n.push([0, 1, 'hold', 4]); n.push([8, 3, 'hold', 12]);
                return n;
            })(),
            chorus3: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, Math.floor(b * 2) % 4, 'tap']);
                    if (b % 4 === 0) n.push([b, 2, 'tap']);
                }
                for (let b = 0; b < 32; b += 8) n.push([b + 5, 0, 'hold', b + 7]);
                return n;
            })(),
            outro: (() => {
                const n = [];
                for (let b = 0; b < 8; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                n.push([0, 2, 'hold', 4]);
                return n;
            })()
        };

        const secE = secs.map(s => ({ pattern: s.name, startBeat: s.startBeat, bars: s.bars }));
        return {
            easy: buildChart(secE, easyPat),
            normal: buildChart(secE, normalPat),
            hard: buildChart(secE, hardPat)
        };
    })()
};

// ---------------------------------------------------------------------------
// 3. CHROME SUNSET  —  BPM 110, 100s, E minor
// Sections: intro(8) verse(8) chorus(8) verse(8) chorus(8) solo(8) chorus(8) outro(4)
// Beats:    0        32       64        96       128       160      192       224
// Total = 240 beats
// ---------------------------------------------------------------------------
const chromeSunset = {
    id: 'chrome_sunset',
    name: 'Chrome Sunset',
    artist: 'WAVE.EXE',
    bpm: 110,
    duration: 100,
    difficulty: { easy: 2, normal: 4, hard: 7 },
    instruments: {
        drums: {
            patterns: {
                intro: [
                    [0, 'kick'], [2, 'snare'], [2.5, 'hat'], [3, 'hat'], [3.5, 'hat']
                ],
                verse: [
                    [0, 'kick'], [1, 'hat'], [1.5, 'hat'], [2, 'snare'],
                    [2.5, 'hat'], [3, 'hat'], [3.5, 'hat']
                ],
                chorus: [
                    [0, 'kick'], [0.5, 'hat'], [1, 'hat'], [1.5, 'hat'],
                    [2, 'snare'], [2, 'clap'], [2.5, 'hat'], [3, 'kick'], [3.5, 'hat']
                ],
                solo: [
                    [0, 'kick'], [0.5, 'hat'], [1, 'snare'], [1.5, 'hat'],
                    [2, 'kick'], [2.5, 'hat'], [3, 'snare'], [3.5, 'hat']
                ],
                outro: [
                    [0, 'kick'], [2, 'snare'], [3.5, 'hat']
                ]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 8 },
                { pattern: 'verse', startBeat: 32, bars: 8 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'solo', startBeat: 160, bars: 8 },
                { pattern: 'chorus', startBeat: 192, bars: 8 },
                { pattern: 'outro', startBeat: 224, bars: 4 }
            ]
        },
        bass: {
            patterns: {
                intro: [[0, 82.41], [2, 61.74]],
                verse: [[0, 82.41], [1, 73.42], [2, 65.41], [3, 98]],
                chorus: [[0, 82.41], [1, 98], [2, 65.41], [2.5, 73.42], [3, 61.74], [3.5, 82.41]],
                solo: [[0, 82.41], [1, 61.74], [2, 98], [3, 73.42]],
                outro: [[0, 82.41], [2, 65.41]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 8 },
                { pattern: 'verse', startBeat: 32, bars: 8 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'solo', startBeat: 160, bars: 8 },
                { pattern: 'chorus', startBeat: 192, bars: 8 },
                { pattern: 'outro', startBeat: 224, bars: 4 }
            ]
        },
        lead: {
            patterns: {
                intro: [[0, 329.63, 2], [2, 392, 2]],
                verse: [
                    [0, 329.63, 0.5], [0.5, 392, 0.5], [1, 440, 1],
                    [2, 493.88, 0.5], [2.5, 440, 0.5], [3, 392, 1]
                ],
                chorus: [
                    [0, 659.25, 1], [1, 587.33, 0.5], [1.5, 523.25, 0.5],
                    [2, 493.88, 1], [3, 440, 0.5], [3.5, 392, 0.5]
                ],
                solo: [
                    [0, 659.25, 0.25], [0.25, 587.33, 0.25], [0.5, 523.25, 0.25], [0.75, 493.88, 0.25],
                    [1, 440, 0.5], [1.5, 493.88, 0.5], [2, 587.33, 0.25], [2.25, 659.25, 0.25],
                    [2.5, 783.99, 0.5], [3, 659.25, 0.5], [3.5, 587.33, 0.5]
                ],
                outro: [[0, 329.63, 4]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 8 },
                { pattern: 'verse', startBeat: 32, bars: 8 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'solo', startBeat: 160, bars: 8 },
                { pattern: 'chorus', startBeat: 192, bars: 8 },
                { pattern: 'outro', startBeat: 224, bars: 4 }
            ]
        },
        pad: {
            patterns: {
                intro: [[0, 164.81, 4]],
                verse: [[0, 164.81, 2], [2, 146.83, 2]],
                chorus: [[0, 196, 2], [2, 164.81, 2]],
                solo: [[0, 164.81, 4]],
                outro: [[0, 164.81, 4]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 8 },
                { pattern: 'verse', startBeat: 32, bars: 8 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'solo', startBeat: 160, bars: 8 },
                { pattern: 'chorus', startBeat: 192, bars: 8 },
                { pattern: 'outro', startBeat: 224, bars: 4 }
            ]
        }
    },
    charts: (() => {
        const secs = [
            { name: 'intro', startBeat: 0, bars: 8 },
            { name: 'verse', startBeat: 32, bars: 8 },
            { name: 'chorus', startBeat: 64, bars: 8 },
            { name: 'verse2', startBeat: 96, bars: 8 },
            { name: 'chorus2', startBeat: 128, bars: 8 },
            { name: 'solo', startBeat: 160, bars: 8 },
            { name: 'chorus3', startBeat: 192, bars: 8 },
            { name: 'outro', startBeat: 224, bars: 4 }
        ];

        // EASY ~130: sparse intro, half-beat verse, on-beat chorus
        const easyPat = {
            intro: (() => { const n = []; for (let b = 0; b < 32; b += 4) n.push([b, (b >> 2) % 4, 'tap']); return n; })(),
            verse: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b >> 1) % 4, 'tap']); return n; })(),
            chorus: (() => { const n = []; for (let b = 0; b < 32; b += 1) n.push([b, b % 4, 'tap']); return n; })(),
            verse2: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b + 2) % 4, 'tap']); return n; })(),
            chorus2: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b + 1) % 4, 'tap']); return n; })(),
            solo: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b + 2) % 4, 'tap']); return n; })(),
            chorus3: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b + 3) % 4, 'tap']); return n; })(),
            outro: (() => { const n = []; for (let b = 0; b < 16; b += 4) n.push([b, b % 4, 'tap']); return n; })()
        };

        // NORMAL ~250
        const normalPat = {
            intro: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b >> 1) % 4, 'tap']); return n; })(),
            verse: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) { n.push([b, b % 4, 'tap']); if (b % 4 === 2) n.push([b + 0.5, (b + 1) % 4, 'tap']); }
                return n;
            })(),
            chorus: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 1) % 4, 'tap']);
                    if (b % 4 === 0) n.push([b, 3, 'tap']);
                    if (b % 2 === 0) n.push([b + 0.5, (b + 2) % 4, 'tap']);
                }
                return n;
            })(),
            verse2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) { n.push([b, (b + 2) % 4, 'tap']); if (b % 4 === 0) n.push([b + 0.5, (b + 3) % 4, 'tap']); }
                return n;
            })(),
            chorus2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, b % 4, 'tap']);
                    if (b % 2 === 1) n.push([b + 0.5, (b + 1) % 4, 'tap']);
                }
                return n;
            })(),
            solo: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                return n;
            })(),
            chorus3: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 3) % 4, 'tap']);
                    if (b % 2 === 0) n.push([b + 0.5, (b + 1) % 4, 'tap']);
                }
                return n;
            })(),
            outro: (() => { const n = []; for (let b = 0; b < 16; b += 1) n.push([b, b % 4, 'tap']); return n; })()
        };

        // HARD ~500
        const hardPat = {
            intro: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) { n.push([b, b % 4, 'tap']); if (b % 2 === 0) n.push([b + 0.5, (b + 2) % 4, 'tap']); }
                n.push([4, 1, 'hold', 8]);
                return n;
            })(),
            verse: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                for (let b = 0; b < 32; b += 4) n.push([b, 2, 'tap']);
                n.push([8, 1, 'hold', 12]); n.push([24, 3, 'hold', 28]);
                return n;
            })(),
            chorus: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, (Math.floor(b * 2) + 1) % 4, 'tap']);
                    if (b % 2 === 0) n.push([b, (Math.floor(b) + 3) % 4, 'tap']);
                }
                n.push([6, 0, 'hold', 8]); n.push([22, 2, 'hold', 24]);
                return n;
            })(),
            verse2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) n.push([b, Math.floor(b * 2 + 1) % 4, 'tap']);
                for (let b = 2; b < 32; b += 4) n.push([b, 0, 'tap']);
                n.push([4, 2, 'hold', 8]); n.push([20, 0, 'hold', 24]);
                return n;
            })(),
            chorus2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, (Math.floor(b * 2) + 2) % 4, 'tap']);
                    if (b % 2 === 1) n.push([b, Math.floor(b) % 4, 'tap']);
                }
                n.push([8, 1, 'hold', 10]); n.push([24, 3, 'hold', 26]);
                return n;
            })(),
            solo: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.25) n.push([b, Math.floor(b * 4) % 4, 'tap']);
                n.push([0, 2, 'hold', 4]); n.push([16, 0, 'hold', 20]);
                return n;
            })(),
            chorus3: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, Math.floor(b * 2) % 4, 'tap']);
                    if (b % 4 === 0) n.push([b, 2, 'tap']);
                }
                for (let b = 0; b < 32; b += 8) n.push([b + 7, 1, 'hold', b + 9]);
                return n;
            })(),
            outro: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                n.push([0, 1, 'hold', 8]);
                return n;
            })()
        };

        const secE = secs.map(s => ({ pattern: s.name, startBeat: s.startBeat, bars: s.bars }));
        return {
            easy: buildChart(secE, easyPat),
            normal: buildChart(secE, normalPat),
            hard: buildChart(secE, hardPat)
        };
    })()
};

// ---------------------------------------------------------------------------
// 4. OVERCLOCK  —  BPM 160, 85s, D minor
// Sections: intro(4) verse(8) chorus(8) break(4) verse(8) chorus(8) finale(4) outro(2)
// Beats:    0        16       48        80       96       128       160        176
// Total = 184 beats
// ---------------------------------------------------------------------------
const overclock = {
    id: 'overclock',
    name: 'Overclock',
    artist: 'BITCRUSH',
    bpm: 160,
    duration: 85,
    difficulty: { easy: 3, normal: 6, hard: 10 },
    instruments: {
        drums: {
            patterns: {
                intro: [
                    [0, 'kick'], [0.25, 'hat'], [0.5, 'hat'], [0.75, 'hat'],
                    [1, 'kick'], [1.25, 'hat'], [1.5, 'hat'], [1.75, 'hat'],
                    [2, 'kick'], [2.5, 'hat'], [3, 'kick'], [3.5, 'hat']
                ],
                verse: [
                    [0, 'kick'], [0.25, 'hat'], [0.5, 'hat'], [0.75, 'hat'],
                    [1, 'snare'], [1.25, 'hat'], [1.5, 'hat'], [1.75, 'hat'],
                    [2, 'kick'], [2.25, 'hat'], [2.5, 'kick'], [2.75, 'hat'],
                    [3, 'snare'], [3.25, 'hat'], [3.5, 'hat'], [3.75, 'hat']
                ],
                chorus: [
                    [0, 'kick'], [0.25, 'hat'], [0.5, 'kick'], [0.75, 'hat'],
                    [1, 'snare'], [1, 'clap'], [1.25, 'hat'], [1.5, 'hat'], [1.75, 'hat'],
                    [2, 'kick'], [2.25, 'hat'], [2.5, 'kick'], [2.75, 'hat'],
                    [3, 'snare'], [3, 'clap'], [3.25, 'hat'], [3.5, 'hat'], [3.75, 'hat']
                ],
                break_: [
                    [0, 'kick'], [1, 'kick'], [2, 'snare'], [2.5, 'snare'], [3, 'snare'], [3.5, 'snare'], [3.75, 'snare']
                ],
                finale: [
                    [0, 'kick'], [0.25, 'kick'], [0.5, 'snare'], [0.75, 'hat'],
                    [1, 'kick'], [1.25, 'hat'], [1.5, 'snare'], [1.5, 'clap'], [1.75, 'hat'],
                    [2, 'kick'], [2.25, 'kick'], [2.5, 'snare'], [2.75, 'hat'],
                    [3, 'kick'], [3.25, 'hat'], [3.5, 'snare'], [3.5, 'clap'], [3.75, 'hat']
                ],
                outro: [
                    [0, 'kick'], [1, 'snare'], [2, 'kick']
                ]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'chorus', startBeat: 48, bars: 8 },
                { pattern: 'break_', startBeat: 80, bars: 4 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'finale', startBeat: 160, bars: 4 },
                { pattern: 'outro', startBeat: 176, bars: 2 }
            ]
        },
        bass: {
            patterns: {
                intro: [[0, 73.42], [1, 73.42], [2, 110], [3, 116.54]],
                verse: [[0, 73.42], [0.5, 73.42], [1, 110], [2, 116.54], [2.5, 65.41], [3, 87.31], [3.5, 73.42]],
                chorus: [[0, 73.42], [0.5, 110], [1, 116.54], [1.5, 73.42], [2, 65.41], [2.5, 87.31], [3, 110], [3.5, 73.42]],
                break_: [[0, 73.42], [2, 73.42]],
                finale: [[0, 73.42], [0.5, 110], [1, 116.54], [1.5, 65.41], [2, 87.31], [2.5, 110], [3, 73.42], [3.5, 65.41]],
                outro: [[0, 73.42]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'chorus', startBeat: 48, bars: 8 },
                { pattern: 'break_', startBeat: 80, bars: 4 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'finale', startBeat: 160, bars: 4 },
                { pattern: 'outro', startBeat: 176, bars: 2 }
            ]
        },
        lead: {
            patterns: {
                intro: [[0, 293.66, 1], [1, 349.23, 0.5], [1.5, 392, 0.5], [2, 440, 1]],
                verse: [
                    [0, 587.33, 0.25], [0.25, 523.25, 0.25], [0.5, 466.16, 0.25], [0.75, 440, 0.25],
                    [1, 392, 0.5], [1.5, 349.23, 0.5], [2, 293.66, 0.5], [2.5, 349.23, 0.5],
                    [3, 392, 0.25], [3.25, 440, 0.25], [3.5, 466.16, 0.25], [3.75, 523.25, 0.25]
                ],
                chorus: [
                    [0, 587.33, 0.5], [0.5, 698.46, 0.5], [1, 783.99, 0.5], [1.5, 698.46, 0.5],
                    [2, 587.33, 0.5], [2.5, 523.25, 0.5], [3, 466.16, 0.5], [3.5, 523.25, 0.5]
                ],
                break_: [[0, 293.66, 2], [2, 349.23, 2]],
                finale: [
                    [0, 587.33, 0.25], [0.25, 698.46, 0.25], [0.5, 783.99, 0.25], [0.75, 880, 0.25],
                    [1, 783.99, 0.25], [1.25, 698.46, 0.25], [1.5, 587.33, 0.25], [1.75, 523.25, 0.25],
                    [2, 466.16, 0.25], [2.25, 523.25, 0.25], [2.5, 587.33, 0.25], [2.75, 698.46, 0.25],
                    [3, 783.99, 0.5], [3.5, 880, 0.5]
                ],
                outro: [[0, 293.66, 2]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'chorus', startBeat: 48, bars: 8 },
                { pattern: 'break_', startBeat: 80, bars: 4 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'finale', startBeat: 160, bars: 4 },
                { pattern: 'outro', startBeat: 176, bars: 2 }
            ]
        },
        pad: {
            patterns: {
                intro: [[0, 146.83, 4]],
                verse: [[0, 146.83, 2], [2, 174.61, 2]],
                chorus: [[0, 146.83, 2], [2, 130.81, 2]],
                break_: [[0, 146.83, 4]],
                finale: [[0, 174.61, 2], [2, 146.83, 2]],
                outro: [[0, 146.83, 4]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 4 },
                { pattern: 'verse', startBeat: 16, bars: 8 },
                { pattern: 'chorus', startBeat: 48, bars: 8 },
                { pattern: 'break_', startBeat: 80, bars: 4 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'chorus', startBeat: 128, bars: 8 },
                { pattern: 'finale', startBeat: 160, bars: 4 },
                { pattern: 'outro', startBeat: 176, bars: 2 }
            ]
        }
    },
    charts: (() => {
        const secs = [
            { name: 'intro', startBeat: 0, bars: 4 },
            { name: 'verse', startBeat: 16, bars: 8 },
            { name: 'chorus', startBeat: 48, bars: 8 },
            { name: 'break_', startBeat: 80, bars: 4 },
            { name: 'verse2', startBeat: 96, bars: 8 },
            { name: 'chorus2', startBeat: 128, bars: 8 },
            { name: 'finale', startBeat: 160, bars: 4 },
            { name: 'outro', startBeat: 176, bars: 2 }
        ];

        // EASY ~120
        const easyPat = {
            intro: (() => { const n = []; for (let b = 0; b < 16; b += 2) n.push([b, b % 4, 'tap']); return n; })(),
            verse: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b >> 1) % 4, 'tap']); return n; })(),
            chorus: (() => { const n = []; for (let b = 0; b < 32; b += 1) n.push([b, (b + 1) % 4, 'tap']); return n; })(),
            break_: (() => { const n = []; for (let b = 0; b < 16; b += 4) n.push([b, (b >> 2) % 4, 'tap']); return n; })(),
            verse2: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b + 2) % 4, 'tap']); return n; })(),
            chorus2: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b + 3) % 4, 'tap']); return n; })(),
            finale: (() => { const n = []; for (let b = 0; b < 16; b += 1) n.push([b, b % 4, 'tap']); return n; })(),
            outro: (() => { const n = []; for (let b = 0; b < 8; b += 4) n.push([b, 0, 'tap']); return n; })()
        };

        // NORMAL ~250
        const normalPat = {
            intro: (() => { const n = []; for (let b = 0; b < 16; b += 1) n.push([b, b % 4, 'tap']); return n; })(),
            verse: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) n.push([b, b % 4, 'tap']);
                for (let b = 1; b < 32; b += 2) n.push([b + 0.5, (b + 2) % 4, 'tap']);
                return n;
            })(),
            chorus: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 1) % 4, 'tap']);
                    if (b % 4 === 0) n.push([b, 3, 'tap']);
                    if (b % 2 === 0) n.push([b + 0.5, (b + 3) % 4, 'tap']);
                }
                return n;
            })(),
            break_: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 1) n.push([b, b % 4, 'tap']);
                for (let b = 8; b < 16; b += 1) n.push([b + 0.5, (b + 2) % 4, 'tap']);
                return n;
            })(),
            verse2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) n.push([b, (b + 1) % 4, 'tap']);
                for (let b = 3; b < 32; b += 2) n.push([b + 0.5, (b + 3) % 4, 'tap']);
                return n;
            })(),
            chorus2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 2) % 4, 'tap']);
                    if (b % 4 === 2) n.push([b, 0, 'tap']);
                    if (b % 2 === 1) n.push([b + 0.5, (b + 1) % 4, 'tap']);
                }
                return n;
            })(),
            finale: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                return n;
            })(),
            outro: (() => { const n = []; for (let b = 0; b < 8; b += 1) n.push([b, b % 4, 'tap']); return n; })()
        };

        // HARD ~550
        const hardPat = {
            intro: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                for (let b = 0; b < 16; b += 4) n.push([b, 2, 'tap']);
                return n;
            })(),
            verse: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                for (let b = 0; b < 32; b += 2) n.push([b + 0.25, (b + 1) % 4, 'tap']);
                n.push([4, 1, 'hold', 6]); n.push([20, 3, 'hold', 22]);
                return n;
            })(),
            chorus: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, (Math.floor(b * 2) + 1) % 4, 'tap']);
                    if (b % 2 === 0) n.push([b, (Math.floor(b) + 3) % 4, 'tap']);
                }
                for (let b = 0; b < 32; b += 4) n.push([b + 0.25, b % 4, 'tap']);
                n.push([6, 0, 'hold', 8]); n.push([22, 2, 'hold', 24]);
                return n;
            })(),
            break_: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.25) n.push([b, Math.floor(b * 4) % 4, 'tap']);
                n.push([0, 2, 'hold', 4]); n.push([8, 0, 'hold', 12]);
                return n;
            })(),
            verse2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) n.push([b, Math.floor(b * 2 + 1) % 4, 'tap']);
                for (let b = 1; b < 32; b += 2) n.push([b + 0.25, (b + 2) % 4, 'tap']);
                n.push([8, 3, 'hold', 10]); n.push([24, 1, 'hold', 26]);
                return n;
            })(),
            chorus2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, (Math.floor(b * 2) + 2) % 4, 'tap']);
                    if (b % 2 === 1) n.push([b, Math.floor(b) % 4, 'tap']);
                }
                for (let b = 0; b < 32; b += 8) n.push([b + 3, 1, 'hold', b + 5]);
                return n;
            })(),
            finale: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.25) n.push([b, Math.floor(b * 4) % 4, 'tap']);
                n.push([0, 1, 'hold', 4]); n.push([8, 3, 'hold', 12]);
                return n;
            })(),
            outro: (() => {
                const n = [];
                for (let b = 0; b < 8; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                n.push([0, 2, 'hold', 4]);
                return n;
            })()
        };

        const secE = secs.map(s => ({ pattern: s.name, startBeat: s.startBeat, bars: s.bars }));
        return {
            easy: buildChart(secE, easyPat),
            normal: buildChart(secE, normalPat),
            hard: buildChart(secE, hardPat)
        };
    })()
};

// ---------------------------------------------------------------------------
// 5. GHOST PROTOCOL  —  BPM 120, 105s, F# minor
// Sections: intro(8) verse(8) chorus(8) verse(8) bridge(8) chorus(8) verse(4) chorus(8) outro(4)
// Beats:    0        32       64        96       128       160       192       208       240
// Total = 256 beats
// ---------------------------------------------------------------------------
const ghostProtocol = {
    id: 'ghost_protocol',
    name: 'Ghost Protocol',
    artist: 'PHANTOM.SYS',
    bpm: 120,
    duration: 105,
    difficulty: { easy: 2, normal: 5, hard: 8 },
    instruments: {
        drums: {
            patterns: {
                intro: [
                    [0, 'kick'], [2, 'hat'], [2.5, 'hat'], [3.5, 'hat']
                ],
                verse: [
                    [0, 'kick'], [1.5, 'hat'], [2, 'snare'], [3, 'hat'], [3.5, 'hat']
                ],
                chorus: [
                    [0, 'kick'], [0.5, 'hat'], [1, 'snare'], [1, 'clap'], [1.5, 'hat'],
                    [2, 'kick'], [2.5, 'hat'], [3, 'snare'], [3.5, 'hat']
                ],
                bridge: [
                    [0, 'kick'], [1, 'hat'], [2, 'kick'], [2.5, 'snare'], [3, 'hat'], [3.5, 'hat'], [3.75, 'hat']
                ],
                verse_short: [
                    [0, 'kick'], [1, 'hat'], [2, 'snare'], [3, 'hat']
                ],
                outro: [
                    [0, 'kick'], [2, 'hat'], [3, 'hat']
                ]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 8 },
                { pattern: 'verse', startBeat: 32, bars: 8 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'bridge', startBeat: 128, bars: 8 },
                { pattern: 'chorus', startBeat: 160, bars: 8 },
                { pattern: 'verse_short', startBeat: 192, bars: 4 },
                { pattern: 'chorus', startBeat: 208, bars: 8 },
                { pattern: 'outro', startBeat: 240, bars: 4 }
            ]
        },
        bass: {
            patterns: {
                intro: [[0, 92.5], [2, 69.3]],
                verse: [[0, 92.5], [1, 73.42], [2, 82.41], [3, 110], [3.5, 92.5]],
                chorus: [[0, 92.5], [0.5, 69.3], [1, 73.42], [2, 82.41], [2.5, 110], [3, 92.5], [3.5, 69.3]],
                bridge: [[0, 73.42], [1, 82.41], [2, 110], [3, 92.5]],
                verse_short: [[0, 92.5], [1, 82.41], [2, 73.42], [3, 69.3]],
                outro: [[0, 92.5], [2, 69.3]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 8 },
                { pattern: 'verse', startBeat: 32, bars: 8 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'bridge', startBeat: 128, bars: 8 },
                { pattern: 'chorus', startBeat: 160, bars: 8 },
                { pattern: 'verse_short', startBeat: 192, bars: 4 },
                { pattern: 'chorus', startBeat: 208, bars: 8 },
                { pattern: 'outro', startBeat: 240, bars: 4 }
            ]
        },
        lead: {
            patterns: {
                intro: [[0, 369.99, 2], [2, 329.63, 2]],
                verse: [
                    [0, 369.99, 0.5], [0.5, 329.63, 0.5], [1, 293.66, 1],
                    [2, 349.23, 0.5], [2.5, 329.63, 0.5], [3, 369.99, 1]
                ],
                chorus: [
                    [0, 739.99, 0.5], [0.5, 659.25, 0.5], [1, 554.37, 0.5], [1.5, 493.88, 0.5],
                    [2, 554.37, 0.5], [2.5, 659.25, 0.5], [3, 739.99, 1]
                ],
                bridge: [
                    [0, 293.66, 1], [1, 329.63, 1], [2, 369.99, 1], [3, 440, 1]
                ],
                verse_short: [
                    [0, 369.99, 1], [1, 329.63, 1], [2, 293.66, 2]
                ],
                outro: [[0, 369.99, 4]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 8 },
                { pattern: 'verse', startBeat: 32, bars: 8 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'bridge', startBeat: 128, bars: 8 },
                { pattern: 'chorus', startBeat: 160, bars: 8 },
                { pattern: 'verse_short', startBeat: 192, bars: 4 },
                { pattern: 'chorus', startBeat: 208, bars: 8 },
                { pattern: 'outro', startBeat: 240, bars: 4 }
            ]
        },
        pad: {
            patterns: {
                intro: [[0, 185, 4]],
                verse: [[0, 185, 4]],
                chorus: [[0, 185, 2], [2, 164.81, 2]],
                bridge: [[0, 146.83, 2], [2, 164.81, 2]],
                verse_short: [[0, 185, 4]],
                outro: [[0, 185, 4]]
            },
            sections: [
                { pattern: 'intro', startBeat: 0, bars: 8 },
                { pattern: 'verse', startBeat: 32, bars: 8 },
                { pattern: 'chorus', startBeat: 64, bars: 8 },
                { pattern: 'verse', startBeat: 96, bars: 8 },
                { pattern: 'bridge', startBeat: 128, bars: 8 },
                { pattern: 'chorus', startBeat: 160, bars: 8 },
                { pattern: 'verse_short', startBeat: 192, bars: 4 },
                { pattern: 'chorus', startBeat: 208, bars: 8 },
                { pattern: 'outro', startBeat: 240, bars: 4 }
            ]
        }
    },
    charts: (() => {
        const secs = [
            { name: 'intro', startBeat: 0, bars: 8 },
            { name: 'verse', startBeat: 32, bars: 8 },
            { name: 'chorus', startBeat: 64, bars: 8 },
            { name: 'verse2', startBeat: 96, bars: 8 },
            { name: 'bridge', startBeat: 128, bars: 8 },
            { name: 'chorus2', startBeat: 160, bars: 8 },
            { name: 'verse3', startBeat: 192, bars: 4 },
            { name: 'chorus3', startBeat: 208, bars: 8 },
            { name: 'outro', startBeat: 240, bars: 4 }
        ];

        // EASY ~140
        const easyPat = {
            intro: (() => { const n = []; for (let b = 0; b < 32; b += 4) n.push([b, (b >> 2) % 4, 'tap']); return n; })(),
            verse: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b >> 1) % 4, 'tap']); return n; })(),
            chorus: (() => { const n = []; for (let b = 0; b < 32; b += 1) n.push([b, b % 4, 'tap']); return n; })(),
            verse2: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b + 2) % 4, 'tap']); return n; })(),
            bridge: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b >> 1) % 4, 'tap']); return n; })(),
            chorus2: (() => { const n = []; for (let b = 0; b < 32; b += 1) n.push([b, (b + 1) % 4, 'tap']); return n; })(),
            verse3: (() => { const n = []; for (let b = 0; b < 16; b += 2) n.push([b, b % 4, 'tap']); return n; })(),
            chorus3: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b + 2) % 4, 'tap']); return n; })(),
            outro: (() => { const n = []; for (let b = 0; b < 16; b += 4) n.push([b, b % 4, 'tap']); return n; })()
        };

        // NORMAL ~280
        const normalPat = {
            intro: (() => { const n = []; for (let b = 0; b < 32; b += 2) n.push([b, (b >> 1) % 4, 'tap']); return n; })(),
            verse: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) { n.push([b, b % 4, 'tap']); if (b % 4 === 2) n.push([b + 0.5, (b + 1) % 4, 'tap']); }
                return n;
            })(),
            chorus: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 1) % 4, 'tap']);
                    if (b % 4 === 0) n.push([b, 3, 'tap']);
                    if (b % 2 === 0) n.push([b + 0.5, (b + 2) % 4, 'tap']);
                }
                return n;
            })(),
            verse2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) { n.push([b, (b + 2) % 4, 'tap']); if (b % 4 === 0) n.push([b + 0.5, (b + 3) % 4, 'tap']); }
                return n;
            })(),
            bridge: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) { n.push([b, b % 4, 'tap']); if (b % 2 === 1) n.push([b + 0.5, (b + 2) % 4, 'tap']); }
                return n;
            })(),
            chorus2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 3) % 4, 'tap']);
                    if (b % 4 === 2) n.push([b, 1, 'tap']);
                    if (b % 2 === 1) n.push([b + 0.5, (b + 1) % 4, 'tap']);
                }
                return n;
            })(),
            verse3: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 1) { n.push([b, (b + 1) % 4, 'tap']); if (b % 2 === 0) n.push([b + 0.5, (b + 3) % 4, 'tap']); }
                return n;
            })(),
            chorus3: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) {
                    n.push([b, (b + 2) % 4, 'tap']);
                    if (b % 2 === 0) n.push([b + 0.5, (b + 3) % 4, 'tap']);
                }
                return n;
            })(),
            outro: (() => { const n = []; for (let b = 0; b < 16; b += 2) n.push([b, b % 4, 'tap']); return n; })()
        };

        // HARD ~550
        const hardPat = {
            intro: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 1) { n.push([b, b % 4, 'tap']); if (b % 2 === 0) n.push([b + 0.5, (b + 2) % 4, 'tap']); }
                n.push([4, 1, 'hold', 8]); n.push([20, 3, 'hold', 24]);
                return n;
            })(),
            verse: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                for (let b = 0; b < 32; b += 4) n.push([b, 2, 'tap']);
                n.push([8, 1, 'hold', 12]); n.push([24, 3, 'hold', 28]);
                return n;
            })(),
            chorus: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, (Math.floor(b * 2) + 1) % 4, 'tap']);
                    if (b % 2 === 0) n.push([b, (Math.floor(b) + 3) % 4, 'tap']);
                }
                n.push([7, 0, 'hold', 9]); n.push([23, 2, 'hold', 25]);
                return n;
            })(),
            verse2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) n.push([b, Math.floor(b * 2 + 1) % 4, 'tap']);
                for (let b = 2; b < 32; b += 4) n.push([b, 0, 'tap']);
                n.push([4, 2, 'hold', 8]); n.push([20, 0, 'hold', 24]);
                return n;
            })(),
            bridge: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, Math.floor(b * 2) % 4, 'tap']);
                    if (b % 4 === 0) n.push([b, 2, 'tap']);
                }
                n.push([0, 1, 'hold', 4]); n.push([16, 3, 'hold', 20]);
                return n;
            })(),
            chorus2: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, (Math.floor(b * 2) + 2) % 4, 'tap']);
                    if (b % 2 === 1) n.push([b, Math.floor(b) % 4, 'tap']);
                }
                for (let b = 0; b < 32; b += 8) n.push([b + 5, 2, 'hold', b + 7]);
                return n;
            })(),
            verse3: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                for (let b = 0; b < 16; b += 4) n.push([b, 2, 'tap']);
                n.push([0, 1, 'hold', 4]); n.push([8, 3, 'hold', 12]);
                return n;
            })(),
            chorus3: (() => {
                const n = [];
                for (let b = 0; b < 32; b += 0.5) {
                    n.push([b, Math.floor(b * 2) % 4, 'tap']);
                    if (b % 4 === 0) n.push([b, 2, 'tap']);
                }
                for (let b = 0; b < 32; b += 8) n.push([b + 3, 1, 'hold', b + 5]);
                return n;
            })(),
            outro: (() => {
                const n = [];
                for (let b = 0; b < 16; b += 0.5) n.push([b, Math.floor(b * 2) % 4, 'tap']);
                n.push([0, 1, 'hold', 8]); n.push([8, 3, 'hold', 14]);
                return n;
            })()
        };

        const secE = secs.map(s => ({ pattern: s.name, startBeat: s.startBeat, bars: s.bars }));
        return {
            easy: buildChart(secE, easyPat),
            normal: buildChart(secE, normalPat),
            hard: buildChart(secE, hardPat)
        };
    })()
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export const SONGS = [
    neonHighway,
    digitalRain,
    chromeSunset,
    overclock,
    ghostProtocol
];

export function getSongById(id) {
    return SONGS.find(s => s.id === id);
}
