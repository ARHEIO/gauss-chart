import classNames from "classnames";

export const Control = ({
    className,
    ...props
  }: JSX.IntrinsicElements["label"]) => (
    <label
      className={classNames("form-control w-full max-w-xs", className)}
      {...props}
    />
  );
