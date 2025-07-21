# Ephemera

An interactive digital art piece exploring themes of fragility and beauty through pixel butterflies in an impressionistic garden.

## Running the Game

1. Open `index.html` in a web browser
2. Or run a local server: `python -m http.server 8000` and visit http://localhost:8000

## Core Mechanics

- **Gentle Hover**: Keep cursor still near butterflies to see them display and release joy pixels
- **Movement**: Slow movements lead butterflies, fast movements scare them
- **Flowers**: Collect 5 pollen pixels (white) then click to plant flowers
- **Color Pools**: Pixels accumulate and pulse, spawning new butterflies after 3 seconds
- **Ecosystem**: Butterflies → Pixels → Pools → New Butterflies + Pollen → Flowers

## Controls

### Game Mode
- Move cursor slowly to interact gently with butterflies
- Click to plant flowers (requires 5 pollen)
- Watch as the garden creates its own living ecosystem

### Debug Mode (Press D)
- **Arrow Keys**: Move cursor with isometric movement
- **Q/E**: Change tool (butterfly, flower, walkable, blocked)
- **Space**: Place entity or toggle tile state
- **X**: Export tile data to console

## Debug/Builder Features

The debug mode features a **simplified isometric tile system**:

### Tile States
- **Walkable** (Green): Mark tiles where entities can move/exist
- **Blocked** (Red): Mark tiles that should be avoided

### Entity Placement
- **Butterfly**: Places a butterfly at cursor (can float above any tile)
- **Flower**: Places a flower at cursor (respects tile states)

This simplified system lets you define which isometric grid positions look good when occupied by entities. Butterflies float above the grid while ground entities respect the walkable/blocked states.

### Configuring Playable Boundaries

The isometric grid uses a coordinate system aligned with the background image. To adjust the playable area, edit `config.isoBounds` in `sketch.js`:

```javascript
isoBounds: {
    maxX: 9,    // Maximum X coordinate (right edge)
    maxY: 9     // Maximum Y coordinate (bottom edge)
}
```

The grid is automatically offset to align with the background image using `config.gridOffset`. Coordinates run from (0,0) to (maxX, maxY) with the orange boundary showing the playable area.

## Development Status

Core mechanics and debug tools complete. Remaining polish:
- Visual effects (bloom, dithering, light trails)
- Zone-based AI behaviors for butterflies