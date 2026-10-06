import pandas as pd
import joblib
import random
import time


# Load the trained AI model
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


def generate_tower():

    users = random.randint(20, 500)
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
        "users": users,
        "bandwidth": bandwidth,
        "latency": latency,
        "traffic": traffic,
        "congestion": congestion
    }


print("\n" + "=" * 60)
print("        AI TOWER CONGESTION CONTROLLER")
print("=" * 60)


while True:

    tower = generate_tower()

    print(
        f"Users: {tower['users']:3} | "
        f"Bandwidth: {tower['bandwidth']:3}% | "
        f"Latency: {tower['latency']:3} ms | "
        f"Traffic: {tower['traffic']:3}% | "
        f"AI Prediction: {tower['congestion']}"
    )

    time.sleep(3)