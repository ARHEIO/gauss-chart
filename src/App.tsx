import { useForm } from "react-hook-form";
import * as d3 from "d3";
import { createGaussScorer } from "./services/gauss";
import { useRef, useEffect } from "react";
import { useWindowSize } from "@uidotdev/usehooks";

const MARGIN = { top: 30, right: 0, bottom: 50, left: 50 };

const DATA_RANGE = 30;

const split = (mappedData: [number, number][]) => {
  const firstCut = mappedData.findIndex(([_, y]) => y === 1.0);
  const secondCut = mappedData.slice(firstCut).findIndex(([_, y]) => y !== 1.0);

  const firstSlice = mappedData.slice(0, firstCut + 1);
  const secondSlice = mappedData.slice(firstCut, firstCut + secondCut);
  const thirdSlice = mappedData.slice(firstCut + secondCut - 1);
  return [firstSlice, secondSlice, thirdSlice];
};

function LinePlot({
  height = 400,
  origin = 10,
  offset = 1,
  scale = 2,
  decay = 0.5,
}) {
  const size = useWindowSize();
  const width = (size.width ?? 900) - 64;

  const scorer = createGaussScorer(origin, offset, scale, decay);

  const axesRef = useRef(null);
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const data = d3.ticks(0, DATA_RANGE, DATA_RANGE);
  const mappedData = data.map((d) => [d, scorer(d)]) as [number, number][];
  const slices = split(mappedData);

  const xScale = d3
    .scaleLinear([0, data.length], [MARGIN.left, boundsWidth])
    .domain([0, data.length]);
  const yScale = d3.scaleLinear([0, 1], [boundsHeight, MARGIN.top]);

  const line = d3
    .line()
    .x(([d]) => xScale(d))
    .y(([_, d]) => yScale(d))
    .curve(d3.curveNatural);

  const decayLine = d3
    .line()
    .x(([d]) => xScale(d))
    .y(() => yScale(decay));

  useEffect(() => {
    const svgElement = d3.select(axesRef.current);
    svgElement.selectAll("*").remove();
    const xAxisGenerator = d3.axisBottom(xScale);
    svgElement
      .append("g")
      .attr("transform", `translate(${-MARGIN.left},${boundsHeight})`)
      .call(xAxisGenerator);

    const yAxisGenerator = d3.axisLeft(yScale);
    svgElement
      .append("g")
      .attr("transform", `translate(${-MARGIN.left / 2},${-MARGIN.top})`)
      .call(yAxisGenerator);
  }, [xScale, yScale, boundsHeight]);

  return (
    <svg width={width} height={height}>
      <path
        d={decayLine(mappedData) ?? undefined}
        stroke="#ff6611"
        fill="none"
        strokeWidth={2}
      />
      <text transform={`translate(50, ${0.95*yScale(decay)})`} fontWeight={400}>DECAY</text>
      {slices.map((slice) => (
        <path
          key={slice.toString()}
          d={line(slice) ?? undefined}
          stroke="#9a6fb0"
          fill="none"
          strokeWidth={2}
        />
      ))}
      <g fill="white" stroke="currentColor" strokeWidth="1.5">
        {data.map((d, i) => (
          <>
            <circle key={i} cx={xScale(i)} cy={yScale(scorer(d))} r="2.5" />
            <text
            fontWeight={100}
              textAnchor="center"
              transform={`translate(${xScale(i)},${
                0.95 * yScale(scorer(d))
              }) rotate(-75)`}
            >
              {scorer(d).toPrecision(2)}
            </text>
          </>
        ))}
      </g>
      <g
        width={boundsWidth}
        height={boundsHeight}
        ref={axesRef}
        transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
      />
    </svg>
  );
}

function App() {
  const { register, watch } = useForm({
    defaultValues: {
      origin: 10,
      offset: 1,
      scale: 2,
      decay: 0.5,
    },
  });

  const formValues = watch();

  return (
    <main>
      <form className="form">
        <label>
          Origin
          <input
            type="range"
            min={0}
            max={DATA_RANGE}
            defaultValue={10}
            {...register("origin")}
          />
          {formValues.origin}
        </label>
        <label>
          Offset
          <input
            type="range"
            min={0}
            max={DATA_RANGE}
            defaultValue={1}
            {...register("offset")}
          />
          {formValues.offset}
        </label>
        <label>
          Scale
          <input
            type="range"
            min={0}
            max={DATA_RANGE}
            defaultValue={2}
            {...register("scale")}
          />
          {formValues.scale}
        </label>
        <label>
          Decay
          <input
            type="range"
            step={0.05}
            min={0}
            max={1}
            defaultValue={0.5}
            {...register("decay")}
          />
          {formValues.decay.toString().length < 4
            ? formValues.decay.toString() + "0"
            : formValues.decay.toString()}
        </label>
      </form>
      <section>
        <LinePlot
          origin={formValues.origin}
          offset={formValues.offset}
          scale={formValues.scale}
          decay={formValues.decay}
        />
      </section>
    </main>
  );
}

export default App;
