import { getDistanceFromOrigin } from "./shared";

function processScale(scale: number, decay: number) {
  return scale / (1 - decay);
}

export const createLinearScorer =
  (origin: number, offset: number, scale: number, decay: number) =>
  (fieldValue: number) => {
    const actualScale = processScale(scale, decay);
    const distanceFromOrigin = getDistanceFromOrigin(
      fieldValue,
      origin,
      offset
    );

    return Math.max(0, (actualScale - distanceFromOrigin) / actualScale);
  };

const scorer = createLinearScorer(0, 0, 10, 0.05);

console.log(scorer(0))
console.log(scorer(1))
console.log(scorer(5))
console.log(scorer(9.5))
console.log(scorer(10))
console.log(scorer(10.5))
