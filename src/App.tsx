import { useForm } from "react-hook-form";
import * as d3 from "d3";
import { createGaussScorer } from "./services/gauss";
import { useRef, useEffect, useMemo } from "react";
import { useWindowSize } from "@uidotdev/usehooks";
import { createLinearScorer } from "./services/linear";
import { z } from "zod";

const MARGIN = { top: 64, right: 0, bottom: 16, left: 64 };

const DATA_RANGE = 30;

/**
 * @returns [[xBeforeOffset, yBeforeOffset], [xAtOffest, 1.0], [xAfterOffset, yAfterOffset]]
 */
const sliceByCurveSection = (mappedData: [number, number][]) => {
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
};

type LinePlotProps = {
  height: number;
  origin: number;
  offset: number;
  scale: number;
  decay: number;
  type: "linear" | "gauss";
};

function LinePlot({
  height,
  origin,
  offset,
  scale,
  decay,
  type,
}: LinePlotProps) {
  const size = useWindowSize();
  const width = (size.width ?? 900) - 64;

  const scorer =
    type === "linear"
      ? createLinearScorer(origin, offset, scale, decay)
      : createGaussScorer(origin, offset, scale, decay);

  const chartRef = useRef(null);
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const data = d3.ticks(0, DATA_RANGE, DATA_RANGE);

  const mappedData: [number, number][] = useMemo(
    () => data.map((d) => [d, scorer(d)]),
    [data, origin, offset, scale, decay]
  );

  const xScale = useMemo(
    () =>
      d3
        .scaleLinear([0, data.length - 1], [MARGIN.left, boundsWidth])
        .domain([0, data.length - 1]),
    [boundsWidth, data.length]
  );
  const yScale = useMemo(
    () => d3.scaleLinear([0, 1], [boundsHeight, MARGIN.top]),
    [boundsHeight]
  );

  const line = useMemo(() => {
    const curve = type === "linear" ? d3.curveLinear : d3.curveNatural;
    return d3
      .line()
      .x(([d]) => xScale(d))
      .y(([_, d]) => yScale(d))
      .curve(curve);
  }, [type, xScale, yScale]);

  const decayLine = useMemo(
    () =>
      d3
        .line()
        .x(([d]) => xScale(d))
        .y(() => yScale(decay)),
    [decay, xScale, yScale]
  );

  useEffect(() => {
    const chart = d3.select(chartRef.current);
    chart.selectAll("svg > *:not(.static-line)").remove();

    chart
      .append("path")
      .attr("id", "decay-line")
      .attr("d", decayLine(mappedData))
      .attr("stroke", "currentColor");

    sliceByCurveSection(mappedData).forEach((slice) => {
      chart
        .append("path")
        .attr("key", JSON.stringify(slice))
        .attr("fill", "none")
        .attr("stroke", "currentColor")
        .attr("d", line(slice));
    });
    mappedData.forEach(([xCoor, yCoor]) => {
      const group = chart.append("g");
      group
        .append("circle")
        .attr("r", 3)
        .attr("key", `${xCoor},${yCoor}`)
        .attr("cx", xScale(xCoor))
        .attr("cy", yScale(yCoor));

      const text = yCoor > 0.001 ? yCoor.toPrecision(2) : "0.00";
      group
        .append("text")
        .attr(
          "transform",
          `translate(${xScale(xCoor)},${0.95 * yScale(yCoor)}) rotate(-75)`
        )
        .classed("label label-text", true)
        .text(text);
    });
  }, [decayLine, line, mappedData, xScale, yScale]);

  useEffect(() => {
    const chart = d3.select(chartRef.current);
    chart.selectAll("svg > .static-line").remove();
    chart
      .append("g")
      .classed("static-line", true)
      .attr("id", "x-axis")
      .attr("transform", `translate(0,${boundsHeight})`)
      .call(d3.axisBottom(xScale).ticks(data.length));

    chart
      .append("g")
      .classed("static-line", true)
      .attr("id", "y-axis")
      .attr("transform", `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(yScale));
  }, [width]);

  return <svg ref={chartRef} width={width} height={height} />;
}

function App() {
  const searchParams = new URLSearchParams(window.location.search);

  const { register, watch } = useForm<{
    origin: number;
    offset: number;
    scale: number;
    decay: number;
    type: "gauss" | "linear";
  }>({
    defaultValues: {
      origin: z
        .string()
        .pipe(z.coerce.number().min(0).max(DATA_RANGE))
        .catch(10)
        .parse(searchParams.get("origin")),
      offset: z
        .string()
        .pipe(z.coerce.number().min(0).max(DATA_RANGE))
        .catch(1)
        .parse(searchParams.get("offset")),
      scale: z
        .string()
        .pipe(z.coerce.number().min(0).max(DATA_RANGE))
        .catch(2)
        .parse(searchParams.get("scale")),
      decay: z
        .string()
        .pipe(z.coerce.number().min(0).max(1))
        .catch(0.5)
        .parse(searchParams.get("decay")),
      type: "gauss" as const,
    },
  });

  const formValues = watch();

  // store form state in the url search params
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("origin", formValues.origin.toString());
    url.searchParams.set("offset", formValues.offset.toString());
    url.searchParams.set("scale", formValues.scale.toString());
    url.searchParams.set("decay", formValues.decay.toString());
    window.history.replaceState({}, "", url);
  }, [
    formValues.decay,
    formValues.offset,
    formValues.origin,
    formValues.scale,
  ]);

  return (
    <main className="p-8 h-screen">
      <form className="grid grid-cols-2 justify-items-center gap-4">
        <label className="form-control w-full max-w-xs flex">
          <div className="label">
            <span className="label-text">Origin</span>
            <span className="label-text-alt">{formValues.origin}</span>
          </div>
          <input
            type="range"
            min={0}
            max={DATA_RANGE}
            {...register("origin")}
            className="range range-sm"
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Offset</span>
            <span className="label-text-alt">{formValues.offset}</span>
          </div>
          <input
            type="range"
            min={0}
            max={DATA_RANGE}
            {...register("offset")}
            className="range range-sm"
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Scale</span>
            <span className="label-text-alt">{formValues.scale}</span>
          </div>
          <input
            type="range"
            min={0}
            max={DATA_RANGE}
            {...register("scale")}
            className="range range-sm"
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Decay</span>
            <span className="label-text-alt">
              {formValues.decay.toString().length < 4
                ? formValues.decay.toString() + "0"
                : formValues.decay.toString()}
            </span>
          </div>
          <input
            type="range"
            step={0.05}
            min={0}
            max={1}
            className="range range-sm"
            {...register("decay")}
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Curve Type</span>
          </div>
          <select
            className="select select-bordered select-primary select-sm"
            {...register("type")}
          >
            <option value="linear">linear</option>
            <option value="gauss">gauss</option>
          </select>
        </label>
      </form>
      <section>
        <LinePlot
          height={600}
          origin={formValues.origin}
          offset={formValues.offset}
          scale={formValues.scale}
          decay={formValues.decay}
          type={formValues.type}
        />
      </section>
    </main>
  );
}

export default App;
