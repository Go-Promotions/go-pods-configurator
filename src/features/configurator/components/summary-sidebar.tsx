"use client";

import { useState } from "react";

import { formatPrice, formatWeightKg } from "@/features/configurator/lib/formatters";
import type {
  ConfiguratorModel,
  ConfiguratorOption,
  ConfiguratorSummary,
} from "@/types/configurator";

import { OptionDetailsDialog } from "./option-details-dialog";

interface SummarySidebarProps {
  summary: ConfiguratorSummary;
  selectedOptions: ConfiguratorOption[];
  allOptions: ConfiguratorOption[];
  selectedModel: ConfiguratorModel | null;
  selectedModelName: string | null;
  onToggleOption: (optionId: string) => void;
  isLocked?: boolean;
}

export function SummarySidebar({
  summary,
  selectedOptions,
  allOptions,
  selectedModel,
  selectedModelName,
  onToggleOption,
  isLocked = false,
}: SummarySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modelLabel = summary.selectedModelName
    ? `Your Go-Pod ${summary.selectedModelName}`
    : "Your Go-Pod configuration";

  return (
    <>
      <aside className="hidden rounded-[1.75rem] border border-[var(--color-border)] bg-white p-6 text-[var(--color-foreground)] shadow-[var(--shadow-soft)] lg:sticky lg:top-8 lg:block">
        <SummaryPanelContent
          summary={summary}
          modelLabel={modelLabel}
          selectedOptions={selectedOptions}
          allOptions={allOptions}
          selectedModel={selectedModel}
          selectedModelName={selectedModelName}
          onToggleOption={onToggleOption}
          isLocked={isLocked}
        />
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-white/98 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 shadow-[0_-18px_50px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 rounded-[1.25rem] border border-[var(--color-border)] bg-white px-4 py-3 text-left text-[var(--color-foreground)]"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Summary
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-accent)]">
              {formatPrice(summary.runningTotal)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-muted-foreground)]">Total</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-xl text-[var(--color-accent)]">
              {isOpen ? "−" : "+"}
            </span>
          </div>
        </button>

        {isOpen ? (
          <div className="mt-3 max-h-[70vh] overflow-y-auto rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4 text-[var(--color-foreground)] shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--color-accent)]">Summary</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-lg text-[var(--color-accent)]"
                aria-label="Minimise summary"
              >
                −
              </button>
            </div>
            <SummaryPanelContent
              summary={summary}
              modelLabel={modelLabel}
              selectedOptions={selectedOptions}
              allOptions={allOptions}
              selectedModel={selectedModel}
              selectedModelName={selectedModelName}
              onToggleOption={onToggleOption}
              isLocked={isLocked}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

interface SummaryPanelContentProps {
  summary: ConfiguratorSummary;
  modelLabel: string;
  selectedOptions: ConfiguratorOption[];
  allOptions: ConfiguratorOption[];
  selectedModel: ConfiguratorModel | null;
  selectedModelName: string | null;
  onToggleOption: (optionId: string) => void;
  isLocked?: boolean;
}

function SummaryPanelContent({
  summary,
  modelLabel,
  selectedOptions,
  allOptions,
  selectedModel,
  selectedModelName,
  onToggleOption,
  isLocked = false,
}: SummaryPanelContentProps) {
  return (
    <>
      <div className="space-y-2 border-b border-[var(--color-border)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
          Summary
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">{modelLabel}</h2>
        <p className="text-sm leading-6 text-[var(--color-muted-foreground)]">
          {summary.selectedModelName
            ? "Live totals update as you choose options and styling."
            : "Choose a model to start building your personalised Go-Pod summary."}
        </p>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-[var(--color-border-strong)] bg-[var(--color-accent-soft)] px-4 py-5">
        <p className="text-sm font-medium text-[var(--color-foreground)]">
          Total cost of your configuration
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-accent)]">
          {formatPrice(summary.runningTotal)}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <SummaryRow
          label="Selected model"
          value={summary.selectedModelName ?? "Not selected yet"}
        />
        <SummaryRow label="Base price" value={formatPrice(summary.basePrice)} />
        <SummaryRow
          label="Selected options"
          value={
            summary.selectedOptions.length > 0
              ? `${summary.selectedOptions.length} selected`
              : "No options selected"
          }
        />
        <SummaryRow label="Options total" value={formatPrice(summary.optionsTotal)} />
        <SummaryRow
          label="Added option weight"
          value={formatWeightKg(summary.totalOptionWeight)}
        />
        <SummaryRow
          label="Updated MiRO"
          value={
            summary.updatedMiro === null
              ? "Awaiting model"
              : formatWeightKg(summary.updatedMiro)
          }
        />
        <SummaryRow
          label="Remaining payload"
          value={
            summary.remainingPayload === null
              ? "Awaiting model"
              : formatWeightKg(summary.remainingPayload)
          }
          emphasize={summary.remainingPayload !== null && summary.remainingPayload < 0}
        />
      </div>

      {summary.selectedOptions.length > 0 ? (
        <div className="mt-5 space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-soft)] p-4">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            Selected options
          </p>
          {selectedOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm"
            >
              <OptionDetailsDialog
                option={option}
                allOptions={allOptions}
                selectedModel={selectedModel}
                selectedOptionIds={selectedOptions.map((selectedOption) => selectedOption.id)}
                onToggleOption={onToggleOption}
                isSelectionLocked={isLocked}
                compatibilityLabel={
                  selectedModelName
                    ? `Selected for your ${selectedModelName} configuration.`
                    : "Selected for your current configuration."
                }
                triggerAriaLabel={`View details for ${option.title}`}
                triggerClassName="flex min-w-0 flex-1 items-start justify-between gap-4 text-left"
                triggerContent={
                  <>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--color-foreground)]">
                        {option.title}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                        {option.scope}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-[var(--color-foreground)]">
                        {formatPrice(option.price)}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {formatWeightKg(option.weight)}
                      </p>
                    </div>
                  </>
                }
              />
              <button
                type="button"
                onClick={() => onToggleOption(option.id)}
                disabled={isLocked}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-lg font-semibold text-[var(--color-accent)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Remove ${option.title}`}
              >
                −
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  emphasize?: boolean;
}

function SummaryRow({ label, value, emphasize = false }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-[var(--color-border)] pb-3 text-sm">
      <span className="text-[var(--color-muted-foreground)]">{label}</span>
      <span
        className={`text-right font-semibold ${
          emphasize ? "text-[var(--color-danger)]" : "text-[var(--color-foreground)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
