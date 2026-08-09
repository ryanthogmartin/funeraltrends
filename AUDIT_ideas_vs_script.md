# Audit — `generate-video-topics` vs `generate-script`

_Open thread 6.1 from HANDOFF_BRIEF. Read-only audit against `main` @ `9110260`. No function code changed._

## Method

The STANCE/INTEGRITY bug was found by accident. This pass is the deliberate version: every
capability one function has was checked against the other, in both directions — not just
"what is ideas missing." Each row below was read in the real source, not inferred.

Nothing here is a live-output finding; no tokens were spent. Findings A, B and F are
code-path defects provable by reading. Everything else is a parity or hardening gap.

## Parity matrix

| # | Capability | `generate-script` | `generate-video-topics` | Verdict |
|---|---|---|---|---|
| 1 | JWT identity, body `userId` ignored | ✅ | ✅ | parity |
| 2 | API key presence check | ✅ | ✅ | parity |
| 3 | CORS headers | ✅ | ✅ | identical |
| 4 | Required-field 400 | ✅ `idea` | ✅ `topic` | parity |
| 5 | Rate limit 30/hr/user | ✅ | ✅ | **separate counters — see F** |
| 6 | `thinking: disabled` + `content.find(text)` | ✅ | ✅ | parity |
| 7 | 429 / 402 / 500 error mapping | ✅ | ✅ | identical |
| 8 | AUDIENCE / STANCE / BIZ / INTEGRITY / CAT / PLATFORM / FORBIDDEN | ✅ | ✅ (since `7d0cd32`) | parity |
| 9 | Block ordering | ✅ | ✅ | identical |
| 10 | Prompt assembly via shared builder | ❌ inline | ✅ `_shared/idea-prompt.ts` | **gap — see C** |
| 11 | FATAL structural guard in tests | ❌ none | ✅ | **gap — see C** |
| 12 | `taboo_topics` honored | ⚠️ my-voice only | ❌ never | **defect — see A** |
| 13 | PRECEDENCE line (style never outranks STANCE) | ❌ | ✅ | gap — see D |
| 14 | Un-guarded "expose the industry" pressure | ❌ self-guards | ⚠️ present | **defect — see B** |
| 15 | `EXEMPLARS` | ✅ | ❌ | **intentional — see §Closed** |
| 16 | Business identity block | ✅ non-my-voice, +`signature_opening` | ✅ all tones, no `signature_opening` | documented deviation |
| 17 | Persona voice block | full `buildVoicePrompt` | narrowed `buildIdeaVoicePrompt` | documented deviation |
| 18 | Tone table covers `my-voice` | ❌ (falls back) | ✅ | minor — see G |
| 19 | Anti-repetition (fingerprints/similarity) | ✅ | ❌ | known, thread 6.2 |
| 20 | Server-recomputed `wordCount` | ✅ | n/a | n/a |
| 21 | Output array hardening | ✅ `Array.isArray` + filter | ❌ raw `parsed.ideas` | gap — see E |
| 22 | Per-item length cap on client text | ✅ slice(0,160) / (0,500) | ❌ count-capped only | minor — see H |
| 23 | `stop_reason: max_tokens` handling | ❌ | ❌ | shared gap — see I |
| 24 | Default `tone` value | `straight-shooter` (retired) | `straight-shooter` (retired) | minor — see G |

---

## A. HIGH — `taboo_topics` is ignored on the default tone, and everywhere in ideas

`taboo_topics` is a real user-facing field. `src/pages/VoiceProfile.tsx:457` asks
_"Any topics you want the AI to AVOID?"_ and promises _"the AI will never include these in
your scripts."_ Placeholder examples: `Never mention embalming details, avoid politics,
don't reference specific religions`.

It is consumed in exactly one place: `generate-script/index.ts:151`, inside
`buildVoicePrompt`. `buildVoicePrompt` runs only when `tone === 'my-voice'`
(`generate-script/index.ts:271`). The `else` branch (`:274-281`) builds `businessIdentityPrompt`
from `funeral_home_name`, `specialties`, `signature_opening` — **no `taboo_topics`**.

Consequence:

- **Scripts on Compassionate Educator — the tone the UI preselects — silently ignore the
  director's "never mention" list.** So do Neighbor and Comforting Guide. Only My Voice honors it.
- **Idea titles never honor it on any tone.** `_shared/idea-voice.ts` documents its exclusions
  (`signature_opening`, `catchphrases`, `sample_script`, `pacing_style`, `cta_style`) and
  `taboo_topics` is not among them — it was not excluded by decision, it was missed.

This is the same shape as the STANCE/INTEGRITY bug: a safety constraint that exists in the
codebase, is promised in the UI, and never reaches the live prompt on the default path.
Unlike the other voice fields it is a **constraint, not a performance flourish** — the reason
they were held back from titles does not apply to it.

Needs your ruling (both are product calls, not mechanical fixes):
1. Should `taboo_topics` apply to **every** tone in scripts, not just My Voice?
2. Should it apply to **idea titles** on every tone?

My recommendation is yes to both. A director who wrote "avoid politics" did not mean
"avoid politics only when I pick one specific tone."

## B. MEDIUM — an ideas rule actively pushes against STANCE

`_shared/idea-prompt.ts:80`:

> `- Each idea should be something the viewer couldn't have Googled ... things the industry usually avoids saying publicly`

STANCE (`content-context.ts:16`) forbids exactly this posture:

> `NEVER imply funeral homes hide information ... No "most funeral homes won't tell you," no "they don't want you to know," no us-vs-them.`

The PRECEDENCE line added in `7d0cd32` (`idea-prompt.ts:82`) means STANCE wins the collision —
but the collision is still being manufactured on every single request. This is structurally
identical to the punchy-headline-vs-STANCE pressure that made titles assert law: a rule that
has to be overridden by another rule on every call.

`generate-script` does not have this problem — its equivalents self-guard in place
(`index.ts:73` _"never 'exposing' the industry"_; `index.ts:374` _"a gotcha or 'they don't
want you to know' angle is not"_). Ideas is the odd one out.

Suggested rewrite of `:80` — keeps the "not Googleable" value, drops the exposé framing:

> `- Each idea should be something the viewer couldn't have Googled to find at the top of results — insider knowledge and unexpected angles, the things families are relieved to learn from someone who does this work.`

Worth testing live, not just swapping — this line drives idea quality.

## C. MEDIUM — `generate-script` has no shared builder and no structural guard

`generate-script/index.ts:321-346` assembles its system prompt inline. Nothing imports it,
so nothing can assert on it. There is **no test file for either function** in the repo — the
harnesses described in the brief were run ad hoc and not committed.

Right now the assembled prompt is correct: `STANCE` at index 3, `INTEGRITY` at index 5,
ordering matches ideas. **This is a regression risk, not a present defect.** But it is the
exact configuration that hid the ideas bug for four rounds, and Finding A shows the
class is live in this file in another form.

The fix mirrors what already worked: extract to `_shared/script-prompt.ts` with
`buildScriptSystemPrompt()` / `buildScriptUserMessage()`, have the function and every test
import it, and add the same pre-token FATAL guard. Note that `_shared/` is shared by both
functions, so **this requires redeploying both** (brief §1).

This is a real change to the live script path and deserves its own spec.

## D. LOW — no PRECEDENCE statement in `generate-script`

Ideas got an explicit "style guidance never outranks STANCE/INTEGRITY" line. Scripts did not.
Scripts guard inline instead (see B), which mostly covers it — but there is one uncovered
surface: `buildVoicePrompt` injects up to 1200 chars of the director's own `sample_script`
plus `catchphrases` into the system prompt at `index.ts:150-152`, positioned **after**
STANCE/INTEGRITY. Nothing tells the model those blocks outrank an imitated sample. A
director whose sample script happens to be salesy is, today, feeding that in unopposed.

Low severity — the input is the director's own writing, not hostile. Worth one line if C happens.

## E. LOW — `parsed.ideas` is returned unvalidated

`generate-video-topics/index.ts:232-233` returns `parsed.ideas || []` with no type check.
`generate-script` hardens its equivalent (`index.ts:480`,
`Array.isArray(parsed.hookVariants) ? ...filter(...) : []`).

If the model returns `{"ideas": {...}}` or an array with a non-string entry, the client
(`src/pages/VideoIdeas.tsx:139`, `setIdeas(data.ideas || [])`) has no guard either and will
render-crash on `.map`. Low probability, trivial fix, no product judgment involved.

## F. LOW (worth knowing) — the 30/hr cap is really 60, and the retry is uncounted

Two independent things, same subsystem:

1. The counter is keyed per function name (`generate-script/index.ts:243`,
   `generate-video-topics/index.ts:107`), so a user gets 30 scripts **plus** 30 idea batches
   per hour — 60 AI calls, not 30.
2. The anti-repetition retry (`generate-script/index.ts:430`) makes a **second Anthropic call
   under the same increment**. Worst case a user's 30 counted script generations cost 60
   upstream calls.

Combined worst case is 90 Anthropic calls/hour/user against a nominal cap of 30. Given the
brief notes the key is on the lowest usage tier, that matters for cost more than abuse.
Not obviously wrong — just not what "30" implies. Your call whether to change it.

## G. LOW — retired default tone; `my-voice` fallback differs

Both functions default `tone` to `"straight-shooter"`
(`generate-script/index.ts:205`, `generate-video-topics/index.ts:60`) — a tone retired from
the UI. Only reachable when a caller omits `tone`; the frontend always sends it. Default
should probably be `compassionate-educator` in both, matching the UI.

Separately: `TONE_CONTEXT` (`generate-script/index.ts:70-79`) has no `my-voice` key, so a
My Voice request from a user with **no** voice profile row falls back to
`compassionate-educator`. Ideas resolves `TONE_LABELS['my-voice']` and gets
_"Warm, personal, and specific to this business"_. Different copy for the same state.
Cosmetic, but it's a divergence.

## H. LOW — `previousIdeas` items are count-capped but not length-capped

`generate-video-topics/index.ts:67-69` caps the list at 24 entries with no per-string limit.
`generate-script` caps its client-derived text (`slice(0,160)`, `slice(0,500)`). In practice
these are model-authored titles from the client's own session ref, so this is a direct-API
concern only. One `.slice(0, 200)` closes it.

## I. LOW — neither function handles `stop_reason: 'max_tokens'`

Both use `max_tokens: 1000` and neither inspects `stop_reason`. A truncated response yields
invalid JSON and a generic 500 — "Failed to parse AI response" — with the real cause
(truncation) invisible in the logs. Shared gap, cheap to log.

---

## Closed questions

**`EXEMPLARS` should stay out of ideas — recommend closing this as decided, not omitted.**

The brief lists it as "never a decision, just an omission." Having read them: they are seven
multi-sentence spoken passages that teach script cadence, and adding them to an ideas prompt
would be actively harmful, not merely useless. Three of the seven turn on `[state]` and legal
framing — _"it's one of the most regulated processes in funeral service, here in [state]"_,
_"There's legislation sitting in [state]"_ (`content-context.ts:141,147`). Feeding
state-anchored legal exemplars into the prompt that was just fixed for pairing named states
with legal requirements pushes directly against that fix. They also cost ~1,400 tokens per
call to teach a cadence that eight-word titles never use.

---

## Recommended order

1. **A** — decide the two `taboo_topics` questions. Broken UI promise on the default path;
   the only finding where a user is being told something untrue today.
2. **B** — reword `idea-prompt.ts:80`. Small, but it removes a standing collision with STANCE
   rather than relying on PRECEDENCE to win it every time. Verify live.
3. **E, G, H, I** — mechanical hardening, no product judgment, could be one small branch.
4. **C** — extract the script prompt + FATAL guard. Biggest and most valuable structurally,
   but it touches the live script path and `_shared/`, so it needs its own spec and a
   both-functions redeploy.
5. **F, D** — informational; act only if you want the behavior changed.

Thread 6.2 (anti-repetition for ideas) is untouched here, per the standing request not to
bundle it.
