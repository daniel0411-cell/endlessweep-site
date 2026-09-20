---
title: How to Flag in Minesweeper: Rules and Best Practices
description: Learn how to place and remove Minesweeper flags on desktop, mobile, and keyboard, and when a square is logically proven to be a mine.
slug: how-to-flag-minesweeper
heading: How to Flag in Minesweeper
summary: Mark proven mines without letting speculative flags corrupt your logic.
---
## What does a flag do?

A flag marks a covered square that you believe contains a mine. It prevents an ordinary reveal on that square and helps you keep track of deductions. The flag does not move or remove the mine, and the game does not confirm that the flag is correct.

## How to place a flag

- Desktop: right-click a covered square.
- Mobile: switch to Flag mode and tap the square, or press and hold it.
- Keyboard: move focus with the arrow keys and press `F`.

Repeat the same action to remove the flag. The [controls guide](/minesweeper-controls/) lists every input.

## When is a mine proven?

If a clue still needs exactly as many mines as it has unflagged covered neighbors, all those neighbors are mines. For example, if a **2** touches one confirmed flag and only one other covered square, that square must contain the second mine.

## Flags and safe squares

Once a clue touches its full number of flags, every other covered neighbor is safe. This is why accurate flags create progress: they convert nearby uncertainty into certain reveals.

## Do you have to flag every mine?

No. Most Minesweeper games are won by revealing all safe squares. You may leave isolated mines unflagged if their surrounding safe squares are already open. Flagging is a reasoning tool, not always a completion requirement.

## Flags and the mine counter

Endlessweep subtracts placed flags from the displayed mine count. A zero counter means the number of flags equals the number of mines, not that every flag is correct.

## Why wrong flags are dangerous

A wrong flag creates false information around every clue it touches. It is especially dangerous before a chord because the chord checks only whether the number of adjacent flags matches.

## A reliable flagging routine

1. Identify the clue and all its covered neighbors.
2. Subtract adjacent confirmed flags from the clue value.
3. Confirm that the remaining mine requirement equals the remaining candidates.
4. Flag those candidates.
5. Recheck nearby clues for new safe reveals.
