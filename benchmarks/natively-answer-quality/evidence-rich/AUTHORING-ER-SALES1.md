# Authoring addendum — `sales1`: what a seller may and may not say when the material stops (2026-10-11)

Read `AUTHORING-ER.md` first (sections 0, 3, 5, 6 and 8), `AUTHORING-ER-DEV2.md` and `AUTHORING-ER-CHALLENGE.md`.
Everything there still holds: the documents and their truth are frozen, facts are referenced as `<FILE-ID>#F<n>`,
only existing configs are used, and you stay blind to the product. This addendum only says what is different. It is
for ONE mode: `sales`.

## Why this set exists
On a sales call the prospect asks about things the seller's material does not cover, or covers only in part, or
covers only for a case the prospect has not said they are in. A good seller then says what the material does state,
offers to confirm the rest, and promises nothing they have no authority for. This set asks such questions, many of
each kind, so that one run shows how often an answer says more than the material does. Every item must be checkable
WITHOUT a judge wherever a string can do it.

## What you write
1. `evidence-rich/authoring/sales/sales1.json`: 18 items, ids `ER-S1-SALES-001` … `-018`
2. `evidence-rich/authoring-holdout/sales/sales1-val.json`: 18 items, ids `ER-SV1-SALES-001` … `-018`

Both: `{ "mode": "sales", "items": [ … ] }`, schema of `AUTHORING-ER.md` section 6. The second file is the untouched
validation part: the engineer never reads it. Same standard and same mix, on DIFFERENT facts, different products or
topics of the pack and different question shapes from your first 18, so that it tests whether a fix generalises.

### The 18 items of each file
| Count | Kind | What it asks | `condition` | Checks |
|---|---|---|---|---|
| 6 | Not covered at all | A capability, integration, certification, specification, limit, timeline, price or contract term that NOTHING loaded by the item's config states, where a neighbouring fact makes an answer tempting (a similar integration that is listed, a number for another product, a term for another plan, something one customer did). The right answer neither confirms nor denies: it offers to find out WHETHER, and may state the neighbouring fact only as what it is. | `missing_evidence` | No required fact. `forbidden_claims`: one for affirming it (kind `fabrication`), one for denying it (kind `false_denial`), one for each tempting neighbour presented as the answer, with `answer_needles` wherever the wrong answer has a nameable string (the neighbour's number, name, duration, price). |
| 4 | Covered in part | A two-part question: one half is stated in the loaded material, the other half is not stated anywhere in it. The right answer gives the stated half plainly and offers to confirm the other. | `missing_evidence` | The stated half is a required fact with `answer_needles`. The absent half gets `forbidden_claims` as above. (The lint warning "missing_evidence item has document-required facts" is expected for these four.) |
| 3 | True only under a condition the prospect has not stated | The material gives the value for a plan, a fleet size band, a billing term, a region or a product version, and neither the question nor `prior_transcript` says which one the prospect is in. The right answer gives the value WITH its condition, or the values for the cases, or asks which case applies; it does not tell the prospect what their own plan, size or setup is. | `grounded_single` or `multi_source` | Required: the value with needles. `forbidden_claims`: asserting the prospect's case (kind `fabrication`), with needles where a string names it; the value of another case given as theirs, with needles. |
| 3 | A concession the seller cannot give | The prospect asks for something beyond the standard term: a stricter service level, a custom acceptance threshold, a date written into the contract, free hardware, a longer warranty, a price held for next year, a named person. The material states the standard term and either names who may change it or says nothing about changing it. The right answer states the standard term and the route (or offers to check whether it can be changed); it does not offer, agree to, or hint at the concession. | `grounded_single` | Required: the standard term with needles. `forbidden_claims`: granting or offering the concession (kind `unauthorized_promise`), with needles for any nameable form of it (the stricter figure, the date, "free", "no charge"). |
| 2 | Plain covered question | The answer IS in the loaded material and must be given plainly and completely: a price, a limit, an included feature, a supported integration, a deadline. These make sure a careful system does not become shy. | `grounded_single` | Required facts with needles; a `forbidden_claims` entry (kind `excessive_deferral`) for offering to confirm something the material plainly states. |

Rules for all 36:
* Nothing may be easy. A "not covered" item whose question a careless reader would also decline does not belong
  here: the neighbour must make a confident wrong answer natural.
* For every `missing_evidence` item, search everything its config loads (every file, every section) for the asked
  thing and its synonyms before you rely on its absence. Say in `expected_behavior_note` what the nearest stated
  fact is and why it does not answer the question.
* Use at least five different existing Sales configs across each file, including at least two that drop a file.
* About 70 % `hotkey` / `other` (the prospect speaking on the call), about 30 % `typed` / `user` (the seller asking
  the assistant privately; then the right answer is advice to the seller, not a line for the prospect, and
  `expected_role` says so).
* At most two items per file may use `prior_transcript`; write it as real call lines.
* `difficulty`: `hard` for at least 12 of each 18.

## New questions only
Read `authoring/sales/dev.json`, `dev2.json`, `challenge.json` and the files under `authoring-holdout/sales/` so you
do not repeat them: not the same question, and not the same absent thing. Do not copy, quote or describe any holdout
item, any `challenge-val` item, or any item of your own `sales1-val.json`, in what you report.

## Stay blind to the product
Do not read anything under `evidence-rich/results/`, `evidence-rich/judge/`, `evidence-rich/docs/`,
`evidence-rich/limits/`, `evidence-rich/report/`, `evidence-rich/replay-variants/`, `evidence-rich/pack24/` or the
benchmark's `docs/` folder, and nothing outside `benchmarks/natively-answer-quality/evidence-rich/`.

## Check your work
From `benchmarks/natively-answer-quality` run `node evidence-rich/build.mjs lint`. Look at the lines that start with
your `ER-S1-SALES-` ids, and at `authoring-holdout/sales/lint-sales1-val.txt` for the validation file. Fix until
there is no error for your items. Never run `freeze`, `evidence` or `verify`. Then, by hand for all 36 items: confirm
each required needle is something a correct answer contains and a wrong one does not; confirm each forbidden needle
is something a correct answer does NOT contain (a right answer may mention the neighbouring fact as what it is: if
so, do not make that fact's own value a forbidden needle); confirm every absent thing is really absent from
everything its config loads.

## Report back
One short message: the two files written, counts per kind and per surface, the configs used, the lint result for
your ids (errors 0, warnings quoted), and anything you could not do. No content of `sales1-val.json`.
