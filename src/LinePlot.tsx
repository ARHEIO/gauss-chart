import * as d3 from "d3";
import { createGaussScorer } from "./services/gauss";
import { useRef, useEffect, useMemo } from "react";
import { createLinearScorer } from "./services/linear";
import { curveSlicer } from "./services/curveSlicer";

type xCoordinate = number;
type yCoordinate = number;

type xyCoordinate = [xCoordinate, yCoordinate];

const MARGIN = { top: 32, right: 0, bottom: 0, left: 64 };

const DATA_RANGE = 30;

type LinePlotProps = {
  readonly height: number;
  readonly width: number;
  readonly origin: number;
  readonly offset: number;
  readonly scale: number;
  readonly decay: number;
  readonly type: "linear" | "gauss";
};

export default function LinePlot({
  height,
  width,
  origin,
  offset,
  scale,
  decay,
  type,
}: Readonly<LinePlotProps>) {
  const chartRef = useRef(null);
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  /**
   * Creates x,y coordinates
   */
  const xyCoordinates: xyCoordinate[] = useMemo(() => {
    const scorer =
      type === "linear"
        ? createLinearScorer(origin, offset, scale, decay)
        : createGaussScorer(origin, offset, scale, decay);

    return d3
      .ticks(0, DATA_RANGE, DATA_RANGE)
      .map((d: xCoordinate): xyCoordinate => [d, scorer(d)]);
  }, [type, origin, offset, scale, decay]);

  /**
   * Scales coordiantes in the x axis based on canvas size
   */
  const xScale = useMemo(
    () =>
      d3
        .scaleLinear([0, xyCoordinates.length - 1], [MARGIN.left, boundsWidth])
        .domain([0, xyCoordinates.length - 1]),
    [boundsWidth, xyCoordinates.length]
  );

  /**
   * Scales coordiantes in the y axis based on canvas size
   */
  const yScale = useMemo(
    () => d3.scaleLinear([0, 1], [boundsHeight, MARGIN.top]),
    [boundsHeight]
  );

  /**
   * Turns a series of coordinates into a path
   * @example
   *
   * // returns "M64,514C76.733,289,89.467,64,102.2,64C114.933,64,127.667,289,140.4,514"
   * convertCoordinatesToD([[0, 0], [1,1], [2, 0]]);
   */
  const convertCoordinatesToD = useMemo(
    () =>
      d3
        .line()
        .x(([d]) => xScale(d))
        .y(([_, d]) => yScale(d))
        .curve(type === "linear" ? d3.curveLinear : d3.curveNatural),
    [type, xScale, yScale]
  );

  // update X and Y axis
  useEffect(() => {
    const chart = d3.select(chartRef.current);

    chart.select("svg > g#x-axis").remove();
    chart
      .append("g")
      .attr("id", "x-axis")
      .attr("transform", `translate(0,${boundsHeight})`)
      .call(d3.axisBottom(xScale).ticks(xyCoordinates.length));

    chart.select("svg > g#y-axis").remove();
    chart
      .append("g")
      .attr("id", "y-axis")
      .attr("transform", `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(yScale));
  }, [boundsHeight, xScale, xyCoordinates.length, yScale]);

  // render the equation (in three parts)
  useEffect(() => {
    const chart = d3.select(chartRef.current);
    chart.selectAll("svg > g#equation").remove();

    const equationLineGroup = chart.append("g").attr("id", "equation");

    curveSlicer(xyCoordinates).forEach((slice) => {
      equationLineGroup
        .append("path")
        .attr("key", JSON.stringify(slice))
        .attr("fill", "none")
        .attr("stroke", "currentColor")
        .attr("d", convertCoordinatesToD(slice));
    });

    xyCoordinates.forEach(([xCoor, yCoor]) => {
      const group = equationLineGroup
        .append("g")
        .attr("class", "point")
        .attr("key", `${xCoor},${yCoor}`);

      const scaledXCoor = xScale(xCoor);
      const scaledYCoor = yScale(yCoor);

      group
        .append("circle")
        .attr("r", 3)
        .attr("cx", scaledXCoor)
        .attr("cy", scaledYCoor);

      const pixelsBetweenXCoordinates = xScale(1) - xScale(0);

      // shift 1/3 to the right
      const textXPosition = scaledXCoor + pixelsBetweenXCoordinates / 3;

      group
        .append("text")
        .attr(
          "transform",
          `translate(${textXPosition},${scaledYCoor - 5}) rotate(-75)`
        )
        .classed("label label-text", true)
        .text(yCoor > 0.001 ? yCoor.toPrecision(2) : "0.00");
    });
  }, [convertCoordinatesToD, xyCoordinates, xScale, yScale]);

  // update decay line
  useEffect(() => {
    const chart = d3.select(chartRef.current);
    chart.select("svg > #decay-line").remove();

    const decayLine = d3.line(
      ([d]) => xScale(d),
      () => yScale(decay)
    );

    chart
      .append("path")
      .attr("id", "decay-line")
      .style("stroke-dasharray", ("3, 3"))
      .attr("d", decayLine(xyCoordinates))
      .attr("stroke", "currentColor");
  }, [decay, xScale, yScale]);

  return <svg ref={chartRef} width={width} height={height} />;
}
