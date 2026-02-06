/**
 * Levels.js
 * Definitions for game levels.
 */
export const LEVELS = [
    {
        id: 0,
        title: "TUTORIAL: SIGNAL FLOW",
        description: "Connect the Pulse Generator (Source) to the Data Uplink (Destination).",
        inputs: 1, // Number of input nodes
        outputs: 1, // Number of output nodes
        // Layout of fixed nodes
        layout: [
            { type: 'EMITTER', x: 2, y: 5, label: 'IN_A', id: 'in_0' },
            { type: 'RECEIVER', x: 12, y: 5, label: 'OUT_X', id: 'out_0' }
        ],
        // Truth table to verify
        // For simple signal flow: IN needs to match OUT
        testCases: [
            { inputs: [0], expected: [0] },
            { inputs: [1], expected: [1] } // Signal must reach end
        ]
    },
    {
        id: 1,
        title: "INVERSION PROTOCOL",
        description: "The system requires an inverted signal. Output TRUE when input is FALSE.",
        inputs: 1,
        outputs: 1,
        layout: [
            { type: 'EMITTER', x: 2, y: 5, label: 'IN_A', id: 'in_0' },
            { type: 'RECEIVER', x: 12, y: 5, label: 'OUT_X', id: 'out_0' }
        ],
        testCases: [
            { inputs: [0], expected: [1] },
            { inputs: [1], expected: [0] }
        ]
    },
    {
        id: 2,
        title: "DUAL AUTHENTICATION",
        description: "Implement AND logic. The Output should activate ONLY if both inputs are active.",
        inputs: 2,
        outputs: 1,
        layout: [
            { type: 'EMITTER', x: 2, y: 3, label: 'IN_A', id: 'in_0' },
            { type: 'EMITTER', x: 2, y: 7, label: 'IN_B', id: 'in_1' },
            { type: 'RECEIVER', x: 12, y: 5, label: 'OUT_X', id: 'out_0' }
        ],
        testCases: [
            { inputs: [0, 0], expected: [0] },
            { inputs: [0, 1], expected: [0] },
            { inputs: [1, 0], expected: [0] },
            { inputs: [1, 1], expected: [1] }
        ]
    },
    {
        id: 3,
        title: "SAFETY OVERRIDE (OR)",
        description: "The system should activate if EITHER input is active.",
        inputs: 2,
        outputs: 1,
        layout: [
            { type: 'EMITTER', x: 2, y: 3, label: 'IN_A', id: 'in_0' },
            { type: 'EMITTER', x: 2, y: 7, label: 'IN_B', id: 'in_1' },
            { type: 'RECEIVER', x: 12, y: 5, label: 'OUT_X', id: 'out_0' }
        ],
        testCases: [
            { inputs: [0, 0], expected: [0] },
            { inputs: [0, 1], expected: [1] },
            { inputs: [1, 0], expected: [1] },
            { inputs: [1, 1], expected: [1] }
        ]
    },
    {
        id: 4,
        title: "EXCLUSIVE PROTOCOL (XOR)",
        description: "Output TRUE only if inputs are different. You do not have an XOR gate. Build one.",
        inputs: 2,
        outputs: 1,
        layout: [
            { type: 'EMITTER', x: 2, y: 3, label: 'IN_A', id: 'in_0' },
            { type: 'EMITTER', x: 2, y: 7, label: 'IN_B', id: 'in_1' },
            { type: 'RECEIVER', x: 12, y: 5, label: 'OUT_X', id: 'out_0' }
        ],
        testCases: [
            { inputs: [0, 0], expected: [0] },
            { inputs: [0, 1], expected: [1] },
            { inputs: [1, 0], expected: [1] },
            { inputs: [1, 1], expected: [0] }
        ]
    },
    {
        id: 5,
        title: "UNIVERSAL GATE (NAND)",
        description: "Construct a NAND gate. Output FALSE only when both inputs are TRUE.",
        inputs: 2,
        outputs: 1,
        layout: [
            { type: 'EMITTER', x: 2, y: 3, label: 'IN_A', id: 'in_0' },
            { type: 'EMITTER', x: 2, y: 7, label: 'IN_B', id: 'in_1' },
            { type: 'RECEIVER', x: 12, y: 5, label: 'OUT_X', id: 'out_0' }
        ],
        testCases: [
            { inputs: [0, 0], expected: [1] },
            { inputs: [0, 1], expected: [1] },
            { inputs: [1, 0], expected: [1] },
            { inputs: [1, 1], expected: [0] }
        ]
    }
];
