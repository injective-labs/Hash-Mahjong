# Hash Mahjong — Onchain Hash-to-Tiles Mini Game

Hash Mahjong is a verifiable, onchain-native mini game where **your Injective EVM transaction hash becomes your "hand."**  
You trigger a tiny transaction on **Injective EVM Mainnet**, take the **last 10 hex characters** of the tx hash (`seed10`), map each hex nibble to a Mahjong tile, and evaluate **18 win rules** (pairs, triples, straights, palindrome patterns, etc.).

Built with **Next.js + React + TypeScript** — no HTML authoring required.

---

## What's Onchain (and verifiable)

- **Network:** Injective EVM Mainnet (`chainId: 1776`, `0x6f0`)
- **Play action:** Sends a small **native INJ transfer** on Injective EVM
- **Game address:** `0x6cd6592b7d2a9b1e59aa60a6138434d2fe4cd062`
- **Play cost:** `0.000001 INJ` per play
- **Explorer:** Blockscout (`https://blockscout.injective.network/tx/<TX_HASH>`)

**Core idea:** the outcome is **deterministic** and **reproducible by anyone** from the tx hash.

```
seed10 = lower(txHash without "0x").slice(-10)
```

---

## How to Play

1. Open the app and click **CONNECT**.
2. Click **SWITCH NET** if you're not on Injective EVM Mainnet.
3. Click **PLAY** → your wallet sends `0.000001 INJ` to the game address.
4. After confirmation, the UI shows:
   - tx hash (clickable to Blockscout)
   - `SEED10` (last 10 hex chars)
   - 10 Mahjong tiles derived from `seed10`
   - WIN / NO WIN + the matched rule

> Tip: You can validate any play by copying the tx hash and recomputing `seed10` locally.

---

## Tile Mapping (Hex → Mahjong)

| Hex | Tile | Name              |
| --- | ---- | ----------------- |
| 0   | 🀆   | White Dragon      |
| 1–9 | 🀇–🀏 | 1–9 of Characters |
| a–d | 🀐–🀓 | 1–4 of Bamboos    |
| e   | 🀄   | Red Dragon        |
| f   | 🀅   | Green Dragon      |

---

## Winning Rules (18)

| #  | Rule              | Multiplier | Description                                              |
| -- | ----------------- | ---------- | -------------------------------------------------------- |
| 1  | Tenfold Harmony   | 10000x     | All 10 tiles are identical.                              |
| 2  | Ninefold Harmony  | 2000x      | 9 tiles are identical.                                   |
| 3  | Eightfold Harmony | 500x       | 8 tiles are identical.                                   |
| 4  | Sevenfold Harmony | 200x       | 7 tiles are identical.                                   |
| 5  | Sixfold Harmony   | 80x        | 6 tiles are identical.                                   |
| 6  | Fivefold Harmony  | 30x        | 5 tiles are identical.                                   |
| 7  | Double Quads      | 200x       | Two separate 4-of-a-kind sets (4+4+2).                   |
| 8  | Quad + Triple     | 120x       | A 4-of-a-kind plus a 3-of-a-kind.                        |
| 9  | Three Triples     | 90x        | At least three 3-of-a-kind sets.                         |
| 10 | Two Triples       | 35x        | At least two 3-of-a-kind sets.                           |
| 11 | Five Pairs        | 25x        | Exactly five pairs (2+2+2+2+2).                          |
| 12 | Four Pairs        | 10x        | Exactly four pairs (2+2+2+2+1+1).                        |
| 13 | Full House        | 20x        | At least one triple and at least one pair.               |
| 14 | Any Triple        | 5x         | At least one 3-of-a-kind.                                |
| 15 | Straight-5        | 15x        | Any 5 consecutive hex digits in adjacent positions.      |
| 16 | Double Straight-4 | 30x        | Two non-overlapping 4-tile straights.                    |
| 17 | Palindrome        | 50x        | The 10-hex seed reads the same forwards and backwards.   |
| 18 | Alternating AB    | 40x        | ABABABABAB pattern (A ≠ B).                              |

---

## UX Features

- **Hash visualization:** Renders the full tx hash and highlights `seed10` tiles.
- **History & progression:** Stores up to 50 recent plays in `localStorage`.
- **EXP / Level system:** Lightweight local progression with levels 1–100.
- **Daily & weekly tasks:** Bonus EXP for completing play/win milestones.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Webpack)
- **Language:** TypeScript + React (TSX)
- **Styling:** CSS (global stylesheet, no Tailwind)
- **Web3:** ethers.js v6 (npm package)
- **Wallet:** MetaMask / EIP-1193 provider
- **Network:** Injective EVM Mainnet

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/
│   ├── globals.css      # All styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main game page
├── components/
│   ├── Background.tsx   # Animated background
│   ├── HashDisplay.tsx  # Tile rendering
│   ├── Header.tsx       # EXP bar & header
│   └── Modal.tsx        # Rules / History / Tasks
└── lib/
    ├── rules.ts         # 18 win rules & tile map
    ├── tasks.ts         # EXP & task system
    ├── types.ts         # TypeScript interfaces
    └── wallet.ts        # Web3 / chain config
```

---

## Notes

- This app sends a real transaction on Injective EVM Mainnet. Always verify the network and destination address before confirming.
- UI "multipliers" are for game feedback only — no financial promise.

---

## License

MIT
