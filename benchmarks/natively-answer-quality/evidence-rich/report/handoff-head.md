# Handoff: Natively answer-quality work on the evidence-rich benchmark

Written 2026-10-09 (updated at 13:30 UTC after a second session, at 20:20 UTC after a third, and at 00:26 UTC on 10 October after Evin's "yes do all 4") for whoever continues this work, human or agent. It covers 2026-10-03 to 2026-10-10.

This one file holds everything: the current state, what Evin asked and decided, how the benchmark works, every iteration with its rule and verdict (kept and rejected), the scores per mode per round, every code and prompt change with its reason and its full diff, the complete experiment log, the investigation documents, and all 630 development questions with the answers that still exist.

Two things are left out on purpose:

- **The blind holdout's questions and answers.** Only its aggregates are printed, so the holdout stays blind for whoever optimises next.
- **API keys.** They are read in-process from `/Users/evin/natively-cluely-ai-assistant/.env` and never printed.

The earlier answer-quality loop (the frozen 9-mode benchmark, before 2026-10-03) has its own handoff: `benchmarks/natively-answer-quality/docs/HANDOFF-ASTRA.md`. The two benchmarks are never compared number for number.

This file is generated: `node evidence-rich/report/build-handoff.mjs` (from `benchmarks/natively-answer-quality/`) rebuilds it from `report/handoff-head.md`, git, the app source, the replay variants, the log and the runs. Edit the head or the log, then rebuild.

## Contents

| # | Section | What it answers |
|---|---|---|
| 1 | State in one screen | Where everything stands today |
| 2 | What Evin asked and decided | Every request and decision, in order, and what was done |
| 3 | The benchmark | What is measured, how it is scored, how a verdict is reached |
| 4 | How to resume | Commands and procedures |
| 5 | Traps that cost time | What went wrong before, so it does not again |
| 6 | Every iteration | What each tried, how it was measured, kept or rejected |
| 7 | Scores per mode, per round | The numbers |
| 8 | What changed in the code, and why | Each kept change: the problem seen, the fix, the evidence |
| 9 | What changed in the prompts | Every wording change, kept and rejected |
| 10 | Where the data is | Files and folders |
| 11 | Open decisions and next steps | What is Evin's to decide; what to try next |
| 12 | Commits on main | Hash, date, files |
| 13 | The fix-up pass | Its instructions on main and the full text of every variant tried |
| 14 | Blind holdout: aggregates only | Per question type and per flag |
| A | Appendix A: every landed change in full | Commit message and complete diff |
| B | Appendix B: the complete experiment log | Every rule as written, every data table, every verdict |
| C | Appendix C: the investigation documents | Context limits, truncation tests, ingestion limits, the first quality report |
| D | Appendix D: every development question | 630 questions with main's answers, drafts, E19 and E16b answers, scores |
| E | Appendix E: the supplementary questions | 109 counterfactual and isolation questions (their answers were lost on 2026-10-06) |

---

## 1. State in one screen

**Read this first: the optimisation was stopped on 13 October 2026, 21:45 UTC** (later than every block under it; where they differ, this one holds).

Evin, 13 October about 21:00 UTC: "we are stopping this optimizationsince we are out of budget , do all things you can do to make the last inal push of imporvements to all the modes". Asked, he chose: land on main and push; the fix-up pass off in Technical Interview only; the AgentRouter rung included.

| Thing | State at 21:45 UTC on 13 October |
|---|---|
| App `main` | **Local and GitHub `cb0fadac`** = `293db92b` + three commits of this work, fast-forwarded and pushed at 21:43 UTC. |
| `070f29c7` | E38, the profile read (a typed general-knowledge question in the two profile modes reads the résumé and posting when they fit). Target rows judged 5.5 → 10.0 and 4.2 → 9.8; its lines Q1 / Q2 failed on one draw-level hard fail (E38r: 9.85 against 9.81, none). Landed at his word. |
| `7307c836` | E42, the AgentRouter rung, last in the structured-extraction ladder. 23 of 25 profiles read by the model; its line X1 failed (two timeouts past 45 s on a slow gateway, which fall back to the parser as on main). Landed at his word. |
| `cb0fadac` | The fix-up pass is off in Technical Interview (judged 9.11 with it and without) and stays on in Looking for work (9.31 with it, 9.17 and four more hard fails without). `NATIVELY_CLAIM_VERIFIER_INTERVIEW=1` restores it. |
| Checks | Type check and build clean; `electron/llm` 6,187 of 6,216 pass, the 1 failure is the same on unchanged `293db92b`; intelligence, context-intelligence and services: the same 121 failures as unchanged `293db92b`, the 13 added tests pass. macOS only. No app run of the three together, nothing on Windows, no packaged build. |
| Last judged scores (main `cdaedfad`, 13 October) | Technical Interview 9.11, Looking for work 9.31, General 9.16. **Today's main is not judged.** The 9.5 target is not met; with a résumé loaded both interview modes were at 9.5. |
| Not landed | The layout `cand/e28b` (no judged gain; 211 judgments never made), the stack `cand/e41`, anything for own-history questions with no résumé loaded (closed for this generator, a product decision), E31a for Sales (never judged). |
| Another session's uncommitted work | Its both-modes pass switch in the main checkout was replaced by the landed Technical-Interview-only version; the original is a patch in `~/natively-er-backup/final-1014/`. Its "make things up" filter edit (`userInstructionContract.ts` and test) is untouched and still uncommitted. |
| Keys | Third AgentRouter key about USD 57 left; the first two empty. Nothing is running or scheduled. |
| Worktrees | `er-e21` on `cand/final-1014-pass` (`cb0fadac`, built); `er-main` detached at `293db92b` (built). Local branches `cand/final-1014`, `cand/final-1014-pass` are records; no candidate branch was pushed. |

**If this work is picked up again:** start from a fresh judged run of main `cb0fadac` on the three priority modes (210 judgments; about USD 20 on the first key's account, about USD 78 on the others), since no score exists for it. The largest stable loss is still a question about the user's own history with no résumé loaded, and it is a product decision, not a prompt.

**The state on 13 October 2026, 03:00 UTC** (superseded by the block above where they differ).

Evin, 12 October about 14:45 UTC: "continue with remaning with the agent router remianing credits at 7:30 ist". The judge window opened at 02:00:40 UTC on 13 October; calibration 38 of 38; no 402 and no 403 all day.

| Thing | State at 03:00 UTC on 13 October |
|---|---|
| The three priority modes on current main (`cdaedfad`, runs of 12 October, 70 rows a mode, all judged) | **Technical Interview 9.11** (8 hard fails), **Looking for work 9.31** (2), **General 9.16** (6). Before the hard-fail caps: 9.32, 9.34, 9.36. On 9 October: 8.83, 9.04, 8.98. |
| By the profile loaded (the two interview modes) | Résumé and posting: Technical Interview **9.53**, Looking for work **9.50**. Résumé only: 9.48, 9.47. Posting only: 8.53, 8.59. Nothing loaded: 7.71, 8.93. With a résumé loaded both are at the 9.5 target; the shortfall is the turns without one. |
| The fix-up pass, judged on and off (K3, E37) | Edited rows of the interview modes, 28 pairs: evidence missing 5.58 as drafted → 7.49 as shown, hard fails 7 → 3; evidence present 9.48 → 9.08. Mode means on / off: Technical Interview 9.11 / 9.11; Looking for work 9.31 / 9.17 (hard 2 / 6); General 9.16 / 9.17. **Off costs nothing judged in Technical Interview; in Looking for work it costs 0.14 and four hard fails.** |
| The stacked build E41 (layout + profile read), K1 and K2 | 140 pairs: main 9.21 → E41 9.12 (−0.09, 95 % −0.32 to +0.15), hard fails 10 → 13. **K1 no-harm fails on hard fails; not a gain; not proposed.** K2 holds. The layout has no judged gain on record. |
| The profile read E38, Q1 and Q2 | 4 pairs: main 7.28 → 8.46, hard fails 0 → 1: **both lines fail as declared** on one row. Its two target rows moved 5.5 → 10.0 and 4.2 → 9.8. Follow-up E38r (16 judged draws a side of the two general-knowledge rows): 9.85 against 9.81, hard fails 0 against 0, so the hard fail was the draw. E38 stays a candidate; landing is Evin's word. |
| The hard fails that do not move between draws | 8 recur in both builds: 5 are a question about the candidate's own history with no résumé loaded; 3 are wrong technical content (a time-zone conversion, tie order in code, a lock analysis). |
| E44, a measurement on those own-history rows (8 readable rows, 3 arms, 38 judged) | Recorded prompt 4.65 and 4.47, 16 of 16 hard fails. Posting withheld 5.45. Posting withheld and an opening with blanks asked for 5.17 and 5.47 (13 of 16 hard fails); where the generator does write the opening it scores 8.4 to 9.0. **Not reachable by prompt or by withholding the posting; closed for this generator.** What the app shows when no résumé is loaded is a product decision. |
| What a judgment costs | **About 9 to 10 cents on `AGENTROUTER_API_KEY`, about 37 cents on `AGENTROUTER_API_KEY_1` and `AGENTROUTER_API_KEY_2`**: same model, same token counts, four times the charge. I let the judge run on to the third key before checking its rate; the list's tail was cut at 02:33 UTC when the reading showed it. |
| Not judged, waiting | The layout's own development rows (J1 to J3) and its unseen rows (J4): 211 judgments, about USD 78 at the third key's rate, about USD 19 at the first key's. |
| Spend on 13 October | Judge USD 130.1 (first key 25.02 and second key 24.52, both now empty; third key 80.5). Generation USD 6.19 (98 replayed answers). **Third key: about USD 57 left** (counter 31,739.71; Evin's 174 at 20,013.40). |
| `AGENTROUTER_API_KEY_3` | Still 35 characters, not the AgentRouter shape. Not sent anywhere on 13 October; not in the key lists. |
| Running | Nothing. The window script was stopped at 02:33:10 UTC. No app, no replay, no watcher. |
| Not changed | Nothing landed on main, no candidate branch pushed, PR 638 not merged, no unread set printed. Only `bench/evidence-rich` is pushed. |

**Evin's decisions after 13 October:** (1) land the profile read (E38, `eba3e7a3`) alone, or leave it; the stack and the layout are not proposed. (2) The pass: keep it on in Looking for work; switching it off in Technical Interview costs nothing judged and saves the second request (his other session's uncommitted change switches it off in both). (3) What the app does on a question about the user's own history when no résumé is loaded: an opening the app writes itself, a "load your résumé" note, or as it is. (4) Credits: money on the first key's account goes four times further than on the other two; the layout's 211 waiting judgments and any further iteration need it. (5) E42 and the fourth key, as on 12 October.

**The state on 12 October 2026, 14:10 UTC** (superseded by the block above where they differ).

Evin, 12 October 13:20 UTC: "i have added one api key agenr router 2 , use that it has 174 usd creditts , key and 1 has 25 usd on each , , onllly use agent router for running iteration , strictly dont use deepseek api key".

| Thing | State at 14:10 UTC on 12 October |
|---|---|
| Route | **AgentRouter only.** `generator-route.mjs` has no direct route any more, the replay tools and `run-er.mjs` do not read the DeepSeek key, and `run-er.mjs` puts `AGENTROUTER_API_KEY_2` in the app's profile and refuses any other routing. Every run up to `er17` was on the direct key and says so in its header; `er18` onwards is AgentRouter. Nothing of one route is compared as a line with the other. |
| Judge | Probed once by hand at 13:22 UTC: HTTP 402 "Budget pool quota has been exhausted" on all three keys (the balance reply of the morning is gone). Judge calls stopped. **`window-oct12.mjs` is running detached and waits for 02:00:30 UTC on 13 October** (7:30 am IST). Status: `~/natively-er-backup/window-run-oct12-am/window-oct10.json`. |
| The list it will judge, in order | E38's touched rows (8) → main on the three priority modes (210) → E37's drafts (30) and General's edited drafts (6) → the stacked build E41 on the two profile modes, both development sets (140) and its edited drafts (27) → the layout's development rows, General first (90) → the layout's and main's readable unseen rows (126). 675 with the calibration; a window has held about 600. |
| Judged lines declared for it | K1 to K3 (E41 against main; the pass on and off), beside Q1/Q2 (E38), J1 to J4 (layout). Readers: `report/e37-e38-judged.mjs`, `report/pass-judged.mjs`, `report/where-points-go.mjs`, `report/pair-aggregate.mjs`. |
| What a call costs on AgentRouter | About USD 16 per million uncached prompt tokens and USD 9 per million cached, on both of its routes: **about 19 cents for one priority-mode answer, about 45 cents for one app row** (answer, fix-up pass, its share of the profile upload). The 174 USD is about 850 answers. Read it from the key's own counter: `GET /v1/dashboard/billing/usage` (cents). USD 30.53 spent on 12 October; about 143 left. |
| The gateway's speed | First word about 1.2 s at 13:25 UTC and about 3.5 s (a tenth over 9.8 s, one 20.5 s) at 14:00 UTC, in the app and in a replay of the same requests alike; the direct key gave 0.76 s. The app's 10 s answer limit and 45 s extraction limit are hit now and then. A first-word line cannot be read from an AgentRouter run unless both arms alternate inside the hour. |
| E42, `cand/e42` `1a82241e` | An AgentRouter rung last in the structured-extraction ladder, so an AgentRouter-only user's résumé is read by the model. The gap is real (main: 6 of 6 profile rows read by the rule-based parser). The candidate: 23 of 25 by the model; **its line X1 (every row) fails** because one extraction passed the caller's 45 s limit twice. Not proposed as it stands; whether to land it anyway or lengthen that limit is Evin's. |
| All three candidates on current main | `cand/e43` `484e256e` (local) = `bac5d70c` + layout + profile read + AgentRouter rung, no conflict. Type check clean; `electron/llm` 5,998 of 6,017 pass, 1 fails, 18 skipped; intelligence suites 2,952 of 2,963 pass, 0 fail. The one failure (`QuickActionTurnRequest2026_10_09`) fails the same way on unchanged `bac5d70c`. No benchmark run on it. |
| Where the points go (9 October judgments) | All three priority modes are at 9.25 before the hard-fail caps. 9.5 needs about 25 of the 43 weak rows of 210 to become good answers. In Looking for work the weak rows are the ones the fix-up pass edited (edited 29 rows: 8.47; unedited 41: 9.45; 10 of 14 weak rows edited). Their drafts were never judged: E37 decides. |
| Four arms, judge-free, 226 profile-mode questions | main shown 200 right → main with the pass off 203 → E41 shown 204 → E41 with the pass off 207; forbidden-string rows 4, 5, 4, 6. |
| Running | Only the waiting window script. No app, no replay. |

**The state on 12 October 2026, 04:13 UTC** (the table below it was last brought up to date on 11 October; where the two differ, this block is the later one).

Evin's instruction of 11 October, evening: the priority is Technical Interview, Looking for work (with profile intelligence) and General; the other modes come next; the target is 9.5 in every mode; iterate overnight on autopilot.

| Thing | State on 12 October |
|---|---|
| Judge | **No judgment was made on 12 October.** The window opened at 02:00:30 UTC; the probe was clean and cleared the access-block flag of 11 October; the calibration then got "account quota exhausted" on all 38 pairs. The AgentRouter account is the judge's, and about 3,900 generator replays sent through it on 11 October (21:32 to 22:00 UTC, on Evin's instruction to use AgentRouter for generation) spent its balance. Generation went back to the direct DeepSeek key at 22:05 UTC (`generator-route.mjs`, default `direct`; `ER_GENERATOR=agentrouter` by request). |
| What waits for the judge, in order | `window-run-oct12-am/window-sales.txt`: E38's touched rows (8) → main on the three priority modes, runs dated 12 October (`er11-dev-main` three modes, `er13-dev2-main` two modes; 170) → E37's drafts (30) → the layout's priority-mode rows on dev (90) → the layout's and main's readable unseen rows of the priority modes (126) → the older lists (E31a's Sales pairs, E26, holdout). Readers: `report/e37-e38-judged.mjs e38\|e37`, `report/window-read.mjs`. |
| Layout, `cand/e28b` `7067ab3c` (E30) | **Its registered line 4 failed** (unseen forbidden-string rows 10 → 14 against main's runs of 7 and 8 October), so by its rule it is not proposed and Evin's conditional word to land it does not apply. Every request carries the day's date, so runs of different days are different requests. **Against main of the same date the line holds** (E30b: unseen 173 → 189 right of 219, forbidden 12 → 14) **and a second run within the hour reproduced it** (E30c: 99 → 107 of 133 on the seven modes without a profile; the first run had 108). On dev the two builds are level (243 and 243 of 270). The purpose holds: cached share of prompt tokens, median 94.1 % against 34.7 %. Judged lines J1 to J3 (dev) and J4 (unseen, priority modes) are owed. Not landed. |
| Profile read, `cand/e38` `daef3be5` (E38) | In the two profile modes a typed question the classifier answers from general knowledge read nothing when only the résumé or posting was loaded. Fix in `orchestrator.ts` (one condition), 13 tests. Judge-free lines P1 to P5 hold: 4 of 226 questions change path, right 2 → 4 on them, first word not later. Judged lines Q1, Q2 owed. Landing is Evin's word. |
| Both in one build, `cand/e41` `3a86e45c` (E41) | Local, worktree `er-e21`. 2,909 tests, 2,907 pass, 0 fail; type check clean. **Lines S1 to S4 hold** on the two profile modes (`er16-*-e41` against `er13-*-main`, 226 rows): right 200 → 204, forbidden-string rows 4 → 4, the 4 rows E38 touches 2 → 4. First word in the same hour (`er17-dev-main` then `er17-dev-e41`): spoken 902 → 842 ms, typed 906 → 784 ms. Not judged. |
| The layout on all 630 development questions, same date | 573 → 573 right, forbidden-string rows 8 → 6 (main: `er11-dev-main`, `er13-dev2-main`, `er14-dev2-main`). General 68 → 69, Looking for work 64 → 62, Technical Interview 61 → 64 of 70. |
| The fix-up pass in the two profile modes (judge-free, 858 rows of 12 October) | With no résumé loaded its edits lose no right answer and halve the forbidden strings (53 edits: right 45 → 47, forbidden 4 → 2). With a résumé loaded they cost right answers (128 edits: 104 → 90; 10 deferrals on questions the documents answer), nearly all in Looking for work. One traced case: `ER-D-LFW-012`, where the pass lists the user's own notes as unsupported (4 of 6 replays on main's request). Same trade E4 measured on 3 October; no gate is proposed; E37's judged pairs settle it. |
| Closed on 11 and 12 October, no judge call spent | E34 (generator: no negative self-claim), E32 on the priority modes (pass: a denial is a claim), E36 (pass: a posting is not the candidate's past): each failed a judge-free line. E39 (the larger model `deepseek-v4-pro`, reasoning off): not better by the fixed checks, first word 0.4 s later. E40 (temperature 0): no gain. |
| What the remaining errors are | On the same request one flash sample is right and the next is wrong on about 7 % of the priority-mode requests, and both are wrong on about 6 % (read row by row, at least 5 of the 17 readable ones are the fixed checks' own misses, not wrong answers). The judged hard fails of the three modes share no cause that a wording, a retrieval rule, a larger model without reasoning or a colder draw removed. |
| Sales | E31a holds its four judge-free lines and waits for the judge; E32 and E33 declared for Sales; all behind the priority modes. |
| App `main` | **Local and GitHub `bac5d70c`**: three commits by other sessions on top of `cdaedfad` (shortcuts; a privacy note; quick actions, which touches `electron/llm/quickActionTurn.ts`, `userInstructionContract.ts` and 13 lines of `orchestrator.ts`: a `keepConversationState` flag for Brainstorm, not the retrieval plan; `cand/e41` merges onto `bac5d70c` without conflict, checked with `git merge-tree`, not built or tested there). This work landed and pushed nothing on main on 11 or 12 October. Every benchmark run called "main" on those days is `cdaedfad`, and `cand/e28b`, `cand/e38` and `cand/e41` are based on it: a candidate is rebased on current main and its suites rerun before any landing. |
| Direct DeepSeek balance | USD 43.83 at 01:19 UTC on 12 October. |


| Thing | State |
|---|---|
| App `main` | **Local and GitHub both `cdaedfad`** (the 24,000 threshold, landed 2026-10-10 19:50 UTC on Evin's "1) yes", pushed 21:22 UTC on his "do both"; any later commit on main needs his word again before it is pushed). `cdaedfad` = `cand/e27` rebased: a reference pack is read whole up to 24,000 tokens, the claim pass's material cap is 136,000 characters. Below it: two commits of another session (`95490839`, `ea316087`), then `67fb1b24` = E26 (a DeepSeek key can do structured extraction). The main checkout carries other sessions' uncommitted edits; land a commit there without touching them (compare-and-swap `update-ref`, check out the clean files, `reset` + `apply` for an edited one; log entry of 2026-10-10 19:58 UTC). |
| Last change landed | **E26** (`67fb1b24`, local main, 2026-10-09 22:45 UTC) and **E23** (`4675ff0e`, 21:23 UTC), both on Evin's "yes do all 4". Before them E19 (`73b18d97`). |
| Benchmark | Branch `bench/evidence-rich`, draft PR #638, worktree `.claude/worktrees/aq-fix`. Folder `benchmarks/natively-answer-quality/evidence-rich/`. |
| Benchmark branch on GitHub | **Pushed** on Evin's yes: `df815379..7b8050fb` at 21:26 UTC on 9 October, and the later commits of the session after that. Draft PR #638 stays a draft and unmerged. |
| Backup of run data | `~/natively-er-backup/` (run folders, judgments, calibrations, scripts, this file, the log). |
| Judge | gpt-6-astra only (through AgentRouter). Evin, 2026-10-05: do not judge with Claude Code (quota). |
| Score of main before E19, development set, Astra | 630 questions: **8.92**, 71 hard fails (11.3 %), 414 at 9.5 or above (main `f4cd986d`). |
| Score of main before E19, blind holdout, Astra | 180 questions: **8.84**, 23 hard fails (run `er-holdout-e16b3`). |
| E19 on top of that | Development, the 88 rows it changes: 8.29 → 8.68, hard fails 12 → 7. Blind holdout, 52 pooled pairs: 8.158 → 8.384, hard fails 9 → 8. |
| Main with E19, full run | **Judged on all 630 rows (Astra windows of 2026-10-10, 02:05–02:51 and 11:03–11:56 UTC): 8.873 ±0.15, 78 hard fails (12.4 %), 412 at 9.5 or above. This is the baseline any next production change is read against.** Paired with the earlier main (`er4`: 8.935, 70 hard) on the 630 questions: −0.062 (95 % −0.22 to +0.09), 122 better, 121 worse; no mode or condition line excludes zero, and the two runs share only 33 hard-fail rows (37 only before, 45 only now), so the hard-fail count of one run is mostly turnover. Table in 7.7. |
| Deterministic checks | Version **obj-3** (2026-10-09). obj-2: a string the mode's own loaded files state is not a profile leak (one development row was capped at 2 wrongly). obj-3: a needle that starts or ends with a digit matches only as a whole number. Under them the baseline of `f4cd986d` is **8.935, 70 hard fails** (8.923 / 71 as stored); no holdout score changes. |
| Unseen question sets | `challenge` (117, readable), `challenge-val` (54, never read, aggregates only), `code1` (36 coding items with executed tests), authored blind and frozen 2026-10-09. Main on them, judge-free: 94 / 117, 45 / 54, 34 / 36. Added in the third session: `prov1` (24, readable) and `prov1-val` (24, never read) on which employer, title or date a résumé fact belongs to; main 23 / 24 and 21 / 24. And `pack24`, a separate corpus of four packs of about 20,700 tokens (313 re-issued items, 48 new), for X2. |
| Where it started, blind holdout, Astra | 7.73, 42 hard fails (run `er-holdout-base`, the build before this work). |
| Targets set at the start | 9.2 mean, under 1 % hard fails. **Not met.** |
| Running or scheduled | **State at 02:42 UTC on 11 October: the judge window is CLOSED by a provider access block (HTTP 403, content-policy body) at 02:28:39 UTC; the flag `/tmp/er-access-block-20261008-1630.json` is in place; no window is running or scheduled (a new one needs Evin's word and starts with one probe by hand). Only the balance poller runs** (`chain-e30-wait.sh`, restarted 01:45 UTC, asks until about 15:45 UTC). Evin wants nothing of this work running between work windows (2026-10-10: laptop heat), so stop idle waiters when a session ends and schedule a start. What the two scripts are (both survive a session restart; `~/natively-er-backup/restart-0715.sh` starts both): (1) `~/natively-er-backup/window-run-oct11-am/window-oct11.mjs`: waits until 02:00:30 UTC on 11 October, then probes, calibrates and judges only what is missing: E30 runs listed in `window-extra-plans*.txt` (re-read before every stage) → E29 repetition 1 (57) → derived pack24 rows of main against the 24,000 build (92 + 120) → E26 (96, then 216) → the other X2 arms (336) → 140 holdout rows → drafts. Status `window-oct10.json` beside it; watch with `watch.mjs` there. (2) `~/natively-er-backup/chains/chain-e30-wait.sh`: **the DeepSeek account ran out of balance on 2026-10-10 at 19:59 UTC** ("402 Insufficient Balance", `is_available: false`), so no app run and no generator replay can be made; the script asks the balance endpoint every 5 minutes for 14 hours and, when it returns, runs E30's app sets (candidate `cand/e28b` `7067ab3c` in `er-main`, main `cdaedfad` in `er-e21`), reads the judge-free lines (`e30-gate.txt`), and lists the candidate's runs for judging only if none fails. Log: `chain-e30-wait.out`. Neither script commits or pushes. Read E30 with `report/e30-read.mjs` and `report/window-read.mjs pair base:er6-dev-main base:er11-dev-e28b --by mode,condition` against the rule in the log ("E30"). |
| Declared experiments | None open. After "yes do all 4": **E23 landed** (correctness fix). **E26 landed** (DeepSeek rung, last, in the structured ladder; every profile row extracted by the model, wrong title-employer pairings in the prompts 259 → 0, right 88.9 → 90.3 % on 226 profile questions; a profile upload takes 73 s on DeepSeek). **E27**, the 24,000 threshold with the pass's cap at 136,000: confirmation run 86.1 % right against main's 54.3 % on the 20,700-token packs, all five lines hold, **NOT landed** (`cand/e27`, his word needed). **Arm C**: main with cloud embeddings (Voyage) 63.4 %. **E28 / E28b** (documents before the question, for the provider's cache): the plain move costs 2.8 points; with the question repeated last it holds its lines on 1,210 replayed prompts (+2.4 points on development prompts, 65 to 89 % less uncached input); not built. Earlier the same day: E24 and E25 failed, X2 measured, E21 not proposed, E22 confirmed main's calculation notice. |
| Candidate branches | **`cand/e27` `0256eed4`** (worktree `er-main`): the 24,000 threshold, one commit on main `67fb1b24`, ready to fast-forward on Evin's word. Merged into main: `cand/e23`, `cand/e26`. Records only: `cand/e21` `298b2b5b`, `exp/x1-whole-pack-threshold` `237bba1a`. |

What is not verified: nothing in this work was executed on Windows, and no packaged build was made. Every change is shared TypeScript with no platform branch, run on macOS in the dev build through the benchmark.

The last three days, in order:

- **2026-10-07.** Baseline of main under Astra (630 rows). E19 written, replayed, judged and confirmed in the app. Its blind-holdout replay was run but the Astra pool closed before it could be judged.
- **2026-10-08.** Window of 02:07 UTC: calibration 38/38; 20 of 25 holdout pairs judged; five calls returned HTTP 403 (the provider's temporary content-policy block). Nothing was retried and no key or route was changed to get round it. The partial reading (8.335 → 8.276) was recorded as incomplete, not as a verdict.
- **2026-10-09, 02:02 UTC window.** Calibration 38/38, no block, no failed call. E19's blind-holdout check finished and both rules hold (section 7.6). Three ideas were tried without the judge and dropped; E20 failed its own rule before any judge call. Later that day E19 landed and was pushed.

- **2026-10-09, second session (10:00–13:30 UTC).** Started from this file on Evin's brief for a final optimisation round. Fresh run of main with E19 (630 answers). Astra opened at 11:02 UTC, calibration 38/38, then an HTTP 403 access block two minutes into judging: no score. The rest was judge-free: two defects of the deterministic checks fixed and versioned; a failure-cause map of the last judged baseline; E21 measured in four stages and not proposed; E22; the 12,000 / 24,000 / 48,000 threshold experiment (X1); three new question sets written blind.

- **2026-10-09, third session (18:05–20:20 UTC).** Evin's instructions: finish the 587 judgments when access legitimately returns, establish the baseline before any proposal, investigate a narrow source-aware provenance mechanism validated on unseen questions before any Astra call, evaluate realistic 24k packs; no E21, no broader calculation notice, no rewrite of the conflict instructions; everything off main. No Astra call was made (the window is at about 02:00 UTC). Found in the recorded prompts: the app's own derived résumé sections state wrong employers and dates (the benchmark runs the rule-based profile parser, because a DeepSeek-only user has no model for structured extraction), and three hard fails repeat them. E23 removes such statements; it holds on development rows and on rows it is not about, and its gain on 22 unseen rows is +6.8 points with an interval through 0, so it is not proposed. E24 and E25 failed. X2: four realistic packs of about 20,700 tokens; main answers 54.3 % of 361 questions right and delivers 48 % of the needed facts, the same build reading the pack whole 87.0 % and all of them, with a faster spoken first word and a slower typed one.

- **2026-10-09 21:05 UTC to 2026-10-10 00:26 UTC, after "yes do all 4 one by one".** (1) E23 rebased, four suites against main's baseline, fast-forwarded. (2) E26 written, measured in the app on 226 profile questions, all lines hold, fast-forwarded; main had moved under it twice by another session's commits, none in the answer path. (3) The 24,000 threshold built as `cand/e27` with the pass's cap raised, confirmed on the larger packs, and main measured with a cloud embedding provider (arm C); not landed. (4) The benchmark branch pushed. A correction on the way: X2's "the pass is out of budget on a quarter of its turns" was a wrong proxy; by the app's own log it was once in 270. Then, on Evin's "maximise the window": one prioritized judging script scheduled for 07:30 IST, and the layout replays E28 / E28b.

Evin's standing instructions that bind the next session:

- Astra is the only judge. When Astra is closed, do judge-free work and wait. No substitute judge.
- No reasoning on the answer model: "the point of natively is to answer fast".
- The awaited rerank on spoken turns stays as on main.
- Nothing lands on `main` without his word. He has given it for everything now on main.
- Nothing is pushed without his word. The benchmark branch push is still waiting for it.
- Rules are written and committed before measuring. A candidate that fails its rule is not kept, whatever else it shows.
- The frozen synthetic evidence corpus stays frozen. All benchmark content is synthetic.
- The blind holdout is read in aggregates only.
- One app at a time. No generator replay on the DeepSeek key while an app run is in progress. No large downloads.
- A provider's access block (HTTP 403) is not worked around: no key, route or content change to evade it, no repeated resubmission.

---

## 2. What Evin asked and decided

In order, dates in UTC. Quotes are his words, as typed. Plain "continue" messages, automated notices, scheduled prompts and subagent reports are not listed; the last three are not approvals.

| When | What Evin said | What was done |
|---|---|---|
| 2026-10-04 | "conintu eon cc opus 5.5 for now , after astra comeback rereview things" | Claude Opus 5.5 (through the Claude Code CLI) judged while Astra was closed, marked provisional. Astra re-reviewed the same runs when it returned. |
| 2026-10-04 | "werent you fixing something like this earlier after the e1 run , what was it" | Recalled the context-limit findings: six places where text was cut or altered before it reached the model (Appendix C, `CONTEXT-LIMITS.md`). |
| 2026-10-04 | "what are the best recommended options to fix each , im a layman , give me the options to choose for each" | Options written in plain words for each of the six. |
| 2026-10-04 | His picks: "Let it read everything." / "Don't touch typed text." / "Say it + raise the limit" / "Smarter stop + 48k." / "Fix search + keep more speech." / "Fix the scoring (Recommended), Fit what's picked (Recommended), Smart search for typed too." / "Test 24k and 48k first." | #1 the spoken repair reads the whole prompt (E10). #2 typed text reaches the model verbatim. #3 answers get 48,000 characters, a loop stop and a "cut off" notice. #4 older speech is recalled and the live window keeps more (E12). #5 scoring fixed, the retriever picks what the packer fits, typed questions use the embedding search (E11). #6 the 24k/48k whole-file threshold test has **not been started**. |
| 2026-10-04 | "do them one by one , along side ,gpt astra 6 should be back , along with the above work paralleing start judgjing the earlier runs" | Done one at a time, each with its own rule; Astra re-judged the earlier runs. |
| 2026-10-04 (about) | "since the claude code and astra are simmilar in judging continue with claude code as judge … you are on autopilot , optimise the answer engine , refernce files , retrival , embedding , etc to perfection" | A Claude Code judge series was run on 2026-10-04/05 (marked CC everywhere, never pooled with Astra). Superseded the next day. |
| 2026-10-04 (about) | "you can increase the questions per mode instead of 30 if needed , no cap" | A second development set was authored: `dev2`, 40 questions per mode, 360 in all. |
| 2026-10-04, 10-05 | "commit and push local main"; picked "Main + today's 8 fixes (Recommended)"; "commit and push the work till last round thats taken"; on 10-05 "commit and push to local and remote main" | The kept fixes landed on main and were pushed, each time after the round in progress had finished ("let this round completes"). |
| 2026-10-05 | "if astra is avaiable continue , dont use claude code as judge since we are low on quota" | Astra-only since. Judge-free work when Astra is closed. |
| 2026-10-05 | "can i close this session ? also cehck if its worktree and branch is safe to delete …" | Worktrees and branches checked for other sessions' work before anything was removed. |
| 2026-10-05 | "judge with astra as much as possible , how many iterations as you want as long as astra is avaiable"; "it will be back at 4:30 pm ist"; "parallleing run iterations , since we only get astra for so litlle time"; "dont stop until astra goes out" | Each Astra window is used in full: three streams of three calls, calibration once per window. |
| 2026-10-05 | "delete the worktree of old iterations which are not necessary any more , so we have space" | Old iteration worktrees deleted. |
| 2026-10-05 | "auto resume at 7:30 am ist …  gpt astra 6 would be live by then , maximum use it" | Resumed at the 02:00 UTC window. |
| 2026-10-06 | "why is techinal interview decreased ?" | Answered: three answers out of twenty, on unchanged prompts; the model's own errors, inside run-to-run variation (section 7.1). |
| 2026-10-06 | E16b: "Land and push (Recommended)". Benchmark: "open as a pr ? would that work " | E16b landed on main and pushed. The benchmark went up as draft PR #638. |
| 2026-10-07 | "what are the values of each mode after all the optimizations" | The per-mode tables of section 7. |
| 2026-10-07 | "can you write a handoff docummnet with all the questions , answers for all the iterations so far , how each iteration effected each round …" | The first version of this file. |
| 2026-10-08 | "chek the api keys both and see which one has credits left , use that one for agentrouter" | Both keys' balances were read in-process; the funded one is selected by the probe. No key value was printed. |
| 2026-10-08 | "continue at 4:30 ist"; "continue at 7:30 am" | Resumed at those windows. |
| 2026-10-09 | "do 1" (answering "Land E19 on main?") | E19 fast-forwarded onto local main (`73b18d97`). Not pushed at that point. |
| 2026-10-09 | "push main to github" | GitHub `main` moved `bce8e47a` → `73b18d97`. Only `main` was pushed. |
| 2026-10-09 | "write a handoff file with all the questions , resonses , chanegs you have made , observations , rejected changed , benchmark , why this change , code changes , prompt changes etc in to a single.md file , everything" | This file. |
| 2026-10-09 | A long written brief for a new session ("final answer-quality optimization"): measure main with E19 first; map the remaining failures by first cause; arithmetic, facts from several documents, inventions the pass misses, correct inference, Technical Interview code, follow-ups; run the 12k / 24k / 48k threshold test; build a new high-difficulty set with an untouched validation part; Astra only; deterministic checks outrank the judge; nothing merged or pushed without his word. | The second session of 2026-10-09 (sections 1, 6 and 11, and the log from "Session of 2026-10-09, 10:00 UTC onward"). |
| 2026-10-11 | "first priority should be techical interview and looking for wrok modes and optimization wth profiel intelligence, and general mode… all other modes come next"; "i want all the modes to be at 9.5 or above"; "use agentrouter for deepseek model also"; "im gonna sleep now, you are on autopilot, continue iterating" | Priority list rewritten; E30 to E41 run overnight (section 1). Generation through AgentRouter emptied its balance that night, so the judge had none at the window of 12 October. |
| 2026-10-12 | "i have added one api key agenr router 2 , use that it has 174 usd creditts , key and 1 has 25 usd on each , , onllly use agent router for running iteration , strictly dont use deepseek api key" | The direct route was removed from the tools; the judge client knows the third key; price and speed of the route measured; E42 run; the judge window set for 02:00 UTC on 13 October. |
| 2026-10-13 | "we are stopping this optimizationsince we are out of budget , do all things you can do to make the last inal push of imporvements to all the modes" | No further judge or generation call. The three changes with evidence behind them were put on current main in a side branch, type-checked and tested against unchanged main, and he was asked what lands. |
| 2026-10-13 | Chose, when asked: "Land and push"; "Off in Technical Interview only"; "Include it" (the AgentRouter rung) | `293db92b..cb0fadac` fast-forwarded on main and pushed to GitHub: the profile read (E38), the AgentRouter rung (E42), the pass off in Technical Interview only. The layout, the stack and E31a were not landed. |

Decisions he made that are easy to forget:

- **AgentRouter only, the DeepSeek key is not to be used** (2026-10-12).

- **No reasoning on the answer model** (2026-10-02): measured at +1.3 s median and +4.8 s at the slow end to the first word. Do not propose first-word delays as quality fixes.
- **The awaited rerank stays** (2026-10-03): "keep as today".
- **E2 was kept at his word** (2026-10-04) although its first rule missed on one line.
- **The benchmark branch push** has not been approved. Neither has merging PR #638, which would put the blind holdout's questions on public main.

---

## 3. The benchmark

### 3.1 What it measures

When the truth is in the user's Reference Files or Profile Intelligence, does Natively find it and use it correctly? When it is deliberately absent, does Natively stay truthful and still useful?

Every case goes through the product's own paths. Files are uploaded through the app's upload hook, extracted, chunked and embedded by the app; a résumé and job description go through the app's profile ingestion. Nothing is injected as text, and the expected answer never reaches the app's prompt.

```
file on disk -> upload hook -> extract text (PDF / DOCX / text) -> mode reference files -> chunk + embed
             -> per-turn retrieval -> context packing -> prompt -> answer model -> repair and fix-up passes -> shown answer
```

### 3.2 The answer path under test

1. `decide()` classifies the turn and plans what to read.
2. Retrieval picks passages or whole files.
3. `packContext` fits them into the prompt budget.
4. `composePrompt` builds the prompt.
5. The answer model writes a draft: direct DeepSeek `deepseek-flash`, temperature 0.2, seed 7, thinking off.
6. Two passes may change the draft: the spoken "corrected answer" repair, and the fix-up pass (called the claim pass or claim verifier in the code, `electron/llm/claimVerifier.ts`), which removes claims the material does not support. Its budget is 3.5 s. It runs on 470 of the 630 development rows and is not deterministic.

### 3.3 The question sets

| Set | Questions | Use |
|---|---|---|
| `dev` | 270 (30 per mode) | Development: read freely |
| `dev2` | 360 (40 per mode) | Development: read freely |
| `holdout` | 180 (20 per mode) | **Blind.** Aggregates only; never read to design a change |
| `supp-counterfactual` (63), `supp-isolation` (46), `supp-oracle-sources` (223) | supplementary; listed in Appendix E | The same question under different evidence; leaks between modes and profiles; which source backs each oracle fact |

| `challenge` | 117 (13 per mode) | Readable. Harder questions on the same frozen documents, written blind on 2026-10-09: calculations from several sources, dates counted from rules, which value belongs to which thing, version conflicts, absent facts, follow-up chains. Every item is checkable by fixed strings or executed tests, so it is read without the judge. |
| `challenge-val` | 54 (6 per mode) | **Never read.** The validation part of `challenge`: aggregates only, like the holdout (`--blind`). |
| `sales1` | 18 (Sales only) | Readable. What a seller may say when the material stops: not covered at all 6, covered in part 4, true only under an unstated condition 3, a concession the seller cannot give 3, plain covered question 2. Authored blind and frozen 2026-10-11 for E31 (`AUTHORING-ER-SALES1.md`). No run of it exists yet. |
| `sales1-val` | 18 (Sales only) | **Never read.** The validation part of `sales1`, same mix on different facts: aggregates only. |
| `code1` | 36 | Technical Interview coding questions with 485 executed tests. Readable. |

Nine modes: General, Sales, Recruiting, Team Meet, Looking for work, Lecture, Technical Interview, Seminar, Call Center.

Six question types (the `condition` field):

| Type | What it tests |
|---|---|
| `grounded_single` | The answer is in one document |
| `multi_source` | The answer needs facts from several documents |
| `conflict_stale` | Documents disagree, or one is outdated or a draft |
| `irrelevant_source` | A distracting document is loaded too |
| `missing_evidence` | The asked fact is deliberately absent |
| `followup` | The question depends on what was said before |

Each question is spoken by the other party (the user presses a hotkey) or typed privately by the user. The documents are 104 synthetic files; no real résumé, customer data or company policy is used. The corpus is frozen (`FREEZE.json` holds the hashes).

### 3.4 How an answer is scored

The judge is exact `gpt-6-astra` through AgentRouter. It reads the case (evidence with its status and authority, the conversation, an oracle written before any answer existed, deterministic check results) and the answer, and returns 13 dimension scores from 0 to 10 plus any hard-failure flags. The score is then computed in code (`judge/score-er.mjs`):

| Dimension | Weight | Dimension | Weight |
|---|---|---|---|
| correctness | 0.15 | direct_usefulness | 0.10 |
| evidence_fidelity | 0.13 | evidence_utilization | 0.08 |
| grounding | 0.12 | realtime_usability | 0.07 |
| role_fidelity | 0.10 | source_precedence | 0.06 |
| intent_fulfillment | 0.10 | naturalness | 0.04 |
| cognitive_load | 0.02 | continuity | 0.02 |
| mode_fit | 0.01 | | |

A **hard fail** is an answer carrying a flag that caps its score:

| Cap | Flags |
|---|---|
| 4 | major_factual_error, major_reasoning_error, stale_source_preferred, draft_source_preferred, arithmetic_error, pricing_error, code_incorrect, fabricated_behavioral_story, unsupported_company_claim, unsupported_policy_claim, unsafe_commitment, fabricated_meeting_history, role_confusion, speaker_confusion |
| 5 | unsupported_personal_claim |
| 3 in Seminar, 5 elsewhere | unsupported_research_claim |
| 2 | wrong_profile_used, cross_mode_reference_leak, pi_leak |

Flags that do not cap: source_conflict_ignored, missed_available_evidence, coaching_instead_of_answer, ai_epistemic_leak, important_question_unanswered, excessive_deferral, evidence_overload.

Deterministic checks (`objective.mjs`: arithmetic recomputed, strings matched, code executed) outrank the judge: a check that proves the answer wrong adds its flag.

### 3.5 How the judge is kept honest

- **Calibration** before every window: 38 pairs written for calibration only (not benchmark items), each with an obviously better answer; the judge must prefer it in at least 35, and every reply must come back as exact `gpt-6-astra`. A window that fails calibration judges nothing.
- **One answer at a time**: each answer is judged on its own against its case; the judge is never told which build or arm produced it. Holdout rows are judged with `--blind`, which prints nothing that identifies a row.
- **No substitution**: if Astra is closed (HTTP 402) the work waits. Scores from other judges exist from 2026-10-03/05 (Claude Opus 5.5, and a Claude Code series) and are marked as a different series everywhere; they are never pooled with Astra's.
- Astra has opened at about 02:00 UTC and 11:00 UTC (7:30 am and 4:30 pm IST) for about 70 minutes, roughly 900 judgments.

### 3.6 How a change is decided

1. The rule (the lines that must hold, with their bars) is written into the log and committed **before** the change is measured.
2. The change is measured: by replay where possible (the recorded prompts are sent again with one thing changed; exact, minutes, no app), then in the app.
3. Only the rows where the two arms show different text are judged, both sides.
4. If every line holds it is a keep candidate; the blind holdout is then checked in aggregates. If a line fails, it is not kept, whatever else it shows.
5. Evin decides whether it lands.

Run-to-run variation is large and sets how much a result can say: the same build on the same prompts moves a set of 180 by about ±0.16, one mode of 20 to 30 by about ±0.7, and single answers by several points.

---

## 4. How to resume

Work directory: `/Users/evin/natively-cluely-ai-assistant/.claude/worktrees/aq-fix/benchmarks/natively-answer-quality`.

**If that folder is missing** (it was deleted once, on 2026-10-06, with everything git-ignored in it):

```
cd /Users/evin/natively-cluely-ai-assistant
git worktree add -f .claude/worktrees/aq-fix bench/evidence-rich
# run data and judgments that were not in git:
cp -R ~/natively-er-backup/results/*   .claude/worktrees/aq-fix/benchmarks/natively-answer-quality/evidence-rich/results/
cp ~/natively-er-backup/judge-out/*    .claude/worktrees/aq-fix/benchmarks/natively-answer-quality/evidence-rich/judge/out/base/
cp ~/natively-er-backup/cv/*           .claude/worktrees/aq-fix/benchmarks/natively-answer-quality/evidence-rich/results/.cv/
```

**App worktree for runs** (`.claude/worktrees/er-main`): `git worktree add`, clone `node_modules` and `resources/models` from the main folder with `cp -c -R`, then `git submodule update --init premium`, then `npm run build:electron`. Without the `premium` submodule the build fails on three unresolved imports.

**An Astra window.** Astra has opened at about 02:00 UTC and 11:00 UTC (7:30 am and 4:30 pm IST) and stayed open 65 to 76 minutes, about 900 judgments.

```
node astra/probe.mjs                         # one call per key; writes astra/probe-result.json
node ~/natively-er-backup/scripts/er-window-chain-20261009.mjs   # a whole window as ONE background script; copy and adapt
```

- Three processes of three calls each is reliable. Twelve calls at once gave "fetch failed" on a third of them.
- Calibration (38 pairs, about 7 minutes) runs once per window; 35 of 38 are needed.
- Background watchers and session crons die when the Claude Code session restarts. Re-check on every resume.
- Run a window as one chained background script: probe (exact `gpt-6-astra`, waits for the window, stops at once on HTTP 403), calibrate once, judge only what a saved plan still misses, write aggregates. `plan-pair.mjs` writes the plan (counts only); `report/pair-aggregate.mjs` reads it (aggregates only, no ids or text).
- HTTP 402 means the ration is closed: wait for the next window. HTTP 403 means the provider has blocked access for a while: stop, record it, do not retry the denied calls and do not change key, route or content.
- Do not run `astra-next5.sh` or the older `astra-next*.sh` blindly: their automatic commit lacks the current attribution line and their failure check covers 402 but not 403.

**The quota reply comes as HTTP 403 too (found 2026-10-10).** When an account's balance is spent the gateway answers HTTP 403 with `{"message":"user quota is not enough","code":"insufficient_user_quota"}`. That is the quota case, not the access block: `astra/client.mjs` has handled that body as quota since 2026-10-01 (next key of the pool, stop when every key is spent). The wrappers of 8 October (`/tmp/er-window-probe-20261008.mjs`, `/tmp/er-access-guard-20261008.mjs`) stop on every 403 and so never reach the second key. `er-window-probe-v2.mjs` and `er-access-guard-v2.mjs` (in `~/natively-er-backup/scripts/`) pass that one body through and stop on every other 403 exactly as before (flag `/tmp/er-access-block-20261008-1630.json`, nothing retried, no key, route, content or encoding changed). Evin confirmed this reading on 2026-10-11 IST ("nope try with the other key").

**What the next Astra window owes** (**an access-block flag IS in place since 2026-10-11 02:28:39 UTC**: the window of 11 October was closed by the provider's content-policy 403 four seconds into the larger-pack stage; remove the flag only after one clean probe by hand in a later window, and change no key, route or content. Neither window of 10 October had an access block). Both keys were out of quota at 11:56 UTC on 10 October (the first key's closed reply is HTTP 402 "Budget pool quota has been exhausted", the second's the 403 quota body), so the next window opens only when the budget pool refills or a key is topped up. Run the window script from a folder that outlives the session (it writes its status and logs beside itself; on 10 October a session restart emptied the scratch folder and killed it mid-window): copy the four files to a folder under `~/natively-er-backup/` and start it with `nohup`. If the script has to be restarted inside one window, `ER_CAL_SINCE=<ISO time of the window's start>` reuses the calibration already passed in it:

```
node ~/natively-er-backup/scripts/er-window-probe-v2.mjs   # exact gpt-6-astra on either key; result in /tmp/er-window-probe-20261010.json
node ~/natively-er-backup/scripts/window-oct10.mjs          # calibration, then everything still missing, in the order of the "Running or scheduled" row
node evidence-rich/report/window-read.mjs single base:er6-dev-main,er6-dev2-main --by mode,condition   # aggregates only
node evidence-rich/report/window-read.mjs pair base:er4-dev-main,er4-dev2-main base:er6-dev-main,er6-dev2-main --by mode,condition
ER_BENCH_DIR=$PWD/evidence-rich/pack24 node evidence-rich/report/window-read.mjs pair x2:x2-a12 x2:x2-e27 --bench pack24 --by kind,mode
```

The scripts sit in the scratchpad of the session that wrote them and are addressed by their own folder; run the backup copies from one folder (`window-oct10.mjs` looks for the two v2 files next to itself).

**An app run.**

```
NATIVELY_ENV_FILE=/Users/evin/natively-cluely-ai-assistant/.env \
node evidence-rich/supervise-er.mjs --root <app worktree> --runs dev:<run-id>,dev2:<run-id> --fresh-userdata \
     [--run-args "--id ID1,ID2"]
```

- One app at a time. No replay traffic on the DeepSeek key while an app run is in progress.
- Always `--fresh-userdata`; a stale profile once routed a run through AgentRouter.
- After a run: copy the run folder to `~/natively-er-backup/results/`, force-add `rows.jsonl`, and commit.

**Replays** (no app needed, minutes, exact):

- Fix-up pass: `evidence-rich/replay-claim-pass.mjs --cv results/.cv/cv-main-f4cd986d.mjs --runs … --name <arm> --cap 96000 --recorded-cap 96000 [--variant replay-variants/<file>.mjs]`. The rebuilt request must equal the recorded one (the tool prints the count).
- Generator: `evidence-rich/replay-generator.mjs --runs … --select all|<ids> --k 2 --name <arm>`.
- Judge only the rows where two arms show different text, both sides. Read pass timing only on arms replayed in the same hour.

---

## 5. Traps that cost time

1. **`.claude/worktrees/` was deleted on 2026-10-06** by something other than this work. Every run folder, judgment file and judge cache before that date is gone. Their numbers survive in `ITERATIONS-ER.md`; they can be cited, not recomputed. Since then rows and Astra judgments are committed, and run folders are copied to `~/natively-er-backup/`.
2. **History was rewritten on 2026-10-06** (`git filter-repo`, another session) to purge dev harness pages and `cluely-*` assets. Commit hashes in notes older than that date are pre-rewrite; find commits by message. A worktree's index kept the purged files, and the next commit there re-added them; before pushing any branch run `git diff --name-only main...<branch>` and check every path is intended.
3. **Old-history branches still on GitHub**: `fix/aq-astra`, `cand/e16b`, `cand/e15` (this work) and many `backup/*`. They keep the purged files reachable. Deleting them is Evin's call.
4. **The blind holdout**: read aggregates only. Never read its questions or answers to design a change.
5. **Run-to-run variation is large.** Same build, same prompts: a set of 180 moves by about ±0.16, one mode of 20 to 30 by about ±0.7, and single answers by several points. One run per build cannot decide a small effect; use replays with repetitions (E16c is the model).
6. **Two judges, never pooled.** Scores marked "Claude Code judge" or "Opus" are a different series from Astra's.
7. **A test may pin an earlier decision.** E19 tripped a test recording that a broader exemption had been tried and withdrawn on 2026-10-01. Read the note beside a failing test before changing it.
8. **`benchmarks/` is git-ignored** (`.gitignore:381`), on the benchmark branch too. A new file there needs `git add -f`; tracked files stage with `git add -u`. A run folder that is not force-added is not in git.
9. **Tests under plain `node --test`.** The test files import compiled output from `dist-electron/`, so run `npm run build:electron` first. Under plain Node (v25) the native modules built for Electron do not load: `electron/services` shows 122 failures of 5,730 with or without a change. Compare the failing-test names against the same suite on the commit before, or run through the project's `npm test`.
10. **Run every suite the landing procedure names, with a baseline, before the fast-forward.** E19 was fast-forwarded after two of the four suites; the other two were run afterwards and matched the baseline. Do it in the right order next time.
11. **The fix-up pass is not deterministic.** The same draft gets a different edit on a second call, so one replay shows one draw of which rows differ. For a holdout reading use two repetitions and pool them (E19 is the model).
12. **A 403 is not a 402.** On 2026-10-08 five judge calls returned HTTP 403 (a temporary content-policy block at the provider). The window was closed with a partial reading marked incomplete; the block did not recur the next day.
13. **Builds leave about 1.3 GB of `dist-electron` per worktree.** Delete your own build output after use, and check free disk before an app run.
14a. **Stop only your own app.** Another session may start a `dev:agent` app in the main checkout at any time. Check `ps` for `scripts/dev-agent.mjs` before starting one, and stop by the launcher whose working directory is your worktree (`lsof -a -p <pid> -d cwd`), never by name.
14b. **The limits probe needs `NATIVELY_ROOT`** set to the app worktree, or it looks for `agent-browser.json` in the current folder.
14c. **A question asked late in a session can be answered from the conversation.** In the threshold probe the list question came after seven turns that had each stated one of its facts; it scored 7 of 7 with 2 of 7 in the request. Ask it in a fresh session.
14d. **A clean result on rows you have read may not carry.** E21 held on the development rows twice (+11 points, interval above zero) and showed nothing on 37 unseen calculation questions. Check a candidate on `challenge` and `challenge-val` before any app run or judge call.
14e. **Needles are substrings.** "October 20" used to match "October 2026" (fixed in obj-3 for digits). Write date needles with their day spelled so that a longer number cannot contain them.
14. **The shared git stash.** Never use bare `git stash` or `git stash pop`: other sessions use the same stash.
16. **A process search inside a typed command finds the command itself.** `ps | grep "[d]ev-agent"` in a command whose own text names `scripts/dev-agent.mjs` (a heredoc, a chain being written) counts the shell. Search in a separate call.
17. **AgentRouter's price is per prompt token and high** (section 1). A replay of 300 requests is about USD 60. Read the counter before and after anything larger than a probe; `chains/spend-guard.mjs` stops an app run past a cap.
18. **An AgentRouter-only app run is slow to set up**: a profile upload runs about ten structured calls through the gateway, and on `cdaedfad` it has no model at all for them (E42).
15. **Other sessions' files.** The main checkout usually holds uncommitted work from other sessions. Never sweep it into a commit; stage by path.

---

## 6. Every iteration: what it tried, how it was measured, verdict

"Kept" means it is on main. Judges: A = gpt-6-astra, O = Claude Opus 5.5 (provisional, 2026-10-03/04), CC = Claude Code judge (2026-10-04/05).

| # | What it changes | Measured on | Result | Verdict |
|---|---|---|---|---|
| E1 | A reference pack that fits the prompt is read whole | dev + counterfactual, then blind holdout (O); re-reviewed by A | Holdout 7.73 → 8.59 (A), hard fails 42 → 18 | **Kept** (2026-10-03) |
| E2 | A résumé and job description that fit are handed over whole | dev (O), then blind holdout under a second rule | First rule missed on one line (+0.63 with a wide interval); holdout confirmed what it controls | **Kept** at Evin's word (2026-10-04) |
| E3 | A rail: a number the material states cannot be "unsupported" | offline (O) | Failed one line on four rows | Not kept |
| E4 | Skip the fix-up pass when the files are in the prompt | offline (O) | Raised the mean and let four more hard fails through | Not recommended |
| E5 | The fix-up pass is shown the whole prompt (was cut at 24,000 chars) | replay, app, holdout (O) | Every line held | **Kept** (2026-10-03) |
| E6 | Pass wording: a current document against an older one is not a conflict (two wordings) | replay, 333 rows (O) | +0.06 (±0.08); hard fails 32 → 27 | Not kept (mean gain not distinguishable from zero) |
| E7 | Date and version labels on reference files in the prompt | app run (O) | Failed its rule | Not kept, reverted |
| E8 | The loaded pack reaches every turn of its mode | app runs ×2, holdout (O) | Failed two lines; one part isolated | Not kept; part (a), the Recruiting job description, **kept** |
| E9 | Pass wording naming two shapes of invention | replay (O) | Pointed the right way, not conclusive | Nothing concluded |
| #2 | Typed text reaches the model verbatim | in-app probes | Typed text reaches the model unchanged | **Kept** (Evin's pick) |
| #3 | 48,000-character answers, a loop stop, a "cut off" notice | in-app probes | Works as designed | **Kept** (Evin's pick) |
| E10 | The spoken "corrected answer" repair reads the whole prompt (96,000) | replay, 131 turns ×2 | 8.08 → 8.87 (A), hard fails 29 → 17 | **Kept**, confirmed by A on 2026-10-06 |
| E11 | A named fact outranks common words; the retriever picks what the packer fits; typed questions use the embedding search | probes + dev (CC) | Typed multi-file misses 6 of 9 → 0 | **Kept**, with two corrections so spoken turns keep the awaited rerank |
| E12 | Older speech is recalled for long questions; the live window keeps more speech | probes + dev (CC) | 36 of 36 transcript facts recalled | **Kept** |
| E13 | A turn answered without retrieval still reads a pack that fits | dev (CC) | Delivery 204 → 209 rows; gained rows +3.0 | **Kept** |
| E14 | A pass edit may not add a figure | holdout (CC) | Mean up, one more hard fail | Not kept |
| E15 | A note in the prompt for typed questions (two wordings) | generator replay (CC) | Failed all three lines | Not kept |
| E16 | A retrieving turn plans the whole profile and pack when they fit | dev + dev2, 630 rows | Résumé missing 24 → 4, but delivery 490 → 488 | Not kept as built |
| E16b | E16 plus: a whole résumé or job description is not removed by the claim-authority gate | dev + dev2, one run per build | Gained rows +0.44 (CC), +0.36 (A); bar was +0.5 | Not kept on that measurement |
| E16c | E16b measured again on the 80 rows it changes, two replays per row and build | fresh runs on main, 320 drafts (A); then blind holdout pair (A) | Drafts 8.35 → 8.70, hard 17 → 14, rises 12 / falls 4; holdout safety rule held on 180 pairs | **Kept**: E16b landed 2026-10-06 |
| E17 | Pass wording: name a conflict only when the material does not settle it | replay, two samples (A) | Sample 1 missed one line; sample 2: conflict-ignored flags 1 → 5 | Not kept |
| E18 | Pass wording: say whether a conflict is settled or open | replay, two samples pooled (A) | Conflict-ignored flags 3 → 13; hard fails 27 → 34 | Not kept. **The conflict line of the pass is closed; do not re-propose a rewording.** |
| E19 | Pass wording: a statement that the material does NOT contain something is not a claim to remove | replay on 470 passes (A); in-app run of the 88 rows it changes (A); blind-holdout replay, two repetitions (A) | Development 8.29 → 8.68, hard fails 12 → 7, invention flags 11 → 6; in app 8.50 → 8.62; holdout 25 pairs 8.105 → 8.135, pooled 52 pairs 8.158 → 8.384, hard fails 9 → 8 | **Kept**: landed and pushed 2026-10-09 (`73b18d97`) |
| E20 | A rail on the pass's output, no wording change: when its CONFLICT line labels every value with a version or a date and it listed nothing unsupported, the edit is dropped and the draft stands | judge-free line on recorded pass outputs; no Astra call spent | In-sample 4 rows 6.35 → 9.71, but it changed a row whose oracle holds a true two-document conflict (1 of 3 on the second sample) | Not kept (line 3 of its rule). **The conflict line is closed to rails on its text as well.** |
| — | A "CHECK:" line in the pass: quote the material for each statement before listing anything (two wordings) | 52 drafts, judge-free | Finds the flagged detail on about two thirds of 24 capped drafts, and edits 12 of 28 drafts scored 9.5 or above; pass time p50 1.27 → 1.67 to 1.86 s | Dropped, never declared. Do not re-propose without a way to protect inference |
| — | A notice in the answer prompt: state the deciding fact before the verdict | the 13 self-contradicting rows, four samples each, judge-free | Fixed two rows in 4 of 4 samples; turned a third, right in 4 of 4, wrong in 4 of 4 | Dropped, never declared |
| — | One more pass sentence only on drafts that contain a denial | counted on the 21 hard fails flagged for missed evidence | The draft contains a denial on 1 to 4; they are omissions, not denials | Dropped before any call |
| — | A generator notice against multi-source omissions | counted on 126 rows | 20 rows miss a fact, each by a different mistake; at most +0.08 on the mean if every one were fixed; not measurable without the judge | Not pursued |
| — | A rail on edits that remove a fact the draft had | counted on 99 edited rows | 5 rows | Too few; not pursued |
| — | Inline component arithmetic (an idea of 2026-10-08) | — | Never declared, built or measured | Idea only |
| obj-2, obj-3 | Deterministic checks: a string the mode's own loaded files state is not a profile leak; a needle that starts or ends with a digit matches only as a whole number | Re-applied to every stored judgment without a judge call | One development row 2 → 10 (baseline 8.923 / 71 → 8.935 / 70); no holdout score changes | **In the benchmark** (2026-10-09) |
| E21 | The hidden calculation step on turns the word list does not reach. Stage 1: the notice hand-placed on the 59 calculation rows without it. Stage 2: main's wording on every document turn. Stage 3: a lighter wording (n3). Stage 4: the same on the unseen challenge sets | Generator replay, deterministic checks, 2 to 4 samples per row and arm | Stage 1: 73.3 → 84.7 % right. Stage 2: required strings 95.2 → 91.5 % on 387 turns that need no calculation (rejected). Stage 3: n3 costs nothing there (94.2 %) and keeps the gain (72.0 → 83.1 %). Stage 4: `challenge` 73.6 → 73.6 % on 37 calculation rows, forbidden-string samples 33 → 48 | **Not proposed** (stage 4, lines 1 and 4). Branch `cand/e21` kept as a record |
| E22 | Does main's own calculation notice earn its place on the rows its word list reaches? | Generator replay with and without it, 222 rows × 3, development and challenge sets | Calculation rows 79.2 → 89.2 % right (+8.1 on the unseen sets alone); other rows 91.7 → 91.2 % | **Main confirmed**, nothing changes |
| X1 | Whole-pack threshold 12,000 against 24,000 and 48,000 (Evin's pick #6) | Limits probe on an experiment build, synthetic files of 11,900 to 48,100 tokens, spoken and typed, 528 turns | 12,000: a whole-document question gets 2 or 3 of 7 facts just above it. 24,000: every line holds, no spoken first-word cost. 48,000: the fix-up pass (96,000-character cap) rewrote three right drafts wrong; typed first word +0.6 s | **Measured; nothing lands.** A proposal would be 24,000 with the pass's cap raised, after a quality run on realistic larger packs |

Lessons that hold across them:

- Retrieval is no longer the limit: every needed fact is in the prompt on 497 of 499 development questions that need one.
- The fix-up pass helps overall (Astra, 99 edited answers: 8.23 → 8.47, hard fails 22 → 11). It hurts when it removes honest statements of absence (E19 addresses that) and on a handful of follow-up turns.
- Every attempt to let the pass treat a document conflict as settled raised a worse error. Astra penalises the existing "given two ways" hedge least.
- Making the pass check each statement against the material (the "CHECK:" line) also removed correct inference: worked-out figures, conclusions drawn from stated numbers, honest statements of absence.
- The pass wrote "UNSUPPORTED: none" on 21 of the 34 development answers capped for an invented detail. It is a partial net, not a guarantee.
- Missing-evidence questions were the weakest type on main (8.04). E19 addresses them. After E19 no single cause covers more than about 1 % of rows.
- Of 792 required facts with fixed strings, 73 have no string in the prompt (70 rows); in 53 of those rows the answer has the value anyway because it is a computed figure. The 17 rows where it is also missing from the answer (mean 6.04, 6 hard fails) are mostly Sales pricing sums and deferrals.
- Of 71 hard fails on the development set, 57 are answers the pass never edited: the answer model misreading, miscalculating or mis-combining facts that are in the prompt (factual error 21, missed available evidence 20, reasoning 10, arithmetic 8, unsupported claims 26). That is the next lever, and it is hard to move without reasoning.
- The gist chip repeats the body's error; it is the lone error on 3 rows. Not a lever.
- A notice in the answer prompt is never free. Main's calculation notice on turns that need no calculation costs completeness; a lighter one changed what the model does with an absent fact on unseen questions. Where the question's wording asks for a quantity, the same notice is worth about ten points of right answers (E22), on unseen questions too.
- By first cause, the 71 hard fails of the last judged baseline are: invented company, policy, research or personal facts 22; unsupported inference 9; arithmetic or calendar count 7; right value on the wrong thing 6; document conflict 6; self-contradiction 6; a fact left out 5; inputs combined wrongly 2; wrong code 2; role 2; gist chip 2; one defective check. None lacked the evidence in the prompt.

---

## 7. Scores per mode, per round

Never compare across judges. Within one judge, a mode column moves by about ±0.7 between runs of the same build.

### 7.1 Blind holdout (20 questions per mode), gpt-6-astra

| Mode | main 2026-10-04 (`er-holdout-m1`) | + the 2026-10-05 fixes (`er-holdout-e13`) | main 2026-10-06 before E16b (`er-holdout-m3`) | main with E16b (`er-holdout-e16b3`) |
|---|---|---|---|---|
| Call Center | 7.68 | 8.30 | 8.68 | 7.71 |
| General | 8.91 | 9.31 | 9.41 | 9.13 |
| Lecture | 8.90 | 9.20 | 9.55 | 9.53 |
| Looking for work | 8.50 | 9.50 | 8.68 | 9.07 |
| Recruiting | 9.08 | 9.01 | 8.97 | 8.80 |
| Sales | 7.98 | 8.93 | 7.67 | 9.02 |
| Seminar | 9.54 | 9.42 | 9.42 | 9.03 |
| Team Meet | 8.92 | 9.26 | 9.32 | 9.03 |
| Technical Interview | 8.54 | 7.98 | 7.97 | 8.19 |
| **All 180** | **8.674** (28 hard) | **8.990** (19 hard) | **8.853** (22 hard) | **8.835** (23 hard) |

Earlier points on the same holdout under Astra, overall only: the build before this work 7.725 (42 hard fails); E1 alone 8.585 (18 hard fails).

How to read it: the first two columns are the same question set one day apart, before and after the eight fixes of 2026-10-05. The last two are a clean pair run on the same day (today's main with and without E16b). `er-holdout-e13` is the build just before the two E11 corrections; the difference between 8.990 and 8.853 is inside run-to-run variation plus other sessions' changes to main in between. The Technical Interview drop in column two was three answers out of twenty on unchanged prompts (the model's own errors).

### 7.2 Development set (70 questions per mode: dev 30 + dev2 40), main `f4cd986d`, gpt-6-astra

| Mode | Mean | Hard fails |
|---|---|---|
| General | 9.18 | 6 |
| Lecture | 9.10 | 8 |
| Looking for work | 9.02 | 7 |
| Technical Interview | 8.90 | 11 |
| Recruiting | 8.90 | 6 |
| Team Meet | 8.88 | 7 |
| Call Center | 8.85 | 6 |
| Seminar | 8.84 | 9 |
| Sales | 8.63 | 11 |
| **All 630** | **8.923** | **71** |

By question type: grounded in one document 9.16; irrelevant source present 9.12; conflicting or stale documents 9.02; several documents 8.84; follow-up 8.63; answer not in the documents 8.04. Spoken 8.92, typed 8.93.

### 7.3 Development set, the build of 2026-10-05 (`cand/e13b`), Claude Code judge (a different series)

| Mode | dev (30 each) | dev2 (40 each) |
|---|---|---|
| Call Center | 9.01 | 8.63 |
| General | 8.80 | 8.75 |
| Lecture | 9.16 | 9.37 |
| Looking for work | 8.18 | 8.57 |
| Recruiting | 9.17 | 9.12 |
| Sales | 8.81 | 8.14 |
| Seminar | 9.25 | 8.59 |
| Team Meet | 8.47 | 8.93 |
| Technical Interview | 8.74 | 8.41 |
| **All** | **8.843** (17 hard) | **8.722** (31 hard) |

Pooled 8.774 with 48 hard fails. E16b on the same judge: 8.774 → 8.820, hard fails 48 → 45.

### 7.4 Earlier rounds (Claude Opus 5.5 judge, 2026-10-03/04), overall only

The kept build at the start delivered only 51 % of needed facts and scored 7.44. After E1, E5 and E2 landed, main scored 8.58 on 513 development rows and the blind holdout went 7.40 → 8.54. Per-mode tables for those rounds are in `ITERATIONS-ER.md` (sections E1, E5, E2 and M1) and in `docs/` of the benchmark; their raw data is gone.

### 7.5 E19 on the development set (gpt-6-astra)

Replay of the fix-up pass on the 470 development rows where it runs (requests identical to the app's, bar the one sentence). Astra judged the 88 rows where the two wordings give different text, both sides.

| Reading | Rows | Before | With E19 | Hard fails | Invention flags |
|---|---|---|---|---|---|
| Replay, rows that differ | 88 | 8.29 | 8.68 | 12 → 7 | 11 → 6 |
| Of those, asked fact absent | 35 | 8.19 | 8.63 | | |
| In the app, same 88 questions (`er5-dev-e19`, `er5-dev2-e19`) | 88 | 8.50 | 8.62 | | |

Pass time at the slow end (p90): +224 ms, inside the 300 ms bar.

### 7.6 E19 on the blind holdout (replay, gpt-6-astra, aggregates only)

Both wordings were replayed on the recorded drafts of `er-holdout-e16b3` (132 passes per arm and repetition, requests identical to the app's). Astra judged only the rows where the arms give different text. A pair is one row in one repetition.

| Reading | Pairs | Control | New wording | Change (95 % half-width) | Hard fails | Invention rows | Up ≥ 1 / down ≥ 0.5 |
|---|---|---|---|---|---|---|---|
| Repetition 0 (rule of 2026-10-07) | 25 | 8.105 | 8.135 | +0.031 (±0.499) | 5 → 5 | 4 → 4 | 2 / 3 |
| Repetition 1 | 27 | 8.208 | 8.615 | +0.407 (±0.558) | 4 → 3 | 3 → 2 | 5 / 3 |
| Pooled (rule of 2026-10-09) | 52 | 8.158 | 8.384 | +0.226 (±0.376) | 9 → 8 | 7 → 6 | 7 / 6 |

Both rules hold. What that says and does not say: on the blind holdout the new wording did no measurable harm and probably a small good; the pooled interval still includes zero, so it is not a confirmed gain. The two repetitions share the same 132 drafts, so the 52 pairs are not 52 independent questions. Rows where the arms give the same text contribute no change, so the effect on all 180 holdout questions is about +0.03. Pass time p90 on repetition 1: +88 ms.

---

### 7.7 Main with E19 (`73b18d97`), development set, gpt-6-astra, all 630 rows (2026-10-10)

Paired with main before E19 (`f4cd986d`, run `er4`) on the same questions. One commit on the answer path separates the builds (E19); the runs are three days apart and share 6 word-for-word answers.

| Mode | Rows | Before E19 | With E19 | Difference (95 %) | Hard fails |
|---|---:|---:|---:|---|---|
| General | 70 | 9.18 | 8.98 | −0.20 (−0.67 to 0.27) | 6 → 7 |
| Sales | 70 | 8.63 | 8.21 | −0.43 (−0.91 to 0.05) | 11 → 18 |
| Recruiting | 70 | 8.90 | 8.98 | +0.08 (−0.35 to 0.51) | 6 → 5 |
| Team Meet | 70 | 8.88 | 9.04 | +0.16 (−0.39 to 0.70) | 7 → 5 |
| Looking for work | 70 | 9.13 | 9.04 | −0.09 (−0.49 to 0.31) | 6 → 7 |
| Lecture | 70 | 9.10 | 9.15 | +0.05 (−0.34 to 0.45) | 8 → 7 |
| Technical Interview | 70 | 8.90 | 8.83 | −0.07 (−0.42 to 0.28) | 11 → 11 |
| Seminar | 70 | 8.84 | 8.90 | +0.05 (−0.54 to 0.65) | 9 → 8 |
| Call Center | 70 | 8.85 | 8.73 | −0.12 (−0.64 to 0.41) | 6 → 10 |
| **All** | **630** | **8.935** | **8.873** | **−0.062 (−0.22 to 0.09)** | **70 → 78** |

By condition: one source 9.20 → 9.23 (232 rows, hard 20 → 18); several sources 8.84 → 8.53 (126, 16 → 22); conflicting or stale 9.02 → 8.98 (108, 9 → 10); evidence missing 8.04 → 7.68 (65, 15 → 20); irrelevant source 9.12 → 9.24 (63, 5 → 4); follow-up 8.63 → 9.02 (36, 5 → 4). No interval excludes zero. Invention-flag rows 39 → 45.

Hard fails: 33 rows in both runs, 37 only before, 45 only now. The evidence-missing line was checked on the same drafts (E29, repetition 0, 34 rows where the two passes show different text): pass before E19 8.11, hard 7, invention-flag rows 7; pass with E19 7.95, hard 8, invention-flag rows 8. On the 11 rows only the old pass edited (the drafts E19 now leaves alone) 8.33 → 8.00, hard 2 → 3; on the 3 only the E19 pass edited 4.30 → 7.64, hard 3 → 1; on the 20 both edited 8.57 → 7.96, hard 2 → 4. Line 1 of E29's rule failed by one row on this repetition. **Repetition 1 (judged 2026-10-11, 33 rows): 8.18 → 8.04, hard 6 → 8, invention-flag rows 6 → 8: line 1 fails again (by two), line 2 fails (by one), line 3 holds. By the rule written before the replay, line 1 failing on both repetitions is a regression of E19 on evidence-missing questions, and it is reported to Evin as one.** Size and place (both repetitions, one value per question, `report/e29-pooled.mjs`): 36 questions −0.10 (95 % −0.61 to +0.42), hard-fail row-repetitions 13 → 16 of 67. The drafts E19 now leaves alone (its purpose; 12 questions) −0.13 (−0.49 to +0.23), hard 4 → 5: no measurable change. The 5 questions only the E19 pass edits +2.19 (−0.17 to +4.55), hard 4 → 1. The loss is where both passes rewrite the draft (23 questions): −0.64 (−1.33 to +0.04), hard 5 → 10, the same direction in both repetitions (2 → 4, 3 → 6). The same arm against itself across the two repetitions changes hard-fail state on 1 (old pass) and 3 (E19 pass) of 31 questions. Nothing is proposed from it; E19 stays on main unless Evin says otherwise; the lead is why the E19 pass's rewrite of an evidence-missing draft is worse than the old pass's rewrite of the same draft.

### 7.8 Main against the 24,000 candidate on the larger packs, gpt-6-astra (2026-10-10; the 48 new questions only)

| Mode | Pairs | Main | `cand/e27` | Difference (95 %) | Hard fails |
|---|---:|---:|---:|---|---|
| Sales | 12 | 6.34 | 8.60 | +2.26 (0.69 to 3.83) | 3 → 2 |
| Seminar | 12 | 6.56 | 8.55 | +1.99 (−0.08 to 4.06) | 4 → 2 |
| Call Center | 12 | 5.99 | 7.79 | +1.80 (−0.05 to 3.64) | 4 → 3 |
| Lecture | 12 | 6.48 | 7.77 | +1.29 (−0.87 to 3.45) | 4 → 4 |
| **All** | **48** | **6.34** | **8.18** | **+1.83 (0.90 to 2.77)** | **15 → 11** |

31 better, 9 worse; invention-flag rows 6 → 4. The 120 derived rows per arm are not judged as pairs (main has 28 of them, the candidate none). Not landed; it waits for Evin's word.

### 7.9 Blind holdout, the two profile modes, main `67fb1b24` against main before E19 (gpt-6-astra, aggregates only, 2026-10-10)

40 pairs: 8.631 → 8.606 (−0.025, 95 % −0.49 to +0.44), hard 7 → 6. Looking for work (20): 9.075 → 8.544, −0.53 (−1.15 to +0.09), hard 2 → 2. Technical Interview (20): 8.188 → 8.668, +0.48 (−0.15 to +1.11), hard 5 → 4. The other 140 rows of `er10-holdout-main` are not judged.


## 8. What changed in the code, and why

All of this is shared TypeScript in the answer path. None of it is platform-specific: no OS calls, paths, native modules or window code. It was run physically on macOS in the dev build through the benchmark. It has never been executed on Windows, and no packaged build was made for it.

Each entry gives the problem as it was measured, the change, and the result. Section 12 lists the files; Appendix A prints every commit message and diff in full. In the order it landed:

### 8.1 A reference pack that fits is read whole (E1, `803c7612`, 2026-10-03)

- **Problem seen:** every file parsed and indexed, yet the fact the answer needed was in the prompt on only 99 of 199 reference-file turns. A turn packed at most 8 passages (1,500 to 2,400 evidence tokens), and on 92 of the 111 turns that missed, the retriever had offered more candidates than were packed.
- **Change:** when a mode's files together are between 1,400 and 12,000 estimated tokens (`WHOLE_PACK_MAX_TOKENS`), a turn that reads the files gets each file entire and skips the embed and rerank round trip. The plan's item cap and evidence budget grow by the pack's size so the résumé, job description and meeting evidence keep their room.
- **Unchanged:** a larger corpus is retrieved as before. No prompt wording changed.
- **Result:** blind holdout 7.73 → 8.59 under Astra, hard fails 42 → 18.

### 8.2 Hidden working no longer leaks into the answer (`18d2603e`, 2026-10-03)

- **Problem seen:** once in 334 turns carrying the calculation notice, the answer model wrote its working as its own tool-call markup instead of the asked-for `[[CALC]]` form. The stream filter knew only that form, so the markup was shown.
- **Change:** the markup block is recognised and hidden like the asked-for form.
- **Result:** not reproducible on demand (0 of 24 replays), so it is covered by tests, not by a score.

### 8.3 The fix-up pass sees what the answer saw (E5, `948b0b3c`, 2026-10-03)

- **Problem seen:** the pass was shown only the first 24,000 characters of the prompt. With a pack handed over whole the prompt was longer than that on 302 of 384 passes, so the pass removed facts the files state because it could not see them.
- **Change:** the pass has its own cap, 96,000 characters. Regeneration and the document-grounded repair kept 24,000 at that point.
- **Result:** replayed on 251 recorded drafts, the effect of the pass went from −0.21 to +0.01, hard fails 33 → 32, every pass inside its 3.5 s budget.

### 8.4 Résumé and job description handed over whole (E2, `feea02a9`, 2026-10-04)

- **Problem seen:** a turn carried at most six profile passages out of about seventy. The fact a résumé or job-description question needed was in the prompt on 13 of 33 rows; with it the answers scored 9.5, without it 6.6.
- **Change:** when every registered résumé and job description has raw text and together they are at most 6,000 tokens, the plan makes room and each document arrives as one whole item instead of passages.
- **Result:** the first rule missed on one line (+0.63 with a wide interval); the blind holdout confirmed what it controls. Kept at Evin's word.

### 8.5 A mode's own file is not removed by the claim-authority gate (E8 part a, `4aabf0b4`, 2026-10-04)

- **Problem seen:** on a spoken Recruiting turn the claims needed are about the candidate, so the mode's own hiring job description was dropped from a pack otherwise handed over whole: 13 of 27 spoken Recruiting turns, including when the candidate asked about pay, travel or on-call.
- **Change:** a file of the mode handed over whole stays in the prompt. What an item may *support* is unchanged.
- **Result:** Recruiting +0.08 and +0.59 over two runs. The rest of E8 failed its rule and was not kept.

### 8.6 Typed text is not "cleaned" (Evin's pick #2, `c5e8d42c`, 2026-10-04)

- **Problem seen:** the speech filler stripper ran on typed questions too: "the right answer" became "the answer", and "basically", "I mean" and a repeated word were deleted from what the user typed.
- **Change:** typed chat skips the stripper. Speech keeps it.
- **Result:** verified in the app: typed text reaches the model unchanged.

### 8.7 Long answers (Evin's pick #3, `8ca5cac9`, 2026-10-04)

- **Problem seen:** a legitimate 900-line answer stopped mid-line at the 16,000-character cap and the overlay showed nothing about it. The cap had also caught a real 22,871-character runaway, which is why it could not simply be removed.
- **Change:** the cap is 48,000 characters. A repetition guard ends an answer whose tail is one block repeated five times after 3,000 characters. An answer stopped either way shows the existing "Answer cut off" notice with the reason, in English, Russian, Chinese, Japanese and Spanish.
- **Result:** verified in the app: the 900-line answer completes (20,951 characters); the notice shows under typed and spoken answers.

### 8.8 The spoken repair reads the whole prompt (E10, Evin's pick #1, `e1fe2d09`, 2026-10-04)

- **Problem seen:** the spoken "corrected answer" repair ran on about 20 % of spoken turns, was cut at 24,000 characters every time, and lacked a needed fact on 1 to 2 % of spoken turns.
- **Change:** it inherits the whole answer prompt (96,000), like the fix-up pass.
- **Result:** replay of 131 turns, twice: 8.08 → 8.87 under Astra, hard fails 29 → 17.

### 8.9 Retrieval ranking and fit (E11, Evin's pick #5, `7de6bc59` with corrections `2fa1cf7b` and `05ae494b`, 2026-10-04)

- **Problem seen:** typed, with six files of 2,100 tokens: the chunk holding the answer scored 0.07 against 0.24 for five wrong chunks, ranked fifth, and the packer fitted four. Common question words counted like the name being asked about, and an "overview" penalty fired because the word "summary" appeared near the chunk's start. (My first diagnosis blamed the typed keyword fallback. That was wrong; a hybrid run missed too.)
- **Change:** a named fact scores 0.15 per hit and other shared words 0.05; the overview penalty needs a real overview heading; the retriever picks only what the packer can fit; typed questions use the embedding search in a meeting too.
- **Two corrections, both my errors:** the new score also fed the confidence gate, and the embedding search was first switched on for spoken turns as well. Either way the awaited rerank stopped being awaited on spoken turns (hotkey-to-request median about 500 ms → 22 to 24 ms), against Evin's decision of 2026-10-03 to keep it. `2fa1cf7b` gives the gate its old score; `05ae494b` limits the embedding search to typed questions.
- **Result:** typed multi-file misses 6 of 9 → 0.

### 8.10 Older speech (E12, Evin's pick #4, `e47cb7e6`, 2026-10-04)

- **Problem seen:** a 20-line exchange had lost its first line (a 2,400-character window read from a rolling context evicted at 180 s). The live-transcript search admitted only the window holding the question itself, which scored 1.00 against the question it contains while the windows with the facts scored 0.15 to 0.16, under the 0.2 floor. "launching" never matched "launch".
- **Change:** the asked question's own line is removed before scoring and never returned as evidence; speech is matched on light word stems; the live window is 6,000 characters read from the durable transcript (600 s).
- **Result:** 36 of 36 transcript facts recalled.

### 8.11 Fast-route turns read a pack that fits (E13, `643ef204`, 2026-10-04)

- **Problem seen:** since packs are handed over whole, a turn the classifier answered from general knowledge read nothing from them: 10 of 333 turns ("Can both be had on Operations?" got "I'll confirm" with the integration matrix loaded and unread).
- **Change:** such a turn reads the pack.
- **Cost:** the pack's tokens on every such turn of a mode that has one.
- **Result:** needed facts delivered on 204 → 209 rows; the gained rows rose by 3.0 points (Claude Code judge).

### 8.12 Whole profile and pack planned on every retrieving turn (E16, `83d3962f`, 2026-10-04) and kept by the gate (E16b, `e9f5ceef`, 2026-10-05)

- **Problem seen:** spoken "How often are you carrying the pager these days?" was classified a document question, the résumé was not planned, and the answer gave another company's on-call checklist as the candidate's own (2.1 of 10). 19 profile-mode turns with a profile loaded had no résumé in the prompt. With E16 alone, the gate then removed one or both whole documents on nine turns.
- **Change:** a retrieving turn plans the whole profile and the whole pack when they fit, whatever the classifier named; a résumé or job description handed over whole is not removed by the claim-authority gate. Presence in the prompt only: a job description still cannot back a claim about the candidate.
- **Result:** E16 alone was not kept as built (résumé missing 24 → 4, but delivery 490 → 488). E16b first measured +0.36 under Astra against a bar of +0.5 and was not kept on that measurement. Measured again as E16c on the 80 rows it changes, two replays per row and build: 8.35 → 8.70, hard fails 17 → 14; the blind-holdout safety rule held on 180 pairs. Landed 2026-10-06.

### 8.13 A statement of absence is not a claim to remove (E19, `73b18d97`, landed 2026-10-09)

- **Problem seen:** asked for something the material does not hold, the draft said so, and the fix-up pass removed the sentence as "unsupported". "Nothing in the status notes or the risk register says legal has signed off" became a status report. "There is no cost per building anywhere in the material" and "I don't want to give you a number I haven't verified" went the same way. Questions whose answer is absent were the weakest type on main (8.04 against 8.92 overall).
- **Change:** one sentence of the pass's instructions. Its "never list these" list now names a statement that the material does not contain, state or settle something, and declining to give a figure that cannot be verified.
- **Why wording and not code:** the pass decides what to list; nothing in code can tell an honest "that isn't there" from an invention without reading the material as the pass does.
- **Why this is not the 2026-10-01 "honest limit" exemption again:** that wording was broader, was judged neutral and was withdrawn; a test pinned its absence. The E19 clause is narrower, and the test now pins it.
- **Result:** development replay on 470 passes, the 88 rows that differ: 8.29 → 8.68, hard fails 12 → 7, invention flags 11 → 6; where the asked fact is absent (35 rows) 8.19 → 8.63. In the app on the same 88 questions: 8.50 → 8.62. Blind holdout: section 7.6. Pass time at the slow end +224 ms on development and +88 ms on the holdout, inside the 300 ms bar.
- **Checked before landing** (fresh build, macOS, plain `node --test`): type check clean; 111 focused tests pass; `electron/llm` 6,036 pass and 0 fail; `electron/intelligence` and `electron/context-intelligence` 0 fail of 2,917; `electron/services` 122 fail of 5,730, identical on the commit before E19 (trap 9 in section 5).

---

## 9. What changed in the prompts

Almost every kept change is about *what reaches* the prompt (whole files, whole profile, more speech, the fix-up pass seeing the whole prompt), not its wording. The answer model's instructions were not reworded by this work.

One wording change is on main: E19, in the fix-up pass (`electron/llm/claimVerifier.ts`, constant `LIST_THEN_REWRITE`). Every other wording that was tried was rejected:

| Change | Text | Why tried | Status |
|---|---|---|---|
| E19 | The "Never list these" sentence gains: a statement that the material does NOT contain, state or settle something; and declining to give a figure they cannot verify | The pass removed honest statements of absence | **On main** (`73b18d97`) |
| E6 v1, v2 | CONFLICT line fires only for two sources of equal standing (two wordings) | The pass hedged between a current document and an outdated one | Not kept: +0.06 (±0.08), not distinguishable from zero |
| E9 | Names two shapes of invention when the asked fact is absent | On 7 of 11 rows that hard-failed with no document needed, the pass ran and left the invention in | Nothing concluded |
| E15 (two wordings) | A note in the answer prompt for typed questions | A privately typed question was answered as a line to say to the other person (10 of 91 typed rows) | Not kept: failed all three lines |
| E17 | CONFLICT line fires only when the material does not settle it; rule 3 forbids adding a second value | Same as E6 | Not kept: conflict-ignored flags 1 → 5 |
| E18 | CONFLICT line ends "settled: X" or "open"; settled → give the current value | Same as E6 | Not kept: conflict-ignored flags 3 → 13, hard fails 27 → 34 |
| "CHECK:" line (two wordings) | The pass quotes the material for each statement before listing | The pass wrote "UNSUPPORTED: none" on 21 of 34 answers capped for an invented detail | Dropped, never declared: it removed worked-out figures and honest conclusions from 12 of 28 drafts scored 9.5 or above |
| "Decide, then say it" notice | Beside "# Today" in the answer prompt: the deciding fact before the verdict | 13 answers contradict themselves | Dropped, never declared: fixed two rows, broke a third |

**Closed, do not re-propose:** any rewording of the pass's conflict line (E6, E17, E18), any rail on that line's text (E20), a per-statement check line, the "decide, then say it" notice, a pass sentence gated on denials, a generator notice for multi-source omissions, a rail on edits that drop a fact.

Section 13 prints the pass's instruction block as it is on main and the full text of every variant file, so a rejected wording is not re-proposed by accident.

---

## 10. Where the data is

| What | Where |
|---|---|
| Question sets | `evidence-rich/datasets/dev.json` (270), `dev2.json` (360), `holdout.json` (180, blind), three `supp-*.json` |
| Documents the questions rest on | `evidence-rich/evidence/files/` (104 synthetic files) and `evidence-rich/oracles/` |
| Experiment log | `evidence-rich/docs/ITERATIONS-ER.md` (printed in full as Appendix B) |
| Investigation documents | `evidence-rich/docs/` (printed in Appendix C, except the corpus index `EVIDENCE-CORPUS.md`) |
| Runs that still exist | `evidence-rich/results/`: `er4-dev-main`, `er4-dev2-main` (baseline of main), `er5-*` (E19 in app), `er3-*` (E16c), `er-holdout-m3`, `er-holdout-e16b3`; copies in `~/natively-er-backup/results/` |
| Astra judgments | `evidence-rich/judge/out/base/*.astra.jsonl` (committed) and `~/natively-er-backup/judge-out/` |
| Calibrations | `evidence-rich/judge/out/calibration/` and `~/natively-er-backup/calibration-astra-*.json` |
| Replay arms | `evidence-rich/results/replay/`: `e19-ctl`, `e19`, `e19h-ctl`, `e19h` (two repetitions), `e20`, `e20s-ctl`, `e20s`, `e20h`, `x20-*`, `gen-x20-*`, `gen-e16c3-*`; copies in `~/natively-er-backup/replay/` |
| Replay variants (every wording tried) | `evidence-rich/replay-variants/` |
| Rule checks | `evidence-rich/report/rule-e16.mjs`, `rule-e16c.mjs`, `rule-e17.mjs`, `rule-e19.mjs`, `rule-holdout-e16b.mjs`, `pair-aggregate.mjs` |
| Window scripts | `~/natively-er-backup/scripts/` (`er-window-chain-20261009.mjs`, `er-window-probe-20261008.mjs`, `er-access-guard-20261008.mjs`, `er-e19h-k1-20261009.mjs`) |
| Second session of 2026-10-09 | Runs `er6-dev-main`, `er6-dev2-main` (main with E19, unjudged bar 49 rows), `er7-chal-main`, `er7-code1-main`, `er7-chalval-main` (main on the new sets); replay arms `gen-e21-*`, `gen-e21b-*`, `gen-e21c-*`, `gen-e21d-*`, `gen-e21e-*`, `gen-e22-*`; threshold probe rows `results/x1/t12000|t24000|t48000/`; readers `report/rule-e21.mjs`, `report/x1-threshold.mjs`, `report/challenge-read.mjs`, `report/rescore-objective.mjs`; scripts in `~/natively-er-backup/scripts/` |
| This file's generator | `evidence-rich/report/build-handoff.mjs` with `report/handoff-head.md` |

---

## 11. Open decisions and next steps

**Open with Evin**

00. **After the stop of 13 October (this replaces 0a and 0 below and the decisions listed under the blocks of section 1).** Decided and done: the profile read, the AgentRouter rung and the pass off in Technical Interview are on main `cb0fadac`. Still open: (i) main `cb0fadac` has no judged score; (ii) what the app does on a question about the user's own history when no résumé is loaded (an opening the app writes itself, a "load your résumé" note, or as it is): the largest stable loss, 5 of the 8 hard fails that recur; (iii) the pass still replaces answers in Looking for work and the six other modes; switching it off in Looking for work is one line and costs 0.14 and four hard fails by the judged comparison; (iv) another session's "make things up" filter edit is still uncommitted in the main checkout; (v) `AGENTROUTER_API_KEY_3` is not a valid AgentRouter key; (vi) items 2, 3, 5 below (PR #638, old branches, Windows and a packaged build).

0a. **Decisions of 12 October, afternoon (these replace (a) and (b) of the next item).** (i) **Budget.** At about 19 cents an answer the new key buys about 850 answers; last night's judge-free work was about 9,000 calls. Either the iterations stay this small, or generation goes back to the direct key (USD 43 there), or more is added. (ii) **E42**: land the rung although one extraction in three stalled past 45 s, lengthen that limit for it, or leave it. (iii) **Landing** the layout, the profile read or both: still his word, after tomorrow's judgments; `cand/e43` shows they build and test on current main. (iv) **The pass in the interview modes**: tomorrow's draft-against-shown judgments are its A/B.

0. **Decisions of 12 October, first.** (a) **The judge has no balance**: the AgentRouter account needs a top-up before anything on the list above can be judged; the next window is Evin's to name. (b) **Generation route**: this session moved generation back to the direct DeepSeek key when AgentRouter ran out; confirm, or say that AgentRouter is to carry both (then its balance has to cover about 4,000 replay calls a night beside the judge). An AgentRouter-only profile also has no model for résumé parsing (the structured ladder has no AgentRouter rung). (c) **The layout** (`cand/e28b`): failed as registered, holds and reproduces on the same date; judge it and land it on your word, or close it. (d) **The profile read** (`cand/e38`): land on your word after its 8 judgments, or now on the judge-free lines. (e) **9.5 in every mode**: not reachable by the kind of change tried so far; the larger DeepSeek model without reasoning and temperature 0 were measured and do not help. What is left is reasoning on (ruled out by you, +1.3 s to the first word), a model of another vendor, or accepting about 9.0 in these modes. (f) **The fix-up pass in the two interview modes** (another session's uncommitted change switches it off): the 30 draft-against-shown pairs are queued (E37).


1. **Land the 24,000 threshold?** `cand/e27` `0256eed4` is one commit on main, tested and confirmed (86.1 % right against 54.3 % on packs of about 20,700 tokens; spoken first word 0.77 s earlier, typed 0.49 s later; request 3.6 times the size on those turns). Not measured: models with a small context window, Windows, a packaged build. `git merge --ff-only cand/e27` in the main checkout, after rebasing if main has moved.
2. **Merge or close draft PR #638.** Merging puts the blind holdout's questions on public main.
3. **Delete the old-history branches on GitHub** (`fix/aq-astra`, `cand/e16b`, `cand/e15`)? They keep files purged on 2026-10-06 reachable.
4. **The judged baseline of main with E19: 8.873, 78 hard fails, all 630 rows** (2026-10-10; 7.7). Not different from main before E19 on the same questions (−0.062, interval −0.22 to +0.09). **The 24,000 candidate `cand/e27` now has a judged reading on the 48 new larger-pack questions: 6.34 → 8.18, +1.83 (+0.90 to +2.77)** (7.8); landing it is his word. The candidate sits on `67fb1b24`; main has moved two commits (`95490839`, another session), so it is rebased before any landing.
5. **Windows and a packaged build.** Nothing in this work has been executed on Windows or in a packaged app.
6. **The whole-pack threshold: see 1.** X1 (synthetic), X2 (realistic packs), arm C (cloud embeddings: 63.4 %) and the candidate's confirmation run are in the log. 48,000 is not safe.
7. **The judge's quota.** Two windows on 2026-10-10: 02:05–02:51 UTC (545 judgments, both accounts then out of quota) and, after Evin replaced a key, 11:03–11:56 UTC (254 judgments, both keys out of quota again). No access block that day; the blocks of 2026-10-08 (five calls) and 2026-10-09 (three calls) were not retried. **Third block, 2026-10-11:** window 02:00–02:28 UTC, calibration 38/38, 58 judgments (E29 repetition 1 complete, 8 larger-pack rows), then one call answered the content-policy 403 at 02:28:39 and everything stopped; nothing retried, flag left in place. About 1,050 judgments are queued, and the 630 drafts after them (the "Running or scheduled" row). The judge budget, not ideas, is the limit on this work. **Settled:** a 403 that carries the quota reply goes on to the other key (Evin, 2026-10-11 IST: "nope try with the other key"); every other 403 still stops everything.
8. **Code verification is switched off app-wide** (`electron/llm/codeVerification/verificationEnabled.ts`, since 2026-07-18, no reason recorded in the commit). Main passes 34 of 36 coding questions of `code1` without it. Its correction is posted as a new message, which the benchmark harness does not capture, so it was not measured.
9. **A profile upload on DeepSeek takes about 73 s** (a résumé with a posting; 3 s with the rule-based parser it replaces), because the whole profile pipeline now runs on it, about ten calls one after the other. E26 landed with that cost stated. Shortening it (fewer calls, or in parallel) is a separate change.
10a. **Sales is the weak mode and E31 is the candidate for it: declared, not run.** Sales 8.21 with 18 hard fails of 70; over two judged runs it fails 9 of 14 evidence-missing rows (no other mode above 5) and 7 of 24 conflict rows, and is ordinary elsewhere. The answers assert something around a fact they should defer, or add an offer after a correct answer; the Sales mode block's own RIGHT example presupposes the feature it defers on. E31 rewrites that one paragraph (two replay arms, `replay-variants/e31a-…`, `e31b-…`); its rule (four judge-free lines, four judged) and the new sets `sales1` / `sales1-val` are in the log ("E31"). To run it: main in the app on `sales1` and `sales1-val` (36 rows), then `replay-generator.mjs` k = 3 on the Sales rows, three arms. **Blocked on the DeepSeek balance; the judged part also on the access-block flag.** No app change exists; landing would be Evin's word.
10. **E28b is built as E30, not measured, not landed.** `cand/e28b` `7067ab3c` (worktree `er-main`, one commit on main `cdaedfad`): on a turn with an evidence block the evidence section comes first in the user message and the question is asked again last, before the user's own instructions; a turn with no evidence is unchanged; 9 new tests, suites as main. Evin's word was "do it" (2026-10-11 IST). Its rule (seven judge-free lines, three judged) is in the log. **Blocked on the DeepSeek balance** (see the "Running or scheduled" row). **Landing is authorized in advance, on one condition:** Evin's "do both" (2026-10-10 21:21 UTC) answered "land the documents-first layout, once its lines and the judged comparison are read". So: when every judge-free line (1 to 7) and J1 to J3 hold, land it on local main (a fast-forward while main is `cdaedfad`; otherwise rebase, type check and the four suites first) and report; if any line fails it is not landed. Pushing that commit is a new question for him.

**Next candidates, in the order the data suggests**

1. **Check any candidate on unseen questions first.** `challenge` (readable) and `challenge-val` (aggregates only) exist for that and cost a few minutes of replay and no judge call. E21 would have reached an app run and an Astra window without them.
2. The largest class has no handle yet: invented company, policy, research or personal facts (22 of the 71 hard fails). Two ways of making the pass stricter were measured and removed correct inference (the per-statement check) or would hit 30 answers of which 4 are real inventions (enforcing the pass's own list). A third attempt needs a signal that separates an invention from an honest inference; none is known at this model setting. Third session (2026-10-09): three source-aware mechanisms were measured for it. E23 (résumé statements the résumé text does not support) is real but small. E24 (a notice when the posting is the only document) does not stop the posting being told as the candidate's history; what is left there is not handing the posting over as evidence on a turn that asks only for the user's own record, which needs a classifier that separates "what do you do now" from "what is this team responsible for". E25 (the pass is shown the passages nearest each sentence) nearly doubles what the pass names on drafts Astra capped (12 → 23 of 60 samples, most clearly research claims) and on unseen drafts changes more answers that were right (13.2 → 17.8 %); the same sheet for Seminar turns only is the untested lead.
3. Version conflicts are the weakest kind on the readable challenge set (4 of 9 right on main). Every rewording of the pass's conflict line and a rail on it failed (E6, E17, E18, E20); the open idea is still the source identity of each value (`source_id` / `version_id`), which the pass's conflict line does not carry.
4. A hidden working step sets a sum up wrongly when a near-miss figure sits in the pack, and then trusts it (E21 stage four, `ER-C1-SALES-013`). A check of the working's INPUTS against the documents (not of its arithmetic, which is right) is untested and would have to run before the first visible word.
5. The larger-pack condition now exists (`pack24`, X2). What is not measured on it: a cloud embedding provider and the managed reranker (arm A ran the bundled local model), the pass with its cap and budget raised, and the pack placed where the provider can cache it (the question comes before the documents in the request, so 5,248 of 29,759 prompt tokens are cache hits).
6. Follow-up turns: the pass lowered 4 of them (8.11 → 6.41). Too few to act on; worth a look when more are judged.
7. One spoken turn still takes the fast route with no profile (`ER-D2-LFW-030`); `ER-D-REC-016` is a possible delivery gap too.

**To land a future candidate:** on a fresh build of its branch run the four suites (`electron/context-intelligence`, `electron/intelligence`, `electron/llm`, `electron/services`) *and the same suites on current main as a baseline*, before the fast-forward; rebase if main has moved; fast-forward; push only on Evin's word. The project `CLAUDE.md` rules apply to any code change (cross-platform contract, graph tools first, the validation labels).

---

