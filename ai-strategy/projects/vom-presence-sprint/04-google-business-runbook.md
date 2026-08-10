# Runbook: Fix Vision Outreach Media's Google Business Profile Discoverability

**Execution order for the full sprint: see 00-master-runbook.md**

**Status:** Draft | **Owner:** DevOps Team | **Date:** 2026-07-14

---

## Overview

Vision Outreach Media's Google Business Profile is currently stored in Engage AI org settings as a **private admin dashboard URL** (`business.google.com/n/...`), which prevents external scanners from reading the profile and contributes to zero external discoverability. This runbook restores discoverability by verifying the profile, obtaining the public listing URL, and updating Engage AI settings to use that public link.

**Important:** Every step in this runbook is a **HUMAN ACTION** requiring manual login to Google Business Profile dashboard and/or WordPress admin. No account changes are made by the team — you are the operator.

---

## Problem Statement: Why Admin URLs Score Zero

The URL currently stored in Engage AI settings points to `business.google.com/n/...`, which is **an authenticated admin-only dashboard route**. External scanners (including Engage AI's own verification scans) cannot access this URL because:

1. It requires Google Business Profile admin login credentials and is not publicly discoverable via search engines or web crawlers.
2. It does not resolve to a public business listing (no Maps embed, no public profile metadata for SEO, no shareable listing link).
3. The profile may be **unverified or incomplete**, preventing it from appearing in Google Maps, Google Search, or other Google Business discovery surfaces.

**Result:** External scanners see a 403/401 error or redirect, recording zero discoverability. A public `g.page/...` URL or Maps listing link is required for scanners to confirm the profile exists and is indexed.

---

## Prerequisites

- Access to Vision Outreach Media's Google Business Profile admin account (or ownership/manager role).
- Access to Vision Outreach Media's WordPress admin dashboard (`visionoutreachmedia.nl`).
- Engage AI WordPress plugin installed and configured on the site.

---

## Step 1: Verify the Google Business Profile — Check Current Verification Status

**Context:** A business profile must be verified before it can be publicly listed. This step checks whether the profile is verified and guides you through completion if needed.

1. Log in to [Google Business Profile](https://business.google.com) using the Vision Outreach Media account.
2. In the left sidebar, find and select **Vision Outreach Media** from the list of managed businesses (if not visible, click "Manage profiles" or search for the business name).
3. Once the profile dashboard loads, look at the top banner or the **"Overview"** tab.
   - **If you see a green checkmark or "Verified" badge:** Skip to Step 2. The profile is ready.
   - **If you see a yellow warning banner or "Verification pending":** Continue to step 4 below.
   - **If you see a red error or "Unverified":** Continue to step 4 below.

4. To complete verification (if status is pending or unverified):
   - Click the verification banner or navigate to **"Info" > "Verification"** section.
   - Select your preferred verification method:
     - **Video (fastest):** Verify by watching a Google video tutorial (instant if you have existing business history).
     - **Postcard (5–10 business days):** Google sends a postcard to the business address on file; enter the code from the postcard in the dashboard. **Recommended for service-area businesses in the Netherlands** — most reliable for non-storefront businesses.
     - **Phone (instant for qualifying businesses):** Google calls a business phone number on file and you enter a verification code. Check if this is available for Vision Outreach Media.
   - Follow the prompts for your chosen method.
   - Once verification is complete, you will see a green "Verified" badge.

**Checkpoint:** Confirm the profile displays **"Verified"** before proceeding.

---

## Step 2: Obtain the Public Listing URL

**Context:** Once verified, the profile has a permanent public URL. This step extracts both the Maps share link and the short `g.page/` link.

1. In the Google Business Profile dashboard, click **"View profile"** button (usually in the top right, or in the "Overview" section).
   - This opens the public-facing business profile page in Google Maps or Google Search.

2. Once the public profile page loads, look for the **share icon** (usually a link symbol or "Share" button) near the top of the page.
   - Click it and copy the **full Maps share link** (example: `https://www.google.com/maps/place/Vision+Outreach+Media/...`).
   - **Save this URL** — you will need it for Step 5.

3. Return to the Google Business Profile admin dashboard.
   - In the **"Info"** section or on the **"Overview"** tab, look for the **"Short URL"** or **"g.page/ link"** field.
   - If visible, copy the **short URL** (example: `https://g.page/vision-outreach-media`).
   - If not visible in "Info," click the **view profile button** again, and scroll to the bottom or side of the page — Google often displays the short link there.
   - **Save this short URL** as well.

4. **Keep both URLs ready for Step 5.** You now have:
   - Full Maps link: `https://www.google.com/maps/place/...`
   - Short link: `https://g.page/...`

**Checkpoint:** You have successfully obtained both the public Maps link and the short `g.page/` link.

---

## Step 3: Complete the Google Business Profile

**Context:** A complete profile improves discoverability and ensures the Engage AI scan captures all business metadata. Use this checklist to verify all required fields are filled.

In the Google Business Profile dashboard, go to **"Info"** section and verify or fill in the following:

1. **Business Name:** "Vision Outreach Media"
   - Ensure it matches exactly (no extra words or abbreviations).

2. **Category (Primary):**
   - Recommended: **"Website designer"** or **"Marketing agency"** (aligned with VOM's services).
   - Select the most relevant category from Google's list. You may add up to 3 categories.
   - ✓ Fill in if missing.

3. **Service Area:**
   - Business type: **"Service-area business"** (Vision Outreach Media serves organizations across the Netherlands, not from a single storefront).
   - Service area: Mark **"Netherlands"** or specific regions (e.g., all Dutch provinces).
   - ✓ Ensure this is set correctly.

4. **Business Hours:**
   - If available, enter standard business hours (e.g., "Mon–Fri, 9 AM – 5 PM").
   - For service-area businesses, hours indicate when you accept inquiries.
   - ✓ Add if not present.

5. **Business Description:**
   - Reference these two drafted descriptions:
     - **Dutch (NL, primary):** See `/Users/kurtjoseph/Downloads/claude/ai strategy/visionoutreachmedia-google-business-description-nl.md` — Opens with: *"# Vision Outreach Media — Google Business Profile beschrijving (NL)"*
       - Copy the description text (707 characters) into the **"Business description"** field.
     - **English (EN, reference only):** See `/Users/kurtjoseph/Downloads/claude/ai strategy/visionoutreachmedia-google-business-description-en.md` — Opens with: *"# Vision Outreach Media — Google Business Profile description (EN)"*
       - Keep this on hand for reference; use the NL version as the primary description (Dutch market).
   - ✓ Add the NL description to the "Business description" field if not present.

6. **Website:**
   - Enter: `https://www.visionoutreachmedia.nl`
   - ✓ Verify this is correct and active.

7. **Phone Number (Optional):**
   - Add if you have a business phone line (many service-area businesses omit this in the public listing).
   - If used, ensure it is correct and monitored.

8. **Photos and Logo:**
   - Add company logo (if available) — improves visual discoverability.
   - Add 2–5 high-quality photos (e.g., team photo, office/workspace, example projects).
   - ✓ Add at least the logo if not present.

9. **Attributes (Optional):**
   - If available, check relevant attributes such as:
     - "Remote services" (if you offer virtual consultations).
     - "Accepts online payments" or "Online booking" (if applicable).

10. **Save all changes.**

**Checkpoint:** All required fields are filled and the profile is complete. Google may take 24–48 hours to reindex the profile with all changes.

---

## Step 4: Verify the Public URL Works

**Context:** Before updating Engage AI settings, confirm the public URL is live and accessible to external scanners.

1. Open a **new incognito or private browser window** (to avoid cached login state).

2. Paste one of the public URLs you obtained in Step 2:
   - Try the short link first: `https://g.page/[your-short-link]`
   - Or use the full Maps link if the short link does not work.

3. Confirm the page loads and displays:
   - Business name: "Vision Outreach Media"
   - Business category, location, service area, hours, website link.
   - The description you added in Step 3.

4. **Do NOT log in.** If you can see the profile without logging in, the URL is public and will be readable by external scanners.

**Checkpoint:** The public URL is live and accessible without authentication.

---

## Step 5: Update Engage AI Settings in WordPress

**Context:** Now that you have the public URL, update the Engage AI WordPress plugin so the next scan uses the correct, publicly readable link instead of the private admin URL.

1. Log in to the **WordPress admin** for Vision Outreach Media: `https://www.visionoutreachmedia.nl/wp-admin/`

2. Navigate to the **Engage AI plugin settings:**
   - In the left sidebar, look for **"Settings"** → **"[Organization Name]"** or **"Engage AI"** → **"Organization Settings"** (exact menu naming may vary depending on plugin version).
   - Alternatively, search for "Engage AI" in the WordPress admin search bar (top left).

3. Find the **Google Business Profile URL field** or **"Channel URLs"** section:
   - Look for a field labeled **"Google Business"**, **"Google Business Profile URL"**, **"Business URL"**, or similar.
   - This field currently contains the private `business.google.com/n/...` URL.

4. **Replace the URL:**
   - Delete the current private admin URL.
   - Paste one of the public URLs from Step 2:
     - **Recommended:** Use the short link `https://g.page/...` (shorter, more stable).
     - **Backup:** Use the full Maps link if the short link is not available.

5. **Save the settings:**
   - Click the **"Save"** or **"Update"** button to commit the changes.
   - You should see a confirmation message (e.g., "Settings saved" or "Changes saved").

6. **Verify the change:**
   - Navigate back to the Engage AI settings page and confirm the public URL now appears in the Google Business Profile field.

**Checkpoint:** The Engage AI WordPress settings now point to the public Google Business Profile URL.

---

## Step 6: Trigger the Next Engage AI Scan

**Context:** The Engage AI WordPress plugin automatically schedules scans on a regular cadence. You can now wait for the next scan, or request an immediate scan if the plugin allows it.

1. In WordPress admin, navigate back to the **Engage AI settings** or **dashboard**.

2. Look for a **"Run scan"**, **"Scan now"**, or **"Force scan"** button (availability depends on plugin version and configuration).

3. If available, click it to trigger an immediate scan. If not available, the next automatic scan will occur on the scheduled cadence (typically daily or weekly).

4. **Wait for the scan to complete** (usually 5–15 minutes for automated scans).

5. Once complete, check the scan results:
   - Navigate to the Engage AI **"Analytics"** or **"Scan Results"** page.
   - Confirm that the Google Business Profile channel now shows:
     - **Status:** "Verified" or "Accessible" (not "Error" or "Unreachable").
     - **Discoverability score:** Should improve from the previous 0% (since the URL was unreadable).
     - **Last updated:** Recent timestamp indicating the new URL was scanned.

**Checkpoint:** The scan confirms the public Google Business Profile URL is now readable and indexed.

---

## Summary

You have successfully restored Vision Outreach Media's Google Business Profile discoverability by:

1. ✓ Verifying the business profile in Google Business Profile admin.
2. ✓ Obtaining the public listing URL (`g.page/...` and Maps link).
3. ✓ Completing the profile with all required information, including the Dutch business description.
4. ✓ Confirming the public URL is accessible to external scanners.
5. ✓ Updating the Engage AI WordPress plugin to use the public URL.
6. ✓ Triggering a new Engage AI scan to confirm discoverability.

The profile will now appear in Google Search, Google Maps, and Engage AI scans, significantly improving Vision Outreach Media's online discoverability.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Profile shows "Unverified" after verification attempt** | The postcard may have been delayed; check spam or request a new one. Allow 5–10 business days. If using phone verification, ensure the phone number on file is correct and answered during the call. |
| **Cannot find the short `g.page/` link** | Not all profiles generate a short link immediately; use the full Maps link instead (`https://www.google.com/maps/place/...`). The short link may appear after 24–48 hours. |
| **Public URL still shows 403/401 error** | Profile may not be fully verified yet. Return to Step 1 and confirm "Verified" badge is green. Wait 24–48 hours after verification for Google to reindex. |
| **Engage AI scan still reports error after updating URL** | Clear the WordPress plugin cache (if available in plugin settings) or wait for the next automatic scan cycle. Manual cache clear: Settings → Clear cache or flush cache (exact steps depend on plugin version). |
| **Cannot log into Google Business Profile** | Ensure you have admin or manager role for Vision Outreach Media. Check that the account used has not been suspended. Use account recovery if needed. |

---

## Appendix: Reference Files

- **Dutch Business Description (NL):** `/Users/kurtjoseph/Downloads/claude/ai strategy/visionoutreachmedia-google-business-description-nl.md`
- **English Business Description (EN):** `/Users/kurtjoseph/Downloads/claude/ai strategy/visionoutreachmedia-google-business-description-en.md`

---

**End of Runbook**
