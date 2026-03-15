import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite config for building the Medical Education website.
 * Usage: npm run build:site
 */
export default defineConfig({
  root: 'website',
  base: '/',
  build: {
    outDir: '../dist/website',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index:               resolve(__dirname, 'website/index.html'),
        heartBeat:           resolve(__dirname, 'website/physiology/heart-beat.html'),
        breathing:           resolve(__dirname, 'website/physiology/breathing.html'),
        bloodFlow:           resolve(__dirname, 'website/physiology/blood-flow.html'),
        actionPotential:     resolve(__dirname, 'website/physiology/action-potential.html'),
        drugAbsorption:      resolve(__dirname, 'website/pharmacology/drug-absorption.html'),
        pharmacokinetics:    resolve(__dirname, 'website/pharmacology/pharmacokinetics.html'),
      }
    }
  }
});
