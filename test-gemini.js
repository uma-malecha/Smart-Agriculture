require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function testGemini() {

    try {

        console.log("Testing Gemini...");
        console.log("Model: gemini-3.6-flash ");

        const response = await ai.models.generateContent({
             model: "gemini-3.6-flash",
            contents: "Say hello in one sentence."
        });

        console.log("");
        console.log("✅ GEMINI WORKING!");
        console.log("");
        console.log(response.text);

    } catch (error) {

        console.log("");
        console.log("❌ GEMINI TEST FAILED");
        console.log("");
        console.log("Message:", error.message);
        console.log("Status:", error.status);
        console.log("Code:", error.code);
        console.log("");
        console.log(error);
    }
}

testGemini();

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            