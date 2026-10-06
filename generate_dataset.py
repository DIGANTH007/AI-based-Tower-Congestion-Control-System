import random
import csv

# Number of training samples
NUM_SAMPLES = 1000

with open("tower_training_data.csv", "w", newline="") as file:

    writer = csv.writer(file)

    # CSV column names
    writer.writerow([
        "users",
        "bandwidth_usage",
        "latency",
        "traffic",
        "congestion"
    ])

    for _ in range(NUM_SAMPLES):

        # Generate realistic network conditions
        users = random.randint(20, 500)
        bandwidth_usage = random.randint(10, 100)
        latency = random.randint(5, 150)
        traffic = random.randint(10, 100)

        # Calculate congestion condition
        score = (
            users / 500 * 30 +
            bandwidth_usage / 100 * 30 +
            latency / 150 * 15 +
            traffic / 100 * 25
        )

        if score >= 70:
            congestion = 2       # High
        elif score >= 45:
            congestion = 1       # Medium
        else:
            congestion = 0       # Low

        writer.writerow([
            users,
            bandwidth_usage,
            latency,
            traffic,
            congestion
        ])

print("Training dataset created successfully!")
print("File: tower_training_data.csv")
print("Samples:", NUM_SAMPLES)