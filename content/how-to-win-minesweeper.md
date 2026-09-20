---
title: How to Win Minesweeper: A Complete Solving Routine
description: Follow a repeatable Minesweeper solving routine from the first click through flags, overlapping clues, guesses, and the final squares.
slug: how-to-win-minesweeper
heading: How to Win Minesweeper
summary: Use a repeatable solving routine instead of clicking at random.
---
## 1. Start with a protected opening

On Endlessweep, the first revealed square and its neighbors are protected from mines. Open a square with room around it so the first empty area has a chance to reveal useful clues.

## 2. Scan the entire open boundary

The boundary between open and covered squares is where all current information lives. Scan it in one direction so you do not repeatedly inspect the same clue while missing another.

## 3. Make the two basic deductions

If a number already touches its required number of flags, its other covered neighbors are safe. If a number still needs the same number of mines as it has unflagged covered neighbors, all those neighbors are mines.

## 4. Compare overlapping clues

When single numbers do not provide a move, compare their covered-neighbor sets. If one clue includes all the candidates of another plus one extra square, subtract the shared requirement to identify the extra square.

See the [number pattern guide](/minesweeper-patterns/) for 1-2-1, 1-2-2-1, and edge examples.

## 5. Flag only proven mines

A flag should preserve a deduction, not record a suspicion. One incorrect flag can make a chord click dangerous and create false conclusions around several clues.

## 6. Chord to reveal efficiently

When an open number touches the correct number of flags, chord it to reveal every other covered neighbor. Read the [controls guide](/minesweeper-controls/) before using chord for speed.

## 7. Search elsewhere before guessing

If one section stalls, inspect every other open boundary. A move elsewhere may reveal a clue that resolves the uncertain section. Use the [guessing checklist](/minesweeper-guessing/) only after exhausting deterministic moves.

## 8. Recount the final mines

Near the end, use both local clues and the global mine counter. If all remaining mines belong to one constrained group, squares outside that group are safe. If the remaining covered squares equal the remaining mine count, flag them all.

## 9. Review losses, not just wins

After opening a mine, use Mistake Review and Replay. Return to the position before the loss and ask whether another certain move existed. This separates a missed deduction from a genuinely unavoidable guess.
