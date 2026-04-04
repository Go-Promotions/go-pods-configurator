import { ConfiguratorPageShell } from "@/features/configurator/components/configurator-page-shell";
import { getConfiguratorCatalogue } from "@/features/configurator/lib/get-configurator-catalogue";

export default async function ConfiguratorPage() {
  const catalogue = await getConfiguratorCatalogue();

  return (
    <ConfiguratorPageShell
      catalogue={catalogue}
    />
  );
}
