import { NextResponse } from "next/server";

import { getSubmissionPdfData } from "@/features/enquiry/lib/get-submission-pdf-data";
import { renderConfiguratorPdf } from "@/features/enquiry/lib/render-configurator-pdf";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    configurationId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { configurationId } = await context.params;
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Missing submission reference." },
        { status: 400 },
      );
    }

    const data = await getSubmissionPdfData(configurationId, reference);

    if (!data) {
      return NextResponse.json(
        { error: "The submitted configuration PDF could not be found." },
        { status: 404 },
      );
    }

    const pdfBuffer = await renderConfiguratorPdf(data);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="go-pods-${data.reference.toLowerCase()}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to generate configurator PDF.", error);

    return NextResponse.json(
      {
        error:
          "The configuration PDF could not be generated right now. Please try again.",
      },
      { status: 500 },
    );
  }
}
