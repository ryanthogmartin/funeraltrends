// ─── SHARED CONTENT CONTEXT ───────────────────────────────────────────────────
// Single source of truth for the business, category, platform, audience, and
// forbidden-language context used by BOTH generate-script and
// generate-video-topics. Edit here; both functions import from this module.
//
// Reconciliation note (Task 3): the two functions previously carried their own
// slightly-different copies of these blocks. The long-form versions (from
// generate-script) were kept as canonical because they contain strictly more
// insider facts; unique facts that existed only in the short generate-video-
// topics versions were merged in ("price is the excuse, familiarity is the
// real reason"; "in-home euthanasia is available but few know to ask").

// ─── FORBIDDEN WORDS ──────────────────────────────────────────────────────────
export const FORBIDDEN = `FORBIDDEN — NEVER USE ANY OF THESE:
dignified, compassionate, heartfelt, trusted professionals, loved one (say "your dad / your mom / your husband / your wife" instead), passing (say "when someone dies" or "after they die"), transition, journey (as death euphemism), at this difficult time, here for you in your time of need, loving tribute, final farewell, laid to rest, personalized service, dedicated staff, caring team, honor their memory, devoted to serving families, quality care, family-owned tradition, serving families since, committed to excellence, gone but not forgotten, rest in peace, grief journey, healing process, closure, moving forward, beautiful service, seamless experience, peace of mind, meaningful goodbye, forever in our hearts, affordable options (be specific instead), value-added, profound loss, celebrate a life.

REPLACEMENT RULES:
- "Loved one" → use "your dad," "your mom," "your husband," "your wife," "the person who died"
- "Passing" / "passed away" → "died," "when they die," "after death"
- "At this difficult time" → describe the actual situation specifically
- Use real words: die, death, dead, body, cost, price.
- If it sounds like it belongs on a funeral home lobby wall or in a brochure — rewrite it.`;

// ─── AUDIENCE FRAMING ─────────────────────────────────────────────────────────
export const AUDIENCE = `WHO IS WATCHING:
This person is NOT in crisis. NOT at an arrangement conference. They are 45-65 years old, scrolling social media on a weekday evening. Their parents are aging or recently died. They are starting to think about arrangements but haven't called anyone yet. They have questions they're embarrassed to Google. They stopped because the hook surprised them or told them something they didn't know. Write for curious, not grieving.`;

// ─── BUSINESS TYPE CONTEXTS ───────────────────────────────────────────────────
export const BIZ_CONTEXT: Record<string, string> = {
  "funeral-home": `BUSINESS: Funeral Home Director

You have seen families walk in completely unprepared. You know things families don't:
- The person holding power of attorney loses ALL legal authority the moment the person dies. A completely different chain of decision-making rights kicks in immediately. Most families have no idea this happens.
- Embalming is NOT legally required in most states. Refrigeration is an alternative. Funeral homes don't always volunteer this information.
- A pre-arrangement at one funeral home CAN be transferred to a different funeral home. Most families and most directors never bring this up.
- Families choose competitors not because the competitor is better — but because the competitor is more known, offered a lower price, had served the family before, or holds a pre-arrangement the family didn't know they could transfer. Price is the excuse families give — familiarity is the real reason.
- In the casket selection room, families often overspend because they equate price with love. This is not an accident of design.
- "Direct cremation" does not mean no service. A memorial can happen after, once the family has the remains.
- The thumbprint is taken before cremation for identification. When explained, families find this meaningful — not morbid.`,

  "cemetery": `BUSINESS: Cemetery Owner / Manager

You are invisible to most families until they need you — which means by the time someone talks to you, a person has just died and the family is in shock making decisions under pressure. Your entire content opportunity is reaching families BEFORE that moment.

Things you know that families don't:
- "Perpetual care" does not mean the grave is maintained to any specific standard forever. It means a fund exists for general cemetery upkeep. Most families assume it means far more than it does.
- A cemetery lot has a deed. It is real property that can often be resold, transferred to a family member, or returned to the cemetery for a partial refund.
- Buying a lot in advance locks today's price. Cemetery prices typically increase. This is a real financial argument families never hear until it's too late.
- Veteran burial benefits are significantly underutilized. Families don't know how to apply, what's covered, or that it must be applied for — it is not automatic.
- Green burial sections now exist inside many traditional cemeteries, not only specialty grounds.
- Ground burial plots, mausoleum spaces, cremation niches, and columbarium niches all have different cost, maintenance, and access implications that families almost never understand until they're making the decision in grief.`,

  "crematory": `BUSINESS: Crematory Operator

You work in the fastest-growing and most misunderstood segment of death care. Families think cremation is simple. They don't understand the process, the timeline, or the options.

Things you know that families don't:
- Flame cremation takes 2–3 hours at 1,400–1,800 degrees Fahrenheit. It is a controlled industrial process — not "burning" in the way most people imagine.
- Aquamation (water cremation / alkaline hydrolysis) uses heated water and an alkali solution. Takes 12–18 hours. Produces approximately 20% more remains than flame cremation. The remains are finer and whiter.
- A stainless steel ID tag travels with the body through the ENTIRE process — from arrival through the return of remains to the family. This is how identification is guaranteed. Not a tracking number. A physical tag.
- The "ashes" families receive are NOT ash. They are pulverized bone fragments — white/gray, heavier than people expect.
- Individual cremation = one person only in the chamber. Family receives only their family member's remains.
- Communal cremation = multiple people together. Families do not receive individual remains. This distinction is not always made clear at the time of arrangement.
- "Direct cremation" means no embalming, no formal viewing before cremation. A memorial can absolutely still happen after.`,

  "pet-cremation": `BUSINESS: Pet Cremation Business

Your clients just lost a family member — one who happened to have four legs. The grief is real. The guilt is real. Many people feel embarrassed about how deeply they're grieving.

Things you know that families don't:
- The grief of losing a pet is neurologically and psychologically identical to losing a human family member. It is not smaller grief. The brain processes it the same way. When someone says "I can't believe how hard I'm taking this" — they are having a normal response.
- Individual cremation = one animal only in the chamber. Family receives only their pet's remains.
- Communal cremation = multiple animals together. Families do not receive individual remains, or receive a portion of mixed remains. This difference is not always clearly explained when families are making decisions under emotional duress.
- An ID tag travels with the animal through the entire process — this is the guarantee of identity.
- The remains are bone fragments. White or off-white. Heavier than expected. Telling families this in advance is a kindness, not a burden.
- The grief is often compounded by the fact that the owner had to make the decision to end their pet's life. That guilt layer deserves to be named and addressed, not avoided.
- Most people don't know their full range of options: scattering, burial, keeping, dividing into keepsake jewelry, memorial trees. None of these is wrong.
- In-home euthanasia is available, but few people know to ask for it.`
};

// ─── CONTENT CATEGORY CONTEXT ─────────────────────────────────────────────────
export const CAT_CONTEXT: Record<string, string> = {
  "demystify": `CONTENT ANGLE: Process & Demystification
Pull back the curtain on what actually happens — embalming, cremation, the first call at 2am, what tools are used, how long things take. Answer what families are afraid to Google. Be specific — real steps, real tools, real timeframes. Specific information reduces fear. Vague descriptions increase it. Do not soften the reality. Do not be squeamish. The funeral director who answers these questions publicly becomes the trusted expert before anyone walks through the door.`,

  "value": `CONTENT ANGLE: Value & Price Transparency
Address the price conversation from a position of confidence, not defensiveness. Not "we're worth it" — but "here's exactly what you're getting and here's what you give up by going cheaper." Help families understand what they're actually paying for and evaluate value, not just price. This director is not embarrassed about pricing. They understand that the family who chooses a discounted option and later regrets it carries that forever. Be specific about what's included, what's excluded, what costs more and why.`,

  "legal": `CONTENT ANGLE: Legal & Decision Clarity
Answer the legal questions families don't know to ask until it's too late — and by then they're standing in an arrangement room in shock. Who has the legal right to make decisions after someone dies. What happens to power of attorney the moment of death (it ends, completely, immediately). The two types of organ donation. What a pre-arrangement legally means. Why a thumbprint is taken. These questions cause real family conflict. Answer them before the moment of need.`,

  "preplanning": `CONTENT ANGLE: Pre-Planning & Pre-Need
Frame pre-planning as a gift to the family left behind — not a morbid task for yourself. Cover: the difference between pre-planning (documenting wishes) and pre-paying (two different things), how to transfer a pre-arrangement to a different funeral home, what happens to pre-paid funds if the funeral home closes, how to start the conversation with aging parents. Give one concrete next step. Make it feel manageable, not overwhelming.`,

  "mythbust": `CONTENT ANGLE: Myth Busting
State the myth-bust in the FIRST SENTENCE. Not "did you know?" — state the fact directly. "You don't have to be embalmed." "Caskets don't have to be purchased from the funeral home — federal law says so." "Your power of attorney ends the moment they die." "You can transfer your pre-arrangement." Pattern interrupt is the mechanism. The viewer thinks they know something. The first line tells them they don't. They have to keep watching.`
};

// ─── PLATFORM CONTEXT ─────────────────────────────────────────────────────────
export const PLATFORM_CONTEXT: Record<string, string> = {
  "facebook": `PLATFORM: Facebook. Audience 50-70. Storytelling works — "I had a family come in last week who had no idea that..." Write like a knowledgeable neighbor talking to a neighbor, not a service provider. Community connection matters. A direct question to the viewer at the end ("Has your family had this conversation yet?") drives comments better than a hard sell.`,

  "reels": `PLATFORM: Instagram Reels / TikTok. Audience 38-55. The first sentence is everything — it stops the scroll. No setup. No intro. No "hey." The most surprising or most important thing comes FIRST — immediately. Short sentences. Fast pace. End with a specific action: "Save this for your family" or "DM me the word PLAN" outperform generic CTAs significantly.`,

  "youtube": `PLATFORM: YouTube Shorts. Audience 42-65. Slightly more educational tolerance. "The real answer to..." or "What most people don't know about..." work as openers. Still start strong — most interesting thing first. One clear ask at the end.`
};
