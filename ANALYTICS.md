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

## Search acquisition plan: 2026-10-16 to 2026-10-30

Baseline read from authenticated GSC and Bing reports on 2026-10-16:

| Report | Current period | Clicks | Impressions | Previous impressions |
| --- | --- | --- | --- | --- |
| GSC Web | 2026-10-07 to 2026-10-13 | 0 | 22 | 9 (2026-09-30 to 2026-10-06) |
| Bing, 7-day selection | Available rows: 2026-10-09 to 2026-10-14 | 0 | 24 | 10 (available comparison rows: 2026-10-02 to 2026-10-07) |

GSC average position was 20.5, previously 23.7. Its index report, updated
2026-10-12, showed 10 indexed URLs, 19 discovered but not indexed, and one
alternate canonical URL. Bing Site Explorer showed seven indexed URLs.
Both sitemap reports were successful and listed 29 discovered URLs; the
repository sitemap currently contains 33 URLs. Report counts may lag newer
pages. These metrics measure search visibility, not site visits or players.

The live HTTP homepage returned 200 without redirecting on 2026-10-16.
Bing attributed 21 of the 24 impressions to that HTTP URL. The source Worker
already contained a 308 redirect, so static assets must run through it using
`assets.run_worker_first`. Local source and remote `main` were both at
`2d8d5ba576b736694732c75ebb311c7e4f6954fa`; the live deployment commit was
not verified. Do not assume local test success fixes production.

### Release and indexing checks

1. Release the tested HTTPS configuration and content changes. Verify HTTP
   homepage, content pages, robots.txt and sitemap.xml return 308 to HTTPS,
   retaining paths and query parameters. HTTPS destinations must remain 200.
2. Inspect the homepage, `/no-guess-minesweeper/`, `/easy-minesweeper/` and
   `/how-to-play-minesweeper/` in both search tools. Record the indexed URL,
   selected canonical, last crawl, and any exclusion reason. A successful
   sitemap fetch is not evidence that those pages are indexed.
3. When a core page is missing and its live checks pass, request indexing
   selectively through the search tools. Do not repeatedly resubmit an
   unchanged sitemap or claim submission guarantees indexing.
4. Keep the mobile, first-click and no-guess explanation pages linked to the
   relevant playable board. Preserve separate intents: the no-guess game
   page is for playing; the explanation page describes verification.

### Week two: discovery and review

- Prepare a small set of relevant game directories or communities for
  review. Lead with verified no-guess play or compact Mini/Easy boards.
  Publish only where promotion is permitted and posting is authorized;
  avoid bulk links, fabricated reviews and claims of guaranteed traffic.
- On 2026-10-23 and 2026-10-30, read each platform's latest complete seven
  days and the preceding matching period. Record actual available dates;
  do not compare an incomplete latest day against a complete one.
- Track core-page indexing, impressions by landing page and relevant query,
  search clicks, and game starts by mode. Search clicks and game starts
  cannot be joined into a conversion rate with the current instrumentation.
- Expand content only after relevant impressions recur or a concrete
  unanswered query appears. With the present sample, zero CTR and isolated
  query rankings are too noisy to justify frequent title changes.
- Keep GSC and Bing Chrome tabs open after checking them.
