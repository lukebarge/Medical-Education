import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite config for building the Medical Education docs.
 * Usage: npm run build:site
 */
export default defineConfig({
  root: 'docs',
  base: '/',
  build: {
    outDir: '../dist/docs',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index:               resolve(__dirname, 'docs/index.html'),
        heartBeat:           resolve(__dirname, 'docs/physiology/heart-beat.html'),
        breathing:           resolve(__dirname, 'docs/physiology/breathing.html'),
        bloodFlow:           resolve(__dirname, 'docs/physiology/blood-flow.html'),
        actionPotential:     resolve(__dirname, 'docs/physiology/action-potential.html'),
        drugAbsorption:      resolve(__dirname, 'docs/pharmacology/drug-absorption.html'),
        pharmacokinetics:    resolve(__dirname, 'docs/pharmacology/pharmacokinetics.html'),
      }
    }
  }
});
