"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import {
  createFormSubmissionId,
  submitWay2SkillsForm,
  Way2SkillsSubmissionError,
} from "@/lib/way2skillsFormSubmission";
import {
  validateName,
  validateEmail,
  validatePhone,
  sanitizePhoneDigits,
  validateEducation,
  validateCourse,
  validateAdmissionMessage,
  VALID_EDUCATION_LEVELS,
} from "@/lib/formValidation";
import { courseRequest, type Course } from "@/lib/coursesApi";
import {
  internshipRequest,
  type Internship,
} from "@/lib/internshipsApi";

type ProgrammeType = "course" | "internship" | "programme";

type AdmissionFormData = {
  name: string;
  email: string;
  phone: string;
  education: string;
  course: string;
  message: string;
};

const initialFormData: AdmissionFormData = {
  name: "",
  email: "",
  phone: "",
  education: "",
  course: "",
  message: "",
};

export default function AdmissionForm() {
  const [formData, setFormData] = useState<AdmissionFormData>(initialFormData);
  const [programmeType, setProgrammeType] = useState<ProgrammeType>("course");
  const [courses, setCourses] = useState<Course[]>([]);
  const [programmes, setProgrammes] = useState<Course[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsLoadErrors, setOptionsLoadErrors] = useState<
    Partial<Record<ProgrammeType, string>>
  >({});
  const [touched, setTouched] = useState<Record<keyof AdmissionFormData, boolean>>({
    name: false,
    email: false,
    phone: false,
    education: false,
    course: false,
    message: false,
  });
  const [status, setStatus] = useState<{
    type: "loading" | "success" | "error" | "partial";
    message: string;
  } | null>(null);

  const isSubmitting = useRef(false);
  const submissionId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      courseRequest<Course[]>("/api/courses"),
      courseRequest<Course[]>("/api/programmes"),
      internshipRequest<Internship[]>("/api/internships"),
    ])
      .then(([courseResult, programmeResult, internshipResult]) => {
        if (!active) return;
        const loadErrors: Partial<Record<ProgrammeType, string>> = {};
        if (courseResult.status === "fulfilled") {
          setCourses(courseResult.value);
        } else {
          loadErrors.course = "Published courses could not be loaded.";
        }
        if (programmeResult.status === "fulfilled") {
          setProgrammes(programmeResult.value);
        } else {
          loadErrors.programme = "Published programmes could not be loaded.";
        }
        if (internshipResult.status === "fulfilled") {
          setInternships(internshipResult.value);
        } else {
          loadErrors.internship = "Published internships could not be loaded.";
        }
        setOptionsLoadErrors(loadErrors);

        const query = new URLSearchParams(window.location.search);
        const requestedCourse = query.get("course");
        const requestedInternship = query.get("internship");
        const requestedType = query.get("type");
        if (
          requestedInternship &&
          internshipResult.status === "fulfilled" &&
          internshipResult.value.some((item) => item.slug === requestedInternship)
        ) {
          setProgrammeType("internship");
          setFormData((previous) => ({ ...previous, course: requestedInternship }));
        } else if (requestedCourse) {
          if (
            programmeResult.status === "fulfilled" &&
            programmeResult.value.some((item) => item.slug === requestedCourse)
          ) {
            setProgrammeType("programme");
            setFormData((previous) => ({ ...previous, course: requestedCourse }));
          } else if (
            courseResult.status === "fulfilled" &&
            courseResult.value.some((item) => item.slug === requestedCourse)
          ) {
            setProgrammeType("course");
            setFormData((previous) => ({ ...previous, course: requestedCourse }));
          }
        } else if (requestedType === "internship") {
          setProgrammeType("internship");
        } else if (requestedType === "programme") {
          setProgrammeType("programme");
        }
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Compute live validation errors
  const availableItems =
    programmeType === "internship"
      ? internships
      : programmeType === "programme"
        ? programmes
        : courses;
  const selectedItemIsAvailable = availableItems.some(
    (item) => item.slug === formData.course
  );
  const selectionLoadError = optionsLoadErrors[programmeType];
  const errors = {
    name: validateName(formData.name),
    email: validateEmail(formData.email),
    phone: validatePhone(formData.phone),
    education: validateEducation(formData.education),
    course:
      validateCourse(formData.course) ??
      (selectedItemIsAvailable
        ? null
        : availableItems.length === 0
          ? `No published ${programmeType === "internship" ? "internships" : programmeType === "programme" ? "programmes" : "courses"} are available.`
          : `Please select an available ${programmeType}.`),
    message: validateAdmissionMessage(formData.message),
  };

  const isFormValid =
    !errors.name &&
    !errors.email &&
    !errors.phone &&
    !errors.education &&
    !errors.course &&
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

  function handleProgrammeTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (
      value !== "course" &&
      value !== "internship" &&
      value !== "programme"
    ) {
      return;
    }
    setProgrammeType(value);
    setFormData((previous) => ({ ...previous, course: "" }));
    setTouched((previous) => ({ ...previous, course: false }));
  }

  function handleBlur(
    e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const fieldName = e.target.name as keyof AdmissionFormData;
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
      education: true,
      course: true,
      message: true,
    });

    if (!isFormValid || isSubmitting.current) {
      return;
    }

    isSubmitting.current = true;
    setStatus({ type: "loading", message: "Sending your admission enquiry..." });

    const requestId =
      submissionId.current ?? (submissionId.current = createFormSubmissionId());

    try {
      await submitWay2SkillsForm(
        {
          formType: "admission",
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          education: formData.education.trim(),
          course:
            programmeType === "internship"
              ? `Internship: ${internships.find((item) => item.slug === formData.course)?.title ?? formData.course.trim()}`.slice(
                  0,
                  100
                )
              : formData.course.trim(),
          message: formData.message.trim(),
        },
        requestId
      );
      submissionId.current = null;
      setFormData(initialFormData);
      setTouched({
        name: false,
        email: false,
        phone: false,
        education: false,
        course: false,
        message: false,
      });
      setStatus({
        type: "success",
        message:
          "Both notification emails were accepted by the email service. Inbox delivery is not guaranteed.",
      });
    } catch (error) {
      if (error instanceof Way2SkillsSubmissionError) {
        if (error.outcome === "rejected") submissionId.current = null;
        setStatus({
          type: error.outcome === "partial" ? "partial" : "error",
          message: error.message,
        });
      } else {
        setStatus({
          type: "error",
          message:
            "We couldn't verify whether the notifications were sent. Contact admissions before retrying.",
        });
      }
    } finally {
      isSubmitting.current = false;
    }
  }

  const baseInputStyle =
    "w-full rounded-xl border bg-white/[0.05] px-4 py-3 text-base sm:text-sm text-white outline-none transition placeholder:text-white/30 focus:ring-2";

  const getInputClassName = (field: keyof AdmissionFormData) => {
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
      className="rounded-2xl border border-slate-200/70 bg-[#24344f] p-5 text-white shadow-[0_4px_12px_rgba(15,50,80,0.07)] sm:p-6"
    >
      {/* Heading */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">
          Way2Skills Admissions
        </p>

        <h2 className="mt-2 text-xl font-bold sm:text-2xl">
          Admission Enquiry
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/55">
          Tell us a little about yourself. Our admission enquiry form is
          designed to help you ask about programme details and eligibility.
        </p>
      </div>

      {/* Form fields */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Full name */}
        <div>
          <label htmlFor="admission-name" className={labelStyle}>
            Full Name <span className="text-red-400">*</span>
          </label>

          <input
            id="admission-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="name"
            placeholder="Enter your full name"
            maxLength={100}
            required
            aria-invalid={touched.name && !!errors.name}
            aria-describedby={
              touched.name && errors.name ? "admission-name-error" : undefined
            }
            className={getInputClassName("name")}
          />
          {touched.name && errors.name && (
            <p
              id="admission-name-error"
              className="mt-1.5 text-xs font-medium text-red-300"
              role="alert"
            >
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="admission-email" className={labelStyle}>
            Email Address <span className="text-red-400">*</span>
          </label>

          <input
            id="admission-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            required
            aria-invalid={touched.email && !!errors.email}
            aria-describedby={
              touched.email && errors.email ? "admission-email-error" : undefined
            }
            className={getInputClassName("email")}
          />
          {touched.email && errors.email && (
            <p
              id="admission-email-error"
              className="mt-1.5 text-xs font-medium text-red-300"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="admission-phone" className={labelStyle}>
            Phone Number <span className="text-red-400">*</span>
          </label>

          <input
            id="admission-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="tel"
            placeholder="10-digit mobile number"
            maxLength={10}
            required
            aria-invalid={touched.phone && !!errors.phone}
            aria-describedby={
              touched.phone && errors.phone ? "admission-phone-error" : undefined
            }
            className={getInputClassName("phone")}
          />
          {touched.phone && errors.phone && (
            <p
              id="admission-phone-error"
              className="mt-1.5 text-xs font-medium text-red-300"
              role="alert"
            >
              {errors.phone}
            </p>
          )}
        </div>

        {/* Education */}
        <div>
          <label htmlFor="admission-education" className={labelStyle}>
            Education Level <span className="text-red-400">*</span>
          </label>

          <select
            id="admission-education"
            name="education"
            value={formData.education}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-invalid={touched.education && !!errors.education}
            aria-describedby={
              touched.education && errors.education
                ? "admission-education-error"
                : undefined
            }
            className={`${getInputClassName("education")} [color-scheme:dark]`}
          >
            <option value="" disabled className="bg-[#24344f] text-white/50">
              Select education level
            </option>
            <option value="school" className="bg-[#24344f] text-white">
              School Student
            </option>
            <option value="diploma" className="bg-[#24344f] text-white">
              Diploma
            </option>
            <option value="undergraduate" className="bg-[#24344f] text-white">
              Undergraduate
            </option>
            <option value="graduate" className="bg-[#24344f] text-white">
              Graduate
            </option>
            <option value="other" className="bg-[#24344f] text-white">
              Other
            </option>
          </select>
          {touched.education && errors.education && (
            <p
              id="admission-education-error"
              className="mt-1.5 text-xs font-medium text-red-300"
              role="alert"
            >
              {errors.education}
            </p>
          )}
        </div>

        {/* Enquiry type */}
        <div>
          <label htmlFor="admission-programme-type" className={labelStyle}>
            Enquiry Type <span className="text-red-400">*</span>
          </label>
          <select
            id="admission-programme-type"
            name="programmeType"
            value={programmeType}
            onChange={handleProgrammeTypeChange}
            className={`${baseInputStyle} border-white/10 focus:border-sky-400 focus:ring-sky-400/10 [color-scheme:dark]`}
          >
            <option value="course" className="bg-[#24344f] text-white">
              Courses
            </option>
            <option value="internship" className="bg-[#24344f] text-white">
              Internship
            </option>
            <option value="programme" className="bg-[#24344f] text-white">
              Programme
            </option>
          </select>
        </div>

        {/* Selected course, internship, or programme */}
        <div>
          <label htmlFor="admission-course" className={labelStyle}>
            {programmeType === "internship"
              ? "Internship"
              : programmeType === "programme"
                ? "Programme"
                : "Course"}{" "}
            <span className="text-red-400">*</span>
          </label>
          <select
            id="admission-course"
            name="course"
            value={formData.course}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-invalid={touched.course && !!errors.course}
            aria-describedby={
              touched.course && errors.course
                ? "admission-course-error"
                : undefined
            }
            className={`${getInputClassName("course")} [color-scheme:dark]`}
          >
              <option value="" disabled className="bg-[#24344f] text-white/50">
                {optionsLoading
                  ? "Loading options..."
                  : `Select a ${programmeType}`}
              </option>
              {availableItems.map((item) => (
                <option
                  className="bg-[#24344f] text-white"
                  key={item.id}
                  value={item.slug}
                >
                  {item.title}
                </option>
              ))}
            </select>
            {selectionLoadError && (
              <p className="mt-1.5 text-xs font-medium text-amber-200" role="status">
                {selectionLoadError} Please try again later.
              </p>
            )}
          {touched.course && errors.course && (
            <p
              id="admission-course-error"
              className="mt-1.5 text-xs font-medium text-red-300"
              role="alert"
            >
              {errors.course}
            </p>
          )}

          <p className="mt-2 text-[11px] leading-5 text-white/40">
            {optionsLoading
              ? "Loading published courses, internships, and programmes..."
              : `Choose from currently published ${programmeType === "internship" ? "internships" : `${programmeType}s`}.`}
          </p>
        </div>

        {/* Message */}
        <div className="sm:col-span-2">
          <label htmlFor="admission-message" className={labelStyle}>
            Questions or Message{" "}
            <span className="text-white/40 text-[11px] font-normal">(Optional)</span>
          </label>

          <textarea
            id="admission-message"
            name="message"
            rows={3}
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={2000}
            placeholder="Ask us about fees, eligibility, syllabus, or admissions..."
            aria-invalid={touched.message && !!errors.message}
            aria-describedby={
              touched.message && errors.message
                ? "admission-message-error"
                : undefined
            }
            className={`${getInputClassName("message")} resize-y`}
          />
          {touched.message && errors.message && (
            <p
              id="admission-message-error"
              className="mt-1.5 text-xs font-medium text-red-300"
              role="alert"
            >
              {errors.message}
            </p>
          )}
        </div>
      </div>

      {/* Privacy note */}
      <p className="mt-4 border-t border-white/10 pt-4 text-[11px] leading-5 text-white/45">
        Your enquiry will be sent to the admissions team. The form does not
        store your information on this website.
      </p>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!isFormValid || status?.type === "loading"}
        aria-busy={status?.type === "loading"}
        className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-red-600 disabled:hover:shadow-none sm:w-auto"
      >
        {status?.type === "loading"
          ? "Submitting..."
          : "Send Admission Enquiry"}
        <span aria-hidden="true">↗</span>
      </button>

      {/* Preview feedback */}
      {status && (
        <p
          role={
            status.type === "error" || status.type === "partial"
              ? "alert"
              : "status"
          }
          aria-live={
            status.type === "error" || status.type === "partial"
              ? "assertive"
              : "polite"
          }
          className={`mt-4 rounded-xl border p-3 text-sm leading-6 ${
            status.type === "error" || status.type === "partial"
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