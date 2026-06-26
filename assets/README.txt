Renda Fury — assets

cover.png            Game cover art (square; shown in the Wonderbox CHOOSE GAME grid). Referenced by
                     manifest.json. Optional for browser testing.

locations/location-01 … location-10/
                     One folder per stage. Drop into each:
                       background.jpg (or .png) — full-screen stage background (1920x1080 ideal)
                       music.mp3                 — looping music for sets at this location
                     Referenced by src/locations.js. Rename the display names there to match.

voice/               Optional recorded voice callouts to replace the synthesized placeholders:
                       ready.mp3  fight.mp3  winner.mp3  draw.mp3
                     Then set VOICE_FILES = true in src/audio.js.
