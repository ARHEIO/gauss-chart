/**
 * The drawn line looks super munted if we try to put all the points into a single equation.
 * To avoid this, we create three lines.
 * 1. A curve from (0, y) until the first point where y is 1 (inclusive)
 * 2. A flat line including every point where y is 1
 * 3. A curve from the last point where y is 1 until the right edge of the graph
 *
 * @returns [[xBeforeOffset, yBeforeOffset], [xAtOffest, 1.0], [xAfterOffset, yAfterOffset]]
 */
export function curveSlicer(mappedData: [number, number][]) {
  const yCoordinates = mappedData.map(([_, y]) => y.toPrecision(2));
  const firstCut = yCoordinates.indexOf("1.0");
  const secondCut = yCoordinates.lastIndexOf("1.0");

  return [
    mappedData.slice(0, firstCut + 1),
    mappedData.slice(firstCut, secondCut + 1),
    mappedData.slice(secondCut),
  ].reduce<[number, number][][]>(
    (acc, curr) => (curr.length !== 1 ? [...acc, curr] : acc),
    []
  );
}
