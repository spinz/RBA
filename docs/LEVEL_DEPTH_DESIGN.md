# First Five: Level Depth Design

This pass keeps the campaign at five levels. It adds one optional pickup route,
introduces the charging beetle and reed spitter in isolation before combining
them with earlier skills, and makes the last stage a homeward victory lap. The
level data remains in `src/web/data/levels.json`; these notes explain the
intended safe routes and the placement choices that matter for playtesting.

## Stage-by-stage intent

### 1. Lilypad Lagoon — movement and shield

The player starts on the broad ground at x=0–500. The bubble shield at (430, 400)
floats over the short raised ledge near the end of that safe opening, before the
first beetle at x=740. It is a forgiving introduction to the pickup and is not
needed to cross the water or finish the stage. Lilypads bridge the early and
later water cuts; the high grass ledges and Golden Lotus form an optional
firefly-following route. The platform at the far right ends at the level width.

### 2. Cattail Canopy — charge timing and optional reach

The charging beetle at (1500, 490) is centered over the wide ground shelf
(x=1340–1660, top y=520). Its 110-pixel patrol remains inside that shelf, leaving
space to observe its wind-up and jump over the charge without approaching an
edge. Earlier ordinary beetles remain on the opening ledges, so they do not
compete with the new behavior's first tell. The long-tongue pickup is on the
upper grass shelf (x=2320–2600); the Golden Lotus was moved along that same shelf
so it no longer occupies the pickup's collection point. Neither reward is
required by the lower return path.

### 3. Mushroom Mire — catch and return a projectile

The reed spitter at (1500, 460) stands on the broad stable ground (x=1260–1620,
top y=500). The hint at x=1280 gives the player room to notice the wind-up before
the shot reaches them. The first capture lesson arrives before the citadel's
version; the long central floor also provides a safe place to learn tongue catch
and spit timing. A charging beetle appears later at (2880, 450), on the wide
platform from x=2740–3040, after the projectile lesson. It patrols within that
platform and is the stage's only combination of the new enemies. Mushrooms and
lilypads create optional bounce and collectible arcs; the base path remains
grounded and does not depend on a temporary pickup.

### 4. The Sunken Citadel — learned skills and Croaker

The approach uses the already-taught reed spitter at (900, 420), supported by
the grass ledge at x=840–1000 (top y=460), with a catch hint nearby. The optional
bubble shield at (770, 170) is above the upper ruin ledge and is a buffer for
exploration, not a gate key. The arena starts at x=1440; the long floor and
separated platforms keep the required boss route readable. Croaker remains the
only boss in these five stages. The gate, arena bounds, boss and exit preserve
the existing fight and reward progression.

### 5. Firefly Marsh — homeward victory lap

The intro and objective explicitly say that Croaker is beaten and the player is
carrying his light home to the final shrine. The required route uses broad
ground shelves connected by short water cuts and closely spaced lilypads. The
long-tongue pickup at (930, 468) rests above a lilypad and is optional. High
fireflies at the two water crossings make the mastery arcs visible without
putting those collectibles on the only safe route. A Golden Lotus near the
home shrine is an optional final reward; the shrine at x=2840 is the clear
campaign endpoint and should transition to the existing ending.

## Validation and playtest notes

`node tools/validate-level-data.js` checks the exact five-level count, known
object keys, finite coordinates, positive dimensions, world bounds, supported
platform and pickup types, optional objective/intro/hint shape, and plausible
support under the new pickups and enemy archetypes. This is a data sanity check,
not proof that every route is reachable or comfortable. The Python auditor's
first-N-edge heuristic can flag misleading edges because it sorts all platforms
and lilypads rather than tracing a complete reachable route; treat its findings
as review prompts, not verified blocked-route reports. Desktop, mobile landscape
and portrait review, plus an unassisted playthrough, remain playtest gates.

## Queued beyond the first five

Levels 6 and 7 remain proposals for a second chapter after the first-five
playtest gate. The leading theme direction is a moonlit reed delta followed by
an abandoned observatory marsh, each with a base-ability main path, a distinct
optional mastery route, and at most one additional traversal variation.
Names, themes and exact layouts remain open for playtest feedback.

The second chapter's boss should center on returning its projectiles rather than
repeating Croaker's slam-and-sweep loop. One candidate is a lantern-backed
heron: it telegraphs a seed volley, opens a brief vulnerable window after a
returned projectile hits its lantern, then recovers and repositions. Its volley
needs a readable wind-up, catchable shots, explicit vulnerability and recovery
states, and finite projectile cleanup. This is a design proposal only; no levels
6/7 or second boss are added to canonical data in this pass.
