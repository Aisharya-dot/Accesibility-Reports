import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import routes from "./src/routes.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));
const app = express();

// ✅ Railway assigns a dynamic PORT, default to 8080
const PORT = process.env.PORT || 3000;

// ✅ Dynamically determine base URL (use Railway domain in production)
const getBaseUrl = (req) => {
    const protocol = req.protocol; // http or https
    const host = req.get("host"); // Railway domain or localhost
    return `${protocol}://${host}`;
};

// ✅ Enable CORS for frontend
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || process.env.NODE_ENV === "development") {
            callback(null, true);
        } else {
            callback(null, origin);
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

// ✅ Serve static files
app.use(express.static("public"));
app.use("/reports", express.static(path.join(__dirname, "reports")));

// ✅ Start the server
app.listen(PORT, () => {
    const BASE_URL = process.env.RAILWAY_PUBLIC_URL || `http://localhost:${PORT}`;
    console.log(`🚀 Server is running at ${BASE_URL}`);
});