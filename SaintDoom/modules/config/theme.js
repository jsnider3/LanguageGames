// Centralized theme and color constants for SaintDoom
// All colors are in hex format for Three.js materials

export const THEME = {
    // Base material colors
    materials: {
        floor: {
            default: 0x2a2a2a,      // Dark gray floor
            chapel: 0x2a2a2a,       // Chapel floor
            armory: 0x3a3a3a,       // Slightly lighter for armory
            laboratory: 0x4a4a4a,   // Clean lab floor
            containment: 0x353535,  // Industrial containment
            vatican: 0xf0f0e8,      // Vatican marble floor
            metal: 0x404040,        // Metal floor
        },
        wall: {
            default: 0x4a4a3a,      // Brownish gray walls
            chapel: 0x4a4a3a,       // Stone-like chapel walls
            desecrated: 0x5a3030,   // Reddish tint for corrupted areas
            armory: 0x666666,       // Metal walls
            laboratory: 0xcccccc,   // Clean white lab walls
            containment: 0x555555,  // Industrial gray
            stone: 0x8a8a7a,        // Stone walls
        },
        metal: {
            default: 0x888888,      // Standard metal
            dark: 0x606060,         // Dark metal
            veryDark: 0x303030,     // Very dark metal
            light: 0xaaaaaa,        // Light metal
            rusty: 0x8b4513,        // Rusty metal
            bright: 0x808080,       // Bright metal
        },
        glass: {
            default: 0x88ccff,      // Light blue glass
            reinforced: 0x446688,   // Darker reinforced glass
            broken: 0x334455,       // Damaged glass
        },
        // Special materials
        gold: 0xffd700,             // Gold material
        robe: 0x8b0000,             // Cardinal robe red
        robeEmissive: 0x400000,     // Robe emissive color
        skin: 0xf4e4d4,             // Human skin tone
        black: 0x000000,            // Pure black
    },
    
    // Enemy-specific colors
    enemies: {
        demonic: {
            skin: 0xff4444,         // Red demon skin
            eyes: 0xff0000,         // Bright red eyes
            glow: 0xff6600,         // Orange glow
        },
        undead: {
            skin: 0x666655,         // Grayish undead skin
            eyes: 0xffff00,         // Yellow undead eyes
            blood: 0x440000,        // Dark blood
        },
        possessed: {
            skin: 0x885588,         // Purple-tinted possession
            eyes: 0xff00ff,         // Magenta eyes
            aura: 0x9900ff,         // Purple aura
        },
        alien: {
            skin: 0x00ff88,         // Greenish alien
            eyes: 0x00ffff,         // Cyan eyes
            tech: 0x0088ff,         // Blue tech elements
        }
    },
    
    // UI and HUD colors
    ui: {
        health: {
            full: 0x00ff00,         // Green at full health
            medium: 0xffff00,       // Yellow at medium
            low: 0xff0000,          // Red at low health
        },
        armor: {
            default: 0x4444ff,      // Blue armor
            damaged: 0x8844ff,      // Purple when damaged
        },
        ammo: {
            normal: 0xffaa00,       // Orange ammo counter
            low: 0xff0000,          // Red when low
            infinite: 0x00ffff,     // Cyan for infinite ammo
        },
        text: {
            success: 0x00ff00,      // Green success text
            warning: 0xffaa00,      // Orange warning text
            error: 0xff0000,        // Red error text
        }
    },
    
    // Lighting colors
    lights: {
        ambient: {
            default: 0x404040,      // Dim ambient light
            chapel: 0x402020,       // Reddish chapel ambient
            laboratory: 0x606060,   // Brighter lab ambient
            warm: 0xffffee,         // Warm ambient light
        },
        point: {
            warm: 0xffeeaa,         // Warm orange light
            cold: 0x6688ff,         // Cold blue light
            emergency: 0xff0000,    // Red emergency lighting
            holy: 0xffffaa,         // Holy golden light
            demonic: 0xff4400,      // Demonic orange-red
            warning: 0xff0000,      // Red warning light
        },
        spot: {
            white: 0xffffff,        // White spotlight
            yellow: 0xffff00,       // Yellow spotlight
        },
        directional: {
            sun: 0xffffff,          // White sunlight
            moon: 0xaaaaff,         // Blue moonlight
        }
    },
    
    // Effect colors
    effects: {
        blood: {
            human: 0xff0000,        // Red blood
            demon: 0x880000,        // Dark demon blood
            alien: 0x00ff00,        // Green alien blood
        },
        explosion: {
            fire: 0xff6600,         // Orange fire
            plasma: 0x00aaff,       // Blue plasma
            holy: 0xffff00,         // Yellow holy
        },
        particles: {
            smoke: 0x444444,        // Gray smoke
            spark: 0xffff00,        // Yellow sparks
            magic: 0xff00ff,        // Magenta magic
        },
        smoke: 0xaaaaaa,           // Smoke effect color
    },
    
    // Pickup/item colors
    items: {
        health: {
            small: 0xff6666,        // Light red health pack
            large: 0xff0000,        // Bright red medkit
        },
        armor: {
            light: 0x6666ff,        // Light blue armor
            heavy: 0x0000ff,        // Dark blue heavy armor
        },
        weapons: {
            common: 0x888888,       // Gray common weapons
            rare: 0x0088ff,         // Blue rare weapons
            legendary: 0xffaa00,    // Gold legendary weapons
        },
        keycards: {
            red: 0xff0000,          // Red keycard
            blue: 0x0000ff,         // Blue keycard
            yellow: 0xffff00,       // Yellow keycard
            green: 0x00ff00,        // Green keycard
        }
    },
    
    // Special/boss colors
    bosses: {
        belial: {
            primary: 0x660000,      // Dark red
            secondary: 0xff0000,    // Bright red
            energy: 0xff6600,       // Orange energy
        },
        ironTyrant: {
            primary: 0x444444,      // Dark metal
            secondary: 0x888888,    // Light metal
            energy: 0x0088ff,       // Blue energy
        },
        subjectZero: {
            primary: 0x004400,      // Dark green
            secondary: 0x00ff00,    // Bright green
            energy: 0x00ffff,       // Cyan energy
        }
    }
};

// Helper function to get color with opacity for transparent materials
export function getColorWithOpacity(hexColor, opacity = 1.0) {
    return {
        color: hexColor,
        transparent: opacity < 1.0,
        opacity: opacity
    };
}

// Helper function to create emissive material properties
export function getEmissiveMaterial(baseColor, emissiveColor, intensity = 0.5) {
    return {
        color: baseColor,
        emissive: emissiveColor,
        emissiveIntensity: intensity
    };
}