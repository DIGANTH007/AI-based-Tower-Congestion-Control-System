from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS

import pandas as pd
import joblib
import random
import math
import os


# ============================================================
# FLASK CONFIGURATION
# ============================================================

app = Flask(
    __name__,
    static_folder="dashboard",
    static_url_path=""
)

CORS(app)


# ============================================================
# AI MODEL
# ============================================================

MODEL_FILE = "tower_congestion_model.pkl"

model = None

try:
    model = joblib.load(MODEL_FILE)
    print("AI congestion model loaded successfully.")

except Exception as error:
    print("WARNING: Could not load AI model.")
    print(error)


# ============================================================
# AI CONGESTION PREDICTION
# ============================================================

def predict_congestion(
    users,
    bandwidth,
    latency,
    traffic
):

    # --------------------------------------------------------
    # Use trained ML model when available
    # --------------------------------------------------------

    if model is not None:

        data = pd.DataFrame(
            [[
                users,
                bandwidth,
                latency,
                traffic
            ]],
            columns=[
                "users",
                "bandwidth_usage",
                "latency",
                "traffic"
            ]
        )

        prediction = model.predict(data)[0]

        if prediction == 0:
            return "LOW"

        elif prediction == 1:
            return "MEDIUM"

        else:
            return "HIGH"


    # --------------------------------------------------------
    # Safe fallback if model is unavailable
    # --------------------------------------------------------

    if bandwidth >= 80 or traffic >= 80:
        return "HIGH"

    if bandwidth >= 50 or traffic >= 50:
        return "MEDIUM"

    return "LOW"


# ============================================================
# TOWER LOCATIONS
# ============================================================

TOWER_LOCATIONS = {

    1: {
        "lat": 12.9716,
        "lng": 77.5946
    },

    2: {
        "lat": 12.9784,
        "lng": 77.6408
    },

    3: {
        "lat": 12.9352,
        "lng": 77.6245
    },

    4: {
        "lat": 12.9987,
        "lng": 77.5921
    },

    5: {
        "lat": 12.9538,
        "lng": 77.4907
    },

    6: {
        "lat": 13.0358,
        "lng": 77.5970
    }

}


# ============================================================
# LIVE NETWORK STATE
# ============================================================

tower_state = None


# ============================================================
# CREATE TOWER
# ============================================================

def create_tower(tower_id):

    # --------------------------------------------------------
    # HIGH CONGESTION TOWERS
    # --------------------------------------------------------

    if tower_id in [1, 5]:

        users = random.randint(550, 750)
        bandwidth = random.randint(80, 95)
        latency = random.randint(90, 150)
        traffic = random.randint(80, 95)


    # --------------------------------------------------------
    # MEDIUM CONGESTION TOWERS
    # --------------------------------------------------------

    elif tower_id in [2, 4]:

        users = random.randint(300, 550)
        bandwidth = random.randint(50, 75)
        latency = random.randint(45, 100)
        traffic = random.randint(45, 75)


    # --------------------------------------------------------
    # LOW CONGESTION TOWERS
    # --------------------------------------------------------

    else:

        users = random.randint(50, 250)
        bandwidth = random.randint(10, 45)
        latency = random.randint(5, 50)
        traffic = random.randint(10, 45)


    congestion = predict_congestion(
        users,
        bandwidth,
        latency,
        traffic
    )


    location = TOWER_LOCATIONS[tower_id]


    return {

        "id": f"T{tower_id:02d}",

        "lat": location["lat"],

        "lng": location["lng"],

        "users": users,

        "bandwidth": bandwidth,

        "latency": latency,

        "traffic": traffic,

        "congestion": congestion

    }


# ============================================================
# INITIALIZE NETWORK
# ============================================================

def initialize_network():

    global tower_state

    tower_state = {

        tower_id: create_tower(tower_id)

        for tower_id in range(1, 7)

    }

    print("Tower network initialized.")


# ============================================================
# REFRESH AI PREDICTION
# ============================================================

def refresh_tower_prediction(tower):

    tower["congestion"] = predict_congestion(

        tower["users"],

        tower["bandwidth"],

        tower["latency"],

        tower["traffic"]

    )


# ============================================================
# SIMULATE LIVE NETWORK CHANGES
# ============================================================

def fluctuate_network():

    global tower_state

    if tower_state is None:

        initialize_network()

        return


    for tower in tower_state.values():

        # Users
        tower["users"] = max(
            20,
            tower["users"] + random.randint(-8, 8)
        )


        # Bandwidth
        tower["bandwidth"] = max(
            5,
            min(
                100,
                tower["bandwidth"] +
                random.randint(-2, 2)
            )
        )


        # Latency
        tower["latency"] = max(
            5,
            min(
                180,
                tower["latency"] +
                random.randint(-3, 3)
            )
        )


        # Traffic
        tower["traffic"] = max(
            5,
            min(
                100,
                tower["traffic"] +
                random.randint(-2, 2)
            )
        )


        refresh_tower_prediction(tower)


# ============================================================
# DISTANCE CALCULATION
# ============================================================

def calculate_distance_km(
    tower_a,
    tower_b
):

    lat1 = tower_a["lat"]
    lon1 = tower_a["lng"]

    lat2 = tower_b["lat"]
    lon2 = tower_b["lng"]


    lat_km = (
        lat2 - lat1
    ) * 111


    average_lat = math.radians(
        (lat1 + lat2) / 2
    )


    lon_km = (
        (lon2 - lon1)
        * 111
        * math.cos(average_lat)
    )


    return math.sqrt(
        lat_km ** 2 +
        lon_km ** 2
    )


# ============================================================
# FIND BEST REDISTRIBUTION TARGET
# ============================================================

def find_best_target(source):

    candidates = []

    source_load = float(
        source["bandwidth"]
    )


    for target in tower_state.values():

        # Don't select itself
        if target["id"] == source["id"]:
            continue


        target_load = float(
            target["bandwidth"]
        )


        # Don't overload another tower
        if target_load >= 75:
            continue


        distance = calculate_distance_km(
            source,
            target
        )


        # Only nearby towers
        if distance > 15:
            continue


        load_difference = (
            source_load -
            target_load
        )


        if load_difference <= 5:
            continue


        # Transfer half the difference
        transfer = load_difference / 2


        # Keep transfer realistic
        transfer = min(
            transfer,
            20
        )


        transfer = max(
            transfer,
            5
        )


        # Keep target below 85%
        available_capacity = (
            85 -
            target_load
        )


        transfer = min(
            transfer,
            available_capacity
        )


        if transfer <= 0:
            continue


        predicted_source = (
            source_load -
            transfer
        )


        predicted_target = (
            target_load +
            transfer
        )


        balance_difference = abs(
            predicted_source -
            predicted_target
        )


        score = (

            balance_difference * 4

            +

            distance * 1.5

            +

            target_load * 0.15

        )


        candidates.append({

            "tower": target,

            "distance": distance,

            "transfer": round(
                transfer,
                1
            ),

            "predicted_source": round(
                predicted_source,
                1
            ),

            "predicted_target": round(
                predicted_target,
                1
            ),

            "balance_difference": round(
                balance_difference,
                1
            ),

            "score": score

        })


    if not candidates:
        return None


    candidates.sort(
        key=lambda item:
        item["score"]
    )


    return candidates[0]


# ============================================================
# MAIN DASHBOARD
# ============================================================

@app.route("/")
def dashboard():

    return send_from_directory(
        "dashboard",
        "index.html"
    )


# ============================================================
# STATIC FILES
# ============================================================

@app.route("/<path:path>")
def static_files(path):

    file_path = os.path.join(
        "dashboard",
        path
    )


    if os.path.isfile(file_path):

        return send_from_directory(
            "dashboard",
            path
        )


    return jsonify({
        "error": "File not found"
    }), 404


# ============================================================
# NETWORK API
# ============================================================

@app.route("/api/network")
def network_data():

    global tower_state


    if tower_state is None:

        initialize_network()

    else:

        fluctuate_network()


    towers = list(
        tower_state.values()
    )


    high_count = sum(

        1

        for tower in towers

        if tower["congestion"] == "HIGH"

    )


    medium_count = sum(

        1

        for tower in towers

        if tower["congestion"] == "MEDIUM"

    )


    low_count = sum(

        1

        for tower in towers

        if tower["congestion"] == "LOW"

    )


    total_users = sum(

        tower["users"]

        for tower in towers

    )


    average_load = (

        sum(

            tower["bandwidth"]

            for tower in towers

        )

        /

        len(towers)

    )


    return jsonify({

        "towers": towers,

        "summary": {

            "total_towers":
                len(towers),

            "total_users":
                total_users,

            "average_load":
                round(
                    average_load,
                    1
                ),

            "high":
                high_count,

            "medium":
                medium_count,

            "low":
                low_count

        }

    })


# ============================================================
# AI TRAFFIC REDISTRIBUTION
# ============================================================

@app.route(
    "/api/redistribute",
    methods=["POST"]
)
def redistribute_traffic():

    global tower_state


    try:

        if tower_state is None:

            initialize_network()


        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({

                "success": False,

                "message":
                    "No request data received."

            }), 400


        selected_id = data.get(
            "tower_id"
        )


        if not selected_id:

            return jsonify({

                "success": False,

                "message":
                    "No tower selected."

            }), 400


        # Find selected tower
        source = next(

            (
                tower

                for tower
                in tower_state.values()

                if tower["id"] ==
                selected_id

            ),

            None

        )


        if source is None:

            return jsonify({

                "success": False,

                "message":
                    "Selected tower not found."

            }), 404


        source_load = float(
            source["bandwidth"]
        )


        if source_load < 60:

            return jsonify({

                "success": False,

                "message":
                    f"{selected_id} does not require redistribution."

            }), 400


        # Find best target
        best = find_best_target(
            source
        )


        if best is None:

            return jsonify({

                "success": False,

                "message":
                    "No nearby tower has enough capacity for safe redistribution."

            }), 400


        target = best["tower"]

        transfer = best["transfer"]


        old_source_load = float(
            source["bandwidth"]
        )

        old_target_load = float(
            target["bandwidth"]
        )


        old_source_users = int(
            source["users"]
        )

        old_target_users = int(
            target["users"]
        )


        # ----------------------------------------------------
        # SOURCE
        # ----------------------------------------------------

        source["bandwidth"] = round(

            max(
                0,
                source["bandwidth"] -
                transfer
            ),

            1

        )


        source["traffic"] = round(

            max(
                0,
                source["traffic"] -
                transfer
            ),

            1

        )


        users_moved = max(

            1,

            int(

                old_source_users *

                (
                    transfer /
                    max(
                        old_source_load,
                        1
                    )
                )

            )

        )


        users_moved = min(

            users_moved,

            old_source_users

        )


        source["users"] = max(

            20,

            old_source_users -
            users_moved

        )


        source["latency"] = round(

            max(
                5,
                source["latency"] -
                transfer * 1.5
            ),

            1

        )


        # ----------------------------------------------------
        # TARGET
        # ----------------------------------------------------

        target["bandwidth"] = round(

            min(
                100,
                target["bandwidth"] +
                transfer
            ),

            1

        )


        target["traffic"] = round(

            min(
                100,
                target["traffic"] +
                transfer
            ),

            1

        )


        target["users"] = (

            old_target_users +
            users_moved

        )


        target["latency"] = round(

            min(
                180,
                target["latency"] +
                transfer * 0.5
            ),

            1

        )


        # Run AI again
        refresh_tower_prediction(
            source
        )

        refresh_tower_prediction(
            target
        )


        return jsonify({

            "success": True,

            "message":
                "AI traffic optimization completed successfully.",

            "source_tower": {

                "id":
                    source["id"],

                "old_load":
                    round(
                        old_source_load,
                        1
                    ),

                "new_load":
                    round(
                        source["bandwidth"],
                        1
                    ),

                "congestion":
                    source["congestion"]

            },

            "target_tower": {

                "id":
                    target["id"],

                "old_load":
                    round(
                        old_target_load,
                        1
                    ),

                "new_load":
                    round(
                        target["bandwidth"],
                        1
                    ),

                "congestion":
                    target["congestion"],

                "distance":
                    round(
                        best["distance"],
                        2
                    )

            },

            "optimization": {

                "traffic_moved":
                    transfer,

                "users_moved":
                    users_moved,

                "predicted_source_load":
                    best["predicted_source"],

                "predicted_target_load":
                    best["predicted_target"],

                "balance_difference":
                    best["balance_difference"],

                "reason":
                    "AI selected the best nearby tower using distance, available capacity and predicted load balancing."

            }

        })


    except Exception as error:

        print()
        print("REDISTRIBUTION ERROR:")
        print(repr(error))
        print()


        return jsonify({

            "success": False,

            "message":
                f"Backend error: {str(error)}"

        }), 500


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print()
    print("==============================================")
    print("        AI TOWER CONTROL SYSTEM")
    print("==============================================")
    print()
    print("Dashboard:")
    print("http://127.0.0.1:5000")
    print()
    print("Network API:")
    print("http://127.0.0.1:5000/api/network")
    print()
    print("Redistribution API:")
    print("http://127.0.0.1:5000/api/redistribute")
    print()
    print("==============================================")
    print()


    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )