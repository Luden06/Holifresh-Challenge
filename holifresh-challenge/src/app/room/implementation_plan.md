# Implementation Plan - Sales Page Refinement (Gamification & UI)

The goal is to transform the Sales page into a more engaging, gamified experience while clarifying terminology and providing better personal context.

## 1. Terminology & UI Updates
- **Rename**: Replace all instances of "Probe" with "RDV".
- **Locations**:
    - Tagline above the claim button: "Probe Qualifié" -> "RDV Qualifié".
    - Leaderboard title: "Leaderboard Probes" -> "Leaderboard RDVs".

## 2. Progress Visualization
- **Personal Progress Overlay**: 
    - Modify the Team Progress Bar to include a secondary layer. 
    - The first layer will show the total team progress (as is).
    - A semi-transparent or distinct color overlay will represent the logged-in user's specific contribution within that total bar.
- **Leaderboard Mini Bars**:
    - Add a slim, vibrant progress bar under each participant's name in the leaderboard.
    - Width will be proportional to their score relative to the room objective.

## 3. Advanced Gamification Animation
- **"Boom!" Interaction**:
    - On click, trigger a high-impact visual feedback system.
    - **Implementation**: 
        - Use a **Particle Burst System** (custom Canvas or CSS-based) to simulate an explosion of "RDV" cards, coins, or brand particles.
        - Add a screen shake effect and a temporary glow pulse to the entire viewport.
        - Transform the "Boom!" text into a "combo" counter if multiple clicks occur in short succession (future-proofing).

## 4. Technical Steps
1.  **Modify `src/app/room/[roomCode]/page.tsx`**:
    - Update text strings.
    - Implement the overlay progress calculation: `(personalScore / objective) * 100`.
    - Update the leaderboard mapping to include `<div class="mini-bar">`.
2.  **Animation Component**:
    - Create a small local utility or ref helper for the particle explosion using the Web Animations API (performance-friendly) or a high-performance CSS transition system.

## Proposed Timeline
- **Phase 1**: Terminology and Layout (Progress Bars).
- **Phase 2**: High-impact Animation implementation.
- **Phase 3**: Polishing and responsiveness check.
