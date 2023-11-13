import { ColorStyler, GradientFunctionSelector } from "./GradientStyling";
import MaxIterationsSetter from "./MaxIterationsSetter";

export const styleTaskActivities = [
  {
    label: "Color palette",
    component: ColorStyler,
  },
  {
    label: "Gradient function",
    component: GradientFunctionSelector,
  },
  {
    label: "Max iterations",
    component: MaxIterationsSetter,
  },
];
