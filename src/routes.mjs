import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch"; // Ensure node-fetch is installed
import { runLighthouse } from "./lighthouseRunner.mjs";
import { uploadToConfluence } from "./confluenceUploader.mjs";

// Define __dirname for ES Modules
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 🔹 Middleware to check if URL is reachable before running Lighthouse
async function validateUrlAccessibility(req, res, next) {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    try {
        const response = await fetch(url, { method: "HEAD", timeout: 5000 });
        if (!response.ok) {
            throw new Error(`URL returned status ${response.status}`);
        }
        next(); // Proceed if URL is reachable
    } catch (error) {
        console.error("Failed to fetch URL:", error.message);
        return res.status(400).json({ error: "URL is unreachable or blocked." });
    }
}

// 🔹 Main route to generate and upload Lighthouse reports
router.post("/generate-report", validateUrlAccessibility, async(req, res) => {
    const { url } = req.body;

    try {
        // Run Lighthouse and get both report paths
        const { htmlReportPath, pdfReportPath } = await runLighthouse(url);

        // Upload the HTML report to Confluence
        const confluenceUrl = await uploadToConfluence(htmlReportPath);

        // Get dynamic host for correct report URLs
        const host = req.get("host");
        const protocol = req.protocol;

        res.status(200).json({
            message: "Reports generated and uploaded successfully!",
            htmlReportUrl: `${protocol}://${host}/reports/${path.basename(htmlReportPath)}`,
            pdfReportUrl: `${protocol}://${host}/reports/${path.basename(pdfReportPath)}`,
            confluenceUrl: confluenceUrl,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to generate and upload reports.", details: error.message });
    }
});

// 🔹 Serve reports statically using the corrected __dirname
router.use("/reports", express.static(path.join(__dirname, "../reports")));

export default router;