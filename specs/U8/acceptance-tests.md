# Unit U8 Acceptance Tests

Traceability: `US-010` (`#51`), `FR-041`, `FR-050`, `FR-051`, `FR-052`.

## AT-U8-01 — Team Mode Average Scoring
- **Given** Team Alpha (2 active members) scoring `1000` and `600` on Q1, and Team Beta (1 active member) scoring `900` on Q1
- **When** `computeTeamStandings` computes question averages
- **Then** Team Alpha has `800` (`(1000+600)/2`) and ranks `#2`, while Team Beta has `900` and ranks `#1`.

## AT-U8-02 — Challenge Accuracy-Only Scoring & Deadline Enforcement
- **Given** a self-paced challenge with `accuracyOnly: true` and `deadline` in the past
- **When** a correct answer is scored with `accuracyOnly: true` -> awards full `1000` pts even at `19s` of `20s`.
- **When** submitting after `deadline` -> server rejects with `409 CHALLENGE_CLOSED`.
