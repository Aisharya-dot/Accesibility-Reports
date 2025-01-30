import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { uploadToConfluence } from "./confluenceUploader.mjs";

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

async function runLighthouse(url) {
    let browserInstance;
    let page;

    try {
        browserInstance = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        });

        page = await browserInstance.newPage();
        const chromeWsEndpoint = browserInstance.wsEndpoint();
        const chromePort = new URL(chromeWsEndpoint).port;

        const options = {
            logLevel: "info",
            output: "html",
            onlyCategories: ["accessibility"],
            port: chromePort,
        };

        const runnerResult = await lighthouse(url, options, null);
        if (!runnerResult || !runnerResult.report) {
            throw new Error("Lighthouse report generation failed");
        }

        const reportsDir = path.join(__dirname, "../reports");
        fs.mkdirSync(reportsDir, { recursive: true });

        const timestamp = Date.now();
        const htmlReportPath = path.join(reportsDir, `report-${timestamp}.html`);
        fs.writeFileSync(htmlReportPath, runnerResult.report);

        console.log("✅ HTML report generated at:", htmlReportPath);

        await page.setContent(runnerResult.report, { waitUntil: "domcontentloaded" });

        const pdfReportPath = path.join(reportsDir, `report-${timestamp}.pdf`);
        await page.pdf({ path: pdfReportPath, format: "A4", printBackground: true });

        console.log("✅ PDF report generated at:", pdfReportPath);

        // ✅ Upload to Confluence
        const confluenceUrl = await uploadToConfluence(htmlReportPath);
        console.log("✅ Report uploaded to Confluence:", confluenceUrl);

        return { htmlReportPath, pdfReportPath, confluenceUrl };
    } catch (error) {
        console.error("❌ Error running Lighthouse:", error);
        throw error;
    } finally {
        if (page) await page.close();
        if (browserInstance) await browserInstance.close();
    }
}

export { runLighthouse };