# Endlessweep Analytics Engine queries

Dataset: `endlessweep_game_events`

Fields:

- `blob1`: event (`game_started`, `game_completed`, `game_abandoned`, `game_restarted`, `challenge_shared`, `shared_visit`, `shared_game_started`, `replay_opened`, `mistake_review_opened`, `practice_started`, `practice_completed`)
- `blob2`: mode (`beginner`, `intermediate`, `expert`, `custom`, `daily`, `zen-*`, `no-guess-*`, `time-attack-*`, `unblocked-*`, `endless`)
- `blob3`: result (`win`, `loss`) or practice pattern
- `blob4`: input type (`touch` or `pointer`)
- `double1`: elapsed seconds
- `double2`: Zen mistakes
- `double3`: current local Daily completion streak on Daily completion events; zero otherwise. Endless cleared counts are not currently sent.

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

## Replay and restart ratio by mode

Counts restart commands after a run started or ended, not unique players or completed repeat games. Mode/difficulty switches can also trigger this command. Use subsequent starts as supporting evidence, not as a user retention rate.

```sql
SELECT blob2 AS mode,
  COUNT_IF(blob1 = 'game_started') AS starts,
  COUNT_IF(blob1 = 'game_restarted') AS restarts,
  ROUND(COUNT_IF(blob1 = 'game_restarted') * 1.0 / NULLIF(COUNT_IF(blob1 = 'game_started'), 0), 3) AS restart_ratio
FROM endlessweep_game_events
WHERE timestamp >= NOW() - INTERVAL '14' DAY
GROUP BY mode
ORDER BY starts DESC
```

## Multi-day Daily Challenge streak distribution

`double3` records consecutive UTC dates with a win in this browser's local storage, across Daily difficulties. This is a completion-streak distribution, NOT D1/D7 retention or a returning-player count: return visits without a win are absent, repeated wins contribute multiple events, and clearing storage or switching devices resets continuity. No stable visitor identity or cohort is collected; do not infer retention from these data.

```sql
SELECT
  double3 AS daily_streak,
  COUNT() AS completions
FROM endlessweep_game_events
WHERE blob1 = 'game_completed'
  AND blob2 = 'daily'
  AND blob3 = 'win'
  AND timestamp >= NOW() - INTERVAL '14' DAY
GROUP BY daily_streak
ORDER BY daily_streak DESC
```

## Share actions, referral landings, and referred starts

`challenge_shared` is sent only after the native share promise resolves or clipboard copying succeeds. It does not prove delivery, reading, or a new recipient. Cancellation and failure are not counted. Native results can vary by platform.

`shared_visit` records a loaded game page with `ref=share` (or legacy `source=share`), using the resolved game mode. `shared_game_started` records the first game start after that landing, even if the player changes mode first. Each is emitted at most once per page load, not once per user or session; refreshes, repeated opens, and self-visits can count again. There is no recipient deduplication, share ID, or linked acquisition cohort. These aggregate event counts are NOT a viral coefficient, unique conversion rate, or attribution proof. Starts can occur in a different mode or reporting interval from landings; do not divide the per-mode counts into a funnel conversion rate.

These definitions apply only after the release containing this change. Historical `challenge_shared` events were attempts, including cancellations, and historical referral events used entry-mode labels. Do not combine them into a like-for-like trend. Set the query start to the verified deployment timestamp in the release record below.

```sql
SELECT blob2 AS mode,
  SUM(IF(blob1 = 'challenge_shared', _sample_interval, 0)) AS successful_share_actions,
  SUM(IF(blob1 = 'shared_visit', _sample_interval, 0)) AS referral_page_loads,
  SUM(IF(blob1 = 'shared_game_started', _sample_interval, 0)) AS referred_first_starts
FROM endlessweep_game_events
WHERE timestamp >= NOW() - INTERVAL '14' DAY
GROUP BY mode
ORDER BY successful_share_actions DESC
```

## Days 1–14 Behavioral Validation Framework (Codex Audit Baseline)

Core focus: Validate "who is willing to play repeatedly" and "are players willing to invite friends" before expanding features.

Explicitly out-of-scope for this cycle: Cloud accounts, username/PIN, rank/ladder system, UGC workshop, in-game items.

| Stage | Focus | Minimum Delivery |
|---|---|---|
| Days 1–3 | Establish behavioral baseline | Track starts, completions, restart commands, local completion-streak distribution, and referred first starts. D1/D7 retention is not measurable yet. |
| Days 4–7 | Polish daily challenge loop | Same UTC date, difficulty, and game version produce the same accepted board from a fixed center opening. Accept only boards passing the logic solver; if 150 attempts fail, block play rather than serve an unverified board. Share links open the current UTC day's challenge, not an archived date. |
| Days 8–10 | Small scale authentic feedback | Observe target players: can they finish without guessing? Do they voluntarily retry or share? |
| Days 11–14 | Evidence-based direction choice | Treat event counts and completion streaks as directional, with sample sizes and qualitative feedback. Validate actual Daily returns with consenting testers before choosing A; confirm Endless repeat play before B; validate solver/training demand before C. No automatic decision from streaks or share counts. |

## Release record

The screenshot's `f2852b8` is the pre-change Git baseline, not proof of a deployment. The committed code, freshly fetched remote branch, Cloudflare deployment version, and production content must be verified separately. Record the final commit and deployment timestamp/version in the delivery message; planned or locally tested changes are not production results.

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
