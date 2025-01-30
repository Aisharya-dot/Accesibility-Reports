import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

async function runLighthouse(url) {
    let browser;
    let chromePath = process.env.CHROME_PATH;

    try {
        // 🚀 Launch Puppeteer with CHROME_PATH (if available) or fallback to bundled Chromium
        browser = await puppeteer.launch({
            executablePath: chromePath || undefined, // Use system Chrome if available
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const chromeWsEndpoint = browser.wsEndpoint();
        const chromePort = new URL(chromeWsEndpoint).port;

        // ✅ Lighthouse options
        const options = {
            logLevel: "info",
            output: "html",
            onlyCategories: ["accessibility"],
            port: chromePort,
            chromePath: chromePath || undefined,
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
        // ✅ Cleanup: Close browser instance
        if (browser) await browser.close();
    }
}

export { runLighthouse };