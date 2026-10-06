import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib


# Load training data
data = pd.read_csv("tower_training_data.csv")

# Input features
X = data[
    [
        "users",
        "bandwidth_usage",
        "latency",
        "traffic"
    ]
]

# Target
y = data["congestion"]


# Split data into training and testing
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# Create AI model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)


# Train the model
model.fit(X_train, y_train)


# Test the model
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\n========================================")
print("       AI CONGESTION MODEL")
print("========================================")

print(f"Model Accuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")
print(classification_report(y_test, predictions))


# Save trained model
joblib.dump(model, "tower_congestion_model.pkl")

print("========================================")
print("AI model trained successfully!")
print("Model saved as: tower_congestion_model.pkl")
print("========================================")