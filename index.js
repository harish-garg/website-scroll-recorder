const { chromium } = require('playwright');
const { saveVideo } = require('playwright-video');
const readline = require('readline');
const path = require('path');

function promptForUrl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter the website URL to record: ', (url) => {
      rl.close();
      resolve(url);
    });
  });
}

async function recordWebsiteScroll(url, options = {}) {
  const {
    maxDuration = 100000, // Maximum duration for scrolling (in ms)
    scrollStep = 500, // Pixels to scroll each step
    scrollInterval = 500 // Interval between scrolls (in ms)
  } = options;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.setDefaultTimeout(60000);

  // Navigate to the URL
  await page.goto(url, { 
    waitUntil: 'networkidle', 
    timeout: 60000 
  });

  // Wait for the page to fully load
  await page.waitForLoadState('load');

  // Ensure the page visually stabilizes
  await page.waitForTimeout(2000);

  // Wait for a key element to confirm rendering
  try {
    await page.waitForSelector('body', { state: 'visible', timeout: 10000 });
  } catch (error) {
    console.log('Could not wait for body selector, proceeding anyway');
  }

  // Start recording
  const videoPath = path.join(__dirname, `website_recording_${Date.now()}.mp4`);
  const recording = saveVideo(page, videoPath);

  try {
    // Scroll the page smoothly
    await page.evaluate(async ({ maxDuration, scrollStep, scrollInterval }) => {
      const startTime = Date.now();
      let lastHeight = document.body.scrollHeight;
      let noChangeCount = 0;

      // Scroll logic
      return new Promise((resolve) => {
        const intervalId = setInterval(() => {
          window.scrollBy({ top: scrollStep, behavior: 'smooth' });

          const currentHeight = document.body.scrollHeight;
          if (currentHeight === lastHeight) {
            noChangeCount++;
          } else {
            noChangeCount = 0;
          }
          lastHeight = currentHeight;

          if (noChangeCount >= 3 || Date.now() - startTime > maxDuration) {
            clearInterval(intervalId);
            resolve(); // Scroll completed
          }
        }, scrollInterval);
      });
    }, { maxDuration, scrollStep, scrollInterval });

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
      console.error('❌ No URL provided');
      process.exit(1);
    }
    const recordedVideoPath = await recordWebsiteScroll(url);
    console.log(`📽️ Video recorded at: ${recordedVideoPath}`);
  } catch (error) {
    console.error('❌ Recording failed:', error);
    process.exit(1);
  }
})();
