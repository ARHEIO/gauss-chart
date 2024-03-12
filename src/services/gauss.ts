function evaluate(distanceFromOrigin: number, scale: number) {
  return Math.exp((0.5 * Math.pow(distanceFromOrigin, 2.0)) / scale);
}

function processScale(scale: number, decay: number) {
  return (0.5 * Math.pow(scale, 2.0)) / Math.log(decay);
}

export const createGaussScorer =
  (origin: number, offset: number, scale: number, decay: number) =>
  (fieldValue: number) => {
    const actualScale = processScale(scale, decay);
    const distanceFromOrigin = Math.max(
      0,
      Math.abs(fieldValue - origin) - offset
    );
    return evaluate(distanceFromOrigin, actualScale);
  };
