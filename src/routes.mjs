import express from "express";
import cors from "cors"; // ✅ Import CORS
import fetch from "node-fetch"; // Ensure node-fetch is installed
import { runLighthouse, isChromeUserAgent } from "./lighthouseRunner.mjs";

const router = express.Router();

// ✅ Enable CORS
router.use(cors({
    origin: "*", // Allow all origins (For better security, restrict to your frontend domain)
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

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
    const userAgent = req.get('User-Agent'); // Get the User-Agent from request headers

    if (!isChromeUserAgent(userAgent)) {
        return res.status(400).json({
            error: "Please use Google Chrome to generate reports."
        });
    }

    try {
        // Run Lighthouse and get report paths
        const { htmlReportPath, pdfReportPath } = await runLighthouse(url, "/usr/bin/chromium"); // Use the system's default Chrome

        // Get dynamic host for correct report URLs
        const host = req.get("host");
        const protocol = req.protocol;

        res.status(200).json({
            message: "Reports generated successfully!",
            htmlReportUrl: `${protocol}://${host}/reports/${path.basename(htmlReportPath)}`,
            pdfReportUrl: `${protocol}://${host}/reports/${path.basename(pdfReportPath)}`,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to generate and upload reports.", details: error.message });
    }
});

// 🔹 Serve reports statically
router.use("/reports", express.static(path.join(__dirname, "../reports")));

export default router;