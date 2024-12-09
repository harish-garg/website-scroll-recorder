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
    maxDuration = 60000,
    scrollStep = 500,
    scrollInterval = 500
  } = options;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Increase default timeout
  page.setDefaultTimeout(60000);

  // Save video in current directory with timestamp
  const videoPath = path.join(__dirname, `website_recording_${Date.now()}.mp4`);
  await saveVideo(page, videoPath);

  // Navigate to URL with longer wait and multiple load strategies
  await page.goto(url, { 
    waitUntil: 'networkidle', 
    timeout: 60000 
  });

  // Additional wait for page to render completely
  await page.waitForLoadState('load');
  await page.waitForLoadState('networkidle');

  // Optional: wait for a specific element that indicates page is fully loaded
  try {
    await page.waitForSelector('body', { state: 'visible', timeout: 10000 });
  } catch (error) {
    console.log('Could not wait for body selector, proceeding anyway');
  }

  // Scroll functionality
  const scrollResult = await page.evaluate(async ({ maxDuration, scrollStep, scrollInterval }) => {
    const startTime = Date.now();
    let lastHeight = document.body.scrollHeight;
    let noChangeCount = 0;

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
          resolve({
            finalHeight: currentHeight,
            scrollTime: Date.now() - startTime
          });
        }
      }, scrollInterval);
    });
  }, { maxDuration, scrollStep, scrollInterval });

  // Wait for the scroll to complete or timeout
  console.log(`📊 Scrolled for ${scrollResult.scrollTime}ms`);
  console.log(`📏 Final page height: ${scrollResult.finalHeight}`);

  // Wait a moment to ensure video is fully captured
  await page.waitForTimeout(1000);

  // Close browser
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