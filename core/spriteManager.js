// Sprite Manager - loads, slices, and caches butterfly sprite assets
// Handles wing composite splitting (4 pieces per type) and background transparency
// Wing images: 1920x1080, Body: 1080x1080, Antenna: 1080x1080

const WING_FILE_MAP = {
    friendly: {
        M: 'male/warm-welcome-wing-full-M.png',
        F: 'female/warm-welcome-wing-full-F.png'
    },
    cautious: {
        M: 'male/delicate-pink-wing-full-M.png',
        F: 'female/delicate-pink-wing-full-F.png'
    },
    energetic: {
        M: 'male/electric-violet-wing-full-M.png',
        F: 'female/electric-violet-wing-full-F.png'
    },
    skittish: {
        M: 'male/nervous-jewel-wing-full-M.png',
        F: 'female/nervous-jewel-wing-full-F.png'
    },
    wise: {
        M: 'male/ancient-scholar-wing-full-M.png',
        F: 'female/ancient-scholar-wing-full-F.png'
    },
    mystic: {
        M: 'male/twilight-dancer-wing-full-M.png',
        F: 'female/twilight-dancer-wing-full-F.png'
    },
    golden: {
        M: 'male/legendary-one-wing-full-M.png',
        F: 'female/legendary-one-wing-full-F.png'
    }
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
        this.rawWings = { M: {}, F: {} };
        this.wings = { M: {}, F: {} };
        this.cocoonSprites = {
            unhatched: null,
            hatched: null
        };
        this.caterpillarFrames = [];
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

        for (const [personality, variants] of Object.entries(WING_FILE_MAP)) {
            this.rawWings.M[personality] = loadImage(SPRITE_BASE_PATH + variants.M);
            this.rawWings.F[personality] = loadImage(SPRITE_BASE_PATH + variants.F);
        }

        this.cocoonSprites.unhatched = loadImage('assets/cocoons/cocoon-unhatched.png');
        this.cocoonSprites.hatched = loadImage('assets/cocoons/cocoon-hatched.png');
        this.caterpillarFrames = [
            loadImage('assets/caterpillars/caterpillar-crawl1.png'),
            loadImage('assets/caterpillars/caterpillar-crawl2.png'),
            loadImage('assets/caterpillars/caterpillar-crawl3.png')
        ];
    }

    // Called from setup() after preload completes - slices wings and processes transparency
    initialize() {
        for (const sex of ['M', 'F']) {
            for (const [personality, rawImg] of Object.entries(this.rawWings[sex])) {
                const w = rawImg.width;
                const h = rawImg.height;

                const foreLeft  = rawImg.get(0, 0, WING_SPLIT_X, WING_SPLIT_Y);
                const foreRight = rawImg.get(WING_SPLIT_X, 0, w - WING_SPLIT_X, WING_SPLIT_Y);
                const hindLeft  = rawImg.get(0, WING_SPLIT_Y, WING_SPLIT_X, h - WING_SPLIT_Y);
                const hindRight = rawImg.get(WING_SPLIT_X, WING_SPLIT_Y, w - WING_SPLIT_X, h - WING_SPLIT_Y);

                this._removeBlackBackground(foreLeft);
                this._removeBlackBackground(foreRight);
                this._removeBlackBackground(hindLeft);
                this._removeBlackBackground(hindRight);

                this.wings[sex][personality] = { foreLeft, foreRight, hindLeft, hindRight };
            }
        }

        this.rawWings = { M: {}, F: {} };
        this.loaded = true;

        console.log('SpriteManager: Initialized -', Object.keys(this.wings.M).length * 2, 'sexed wing sets loaded');
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

    hasWings(personalityType, sex = 'F') {
        return this.loaded && this.wings[sex] && this.wings[sex][personalityType] != null;
    }

    hasBody() {
        return this.loaded && this.body != null;
    }

    hasAntenna() {
        return this.loaded && this.antenna != null;
    }

    getWingPieceForSpec(spec, wingKey) {
        if (!spec) return null;

        if (spec.hybridGenome?.wingDonors?.[wingKey]) {
            const donor = spec.hybridGenome.wingDonors[wingKey];
            const donorSet = this.wings[donor.sex] && this.wings[donor.sex][donor.personalityType];
            return donorSet ? donorSet[wingKey] : null;
        }

        const sex = spec.sex || 'F';
        const personalityType = spec.personalityType === 'hybrid'
            ? (spec.baseType || 'friendly')
            : spec.personalityType;

        const wingSet = this.wings[sex] && this.wings[sex][personalityType];
        return wingSet ? wingSet[wingKey] : null;
    }

    hasRenderableSpec(spec) {
        const wingKeys = ['foreLeft', 'foreRight', 'hindLeft', 'hindRight'];
        return wingKeys.every(wingKey => !!this.getWingPieceForSpec(spec, wingKey));
    }
}

const spriteManager = new SpriteManager();
