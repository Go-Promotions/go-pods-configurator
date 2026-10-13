export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { ConfiguratorPageShell } from "@/features/configurator/components/configurator-page-shell";
import { getConfiguratorInitialSelections } from "@/features/configurator/lib/get-configurator-initial-selections";
import { getConfiguratorCatalogue } from "@/features/configurator/lib/get-configurator-catalogue";

export const metadata: Metadata = {
  title: "Configurator | Go-Pods Micro Tourer Caravans | Go-Pods.co.uk",
  description:
    "Build your dream Go-Pod Micro Tourer Caravan with our online configurator. Start from scratch, or receive a suggested specification to suit you.",
};

interface ConfiguratorPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ConfiguratorPage({
  searchParams,
}: ConfiguratorPageProps) {
  const catalogue = await getConfiguratorCatalogue();
  const initialSelections = getConfiguratorInitialSelections(
    await searchParams,
    catalogue,
  );

  return (
    <ConfiguratorPageShell
      catalogue={catalogue}
      initialSelections={initialSelections}
    />
  );
}
