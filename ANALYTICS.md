# Endlessweep Analytics Engine queries

Dataset: `endlessweep_game_events`

Fields:

- `blob1`: event
- `blob2`: mode
- `blob3`: result or practice pattern
- `blob4`: input type (`touch` or `pointer`)
- `double1`: elapsed seconds
- `double2`: Zen mistakes

Use a recent interval while traffic is still low. These queries use the last 14 days.

## Starts by mode

```sql
SELECT blob2 AS mode, COUNT() AS starts
FROM endlessweep_game_events
WHERE blob1 = 'game_started'
  AND timestamp >= NOW() - INTERVAL '14' DAY
GROUP BY mode
ORDER BY starts DESC
```

## Outcomes by mode

```sql
SELECT blob2 AS mode,
  COUNT_IF(blob1 = 'game_started') AS starts,
  COUNT_IF(blob1 = 'game_completed') AS completions,
  COUNT_IF(blob1 = 'game_completed' AND blob3 = 'win') AS wins,
  COUNT_IF(blob1 = 'game_abandoned') AS abandonments
FROM endlessweep_game_events
WHERE timestamp >= NOW() - INTERVAL '14' DAY
GROUP BY mode
ORDER BY starts DESC
```

Completion rate is `completions / starts`; win rate is `wins / completions`; abandonment rate is `abandonments / starts`. Treat these as directional because one visitor can start multiple games.

## Feature use and sharing

```sql
SELECT blob1 AS event, COUNT() AS uses
FROM endlessweep_game_events
WHERE blob1 IN ('challenge_shared', 'replay_opened', 'mistake_review_opened', 'practice_started', 'practice_completed')
  AND timestamp >= NOW() - INTERVAL '14' DAY
GROUP BY event
ORDER BY uses DESC
```

## Input type

```sql
SELECT blob4 AS input_type, COUNT() AS starts
FROM endlessweep_game_events
WHERE blob1 = 'game_started'
  AND timestamp >= NOW() - INTERVAL '14' DAY
GROUP BY input_type
ORDER BY starts DESC
```

## Average completion time and Zen mistakes

```sql
SELECT blob2 AS mode,
  AVG(double1) AS average_seconds,
  AVG(double2) AS average_zen_mistakes,
  COUNT() AS completed_games
FROM endlessweep_game_events
WHERE blob1 = 'game_completed'
  AND timestamp >= NOW() - INTERVAL '14' DAY
GROUP BY mode
ORDER BY completed_games DESC
```

Do not compare modes until each has a useful sample. A practical first threshold is at least 30 starts per mode.
