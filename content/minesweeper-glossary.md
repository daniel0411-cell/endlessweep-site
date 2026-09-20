---
title: Minesweeper Glossary: Common Terms Explained
description: Understand common Minesweeper terms including chord, frontier, flag, opening, 50/50, no-guess, mine density, 3BV, and efficiency.
slug: minesweeper-glossary
heading: Minesweeper Glossary
summary: A plain-language reference for common Minesweeper terms.
---
## Board

The complete grid of covered and revealed squares. Standard boards include Beginner, Intermediate, and Expert.

## Cell or square

One position on the board. A square may be covered, revealed, flagged, safe, or mined.

## Clue

A revealed number showing how many mines touch that square, including diagonal neighbors.

## Flag

A player marker placed on a covered square believed to contain a mine. A flag does not change the underlying board and can be removed.

## Chord

Clicking or tapping an open number to reveal its other covered neighbors after the adjacent flag count matches the clue. See the [chord guide](/minesweeper-chord/).

## Opening

The group of squares revealed from an empty square and its connected empty neighbors. A larger opening exposes more clues at the start.

## Frontier

The boundary where revealed clues touch covered squares. Most active deductions happen along the frontier.

## Pattern

A recurring relationship between clues and covered candidates, such as 1-2-1. Patterns are valid only when the complete neighbor sets match their conditions.

## Guess

A move chosen without proof that the square is safe. Some guesses have unequal risks; a true 50/50 gives two equally supported choices.

## 50/50

An ambiguous position with two equally valid mine arrangements and no available clue that separates them. Read the [50/50 guide](/minesweeper-50-50/) for the full test.

## No-guess board

A board verified to have a deduction-only solution from its opening. First-click protection alone does not make a board no-guess.

## Mine density

The number of mines divided by total board squares. Density influences difficulty but does not describe the full logical complexity of a specific board.

## 3BV

Bechtel's Board Benchmark Value, a standard measure related to the minimum number of actions needed to reveal a solved board under defined rules. Endlessweep Efficiency is not 3BV.

## Efficiency

A comparison between useful progress and actions. Endlessweep's local metric counts reveals and chords that open new squares, divided by all recorded player actions.

## Seed

A string used by a deterministic random generator. The same seed, board settings, and first click reproduce the same Endlessweep mine layout.

## Replay

A stored sequence of reveal, flag, unflag, and chord actions. Endlessweep keeps recent replays only in the current browser.
