/* =========================================================
   ANALYTICS CENTER
========================================================= */

let networkData = null;


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    const clock =
        document.getElementById("live-clock");

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

async function loadAnalytics() {

    try {

        const response =
            await fetch(
                "/api/network"
            );

        if (!response.ok) {
            throw new Error(
                "Network API unavailable"
            );
        }

        networkData =
            await response.json();

        updateAnalytics();

    } catch (error) {

        console.error(
            "Analytics connection error:",
            error
        );

        showOfflineState();
    }
}


/* =========================================================
   UPDATE ANALYTICS
========================================================= */

function updateAnalytics() {

    if (
        !networkData ||
        !networkData.towers
    ) {
        return;
    }


    const towers =
        networkData.towers;


    if (!towers.length) {
        return;
    }


    /* -----------------------------------------------------
       Calculate metrics
    ----------------------------------------------------- */

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
        towers.reduce(
            (sum, tower) =>
                sum +
                Number(
                    tower.bandwidth || 0
                ),
            0
        ) / towers.length;


    const totalTraffic =
        towers.reduce(
            (sum, tower) =>
                sum +
                Number(
                    tower.traffic || 0
                ),
            0
        );


    const averageLatency =
        towers.reduce(
            (sum, tower) =>
                sum +
                Number(
                    tower.latency || 0
                ),
            0
        ) / towers.length;


    /* -----------------------------------------------------
       KPI values
    ----------------------------------------------------- */

    setText(
        "total-users",
        Math.round(totalUsers)
    );


    setText(
        "average-load",
        `${Math.round(
            averageLoad
        )}%`
    );


    setText(
        "total-traffic",
        `${Math.round(
            totalTraffic
        )} Mbps`
    );


    setText(
        "average-latency",
        `${Math.round(
            averageLatency
        )} ms`
    );


    /* -----------------------------------------------------
       Tower utilization
    ----------------------------------------------------- */

    renderTowerBars(towers);


    /* -----------------------------------------------------
       Health
    ----------------------------------------------------- */

    updateHealth(
        towers,
        averageLoad,
        averageLatency
    );


    /* -----------------------------------------------------
       Performance table
    ----------------------------------------------------- */

    renderPerformanceTable(
        towers
    );


    /* -----------------------------------------------------
       Traffic distribution
    ----------------------------------------------------- */

    renderDistribution(
        towers,
        totalTraffic
    );


    /* -----------------------------------------------------
       Analytics event
    ----------------------------------------------------- */

    updateAnalyticsEvent(
        towers,
        averageLoad
    );
}


/* =========================================================
   TOWER LOAD BARS
========================================================= */

function renderTowerBars(towers) {

    const container =
        document.getElementById(
            "tower-bars"
        );

    if (!container) return;


    container.innerHTML = "";


    towers.forEach(tower => {

        const load =
            Number(
                tower.bandwidth || 0
            );


        const row =
            document.createElement(
                "div"
            );

        row.className =
            "tower-bar-row";


        row.innerHTML = `

            <span
                class="tower-bar-label"
            >
                ${escapeHTML(
                    tower.id ||
                    "TOWER"
                )}
            </span>


            <div class="bar-track">

                <div
                    class="bar-fill"
                    style="width:${Math.min(
                        load,
                        100
                    )}%"
                ></div>

            </div>


            <span
                class="tower-bar-value"
            >
                ${Math.round(load)}%
            </span>

        `;


        container.appendChild(row);
    });
}


/* =========================================================
   NETWORK HEALTH
========================================================= */

function updateHealth(
    towers,
    averageLoad,
    averageLatency
) {

    const total =
        towers.length;


    const available =
        towers.filter(
            tower =>
                Number(
                    tower.bandwidth || 0
                ) < 90
        ).length;


    const availability =
        total > 0
            ? Math.round(
                (available / total) *
                100
            )
            : 0;


    let congestionHealth =
        100 -
        averageLoad;


    congestionHealth =
        Math.max(
            0,
            Math.min(
                100,
                congestionHealth
            )
        );


    let latencyHealth = 100;


    if (averageLatency > 100) {

        latencyHealth = 55;

    } else if (
        averageLatency > 70
    ) {

        latencyHealth = 70;

    } else if (
        averageLatency > 50
    ) {

        latencyHealth = 85;
    }


    const healthScore =
        Math.round(
            (
                availability +
                congestionHealth +
                latencyHealth
            ) / 3
        );


    setText(
        "health-score",
        healthScore
    );


    setText(
        "availability-value",
        `${availability}%`
    );


    setText(
        "congestion-value",
        `${Math.round(
            congestionHealth
        )}%`
    );


    setText(
        "latency-health",
        `${latencyHealth}%`
    );


    /* Change score colour */

    const score =
        document.getElementById(
            "health-score"
        );


    if (score) {

        if (healthScore >= 75) {

            score.style.color =
                "#35e59a";

        } else if (
            healthScore >= 50
        ) {

            score.style.color =
                "#ffc857";

        } else {

            score.style.color =
                "#ff5c72";
        }
    }
}


/* =========================================================
   PERFORMANCE TABLE
========================================================= */

function renderPerformanceTable(
    towers
) {

    const table =
        document.getElementById(
            "performance-table"
        );

    if (!table) return;


    table.innerHTML = "";


    towers.forEach(tower => {

        const load =
            Number(
                tower.bandwidth || 0
            );


        const users =
            Number(
                tower.users || 0
            );


        const traffic =
            Number(
                tower.traffic || 0
            );


        const latency =
            Number(
                tower.latency || 0
            );


        let status =
            "NORMAL";

        let statusClass =
            "normal";


        if (load >= 75) {

            status =
                "CONGESTED";

            statusClass =
                "congested";

        } else if (
            load >= 50
        ) {

            status =
                "BUSY";

            statusClass =
                "busy";
        }


        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td>

                <span
                    class="tower-name"
                >
                    ${escapeHTML(
                        tower.id ||
                        "Tower"
                    )}
                </span>

            </td>


            <td>
                ${users}
            </td>


            <td>
                ${Math.round(load)}%
            </td>


            <td>
                ${traffic} Mbps
            </td>


            <td>
                ${latency} ms
            </td>


            <td>

                <span
                    class="table-status ${statusClass}"
                >
                    ${status}
                </span>

            </td>

        `;


        table.appendChild(row);
    });
}


/* =========================================================
   TRAFFIC DISTRIBUTION
========================================================= */

function renderDistribution(
    towers,
    totalTraffic
) {

    const container =
        document.getElementById(
            "distribution-list"
        );

    if (!container) return;


    container.innerHTML = "";


    towers.forEach(tower => {

        const traffic =
            Number(
                tower.traffic || 0
            );


        const percentage =
            totalTraffic > 0
                ? (
                    traffic /
                    totalTraffic
                ) * 100
                : 0;


        const item =
            document.createElement(
                "div"
            );

        item.className =
            "distribution-item";


        item.innerHTML = `

            <div
                class="distribution-header"
            >

                <span>
                    ${escapeHTML(
                        tower.id ||
                        "Tower"
                    )}
                </span>

                <strong>
                    ${percentage.toFixed(1)}%
                </strong>

            </div>


            <div
                class="distribution-track"
            >

                <div
                    class="distribution-fill"
                    style="width:${Math.min(
                        percentage,
                        100
                    )}%"
                ></div>

            </div>

        `;


        container.appendChild(item);
    });
}


/* =========================================================
   ANALYTICS EVENT
========================================================= */

function updateAnalyticsEvent(
    towers,
    averageLoad
) {

    const congested =
        towers.filter(
            tower =>
                Number(
                    tower.bandwidth || 0
                ) >= 75
        );


    if (
        congested.length > 0
    ) {

        addEvent(
            "Congestion detected",
            `${congested.length} tower(s) currently require attention.`,
            "red"
        );

    } else {

        addEvent(
            "Network operating normally",
            `Average tower utilization is ${Math.round(
                averageLoad
            )}%.`,
            "green"
        );
    }
}


/* =========================================================
   EVENTS
========================================================= */

function addEvent(
    title,
    description,
    type = "blue"
) {

    const list =
        document.getElementById(
            "events-list"
        );

    if (!list) return;


    /* Prevent duplicate event spam */

    const first =
        list.firstElementChild;


    if (
        first &&
        first.dataset.title === title
    ) {
        return;
    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "event-item";


    item.dataset.title =
        title;


    const now =
        new Date();


    const time =
        now.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }
        );


    item.innerHTML = `

        <span
            class="event-dot ${type}"
        ></span>


        <div>

            <strong>
                ${escapeHTML(title)}
            </strong>

            <small>
                ${escapeHTML(
                    description
                )}
            </small>

        </div>


        <time>
            ${time}
        </time>

    `;


    list.prepend(item);


    while (
        list.children.length > 6
    ) {

        list.removeChild(
            list.lastElementChild
        );
    }
}


/* =========================================================
   OFFLINE STATE
========================================================= */

function showOfflineState() {

    setText(
        "total-users",
        "--"
    );

    setText(
        "average-load",
        "--"
    );

    setText(
        "total-traffic",
        "--"
    );

    setText(
        "average-latency",
        "--"
    );


    setText(
        "health-score",
        "--"
    );


    const bars =
        document.getElementById(
            "tower-bars"
        );


    if (bars) {

        bars.innerHTML = `

            <div class="empty-state">

                Unable to connect to the
                tower control server.

                <br><br>

                Make sure
                <strong>
                    dashboard_server.py
                </strong>
                is running.

            </div>

        `;
    }
}


/* =========================================================
   HELPERS
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;
    }
}


function escapeHTML(
    value
) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   INITIALIZATION
========================================================= */

loadAnalytics();


/* Refresh analytics every 4 seconds */

setInterval(
    loadAnalytics,
    4000
);