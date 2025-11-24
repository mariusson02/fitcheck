# FitCheck — Frontend

A small React + TypeScript single-page app that lets you upload an image, runs client-side person segmentation (BodyPix), generates a transparent segmented preview, and extracts a color palette and score (0 to 1 - 1 being the best). The project is scaffolded with Vite.

**Stack:** React, TypeScript, Vite, TensorFlow.js (BodyPix), chroma-js (palette analysis). Optional/experimental: Three.js (3D viewer).

**Quick Start (development)**

- Requirements: Node.js (16+) and npm.
- From the repo root open a terminal and run:

```powershell
cd frontend
npm install
npm run dev
```

Open the printed `http://localhost:5173` (or the one Vite shows) in your browser.

**Build / Preview**

```powershell
cd frontend
npm run build
npm run preview
```