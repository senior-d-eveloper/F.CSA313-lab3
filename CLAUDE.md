# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A lab exercise (course "313", lab 03) for load testing. [server.js](server.js) is a deliberately simple Express 5 API that exists to be a *target* for a load generator — not a production service. Its three endpoints each model one performance characteristic:

| Endpoint | Behavior modeled |
| --- | --- |
| `POST /cart/add` | fast path, responds immediately |
| `GET /report` | slow path, artificial 200–400ms random latency |
| `POST /pay` | unreliable path, ~5% of requests return HTTP 500 |

When changing the server, preserve these three shapes — the latency and error rate are the point of the exercise, not bugs to fix. Comments in the source are in Mongolian; keep that convention.

## Commands

```bash
node server.js        # start the API on http://localhost:3000 (no start script, no watcher)
```

There is no build, lint, or test setup. `npm test` is still the npm placeholder that exits 1.

## Scenarios / assignment

[README.md](README.md) is the lab deliverable: three quality-attribute scenarios
(performance / reliability / availability) in the 6-part Lecture 3 format, written in
Mongolian. Its numbers are not invented — every p95/p99, POFOD and availability figure
came from actual k6 runs against `localhost:3000` on this machine, and the README states
the measurement conditions. If `server.js` changes, the measured columns are stale and
must be re-run, not hand-edited.

Two of the three scenarios deliberately FAIL their targets (the `/pay` 5% error rate and
the absence of any process supervisor). That is the pedagogical point — do not "fix" the
server to make the README pass.

Step 2's `POFOD <= 0.005` and Step 3's `< 6%` SLO are not a contradiction and must not be
"reconciled": the former is the requirement (what the system should be), the latter the
operational threshold (what alerts on today's system). The README explains this; keep it.

## The graded contract

Three rules the assignment grades on a pass/fail basis. Breaking any one fails the lab:

1. **Every measured number in README.md must appear verbatim in a `results/*.txt` file.**
   Quote k6's own formatting (`587µs`, `5.51%`, `392.92ms`) rather than re-rounding it —
   a README saying `5.52%` where k6 printed `5.51%` is a fail. Derived values (error
   budgets, confidence intervals) must name the file and figures they came from.
2. **The README SLO table's four thresholds must equal `slo-test.js`'s four thresholds.**
   Change one, change both.
3. **`slo-test-fail.js` must differ from `slo-test.js` in exactly one threshold**
   (`{name:report}` 450 -> 100).

Re-verify 1 and 2 after any edit to either file; both were checked programmatically when
the README was written.

## Load testing

Four k6 scripts back the README. `crash.js` and `avail.js` both need an external kill
driven alongside them — see the README for the full command.

| Script | Backs | Executor |
| --- | --- | --- |
| `mixed.js` | Step 2 scenarios 1–2 (latency, POFOD) | `constant-arrival-rate` |
| `crash.js` | Step 2 scenario 3 (crash + recovery) | `constant-arrival-rate` |
| `slo20.js` | Step 3 SLO thresholds | `constant-vus`, 20 VU |
| `avail.js` | Step 3 error budget | `constant-vus`, 20 VU |

The executor choice is deliberate and load-bearing, not incidental. Step 2 uses
`constant-arrival-rate` because on localhost a closed loop saturates the server at
~24k req/s, which measures capacity rather than the normal load those scenarios
describe. Step 3 uses `constant-vus` because the assignment specifies its windows in VUs
*and* because the closed loop is what produces the time-vs-request availability
divergence that Step 5 analyses: during an outage `ECONNREFUSED` returns instantly, so
VUs issue ~3.1x more requests than normal and failures become over-represented.

`avail.js` intentionally fails its own 90% threshold — that failure is the finding, not
a bug to fix.

`slo-test.js` carries `sleep(1)`, which throttles it to ~46 req/s — roughly 500x below
the saturated baselines. That gap is load-bearing: it shrinks the per-minute `/pay`
sample from ~689k to ~930, widening the error-rate spread from +/-0.05% to +/-1.4%, which
is why the reliability threshold is 7% and not 6%. Do not add or remove that `sleep`
without recomputing the threshold.

There is also an unrelated k6 script at `../test.js` (sibling of this directory, not in the project). It is ESM and uses k6's built-in `k6/http` module — it runs under `k6 run`, never under `node`.

```bash
k6 run ../test.js
```

As checked in, that script points at an external host (`https://asterisk-tech.mn`) with 1000 VUs for 30s. To exercise the local API instead, change the URL to `http://localhost:3000/...` and start `server.js` first. Do not run high-VU load against a third-party host unless the user confirms they own or are authorized to test it.
