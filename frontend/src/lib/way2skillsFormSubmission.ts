const configuredWebAppUrl =
  process.env.NEXT_PUBLIC_WAY2SKILLS_APPS_SCRIPT_WEB_APP_URL?.trim() ?? "";

export const WAY2SKILLS_APPS_SCRIPT_WEB_APP_URL = configuredWebAppUrl;

export type Way2SkillsFormPayload =
  | {
      formType: "contact";
      name: string;
      email: string;
      phone: string;
      topic: string;
      message: string;
    }
  | {
      formType: "admission";
      name: string;
      email: string;
      phone: string;
      education: string;
      course: string;
      message: string;
    };

type DeliveryStatus = "sent" | "not_sent" | "unknown" | "not_required";
type SubmissionOutcome = "complete" | "rejected" | "partial" | "uncertain";

type AppsScriptResponse = {
  type: "way2skills-form-response";
  requestId: string;
  success: boolean;
  outcome: SubmissionOutcome;
  companyNotification: DeliveryStatus;
  applicantConfirmation: DeliveryStatus;
  duplicate: boolean;
  message: string;
};

export class Way2SkillsSubmissionError extends Error {
  constructor(
    message: string,
    readonly outcome: Exclude<SubmissionOutcome, "complete"> = "uncertain",
    readonly companyNotification: DeliveryStatus = "unknown",
    readonly applicantConfirmation: DeliveryStatus = "unknown"
  ) {
    super(message);
    this.name = "Way2SkillsSubmissionError";
  }
}

export function createFormSubmissionId(): string {
  return crypto.randomUUID();
}

function isAppsScriptOrigin(origin: string): boolean {
  return (
    origin === "https://script.google.com" ||
    origin === "https://script.googleusercontent.com" ||
    /^https:\/\/(?:[a-z0-9-]+\.)*(?:google\.com|googleusercontent\.com)$/i.test(origin)
  );
}

function isAppsScriptResponse(value: unknown): value is AppsScriptResponse {
  if (!value || typeof value !== "object") return false;

  const response = value as Partial<AppsScriptResponse>;
  const validDeliveryStatuses: DeliveryStatus[] = [
    "sent",
    "not_sent",
    "unknown",
    "not_required",
  ];
  const validOutcomes: SubmissionOutcome[] = [
    "complete",
    "rejected",
    "partial",
    "uncertain",
  ];

  return (
    response.type === "way2skills-form-response" &&
    typeof response.requestId === "string" &&
    typeof response.success === "boolean" &&
    typeof response.outcome === "string" &&
    validOutcomes.includes(response.outcome as SubmissionOutcome) &&
    typeof response.companyNotification === "string" &&
    validDeliveryStatuses.includes(
      response.companyNotification as DeliveryStatus
    ) &&
    typeof response.applicantConfirmation === "string" &&
    validDeliveryStatuses.includes(
      response.applicantConfirmation as DeliveryStatus
    ) &&
    typeof response.duplicate === "boolean" &&
    typeof response.message === "string" &&
    (response.outcome === "complete"
      ? response.success
      : !response.success)
  );
}

export function submitWay2SkillsForm(
  payload: Way2SkillsFormPayload,
  requestId: string
): Promise<void> {
  if (!WAY2SKILLS_APPS_SCRIPT_WEB_APP_URL) {
    return Promise.reject(
      new Way2SkillsSubmissionError(
        "Form submission is not configured. Please contact us directly.",
        "rejected",
        "not_sent",
        "not_required"
      )
    );
  }

  return new Promise((resolve, reject) => {
    const targetName = `way2skills-form-${requestId}`;
    const iframe = document.createElement("iframe");
    iframe.name = targetName;
    iframe.title = "Form submission response";
    iframe.hidden = true;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = WAY2SKILLS_APPS_SCRIPT_WEB_APP_URL;
    form.target = targetName;
    form.enctype = "application/x-www-form-urlencoded";
    form.hidden = true;

    const payloadInput = document.createElement("input");
    payloadInput.name = "payload";
    payloadInput.value = JSON.stringify(payload);

    const requestIdInput = document.createElement("input");
    requestIdInput.name = "requestId";
    requestIdInput.value = requestId;

    const responseOriginInput = document.createElement("input");
    responseOriginInput.name = "responseOrigin";
    responseOriginInput.value = window.location.origin;

    form.append(payloadInput, requestIdInput, responseOriginInput);

    let timeout: number;
    let settled = false;
    let formSubmitted = false;

    function cleanup() {
      window.removeEventListener("message", handleMessage);
      window.clearTimeout(timeout);
      form.remove();
      iframe.remove();
    }

    function rejectOnce(error: Error) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    }

    function handleMessage(event: MessageEvent<unknown>) {
      if (
        !isAppsScriptOrigin(event.origin) ||
        !isAppsScriptResponse(event.data) ||
        event.data.requestId !== requestId
      ) {
        return;
      }

      const response = event.data;
      if (response.outcome === "complete" && response.success) {
        settled = true;
        cleanup();
        resolve();
        return;
      }

      rejectOnce(
        new Way2SkillsSubmissionError(
          response.message,
          response.outcome === "complete" ? "uncertain" : response.outcome,
          response.companyNotification,
          response.applicantConfirmation
        )
      );
    }

    // Secondary safety handler: if the browser blocks cross-origin iframe postMessage,
    // Google Apps Script loading in the iframe indicates the submission finished.
    iframe.addEventListener("load", () => {
      if (!formSubmitted) return;
      window.setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve();
        }
      }, 1500);
    });

    window.addEventListener("message", handleMessage);
    timeout = window.setTimeout(() => {
      rejectOnce(
        new Way2SkillsSubmissionError(
          "We couldn't verify whether the email operation completed. It may have been sent; contact us before retrying.",
          "uncertain"
        )
      );
    }, 20000);

    document.body.append(iframe, form);

    try {
      formSubmitted = true;
      form.submit();
      form.remove();
    } catch {
      rejectOnce(
        new Way2SkillsSubmissionError(
          "We couldn't start the submission. Please check your connection and try again.",
          "uncertain"
        )
      );
    }
  });
}

function hasExpectedDeliveryStatus(
  formType: Way2SkillsFormPayload["formType"],
  response: AppsScriptResponse
): boolean {
  if (response.outcome === "complete") {
    return (
      response.companyNotification === "sent" &&
      response.applicantConfirmation ===
        (formType === "admission" ? "sent" : "not_required")
    );
  }

  if (response.outcome === "rejected") {
    return (
      response.companyNotification === "not_sent" &&
      response.applicantConfirmation === "not_required"
    );
  }

  if (response.outcome === "partial") {
    return (
      formType === "admission" &&
      response.companyNotification === "sent" &&
      (response.applicantConfirmation === "unknown" ||
        response.applicantConfirmation === "not_sent")
    );
  }

  return (
    (response.companyNotification === "unknown" ||
      response.companyNotification === "not_sent" ||
      response.companyNotification === "sent") &&
    (formType === "admission"
      ? response.applicantConfirmation !== "not_required"
      : response.applicantConfirmation === "not_required")
  );
}
