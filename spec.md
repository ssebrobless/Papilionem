# Ephemera - Game Design Document

## Original Vision
A miniature piece of interactive digital art exploring the theme of butterflies - their natural beauty, fragility, and daintiness. The experience should incorporate pixel/dithering effects for a minimalistic tech aesthetic. On the surface, it should be light and fun (10-180 second experience), but with a deeper undercurrent about fragility - like how moth wings disintegrate when touched, leaving beautiful but tragic dust on your fingers.

## Core Concept
An interactive garden scene with impressionistic painted atmosphere where pixel art butterflies respond to gentle cursor movements. The setting feels like a sun-drenched conservatory or indoor garden space - warm, dreamy, and intimate. Player interactions cause butterflies to shed pixel "scales" that accumulate to form new life, creating a self-sustaining ecosystem that balances creation and decay. The contrast between soft painted backgrounds and crisp pixel creatures emphasizes the delicate, ephemeral nature of the butterflies.

## Visual Style
- **Aesthetic**: Soft, impressionistic painted backgrounds with pixel/dithered butterfly elements
- **Background Style**: 
  - Watercolor-like washes of warm sunset colors (dusty pinks, peaches, muted teals)
  - Atmospheric depth with hazy, dream-like quality
  - Architectural elements suggested rather than detailed (window frames, garden structures)
  - Dappled light effects creating pools of warm and cool tones
- **Foreground Elements** (butterflies, flowers, pixels):
  - Crisp pixel art contrasting against soft backgrounds
  - Dithering used to blend pixel elements with painterly backdrop
  - Limited palette that harmonizes with background tones
- **Color Palette**: 
  - Backgrounds: Muted pastels, warm earth tones, atmospheric blues/greens
  - Butterflies: Jewel tones that pop against soft background (emerald, sapphire, amber)
  - Overall mood: Golden hour lighting, dusty/hazy atmosphere
- **Resolution**: Responsive canvas, but designed for ~800x600 optimal viewing
- **Effects**: Particle physics for falling pixels, subtle animations, light bloom on pixels

## Game Mechanics

### Resources
1. **Colored Scales** (from butterfly wings)
   - Fall when butterflies are disturbed or interact
   - Accumulate into color pools
   - Used to create new butterflies
   
2. **Pollen Pixels** (white/silver)
   - Produced when butterflies successfully visit flowers
   - Used to plant new flowers
   - Visually distinct from scales

### Core Interactions

#### 1. Gentle Hover (Primary Mechanic)
- Keep cursor still near butterfly for 2-3 seconds
- Butterfly performs wing display animation
- Releases 3-5 "joy pixels" (colored scales)
- Teaches core "be gentle" theme

#### 2. Movement Interaction
- Fast cursor movement scares butterflies
- Scared butterflies flee, dropping more pixels but stressed (darker)
- Slow movement allows leading brave butterflies

#### 3. Flower Planting
- Click ground when you have 5+ pollen pixels
- Ghost flower appears as hint when possible
- Flowers attract butterflies and enable pollen generation
- Flowers have lifecycle: Bloom (10s) → Mature (20s) → Wilting (10s) → Dissolve

#### 4. Butterfly Creation
- Color pools automatically pulse when containing 50+ pixels
- After 3 seconds of pulsing, chrysalis forms
- New butterfly emerges with colors based on pool mixture
- No direct player interaction needed (happens naturally)

#### 5. Pool Merging
- Drag between small pools to combine colors
- Creates opportunity for rare color combinations
- Adds discovery element

### Ecosystem Balance

#### Population Limits
- Soft cap: ~8-12 butterflies, ~5-6 flowers
- Oldest entities naturally fade when cap reached
- Garden has finite "life energy" (invisible)

#### Lifecycle Flow
1. Butterflies visit flowers → generate pollen
2. Pollen enables new flower planting
3. Gentle interaction with butterflies → generate scales
4. Scales form pools → auto-spawn new butterflies
5. Old butterflies fade → pixels return to system

### Butterfly Behavior

#### Personality Types
- **Brave**: Approach cursor, less flight distance
- **Cautious**: Larger comfort zones, flee earlier
- **Curious**: May approach still cursor

#### States
- **Resting**: Slow wing breathing on flowers
- **Alert**: Wings pause, antennae track cursor
- **Display**: Spread wings showing inner patterns
- **Fleeing**: Rapid departure with pixel trail

### Visual Feedback
- Subtle circular gradient around cursor showing interaction zone
- Comfort zones indicated by particle behavior
- Pool pulsing indicates readiness to spawn
- Pollen cluster shows flower planting possibility
- **Flowers**: Simple pixel art but with soft glowing centers that echo the background's light quality
- **Pixel trails**: Leave faint light traces that fade like dust motes in sunbeam

## Technical Implementation

### Recommended Stack
- **p5.js** for rendering and interaction
- **Layered Canvas approach**:
  - Static painted background (pre-rendered image)
  - Dynamic pixel layer for butterflies/flowers/particles
  - Blend modes to integrate pixel elements with painted aesthetic
- **Visual Techniques**:
  - Use transparency and dithering on pixel edges to blend with background
  - Add subtle glow/bloom effects to pixels using p5.js filters
  - Color-pick from background image to ensure harmony
- Simple particle system for pixel physics
- Basic state management for entities

### Performance Considerations
- Maximum ~100 active pixels
- Simple physics (gravity + slight bounce)
- Dithering achieved through careful color placement
- No complex shaders needed

### Responsive Design
- Primary: Desktop browsers (Safari/Chrome on MacBook)
- Secondary: Basic phone support (touch instead of hover)
- Canvas scales to window maintaining aspect ratio
- Minimum viable size: 400x300

## Player Experience Arc

### First 30 Seconds
- See 2 butterflies, 1 flower, 1 pulsing pool
- Discover cursor interaction through movement
- Witness first butterfly birth from pool

### 30-90 Seconds  
- Learn gentle hovering rewards
- Discover flower planting from pollen
- Begin shaping garden layout

### 90+ Seconds
- Garden reaches sustainable equilibrium
- Focus shifts to optimization and aesthetics
- Discovery of rare color combinations
- Meditation on the beauty/decay cycle

## Thematic Notes
- Every interaction involves exchange - beauty for entropy
- Player is both gardener and force of change
- The garden is most beautiful when in flux
- Destruction (pixel shedding) enables creation
- Touch is both connection and damage

## Atmospheric Goals
- **Mood**: Quiet afternoon in a secret garden space
- **Light**: Golden hour streaming through unseen windows
- **Space**: Intimate, cozy, slightly overgrown
- **Feeling**: Nostalgic, dreamy, a place outside of time
- **Sound Palette** (if added): Distant chimes, soft ambient room tone
- The pixel butterflies feel like digital spirits inhabiting a painted memory

## Development Priorities
1. Core butterfly behavior and cursor interaction
2. Basic pixel physics system
3. Pool accumulation and spawning
4. Flower lifecycle
5. Polish: sounds, particle effects, rare butterflies

## Simplifications for Scope
- No save system needed
- No complex UI - the garden IS the interface
- Sound optional (simple chimes if added)
- No tutorial - discovery through play
- Fixed garden size (no scrolling/zooming)
