const { chromium } = require("playwright");
const { saveVideo } = require("playwright-video");
const readline = require("readline");
const path = require("path");

function promptForUrl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Enter the website URL to record: ", (url) => {
      rl.close();
      resolve(url);
    });
  });
}

async function recordWebsiteScroll(url, options = {}) {
  const {
    maxDuration = 10000, // Maximum duration for scrolling (in ms)
    scrollStep = 600, // Pixels to scroll each step
    scrollInterval = 1000, // Interval between scrolls (in ms)
  } = options;

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: {
      width: 1920,
      height: 1080,
    },
  });
  const page = await context.newPage();

  page.setDefaultTimeout(60000);

  // Navigate to the URL
  await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  // Wait for the page to fully load
  await page.waitForLoadState("load");

  // Ensure the page visually stabilizes
  await page.waitForTimeout(2000);

  // Wait for a key element to confirm rendering
  try {
    await page.waitForSelector("body", { state: "visible", timeout: 10000 });
  } catch (error) {
    console.log("Could not wait for body selector, proceeding anyway");
  }

  // Start recording
  const videoPath = path.join(__dirname, `website_recording_${Date.now()}.mp4`);
  const recording = saveVideo(page, videoPath);

  try {
    // Scroll the page smoothly
    await page.evaluate(
      async ({ maxDuration, scrollStep, scrollInterval }) => {
        const startTime = Date.now();

        // Scroll logic
        return new Promise((resolve) => {
          const intervalId = setInterval(() => {
            const elapsedTime = Date.now() - startTime;

            // If we've reached the bottom, go back to top
            if (
              window.scrollY + window.innerHeight >=
              document.body.scrollHeight
            ) {
              window.scrollTo(0, 0);
            } else {
              window.scrollBy({ top: scrollStep, behavior: "smooth" });
            }

            // Only stop when we reach maxDuration
            if (elapsedTime >= maxDuration) {
              clearInterval(intervalId);
              resolve();
            }
          }, scrollInterval);
        });
      },
      { maxDuration, scrollStep, scrollInterval }
    );

    // Add a small delay after scrolling for stability
    await page.waitForTimeout(2000);
  } finally {
    // Wait briefly to ensure recording captures final page state
    await page.waitForTimeout(1000);
  }

  await recording; // Ensure video recording stops naturally
  await browser.close();

  return videoPath;
}

(async () => {
  try {
    const url = await promptForUrl();
    if (!url) {
      console.error("❌ No URL provided");
      process.exit(1);
    }
    const recordedVideoPath = await recordWebsiteScroll(url);
    console.log(`📽️ Video recorded at: ${recordedVideoPath}`);
  } catch (error) {
    console.error("❌ Recording failed:", error);
    process.exit(1);
  }
})();
