import { expect, test } from "vitest";
import { curveSlicer } from "./curveSlicer";

const coordinates = [
  [0, 0.387],
  [1, 0.656],
  [2, 0.9],
  [3, 1],
  [4, 1],
  [5, 1],
  [6, 0.9],
  [7, 0.656],
  [8, 0.387],
] as [number, number][];

const expectedSlices = [
  [
    [0, 0.387],
    [1, 0.656],
    [2, 0.9],
    [3, 1],
  ],
  [
    [3, 1],
    [4, 1],
    [5, 1],
  ],
  [
    [5, 1],
    [6, 0.9],
    [7, 0.656],
    [8, 0.387],
  ],
];

test("curveSlicer", () => {
  expect(curveSlicer(coordinates)).toEqual(expectedSlices);
});
