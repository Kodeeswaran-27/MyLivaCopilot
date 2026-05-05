# Split-Screen Corporate UI

This plan outlines the steps to build a modern, corporate split-screen layout for your web app using React.js and Tailwind CSS.

## Proposed Changes

We will create a fresh React setup using Vite manually since the automatic CLI tool encountered a Node.js ESM issue in this environment. 

### Core Project Files
- `package.json`: Dependencies for React, ReactDOM, Vite, Tailwind CSS, PostCSS, Autoprefixer, and Lucide React.
- `vite.config.js`: Setup for Vite.
- `index.html`: Entry point for the application.
- `tailwind.config.js` & `postcss.config.js`: Tailwind configuration.

### React Application Files
- `src/main.jsx`: Application bootstrap file.
- `src/index.css`: Global styles including Tailwind directives.
- `src/App.jsx`: The main layout component.

**App Layout Structure:**
- **Container**: `div` with `flex h-screen w-full`.
- **Left Panel (50%)**: 
  - **Top Section**: Strong headline ("Smarter Conversations. Faster Decisions."), short subtext, clean layout.
  - **Bottom Section**: Feature cards grid. We will include 4-6 cards using Lucide-React icons. Soft shadows, hover effects.
- **Right Panel (50%)**: `iframe` loading the provided `copilotstudio.microsoft.com` bot chat URL, styled to take the full width and height.

## Open Questions

> [!NOTE]
> Are there any specific brand colors you would prefer? For now, we will use a neutral modern palette (grays, whites with subtle Indigo/Blue accents for hover effects).

## Verification Plan

### Manual Verification
- Start the server using `npm run dev` and navigate to `http://localhost:5173`.
- Verify the left and right split is 50-50 on a desktop resolution.
- Verify the chat interface renders and works interactively.
- Check hover animations on the feature cards.
