// sum.test.js
import { describe, expect, test } from "vitest";
import { createLinearScorer } from "./linear";

const scorer = createLinearScorer(0, 0, 10, 0.05);

describe("Linear Scorer", () => {
  test.each`
    value   | expectedScore
    ${0}    | ${"1.000"}
    ${1}    | ${"0.905"}
    ${5}    | ${"0.525"}
    ${9.5}  | ${"0.098"}
    ${10}   | ${"0.050"}
    ${10.5} | ${"0.003"}
  `(
    "A value of $value produces a score of $expectedScore",
    ({ value, expectedScore }) => {
      const score = scorer(value);
      expect(score.toFixed(3)).toBe(expectedScore);
    }
  );
});
