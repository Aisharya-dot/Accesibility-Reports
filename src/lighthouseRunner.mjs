import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

async function runLighthouse(url, browser) {
    let page;

    try {
        // ✅ Ensure Puppeteer launches a Chrome browser in the environment
        const browserInstance = await puppeteer.launch({
            executablePath: browser, // Use the system's Chrome (or Chromium) executable
            headless: true, // Run in headless mode
            args: [
                "--no-sandbox", "--disable-setuid-sandbox",
                "--disable-dev-shm-usage", "--disable-gpu"
            ],
        });

        page = await browserInstance.newPage();

        const chromeWsEndpoint = browserInstance.wsEndpoint();
        const chromePort = new URL(chromeWsEndpoint).port;

        // ✅ Lighthouse options
        const options = {
            logLevel: "info",
            output: "html",
            onlyCategories: ["accessibility"],
            port: chromePort,
        };

        // ✅ Run Lighthouse Audit
        const runnerResult = await lighthouse(url, options, null);
        if (!runnerResult || !runnerResult.report) {
            throw new Error("Lighthouse report generation failed");
        }

        // ✅ Save Reports
        const reportsDir = path.join(__dirname, "../reports");
        fs.mkdirSync(reportsDir, { recursive: true });

        const timestamp = Date.now();
        const htmlReportPath = path.join(reportsDir, `report-${timestamp}.html`);
        fs.writeFileSync(htmlReportPath, runnerResult.report);

        console.log("✅ HTML report generated at:", htmlReportPath);

        // ✅ Convert HTML to PDF using Puppeteer
        await page.setContent(runnerResult.report, { waitUntil: "domcontentloaded" });

        const pdfReportPath = path.join(reportsDir, `report-${timestamp}.pdf`);
        await page.pdf({ path: pdfReportPath, format: "A4", printBackground: true });

        console.log("✅ PDF report generated at:", pdfReportPath);

        return { htmlReportPath, pdfReportPath };
    } catch (error) {
        console.error("❌ Error running Lighthouse:", error);
        throw error;
    } finally {
        // ✅ Cleanup: Close browser instance
        if (page) await page.close();
        if (browser) await browser.close();
    }
}

// Function to check if the browser is Chrome
function isChromeUserAgent(userAgent) {
    return userAgent.includes("Chrome");
}

export { runLighthouse, isChromeUserAgent };