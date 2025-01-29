import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { runLighthouse } from "./lighthouseRunner.mjs";
import { uploadToConfluence } from "./confluenceUploader.mjs";

// Define __dirname for ES Modules
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post("/generate-report", async(req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    try {
        // Run Lighthouse and get both report paths
        const { htmlReportPath, pdfReportPath } = await runLighthouse(url);

        // Upload both reports to Confluence
        const confluenceUrl = await uploadToConfluence({ htmlReportPath, pdfReportPath });

        res.status(200).json({
            message: "Reports generated and uploaded successfully!",
            htmlReportUrl: `http://localhost:3000/reports/${path.basename(htmlReportPath)}`,
            pdfReportUrl: `http://localhost:3000/reports/${path.basename(pdfReportPath)}`,
            confluenceUrl: confluenceUrl,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to generate and upload reports." });
    }
});

// Serve the reports folder statically using the corrected __dirname
router.use("/reports", express.static(path.join(__dirname, "../reports")));

export default router;