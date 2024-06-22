import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import LinePlot from "./LinePlot";
import { Control } from "./components";
import { useWindowSize } from "@uidotdev/usehooks";

const DATA_RANGE = 30;

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

  const refContainer = useRef<HTMLFormElement>(null);
  const [graphSize, setGraphSize] = useState({ height: 0, width: 0 });
  const windowDims = useWindowSize();

  useEffect(() => {
    if (refContainer.current && windowDims.height && windowDims.width) {
      const formHeight = refContainer.current.offsetHeight;

      setGraphSize({
        height: windowDims.height - formHeight - 32,
        width: windowDims.width,
      });
    }
  }, [refContainer, windowDims]);

  return (
    <main className="h-screen">
      <form
        className="grid grid-cols-2 justify-items-center gap-4 p-8"
        ref={refContainer}
      >
        <Control>
          <div className="label">
            <span className="label-text">Origin</span>
            <span className="label-text-alt">{formValues.origin}</span>
          </div>
          <input
            type="range"
            min={0}
            max={DATA_RANGE}
            {...register("origin", { valueAsNumber: true })}
            className="range range-sm"
          />
        </Control>
        <Control>
          <div className="label">
            <span className="label-text">Offset</span>
            <span className="label-text-alt">{formValues.offset}</span>
          </div>
          <input
            type="range"
            min={0}
            max={DATA_RANGE}
            {...register("offset", { valueAsNumber: true })}
            className="range range-sm"
          />
        </Control>
        <Control>
          <div className="label">
            <span className="label-text">Scale</span>
            <span className="label-text-alt">{formValues.scale}</span>
          </div>
          <input
            type="range"
            min={0}
            max={DATA_RANGE}
            {...register("scale", { valueAsNumber: true })}
            className="range range-sm"
          />
        </Control>
        <Control>
          <div className="label">
            <span className="label-text">Decay</span>
            <span className="label-text-alt">
              {formValues.decay.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            step={0.05}
            min={0.05}
            max={1}
            className="range range-sm"
            {...register("decay", { valueAsNumber: true })}
          />
        </Control>
        <Control>
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
        </Control>
      </form>
      <section>
        {graphSize.height !== 0 && graphSize.width !== 0 ? (
          <LinePlot
            height={graphSize.height}
            width={graphSize.width}
            origin={formValues.origin}
            offset={formValues.offset}
            scale={formValues.scale}
            decay={formValues.decay}
            type={formValues.type}
          />
        ) : null}
      </section>
    </main>
  );
}

export default App;
