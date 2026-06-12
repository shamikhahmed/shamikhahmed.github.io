# Higgsfield cinematic hero loop

The homepage has a ready video slot behind the Three.js galaxy: drop a file at
`assets/video/hero-loop.mp4` and it auto-activates (fades in at 22% opacity
under the particles; removed silently if the file is missing; never plays for
reduced-motion users).

Higgsfield is a hosted AI video platform — generating the clip needs your
account at https://higgsfield.ai, so it can't be automated from this repo.

## Suggested generation settings

- **Duration:** 5–8 s seamless loop · **Aspect:** 16:9 (1920×1080 is plenty at 22% opacity)
- **Motion:** slow dolly or drift — nothing fast; it sits behind text

## Prompt to use

> Slow cinematic drift through a deep navy night sky, faint golden
> constellation lines connecting warm amber stars, subtle nebula haze,
> ultra dark background (#0a0e17), elegant, minimal, luxurious, no text,
> no lens flare, seamless loop, 24fps

## After export

```bash
# keep it light — target < 2.5 MB
ffmpeg -i higgsfield-export.mp4 -an -vf "scale=1920:-2" -crf 30 -movflags +faststart assets/video/hero-loop.mp4
```

Then add `'./assets/video/hero-loop.mp4'` to ASSETS in `sw.js` and bump the
cache version if you want it available offline (optional — it lazy-loads).
