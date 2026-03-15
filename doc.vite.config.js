import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite config for building the Medical Education doc.
 * Usage: npm run build:site
 */
export default defineConfig({
  root: 'doc',
  base: '/',
  build: {
    outDir: '../dist/doc',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index:               resolve(__dirname, 'doc/index.html'),
        heartBeat:           resolve(__dirname, 'doc/physiology/heart-beat.html'),
        breathing:           resolve(__dirname, 'doc/physiology/breathing.html'),
        bloodFlow:           resolve(__dirname, 'doc/physiology/blood-flow.html'),
        actionPotential:     resolve(__dirname, 'doc/physiology/action-potential.html'),
        drugAbsorption:      resolve(__dirname, 'doc/pharmacology/drug-absorption.html'),
        pharmacokinetics:    resolve(__dirname, 'doc/pharmacology/pharmacokinetics.html'),
      }
    }
  }
});
