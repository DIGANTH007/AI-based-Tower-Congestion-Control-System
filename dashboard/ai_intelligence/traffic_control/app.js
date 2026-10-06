/* =========================================================
   AI TOWER — TRAFFIC CONTROL
========================================================= */

let networkData = null;
let selectedSource = null;
let selectedTarget = null;


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    const clock =
        document.getElementById("live-clock");

    if (!clock) return;

    clock.textContent =
        new Date().toLocaleTimeString("en-IN", {
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
            await fetch(
                "http://127.0.0.1:5000/api/network"
            );

        if (!response.ok) {
            throw new Error("Network API unavailable");
        }

        networkData =
            await response.json();

        renderTrafficControl();

    } catch (error) {

        console.error(
            "Traffic Control error:",
            error
        );

        showOfflineState();
    }
}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderTrafficControl() {

    if (!networkData || !networkData.towers) {
        return;
    }

    const towers =
        networkData.towers;

    if (!towers.length) {
        return;
    }

    populateSourceSelector(towers);
    populateTargetSelector(towers);

    updateTopStatistics(towers);

    updateSelectedSource();
    updateSelectedTarget();
}


/* =========================================================
   SOURCE SELECTOR
========================================================= */

function populateSourceSelector(towers) {

    const select =
        document.getElementById(
            "source-tower"
        );

    if (!select) return;


    const currentValue =
        select.value;


    select.innerHTML = `
        <option value="">
            Select congested tower
        </option>
    `;


    towers
        .filter(tower =>
            Number(tower.bandwidth || 0) >= 50
        )
        .forEach(tower => {

            const option =
                document.createElement("option");

            option.value =
                tower.id;

            option.textContent =
                `${tower.id} — Tower (${Math.round(
                    Number(tower.bandwidth || 0)
                )}%)`;

            select.appendChild(option);
        });


    if (currentValue) {
        select.value = currentValue;
    }


    select.onchange =
        updateSelectedSource;
}


/* =========================================================
   TARGET SELECTOR
========================================================= */

function populateTargetSelector(towers) {

    const select =
        document.getElementById(
            "target-tower"
        );

    if (!select) return;


    const currentValue =
        select.value;


    select.innerHTML = `
        <option value="">
            Select target tower
        </option>
    `;


    towers
        .filter(tower =>
            Number(tower.bandwidth || 0) < 75
        )
        .forEach(tower => {

            const option =
                document.createElement("option");

            option.value =
                tower.id;

            option.textContent =
                `${tower.id} — Tower (${Math.round(
                    Number(tower.bandwidth || 0)
                )}%)`;

            select.appendChild(option);
        });


    if (currentValue) {
        select.value = currentValue;
    }


    select.onchange =
        updateSelectedTarget;
}


/* =========================================================
   FIND TOWER
========================================================= */

function getTower(id) {

    if (!networkData ||
        !networkData.towers) {

        return null;
    }

    return networkData.towers.find(
        tower => tower.id === id
    );
}


/* =========================================================
   SOURCE UPDATE
========================================================= */

function updateSelectedSource() {

    const select =
        document.getElementById(
            "source-tower"
        );

    if (!select) return;


    selectedSource =
        getTower(select.value);


    renderSourceDetails();

    updateTransferVisualization();

    updateTransferButton();
}


/* =========================================================
   TARGET UPDATE
========================================================= */

function updateSelectedTarget() {

    const select =
        document.getElementById(
            "target-tower"
        );

    if (!select) return;


    selectedTarget =
        getTower(select.value);


    renderTargetDetails();

    updateTransferVisualization();

    updateTransferButton();
}


/* =========================================================
   SOURCE DETAILS
========================================================= */

function renderSourceDetails() {

    if (!selectedSource) {

        setText(
            "source-status",
            "Select a tower to view its status."
        );

        setText(
            "source-users",
            "--"
        );

        setText(
            "source-load",
            "--"
        );

        setText(
            "source-latency",
            "--"
        );

        return;
    }


    const load =
        Number(
            selectedSource.bandwidth || 0
        );


    setText(
        "source-status",
        `${selectedSource.id} is currently at ${Math.round(load)}% network load.`
    );


    setText(
        "source-users",
        `${selectedSource.users || 0} users`
    );


    setText(
        "source-load",
        `${Math.round(load)}%`
    );


    setText(
        "source-latency",
        `${Math.round(
            Number(selectedSource.latency || 0)
        )} ms`
    );
}


/* =========================================================
   TARGET DETAILS
========================================================= */

function renderTargetDetails() {

    if (!selectedTarget) {

        setText(
            "target-status",
            "Select a tower to view its capacity."
        );

        setText(
            "target-capacity",
            "--"
        );

        setText(
            "target-users",
            "--"
        );

        return;
    }


    const load =
        Number(
            selectedTarget.bandwidth || 0
        );


    const capacity =
        Math.max(
            0,
            100 - load
        );


    setText(
        "target-status",
        `${selectedTarget.id} has ${Math.round(
            capacity
        )}% available capacity.`
    );


    setText(
        "target-capacity",
        `${Math.round(capacity)}%`
    );


    setText(
        "target-users",
        `${selectedTarget.users || 0} users`
    );
}


/* =========================================================
   TRANSFER VISUALIZATION
========================================================= */

function updateTransferVisualization() {

    const sourceName =
        document.getElementById(
            "transfer-source"
        );

    const targetName =
        document.getElementById(
            "transfer-target"
        );


    if (sourceName) {

        sourceName.textContent =
            selectedSource
                ? selectedSource.id
                : "SOURCE";
    }


    if (targetName) {

        targetName.textContent =
            selectedTarget
                ? selectedTarget.id
                : "TARGET";
    }
}


/* =========================================================
   TRANSFER BUTTON
========================================================= */

function updateTransferButton() {

    const button =
        document.getElementById(
            "redistribute-btn"
        );

    if (!button) return;


    button.disabled =
        !selectedSource ||
        !selectedTarget;


    if (
        selectedSource &&
        selectedTarget
    ) {

        button.textContent =
            "REDISTRIBUTE TRAFFIC";

    } else {

        button.textContent =
            "SELECT SOURCE AND TARGET";
    }
}


/* =========================================================
   REDISTRIBUTE TRAFFIC
========================================================= */

async function redistributeTraffic() {

    if (!selectedSource ||
        !selectedTarget) {

        addEvent(
            "Select source and target towers first",
            "Traffic redistribution was not started."
        );

        return;
    }


    const amountInput =
        document.getElementById(
            "transfer-amount"
        );


    let amount =
        Number(
            amountInput
                ? amountInput.value
                : 10
        );


    if (!Number.isFinite(amount) ||
        amount <= 0) {

        amount = 10;
    }


    amount =
        Math.round(amount);


    const sourceUsers =
        Number(
            selectedSource.users || 0
        );


    const targetLoad =
        Number(
            selectedTarget.bandwidth || 0
        );


    const availableCapacity =
        Math.max(
            0,
            100 - targetLoad
        );


    if (amount > sourceUsers) {

        addEvent(
            "Transfer rejected",
            `Cannot transfer ${amount} users. ${selectedSource.id} only has ${sourceUsers} users.`
        );

        return;
    }


    if (availableCapacity <= 0) {

        addEvent(
            "Transfer rejected",
            `${selectedTarget.id} has no available capacity.`
        );

        return;
    }


    const button =
        document.getElementById(
            "redistribute-btn"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "REDISTRIBUTING...";
    }


    try {

        const response =
            await fetch(
                "http://127.0.0.1:5000/api/redistribute",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        tower_id:
                            selectedSource.id,

                        target_tower_id:
                            selectedTarget.id,

                        amount:
                            amount
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Redistribution failed"
            );
        }


        const result =
            await response.json();


        addEvent(
            "Traffic redistribution completed",
            `${amount} users moved from ${selectedSource.id} to ${selectedTarget.id}.`
        );


        /* Refresh network information */

        await loadNetworkData();


    } catch (error) {

        console.error(
            "Redistribution error:",
            error
        );


        addEvent(
            "Traffic redistribution failed",
            "The control server could not complete the request."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "REDISTRIBUTE TRAFFIC";
        }
    }
}


/* =========================================================
   TOP STATISTICS
========================================================= */

function updateTopStatistics(towers) {

    const totalUsers =
        towers.reduce(
            (sum, tower) =>
                sum +
                Number(tower.users || 0),
            0
        );


    const averageLoad =
        towers.reduce(
            (sum, tower) =>
                sum +
                Number(tower.bandwidth || 0),
            0
        ) / towers.length;


    const congested =
        towers.filter(
            tower =>
                Number(
                    tower.bandwidth || 0
                ) >= 75
        ).length;


    setText(
        "total-users",
        totalUsers
    );

    setText(
        "network-load",
        `${Math.round(averageLoad)}%`
    );

    setText(
        "congested-towers",
        congested
    );

    setText(
        "active-towers",
        towers.length
    );
}


/* =========================================================
   EVENTS
========================================================= */

function addEvent(
    title,
    description
) {

    const list =
        document.getElementById(
            "events-list"
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
   TEXT HELPER
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


/* =========================================================
   OFFLINE STATE
========================================================= */

function showOfflineState() {

    setText(
        "network-load",
        "OFFLINE"
    );

    setText(
        "total-users",
        "--"
    );

    setText(
        "congested-towers",
        "--"
    );

    setText(
        "active-towers",
        "--"
    );
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

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
   BUTTON CONNECTION
========================================================= */

const redistributeButton =
    document.getElementById(
        "redistribute-btn"
    );


if (redistributeButton) {

    redistributeButton.addEventListener(
        "click",
        redistributeTraffic
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

loadNetworkData();


/* Refresh every 4 seconds */

setInterval(
    loadNetworkData,
    4000
);