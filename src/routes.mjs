import express from "express";
import path from "path";
import cors from "cors"; // Enable CORS
import fetch from "node-fetch"; // Ensure node-fetch is installed
import { runLighthouse } from "./lighthouseRunner.mjs";

const __dirname = path.dirname(new URL(
    import.meta.url).pathname);
const router = express.Router();

// Enable CORS for all requests
router.use(cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

// Middleware to validate if URL is accessible
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

// Route to generate Lighthouse report
router.post("/generate-report", validateUrlAccessibility, async(req, res) => {
    const { url } = req.body;

    try {
        // Run Lighthouse and get report paths
        const { htmlReportPath, pdfReportPath } = await runLighthouse(url, "/usr/bin/chromium");

        // Get dynamic host for correct report URLs
        const host = req.get("host");
        const protocol = req.protocol;

        res.status(200).json({
            message: "Reports generated successfully!",
            htmlReportUrl: `${protocol}://${host}/reports/${path.basename(htmlReportPath)}`,
            pdfReportUrl: `${protocol}://${host}/reports/${path.basename(pdfReportPath)}`,
        });
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ error: "Failed to generate and upload reports.", details: error.message });
    }
});

// Serve reports statically
router.use("/reports", express.static(path.join(__dirname, "../reports")));

export default router;