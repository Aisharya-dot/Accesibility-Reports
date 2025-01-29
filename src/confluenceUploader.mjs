import fs from "fs";
import axios from "axios";
import path from "path";
import FormData from "form-data"; // Required for file upload

const confluenceBaseUrl = "https://aisharyag11.atlassian.net/wiki";
const confluenceUsername = "aisharyag11@gmail.com";
const confluenceApiToken = "ATATT3xFfGF0or-0RvbKDQCZEwVed3jioRQNs2Ew2oK_P4FIwcPukCAJOx7SnFrkIqR3LyGevovfo3IRL9p-Q0oAuCozpLLnRsAkXjv7Wpryf_LEKfyWpGqCZHBqHYMiMZGJoOplFChIPiIHp5jnCUn3btqYmZ4IM11D5nIdc4UwkXvuHGeg6pI=7756954F";
const parentPageId = "524633"; // Update with your parent page ID

async function uploadToConfluence({ htmlReportPath, pdfReportPath }) {
    if (!htmlReportPath || !pdfReportPath) {
        throw new Error("Invalid report paths provided.");
    }

    const reportHtml = fs.readFileSync(htmlReportPath, "utf-8"); // Ensure the correct path is used
    const title = `Accessibility Report - ${new Date().toLocaleString()}`;

    // Create Confluence Page
    const confluencePageData = {
        type: "page",
        title,
        ancestors: [{ id: parentPageId }],
        space: { key: "ReportsSpa" },
        body: {
            storage: {
                value: `<h1>Accessibility Report</h1>
                        <p>Generated on ${new Date().toLocaleString()}</p>
                        <p><strong>Attachments:</strong></p>
                        <ul>
                            <li><a href="/download/attachments/${parentPageId}/report.html">HTML Report</a></li>
                            <li><a href="/download/attachments/${parentPageId}/report.pdf">PDF Report</a></li>
                        </ul>
                        ${reportHtml}`,
                representation: "storage",
            },
        },
    };

    const pageResponse = await axios.post(
        `${confluenceBaseUrl}/rest/api/content`,
        confluencePageData, {
            auth: { username: confluenceUsername, password: confluenceApiToken },
            headers: { "Content-Type": "application/json" },
        }
    );

    const pageId = pageResponse.data.id;

    // Function to upload an attachment
    async function uploadAttachment(filePath, fileName) {
        const fileData = fs.readFileSync(filePath);
        const formData = new FormData();
        formData.append("file", fileData, fileName);

        await axios.post(
            `${confluenceBaseUrl}/rest/api/content/${pageId}/child/attachment`,
            formData, {
                auth: { username: confluenceUsername, password: confluenceApiToken },
                headers: { "X-Atlassian-Token": "no-check", ...formData.getHeaders() },
            }
        );

        console.log(`Uploaded ${fileName} to Confluence.`);
    }

    // Upload both HTML and PDF reports
    await uploadAttachment(htmlReportPath, "report.html");
    await uploadAttachment(pdfReportPath, "report.pdf");

    console.log("Reports uploaded to Confluence at:", `${confluenceBaseUrl}/spaces/YOUR_SPACE_KEY/pages/${pageId}`);
    return `${confluenceBaseUrl}/spaces/YOUR_SPACE_KEY/pages/${pageId}`;
}

export { uploadToConfluence };