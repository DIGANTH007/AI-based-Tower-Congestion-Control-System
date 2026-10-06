import random
import time

# Number of towers in our network
NUM_TOWERS = 6


def generate_tower_data():
    towers = []

    for tower_id in range(1, NUM_TOWERS + 1):

        # Simulated network values
        users = random.randint(50, 500)
        bandwidth = random.randint(20, 100)
        latency = random.randint(10, 100)

        # Calculate congestion
        load = random.randint(10, 100)

        if load >= 80:
            status = "CRITICAL"
        elif load >= 60:
            status = "WARNING"
        else:
            status = "NORMAL"

        tower = {
            "tower_id": tower_id,
            "users": users,
            "bandwidth": bandwidth,
            "latency": latency,
            "load": load,
            "status": status
        }

        towers.append(tower)

    return towers


def display_towers(towers):

    print("\n" + "=" * 70)
    print("       AI TOWER CONGESTION CONTROL SYSTEM")
    print("=" * 70)

    for tower in towers:
        print(
            f"Tower {tower['tower_id']} | "
            f"Users: {tower['users']:3} | "
            f"Bandwidth: {tower['bandwidth']:3}% | "
            f"Latency: {tower['latency']:3} ms | "
            f"Load: {tower['load']:3}% | "
            f"{tower['status']}"
        )

    print("=" * 70)


# Run the simulator
while True:

    tower_data = generate_tower_data()

    display_towers(tower_data)

    time.sleep(3)