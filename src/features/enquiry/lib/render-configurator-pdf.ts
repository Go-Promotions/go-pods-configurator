import fs from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";

import { formatPrice, formatWeightKg } from "@/features/configurator/lib/formatters";
import { DEFAULT_MTPLM_KG } from "@/features/configurator/lib/vehicle-constants";
import { enquiryTypeLabels } from "@/features/enquiry/lib/enquiry-labels";
import type { SubmissionPdfData } from "@/features/enquiry/lib/get-submission-pdf-data";

const colors = {
  ink: "#1F2933",
  muted: "#52606D",
  accent: "#39B54A",
  accentStrong: "#2E913D",
  panel: "#F6FCF7",
  accentPanel: "#E9F8EB",
  border: "#D9E2EC",
};

const PDF_FONT_REGULAR = "GoPodsPdfRegular";
const PDF_FONT_STRONG = "GoPodsPdfStrong";
const PAGE_MARGIN = 48;
const CONTENT_WIDTH = 499;

let pdfFontBuffer: Buffer | null = null;
let goPodsLogoData: {
  width: number;
  height: number;
  paths: Array<{
    className: string;
    pathData: string;
  }>;
} | null = null;

function getPdfFontBuffer() {
  if (pdfFontBuffer) {
    return pdfFontBuffer;
  }

  const fontPath = path.join(process.cwd(), "public", "fonts", "Geist-Regular.ttf");

  if (!fs.existsSync(fontPath)) {
    throw new Error(`PDF font file could not be found at ${fontPath}`);
  }

  pdfFontBuffer = fs.readFileSync(fontPath);
  return pdfFontBuffer;
}

function getGoPodsLogoData() {
  if (goPodsLogoData) {
    return goPodsLogoData;
  }

  const logoPath = path.join(
    process.cwd(),
    "public",
    "images",
    "logo",
    "go-pods-logo.svg",
  );

  if (!fs.existsSync(logoPath)) {
    throw new Error(`Go-Pods logo SVG could not be found at ${logoPath}`);
  }

  const logoMarkup = fs.readFileSync(logoPath, "utf8");
  const viewBoxMatch = logoMarkup.match(/viewBox="0 0 ([^ ]+) ([^"]+)"/);

  if (!viewBoxMatch) {
    throw new Error("Go-Pods logo SVG is missing a supported viewBox.");
  }

  const width = Number(viewBoxMatch[1]);
  const height = Number(viewBoxMatch[2]);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error("Go-Pods logo SVG viewBox dimensions are invalid.");
  }

  const paths = Array.from(
    logoMarkup.matchAll(/<path\s+class="([^"]+)"\s+d="([^"]+)"/g),
  ).map((match) => ({
    className: match[1],
    pathData: match[2],
  }));

  if (paths.length === 0) {
    throw new Error("Go-Pods logo SVG does not contain any path data.");
  }

  goPodsLogoData = {
    width,
    height,
    paths,
  };

  return goPodsLogoData;
}

export async function renderConfiguratorPdf(data: SubmissionPdfData) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    font: null as unknown as string,
    info: {
      Title: `Go-Pods Configurator ${data.reference}`,
      Author: "Go-Pods Configurator",
    },
  });
  const fontBuffer = getPdfFontBuffer();

  doc.registerFont(PDF_FONT_REGULAR, fontBuffer);
  doc.registerFont(PDF_FONT_STRONG, fontBuffer);
  doc.font(PDF_FONT_REGULAR);

  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let currentY = renderHeader(doc, data);
    currentY = renderCustomerAndSubmission(doc, data, currentY);
    currentY = renderModelAvailabilityNotice(doc, data, currentY);
    currentY = renderConfigurationSummary(doc, data, currentY);
    currentY = renderOptions(doc, data, currentY);
    renderNotesAndNextSteps(doc, data, currentY);

    doc.end();
  });
}

function renderHeader(doc: PDFKit.PDFDocument, data: SubmissionPdfData) {
  const headerY = 44;
  const headerHeight = 118;
  const logoBoxX = PAGE_MARGIN + 18;
  const logoBoxY = headerY + 18;
  const logoBoxWidth = 108;
  const logoBoxHeight = 76;
  const titleX = logoBoxX + logoBoxWidth + 18;
  const metaPanelX = 395;
  const metaPanelY = headerY + 14;
  const metaPanelWidth = 132;
  const metaPanelHeight = 90;
  const sideBlockCenterY =
    ((logoBoxY + logoBoxHeight / 2) + (metaPanelY + metaPanelHeight / 2)) / 2;
  const titleOptions = {
    width: 220,
    lineGap: 3,
  };

  doc
    .roundedRect(PAGE_MARGIN, headerY, CONTENT_WIDTH, headerHeight, 18)
    .fill(colors.panel);

  doc
    .roundedRect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 12)
    .fillAndStroke("#ffffff", colors.border);

  drawGoPodsLogo(doc, logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight);

  doc
    .roundedRect(metaPanelX, metaPanelY, metaPanelWidth, metaPanelHeight, 14)
    .fillAndStroke("#ffffff", colors.border);

  doc
    .font(PDF_FONT_STRONG)
    .fontSize(28);

  const titleHeight = doc.heightOfString("Configuration Summary", titleOptions);
  const titleY = sideBlockCenterY - titleHeight / 2;

  doc
    .fillColor(colors.accent)
    .font(PDF_FONT_STRONG)
    .fontSize(28)
    .text("Configuration Summary", titleX, titleY, titleOptions);

  doc
    .fillColor(colors.accentStrong)
    .font(PDF_FONT_STRONG)
    .fontSize(9)
    .text("REFERENCE", metaPanelX + 16, metaPanelY + 16, {
      characterSpacing: 0.8,
    });

  doc
    .fillColor(colors.ink)
    .font(PDF_FONT_STRONG)
    .fontSize(10)
    .text(data.reference, metaPanelX + 16, metaPanelY + 34, {
      width: metaPanelWidth - 32,
      lineGap: 2,
    });

  doc
    .fillColor(colors.accentStrong)
    .font(PDF_FONT_STRONG)
    .fontSize(9)
    .text("SUBMITTED", metaPanelX + 16, metaPanelY + 62, {
      characterSpacing: 0.8,
    });

  doc
    .fillColor(colors.ink)
    .font(PDF_FONT_REGULAR)
    .fontSize(10)
    .text(formatSubmissionDate(data.submittedAt), metaPanelX + 16, metaPanelY + 80, {
      width: metaPanelWidth - 32,
    });

  return headerY + headerHeight + 26;
}

function drawGoPodsLogo(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const logoData = getGoPodsLogoData();
  const horizontalPadding = 10;
  const verticalPadding = 12;
  const drawableWidth = width - horizontalPadding * 2;
  const drawableHeight = height - verticalPadding * 2;
  const scale = Math.min(
    drawableWidth / logoData.width,
    drawableHeight / logoData.height,
  );
  const renderedWidth = logoData.width * scale;
  const renderedHeight = logoData.height * scale;
  const offsetX = x + (width - renderedWidth) / 2;
  const offsetY = y + (height - renderedHeight) / 2;

  doc.save();
  doc.translate(offsetX, offsetY);
  doc.scale(scale);

  for (const logoPath of logoData.paths) {
    doc.fillColor(colors.accent);
    doc.path(logoPath.pathData);

    if (logoPath.className === "st0") {
      doc.fill("even-odd");
      continue;
    }

    doc.fill();
  }

  doc.restore();
}

function renderCustomerAndSubmission(
  doc: PDFKit.PDFDocument,
  data: SubmissionPdfData,
  startY: number,
) {
  renderSectionTitle(doc, "Customer details", startY);

  renderTwoColumnRows(
    doc,
    startY + 24,
    [
      ["Customer name", data.customer.name],
      ["Selected model", data.model.name],
      ["Email", data.customer.email],
      ["Enquiry intent", enquiryTypeLabels[data.customer.enquiryType]],
      ["Phone", data.customer.phone],
      ["Postcode", data.customer.postcode ?? "Not provided"],
    ],
  );

  return startY + 24 + 168 + 22;
}

function renderConfigurationSummary(
  doc: PDFKit.PDFDocument,
  data: SubmissionPdfData,
  startY: number,
) {
  renderSectionTitle(doc, "Pricing and weight summary", startY);

  const panelY = startY + 24;
  const remainingPayload = DEFAULT_MTPLM_KG - data.weights.updatedMiro;

  drawSummaryStrip(doc, PAGE_MARGIN, panelY, CONTENT_WIDTH, 76, [
    ["Base price", formatPrice(data.pricing.basePrice)],
    ["Options total", formatPrice(data.pricing.optionsTotal)],
    ["Total price", formatPrice(data.pricing.totalPrice)],
  ]);

  drawSummaryStrip(doc, PAGE_MARGIN, panelY + 92, CONTENT_WIDTH, 76, [
    ["Base MiRO", formatWeightKg(data.weights.baseMiro)],
    ["Added option weight", formatWeightKg(data.weights.addedOptionWeight)],
    ["MTPLM", formatWeightKg(DEFAULT_MTPLM_KG)],
    ["Remaining payload", formatWeightKg(remainingPayload)],
  ]);

  return panelY + 168 + 22;
}

function renderModelAvailabilityNotice(
  doc: PDFKit.PDFDocument,
  data: SubmissionPdfData,
  startY: number,
) {
  if (!data.model.availabilityNotice) {
    return startY;
  }

  const panelHeight = 68;

  doc
    .roundedRect(PAGE_MARGIN, startY, CONTENT_WIDTH, panelHeight, 12)
    .fillAndStroke("#FFF7EB", "#B58A4B");
  doc
    .fillColor("#7A5722")
    .font(PDF_FONT_STRONG)
    .fontSize(11)
    .text("MODEL NO LONGER AVAILABLE", PAGE_MARGIN + 16, startY + 13, {
      characterSpacing: 0.7,
    });
  doc
    .font(PDF_FONT_REGULAR)
    .fontSize(10)
    .text(
      data.model.availabilityNotice,
      PAGE_MARGIN + 16,
      startY + 34,
      { width: CONTENT_WIDTH - 32, lineGap: 2 },
    );

  return startY + panelHeight + 22;
}

function renderOptions(
  doc: PDFKit.PDFDocument,
  data: SubmissionPdfData,
  startY: number,
) {
  let currentY = startY;

  if (currentY > 670) {
    doc.addPage();
    currentY = 60;
  }

  renderSectionTitle(doc, "Selected options", currentY);
  currentY += 28;

  if (data.optionsByCategory.length === 0) {
    doc
      .roundedRect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 48, 12)
      .strokeColor(colors.border)
      .lineWidth(1)
      .dash(4, { space: 3 })
      .stroke()
      .undash();

    doc
      .fillColor(colors.muted)
      .font(PDF_FONT_REGULAR)
      .fontSize(10)
      .text("No options were selected for this configuration.", 64, currentY + 16);

    return currentY + 48 + 22;
  }

  for (const category of data.optionsByCategory) {
    if (currentY > 690) {
      doc.addPage();
      currentY = 60;
      renderSectionTitle(doc, "Selected options", currentY);
      currentY += 28;
    }

    doc
      .roundedRect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 28, 10)
      .fill(colors.accentPanel);

    doc
      .fillColor(colors.accent)
      .font(PDF_FONT_STRONG)
      .fontSize(11)
      .text(category.categoryName, 62, currentY + 8);
    currentY += 40;

    for (const item of category.items) {
      if (currentY > 720) {
        doc.addPage();
        currentY = 60;
      }

      doc
        .roundedRect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 48, 10)
        .fillAndStroke("#ffffff", colors.border);

      doc
        .fillColor(colors.ink)
        .font(PDF_FONT_STRONG)
        .fontSize(10)
        .text(item.title, 62, currentY + 10, { width: 250 });

      doc
        .fillColor(colors.muted)
        .font(PDF_FONT_REGULAR)
        .fontSize(9)
        .text(item.slug, 62, currentY + 25, { width: 250 });

      doc
        .fillColor(colors.ink)
        .font(PDF_FONT_STRONG)
        .fontSize(10)
        .text(formatPrice(item.price), 340, currentY + 10, {
          width: 80,
          align: "right",
        })
        .text(formatWeightKg(item.weight), 440, currentY + 10, {
          width: 80,
          align: "right",
        });

      doc
        .fillColor(colors.muted)
        .font(PDF_FONT_REGULAR)
        .fontSize(8)
        .text("Price", 340, currentY + 26, {
          width: 80,
          align: "right",
        })
        .text("Weight", 440, currentY + 26, {
          width: 80,
          align: "right",
        });

      currentY += 58;
    }

    currentY += 6;
  }

  return currentY + 12;
}

function renderNotesAndNextSteps(
  doc: PDFKit.PDFDocument,
  data: SubmissionPdfData,
  startY: number,
) {
  let currentY = startY;

  if (currentY > 660) {
    doc.addPage();
    currentY = 60;
  }

  renderSectionTitle(doc, "Notes and next steps", currentY);
  currentY += 22;

  doc
    .roundedRect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 92, 12)
    .fillAndStroke("#ffffff", colors.border);

  doc
    .fillColor(colors.ink)
    .font(PDF_FONT_STRONG)
    .fontSize(10)
    .text("Customer notes", 62, currentY + 12);

  doc
    .fillColor(colors.muted)
    .font(PDF_FONT_REGULAR)
    .fontSize(10)
    .text(data.customer.notes ?? "No notes were provided.", 62, currentY + 28, {
      width: 470,
      height: 52,
    });

  currentY += 110;

  doc
    .roundedRect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 76, 12)
    .fill(colors.accentPanel);

  doc
    .fillColor(colors.ink)
    .font(PDF_FONT_STRONG)
    .fontSize(10)
    .text("What happens next", 62, currentY + 14);

  doc
    .fillColor(colors.muted)
    .font(PDF_FONT_REGULAR)
    .fontSize(10)
    .text(
      "A member of the Go-Pods sales team will review this configuration and contact you to discuss the next steps. If you have any questions, please feel free to contact us at sales@go-pods.co.uk or by telephone on 01234 816 832.",
      62,
      currentY + 30,
      { width: 460 },
    );
}

function renderSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
  y: number,
) {
  doc
    .fillColor(colors.accent)
    .rect(PAGE_MARGIN, y + 4, 4, 14)
    .fill();

  doc
    .fillColor(colors.ink)
    .font(PDF_FONT_STRONG)
    .fontSize(14)
    .text(title, 60, y);
}

function renderTwoColumnRows(
  doc: PDFKit.PDFDocument,
  startY: number,
  rows: Array<[string, string]>,
) {
  const leftRows = rows.filter((_, index) => index % 2 === 0);
  const rightRows = rows.filter((_, index) => index % 2 === 1);

  drawLabelValueRows(doc, 48, startY, 236, leftRows);
  drawLabelValueRows(doc, 311, startY, 236, rightRows);
}

function drawLabelValueRows(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  rows: Array<[string, string]>,
) {
  let currentY = y;

  for (const [label, value] of rows) {
    doc
      .roundedRect(x, currentY, width, 46, 12)
      .fillAndStroke("#ffffff", colors.border);

    doc
      .fillColor(colors.muted)
      .font(PDF_FONT_REGULAR)
      .fontSize(9)
      .text(label, x + 14, currentY + 10);

    doc
      .fillColor(colors.ink)
      .font(PDF_FONT_STRONG)
      .fontSize(10)
      .text(value, x + 14, currentY + 23, {
        width: width - 28,
      });

    currentY += 56;
  }
}

function drawSummaryStrip(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  rows: Array<[string, string]>,
) {
  doc.roundedRect(x, y, width, height, 16).fillAndStroke("#ffffff", colors.border);

  const itemWidth = width / rows.length;

  rows.forEach(([label, value], index) => {
    const itemX = x + itemWidth * index;

    if (index > 0) {
      doc
        .strokeColor(colors.border)
        .moveTo(itemX, y + 14)
        .lineTo(itemX, y + height - 14)
        .stroke();
    }

    doc
      .fillColor(colors.accentStrong)
      .font(PDF_FONT_STRONG)
      .fontSize(8)
      .text(label, itemX + 14, y + 16, {
        width: itemWidth - 28,
        align: "center",
      });

    doc
      .fillColor(colors.ink)
      .font(PDF_FONT_STRONG)
      .fontSize(12)
      .text(value, itemX + 14, y + 35, {
        width: itemWidth - 28,
        align: "center",
        lineGap: 2,
      });
  });
}

function formatSubmissionDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
