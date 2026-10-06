import pandas as pd
import joblib
import random
import time


# Load trained AI model
model = joblib.load("tower_congestion_model.pkl")


def predict_congestion(users, bandwidth, latency, traffic):

    input_data = pd.DataFrame(
        [[users, bandwidth, latency, traffic]],
        columns=[
            "users",
            "bandwidth_usage",
            "latency",
            "traffic"
        ]
    )

    prediction = model.predict(input_data)[0]

    if prediction == 0:
        return "LOW"

    elif prediction == 1:
        return "MEDIUM"

    else:
        return "HIGH"


def create_tower(tower_id):

    users = random.randint(50, 500)
    bandwidth = random.randint(10, 100)
    latency = random.randint(5, 150)
    traffic = random.randint(10, 100)

    congestion = predict_congestion(
        users,
        bandwidth,
        latency,
        traffic
    )

    return {
        "id": tower_id,
        "users": users,
        "bandwidth": bandwidth,
        "latency": latency,
        "traffic": traffic,
        "congestion": congestion
    }


def display_network(towers):

    print("\n" + "=" * 75)
    print("             AI TOWER NETWORK CONTROLLER")
    print("=" * 75)

    for tower in towers:

        print(
            f"Tower {tower['id']} | "
            f"Users: {tower['users']:3} | "
            f"Bandwidth: {tower['bandwidth']:3}% | "
            f"Latency: {tower['latency']:3} ms | "
            f"Traffic: {tower['traffic']:3}% | "
            f"AI: {tower['congestion']}"
        )

    print("=" * 75)


def find_congested_towers(towers):

    return [
        tower for tower in towers
        if tower["congestion"] == "HIGH"
    ]


def find_available_towers(towers):

    return [
        tower for tower in towers
        if tower["congestion"] == "LOW"
    ]


print("\nStarting AI Tower Network...\n")


while True:

    # Create 6 towers
    towers = []

    for tower_id in range(1, 7):
        towers.append(create_tower(tower_id))

    # Display network
    display_network(towers)

    # Find congested and available towers
    congested = find_congested_towers(towers)
    available = find_available_towers(towers)

    print("\nAI DECISION:")

    if congested and available:

        for source in congested:

            target = min(
                available,
                key=lambda tower: tower["users"]
            )

            print(
                f"🔴 Tower {source['id']} is HIGH congestion."
            )

            print(
                f"🔄 AI recommends shifting traffic "
                f"from Tower {source['id']} → Tower {target['id']}"
            )

    elif congested:

        print("⚠️ Congestion detected, but no low-load tower is available.")

    else:

        print("🟢 Network operating normally.")

    time.sleep(5)