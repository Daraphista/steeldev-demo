// server.js (renamed from script.js)
import express from "express";
import fs from "fs";
import Steel from "steel-sdk";
import { chromium } from "playwright";

const app = express();
const PORT = process.env.PORT || 8080;

// Verify essential environment variables
const STEEL_API_KEY = process.env.STEEL_API_KEY;
if (!STEEL_API_KEY) {
  throw new Error("Missing STEEL_API_KEY environment variable. Please set it in Cloud Run.");
}

// Core logic moved into a function
async function runAutomation() {
  // ---- STEP 1: Read cookies from secret environment variable ----
  const cookiesJsonString = process.env.FOLLOWUPBOSS_LOGIN_COOKIE;

  if (!cookiesJsonString) {
    throw new Error("FOLLOWUPBOSS_LOGIN_COOKIE environment variable is missing");
  }

  // Parse and normalize formats
  const raw = JSON.parse(cookiesJsonString);
  const followupbossCookies = Array.isArray(raw)
    ? raw
    : raw.cookies || raw.data || Object.values(raw)[0];

  console.log(`Loaded ${followupbossCookies?.length || 0} cookies from secret.`);

  // ---- STEP 2: Create Steel session ----
  const client = new Steel({ steelAPIKey: STEEL_API_KEY });
  console.log("Creating Steel session...");
  const session = await client.sessions.create();
  console.log("Session created:", session.id);
  console.log("Viewer:", session.sessionViewerUrl);

  // ---- STEP 3: Connect Playwright to Steel ----
  const rawWs = session.websocketUrl;
  const connectUrl = rawWs.includes("apiKey=")
    ? rawWs
    : `${rawWs}&apiKey=${encodeURIComponent(STEEL_API_KEY)}`;
  console.log("Connecting Playwright to:", connectUrl);

  const browser = await chromium.connectOverCDP(connectUrl);
  const context = browser.contexts().length
    ? browser.contexts()[0]
    : await browser.newContext();

  // ---- STEP 4: Apply cookies ----
  await context.addCookies(followupbossCookies);
  console.log("Cookies applied to context.");

  // ---- STEP 5: Navigate to contact page ----
  const page = await context.newPage();
  const contactUrl = "https://romanlopez.followupboss.com/2/people/view/56762"; // change as needed
  await page.goto(contactUrl);
  console.log("Navigated to:", contactUrl);

  await page.waitForTimeout(3000);
  console.log("Page title:", await page.title());

  // ---- STEP 6: Clean up ----
  await browser.close();
  await client.sessions.release(session.id);
  console.log("✅ Done");

  return { message: "Automation completed successfully!" };
}

// Simple health check (Cloud Run pings this)
app.get("/", (req, res) => {
  res.send("Service is running ✅");
});

// Run automation manually via GET /run
app.get("/run", async (req, res) => {
  try {
    const result = await runAutomation();
    res.status(200).send(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send({ error: err.message });
  }
});

// Start server — required by Cloud Run
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
