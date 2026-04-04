"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ModelSpecDialog } from "@/features/configurator/components/model-spec-dialog";
import { OptionDetailsDialog } from "@/features/configurator/components/option-details-dialog";
import { buildConfiguratorSummary } from "@/features/configurator/lib/build-configurator-summary";
import { formatPrice, formatWeightKg } from "@/features/configurator/lib/formatters";
import { DEFAULT_MTPLM_KG } from "@/features/configurator/lib/vehicle-constants";
import {
  buildGuidedRecommendation,
  getGuidedPackageOverlapNotice,
} from "@/features/guided-path/lib/build-guided-recommendation";
import type { ConfiguratorCatalogue } from "@/types/configurator";
import type { GuidedQuizDefinition } from "@/types/guided-quiz";

interface GuidedQuizFlowProps {
  catalogue: ConfiguratorCatalogue;
  quiz: GuidedQuizDefinition;
}

export function GuidedQuizFlow({ catalogue, quiz }: GuidedQuizFlowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerSlugs, setSelectedAnswerSlugs] = useState<Record<string, string>>(
    {},
  );
  const [guidedSelectionState, setGuidedSelectionState] = useState<{
    recommendationKey: string | null;
    optionIds: string[];
  }>({
    recommendationKey: null,
    optionIds: [],
  });

  const currentQuestion = quiz.questions[currentQuestionIndex] ?? null;
  const allOptions = useMemo(
    () => catalogue.optionCategories.flatMap((category) => category.options),
    [catalogue.optionCategories],
  );
  const isComplete =
    quiz.questions.length > 0 &&
    quiz.questions.every((question) => selectedAnswerSlugs[question.slug]);
  const recommendation = useMemo(
    () =>
      isComplete
        ? buildGuidedRecommendation(quiz, catalogue, selectedAnswerSlugs)
        : null,
    [catalogue, isComplete, quiz, selectedAnswerSlugs],
  );
  const recommendationKey = useMemo(
    () =>
      recommendation
        ? [
            recommendation.recommendedModel.id,
            ...recommendation.suggestedOptions.map((option) => option.id),
          ].join(":")
        : null,
    [recommendation],
  );

  if (currentQuestion === null) {
    return (
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Help me choose
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-muted-foreground)]">
          The guided recommendation questions are not available right now. You can
          still continue with the manual configurator.
        </p>
        <div className="mt-8">
          <Link
            href="/configurator"
            className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            Manually configure my Go-Pod
          </Link>
        </div>
      </section>
    );
  }

  if (isComplete && recommendation) {
    const suggestedOptionIdsFromRecommendation = recommendation.suggestedOptions.map(
      (option) => option.id,
    );
    const remainingSuggestedOptionIds =
      guidedSelectionState.recommendationKey === recommendationKey
        ? guidedSelectionState.optionIds
        : suggestedOptionIdsFromRecommendation;
    const remainingSuggestedOptions = recommendation.suggestedOptions.filter((option) =>
      remainingSuggestedOptionIds.includes(option.id),
    );
    const packageOverlapNotice = getGuidedPackageOverlapNotice(
      remainingSuggestedOptions,
      allOptions,
    );
    const groupedSuggestedCategories = catalogue.optionCategories
      .map((category) => ({
        id: category.id,
        name: category.name,
        options: remainingSuggestedOptions.filter(
          (option) => option.categoryId === category.id,
        ),
      }))
      .filter((category) => category.options.length > 0);
    const summary = buildConfiguratorSummary({
      model: recommendation.recommendedModel,
      selectedOptions: remainingSuggestedOptions,
    });

    function getBaseSuggestedOptionIds() {
      return guidedSelectionState.recommendationKey === recommendationKey
        ? guidedSelectionState.optionIds
        : suggestedOptionIdsFromRecommendation;
    }

    function handleRemoveSuggestedOption(optionId: string) {
      setGuidedSelectionState({
        recommendationKey,
        optionIds: getBaseSuggestedOptionIds().filter(
          (currentOptionId) => currentOptionId !== optionId,
        ),
      });
    }

    const configuratorHref = {
      pathname: "/configurator",
      query: {
        model: recommendation.recommendedModel.slug,
        options: remainingSuggestedOptions.map((option) => option.slug).join(","),
        step: "accessories",
      },
    } as const;

    return (
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
          Guided recommendation
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Here’s a Go-Pod setup worth starting with.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted-foreground)]">
          Based on your answers, we’ve suggested a model and a shortlist of upgrades
          that should suit how you plan to travel.
        </p>

        <div className="mt-8 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Recommended model
            </p>
            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.1fr)]">
              <ModelSpecDialog
                model={recommendation.recommendedModel}
                triggerClassName="group block overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-white text-left transition hover:border-[var(--color-accent)]"
                triggerAriaLabel={`View standard specification for ${recommendation.recommendedModel.name}`}
                triggerContent={
                  <div className="space-y-3 p-3">
                    <div className="aspect-[4/3] rounded-[1rem] bg-[var(--color-surface)]">
                      {recommendation.recommendedModel.imagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={recommendation.recommendedModel.imagePath}
                          alt={recommendation.recommendedModel.name}
                          className="h-full w-full object-contain p-4"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-[var(--color-muted-foreground)]">
                          Model image coming soon
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                      <span className="text-sm font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
                        View standard specification
                      </span>
                      <span className="text-sm font-semibold text-[var(--color-accent)]">
                        Open
                      </span>
                    </div>
                  </div>
                }
              />
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
                    {recommendation.recommendedModel.name}
                  </h2>
                  <p className="text-sm leading-7 text-[var(--color-muted-foreground)]">
                    {recommendation.recommendedModel.shortDescription}
                  </p>
                </div>
                <ModelSpecDialog
                  model={recommendation.recommendedModel}
                  triggerClassName="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border-strong)] px-5 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                      Base price
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">
                      {formatPrice(recommendation.recommendedModel.basePrice)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                      Base MiRO
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">
                      {formatWeightKg(recommendation.recommendedModel.baseMiro)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                      MTPLM
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">
                      {formatWeightKg(DEFAULT_MTPLM_KG)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--color-border)] pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Current guided specification
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
              Review the suggested upgrades below, open full details where needed,
              and remove anything you do not want before continuing.
            </p>

            {packageOverlapNotice ? (
              <div className="mt-4 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-accent-soft)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Package overlap
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-foreground)]">
                  {`${packageOverlapNotice.coveredCount} of your current suggested accessories are included in the ${packageOverlapNotice.packageOption.title}.`}
                </p>
              </div>
            ) : null}

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Suggested accessories & upgrades
              </p>
              {groupedSuggestedCategories.length > 0 ? (
                <div className="mt-5 space-y-6">
                  {groupedSuggestedCategories.map((category) => (
                    <section key={category.id} className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
                          {category.name}
                        </h3>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                          {category.options.length} selected
                        </span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {category.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex h-full flex-col rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-soft)]"
                          >
                            <OptionDetailsDialog
                              option={option}
                              allOptions={allOptions}
                              selectedModel={recommendation.recommendedModel}
                              selectedOptionIds={remainingSuggestedOptionIds}
                              onToggleOption={handleRemoveSuggestedOption}
                              compatibilityLabel="Suggested for the recommended Go-Pod model based on your answers."
                              triggerClassName="group block flex-1 text-left"
                              triggerContent={
                                <div className="flex h-full flex-col">
                                  <div className="overflow-hidden rounded-[1.1rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
                                    <div className="aspect-[4/3]">
                                      {option.primaryImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={option.primaryImageUrl}
                                          alt={option.title}
                                          className="h-full w-full object-contain p-4 transition group-hover:scale-[1.01]"
                                        />
                                      ) : (
                                        <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-[var(--color-muted-foreground)]">
                                          Image coming soon
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-4 min-h-0 flex-1 space-y-2">
                                    <p className="text-base font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
                                      {option.title}
                                    </p>
                                    <p className="text-sm font-semibold text-[var(--color-foreground)]">
                                      {formatPrice(option.price)}
                                    </p>
                                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                                      {category.name}
                                    </p>
                                  </div>

                                  <span className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] transition group-hover:border-[var(--color-accent)]">
                                    More info
                                  </span>
                                </div>
                              }
                              triggerAriaLabel={`Open details for ${option.title}`}
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveSuggestedOption(option.id)}
                              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[var(--color-muted-foreground)]">
                  You have removed the suggested accessories from this shortlist, so
                  you can continue into the configurator with the recommended model
                  and explore the rest manually.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Suggested configuration summary
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                Total price
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
                {formatPrice(summary.runningTotal)}
              </p>
              <div className="mt-4 space-y-2 text-sm text-[var(--color-muted-foreground)]">
                <div className="flex items-center justify-between gap-3">
                  <span>Base price</span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {formatPrice(summary.basePrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Suggested options</span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {formatPrice(summary.optionsTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                Weight summary
              </p>
              <div className="mt-4 space-y-2 text-sm text-[var(--color-muted-foreground)]">
                <div className="flex items-center justify-between gap-3">
                  <span>Base MiRO</span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {formatWeightKg(recommendation.recommendedModel.baseMiro)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Added option weight</span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {formatWeightKg(summary.totalOptionWeight)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Updated MiRO</span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {formatWeightKg(summary.updatedMiro ?? recommendation.recommendedModel.baseMiro)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                Payload & limits
              </p>
              <div className="mt-4 space-y-2 text-sm text-[var(--color-muted-foreground)]">
                <div className="flex items-center justify-between gap-3">
                  <span>MTPLM</span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {formatWeightKg(DEFAULT_MTPLM_KG)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Remaining payload</span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {formatWeightKg(summary.remainingPayload ?? DEFAULT_MTPLM_KG)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Suggested upgrades</span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    {remainingSuggestedOptions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={configuratorHref}
            className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            Continue to the configurator with this recommendation
          </Link>
          <button
            type="button"
            onClick={() => {
              setCurrentQuestionIndex(0);
              setSelectedAnswerSlugs({});
              setGuidedSelectionState({
                recommendationKey: null,
                optionIds: [],
              });
            }}
            className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] px-5 py-3 text-sm font-semibold text-[var(--color-foreground)]"
          >
            Start again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
            Guided path
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
            Answer 5 quick questions and we’ll point you towards a strong starting
            setup.
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </p>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all"
          style={{
            width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="mt-8">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {currentQuestion.questionText}
        </h1>

        <div className="mt-6 grid gap-3">
          {currentQuestion.answers.map((answer) => {
            const isSelected = selectedAnswerSlugs[currentQuestion.slug] === answer.slug;

            return (
              <button
                key={answer.id}
                type="button"
                onClick={() => {
                  setSelectedAnswerSlugs((currentValue) => ({
                    ...currentValue,
                    [currentQuestion.slug]: answer.slug,
                  }));

                  if (currentQuestionIndex < quiz.questions.length - 1) {
                    setCurrentQuestionIndex((currentValue) => currentValue + 1);
                  }
                }}
                className={[
                  "w-full rounded-[1.5rem] border px-5 py-4 text-left transition",
                  isSelected
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]",
                ].join(" ")}
              >
                <span className="text-base font-semibold text-[var(--color-foreground)]">
                  {answer.answerText}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              setCurrentQuestionIndex((currentValue) => Math.max(currentValue - 1, 0))
            }
            disabled={currentQuestionIndex === 0}
            className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border-strong)] px-5 py-3 text-sm font-semibold text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <Link
            href="/configurator"
            className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-muted-foreground)]"
          >
            Skip and configure manually
          </Link>
        </div>
      </div>
    </section>
  );
}
