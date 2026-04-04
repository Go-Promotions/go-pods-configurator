import { ConfiguratorPageShell } from "@/features/configurator/components/configurator-page-shell";
import { getConfiguratorInitialSelections } from "@/features/configurator/lib/get-configurator-initial-selections";
import { getConfiguratorCatalogue } from "@/features/configurator/lib/get-configurator-catalogue";

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
