import assert from 'node:assert/strict';
import {page} from './test-helpers.mjs';
const storageKey='endlessweep-stats';
function clock(g,iso){g.ctx.Date=class extends Date{constructor(...args){super(...(args.length?args:[iso]))}static now(){return Date.parse(iso)}}}
function win(g,seconds=12){g.run(`seconds=${seconds};cells.forEach((c,i)=>{if(!c.mine&&!c.open)playerReveal(i)})`);assert.equal(g.run('lastReplay.won'),true)}
const g=page();clock(g,'2026-11-11T12:00:00Z');g.run("dailyGame('beginner')");win(g,25);
assert.equal(g.run('loadStats().daily.streak'),1);
clock(g,'2026-11-12T12:00:00Z');g.run("dailyGame('beginner')");win(g,20);
assert.equal(g.run('loadStats().daily.streak'),2);
// Repeating a date or changing difficulty cannot increment the streak again.
g.run('restartGame()');win(g,30);assert.equal(g.run('loadStats().daily.streak'),2);assert.equal(g.run("loadStats().dailyHistory.find(x=>x.date==='2026-11-12').levels.beginner"),20);
g.run("dailyGame('intermediate')");win(g,45);assert.equal(g.run('loadStats().daily.streak'),2);
const streak=g.run('JSON.stringify(loadStats().daily)'),onTime=g.run('JSON.stringify(loadStats().dailyHistory)');
g.run("dailyGame('beginner','2026-11-11')");const layout=g.run('cells.map(c=>c.mine).join()'),opening=g.run('cells.map(c=>c.open).join()');
g.run('restartGame()');assert.equal(g.run('dailyDate'),'2026-11-11');assert.equal(g.run('cells.map(c=>c.mine).join()'),layout);
g.el('#daily-levels').fire('click',{target:{dataset:{dailyLevel:'expert'}}});assert.equal(g.run('dailyDate'),'2026-11-11');assert.equal(g.run('dailyDifficulty'),'expert');
g.run("dailyGame('beginner','2026-11-11')");win(g,9);
assert.equal(g.run('JSON.stringify(loadStats().daily)'),streak);assert.equal(g.run('JSON.stringify(loadStats().dailyHistory)'),onTime);
assert.equal(g.run("loadStats().dailyArchiveHistory[0].levels.beginner"),9);
assert.equal(g.run('lastReplay.archive'),true);assert.equal(g.run('lastReplay.dailyDate'),'2026-11-11');assert.equal(g.run('lastReplay.level'),'daily-archive-beginner');
g.run('beginReplay();seekReplay(0)');assert.equal(g.run('cells.map(c=>c.open).join()'),opening);g.run('exitReplay()');assert.equal(g.run('dailyDate'),'2026-11-11');
// Dated share links preserve the board after the seven-day calendar window.
let shared='';g.ctx.navigator.clipboard.writeText=async text=>{shared=text};await g.run('shareResult()');assert.match(shared,/Archive play/);assert.match(shared,/date=2026-11-11/);
const link=shared.match(/https:\/\/endlessweep.com\/daily-minesweeper\/\?\S+/)[0],recipient=page();clock(recipient,'2026-12-20T12:00:00Z');recipient.ctx.location.pathname='/daily-minesweeper/';recipient.ctx.location.search=new URL(link).search;recipient.run('loadShared()');assert.equal(recipient.run('dailyDate'),'2026-11-11');assert.equal(recipient.run('cells.map(c=>c.mine).join()'),layout);
// Thirty UTC dates; today plus seven previous dates can be selected; all remain visible.
g.run('updateDailyStatus()');const markup=g.el('#daily-history').innerHTML;assert.equal((markup.match(/data-daily-date=/g)||[]).length,30);assert.equal((markup.match(/ disabled/g)||[]).length,22);
g.el('#daily-history').fire('click',{target:{closest:()=>({disabled:false,dataset:{dailyDate:'2026-11-10'}})}});assert.equal(g.run('dailyDate'),'2026-11-10');
g.el('#daily-today').fire('click');assert.equal(g.run('dailyDate'),'2026-11-12');
// Past wins never fill missed days or reset the current streak; stale streaks display zero.
clock(g,'2026-11-14T12:00:00Z');g.run('updateDailyStatus()');assert.equal(g.run('currentDailyStreak()'),0);g.run("dailyGame('beginner','2026-11-13')");win(g);assert.equal(g.run('JSON.stringify(loadStats().daily)'),streak);g.run("dailyGame('beginner')");win(g);assert.equal(g.run('loadStats().daily.streak'),1);assert.equal(g.run('loadStats().daily.bestStreak'),2);
// Crossing UTC midnight before completion becomes archive play, not yesterday's streak.
const midnight=page();clock(midnight,'2026-11-13T23:59:59Z');midnight.run("dailyGame('beginner')");clock(midnight,'2026-11-14T00:00:01Z');win(midnight);assert.equal(midnight.run('loadStats().daily'),undefined);assert.equal(midnight.run('lastReplay.archive'),true);
for(const date of ['2026-02-30','2026-11-15','invalid','2026-1-01','','2026-11-13T00:00:00Z','1999-12-31']){midnight.run(`dailyGame('beginner',${JSON.stringify(date)})`);assert.equal(midnight.run('dailyDate'),'2026-11-14');assert.match(midnight.el('#message').textContent,/Invalid or future date/)}
midnight.ctx.location.pathname='/daily-minesweeper/';midnight.ctx.location.search='?level=expert';midnight.run('loadShared()');assert.equal(midnight.run('dailyDate'),'2026-11-14');
// Existing results survive migration and history grows beyond seven entries.
const initial={daily:{date:'2026-11-12',streak:4,bestStreak:8},dailyHistory:[{date:'2026-11-12',levels:{beginner:20}}]},legacy=page('index.html',{[storageKey]:JSON.stringify(initial)});clock(legacy,'2026-11-13T12:00:00Z');legacy.run("dailyGame('beginner')");win(legacy);assert.equal(legacy.run('loadStats().daily.streak'),5);assert.equal(legacy.run('loadStats().daily.bestStreak'),8);assert.equal(legacy.run("loadStats().dailyHistory.find(x=>x.date==='2026-11-12').levels.beginner"),20);
for(let day=1;day<=31;day++){legacy.run(`dailyGame('beginner','2026-10-${String(day).padStart(2,'0')}')`);win(legacy)}assert.equal(legacy.run('loadStats().dailyArchiveHistory.length'),30);
const lost=page();clock(lost,'2026-11-13T12:00:00Z');lost.run("dailyGame('beginner','2026-11-12');playerReveal(cells.findIndex(c=>c.mine))");assert.equal(lost.run('lastReplay.won'),false);assert.equal(lost.run('loadStats().dailyArchiveHistory'),undefined);assert.equal(lost.run("loadStats()['daily-archive-beginner'].wins"),0);
const statsPage=page('minesweeper-statistics/index.html',{[storageKey]:g.saved.get(storageKey)});assert.match(statsPage.el('#stats').innerHTML,/Daily Archive Beginner/);
const events=await Promise.all(g.beacons.map(async b=>JSON.parse(await b.text())));assert(events.some(e=>e.mode==='daily-archive'&&e.event==='game_completed'&&e.streak===0));
console.log('Daily calendar, archive isolation, streaks, UTC midnight, dated sharing, replay and legacy records passed');
