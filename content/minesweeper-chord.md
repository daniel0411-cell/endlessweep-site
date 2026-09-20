---
title: Minesweeper Chord Click: Reveal Squares Faster
description: Learn how Minesweeper chord clicking works, when it is safe, how to use it on desktop and mobile, and why wrong flags cause losses.
slug: minesweeper-chord
heading: Minesweeper Chord Click
summary: Open several safe squares with one verified action.
---
## What does chord mean in Minesweeper?

Chord is an action on an already open number. When the number touches exactly the same number of flags as its value, chording reveals all its other covered neighbors at once.

## A simple example

If an open **2** touches two flagged squares and three other covered squares, a chord opens those three covered squares. The game trusts the flag count; it does not verify that the flags are correct.

## How to chord on Endlessweep

- Desktop: click an already open number.
- Mobile: stay in Reveal mode and tap the open number.
- Keyboard: focus the open number and press `Enter` or `Space`.

See all inputs in the [Minesweeper controls guide](/minesweeper-controls/).

## Why a chord can hit a mine

The adjacent flag count may match while one flag is on the wrong square. The chord then reveals the actual mine among the remaining neighbors. Verify each flag through logic before using the shortcut.

## When chord does nothing

If the number and adjacent flag count do not match, Endlessweep leaves the covered squares closed. Add or remove flags only after checking the surrounding clues.

## Chord and efficiency

A chord can replace several individual reveals, improving speed and reducing total actions. Endlessweep records chord actions separately and counts a chord as progress only when it opens at least one new square.

## Build a safe chording habit

1. Confirm the number's required mines.
2. Verify the location of every adjacent flag.
3. Check that unflagged covered neighbors should all be safe.
4. Chord the number once.
5. Scan the newly opened boundary before continuing.
