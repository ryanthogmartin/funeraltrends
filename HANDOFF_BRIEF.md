# FuneralTrends — Handoff Brief

_Last updated: 2026-08-08. Written for a fresh session with no prior context._

---

## 1. How this project deploys (read first)

**Supabase project `gaaxslezqzzujfrtkdpo` is owned by Lovable, not by Ryan's Supabase
account.** The CLI and the Supabase MCP cannot reach it. Every schema change, edge-function
deploy, secret, and frontend publish goes through **a message pasted into Lovable's chat**.

Consequences that bite:

- **You cannot deploy. Never claim something is live because you pushed it.** Pushing to
  `main` changes nothing in production until Lovable redeploys.
- **Lovable re-records repo-authored migrations under its own timestamps** rather than
  registering the files. Twice this session that left duplicate migrations in the repo that
  had to be deleted (prod's `schema_migrations` is the source of truth — ask Lovable to run
  `select version from supabase_migrations.schema_migrations order by version`). Prefer
  handing Lovable the SQL directly over authoring migration files.
- `generate-script` and `generate-video-topics` share `_shared/`, so **a change to any shared
  file requires redeploying both**, even when only one function file changed.
- Tables `function_rate_limits` and `script_fingerprints` have RLS enabled with **zero
  policies on purpose** (deny-all to clients; edge functions use the service role and bypass
  RLS). Lovable's security scanner flags this as a warning — **it is a false positive; do not
  "fix" it**, that would grant client access to tables correctly locked down.

## 2. Current state

`main` = **`255194a`**. Working tree clean. **Merged but NOT deployed** — Lovable must
redeploy **both** functions (`_shared/` changed).

Latest work closed open thread 6.1 (the ideas-vs-script audit). See
`AUDIT_ideas_vs_script.md` for the full parity matrix and `SPEC_taboo_safety_layer.md` for
the spec that came out of it. What landed:

- **`taboo_topics` now reaches both paths on every tone** (was 1 of 8 path+tone
  combinations — my-voice scripts only — while the UI promised "the AI will never include
  these in your scripts"). Lives in `buildTabooBlock()` in `_shared/content-context.ts`,
  applied immediately after `FORBIDDEN`. It is a constraint, not a voice flourish —
  **do not move it back into a voice builder.**
- **`generate-script` now assembles through `_shared/script-prompt.ts`.** Neither function
  builds a prompt inline any more.
- **`supabase/functions/_tests/`** — 17 tests, and a structural guard that provably fails
  against the historical bug (run against `02554e1^` it reports 5 of 8 blocks missing).
  `deno` is installed but **not on PATH**: `~/.deno/bin/deno test --allow-read supabase/functions/_tests/`
- Ideas rules no longer instruct the exposé posture STANCE forbids, and no longer render
  "Pet Cremation Business industry".

Branches kept, all merged: `audit-ideas-vs-script`, `mechanical-hardening`,
`script-prompt-builder`, plus the older `prompt-voice-safety-layer`,
`prompt-edits-round2/3/4`, `frontend-tone-unification`, `ideas-business-identity`,
`ideas-persona-voice`, `fix-ideas-missing-safety-blocks`.

Live at https://funeraltrends.ai. Model is **`claude-sonnet-5`** on both functions with
**`thinking: {type:'disabled'}`** — deliberate: adaptive thinking is Sonnet 5's default and
added ~2x cost and latency for no quality gain on these heavily-specified prompts. Verified
against the live API before shipping.

### Sonnet 5 migration gotchas already hit (don't rediscover these)

1. Non-default `temperature` → **400**. Removed from both functions.
2. Adaptive thinking on by default → a thinking block precedes the text block, so
   `content[0].text` returned `''` and the function 500'd with "Failed to parse AI response."
   Both functions now do `content.find(b => b.type === 'text')`.
3. Asking the model to *reason about* a rule, with thinking disabled, makes it narrate that
   reasoning into the output and break JSON. Prompt rules must be stated as rules, never as
   deliberations — `_shared/content-context.ts` INTEGRITY ends with an explicit
   "apply silently, return only the requested format" line for this reason.

## 3. The architecture that matters: shared builder + FATAL guard

**Why it exists.** `generate-video-topics` never imported `STANCE` or `INTEGRITY`. Every
stance and factual rule written across four rounds governed **scripts only**. The
verification harnesses reconstructed the ideas prompt *by hand* and included both blocks — so
they measured a prompt production does not build. Four rounds of green tests sat on top of a
live path whose idea titles asserted named-state law ("Texas does not require embalming by
law") under a licensed funeral director's name. The harness was the bug.

**The fix is structural, not a patch:**

- `supabase/functions/_shared/idea-prompt.ts` is the **single source of truth** for idea
  prompt assembly: `buildIdeaSystemPrompt()`, `buildIdeaUserMessage()`, `bizLabelFor()`,
  `TONE_LABELS`. Block order matches `generate-script`:
  `AUDIENCE → STANCE → BIZ_CONTEXT → INTEGRITY → CAT → PLATFORM → tone → identity → voice → FORBIDDEN → rules`.
- `generate-video-topics` calls those builders. **No inline prompt assembly.**
- **Every test imports the same builders.** A harness that reconstructs a prompt by hand is
  the defect that caused this; don't reintroduce one.
- Harnesses run a **structural guard before spending a token**: build the real prompt, assert
  `STANCE / INTEGRITY / stateRule / viewingRule / PRECEDENCE` are present, and `Deno.exit(1)`
  with FATAL if any is missing. Against the pre-fix code this guard fails immediately — which
  is the point. It converts an invisible class of bug into a loud one.

`generate-script` still assembles its prompt inline. **It is not covered by this guard** —
see open thread 4.1.

## 4. Content rules (all in `_shared/content-context.ts`, shared by both functions)

Rulings from Ryan, who is the licensed authority — don't relitigate these:

- **Refrigeration ≠ embalming.** Refrigeration buys time; embalming preserves for a viewing.
  Never framed as interchangeable or either/or.
- **Unembalmed public viewing** is technically possible but rarely recommended — never framed
  as a normal, appealing, or default option, and never built into a title as a selling point.
  A neutral mention as a narrow exception is fine.
- **Law:** never volunteer it, never infer a jurisdiction from the business name ("Lone Star"
  is not Texas). When the *user's own* question raises law or names a place, answer generally,
  say specifics vary by state, point back to the funeral home. **A title may raise the legal
  question but must never pair a named state with the requirement** — the body handles the
  state.
- **Never invent** prices, dollar figures, or business-specific numbers — use `[placeholder]`.
  General profession facts ("embalming takes about 2–3 hours") are fine and are **not**
  placeholdered; only business-specific and state-legal specifics are.
- **PRECEDENCE**: in `RULES FOR IDEAS`, style guidance ("statements not questions", "specific
  beats vague") explicitly never overrides STANCE/INTEGRITY. This collision is what made
  titles assert law — punchy-headline pressure beat the safety rules until the precedence was
  stated outright.
- Script length runs 50–70s and that is **accepted** — do not "fix" it. `wordCount` is
  computed **server-side** from the returned body (the model's self-report was wrong by up to
  18 words) and the server value wins.

## 5. Verified vs pending

**Verified live in production:** JWT enforcement (401 unauth on both functions); spoofed
`userId` in the body ignored (identity from JWT only); rate limit 429 on the 31st generation
in an hour; the five dropped trend tables gone; server-side `wordCount` exact (119 = 119);
tone lineup identical across all three pickers with Compassionate Educator preselected;
`previousIdeas` accumulating through the real UI (0 then 8); business identity and persona
voice reaching idea titles; the legal-question path no longer 500ing.

**The STANCE/INTEGRITY fix in `7d0cd32` is verified BOTH ways — harness and live agree.**

- Harness (through the shared builder): structural guard all-true; 6 legal prompts naming
  TX/CA/FL/NY/OH/AZ → **0/48 titles pairing a state with the requirement, 0 naming a state at
  all**; 4 unembalmed-viewing prompts → 5 flags, all reviewed by Ryan as the
  question-then-honest-answer pattern; 0 format breaks.
- **Live, against the deployed function, identical six states: 0 violations, 0 states named,
  48/48 clean.** The Florida prompt that broke Round 4 is clean. Titles now route the state
  into the body correctly — e.g. *"Whether embalming is required depends on your state and
  your plans, not just the calendar."*

> **Standing rule agreed with Ryan: if a live run disagrees with a harness, it blocks and the
> commit gets reverted — regardless of how clean the harness was.** The harness has lied
> before (see §3). Live is the only check that counts. This time they agreed.

**Verified against the live model for `255194a` (43 calls + a 7-call re-run), NOT against the
deployed functions** — there was no deployed version of the change to test, so this is a
weaker claim than the deployed-function checks above and should not be read as the same
thing. `taboo_topics` reach 1/8 → 8/8 path+tone combinations; injection payload in the taboo
field contained (0 outputs asserted it, 0 named any state in 44KB of transcript); the rules
rewrite did not flatten titles (20.4 vs 19.6 avg words, 15 vs 16 concrete nouns, 0 exposé
posture in both arms); the `script-prompt.ts` refactor byte-equivalent to the old inline
assembly across 3,661 input combinations.

**Not verified:** PDF export, save-idea flow, signup/login. `script_fingerprints` row growth
can't be checked from the client (RLS denies) — ask Lovable to run
`select count(*), max(created_at) from script_fingerprints;`.

**Testing protocol:** local generations need an Anthropic key. Ryan stages a **throwaway** key
at `~/.anthropic_test_key` (chmod 600), the harness reads it and never prints it, the file is
deleted right after the run, and **Ryan revokes the key in the console** — console revocation
is the real cleanup, not the file delete. Never ask for a key to be pasted into chat.

## 6. Open threads

### 6.0 CLOSED — 6.1 audit, and what it left behind

The audit is done (`AUDIT_ideas_vs_script.md`). Two residuals were **deliberately ticketed,
not fixed** — don't rediscover them as new:

1. **Topic-equals-taboo collision.** When the director's avoid-list names the same subject
   as the requested topic, scripts still deliver it ~1/3 of the time; ideas are clean 32/32
   (eight titles give room to pivot, one script does not). **This is not a prompt-strength
   problem — do not try to fix it by strengthening the prompt.** A tightening pass was
   written, live-tested and reverted (`33472d4`): it moved the leak from 1/3 word-level to
   0/3 word-level but left 1/3 **subject**-level, delivering cremation as "the ashes
   returned after" and "before that final step", and pushed vague circumlocution in idea
   titles from 2/32 to 4/32 against FORBIDDEN's no-euphemisms rule. Camouflaged leaks are
   worse than visible ones. The fix is pre-call collision detection plus telling the user.
   Evidence: `LIVE_RUN_taboo.txt`, `LIVE_RUN_taboo_s5.txt`.
2. **Zero-ideas silent success** — an empty ideas array returns `success: true` and the
   frontend renders a blank list with no error.

Also still open from the audit: Finding F (the 30/hr cap is really up to 90 upstream calls —
per-function counters plus an uncounted anti-repetition retry; **held deliberately**, it is
billing-relevant and collides with 6.2) and Finding D (no precedence line protecting
STANCE/INTEGRITY from `sample_script` in the my-voice persona block).

### 6.1 ~~Audit `generate-video-topics` against `generate-script`~~ — DONE, see 6.0

The missing STANCE/INTEGRITY was found by accident, from a live/harness split. **Nobody has
systematically diffed what one function has and the other doesn't.** Known deltas still
standing:

- `generate-script` has anti-repetition (fingerprints, similarity retry, `similarityWarning`);
  ideas have none.
- `generate-script` assembles its prompt inline and is **not** covered by the shared builder or
  the FATAL guard — the same class of bug could be sitting in it right now, undetected.
- `generate-script` includes `EXEMPLARS`; ideas do not (may be correct — exemplars teach script
  cadence — but it was never a decision, just an omission).

Do this as a deliberate audit, not opportunistically.

### 6.2 Anti-repetition for ideas

Deliberately kept out of scope across every round this session; Ryan asked repeatedly that it
not be bundled. Current state: `previousIdeas` (client-accumulated titles per topic, capped at
24, sent on regenerate) is a **frontend-only, session-only** mechanism — refresh the page and
the memory is gone. There is no server-side fingerprinting for ideas equivalent to
`script_fingerprints`. That's the gap.

### 6.3 Smaller items

- `auth-email-hook` still uses Lovable's email service (`LOVABLE_API_KEY`) — the last Lovable
  service dependency. Blocked on a Resend-vs-Postmark decision.
- No pg_cron cleanup verification since the jobs were created (`cleanup-rate-limits` daily
  7-day retention, `cleanup-script-fingerprints` daily 30-day). Worth one Lovable query to
  confirm they've actually been firing.
- Anthropic key is on the lowest usage tier — rapid test bursts hit upstream 429/500s. Normal
  one-at-a-time use is unaffected.
- A failed generation still consumes one of the 30 hourly rate-limit slots (counter increments
  before the Anthropic call — correct for abuse prevention, worth knowing).

## 7. Working agreements with Ryan

- **Spec-driven.** He writes specs (`~/Downloads/*_spec_*.md`) and expects: work on a branch,
  read the real files before editing, treat find/replace anchors as intent not byte-exact,
  `deno check`, **generate real sample output and paste it before merging**, don't deploy.
- **Flag scope deviations, never hide them.** Several times the right fix touched a file
  outside the spec (a third tone picker, the ideas RULES precedence line). Say so explicitly
  with the rationale and let him rule.
- **Adversarial verification over random sampling.** Random topics under-detected twice.
  Engineer prompts to trigger the failure, run 5+, and paste raw output with per-item markers —
  he reads the titles himself and does not want a pass/fail summary alone.
- **Report regex false positives as false positives.** Over-sensitive checks are fine; passing
  off a regex artifact as a real finding (or vice versa) is not.
- He uses "profession", not "industry", for funeral work.
