"use strict";


/* =========================================================
   GLOBAL STATE
========================================================= */

let map = null;

let markers = new Map();

let networkTimer = null;

let latestTowers = [];

window.selectedTowerId = null;


/* =========================================================
   MAP CENTER
========================================================= */

const MAP_CENTER = {
    lat: 12.9716,
    lng: 77.5946
};


/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

function formatNumber(value) {

    return Number(value || 0)
        .toLocaleString("en-IN");

}


function formatPercent(value) {

    return `${Number(value || 0).toFixed(1)}%`;

}


function getStatusClass(congestion) {

    if (congestion === "HIGH") {
        return "high";
    }

    if (congestion === "MEDIUM") {
        return "medium";
    }

    return "low";

}


/* =========================================================
   LIVE CLOCK
========================================================= */

function updateLiveClock() {

    const clock =
        document.getElementById(
            "live-clock"
        );


    if (!clock) {
        return;
    }


    const now =
        new Date();


    clock.textContent =
        now.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }
        );

}


updateLiveClock();

setInterval(
    updateLiveClock,
    1000
);


/* =========================================================
   GOOGLE MAP INITIALIZATION
========================================================= */

window.initMap = async function () {

    const mapElement =
        document.getElementById(
            "network-map"
        );


    if (!mapElement) {

        console.warn(
            "Google Map container not found."
        );

        return;
    }


    try {

        if (
            !window.google ||
            !google.maps
        ) {

            throw new Error(
                "Google Maps API is unavailable."
            );

        }


        const mapsLibrary =
            await google.maps.importLibrary(
                "maps"
            );


        map =
            new mapsLibrary.Map(
                mapElement,
                {

                    center:
                        MAP_CENTER,

                    zoom: 12,

                    mapId:
                        "DEMO_MAP_ID",

                    disableDefaultUI:
                        true,

                    zoomControl:
                        true,

                    gestureHandling:
                        "greedy"

                }
            );


        console.log(
            "Google Map initialized successfully."
        );


        const fallback =
            document.getElementById(
                "map-fallback"
            );


        if (fallback) {
            fallback.style.display =
                "none";
        }


        updateMapMarkers(
            latestTowers
        );

    }

    catch (error) {

        console.warn(
            "Google Maps could not initialize:",
            error
        );


        showMapFallback(
            "Google Maps unavailable. Live tower data is still active."
        );

    }

};


/* =========================================================
   MAP FALLBACK
========================================================= */

function showMapFallback(message) {

    const fallback =
        document.getElementById(
            "map-fallback"
        );


    if (!fallback) {
        return;
    }


    fallback.style.display =
        "flex";


    fallback.querySelector(
        "strong"
    ).textContent =
        "NETWORK RADAR";


    fallback.querySelector(
        "span"
    ).textContent =
        message;

}


/* =========================================================
   FETCH LIVE NETWORK
========================================================= */

async function updateNetwork() {

    try {

        const response =
            await fetch(
                "/api/network",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Network updated:",
            data
        );


        if (
            !data ||
            !Array.isArray(
                data.towers
            )
        ) {

            throw new Error(
                "Invalid network response."
            );

        }


        latestTowers =
            data.towers;


        updateDashboard(
            data
        );


        updateMapMarkers(
            data.towers
        );


        updateTowerNetwork(
            data.towers
        );


        updateNetworkTopology(
            data.towers
        );

    }

    catch (error) {

        console.error(
            "Network update failed:",
            error
        );

    }

}


/* =========================================================
   UPDATE DASHBOARD
========================================================= */

function updateDashboard(data) {

    const towers =
        data.towers || [];


    const totalTowers =
        towers.length;


    const totalUsers =
        towers.reduce(
            (sum, tower) =>
                sum +
                Number(
                    tower.users || 0
                ),
            0
        );


    const averageLoad =
        totalTowers > 0

            ? towers.reduce(
                (sum, tower) =>
                    sum +
                    Number(
                        tower.bandwidth || 0
                    ),
                0
            ) / totalTowers

            : 0;


    const highCount =
        towers.filter(
            tower =>
                tower.congestion ===
                "HIGH"
        ).length;


    const mediumCount =
        towers.filter(
            tower =>
                tower.congestion ===
                "MEDIUM"
        ).length;


    const lowCount =
        towers.filter(
            tower =>
                tower.congestion ===
                "LOW"
        ).length;


    /* -------------------------------------------------------
       KPI
    ------------------------------------------------------- */

    setText(
        "tower-count",
        totalTowers
    );


    setText(
        "user-count",
        formatNumber(
            totalUsers
        )
    );


    setText(
        "network-load",
        formatPercent(
            averageLoad
        )
    );


    setText(
        "congested-count",
        highCount + mediumCount
    );


    const loadBar =
        document.getElementById(
            "network-load-bar"
        );


    if (loadBar) {

        loadBar.style.width =
            `${Math.min(
                100,
                averageLoad
            )}%`;

    }


    /* -------------------------------------------------------
       AI COUNTS
    ------------------------------------------------------- */

    setText(
        "high-count",
        highCount
    );


    setText(
        "medium-count",
        mediumCount
    );


    setText(
        "low-count",
        lowCount
    );


    updateRisk(
        highCount,
        mediumCount,
        lowCount
    );


    updateRecommendation(
        towers,
        highCount,
        mediumCount
    );


    updateTowerCards(
        towers
    );

}


/* =========================================================
   SAFE TEXT UPDATE
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   AI RISK
========================================================= */

function updateRisk(
    highCount,
    mediumCount
) {

    let risk =
        "LOW";

    let percentage =
        20;


    if (highCount >= 2) {

        risk =
            "CRITICAL";

        percentage =
            100;

    }

    else if (highCount === 1) {

        risk =
            "HIGH";

        percentage =
            75;

    }

    else if (mediumCount > 0) {

        risk =
            "MEDIUM";

        percentage =
            50;

    }


    const riskElement =
        document.getElementById(
            "ai-risk-level"
        );


    if (riskElement) {

        riskElement.textContent =
            risk;

        riskElement.style.color =
            getRiskColor(risk);

    }


    const riskBar =
        document.getElementById(
            "risk-bar-fill"
        );


    if (riskBar) {

        riskBar.style.width =
            `${percentage}%`;

        riskBar.style.background =
            getRiskColor(risk);

    }

}


function getRiskColor(risk) {

    if (risk === "CRITICAL") {
        return "#ff4d6d";
    }

    if (risk === "HIGH") {
        return "#ff8a3d";
    }

    if (risk === "MEDIUM") {
        return "#f7c948";
    }

    return "#35f0a0";

}


/* =========================================================
   AI RECOMMENDATION
========================================================= */

function updateRecommendation(
    towers,
    highCount,
    mediumCount
) {

    const recommendation =
        document.getElementById(
            "ai-recommendation"
        );


    if (!recommendation) {
        return;
    }


    const highTowers =
        towers
            .filter(
                tower =>
                    tower.congestion ===
                    "HIGH"
            )
            .map(
                tower =>
                    tower.id
            );


    const mediumTowers =
        towers
            .filter(
                tower =>
                    tower.congestion ===
                    "MEDIUM"
            )
            .map(
                tower =>
                    tower.id
            );


    if (highCount > 0) {

        recommendation.textContent =
            `${highTowers.join(", ")} showing high congestion. Select a tower to start AI traffic redistribution.`;

    }

    else if (mediumCount > 0) {

        recommendation.textContent =
            `${mediumTowers.join(", ")} showing moderate network load. AI recommends continuous monitoring.`;

    }

    else {

        recommendation.textContent =
            "All monitored towers are operating within normal conditions. Network traffic is stable.";

    }

}


/* =========================================================
   TOWER CARDS
========================================================= */

function updateTowerCards(
    towers
) {

    const grid =
        document.getElementById(
            "tower-grid"
        );


    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    towers.forEach(
        tower => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "tower-card";


            if (
                window.selectedTowerId ===
                tower.id
            ) {

                card.classList.add(
                    "selected"
                );

            }


            const statusClass =
                getStatusClass(
                    tower.congestion
                );


            card.innerHTML = `

                <div class="tower-top">

                    <div class="tower-name">
                        ${tower.id}
                    </div>

                    <div
                        class="tower-status ${statusClass}"
                    >
                        ${tower.congestion}
                    </div>

                </div>


                <div class="tower-load">

                    <div class="tower-load-header">

                        <span>
                            NETWORK LOAD
                        </span>

                        <strong>
                            ${tower.bandwidth}%
                        </strong>

                    </div>


                    <div class="tower-load-track">

                        <div
                            class="tower-load-fill ${statusClass}"
                            style="
                                width:${tower.bandwidth}%
                            "
                        ></div>

                    </div>

                </div>


                <div class="tower-metrics">

                    <div>

                        <span>
                            USERS
                        </span>

                        <strong>
                            ${formatNumber(tower.users)}
                        </strong>

                    </div>


                    <div>

                        <span>
                            LATENCY
                        </span>

                        <strong>
                            ${tower.latency} ms
                        </strong>

                    </div>


                    <div>

                        <span>
                            TRAFFIC
                        </span>

                        <strong>
                            ${tower.traffic}%
                        </strong>

                    </div>

                </div>

            `;


            /* ------------------------------------------------
               Select tower
            ------------------------------------------------ */

            card.addEventListener(
                "click",
                () => {

                    selectTower(
                        tower
                    );

                }
            );


            grid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   SELECT TOWER
========================================================= */

function selectTower(
    tower
) {

    window.selectedTowerId =
        tower.id;


    updateTowerCards(
        latestTowers
    );


    const title =
        document.getElementById(
            "action-title"
        );


    const description =
        document.getElementById(
            "action-description"
        );


    const button =
        document.getElementById(
            "redistribute-button"
        );


    if (
        title &&
        description &&
        button
    ) {

        title.textContent =
            `${tower.id} selected`;


        if (
            tower.congestion ===
            "HIGH"
        ) {

            description.textContent =
                `${tower.id} is experiencing HIGH congestion. AI recommends immediate traffic redistribution.`;

            button.disabled =
                false;

        }

        else if (
            tower.congestion ===
            "MEDIUM"
        ) {

            description.textContent =
                `${tower.id} is experiencing MEDIUM congestion. AI can redistribute traffic to balance the network.`;

            button.disabled =
                false;

        }

        else {

            description.textContent =
                `${tower.id} is operating normally. Redistribution is not currently required.`;

            button.disabled =
                true;

        }

    }


    const analyzeButton =
        document.getElementById(
            "analyze-button"
        );


    if (analyzeButton) {

        analyzeButton.textContent =
            `ANALYZE ${tower.id}`;

    }


    addActivity(
        `${tower.id} selected`,
        `${tower.congestion} congestion detected`
    );

}


/* =========================================================
   AI ANALYSIS BUTTON
========================================================= */

async function analyzeSelectedTower() {

    if (!window.selectedTowerId) {

        const description =
            document.getElementById(
                "action-description"
            );


        if (description) {

            description.textContent =
                "Select a HIGH or MEDIUM congestion tower first.";

        }

        return;

    }


    const tower =
        latestTowers.find(
            item =>
                item.id ===
                window.selectedTowerId
        );


    if (!tower) {
        return;
    }


    const button =
        document.getElementById(
            "analyze-button"
        );


    const recommendation =
        document.getElementById(
            "ai-recommendation"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "ANALYZING...";

    }


    if (recommendation) {

        recommendation.textContent =
            `AI is analyzing ${tower.id} load, traffic, users and latency...`;

    }


    await delay(
        1500
    );


    if (recommendation) {

        recommendation.textContent =
            `${tower.id}: ${tower.congestion} congestion detected. AI recommends traffic redistribution.`;

    }


    if (button) {

        button.disabled =
            false;

        button.textContent =
            "REDISTRIBUTE TRAFFIC";

    }


    const actionButton =
        document.getElementById(
            "redistribute-button"
        );


    if (actionButton) {

        actionButton.disabled =
            false;

    }


    addActivity(
        "AI analysis completed",
        `${tower.id} optimization recommendation generated`
    );

}


/* =========================================================
   REDISTRIBUTE TRAFFIC
========================================================= */

async function redistributeTraffic() {

    const towerId =
        window.selectedTowerId;


    if (!towerId) {
        return;
    }


    const button =
        document.getElementById(
            "redistribute-button"
        );


    const title =
        document.getElementById(
            "action-title"
        );


    const description =
        document.getElementById(
            "action-description"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "OPTIMIZING...";

    }


    if (title) {

        title.textContent =
            "AI optimizing network";

    }


    if (description) {

        description.textContent =
            `Finding the best nearby tower for ${towerId} traffic redistribution...`;

    }


    try {

        const response =
            await fetch(
                "/api/redistribute",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            tower_id:
                                towerId
                        })

                }
            );


        const result =
            await response.json();


        if (!response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Redistribution failed."
            );

        }


        if (title) {

            title.textContent =
                "Optimization completed";

        }


        if (description) {

            description.textContent =
                `${result.source_tower.id} reduced from ${result.source_tower.old_load}% to ${result.source_tower.new_load}%. Traffic moved to ${result.target_tower.id}.`;

        }


        addActivity(
            "AI redistribution completed",
            `${result.source_tower.id} → ${result.target_tower.id}`
        );


        window.selectedTowerId =
            result.source_tower.id;


        await updateNetwork();

    }

    catch (error) {

        console.error(
            "Redistribution error:",
            error
        );


        if (title) {

            title.textContent =
                "Optimization failed";

        }


        if (description) {

            description.textContent =
                error.message;

        }

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "REDISTRIBUTE TRAFFIC";

        }

    }

}


/* =========================================================
   GOOGLE MAP MARKERS
========================================================= */

async function updateMapMarkers(
    towers
) {

    if (
        !map ||
        !towers ||
        !towers.length
    ) {

        return;

    }


    try {

        const markerLibrary =
            await google.maps.importLibrary(
                "marker"
            );


        const AdvancedMarkerElement =
            markerLibrary.AdvancedMarkerElement;


        const activeIds =
            new Set();


        towers.forEach(
            tower => {

                activeIds.add(
                    tower.id
                );


                if (
                    markers.has(
                        tower.id
                    )
                ) {

                    const existing =
                        markers.get(
                            tower.id
                        );


                    existing.marker.position =
                        {
                            lat:
                                tower.lat,

                            lng:
                                tower.lng
                        };


                    updateMarkerAppearance(
                        existing.element,
                        tower
                    );


                    return;

                }


                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "tower-marker";


                updateMarkerAppearance(
                    element,
                    tower
                );


                element.title =
                    `${tower.id} - ${tower.congestion}`;


                element.addEventListener(
                    "click",
                    () => {

                        const found =
                            latestTowers.find(
                                item =>
                                    item.id ===
                                    tower.id
                            );


                        if (found) {

                            selectTower(
                                found
                            );

                        }

                    }
                );


                const marker =
                    new AdvancedMarkerElement({

                        map: map,

                        position: {
                            lat:
                                tower.lat,

                            lng:
                                tower.lng
                        },

                        content:
                            element,

                        title:
                            tower.id

                    });


                markers.set(
                    tower.id,
                    {
                        marker,
                        element
                    }
                );

            }
        );


        /* Remove old markers */

        markers.forEach(
            (
                item,
                id
            ) => {

                if (
                    !activeIds.has(id)
                ) {

                    item.marker.map =
                        null;

                    markers.delete(
                        id
                    );

                }

            }
        );

    }

    catch (error) {

        console.warn(
            "Could not update map markers:",
            error
        );

    }

}


/* =========================================================
   MARKER APPEARANCE
========================================================= */

function updateMarkerAppearance(
    element,
    tower
) {

    element.classList.remove(
        "low",
        "medium",
        "high"
    );


    element.classList.add(
        getStatusClass(
            tower.congestion
        )
    );

}


/* =========================================================
   TOWER NETWORK PAGE
========================================================= */

function updateTowerNetwork(
    towers
) {

    if (
        !Array.isArray(towers)
    ) {

        return;

    }


    const totalUsers =
        towers.reduce(
            (sum, tower) =>
                sum +
                Number(
                    tower.users || 0
                ),
            0
        );


    const averageLoad =
        towers.length

            ? towers.reduce(
                (sum, tower) =>
                    sum +
                    Number(
                        tower.bandwidth || 0
                    ),
                0
            ) / towers.length

            : 0;


    const congested =
        towers.filter(
            tower =>
                tower.congestion ===
                    "HIGH" ||

                tower.congestion ===
                    "MEDIUM"
        ).length;


    setText(
        "network-active-towers",
        towers.length
    );


    setText(
        "network-total-users",
        formatNumber(
            totalUsers
        )
    );


    setText(
        "network-average-load",
        formatPercent(
            averageLoad
        )
    );


    setText(
        "network-congested-towers",
        congested
    );


    const grid =
        document.getElementById(
            "tower-network-grid"
        );


    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    towers.forEach(
        tower => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                `network-tower-card ${getStatusClass(
                    tower.congestion
                )}`;


            if (
                tower.id ===
                window.selectedTowerId
            ) {

                card.classList.add(
                    "selected"
                );

            }


            card.innerHTML = `

                <div class="network-tower-top">

                    <div class="network-tower-icon">
                        ◈
                    </div>

                    <div>

                        <strong>
                            ${tower.id}
                        </strong>

                        <span>
                            ${tower.congestion}
                        </span>

                    </div>

                    <div
                        class="network-tower-status"
                    ></div>

                </div>


                <div class="network-load-header">

                    <span>
                        NETWORK LOAD
                    </span>

                    <strong>
                        ${tower.bandwidth}%
                    </strong>

                </div>


                <div class="network-load-track">

                    <div
                        class="network-load-fill"
                        style="
                            width:${tower.bandwidth}%
                        "
                    ></div>

                </div>


                <div class="network-tower-metrics">

                    <div>

                        <span>
                            USERS
                        </span>

                        <strong>
                            ${formatNumber(
                                tower.users
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            LATENCY
                        </span>

                        <strong>
                            ${tower.latency} ms
                        </strong>

                    </div>


                    <div>

                        <span>
                            TRAFFIC
                        </span>

                        <strong>
                            ${tower.traffic}%
                        </strong>

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    selectNetworkTower(
                        tower
                    );

                }
            );


            grid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   NETWORK PAGE TOWER SELECTION
========================================================= */

function selectNetworkTower(
    tower
) {

    window.selectedTowerId =
        tower.id;


    updateTowerNetwork(
        latestTowers
    );


    updateNetworkTopology(
        latestTowers
    );


    setText(
        "selected-network-id",
        tower.id
    );


    setText(
        "selected-network-status",
        `AI status: ${tower.congestion}`
    );


    setText(
        "selected-network-users",
        formatNumber(
            tower.users
        )
    );


    setText(
        "selected-network-load",
        `${tower.bandwidth}%`
    );


    setText(
        "selected-network-latency",
        `${tower.latency} ms`
    );


    setText(
        "selected-network-traffic",
        `${tower.traffic}%`
    );


    addActivity(
        `${tower.id} selected`,
        "Tower Network view"
    );

}


/* =========================================================
   NETWORK TOPOLOGY
========================================================= */

function updateNetworkTopology(
    towers
) {

    const nodes =
        document.querySelectorAll(
            ".network-node"
        );


    nodes.forEach(
        node => {

            const towerId =
                node.dataset.tower;


            const tower =
                towers.find(
                    item =>
                        item.id ===
                        towerId
                );


            if (!tower) {
                return;
            }


            node.classList.remove(
                "low",
                "medium",
                "high"
            );


            node.classList.add(
                getStatusClass(
                    tower.congestion
                )
            );


            const status =
                node.querySelector(
                    "small"
                );


            if (status) {

                status.textContent =
                    tower.congestion;

            }

        }
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const dashboardNav =
        document.getElementById(
            "dashboard-nav"
        );


    const towerNetworkNav =
        document.getElementById(
            "tower-network-nav"
        );


    const dashboardView =
        document.getElementById(
            "dashboard-view"
        );


    const towerNetworkView =
        document.getElementById(
            "tower-network-view"
        );


    if (
        !dashboardNav ||
        !towerNetworkNav ||
        !dashboardView ||
        !towerNetworkView
    ) {

        return;

    }


    dashboardNav.addEventListener(
        "click",
        () => {

            dashboardView.style.display =
                "block";


            towerNetworkView.style.display =
                "none";


            dashboardNav.classList.add(
                "active"
            );


            towerNetworkNav.classList.remove(
                "active"
            );

        }
    );


    towerNetworkNav.addEventListener(
        "click",
        () => {

            

            dashboardView.style.display =
                "none";


            towerNetworkView.style.display =
                "block";


            dashboardNav.classList.remove(
                "active"
            );


            towerNetworkNav.classList.add(
                "active"
            );


            updateTowerNetwork(
                latestTowers
            );


            updateNetworkTopology(
                latestTowers
            );

        }
    );

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


    if (!list) {
        return;
    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "activity-item";


    item.innerHTML = `

        <span
            class="activity-dot blue"
        ></span>

        <div>

            <strong>
                ${title}
            </strong>

            <small>
                ${description}
            </small>

        </div>

    `;


    list.prepend(
        item
    );


    /* Keep activity list small */

    while (
        list.children.length > 5
    ) {

        list.removeChild(
            list.lastElementChild
        );

    }

}


/* =========================================================
   DELAY
========================================================= */

function delay(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}


/* =========================================================
   EVENT SETUP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "AI Tower Control frontend loaded successfully."
        );


        setupNavigation();


        const analyzeButton =
            document.getElementById(
                "analyze-button"
            );


        if (analyzeButton) {

            analyzeButton.addEventListener(
                "click",
                analyzeSelectedTower
            );

        }


        const redistributeButton =
            document.getElementById(
                "redistribute-button"
            );


        if (redistributeButton) {

            redistributeButton.addEventListener(
                "click",
                redistributeTraffic
            );

        }


        /* Get live data independently of Google Maps */

        updateNetwork();


        networkTimer =
            setInterval(
                updateNetwork,
                4000
            );

    }
);