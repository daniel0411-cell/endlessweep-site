---
title: Minesweeper Mine Density and Probability Explained
description: Understand Minesweeper mine density, compare standard board levels, estimate local risk, and avoid misleading probability shortcuts.
slug: minesweeper-mine-density
heading: Minesweeper Mine Density and Probability
summary: Understand how mine concentration affects a board without replacing clue-based logic.
---
## What is mine density?

Mine density is the number of mines divided by the total number of squares. It describes how concentrated the mines are across the full board.

For example, a 9 by 9 board has 81 squares. With 10 mines, its overall density is about 12.3 percent. Density is a board-level average, not the probability of every individual covered square after clues are revealed.

## Standard board comparisons

- Beginner: 10 mines across 81 squares, about 12.3 percent.
- Intermediate: 40 mines across 256 squares, about 15.6 percent.
- Expert: 99 mines across 480 squares, about 20.6 percent.

These figures explain part of the difficulty increase, but larger boards also create more boundaries, longer solving sequences, and more opportunities for overlapping constraints.

## Local probability beats global density

Once numbers are visible, nearby clues provide stronger information than the board-wide average. If a clue proves one mine among two candidates, each candidate may carry 50 percent risk under that local constraint even when the overall board density is much lower.

## Covered squares are not independent

Two clues may share candidates, so you cannot safely multiply simple percentages as if each square were unrelated. A correct probability analysis counts mine arrangements that satisfy every overlapping clue and the remaining global mine count.

## Certain moves come first

Probability matters only after deterministic deductions are exhausted. A square proven safe has zero risk regardless of global density; a proven mine has 100 percent risk. Use the [guessing checklist](/minesweeper-guessing/) before estimating uncertain choices.

## Density on custom boards

Increasing mine count on the same dimensions raises density and usually produces tighter openings. Very high density does not guarantee an interesting logic puzzle; it may create more forced guesses or small isolated regions.

## Why two boards with equal density feel different

Mine placement, opening size, board shape, and clue overlap all affect the solving path. Density is useful for comparing broad settings, but it does not measure the exact logical difficulty of a generated board.
