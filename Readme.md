# What is this?
This is a small javascript/nodejs program that automates the recording of a website’s scroll using **Playwright** and **playwright-video**. Here's what it does:

1. **Prompt for a URL**:  
   The program asks the user to input the URL of the website they want to record.

2. **Load the Website**:  
   Then it opens the website in a Chromium browser, waits for the page to fully load, and ensures it stabilizes.

3. **Start Recording**:  
   It uses the **playwright-video** library to start recording the webpage activity and saves the video to a file.

4. **Scroll Automatically**:  
   The script scrolls the webpage step by step until it reaches the bottom or a maximum duration (`maxDuration`) is exceeded. Scrolling stops earlier if no new content loads for a certain number of intervals.

5. **Finish and Save Video**:  
   After the scroll completes, the script stops recording, waits briefly to capture the final state, and saves the video in the same directory.

6. **Close Browser**:  
   Finally, the browser closes, and the path to the saved video is displayed. 

This allows for easy recording of scrolling through a website, which is useful for presentations, demos, or visual documentation. It can also be incorporated in more complex workflows.

# Steps to run this:

## setup
* download this code repository
* cd to the code folder
* npm install
* npx playwright install

## record scrolling web page video
node index.js

It will ask for a website url. please provide for a full url, including http/https
