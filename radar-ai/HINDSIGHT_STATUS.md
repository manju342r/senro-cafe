# Hindsight / Memory Status (CaféOS)

## Decision

The agent's memory is the `recommendations`, `recommendation_evidence`, and
`recommendation_outcomes` tables (migration 001) — written on every analysis,
read back as history before new analyses. This is real, queryable persistence,
not a simulated memory.

## Why not Vectorize Hindsight yet

The Senro.AI codebase contains only a **mocked** Hindsight client
(`src/services/hindsightAgent.ts`: `console.log` + hardcoded recall; backend
`retain` call is fire-and-forget in a `catch`). No Vectorize SDK is installed,
no live credentials are verified, and the old endpoints point at placeholder
namespaces from a different product.

Per the No-Mocks rule, we do **not** wire the café agent to that mock and
claim memory works.

## Verifiable integration plan (when wanted)

1. Confirm a Vectorize Hindsight API key + SDK (`HINDSIGHT_API_KEY` server env).
2. Probe: `retain` one observation, `recall` it back, paste both payloads here.
3. Mirror writes: keep `recommendations` as the source of truth; Hindsight
   becomes a retrieval index over `{observation, evidence, outcome}` texts.
4. Update `api/ai-analyze.js` to query Hindsight recall and cite the returned
   observation IDs in `recommendation_evidence` rows.

Until then, any claim of the form "the agent remembered X" must cite a
`recommendations` row id visible on `/staff/ai`.
