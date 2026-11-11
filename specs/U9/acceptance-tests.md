# Unit U9 Acceptance Tests

| AC | Verification Method | Expected Outcome |
|---|---|---|
| U9-AC1 (`pin_answer` sanitization) | Unit test (`r3-spatial-brainstorm.test.ts`) | `sanitizeSlideForPlayer` omits target circle/polygon coordinates from player payload. |
| U9-AC2 (`pin_answer` geometry scoring) | Unit test (`r3-spatial-brainstorm.test.ts`) | Circle distance & polygon ray-casting evaluate hits/misses accurately and apply speed points. |
| U9-AC3 (`drop_pin` validation & evaluation) | Unit test (`r3-spatial-brainstorm.test.ts`) | Drop pin validates coordinates `[0,1]` and awards `0` opinion points (`isCorrect: null`). |
| U9-AC4 (`brainstorm` submit & upvote ranking) | Unit test (`r3-spatial-brainstorm.test.ts`) | Aggregator collects multi-idea submissions, tallies votes per player cleanly (max 3), and ranks highest first. |
| U9-AC5 (Creator unlock) | Vitest + `tsc` + UI check | `AddSlideModal` allows selecting `pin_answer`, `drop_pin`, and `brainstorm` without R3 lockouts. |

