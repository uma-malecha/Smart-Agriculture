console.log("Smart Agriculture Advisor Loaded");


// =========================
// WELCOME
// =========================

function welcome() {
    console.log("Welcome Farmer 🌱");
}

welcome();


// =========================
// IMAGE PREVIEW
// =========================

const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const result = document.getElementById("result");


imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {

        alert("Please select a valid plant image.");

        this.value = "";

        return;
    }


    const reader = new FileReader();


    reader.onload = function (e) {

        preview.src = e.target.result;

        preview.style.display = "inline-block";

    };


    reader.readAsDataURL(file);

});


// =========================
// AI IMAGE ANALYSIS
// =========================

async function uploadImage() {

    const file = imageInput.files[0];


    if (!file) {

        alert("Please upload a plant image first 🌱");

        return;

    }


    // Show loading

    result.style.display = "block";

    result.innerHTML = `

        <h2>🔍 Image Analysis</h2>

        <p class="loading">
            ⏳ AI image analyze kar raha hai...
        </p>

    `;


    try {

        // Convert image to Base64

        const imageBase64 = await convertToBase64(file);


        // Send image to backend

        const response = await fetch(
            "/analyze-image",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    image: imageBase64

                })

            }
        );


        const data = await response.json();


        // Check error

        if (!response.ok) {

            throw new Error(
                data.error || "AI analysis failed"
            );

        }


        // Show AI result

        showResult(data);


    } catch (error) {

        console.error(error);


        result.innerHTML = `

            <div class="warning">

                ❌ <strong>Error:</strong>

                ${error.message}

                <br><br>

                Please check your server and API key.

            </div>

        `;

    }

}


// =========================
// CONVERT IMAGE TO BASE64
// =========================

function convertToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();


        reader.onload = () => {

            resolve(reader.result);

        };


        reader.onerror = error => {

            reject(error);

        };


        reader.readAsDataURL(file);

    });

}


// =========================
// SHOW AI RESULT
// =========================

function showResult(data) {

    result.innerHTML = `

        <h2>
            🌱 Crop Analysis Result
        </h2>


        <!-- CROP -->

        <div class="analysis-card crop-card">

            <div class="analysis-icon">
                🌱
            </div>

            <div>

                <h3>
                    Crop
                </h3>

                <p>
                    ${data.crop || "Not identified"}
                </p>

            </div>

        </div>


        <!-- PROBLEM -->

        <div class="analysis-card problem-card">

            <div class="analysis-icon">
                ⚠️
            </div>

            <div>

                <h3>
                    Possible Problem
                </h3>

                <p>
                    ${data.problem || "No problem identified"}
                </p>

            </div>

        </div>


        <!-- PAANI -->

        <div class="analysis-card water-card">

            <div class="analysis-icon">
                💧
            </div>

            <div>

                <h3>
                    Paani
                </h3>

                <p>
                    ${data.paani || "No irrigation advice available"}
                </p>

            </div>

        </div>


        <!-- KHAD -->

        <div class="analysis-card fertilizer-card">

            <div class="analysis-icon">
                🌾
            </div>

            <div>

                <h3>
                    Khad
                </h3>

                <p>
                    ${data.khad || "No fertilizer advice available"}
                </p>

            </div>

        </div>


        <!-- DAWAI -->

        <div class="analysis-card medicine-card">

            <div class="analysis-icon">
                💊
            </div>

            <div>

                <h3>
                    Dawai / Treatment
                </h3>

                <p>
                    ${data.treatment || "No treatment advice available"}
                </p>

            </div>

        </div>


        <!-- KYA KAREIN -->

        <div class="analysis-card action-card">

            <div class="analysis-icon">
                📝
            </div>

            <div>

                <h3>
                    Kya Karein?
                </h3>

                <p>
                    ${data.kya_karein || "Please consult an agricultural expert."}
                </p>

            </div>

        </div>


        <div class="warning">

            ⚠️ <strong>Important:</strong>

            AI result ko general guidance ke roop mein use karein.
            Exact pesticide/fungicide dose ke liye product label
            aur local agricultural expert ki recommendation follow karein.

        </div>

    `;

}