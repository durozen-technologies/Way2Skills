"use client";

import { useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react";
import {
  courseRequest,
  type SubmissionReceipt,
} from "@/lib/coursesApi";
import {
  createFormSubmissionId,
  submitWay2SkillsForm,
} from "@/lib/way2skillsFormSubmission";
import {
  validateName,
  validateEmail,
  validatePhone,
  sanitizePhoneDigits,
  validateTopic,
  validateContactMessage,
  VALID_TOPICS,
} from "@/lib/formValidation";

type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
};

const initialFormData: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  topic: "",
  message: "",
};

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [touched, setTouched] = useState<Record<keyof ContactFormData, boolean>>({
    name: false,
    email: false,
    phone: false,
    topic: false,
    message: false,
  });
  const [status, setStatus] = useState<{
    type: "loading" | "success" | "error";
    message: string;
  } | null>(null);

  const isSubmitting = useRef(false);

  // Compute live validation errors
  const errors = {
    name: validateName(formData.name),
    email: validateEmail(formData.email),
    phone: validatePhone(formData.phone),
    topic: validateTopic(formData.topic),
    message: validateContactMessage(formData.message),
  };

  const isFormValid =
    !errors.name &&
    !errors.email &&
    !errors.phone &&
    !errors.topic &&
    !errors.message;

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({
        ...prev,
        phone: sanitizePhoneDigits(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  function handleBlur(
    e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const fieldName = e.target.name as keyof ContactFormData;
    if (fieldName in touched) {
      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Mark all fields as touched to display errors if any are invalid
    setTouched({
      name: true,
      email: true,
      phone: true,
      topic: true,
      message: true,
    });

    if (!isFormValid || isSubmitting.current) {
      return;
    }

    isSubmitting.current = true;
    setStatus({ type: "loading", message: "Submitting your enquiry..." });
    const contactPayload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      topic: formData.topic.trim(),
      message: formData.message.trim(),
    };

    try {
      await courseRequest<SubmissionReceipt>("/api/contact", undefined, {
        method: "POST",
        body: JSON.stringify(contactPayload),
      });
      void Promise.resolve()
        .then(() =>
          submitWay2SkillsForm(
            { formType: "contact", ...contactPayload },
            createFormSubmissionId()
          )
        )
        .catch((error: unknown) => {
          console.error("Contact notification failed after the enquiry was saved.", error);
        });
      setFormData(initialFormData);
      setTouched({
        name: false,
        email: false,
        phone: false,
        topic: false,
        message: false,
      });
      setStatus({
        type: "success",
        message: "Your enquiry was submitted successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? `We couldn't submit your enquiry. ${error.message}`
            : "We couldn't submit your enquiry. Please check your connection and try again.",
      });
    } finally {
      isSubmitting.current = false;
    }
  }

  const baseInputStyle =
    "w-full rounded-xl border bg-white/[0.05] px-4 py-3 text-base sm:text-sm text-white outline-none transition placeholder:text-white/30 focus:ring-2";

  const getInputClassName = (field: keyof ContactFormData) => {
    const hasError = touched[field] && !!errors[field];
    return `${baseInputStyle} ${
      hasError
        ? "border-red-400/80 focus:border-red-400 focus:ring-red-400/20"
        : "border-white/10 focus:border-sky-400 focus:ring-sky-400/10"
    }`;
  };

  const labelStyle =
    "mb-2 block text-xs font-medium text-white/75 sm:text-sm";

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200/70 bg-[#24344f] p-5 text-white shadow-[0_12px_30px_rgba(15,50,80,0.12)] sm:p-6"
    >
      {/* Form heading */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">
          Get in Touch
        </p>

        <h2 className="mt-2 text-xl font-bold sm:text-2xl">
          Send an Enquiry
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/55">
          Fill in the details below and tell us how we can help.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Full name */}
        <div>
          <label htmlFor="contact-name" className={labelStyle}>
            Full Name <span className="text-red-400">*</span>
          </label>

          <input
            id="contact-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter your name"
            autoComplete="name"
            required
            maxLength={100}
            aria-invalid={touched.name && !!errors.name}
            aria-describedby={
              touched.name && errors.name ? "contact-name-error" : undefined
            }
            className={getInputClassName("name")}
          />
          {touched.name && errors.name && (
            <p
              id="contact-name-error"
              className="mt-1.5 text-xs font-medium text-red-300"
              role="alert"
            >
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="contact-email" className={labelStyle}>
            Email Address <span className="text-red-400">*</span>
          </label>

          <input
            id="contact-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="you@example.com"
            autoComplete="email"
            required
            maxLength={254}
            aria-invalid={touched.email && !!errors.email}
            aria-describedby={
              touched.email && errors.email ? "contact-email-error" : undefined
            }
            className={getInputClassName("email")}
          />
          {touched.email && errors.email && (
            <p
              id="contact-email-error"
              className="mt-1.5 text-xs font-medium text-red-300"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="contact-phone" className={labelStyle}>
            Phone Number <span className="text-red-400">*</span>
          </label>

          <input
            id="contact-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="10-digit mobile number"
            autoComplete="tel"
            required
            maxLength={10}
            aria-invalid={touched.phone && !!errors.phone}
            aria-describedby={
              touched.phone && errors.phone ? "contact-phone-error" : undefined
            }
            className={getInputClassName("phone")}
          />
          {touched.phone && errors.phone && (
            <p
              id="contact-phone-error"
              className="mt-1.5 text-xs font-medium text-red-300"
              role="alert"
            >
              {errors.phone}
            </p>
          )}
        </div>

        {/* Topic */}
        <div>
          <label htmlFor="contact-topic" className={labelStyle}>
            Enquiry About <span className="text-red-400">*</span>
          </label>

          <select
            id="contact-topic"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-invalid={touched.topic && !!errors.topic}
            aria-describedby={
              touched.topic && errors.topic ? "contact-topic-error" : undefined
            }
            className={`${getInputClassName("topic")} [color-scheme:dark]`}
          >
            <option value="" disabled className="bg-[#24344f] text-white/50">
              Select an enquiry topic
            </option>
            {VALID_TOPICS.map((topic) => (
              <option
                key={topic}
                value={topic}
                className="bg-[#24344f] text-white"
              >
                {topic}
              </option>
            ))}
          </select>
          {touched.topic && errors.topic && (
            <p
              id="contact-topic-error"
              className="mt-1.5 text-xs font-medium text-red-300"
              role="alert"
            >
              {errors.topic}
            </p>
          )}
        </div>

        {/* Message */}
        <div className="sm:col-span-2">
          <label htmlFor="contact-message" className={labelStyle}>
            Your Message <span className="text-red-400">*</span>
          </label>

          <textarea
            id="contact-message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Tell us what you would like to know..."
            required
            maxLength={2000}
            aria-invalid={touched.message && !!errors.message}
            aria-describedby={
              touched.message && errors.message
                ? "contact-message-error"
                : undefined
            }
            className={`${getInputClassName("message")} resize-y`}
          />
          {touched.message && errors.message && (
            <p
              id="contact-message-error"
              className="mt-1.5 text-xs font-medium text-red-300"
              role="alert"
            >
              {errors.message}
            </p>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isFormValid || status?.type === "loading"}
        aria-busy={status?.type === "loading"}
        className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-red-600 disabled:hover:shadow-none sm:w-auto"
      >
        {status?.type === "loading" ? "Submitting..." : "Submit Enquiry"}
        <span aria-hidden="true">↗</span>
      </button>

      {status && (
        <p
          role={
            status.type === "error"
              ? "alert"
              : "status"
          }
          aria-live={
            status.type === "error"
              ? "assertive"
              : "polite"
          }
          className={`mt-4 rounded-xl border p-3 text-sm leading-6 ${
            status.type === "error"
              ? "border-red-300/20 bg-red-300/10 text-red-100"
              : "border-sky-300/20 bg-sky-300/10 text-sky-100"
          }`}
        >
          {status.message}
        </p>
      )}
    </form>
  );
}