import { webcrypto } from "node:crypto";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfiguratorFlow } from "./configurator-flow";
import type { ConfiguratorSubmissionResult } from "@/types/configurator";
import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";
import { submitConfiguratorEnquiry } from "@/features/enquiry/actions/submit-configurator-enquiry";

vi.mock("@/features/enquiry/actions/submit-configurator-enquiry", () => ({
  submitConfiguratorEnquiry: vi.fn(),
}));
vi.mock("./summary-sidebar", () => ({
  SummarySidebar: ({ renderActionArea }: { renderActionArea: (options: object) => ReactNode }) => renderActionArea({}),
}));

function renderReview() {
  const view = render(<ConfiguratorFlow catalogue={demoCatalogue} initialSelections={{
    currentStep: "details", selectedModelSlug: "classic", selectedOptionIds: [],
  }} />);
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Test Visitor" } });
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "test@example.com" } });
  fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "07123456789" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  return view;
}

describe("configurator submission retries", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("crypto", webcrypto);
    vi.stubGlobal("requestAnimationFrame", () => 0);
    vi.mocked(submitConfiguratorEnquiry).mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reuses the API idempotency key after a lost response and component remount, then clears it on success", async () => {
    vi.mocked(submitConfiguratorEnquiry).mockRejectedValueOnce(new Error("Response lost"));
    const first = renderReview();
    fireEvent.click(screen.getByRole("button", { name: "Submit enquiry" }));
    await screen.findByText("We could not confirm your enquiry. Please try again.");
    const firstId = vi.mocked(submitConfiguratorEnquiry).mock.calls[0][1];
    first.unmount();
    vi.mocked(submitConfiguratorEnquiry).mockResolvedValueOnce({
      status: "success", configurationId: "example", reference: "GP-TEST",
      emailDelivery: { status: "queued" },
    });
    renderReview();
    fireEvent.click(screen.getByRole("button", { name: "Submit enquiry" }));
    await screen.findByRole("button", { name: "Submitted" });
    expect(vi.mocked(submitConfiguratorEnquiry).mock.calls[1][1]).toBe(firstId);
    expect(sessionStorage.length).toBe(0);
  });

  it("retains the pending ID when the component unmounts before its successful response can be shown", async () => {
    let finishRequest!: (result: ConfiguratorSubmissionResult) => void;
    vi.mocked(submitConfiguratorEnquiry).mockImplementationOnce(() => new Promise((resolve) => { finishRequest = resolve; }));
    const first = renderReview();
    fireEvent.click(screen.getByRole("button", { name: "Submit enquiry" }));
    await waitFor(() => expect(submitConfiguratorEnquiry).toHaveBeenCalledTimes(1));
    const firstId = vi.mocked(submitConfiguratorEnquiry).mock.calls[0][1];
    first.unmount();
    await act(async () => { finishRequest({
      status: "success", configurationId: "example", reference: "GP-TEST",
      emailDelivery: { status: "queued" },
    }); });
    vi.mocked(submitConfiguratorEnquiry).mockResolvedValue({ status: "error", errors: { form: "Test transport failure" } });
    renderReview();
    fireEvent.click(screen.getByRole("button", { name: "Submit enquiry" }));
    await waitFor(() => expect(submitConfiguratorEnquiry).toHaveBeenCalledTimes(2));
    expect(vi.mocked(submitConfiguratorEnquiry).mock.calls[1][1]).toBe(firstId);
  });

  it("locks before asynchronous hashing so rapid clicks produce only one submission", async () => {
    let finishDigest!: (value: ArrayBuffer) => void;
    const digest = vi.spyOn(webcrypto.subtle, "digest").mockImplementation(() => new Promise((resolve) => { finishDigest = resolve; }));
    vi.mocked(submitConfiguratorEnquiry).mockResolvedValue({ status: "error", errors: { form: "Test transport failure" } });
    renderReview();
    const submit = screen.getByRole("button", { name: "Submit enquiry" });
    act(() => {
      submit.click();
      submit.click();
    });
    expect(digest).toHaveBeenCalledTimes(1);
    expect(submitConfiguratorEnquiry).not.toHaveBeenCalled();
    await act(async () => { finishDigest(new ArrayBuffer(32)); });
    await waitFor(() => expect(submitConfiguratorEnquiry).toHaveBeenCalledTimes(1));
  });

  it("warns to keep the page open when an action returns a transport error and storage is blocked", async () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => { throw new Error("Blocked"); });
    vi.mocked(submitConfiguratorEnquiry).mockResolvedValue({ status: "error", errors: { form: "We could not confirm your enquiry." } });
    renderReview();
    fireEvent.click(screen.getByRole("button", { name: "Submit enquiry" }));
    await screen.findByText(/Please retry without reloading this page/);
    const firstId = vi.mocked(submitConfiguratorEnquiry).mock.calls[0][1];
    fireEvent.click(screen.getByRole("button", { name: "Submit enquiry" }));
    await waitFor(() => expect(submitConfiguratorEnquiry).toHaveBeenCalledTimes(2));
    expect(vi.mocked(submitConfiguratorEnquiry).mock.calls[1][1]).toBe(firstId);
  });
});
