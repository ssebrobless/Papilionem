// Sprite Manager - loads, slices, and caches butterfly sprite assets
// Handles wing composite splitting (4 pieces per type) and background transparency
// Wing images: 1920x1080, Body: 1080x1080, Antenna: 1080x1080

const WING_FILE_MAP = {
    friendly: 'warm-welcome-wing-full.png',
    cautious: 'delicate-pink-wing-full.png',
    energetic: 'electric-violet-wing-full.png',
    skittish: 'nervous-jewel-wing-full.png',
    wise: 'ancient-scholar-wing-full.png',
    mystic: 'twilight-dancer-wing-full.png',
    golden: 'legendary-one-wing-full.png'
};

const SPRITE_BASE_PATH = 'assets/butterflies/';

// Wing split point — chosen so all 4 anchor points fall in their correct quadrant
const WING_SPLIT_X = 900;
const WING_SPLIT_Y = 600;

class SpriteManager {
    constructor() {
        this.loaded = false;
        this.body = null;           // p5.Image - butterfly body (1080x1080)
        this.antenna = null;        // p5.Image - antennae (1080x1080)
        this.rawWings = {};         // { personalityType: p5.Image } - raw composites before slicing
        this.wings = {};            // { personalityType: { foreLeft, foreRight, hindLeft, hindRight } }
        this.SPRITE_SCALE = 1.0;    // Global scale multiplier for tuning

        // Anchor point system — pixel coordinates from source PNGs
        // Each anchor defines where a sprite piece connects to the body
        this.anchors = {
            body: { centerX: 540, centerY: 540 }, // body image center (1080/2)

            // Wing anchors: onWing = pixel in full wing composite, onBody = pixel in body image
            wings: {
                foreLeft:  { onWing: { x: 841, y: 500 }, onBody: { x: 375, y: 549 } },
                foreRight: { onWing: { x: 968, y: 500 }, onBody: { x: 700, y: 549 } },
                hindLeft:  { onWing: { x: 852, y: 582 }, onBody: { x: 375, y: 682 } },
                hindRight: { onWing: { x: 951, y: 582 }, onBody: { x: 700, y: 682 } },
            },

            // Relative anchors — adjusted for quadrant extraction offset
            wingsRelative: {
                foreLeft:  { x: 841,                y: 500 },                   // quadrant starts at (0,0)
                foreRight: { x: 968 - WING_SPLIT_X, y: 500 },                  // = (68, 500)
                hindLeft:  { x: 852,                y: 582 - WING_SPLIT_Y },    // = (852, -18)
                hindRight: { x: 951 - WING_SPLIT_X, y: 582 - WING_SPLIT_Y },   // = (51, -18)
            },

            // Antenna anchors: onAntenna = pixel in antenna image, onBody = pixel in body image
            antenna: {
                left:  { onAntenna: { x: 494, y: 425 }, onBody: { x: 488, y: 290 } },
                right: { onAntenna: { x: 555, y: 425 }, onBody: { x: 559, y: 290 } },
            }
        };
    }

    // Called from p5 preload() - loads all raw images
    preloadAssets() {
        this.body = loadImage(SPRITE_BASE_PATH + 'ephemera-butterfly-body-.png');
        this.antenna = loadImage(SPRITE_BASE_PATH + 'ephemera-butterfly-antenna.png');

        for (const [personality, filename] of Object.entries(WING_FILE_MAP)) {
            this.rawWings[personality] = loadImage(SPRITE_BASE_PATH + filename);
        }
    }

    // Called from setup() after preload completes - slices wings and processes transparency
    initialize() {
        for (const [personality, rawImg] of Object.entries(this.rawWings)) {
            const w = rawImg.width;
            const h = rawImg.height;

            // Extract 4 quadrants using the split point
            const foreLeft  = rawImg.get(0, 0, WING_SPLIT_X, WING_SPLIT_Y);
            const foreRight = rawImg.get(WING_SPLIT_X, 0, w - WING_SPLIT_X, WING_SPLIT_Y);
            const hindLeft  = rawImg.get(0, WING_SPLIT_Y, WING_SPLIT_X, h - WING_SPLIT_Y);
            const hindRight = rawImg.get(WING_SPLIT_X, WING_SPLIT_Y, w - WING_SPLIT_X, h - WING_SPLIT_Y);

            // Remove black background from each piece
            this._removeBlackBackground(foreLeft);
            this._removeBlackBackground(foreRight);
            this._removeBlackBackground(hindLeft);
            this._removeBlackBackground(hindRight);

            this.wings[personality] = { foreLeft, foreRight, hindLeft, hindRight };
        }

        // Free raw wing composites
        this.rawWings = {};
        this.loaded = true;

        console.log('SpriteManager: Initialized -', Object.keys(this.wings).length, 'wing sets loaded');
    }

    // Convert near-black pixels to transparent
    // Conservative threshold preserves dark wing details (e.g. electric-violet's dark blues)
    _removeBlackBackground(img) {
        img.loadPixels();
        const d = img.pixels;
        for (let i = 0; i < d.length; i += 4) {
            if (d[i] + d[i + 1] + d[i + 2] < 30) {
                d[i + 3] = 0;
            }
        }
        img.updatePixels();
    }

    hasWings(personalityType) {
        return this.loaded && this.wings[personalityType] != null;
    }

    hasBody() {
        return this.loaded && this.body != null;
    }

    hasAntenna() {
        return this.loaded && this.antenna != null;
    }
}

const spriteManager = new SpriteManager();
