import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report
import joblib
import json
import os

# Mapping 0..4 → 0.0..1.0
SCALE_MAP = {0: 0.0, 1: 0.25, 2: 0.5, 3: 0.75, 4: 1.0}

print("=== NextGRC ML Model Training ===")
np.random.seed(42)
weights = np.array([0.10, 0.20, 0.30, 0.20, 0.20])

# Profiles: [p(NO=0), p(PARTIAL=0.5), p(YES=1)] per dimension per level
level_profiles = {
    1: [[0.85,0.10,0.05],[0.90,0.08,0.02],[0.93,0.05,0.02],[0.95,0.04,0.01],[0.96,0.03,0.01]],
    2: [[0.10,0.30,0.60],[0.50,0.35,0.15],[0.70,0.25,0.05],[0.80,0.15,0.05],[0.85,0.12,0.03]],
    3: [[0.02,0.08,0.90],[0.05,0.20,0.75],[0.15,0.45,0.40],[0.55,0.35,0.10],[0.65,0.28,0.07]],
    4: [[0.01,0.04,0.95],[0.02,0.08,0.90],[0.05,0.15,0.80],[0.08,0.22,0.70],[0.40,0.40,0.20]],
    5: [[0.01,0.02,0.97],[0.01,0.04,0.95],[0.02,0.08,0.90],[0.03,0.12,0.85],[0.05,0.15,0.80]],
}

rows = []
for level, profile in level_profiles.items():
    for _ in range(400):
        # Raw answers in 0/0.5/1 internally for training
        answers = [np.random.choice([0.0, 0.5, 1.0], p=probs) for probs in profile]
        score = float(np.dot(answers, weights) * 100)
        rows.append({
            'q1': answers[0], 'q2': answers[1], 'q3': answers[2],
            'q4': answers[3], 'q5': answers[4],
            'weighted_score': round(score, 2),
            'maturity_level': level
        })

df = pd.DataFrame(rows)

def build_features(df):
    X = df[['q1','q2','q3','q4','q5','weighted_score']].copy()
    X['gate_violated']   = (df['q1'] == 0.0).astype(int)
    X['partial_count']   = (df[['q1','q2','q3','q4','q5']] == 0.5).sum(axis=1)
    X['yes_count']       = (df[['q1','q2','q3','q4','q5']] == 1.0).sum(axis=1)
    X['enforcement_gap'] = ((df['q1'] >= 0.5) & (df['q2'] >= 0.5) & (df['q3'] == 0.0)).astype(int)
    return X

X = build_features(df)
y = df['maturity_level']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

model = RandomForestClassifier(
    n_estimators=200, max_depth=10, min_samples_split=5,
    min_samples_leaf=2, class_weight='balanced', random_state=42, n_jobs=-1
)
model.fit(X_train, y_train)

cv = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
print(f"CV: {cv.mean():.3f} ± {cv.std():.3f} | Test: {model.score(X_test, y_test):.3f}")
print(classification_report(y_test, model.predict(X_test), target_names=['L1','L2','L3','L4','L5']))

os.makedirs('models', exist_ok=True)
joblib.dump(model, 'models/maturity_classifier.pkl')
json.dump({'feature_names': X.columns.tolist(), 'classes': model.classes_.tolist(), 'version': '1.1.0'},
          open('models/model_metadata.json','w'), indent=2)