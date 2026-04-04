import type { ConfiguratorStep } from "@/types/configurator";

export const configuratorSteps: Array<{
  id: ConfiguratorStep;
  stepNumber: number;
  shortLabel: string;
  title: string;
}> = [
  { id: "model", stepNumber: 1, shortLabel: "Choose model", title: "Choose model" },
  {
    id: "accessories",
    stepNumber: 2,
    shortLabel: "Accessories & upgrades",
    title: "Accessories & upgrades",
  },
  {
    id: "styling",
    stepNumber: 3,
    shortLabel: "Styling upgrades",
    title: "Styling upgrades",
  },
  { id: "details", stepNumber: 4, shortLabel: "Your details", title: "Your details" },
  { id: "review", stepNumber: 5, shortLabel: "Review & submit", title: "Review & submit" },
];

export const firstConfiguratorStep = configuratorSteps[0].id;
export const lastConfiguratorStep =
  configuratorSteps[configuratorSteps.length - 1].id;
