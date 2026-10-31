# 📊 Meetly — Google Sheets User Data Collector (Apps Script Guide)

This guide shows you how to connect **Meetly** to a **Google Sheet** in under 2 minutes using **Google Apps Script**.

Every time a visitor signs up or logs in with Google on your website, their account details are automatically recorded in real time.

---

## 📋 Data Collected Automatically in Your Google Sheet

| Column | Header | Description | Example |
|---|---|---|---|
| **A** | **Internal User ID** | Unique Meetly ID | `USR-7B4F92A1C0E8` |
| **B** | **Customer Name** | Full name from Google profile | `John Doe` |
| **C** | **Email** | User's verified Google email | `johndoe@gmail.com` |
| **D** | **Registration Date** | First time they signed up | `2026-10-31 12:30:15` |
| **E** | **Last Login** | Most recent login timestamp | `2026-10-31 15:45:00` |
| **F** | **Registration Status** | Current account status | `Active` (or `Deleted`) |
| **G** | **Total Visits** | Number of times they returned | `3` |
| **H** | **Login Method** | Authentication provider | `Google` |

---

## 🚀 Setup Instructions (Takes 2 Minutes)

### Step 1: Create a New Google Sheet
1. Open [sheets.new](https://sheets.new) in your browser.
2. Rename the spreadsheet in the top left to: **`Meetly User Data`**.

---

### Step 2: Open Google Apps Script
1. In the top navigation bar of your Google Sheet, click **Extensions** → **Apps Script**.
2. A new tab will open with the code editor showing a file named `Code.gs`.

---

### Step 3: Paste the Script
1. Delete everything inside `Code.gs`.
2. Open [`scripts/google-apps-script.js`](file:///d:/meetly/scripts/google-apps-script.js) from this repository, copy all the code, and paste it into `Code.gs`.
3. Click the **Save** icon (💾) or press `Ctrl + S`.

---

### Step 4: Quick Test (Verify It Works Before Deploying)
1. At the top of the Apps Script editor, ensure the function dropdown is set to **`testSync`**.
2. Click the **▷ Run** button.
3. If Google asks for permissions:
   - Click **Review permissions**.
   - Choose your Google account.
   - Click **Advanced** → **Go to Meetly User Data Collector (unsafe)**.
   - Click **Allow**.
4. Switch back to your Google Sheet! You will see:
   - A beautiful teal header row automatically formatted.
   - Two demo rows (`Alex Rivera`) showing a new registration and an updated visit count.
5. You can delete those two test rows whenever you wish.

---

### Step 5: Deploy as a Web App
1. In the top-right corner of the Apps Script editor, click **Deploy** → **New deployment**.
2. Click the gear icon (⚙️) next to "Select type" and select **Web app**.
3. Configure the deployment settings:
   - **Description**: `Meetly Live User Sync`
   - **Execute as**: `Me (<your-email@gmail.com>)`
   - **Who has access**: **`Anyone`** *(Crucial: This allows your backend to send data)*
4. Click **Deploy**.
5. Copy the **Web app URL** (it looks like: `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Step 6: Add the Webhook URL to Render
1. Open your [Render Dashboard](https://dashboard.render.com).
2. Click on your backend web service: **`meetly-by-evolix`**.
3. In the left menu, click **Environment**.
4. Click **Add Environment Variable**:
   - **Key**: `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value**: *(Paste your copied Web app URL from Step 5)*
5. Click **Save Changes**.

---

## 🎯 That's It!
Whenever anyone clicks **"Sign up with Google"** on [`meetly-by-evolix.meetlybyevolix.workers.dev`](https://meetly-by-evolix.meetlybyevolix.workers.dev/):
1. Meetly cryptographically verifies their Google token.
2. The backend sends their User ID, Name, Email, and Timestamps to your Google Sheet.
3. If the user already exists, it updates their **Last Login** and increments **Total Visits**.
4. If it's a new user, a new row is appended immediately.

