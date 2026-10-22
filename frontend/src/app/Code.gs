/**
 * Way2Skills & Durozen Technologies
 * Google Apps Script Form Handler, Google Sheets Logger & Email Notification System
 */

// ============================================================================
// ⚙️ CONFIGURATION
// ============================================================================
const CONTACT_SHEET_NAME = "Contact Leads";
const ADMISSION_SHEET_NAME = "Admission Applications";
const CAREER_SHEET_NAME = "Career Applications";

// Email Settings
const EMAIL_FROM = "hr@durozen.in";  // Sender display / Reply-To email
const ADMIN_EMAIL = "soundararajanselvan2@gmail.com"; // Recipient email for alerts (e.g. soundararajanselvan2@gmail.com / hr@durozen.in)

// Google Spreadsheet ID (Connected Sheet)
const SPREADSHEET_ID = "1zA1qFZH-WgwiW3Zffm0MTkoGFLVN1gzHy3he4mSeQJ8";

// Brand Information
const BRAND_NAME = "Way2Skills";
const COMPANY_NAME = "Durozen Technologies";
const BRAND_WEBSITE = "https://way2skills.in";
const CONTACT_PHONE = "+91 81223 39694";
const CONTACT_EMAIL = "info@durozen.in";

/**
 * Health check & status endpoint (GET)
 */
function doGet(e) {
  let quota = -1;
  try {
    quota = MailApp.getRemainingDailyQuota();
  } catch (err) {
    quota = -1;
  }

  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      service: "Way2Skills Form & Notification Service",
      brand: BRAND_NAME,
      adminEmail: ADMIN_EMAIL,
      spreadsheetId: SPREADSHEET_ID,
      mailDailyQuotaRemaining: quota,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get the target Google Spreadsheet using SPREADSHEET_ID
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } catch (error) {
      Logger.log("Error opening spreadsheet by ID: " + error.toString());
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Initialize the sheet with headers if it doesn't exist
 */
function initializeSheet(sheetName, headers) {
  const ss = getSpreadsheet();
  if (!ss) {
    throw new Error("Spreadsheet not accessible. Please check SPREADSHEET_ID: " + SPREADSHEET_ID);
  }

  let sheet = ss.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    // Already exists
    return sheet;
  }
  
  // Clear existing content and add headers
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row (dark background with bold white text)
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1f2937");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  Logger.log(sheetName + " initialized successfully!");
  return sheet;
}

/**
 * RUN THIS FUNCTION ONCE to manually set up all tables in your Google Sheet
 * (In Apps Script, select 'setupAllSheets' in the toolbar dropdown and click 'Run')
 */
function setupAllSheets() {
  const contactHeaders = ["Timestamp", "Name", "Email", "Phone", "Topic / Industry", "Message", "Status"];
  initializeSheet(CONTACT_SHEET_NAME, contactHeaders);
  
  const admissionHeaders = ["Timestamp", "Name", "Email", "Phone", "Course", "Education", "Message", "Status"];
  initializeSheet(ADMISSION_SHEET_NAME, admissionHeaders);

  const careerHeaders = ["Timestamp", "Name", "Email", "Phone", "Role", "Portfolio", "Message", "Status"];
  initializeSheet(CAREER_SHEET_NAME, careerHeaders);
  
  Logger.log("All tables have been initialized in the spreadsheet!");
}

/**
 * Handle POST request from web forms
 */
function doPost(e) {
  try {
    // Extract parameters (supports direct parameters, JSON payload from Next.js iframe, or raw postData)
    let params = {};
    if (e && e.parameter && e.parameter.payload) {
      try {
        params = typeof e.parameter.payload === "string" ? JSON.parse(e.parameter.payload) : e.parameter.payload;
      } catch (err) {
        params = e.parameter;
      }
    } else if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e?.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    const formType = String(params.formType || "contact").trim().toLowerCase();
    const requestId = String(e?.parameter?.requestId || params.requestId || "");
    const responseOrigin = String(e?.parameter?.responseOrigin || params.responseOrigin || "");

    // Validate required fields
    if (!params.name || !params.email) {
      return returnResponse(
        {
          success: false,
          outcome: "rejected",
          message: "Name and Email are required fields."
        },
        requestId,
        responseOrigin
      );
    }

    const timestamp = formatDisplayDate(new Date());

    if (formType === "admission") {
      // 1. Admission Application
      const headers = ["Timestamp", "Name", "Email", "Phone", "Course", "Education", "Message", "Status"];
      const sheet = initializeSheet(ADMISSION_SHEET_NAME, headers);

      const course = params.course || "Full Stack Web Development";
      const education = params.education || "Not specified";

      const dataRow = [
        timestamp,
        params.name || "",
        params.email || "",
        params.phone || "",
        course,
        education,
        params.message || "",
        "New"
      ];
      sheet.appendRow(dataRow);

      // Send email to Admin
      sendAdminAdmissionEmail(params.name, params.email, params.phone, course, education, params.message, timestamp);

      // Send confirmation email to Student
      sendStudentAdmissionEmail(params.name, params.email, params.phone, course, education);

    } else if (formType === "career") {
      // 2. Career Application
      const headers = ["Timestamp", "Name", "Email", "Phone", "Role", "Portfolio", "Message", "Status"];
      const sheet = initializeSheet(CAREER_SHEET_NAME, headers);

      const role = params.role || "Software Engineer";
      const portfolio = params.portfolio || "";

      const dataRow = [
        timestamp,
        params.name || "",
        params.email || "",
        params.phone || "",
        role,
        portfolio,
        params.message || "",
        "New"
      ];
      sheet.appendRow(dataRow);

      // Send email to Admin
      sendAdminCareerEmail(params.name, params.email, params.phone, role, portfolio, params.message, timestamp);

      // Send confirmation email to Applicant
      sendApplicantEmail(params.name, params.email);

    } else {
      // 3. Contact Form / General Enquiry
      const headers = ["Timestamp", "Name", "Email", "Phone", "Topic / Industry", "Message", "Status"];
      const sheet = initializeSheet(CONTACT_SHEET_NAME, headers);

      const topic = params.topic || params.serviceInterest || params.industry || "General Enquiry";

      const dataRow = [
        timestamp,
        params.name || "",
        params.email || "",
        params.phone || "",
        topic,
        params.message || "",
        "New"
      ];
      sheet.appendRow(dataRow);

      // Send notification to Admin
      sendAdminContactEmail(params.name, params.email, params.phone, topic, params.message, timestamp);

      // Send confirmation to Customer
      sendCustomerEmail(params.name, params.email, topic);
    }

    return returnResponse(
      {
        success: true,
        outcome: "complete",
        message: "Thank you! We received your submission."
      },
      requestId,
      responseOrigin,
      formType
    );

  } catch (error) {
    Logger.log("Error processing form: " + error.toString());
    const requestId = String(e?.parameter?.requestId || "");
    const responseOrigin = String(e?.parameter?.responseOrigin || "");
    return returnResponse(
      {
        success: false,
        outcome: "uncertain",
        message: "An error occurred: " + error.toString()
      },
      requestId,
      responseOrigin
    );
  }
}

/**
 * Return response compatible with both Next.js iframe postMessage and standard JSON callers
 */
function returnResponse(result, requestId, responseOrigin, formType) {
  // If request originated from Next.js iframe wrapper with requestId and responseOrigin
  if (requestId && responseOrigin) {
    const isAdmission = formType === "admission" || formType === "career";
    const iframePayload = {
      type: "way2skills-form-response",
      requestId: requestId,
      success: result.success,
      outcome: result.outcome || (result.success ? "complete" : "rejected"),
      companyNotification: result.success ? "sent" : "not_sent",
      applicantConfirmation: isAdmission ? (result.success ? "sent" : "unknown") : "not_required",
      duplicate: false,
      message: result.message
    };

    const sanitizedOrigin = JSON.stringify(responseOrigin);
    const sanitizedPayload = JSON.stringify(iframePayload)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

    return HtmlService
      .createHtmlOutput(`<script>window.top.postMessage(${sanitizedPayload}, ${sanitizedOrigin});</script>`)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // Standard JSON response
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ==========================================================================
   EMAIL NOTIFICATIONS - CUSTOMER & STUDENT CONFIRMATIONS
   ========================================================================== */

/**
 * Send confirmation email to customer (Contact Form)
 */
function sendCustomerEmail(name, email, topic) {
  const subject = `We Received Your Request - ${BRAND_NAME}`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 20px auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
          
          <!-- Banner -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Request Received!</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">Thank you for contacting ${BRAND_NAME} (powered by ${COMPANY_NAME})</p>
          </div>
          
          <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">Hello ${escapeHtml(name)},</h2>
          
          <p style="font-size: 15px; color: #475569;">
            Thank you for reaching out to us regarding <strong>${escapeHtml(topic || "your enquiry")}</strong>. We are thrilled about the opportunity to assist you!
          </p>
          
          <!-- Next Steps -->
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 18px 20px; margin: 24px 0; border-radius: 6px;">
            <h3 style="color: #15803d; margin-top: 0; font-size: 16px;">What Happens Next?</h3>
            <p style="margin: 6px 0; color: #334155;"><strong>Our team will contact you soon!</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #475569; font-size: 14px;">
              <li style="margin: 6px 0;">Our specialists will review your enquiry within <strong>24 hours</strong>.</li>
              <li style="margin: 6px 0;">We'll reach out via phone or email to discuss your requirements.</li>
              <li style="margin: 6px 0;">We'll help design the ideal learning or service roadmap for your goals.</li>
            </ul>
          </div>
          
          <!-- Contact Box -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 15px;">Need Immediate Assistance?</h3>
            <p style="margin: 6px 0 10px 0; font-size: 14px; color: #64748b;">Feel free to reach out to us anytime:</p>
            <table style="font-size: 14px; color: #334155;">
              <tr>
                <td style="padding: 4px 10px 4px 0; font-weight: 600; color: #64748b;">Email:</td>
                <td><a href="mailto:${CONTACT_EMAIL}" style="color: #667eea; text-decoration: none; font-weight: 600;">${CONTACT_EMAIL}</a></td>
              </tr>
              <tr>
                <td style="padding: 4px 10px 4px 0; font-weight: 600; color: #64748b;">Phone:</td>
                <td><a href="tel:${CONTACT_PHONE.replace(/\s+/g, '')}" style="color: #667eea; text-decoration: none; font-weight: 600;">${CONTACT_PHONE}</a></td>
              </tr>
              <tr>
                <td style="padding: 4px 10px 4px 0; font-weight: 600; color: #64748b;">Website:</td>
                <td><a href="${BRAND_WEBSITE}" style="color: #667eea; text-decoration: none; font-weight: 600;">way2skills.in</a></td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #1f2937; margin: 4px 0; font-weight: bold; font-size: 15px;">${BRAND_NAME} Team</p>
            <p style="color: #94a3b8; font-size: 12px; margin: 2px 0;">An initiative by ${COMPANY_NAME} • Namakkal, Tamil Nadu, India</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: email,
      replyTo: EMAIL_FROM,
      name: `${BRAND_NAME} | ${COMPANY_NAME}`,
      subject: subject,
      body: `Hi ${name},\n\nThank you for reaching out to ${BRAND_NAME}! We received your enquiry and our team will get back to you within 24 hours.\n\nWarm regards,\n${BRAND_NAME} Team`,
      htmlBody: htmlBody
    });
    Logger.log("Customer email sent to: " + email);
  } catch (error) {
    Logger.log("Error sending customer email: " + error.toString());
  }
}

/**
 * Send confirmation email to student (Admission Form)
 */
function sendStudentAdmissionEmail(name, email, phone, course, education) {
  const subject = `Application Received: Welcome to ${BRAND_NAME}!`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 20px auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
          
          <!-- Banner -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Application Received! 🚀</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">Welcome to ${BRAND_NAME} (powered by ${COMPANY_NAME})</p>
          </div>
          
          <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">Hello ${escapeHtml(name)},</h2>
          
          <p style="font-size: 15px; color: #475569;">
            Thank you for applying to elevate your tech skills with <strong>${BRAND_NAME}</strong>. We have safely logged your admission application!
          </p>

          <!-- Application Summary -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Application Summary</h3>
            <table style="width: 100%; font-size: 14px; color: #334155;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 130px; font-weight: 600;">Programme:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #1e40af;">${escapeHtml(course)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Education:</td>
                <td style="padding: 6px 0; color: #334155;">${escapeHtml(education)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Phone:</td>
                <td style="padding: 6px 0; color: #334155;">${escapeHtml(phone)}</td>
              </tr>
            </table>
          </div>
          
          <!-- What Happens Next -->
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 18px 20px; margin: 24px 0; border-radius: 6px;">
            <h3 style="color: #15803d; margin-top: 0; font-size: 16px;">What Happens Next?</h3>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #475569; font-size: 14px;">
              <li style="margin: 6px 0;">Our admissions committee reviews your background and batch alignment.</li>
              <li style="margin: 6px 0;">A senior counselor will call you within <strong>24-48 hours</strong> to discuss the syllabus, timings, and internship project.</li>
              <li style="margin: 6px 0;">Upon confirmation, you will receive student portal access and onboarding resources.</li>
            </ul>
          </div>
          
          <!-- Contact Box -->
          <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px 20px; font-size: 13px; color: #1e40af; margin: 20px 0;">
            💡 <strong>Questions?</strong> Email our admissions desk at <a href="mailto:${ADMIN_EMAIL}" style="color: #2563eb; font-weight: 600; text-decoration: underline;">${ADMIN_EMAIL}</a> or visit <a href="${BRAND_WEBSITE}" style="color: #2563eb; font-weight: 600; text-decoration: underline;">way2skills.in</a>.
          </div>
          
          <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #1f2937; margin: 4px 0; font-weight: bold; font-size: 15px;">${BRAND_NAME} Admissions Team</p>
            <p style="color: #94a3b8; font-size: 12px; margin: 2px 0;">${COMPANY_NAME} • Namakkal, Tamil Nadu, India</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: email,
      replyTo: ADMIN_EMAIL,
      name: `${BRAND_NAME} Admissions`,
      subject: subject,
      body: `Hi ${name},\n\nThank you for applying to ${BRAND_NAME} for ${course}. Our team will review your application and contact you within 24-48 hours.\n\nWarm regards,\n${BRAND_NAME} Admissions Team`,
      htmlBody: htmlBody
    });
    Logger.log("Student admission email sent to: " + email);
  } catch (error) {
    Logger.log("Error sending student admission email: " + error.toString());
  }
}

/**
 * Send confirmation email to applicant (Careers Form)
 */
function sendApplicantEmail(name, email) {
  const subject = `Application Received - ${COMPANY_NAME} Careers`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 20px auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h1 style="margin: 0; font-size: 26px;">Application Received!</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">Thank you for your interest in ${COMPANY_NAME}</p>
          </div>
          
          <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">Hello ${escapeHtml(name)},</h2>
          <p style="font-size: 15px; color: #475569;">Thank you for submitting your application to join our team!</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 18px 20px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0; color: #334155; font-size: 14px;">Our hiring team will review your profile and reach out to you if your skills align with our current or upcoming openings.</p>
          </div>
          
          <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #1f2937; margin: 4px 0; font-weight: bold;">${COMPANY_NAME} Hiring Team</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: email,
      replyTo: ADMIN_EMAIL,
      name: `${COMPANY_NAME} Careers`,
      subject: subject,
      body: `Hello ${name},\n\nThank you for your application to ${COMPANY_NAME}. Our team will review your profile and reach out.\n\nRegards,\n${COMPANY_NAME} Hiring Team`,
      htmlBody: htmlBody
    });
  } catch (error) {
    Logger.log("Error sending applicant email: " + error.toString());
  }
}

/* ==========================================================================
   EMAIL NOTIFICATIONS - ADMIN ALERTS
   ========================================================================== */

/**
 * Send notification email to admin (Contact Form)
 */
function sendAdminContactEmail(name, email, phone, topic, message, submissionTime) {
  const subject = `ALERT: New Lead Submission - ${name} (${topic})`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 700px; margin: 20px auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
          
          <!-- Banner -->
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800;">NEW LEAD ALERT!</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">A new user has submitted a website inquiry</p>
          </div>
          
          <!-- Details Card -->
          <div style="background-color: #f8f9fa; padding: 22px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Lead Details</h2>
            <table style="width: 100%; font-size: 14px; color: #1e293b; line-height: 1.8;">
              <tr><td style="width: 120px; font-weight: 600; color: #64748b;">Name:</td><td><strong>${escapeHtml(name)}</strong></td></tr>
              <tr><td style="font-weight: 600; color: #64748b;">Email:</td><td><a href="mailto:${escapeHtml(email)}" style="color: #2563eb; font-weight: 600;">${escapeHtml(email)}</a></td></tr>
              <tr><td style="font-weight: 600; color: #64748b;">Phone:</td><td><a href="tel:${escapeHtml(phone)}" style="color: #2563eb; font-weight: 600;">${escapeHtml(phone || 'N/A')}</a></td></tr>
              <tr><td style="font-weight: 600; color: #64748b;">Topic:</td><td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${escapeHtml(topic)}</span></td></tr>
              <tr><td style="font-weight: 600; color: #64748b;">Submitted At:</td><td>${escapeHtml(submissionTime)}</td></tr>
            </table>
            
            <h3 style="margin: 18px 0 8px 0; font-size: 14px; color: #1f2937;">Message:</h3>
            <div style="background: #ffffff; padding: 14px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${escapeHtml(message || 'No message provided')}</div>
          </div>

          <div style="padding-top: 10px;">
            <a href="mailto:${escapeHtml(email)}?subject=Re:%20[${BRAND_NAME}]%20${encodeURIComponent(topic)}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 18px; border-radius: 6px; margin-right: 10px;">Reply to Lead</a>
            ${phone ? `<a href="tel:${escapeHtml(phone)}" style="display: inline-block; background: #f1f5f9; color: #1e293b; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 16px; border-radius: 6px;">Call ${escapeHtml(name)}</a>` : ""}
          </div>
        </div>
      </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      replyTo: email,
      name: `${BRAND_NAME} Notifications`,
      subject: subject,
      body: `NEW LEAD ALERT!\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nTopic: ${topic}\nMessage: ${message}\nTime: ${submissionTime}`,
      htmlBody: htmlBody
    });
    Logger.log("Admin contact alert sent to: " + ADMIN_EMAIL);
  } catch (error) {
    Logger.log("Error sending admin email: " + error.toString());
  }
}

/**
 * Send notification email to admin (Admission Application)
 */
function sendAdminAdmissionEmail(name, email, phone, course, education, message, submissionTime) {
  const subject = `NEW ADMISSION APPLICATION: ${name} - ${course}`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 700px; margin: 20px auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
          
          <!-- Banner -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800;">NEW ADMISSION APPLICATION!</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">A prospective student has applied on ${BRAND_NAME}</p>
          </div>
          
          <!-- Details Card -->
          <div style="background-color: #f8f9fa; padding: 22px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Applicant Details</h2>
            <table style="width: 100%; font-size: 14px; color: #1e293b; line-height: 1.8;">
              <tr><td style="width: 130px; font-weight: 600; color: #64748b;">Applicant Name:</td><td><strong>${escapeHtml(name)}</strong></td></tr>
              <tr><td style="font-weight: 600; color: #64748b;">Email:</td><td><a href="mailto:${escapeHtml(email)}" style="color: #2563eb; font-weight: 600;">${escapeHtml(email)}</a></td></tr>
              <tr><td style="font-weight: 600; color: #64748b;">Phone:</td><td><a href="tel:${escapeHtml(phone)}" style="color: #2563eb; font-weight: 600;">${escapeHtml(phone || 'N/A')}</a></td></tr>
              <tr><td style="font-weight: 600; color: #64748b;">Programme:</td><td><span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: 700;">${escapeHtml(course)}</span></td></tr>
              <tr><td style="font-weight: 600; color: #64748b;">Education:</td><td>${escapeHtml(education)}</td></tr>
              <tr><td style="font-weight: 600; color: #64748b;">Applied At:</td><td>${escapeHtml(submissionTime)}</td></tr>
            </table>
            
            <h3 style="margin: 18px 0 8px 0; font-size: 14px; color: #1f2937;">Additional Notes / Message:</h3>
            <div style="background: #ffffff; padding: 14px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${escapeHtml(message || 'None provided')}</div>
          </div>

          <div style="padding-top: 10px;">
            <a href="mailto:${escapeHtml(email)}?subject=Way2Skills%20Admission:%20Next%20Steps%20for%20${encodeURIComponent(course)}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 18px; border-radius: 6px; margin-right: 10px;">Contact Applicant</a>
            ${phone ? `<a href="tel:${escapeHtml(phone)}" style="display: inline-block; background: #f1f5f9; color: #1e293b; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 16px; border-radius: 6px;">Call ${escapeHtml(name)}</a>` : ""}
          </div>
        </div>
      </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      replyTo: email,
      name: `${BRAND_NAME} Admissions`,
      subject: subject,
      body: `NEW ADMISSION APPLICATION!\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nCourse: ${course}\nEducation: ${education}\nMessage: ${message}\nTime: ${submissionTime}`,
      htmlBody: htmlBody
    });
    Logger.log("Admin admission alert sent to: " + ADMIN_EMAIL);
  } catch (error) {
    Logger.log("Error sending admin admission email: " + error.toString());
  }
}

/**
 * Send notification email to admin (Career Form)
 */
function sendAdminCareerEmail(name, email, phone, role, portfolio, message, submissionTime) {
  const subject = `NEW CAREER APPLICATION: ${name} - ${role}`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 700px; margin: 20px auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800;">NEW JOB APPLICATION!</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 22px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Applicant Details</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
            <p><strong>Phone:</strong> ${escapeHtml(phone || 'N/A')}</p>
            <p><strong>Role:</strong> ${escapeHtml(role)}</p>
            <p><strong>Portfolio / Link:</strong> <a href="${escapeHtml(portfolio)}">${escapeHtml(portfolio || 'N/A')}</a></p>
            <p><strong>Time:</strong> ${escapeHtml(submissionTime)}</p>
            <br/>
            <h3>Message / Cover Letter:</h3>
            <p style="white-space: pre-wrap; background: #fff; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">${escapeHtml(message || 'N/A')}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      replyTo: email,
      name: `${COMPANY_NAME} Careers`,
      subject: subject,
      body: `NEW JOB APPLICATION!\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nRole: ${role}\nPortfolio: ${portfolio}\nTime: ${submissionTime}`,
      htmlBody: htmlBody
    });
  } catch (error) {
    Logger.log("Error sending admin career email: " + error.toString());
  }
}

/* ==========================================================================
   HELPER UTILITIES
   ========================================================================== */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDisplayDate(date) {
  try {
    return Utilities.formatDate(date, "Asia/Kolkata", "dd/MM/yyyy, hh:mm a 'IST'");
  } catch (e) {
    return date.toLocaleString();
  }
}
