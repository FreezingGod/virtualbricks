# VirtualBricks

[中文文档](./README_CN.md)

A web-based brick building simulator built with React, Three.js, and TypeScript.

## Features

### Brick Building
- **45+ Brick Types**: Standard bricks, plates, slopes (33°/45°/65°), round bricks, and cones
- **Snap-to-Grid**: Automatic alignment to standard brick grid system
- **Connection Detection**: Smart snapping between brick studs and anti-studs
- **Collision Detection**: Prevents overlapping brick placement
- **Color Selection**: 47+ colors available

### Tools
- **Place Tool**: Add new bricks to the scene
- **Select Tool**: Click to select, Shift+click for multi-select
- **Delete Tool**: Remove bricks from the scene
- **Rotate**: Press `R` to rotate brick before placement

### Storage & Export
- **Local Storage**: Save/load projects using IndexedDB
- **JSON Export/Import**: Backup and share projects
- **LDraw Export**: Export to industry-standard .ldr format (compatible with BrickLink Studio, LeoCAD, LDView)

### Rendering
- **PBR Materials**: Realistic plastic appearance with proper roughness/metalness
- **Shadows**: Dynamic shadow casting and receiving
- **Beveled Edges**: Authentic brick edge chamfers

## Tech Stack

- **React 18** - UI framework
- **Three.js / React Three Fiber** - 3D rendering
- **Rapier** - Physics engine (WASM)
- **Zustand** - State management
- **TypeScript** - Type safety
- **Vite** - Build tool

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:FreezingGod/virtualbricks.git
cd virtualbricks

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── canvas/          # 3D rendering components
│   │   ├── LegoCanvas.tsx
│   │   ├── BrickMesh.tsx
│   │   ├── GhostBrick.tsx
│   │   └── PhysicsBrick*.tsx
│   └── ui/              # UI components
│       ├── Toolbar.tsx
│       ├── PartsPalette.tsx
│       ├── ColorPicker.tsx
│       └── SaveLoadDialog.tsx
├── core/
│   ├── brick/           # Brick system
│   │   ├── BrickRegistry.ts
│   │   └── BrickGeometry.ts
│   ├── connection/      # Snap detection
│   ├── collision/       # Collision detection
│   └── constants/       # Brick dimensions
├── exporters/           # File format exporters
│   └── LDrawExporter.ts
├── services/            # Storage services
│   └── StorageService.ts
├── store/               # Zustand stores
└── types/               # TypeScript types
```

## Brick Dimensions

The simulator uses standard brick dimensions:

| Measurement | Value |
|-------------|-------|
| Stud Spacing | 8.0 mm |
| Stud Diameter | 4.8 mm |
| Stud Height | 1.6 mm |
| Plate Height | 3.2 mm |
| Brick Height | 9.6 mm (3 plates) |
| LDU Conversion | 1 LDU = 0.4 mm |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Rotate brick (in place mode) |
| `Ctrl+S` | Save project |
| `Ctrl+O` | Load project |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Delete` | Delete selected bricks |

## Roadmap

- [ ] **Technic System**: Beams, axles, pins, gears
- [ ] **Motor Simulation**: Powered functions
- [ ] **Physics Simulation**: Gravity, collisions
- [ ] **Build Instructions**: Step-by-step PDF export
- [ ] **More Brick Types**: Arches, wedges, SNOT bricks

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see below for details.

```
MIT License

Copyright (c) 2024 VirtualBricks

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgments

- [LDraw.org](https://www.ldraw.org/) - CAD standards and part library
- [BrickLink](https://www.bricklink.com/) - Color references
- [Three.js](https://threejs.org/) - 3D graphics library
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - React renderer for Three.js
