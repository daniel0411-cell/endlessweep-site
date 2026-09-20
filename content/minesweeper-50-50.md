---
title: Minesweeper 50/50 Explained: True and False Guesses
description: Learn what a Minesweeper 50/50 is, how to identify false 50/50 positions, and what to do when two choices are truly equal.
slug: minesweeper-50-50
heading: Minesweeper 50/50 Situations
summary: Tell a true forced guess from a position that still has a logical solution.
---
## What is a true 50/50?

A true 50/50 contains two possible mine arrangements that both satisfy every available clue. If one of two covered squares contains the final mine and no visible information distinguishes them, each choice has the same probability.

## A 50/50 is about information, not appearance

Two adjacent covered squares are not automatically a 50/50. Another clue, the global mine count, or a separate unresolved group may eliminate one arrangement. The position is truly ambiguous only after all constraints have been considered.

## How to check for a false 50/50

1. Recount flags around every clue touching the candidates.
2. Compare the full covered-neighbor set of adjacent clues.
3. Check whether either candidate touches an extra clue.
4. Use the remaining mine count across all unopened regions.
5. Solve other boundaries before returning.

## Can a pattern break the tie?

Sometimes. A hidden 1-2-1 relationship or an edge subtraction may prove one square safe. Apply patterns only when every covered neighbor matches the pattern conditions. The digits alone are not enough.

## What should you click in a true 50/50?

If both candidates are exactly equivalent, neither click is logically better. Choose one and judge the decision by the available information, not by whether the random outcome happened to be a mine.

> A loss does not prove the choice was wrong. In a true 50/50, both choices were equally justified before the click.

## Can you avoid creating a 50/50?

Sometimes an earlier opening order preserves more information, especially near walls. However, ordinary random Minesweeper can generate unavoidable ambiguity regardless of play order. No-guess modes must verify that a deduction-only solution exists.

## Review the position

Use Endlessweep Mistake Review to return to the last move. If another safe move existed elsewhere, the guess was premature. For broader probability decisions, read the [Minesweeper guessing guide](/minesweeper-guessing/).
