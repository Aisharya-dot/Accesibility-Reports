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

// ✅ Dynamically determine the base URL
const getBaseUrl = (req) => {
    const protocol = req.protocol; // http or https
    const host = req.get("host"); // Render or localhost
    return `${protocol}://${host}`;
};

// ✅ Enable CORS (Restrict or Allow all origins)
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests from any origin in development, or a specific one in production
        if (!origin || process.env.NODE_ENV === "development") {
            callback(null, true);
        } else {
            callback(null, origin); // Allow the request origin dynamically
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(bodyParser.json());

// ✅ Middleware to dynamically set base URL
app.use((req, res, next) => {
    req.baseUrl = getBaseUrl(req);
    next();
});

// ✅ Routes
app.use("/", routes);

// ✅ Serve static files from 'public' directory
app.use(express.static("public"));

// ✅ Serve reports statically with correct dynamic base URL
app.use("/reports", express.static(path.join(__dirname, "reports")));

// ✅ Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
            console.log(`🚀 Server is running at ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
});