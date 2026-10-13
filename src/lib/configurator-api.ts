import "server-only";
import { cache } from "react";
import type { Database } from "@/types/supabase";

const catalogueTables = ["models", "model_specs", "model_images", "option_categories", "options", "option_images", "option_model_compatibility", "option_model_inclusions", "option_package_inclusions", "quiz_questions", "quiz_answers", "quiz_answer_option_suggestions", "quiz_answer_model_scores"] as const;

export type CatalogueRows = { [K in (typeof catalogueTables)[number]]: Database["public"]["Tables"][K]["Row"][] };

export function isConfiguratorPreview() {
  const url = process.env.CONFIGURATOR_API_URL;
  const token = process.env.CONFIGURATOR_API_TOKEN;
  if (url || token) {
    if (!url || !token) throw new Error("Both CONFIGURATOR_API_URL and CONFIGURATOR_API_TOKEN are required.");
    return false;
  }
  if (process.env.CONFIGURATOR_PREVIEW === "true") return true;
  throw new Error("Configure the Go-Pods API, or explicitly enable CONFIGURATOR_PREVIEW for a non-submitting demo.");
}

export class ConfiguratorApiError extends Error {
  constructor(public status: number, public errors?: Record<string, string | string[]>) {
    super(`Go-Pods API request failed (${status}).`);
  }
}

export async function configuratorApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (isConfiguratorPreview()) throw new Error("Submissions are unavailable in preview mode.");
  const base = new URL(process.env.CONFIGURATOR_API_URL!);
  if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))) {
    throw new Error("CONFIGURATOR_API_URL requires HTTPS except on loopback.");
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${process.env.CONFIGURATOR_API_TOKEN}`);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(new URL(`/api/v1/configurator/${path}`, base), {
    ...init, headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ConfiguratorApiError(response.status, body.error?.fields ?? body.errors);
  }
  const body = await response.json();
  if (!body || !("data" in body)) throw new Error("Invalid Go-Pods API response.");
  return body.data as T;
}

// React cache shares a single catalogue snapshot within the current server render.
export const getCatalogueRows = cache(async (): Promise<CatalogueRows> => {
  const rows = await configuratorApi<CatalogueRows>("catalogue");
  for (const table of catalogueTables) {
    if (!Array.isArray(rows[table])) throw new Error(`Missing catalogue table: ${table}`);
  }
  return rows;
});
