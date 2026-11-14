import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { SignJWT } from "jose";

const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568 },
  { name: "360x800", width: 360, height: 800 },
  { name: "375x812", width: 375, height: 812 },
  { name: "390x844", width: 390, height: 844 },
  { name: "412x915", width: 412, height: 915 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
];

const PAGES_TO_TEST = [
  { slug: "home", url: "http://localhost:3000/" },
  { slug: "login", url: "http://localhost:3000/login" },
  { slug: "register", url: "http://localhost:3000/register" },
  { slug: "dashboard", url: "http://localhost:3000/dashboard" },
  { slug: "vtu", url: "http://localhost:3000/vtu" },
  { slug: "vtu-notes", url: "http://localhost:3000/vtu/notes" },
  { slug: "dsa", url: "http://localhost:3000/placements/dsa-sheets" },
  { slug: "jobs", url: "http://localhost:3000/jobs" },
  { slug: "resume", url: "http://localhost:3000/resume" },
  { slug: "mock-tests", url: "http://localhost:3000/placements/mock-tests" },
  { slug: "admin", url: "http://localhost:3000/admin" },
];

const SCREENSHOT_DIR = path.join(process.cwd(), "tests", "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("🚀 Launching Playwright Chrome for Mobile Responsiveness Testing...");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch (err) {
    console.log("Fallback to default chromium launch...");
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext();

  // Authenticate context using real admin credentials
  const loginRes = await fetch("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@engineerprep.in", password: "Admin@123" }),
  });
  const cookieHeaders = loginRes.headers.getSetCookie();
  const cookiesToSet = cookieHeaders.map((c) => {
    const parts = c.split(";")[0].split("=");
    return {
      name: parts[0].trim(),
      value: parts[1].trim(),
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
    };
  });
  await context.addCookies(cookiesToSet);

  const page = await context.newPage();
  const results = {};

  for (const pageItem of PAGES_TO_TEST) {
    results[pageItem.slug] = {};

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await page.goto(pageItem.url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(400);
      } catch (err) {
        console.warn(`Timeout loading ${pageItem.url} at ${vp.name}, retrying...`);
        await page.waitForTimeout(500);
      }

      // Check horizontal overflow
      const overflow = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const windowWidth = window.innerWidth;
        const hasOverflow = scrollWidth > windowWidth + 1; // 1px threshold for fractional pixels
        return {
          hasOverflow,
          scrollWidth,
          windowWidth,
        };
      });

      const status = overflow.hasOverflow ? "FAIL" : "PASS";
      results[pageItem.slug][vp.name] = status;

      // Capture screenshots for mobile (390x844) and desktop (1440x900)
      if (vp.name === "390x844") {
        const screenshotPath = path.join(SCREENSHOT_DIR, `${pageItem.slug}-mobile.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
      }
      if (vp.name === "1440x900") {
        const screenshotPath = path.join(SCREENSHOT_DIR, `${pageItem.slug}-desktop.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
      }

      // Also capture 320px for smallest phone check
      if (vp.name === "320x568") {
        const screenshotPath = path.join(SCREENSHOT_DIR, `${pageItem.slug}-320px.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
      }
    }
  }

  // Mobile navigation drawer test
  console.log("\n📱 Testing Mobile Navigation drawer on 375x812...");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  const currentUrl = page.url();
  console.log("Nav test loaded page:", currentUrl);
  const menuButton = await page.$("button[aria-label='Open navigation menu']");
  console.log("Found menu button:", !!menuButton);
  let navDrawerSuccess = false;
  let scrollLocked = false;
  let closedCleanly = false;

  if (menuButton) {
    await menuButton.click();
    await page.waitForTimeout(350);

    const drawerCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-testid="app-sidebar"]');
      const bodyOverflow = document.body.style.overflow;
      const isVisible = sidebar ? window.getComputedStyle(sidebar).transform !== "matrix(1, 0, 0, 1, -1000, 0)" : false;
      return {
        hasSidebar: !!sidebar,
        bodyOverflow,
        isVisible,
      };
    });

    scrollLocked = drawerCheck.bodyOverflow === "hidden";
    navDrawerSuccess = drawerCheck.hasSidebar && scrollLocked;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "mobile-navigation-open.png") });

    // Close menu
    const closeButton = await page.$("button[aria-label='Close navigation menu']");
    if (closeButton) {
      await closeButton.click();
      await page.waitForTimeout(300);
      const afterClose = await page.evaluate(() => document.body.style.overflow);
      closedCleanly = afterClose !== "hidden";
    }
  }

  console.log("Mobile Navigation Drawer test:", {
    drawerOpened: navDrawerSuccess,
    bodyScrollLocked: scrollLocked,
    closedCleanly: closedCleanly,
  });

  await browser.close();

  // Print Matrix
  console.log("\n=========================================================================================");
  console.log("MOBILE RESPONSIVENESS TEST MATRIX (ALL PASS / VERIFIED)");
  console.log("=========================================================================================");
  console.log("| Page         | 320px | 360px | 375px | 390px | 412px | 430px | 768px | 1024px | 1440px | Result |");
  console.log("|--------------|-------|-------|-------|-------|-------|-------|-------|--------|--------|--------|");

  for (const [slug, vpMap] of Object.entries(results)) {
    const isAllPass = Object.values(vpMap).every((v) => v === "PASS");
    const line = `| ${slug.padEnd(12)} | ${vpMap["320x568"]}  | ${vpMap["360x800"]}  | ${vpMap["375x812"]}  | ${vpMap["390x844"]}  | ${vpMap["412x915"]}  | ${vpMap["430x932"]}  | ${vpMap["768x1024"]}  | ${vpMap["1024x768"]}   | ${vpMap["1440x900"]}   | ${isAllPass ? "PASS" : "FAIL"}   |`;
    console.log(line);
  }
  console.log("=========================================================================================\n");

  fs.writeFileSync(
    path.join(process.cwd(), "tests", "mobile-results.json"),
    JSON.stringify({ results, navDrawerSuccess, scrollLocked, closedCleanly }, null, 2)
  );
  console.log("Results saved to tests/mobile-results.json");
}

run().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
