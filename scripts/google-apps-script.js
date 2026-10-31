/**
 * ==============================================================================
 * MEETLY — GOOGLE SHEETS USER DATA COLLECTOR (GOOGLE APPS SCRIPT)
 * ==============================================================================
 * 
 * HOW TO USE THIS SCRIPT IN 4 SIMPLE STEPS:
 * 
 * 1. Open Google Sheets (https://sheets.new) and name it: "Meetly User Data"
 * 2. In the top menu, click: Extensions -> Apps Script
 * 3. Delete any code in the editor (Code.gs) and paste this entire script.
 * 4. Click "Deploy" (top right) -> "New deployment"
 *      - Select type: "Web app" (click the gear icon ⚙️ if needed)
 *      - Description: "Meetly Live Sync Webhook"
 *      - Execute as: "Me" (your Google account)
 *      - Who has access: "Anyone"  <-- IMPORTANT so your website can send data!
 * 5. Click "Deploy", grant permissions, and COPY the "Web app URL":
 *    (e.g., https://script.google.com/macros/s/AKfycb.../exec)
 * 
 * 6. Set this URL in your Render environment variables:
 *    GOOGLE_SHEETS_WEBHOOK_URL = https://script.google.com/macros/s/AKfycb.../exec
 * 
 * Done! Every time someone logs in or registers with Google on Meetly,
 * their data will be automatically recorded in real time.
 * ==============================================================================
 */

// Configuration
var SHEET_NAME = "Users";
var HEADERS = [
  "Internal User ID",
  "Customer Name",
  "Email",
  "Registration Date",
  "Last Login",
  "Registration Status",
  "Total Visits",
  "Login Method"
];

/**
 * Handle incoming POST requests from Meetly backend or frontend.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for concurrent requests
  lock.tryLock(30000);

  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : "";
    var data = {};
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }

    var sheet = getOrCreateSheet(SHEET_NAME);
    var action = (data.action || "upsert").toLowerCase();
    var result;

    if (action === "delete") {
      result = handleDelete(sheet, data);
    } else {
      result = handleUpsert(sheet, data);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: action,
      details: result,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle GET requests (ping / healthcheck).
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    service: "Meetly Google Sheets Webhook",
    message: "Webhook is active and ready to collect user registrations.",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Inserts a new user or updates an existing user row.
 */
function handleUpsert(sheet, data) {
  var userId = sanitize(data.userId || data.openId || "USR-ANON-" + Utilities.getUuid().slice(0, 8));
  var name = sanitize(data.name || data.customerName || "Anonymous User");
  var email = sanitize(data.email || "");
  var now = formatTimestamp(new Date());
  var regDate = data.registrationDate ? formatTimestamp(new Date(data.registrationDate)) : now;
  var lastLogin = data.lastLogin ? formatTimestamp(new Date(data.lastLogin)) : now;
  var status = sanitize(data.status || "Active");
  var loginMethod = sanitize(data.loginMethod || "Google");

  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var existingRowIndex = -1;

  // Search by User ID (Column A) or Email (Column C)
  for (var i = 1; i < values.length; i++) {
    var rowUserId = values[i][0] ? String(values[i][0]).trim() : "";
    var rowEmail = values[i][2] ? String(values[i][2]).trim() : "";

    if ((userId && rowUserId === userId) || (email && rowEmail && rowEmail.toLowerCase() === email.toLowerCase())) {
      existingRowIndex = i + 1; // 1-based index in Sheets
      break;
    }
  }

  if (existingRowIndex > 0) {
    // Returning user: update Last Login, increment Visits, refresh Status and Name
    var currentVisits = parseInt(values[existingRowIndex - 1][6], 10) || 1;
    var newVisits = currentVisits + 1;

    sheet.getRange(existingRowIndex, 2).setValue(name);
    if (email) sheet.getRange(existingRowIndex, 3).setValue(email);
    sheet.getRange(existingRowIndex, 5).setValue(lastLogin);
    sheet.getRange(existingRowIndex, 6).setValue(status);
    sheet.getRange(existingRowIndex, 7).setValue(newVisits);
    sheet.getRange(existingRowIndex, 8).setValue(loginMethod);

    return { result: "updated", row: existingRowIndex, userId: userId, visits: newVisits };
  } else {
    // New user: append new row
    var newRow = [
      userId,
      name,
      email,
      regDate,
      lastLogin,
      status,
      1, // Initial visit count
      loginMethod
    ];
    sheet.appendRow(newRow);

    // Apply clean styling to the newly appended row
    var newRowIdx = sheet.getLastRow();
    sheet.getRange(newRowIdx, 1, 1, HEADERS.length).setVerticalAlignment("middle");

    return { result: "created", row: newRowIdx, userId: userId, visits: 1 };
  }
}

/**
 * Handle user deletion (GDPR / privacy erasure request).
 */
function handleDelete(sheet, data) {
  var userId = sanitize(data.userId || "");
  var email = sanitize(data.email || "");

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    var rowUserId = values[i][0] ? String(values[i][0]).trim() : "";
    var rowEmail = values[i][2] ? String(values[i][2]).trim() : "";

    if ((userId && rowUserId === userId) || (email && rowEmail && rowEmail.toLowerCase() === email.toLowerCase())) {
      var row = i + 1;
      sheet.getRange(row, 2).setValue("[Deleted]");
      sheet.getRange(row, 6).setValue("Deleted");
      sheet.getRange(row, 5).setValue(formatTimestamp(new Date()));
      return { result: "deleted", row: row, userId: userId };
    }
  }

  return { result: "not_found", userId: userId };
}

/**
 * Retrieves the designated sheet tab or creates it with formatted headers.
 */
function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName, 0);
  }

  // Initialize headers if sheet is empty or newly created
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);

    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#1c7c66");       // Meetly Teal theme color
    headerRange.setFontColor("#ffffff");       // White text
    headerRange.setFontWeight("bold");         // Bold headers
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    headerRange.setWrap(false);

    sheet.setFrozenRows(1);                   // Freeze top row
    sheet.setRowHeight(1, 38);                // Header height

    // Auto-fit column widths for better readability
    for (var col = 1; col <= HEADERS.length; col++) {
      sheet.autoResizeColumn(col);
    }
  }

  return sheet;
}

/**
 * OWASP Formula Injection Sanitizer.
 * Prepends a single quote if string starts with formula operators (=, +, -, @, %, |)
 */
function sanitize(val) {
  if (val === null || val === undefined) return "";
  var str = String(val).trim().replace(/[\r\n\t]/g, " ");
  if (/^[=+\-@%|]/.test(str)) {
    return "'" + str;
  }
  return str;
}

/**
 * Formats a Date object into 'YYYY-MM-DD HH:mm:ss' string in the sheet's timezone.
 */
function formatTimestamp(d) {
  if (isNaN(d.getTime())) d = new Date();
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || "UTC";
  return Utilities.formatDate(d, tz, "yyyy-MM-dd HH:mm:ss");
}

/**
 * ==============================================================================
 * TEST FUNCTION — RUN THIS IN APPS SCRIPT TO VERIFY YOUR SETUP!
 * Click the "Run" button in the Apps Script toolbar above.
 * Check your Google Sheet to verify that demo test rows appear immediately!
 * ==============================================================================
 */
function testSync() {
  var sheet = getOrCreateSheet(SHEET_NAME);

  // 1. Test New User Registration
  var testUser = {
    action: "upsert",
    userId: "USR-DEMO-" + Math.floor(100000 + Math.random() * 900000),
    name: "Alex Rivera",
    email: "alex.rivera.test@gmail.com",
    registrationDate: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: "Active",
    loginMethod: "Google"
  };

  var res1 = handleUpsert(sheet, testUser);
  Logger.log("Step 1 (Create User) Result: " + JSON.stringify(res1));

  // 2. Test Returning User Login (Visits should increase to 2)
  var res2 = handleUpsert(sheet, testUser);
  Logger.log("Step 2 (Returning Login) Result: " + JSON.stringify(res2));

  SpreadsheetApp.flush();
  Logger.log("SUCCESS! Check your Google Sheet to confirm test rows were created.");
}
