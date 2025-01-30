import express from "express";
import bodyParser from "body-parser";
import cors from "cors"; // ✅ Import CORS
import routes from "./src/routes.mjs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES Modules
const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

const app = express();

// ✅ Enable CORS (Allow all origins or restrict to specific domains)
app.use(cors({
    origin: "*", // Allow all origins (Use a specific domain for better security)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());
app.use("/", routes);

// Serve static files from 'public' directory
app.use(express.static("public"));

// Serve reports statically
app.use("/reports", express.static(path.join(__dirname, "reports")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});