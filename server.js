const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI, createPartFromCodeExecutionResult, HttpElementLocation } = require("@google/genai");
require("dotenv").config();

const app = express();

// =====================================================
// GEMINI API
// =====================================================

if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env file");
} else {
    console.log("✅ Gemini API key loaded");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(
    express.json({
        limit: "20mb"
    })
);

app.use(express.static(path.join(__dirname, "public")));

// =====================================================
// MYSQL
// =====================================================

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "uma@123",
    database: "agriculture"
});

db.connect((err) => {

    if (err) {
        console.log("❌ Database Connection Failed");
        console.log(err.message);
    } else {
        console.log("✅ Database Connected Successfully");
    }

});

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );

});

// =====================================================
// TEST SERVER
// =====================================================

app.get("/test", (req, res) => {

    res.json({
        message: "Smart Agriculture Server is working ✅"
    });

});

// =====================================================
// GET CROPS
// =====================================================

app.get("/crops", (req, res) => {

    db.query(
        "SELECT * FROM crops",
        (err, result) => {

            if (err) {

                console.log("❌ Crops database error:");
                console.log(err.message);

                return res.status(500).json({
                    error: "Database error",
                    details: err.message
                });

            }

            res.json(result);

        }
    );

});

// =====================================================
// ADD CROP
// =====================================================

app.post("/addcrop", (req, res) => {

    const {
        crop_name,
        soil_type,
        temperature,
        rainfall
    } = req.body;

    const sql = `
        INSERT INTO crops
        (crop_name, soil_type, temperature, rainfall)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            crop_name,
            soil_type,
            temperature,
            rainfall
        ],
        (err, result) => {

            if (err) {

                console.log("❌ Crop add error:");
                console.log(err.message);

                return res.status(500).json({
                    error: "Crop add failed",
                    details: err.message
                });

            }

            res.json({
                message: "Crop Added Successfully",
                id: result.insertId
            });

        }
    );

});

// =====================================================
// GEMINI IMAGE ANALYSIS
// =====================================================

app.post("/analyze-image", async (req, res) => {

    try {

        console.log("");
        console.log("=================================");
        console.log("🌱 IMAGE ANALYSIS REQUEST");
        console.log("=================================");

        // =================================================
        // API KEY CHECK
        // =================================================

        if (!process.env.GEMINI_API_KEY) {

            console.log("❌ Gemini API key missing");

            return res.status(500).json({
                error: "GEMINI_API_KEY is missing in .env file"
            });

        }

        // =================================================
        // GET IMAGE
        // =================================================

        const { image } = req.body;

        if (!image) {

            console.log("❌ No image received");

            return res.status(400).json({
                error: "Image is required"
            });

        }

        console.log("✅ Image received");
        console.log("📦 Image size:", image.length);

        // =================================================
        // CHECK IMAGE FORMAT
        // =================================================

        if (!image.startsWith("data:image/")) {

            console.log("❌ Invalid image format");

            return res.status(400).json({
                error: "Invalid image format. Expected data:image..."
            });

        }

        // =================================================
        // EXTRACT BASE64 IMAGE
        // =================================================

        const matches = image.match(
            /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
        );

        if (!matches) {

            console.log("❌ Base64 image extraction failed");

            return res.status(400).json({
                error: "Invalid base64 image format"
            });

        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        console.log("🖼️ MIME type:", mimeType);
        console.log("📦 Base64 length:", base64Data.length);

        // =================================================
        // AI PROMPT
        // =================================================

        const prompt = `
You are an expert Smart Agriculture assistant.

Analyze the uploaded plant or crop image.

Identify the crop if possible.

Check for:

- disease
- fungal infection
- pest damage
- nutrient deficiency
- water stress
- leaf damage
- environmental stress
- healthy condition

Give simple and practical advice for a farmer.

IMPORTANT:

1. Do not claim 100% certainty.
2. If image is unclear, clearly say so.
3. Do not invent an exact disease without enough evidence.
4. Give general irrigation advice.
5. Give general fertilizer/NPK advice.
6. Do not provide dangerous or highly specific pesticide doses.
7. For pesticide/fungicide treatment, recommend following the product label and consulting a local agriculture expert.
8. Keep the answer simple.

Return ONLY valid JSON.

Use exactly this structure:

{
    "crop": "",
    "problem": "",
    "paani": "",
    "khad": "",
    "treatment": "",
    "kya_karein": ""
}

Do not use markdown.
Do not use code fences.
Do not write anything outside JSON.
`;

        // =================================================
        // SEND TO GEMINI
        // =================================================

        console.log("🔄 Sending image to Gemini...");
       console.log("🤖 model: gemini-flash-latest");

const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
            contents: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                },
                {
                    text: prompt
                }
            ]

        });

        // =================================================
        // GET GEMINI RESPONSE
        // =================================================

        let answer = "";

        if (response && response.text) {
            answer = response.text;
        }

        console.log("✅ Gemini response received");
        console.log("Raw response:");
        console.log(answer);

        // =================================================
        // CHECK EMPTY RESPONSE
        // =================================================

        if (!answer) {

            console.log("❌ Gemini returned empty response");

            return res.status(500).json({
                error: "Gemini returned an empty response"
            });

        }

        // =================================================
        // CLEAN RESPONSE
        // =================================================

        answer = answer
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        console.log("🧹 Cleaned response:");
        console.log(answer);

        // =================================================
        // PARSE JSON
        // =================================================

        let result;

        try {

            result = JSON.parse(answer);

            console.log("✅ JSON parsed successfully");

        } catch (jsonError) {

            console.log("⚠️ JSON parsing failed");
            console.log("JSON error:", jsonError.message);

            result = {

                crop: "Unable to identify",

                problem: answer,

                paani:
                    "Crop ki condition ke according irrigation karein.",

                khad:
                    "Soil test ke according suitable fertilizer use karein.",

                treatment:
                    "Disease confirm hone ke baad suitable treatment choose karein.",

                kya_karein:
                    "Agricultural expert se confirmation lein."

            };

        }

        // =================================================
        // SEND RESULT TO FRONTEND
        // =================================================

        console.log("✅ Sending result to frontend");

        res.json(result);

    } catch (error) {

        // =================================================
        // ACTUAL GEMINI ERROR
        // =================================================

        console.log("");
        console.log("=================================");
        console.log("❌ GEMINI IMAGE ANALYSIS ERROR");
        console.log("=================================");

        console.log("FULL ERROR:");
        console.log(error);

        console.log("---------------------------------");
        console.log("Message:", error.message);
        console.log("Status:", error.status);
        console.log("Code:", error.code);
        console.log("---------------------------------");

        let errorMessage =
            error.message || "Gemini API request failed.";

        // =================================================
        // ERROR STATUS
        // =================================================

        if (error.status === 401) {

            errorMessage =
                "Gemini API authentication failed. Please check your API key.";

        } else if (error.status === 403) {

            errorMessage =
                "Gemini API permission denied. Check API key/project permissions.";

        } else if (error.status === 404) {

            errorMessage =
                "Gemini API returned 404. Check the model name, API version, and request.";

        } else if (error.status === 429) {

            errorMessage =
                "Gemini API quota/rate limit reached.";

        } else if (error.status === 400) {

            errorMessage =
                "Gemini rejected the request. Check image format or request data.";

        }

        // =================================================
        // SEND ACTUAL ERROR TO WEBSITE
        // =================================================

        res.status(500).json({

            error: errorMessage,

            status: error.status || null,

            code: error.code || null

        });

    }

});

// =====================================================
// START SERVER
// =====================================================

const PORT = 5000;

app.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log("🌱 SMART AGRICULTURE SERVER");
    console.log("=================================");
    console.log(
        `🚀 Server running on http://localhost:${PORT}`
    );
    console.log("=================================");
    console.log("");
    

})