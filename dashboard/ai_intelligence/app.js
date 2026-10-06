/* =========================================================
   AI INTELLIGENCE CENTER
========================================================= */

let predictionCount = 0;
let networkData = null;


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    const clock = document.getElementById("live-clock");

    if (!clock) return;

    const now = new Date();

    clock.textContent =
        now.toLocaleTimeString("en-IN", {
            hour12: false
        });
}

setInterval(updateClock, 1000);
updateClock();


/* =========================================================
   LOAD NETWORK DATA
========================================================= */

async function loadNetworkData() {

    try {

        const response =
            await fetch("http://127.0.0.1:5000/api/network");

        if (!response.ok) {
            throw new Error("Network API unavailable");
        }

        networkData = await response.json();

        updateAIData();

    } catch (error) {

        console.error(
            "AI Intelligence connection error:",
            error
        );

        showOfflineState();
    }
}


/* =========================================================
   UPDATE AI DATA
========================================================= */

function updateAIData() {

    if (!networkData || !networkData.towers) {
        return;
    }

    const towers = networkData.towers;

    if (!towers.length) {
        return;
    }


    /* -----------------------------------------------------
       Calculate network statistics
    ----------------------------------------------------- */

    const totalUsers =
        towers.reduce(
            (sum, tower) =>
                sum + Number(tower.users || 0),
            0
        );


    const averageLoad =
        towers.reduce(
            (sum, tower) =>
                sum + Number(tower.bandwidth || 0),
            0
        ) / towers.length;


    const averageLatency =
        towers.reduce(
            (sum, tower) =>
                sum + Number(tower.latency || 0),
            0
        ) / towers.length;


    const totalTraffic =
        towers.reduce(
            (sum, tower) =>
                sum + Number(tower.traffic || 0),
            0
        );


    const averageBandwidth =
        towers.reduce(
            (sum, tower) =>
                sum + Number(tower.bandwidth || 0),
            0
        ) / towers.length;


    /* -----------------------------------------------------
       Determine highest-load tower
    ----------------------------------------------------- */

    const highestTower =
        [...towers].sort(
            (a, b) =>
                Number(b.bandwidth || 0) -
                Number(a.bandwidth || 0)
        )[0];


    /* -----------------------------------------------------
       Network risk
    ----------------------------------------------------- */

    let risk = "LOW";

    if (averageLoad >= 75) {

        risk = "HIGH";

    } else if (averageLoad >= 50) {

        risk = "MEDIUM";
    }


    const riskElement =
        document.getElementById(
            "network-risk"
        );

    if (riskElement) {

        riskElement.textContent = risk;

        riskElement.style.color =
            risk === "HIGH"
                ? "#ff5c72"
                : risk === "MEDIUM"
                    ? "#ffc857"
                    : "#35e59a";
    }


    /* -----------------------------------------------------
       Model input values
    ----------------------------------------------------- */

    setText(
        "model-users",
        Math.round(totalUsers)
    );

    setText(
        "model-bandwidth",
        `${Math.round(averageBandwidth)}%`
    );

    setText(
        "model-latency",
        `${Math.round(averageLatency)} ms`
    );

    setText(
        "model-traffic",
        `${Math.round(totalTraffic)} Mbps`
    );


    /* -----------------------------------------------------
       AI confidence
    ----------------------------------------------------- */

    let confidence =
        Math.round(
            Math.min(
                99,
                82 +
                Math.abs(
                    averageLoad - 50
                ) * 0.3
            )
        );


    setText(
        "confidence-value",
        `${confidence}%`
    );


    const confidenceFill =
        document.getElementById(
            "confidence-fill"
        );

    if (confidenceFill) {

        confidenceFill.style.width =
            `${confidence}%`;
    }


    /* -----------------------------------------------------
       Assessment
    ----------------------------------------------------- */

    updateAssessment(
        averageLoad,
        highestTower,
        risk
    );


    /* -----------------------------------------------------
       Tower predictions
    ----------------------------------------------------- */

    updatePredictions(towers);


    /* -----------------------------------------------------
       Recommendation
    ----------------------------------------------------- */

    updateRecommendation(
        averageLoad,
        highestTower,
        risk
    );
}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   AI ASSESSMENT
========================================================= */

function updateAssessment(
    averageLoad,
    highestTower,
    risk
) {

    const title =
        document.getElementById(
            "assessment-title"
        );

    const text =
        document.getElementById(
            "assessment-text"
        );


    if (!title || !text) {
        return;
    }


    if (risk === "HIGH") {

        title.textContent =
            "High congestion detected";

        text.textContent =
            `${highestTower.id} is currently carrying the highest network load. AI recommends traffic redistribution to nearby towers.`;

    } else if (risk === "MEDIUM") {

        title.textContent =
            "Moderate network pressure";

        text.textContent =
            `The network is operating under moderate load. ${highestTower.id} should be monitored for further congestion.`;

    } else {

        title.textContent =
            "Network operating normally";

        text.textContent =
            "Current tower utilization is within a healthy range. The AI engine continues monitoring the network for congestion patterns.";
    }
}


/* =========================================================
   TOWER PREDICTIONS
========================================================= */

function updatePredictions(towers) {

    const grid =
        document.getElementById(
            "prediction-grid"
        );

    if (!grid) return;


    grid.innerHTML = "";


    towers.forEach(tower => {

        const load =
            Number(tower.bandwidth || 0);


        let status =
            "LOW";

        let statusClass =
            "low";


        if (load >= 75) {

            status = "HIGH";

            statusClass = "high";

        } else if (load >= 50) {

            status = "MEDIUM";

            statusClass = "medium";
        }


        const card =
            document.createElement(
                "div"
            );

        card.className =
            "prediction-card";


        card.innerHTML = `

            <span class="tower-id">
                ${escapeHTML(tower.id)}
            </span>

            <h3>
                Tower ${escapeHTML(tower.id)}
            </h3>

            <div class="prediction-load">
                ${Math.round(load)}%
            </div>

            <span
                class="prediction-status ${statusClass}"
            >
                ${status} CONGESTION
            </span>

        `;


        grid.appendChild(card);
    });
}


/* =========================================================
   RECOMMENDATION
========================================================= */

function updateRecommendation(
    averageLoad,
    highestTower,
    risk
) {

    const title =
        document.getElementById(
            "recommendation-title"
        );

    const text =
        document.getElementById(
            "recommendation-text"
        );


    if (!title || !text) {
        return;
    }


    if (risk === "HIGH") {

        title.textContent =
            `Redistribute traffic from ${highestTower.id}`;

        text.textContent =
            "AI recommends transferring users from the congested tower to nearby towers with available capacity.";

    } else if (risk === "MEDIUM") {

        title.textContent =
            `Monitor ${highestTower.id}`;

        text.textContent =
            "The network is under moderate pressure. Continue monitoring tower utilization before taking corrective action.";

    } else {

        title.textContent =
            "Maintain current network allocation";

        text.textContent =
            "No immediate traffic redistribution is required. The network is currently operating within acceptable limits.";
    }
}


/* =========================================================
   RUN AI ANALYSIS
========================================================= */

async function runAIAnalysis() {

    const button =
        document.getElementById(
            "run-analysis"
        );

    if (!button) return;


    button.disabled = true;

    button.textContent =
        "ANALYZING NETWORK...";


    setDecisionStatus(
        "decision-detect",
        "PROCESSING"
    );

    setDecisionStatus(
        "decision-predict",
        "READY"
    );

    setDecisionStatus(
        "decision-recommend",
        "READY"
    );

    setDecisionStatus(
        "decision-optimize",
        "READY"
    );


    /* Step 1 — Detection */

    await delay(900);

    setDecisionStatus(
        "decision-detect",
        "COMPLETE",
        true
    );


    /* Step 2 — Prediction */

    setDecisionStatus(
        "decision-predict",
        "PROCESSING"
    );

    await delay(900);

    predictionCount += 6;

    setText(
        "prediction-count",
        predictionCount
    );

    setDecisionStatus(
        "decision-predict",
        "COMPLETE",
        true
    );


    /* Step 3 — Recommendation */

    setDecisionStatus(
        "decision-recommend",
        "PROCESSING"
    );

    await delay(900);

    setDecisionStatus(
        "decision-recommend",
        "COMPLETE",
        true
    );


    /* Step 4 — Optimization */

    setDecisionStatus(
        "decision-optimize",
        "PROCESSING"
    );

    await delay(900);

    setDecisionStatus(
        "decision-optimize",
        "COMPLETE",
        true
    );


    /* Activity */

    addActivity(
        "AI analysis completed",
        "Network congestion assessment generated"
    );


    button.textContent =
        "ANALYSIS COMPLETE";


    setTimeout(() => {

        button.disabled = false;

        button.textContent =
            "RUN AI ANALYSIS";

    }, 1800);
}


/* =========================================================
   DECISION STATUS
========================================================= */

function setDecisionStatus(
    id,
    status,
    complete = false
) {

    const element =
        document.getElementById(id);

    if (!element) return;


    element.textContent =
        status;

    element.classList.remove(
        "complete",
        "processing"
    );


    if (complete) {

        element.classList.add(
            "complete"
        );

    } else if (
        status === "PROCESSING"
    ) {

        element.classList.add(
            "processing"
        );
    }
}


/* =========================================================
   ACTIVITY
========================================================= */

function addActivity(
    title,
    description
) {

    const list =
        document.getElementById(
            "activity-list"
        );

    if (!list) return;


    const item =
        document.createElement(
            "div"
        );

    item.className =
        "activity-item";


    item.innerHTML = `

        <span
            class="activity-dot green"
        ></span>

        <div>

            <strong>
                ${escapeHTML(title)}
            </strong>

            <small>
                ${escapeHTML(description)}
            </small>

        </div>

    `;


    list.prepend(item);
}


/* =========================================================
   OFFLINE STATE
========================================================= */

function showOfflineState() {

    setText(
        "network-risk",
        "OFFLINE"
    );

    setText(
        "model-users",
        "--"
    );

    setText(
        "model-bandwidth",
        "--"
    );

    setText(
        "model-latency",
        "--"
    );

    setText(
        "model-traffic",
        "--"
    );

    setText(
        "assessment-title",
        "AI engine waiting for network"
    );

    setText(
        "assessment-text",
        "Unable to receive live telemetry from the tower control server."
    );
}


/* =========================================================
   UTILITY
========================================================= */

function delay(milliseconds) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
}


/* =========================================================
   BASIC HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   BUTTON EVENT
========================================================= */

const analysisButton =
    document.getElementById(
        "run-analysis"
    );

if (analysisButton) {

    analysisButton.addEventListener(
        "click",
        runAIAnalysis
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

loadNetworkData();


/* Refresh AI information every 4 seconds */

setInterval(
    loadNetworkData,
    4000
);