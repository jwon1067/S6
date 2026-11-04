# Star Burrow

A whack-a-mole clicker for CMPM 121 (D1). Star moles pop out of their
burrows at night; whack one while it is up and it shakes loose stars,
the game's currency. Burrows also sift a slow drip of stardust on
their own, and the burrow shop turns stars into a bigger star economy.

## How to play

- Click a burrow while a mole is up to whack it. Each whack pays
  stars; clicking an empty burrow only earns a shake.
- Burrows drip passive stars over time, so the economy keeps growing
  while you wait.
- Spend stars in the burrow shop:

| Upgrade       | Effect                                    | Cost pacing          |
| ------------- | ----------------------------------------- | -------------------- |
| Bigger Mallet | +1★ per whack per level                   | 10★, ×1.65 per level |
| Extra Burrow  | +0.4★ per second per level                | 25★, ×1.75 per level |
| Mole Treats   | moles pop 15% faster per level (max 8)    | 40★, ×1.9 per level  |
| Golden Mole   | every 8th whack pays eightfold (one-time) | 120★                 |
| Comet Mole    | star drip ×1.25 per level                 | 300★, ×2 per level   |

## Development

- `deno task setup` once per clone (configures the git hooks)
- `deno task dev` serves the app at http://localhost:3000
- `deno task ci` runs formatting, lint, type check, and a production
  build; every commit runs it through a pre-commit hook
- Pushes to `main` deploy to GitHub Pages

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da), which has no explicit repository license. No new license is assigned to that material. The D1 scaffold and original SVG were authored with OpenAI GPT-6 Astra assistance. Dependencies retain their respective licenses. The Star Burrow game and its artwork were authored with GLM (z-ai/glm-5.3-flash) assistance in OpenCode.
