export const dynamic = "force-dynamic";

import { GuidedQuizFlow } from "@/features/guided-path/components/guided-quiz-flow";
import { getGuidedQuizDefinition } from "@/features/guided-path/lib/get-guided-quiz-definition";
import { getConfiguratorCatalogue } from "@/features/configurator/lib/get-configurator-catalogue";

export default async function HelpMeChoosePage() {
  const [catalogue, quiz] = await Promise.all([
    getConfiguratorCatalogue(),
    getGuidedQuizDefinition(),
  ]);

  return (
    <main className="min-h-screen px-5 py-8 text-[var(--color-foreground)] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <GuidedQuizFlow catalogue={catalogue} quiz={quiz} />
      </div>
    </main>
  );
}
