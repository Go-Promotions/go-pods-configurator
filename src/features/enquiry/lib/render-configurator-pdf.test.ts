import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SubmissionPdfData } from "@/features/enquiry/lib/get-submission-pdf-data";
import { renderConfiguratorPdf } from "@/features/enquiry/lib/render-configurator-pdf";

const pdfCapture = vi.hoisted(() => ({ texts: [] as string[] }));

vi.mock("pdfkit", () => {
  class FakePdfDocument {
    private listeners = new Map<string, Array<(value?: Buffer) => void>>();

    on(event: string, listener: (value?: Buffer) => void) {
      this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
      return this;
    }

    end() {
      for (const listener of this.listeners.get("data") ?? []) {
        listener(Buffer.from("pdf"));
      }
      for (const listener of this.listeners.get("end") ?? []) {
        listener();
      }
      return this;
    }

    text(value: string) {
      pdfCapture.texts.push(value);
      return this;
    }

    heightOfString() {
      return 20;
    }

    addPage() { return this; }
    dash() { return this; }
    fill() { return this; }
    fillAndStroke() { return this; }
    fillColor() { return this; }
    font() { return this; }
    fontSize() { return this; }
    lineTo() { return this; }
    lineWidth() { return this; }
    moveTo() { return this; }
    path() { return this; }
    rect() { return this; }
    registerFont() { return this; }
    restore() { return this; }
    roundedRect() { return this; }
    save() { return this; }
    scale() { return this; }
    stroke() { return this; }
    strokeColor() { return this; }
    translate() { return this; }
    undash() { return this; }
  }

  return { default: FakePdfDocument };
});

const baseData: SubmissionPdfData = {
  reference: "GP-HISTORICAL",
  submittedAt: "2026-07-01T10:01:00.000Z",
  customer: {
    name: "Historical customer",
    email: "customer@example.com",
    phone: "07123456789",
    postcode: "AB1 2CD",
    notes: null,
    enquiryType: "general_enquiry",
    marketingConsent: false,
  },
  model: {
    name: "Pioneer",
    slug: "pioneer",
    availabilityNotice:
      "Pioneer is sold out and is no longer available for new orders.",
  },
  pricing: { basePrice: 18000, optionsTotal: 0, totalPrice: 18000 },
  weights: { baseMiro: 750, addedOptionWeight: 0, updatedMiro: 750 },
  optionsByCategory: [],
};

describe("renderConfiguratorPdf", () => {
  beforeEach(() => {
    pdfCapture.texts.length = 0;
  });

  it("renders the historical model availability notice", async () => {
    await renderConfiguratorPdf(baseData);

    expect(pdfCapture.texts).toContain("MODEL NO LONGER AVAILABLE");
    expect(pdfCapture.texts).toContain(baseData.model.availabilityNotice);
  });

  it("omits the notice for an available model", async () => {
    await renderConfiguratorPdf({
      ...baseData,
      model: { name: "Classic", slug: "classic", availabilityNotice: null },
    });

    expect(pdfCapture.texts).not.toContain("MODEL NO LONGER AVAILABLE");
  });
});
