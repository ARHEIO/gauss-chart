// sum.test.js
import { describe, expect, test } from "vitest";
import { createGaussScorer } from "./gauss";

const scorer = createGaussScorer(0, 0, 10, 0.05);

describe("Gauss Scorer", () => {
  test.each`
    value   | expectedScore
    ${0}    | ${"1.000"}
    ${1}    | ${"0.970"}
    ${5}    | ${"0.473"}
    ${9.5}  | ${"0.067"}
    ${10}   | ${"0.050"}
    ${10.5} | ${"0.037"}
  `(
    "A value of $value produces a score of $expectedScore",
    ({ value, expectedScore }) => {
      const score = scorer(value);
      expect(score.toFixed(3)).toBe(expectedScore);
    }
  );
});
