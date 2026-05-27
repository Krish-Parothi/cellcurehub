# iPhone Scrollytelling Feature Walkthrough

I have successfully replaced the old static iPhone Hero section with a high-end, Awwwards-level scrollytelling experience!

## Changes Made
- **Relocated Images:** Moved the image sequence folder to `public/iphone-animated/` so Next.js can serve the JPG frames statically to the canvas.
- **Created `ScrollyIphone` Component:** 
  - Implemented a 400vh tall scroll container.
  - Used HTML5 `<canvas>` powered by `framer-motion`'s `useScroll` to scrub smoothly through 22 frames as the user scrolls.
  - Added an initial loading state that waits for all 22 frames to preload before rendering the canvas to prevent stuttering.
  - Set the canvas `mix-blend-screen` so that the black background of the `.jpg` sequence perfectly fades into our dark mode `#0A0A0A` background without any seams.
  - Synced cinematic text overlays that fade in and out precisely at 0%, 30%, 60%, and 90% scroll depth.
- **Updated `page.tsx` (Home Page):**
  - Removed the old `HeroSection` and the old `PhoneTeardownSection`.
  - Injected the new `<ScrollyIphone />` component right under the navbar.
  - Retained all the other informational sections (`ServicesGrid`, `HowItWorks`, etc.) underneath the new hero as requested.
  - Mapped all CTA buttons ("Book Now") to the `/coming-soon` route.

## Verification
- Navigate to your home page (`localhost:3000/`) and scroll down from the top.
- You will see the cinematic iPhone animation unfold exactly in sync with your mouse wheel, accompanied by the new overlay texts!
