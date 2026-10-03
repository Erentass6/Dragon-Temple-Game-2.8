# 🐉 Dragon Temple Run

A **Flappy Bird-style** browser game built with vanilla HTML5 Canvas, CSS, and JavaScript — no frameworks, no dependencies, no build tools. Fly a fire-breathing dragon through ancient Chinese temple pillars while dodging obstacles and racking up combos.

## 🎮 Play Now

1. Clone the repo
2. Open `index.html` in any modern browser
3. Click / Tap / Press `Space` or `↑` to fly

> **No server required** — runs entirely in the browser as static files.

---

## ✨ Features

### Gameplay
- Classic flappy-style physics with gravity, flap impulse, and rotation
- Progressive difficulty — gap size shrinks and speed increases with score
- Combo system rewarding consecutive scores within 3 seconds
- Score popup animations and screen shake on death
- Best score tracking per session

### Dragon Character
- Fully animated with canvas drawing (no sprites or images)
- Wing flapping, tail swaying, and body rotation based on velocity
- **Fire breath** — flames burst from the dragon's mouth on each flap
- Smoke trail particles behind the body
- Detailed features: slit pupils, golden horns, belly scales, back spikes

### Environment & Atmosphere
- Dynamic gradient sky that darkens as score increases
- Parallax scrolling mountains with pagoda silhouettes
- Floating Chinese lanterns with glow effects and swinging tassels
- Drifting cherry blossom petals
- Rising ember particles from the ground
- Flying birds with wing-flap animation
- Moon with crater details and radial glow
- Twinkling stars with cross-shine effect

### Temple Obstacles
- Red pagoda-style pillars with gradient shading
- Multi-tiered curved roofs with upturned golden corners
- Moon gate windows with warm inner glow and lattice pattern
- Gold trim bands with decorative dot patterns
- Dragon relief carvings on taller pillars

### Audio (Web Audio API)
- **Background music** — procedurally generated pentatonic melody with harmony and ambient drone
- **Sound effects** — flap whoosh, fire crackle (white noise layer), score chime, death explosion
- Mute/unmute toggle button in-game
- Zero external audio files — everything synthesized at runtime

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 |
| Styling | CSS3 (animations, gradients, clamp units) |
| Rendering | Canvas 2D API |
| Audio | Web Audio API (OscillatorNode, BufferSource) |
| Architecture | Vanilla JS, IIFE pattern, no dependencies |

---

## 📁 Project Structure

```
dragon-temple-run/
├── index.html      # Page structure and DOM elements
├── style.css       # UI styling, animations, responsive layout
├── game.js         # Game engine — physics, rendering, audio, input
└── README.md
```

---

## 🎯 Technical Highlights

- **Zero dependencies** — no npm, no CDN, no build step. Pure browser APIs only.
- **Procedural audio** — background music and all SFX generated with Web Audio API oscillators and noise buffers. No audio files to load.
- **Procedural graphics** — the entire dragon, temples, lanterns, and environment are drawn with Canvas 2D path operations. No image assets required.
- **IIFE encapsulation** — all game code wrapped in an immediately-invoked function expression to prevent global scope pollution.
- **Responsive design** — adapts to any screen size with CSS clamp units and dynamic canvas resizing.
- **Mobile-ready** — touch input with `passive: false` for immediate response, viewport meta tag for proper scaling.
- **60 FPS particle system** — fire, smoke, sparks, score popups, and explosion effects managed in a single array with lifecycle tracking.

---

## 🎨 Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Dragon Body | Forest Green | `#2d8c2d` |
| Dragon Horns & Gold Trim | Imperial Gold | `#f5d442` |
| Temple Pillars | Chinese Red | `#e74c3c` |
| Fire Breath | Amber → Orange → Red | `#ffee00` → `#ff3300` |
| Sky (top) | Deep Purple | `#1a0a2e` |
| Sky (bottom) | Warm Bronze | `#cd853f` |

---

## 🕹 Controls

| Input | Action |
|-------|--------|
| Mouse Click | Flap |
| Touch / Tap | Flap |
| Spacebar | Flap |
| Arrow Up (↑) | Flap |

---

## 📸 Screenshots

> *Add your own screenshots here after running the game!*

---

## 🚀 Future Improvements

- [ ] Persistent high score with localStorage
- [ ] Power-ups (shield, slow motion, magnet coins)
- [ ] Collectible coins between temple gaps
- [ ] Multiple dragon skins / themes
- [ ] Difficulty selection (Easy / Normal / Hard)
- [ ] Mobile PWA support with offline play
- [ ] Leaderboard integration

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Serhat** — Computer Programming Student @ Ostim Technical University

Built as a portfolio project to demonstrate browser game development with pure web technologies.

---

*If you enjoyed this game, consider giving it a ⭐ on GitHub!*
