import fs from "fs";
import axios from "axios";
import path from "path";
import dotenv from "dotenv";
import FormData from "form-data";

// Load environment variables from .env file
dotenv.config();

// Confluence API credentials
const confluenceBaseUrl = process.env.CONFLUENCE_BASE_URL;
const confluenceUsername = process.env.CONFLUENCE_EMAIL;
const confluenceApiToken = process.env.ATLASSIAN_API_TOKEN;
const parentPageId = process.env.CONFLUENCE_PARENT_PAGE_ID;
const spaceKey = process.env.CONFLUENCE_SPACE_KEY;

// Encode credentials in Base64 for authentication
const authHeader = `Basic ${Buffer.from(`${confluenceUsername}:${confluenceApiToken}`).toString("base64")}`;

async function uploadToConfluence(reportPath) {
    try {
        const fileName = path.basename(reportPath);

        // Step 1: Create a new Confluence page
        const confluencePageData = {
            type: "page",
            title: `Accessibility Report - ${Date.now()}`,
            ancestors: [{ id: parentPageId }],
            space: { key: spaceKey },
            body: {
                storage: {
                    value: `<h1>Accessibility Report</h1>
                            <p>Generated on ${new Date().toLocaleString()}</p>
                            <p>Report Uploaded.....Go To Three Dots(...)Besides Share Button In Top-Right ---->> Attachments---Files--Download HTML Report</p>`,
                    representation: "storage",
                },
            },
        };

        const pageResponse = await axios.post(
            `${confluenceBaseUrl}/rest/api/content`,
            confluencePageData,
            {
                headers: {
                    "Authorization": authHeader,
                    "Content-Type": "application/json",
                },
            }
        );

        const pageId = pageResponse.data.id;
        console.log("Report page created at:", `${confluenceBaseUrl}/spaces/${spaceKey}/pages/${pageId}`);

        // Step 2: Upload the attachment and get its metadata
        const attachmentInfo = await uploadAttachmentToConfluence(pageId, reportPath);
        if (!attachmentInfo) throw new Error("Failed to upload attachment.");

        const { fileName: uploadedFileName } = attachmentInfo;

        // Step 3: Update the page to display the attached file using `view-file` macro
        const updatedPageData = {
            version: { number: 2 }, // Increment version to update the page
            title: `Accessibility Report - ${Date.now()}`,
            type: "page",
            ancestors: [{ id: parentPageId }],
            space: { key: spaceKey },
            body: {
                storage: {
                    value: `<h1>Accessibility Report</h1>
                            <p>Generated on ${new Date().toLocaleString()}</p>
                            <p>View the report below:</p>
                            <ac:structured-macro ac:name="view-file">
                                <ac:parameter ac:name="name">${uploadedFileName.html}</ac:parameter>
                            </ac:structured-macro>`,
                    representation: "storage",
                },
            },
        };

        await axios.put(
            `${confluenceBaseUrl}/rest/api/content/${pageId}`,
            updatedPageData,
            {
                headers: {
                    "Authorization": authHeader,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Updated page to embed the report:", `${confluenceBaseUrl}/spaces/${spaceKey}/pages/${pageId}`);
        return `${confluenceBaseUrl}/spaces/${spaceKey}/pages/${pageId}`;
    } catch (error) {
        console.error("Error uploading report to Confluence:", error.response?.data || error.message);
    }
}

async function uploadAttachmentToConfluence(pageId, filePath) {
    try {
        const fileName = path.basename(filePath);
        const fileStream = fs.createReadStream(filePath);

        // Create multipart/form-data request
        const formData = new FormData();
        formData.append("file", fileStream, fileName);

        const response = await axios.post(
            `${confluenceBaseUrl}/rest/api/content/${pageId}/child/attachment`,
            formData,
            {
                headers: {
                    "Authorization": authHeader,
                    "X-Atlassian-Token": "no-check",
                    ...formData.getHeaders(), // Auto-generate multipart headers
                },
            }
        );

        console.log("Attachment uploaded successfully:", response.data);

        // Extract filename from response
        return { fileName };
    } catch (error) {
        console.error("Error uploading attachment to Confluence:", error.response?.data || error.message);
        return null;
    }
}

export { uploadToConfluence };