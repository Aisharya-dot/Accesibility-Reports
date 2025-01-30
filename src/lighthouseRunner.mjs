import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

async function runLighthouse(url) {
    let chrome;
    let browser;

    try {
        // ✅ Use CHROME_PATH if available
        const chromePath = process.env.CHROME_PATH;

        if (!chromePath) {
            console.warn("⚠️ CHROME_PATH is not set. Falling back to chrome-launcher.");
            chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
        }

        const options = {
            logLevel: "info",
            output: "html",
            onlyCategories: ["accessibility"],
            port: chrome ? chrome.port : undefined,
            chromePath: chromePath || undefined,
        };

        // Run Lighthouse Audit
        const runnerResult = await lighthouse(url, options, null);
        if (!runnerResult || !runnerResult.report) {
            throw new Error("Lighthouse report generation failed");
        }

        // ✅ Save HTML Report
        const reportsDir = path.join(__dirname, "../reports");
        fs.mkdirSync(reportsDir, { recursive: true });

        const timestamp = Date.now();
        const htmlReportPath = path.join(reportsDir, `report-${timestamp}.html`);
        fs.writeFileSync(htmlReportPath, runnerResult.report);
        console.log("✅ HTML report generated at:", htmlReportPath);

        // ✅ Generate PDF Report using Puppeteer
        browser = await puppeteer.launch({
            executablePath: chromePath || undefined, // Use CHROME_PATH if available
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(runnerResult.report, { waitUntil: "domcontentloaded" });

        const pdfReportPath = path.join(reportsDir, `report-${timestamp}.pdf`);
        await page.pdf({ path: pdfReportPath, format: "A4", printBackground: true });

        console.log("✅ PDF report generated at:", pdfReportPath);

        return { htmlReportPath, pdfReportPath };
    } catch (error) {
        console.error("❌ Error running Lighthouse:", error);
        throw error;
    } finally {
        // ✅ Cleanup Resources
        if (browser) await browser.close();
        if (chrome) await chrome.kill();
    }
}

export { runLighthouse };