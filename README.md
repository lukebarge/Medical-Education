# anim2d — Medical Education Animation Library

A general-purpose 2D Canvas animation library with interactive UI controls. Ships with medical education examples covering physiology, pharmacology, and anatomy.

## Features

- **Canvas 2D rendering** with HiDPI/retina support
- **Imperative API** — create objects, call methods, attach event listeners
- **Tweens & Timelines** — eased value interpolation and sequenced animations
- **Shapes** — Circle, Rect, Path, Text with `.animate()` per-property tweening
- **Effects** — ParticleSystem, WaveForm (EKG-style), FlowPath (particle trails along bezier paths)
- **UI Controls** — Slider, Toggle, NumberInput, Button, ControlPanel — mount into DOM, bind to animations in real-time
- **Medical examples** — HeartBeat, Breathing, BloodFlow, ActionPotential, DrugAbsorption, Pharmacokinetics

---

## Quick Start

```bash
npm install
npm run dev    # Vite dev server
npm test       # Run tests
npm run build  # Bundle library to dist/
```

Open demo pages at `http://localhost:5173/demo/heart-beat/`.

---

## API Overview

### Core

```js
import { Canvas, Scene, Tween, Timeline } from './src/index.js';

// Create a canvas
const canvas = new Canvas('#app', { width: 800, height: 600 });
const scene = new Scene(canvas);

// Tween a value
const tween = new Tween({ from: 0, to: 100, duration: 500, easing: 'easeInOut' });
tween.on('update', v => console.log(v));
tween.play();

// Start scene render loop
scene.start();
```

### Shapes

```js
import { Circle, Rect, Path, Text } from './src/index.js';

const circle = new Circle({ x: 100, y: 100, radius: 40, fill: 'red' });
scene.add(circle);

// Animate a property
circle.animate({ radius: 80 }, { duration: 400, easing: 'easeOut' });
```

### Effects

```js
import { ParticleSystem, WaveForm, FlowPath } from './src/index.js';

// Particle burst
const ps = new ParticleSystem({
  emitter: { x: 200, y: 200 },
  count: 50,
  velocity: { x: [-2, 2], y: [-3, 0] },
  color: '#ff4444',
  gravity: 0.05
});
scene.add(ps);
ps.emit();

// Scrolling waveform
const wf = new WaveForm(canvas, { scrolling: true, color: '#00ff88', yMin: -90, yMax: 50 });
scene.add(wf);
wf.push(voltage); // push values in real-time

// Flow along a path
const flow = new FlowPath({
  path: [[0, 150], [200, 100], [400, 150]],
  particleCount: 20,
  color: '#cc2222'
});
scene.add(flow);
flow.play();
```

### Controls

```js
import { ControlPanel, Slider, Toggle, NumberInput, Button, Binding } from './src/index.js';

const panel = new ControlPanel('#controls', { title: 'Parameters', theme: 'dark' });

panel.add(new Slider({
  label: 'Heart Rate', min: 40, max: 200, value: 72, unit: 'bpm',
  onChange: v => heart.setBPM(v)
}));

panel.add(new Toggle({
  label: 'Show Labels', value: true,
  onChange: v => heart.showLabels(v)
}));

panel.add(new Button({
  label: 'Trigger Arrhythmia',
  onClick: () => heart.triggerArrhythmia()
}));

panel.mount();

// Two-way binding shorthand
Binding.create(slider, heart, 'bpm');
```

---

## Medical Education Examples

All examples extend `Animation` and expose parameter setters bindable to controls.

### HeartBeat

```js
import { HeartBeat } from './src/examples/HeartBeat.js';

const heart = new HeartBeat(canvas, { bpm: 72, sarcomereLength: 2.2 });
heart.on('systole', () => console.log('Lub'));
heart.on('diastole', () => console.log('Dub'));
scene.add(heart);
heart.play();

heart.setBPM(120);               // tachycardia
heart.setSarcomereLength(1.8);  // Frank-Starling effect
heart.setContractility(0.9);
heart.triggerArrhythmia();
```

### Breathing

```js
import { Breathing } from './src/examples/Breathing.js';

const breath = new Breathing(canvas, { rate: 14, tidalVolume: 0.5 });
breath.setRate(20);              // tachypnea
breath.setAirwayResistance(0.8); // COPD simulation
breath.on('inhale', () => {});
breath.on('exhale', () => {});
```

### BloodFlow

```js
import { BloodFlow } from './src/examples/BloodFlow.js';

const flow = new BloodFlow(canvas, { vascularResistance: 1.0, pressure: 120 });
flow.setVascularResistance(2.0); // hypertension simulation
flow.setPressure(180);
flow.setViscosity(1.5);          // polycythemia
```

### ActionPotential

```js
import { ActionPotential } from './src/examples/ActionPotential.js';

const ap = new ActionPotential(canvas, { threshold: -55, conductionVelocity: 1 });
ap.trigger();                      // manually fire
ap.setThreshold(-65);              // harder to trigger
ap.setConductionVelocity(2.0);     // faster nerve
ap.on('depolarization', () => {});
ap.on('repolarization', () => {});
```

### DrugAbsorption

```js
import { DrugAbsorption } from './src/examples/DrugAbsorption.js';

const da = new DrugAbsorption(canvas, { route: 'oral', dose: 500 });
da.setRoute('IV');            // immediate bioavailability
da.setDose(250);
da.setAbsorptionRate(1.5);
```

### Pharmacokinetics

```js
import { Pharmacokinetics } from './src/examples/Pharmacokinetics.js';

const pk = new Pharmacokinetics(canvas, { Cmax: 100, halfLife: 4, tmax: 1, Vd: 30 });
pk.setHalfLife(2);    // faster elimination
pk.setCmax(200);      // higher dose
pk.on('complete', () => console.log('Simulation done'));
```

---

## Project Structure

```
src/
  core/         EventEmitter, Canvas, Renderer, Animation, Tween, Timeline, Scene
  shapes/       Shape, Circle, Rect, Path, Text
  effects/      ParticleSystem, WaveForm, FlowPath
  controls/     ControlPanel, Slider, Toggle, NumberInput, Button, Binding
  examples/     HeartBeat, Breathing, BloodFlow, ActionPotential, DrugAbsorption, Pharmacokinetics
  index.js      Barrel export
demo/           Browser-runnable HTML demos
tests/          Vitest unit tests
```

---

## Running Tests

```bash
npm test            # single run
npm run test:watch  # watch mode
npm run coverage    # coverage report
```

---

## License

MIT
