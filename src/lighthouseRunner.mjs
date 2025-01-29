import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

async function runLighthouse(url) {
    const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
    const options = { logLevel: "info", output: "html", onlyCategories: ["accessibility"], port: chrome.port };

    const runnerResult = await lighthouse(url, options, null);

    if (!runnerResult || !runnerResult.report) {
        throw new Error("Lighthouse report generation failed");
    }

    const reportsDir = path.join(__dirname, "../reports");
    fs.mkdirSync(reportsDir, { recursive: true });

    const timestamp = Date.now();
    const htmlReportPath = path.join(reportsDir, `report-${timestamp}.html`);
    fs.writeFileSync(htmlReportPath, runnerResult.report);

    console.log("HTML report generated at:", htmlReportPath);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(runnerResult.report, { waitUntil: "domcontentloaded" });

    const pdfReportPath = path.join(reportsDir, `report-${timestamp}.pdf`);
    await page.pdf({ path: pdfReportPath, format: "A4", printBackground: true });

    console.log("PDF report generated at:", pdfReportPath);

    await browser.close();
    await chrome.kill();

    return { htmlReportPath, pdfReportPath };
}

export { runLighthouse };