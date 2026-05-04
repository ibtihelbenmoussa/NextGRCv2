# app/ml/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'maturity_classifier.pkl')

# ─── Training Data ────────────────────────────────────────────────────────────

def generate_training_data(n=5000):
    """
    Generate synthetic training data.
    Answers are floats in {0.0, 0.25, 0.5, 0.75, 1.0}
    matching the 5-level frontend scale (0..4 mapped to floats).
    """
    np.random.seed(42)

    # All possible answer values (0=Initial, 0.25=Basic, 0.5=Defined, 0.75=Managed, 1.0=Optimized)
    vals = [0.0, 0.25, 0.5, 0.75, 1.0]
    weights = [0.10, 0.20, 0.30, 0.20, 0.20]

    # Probability profiles per maturity level [p(0), p(0.25), p(0.5), p(0.75), p(1.0)]
    level_profiles = {
        1: [[0.70, 0.20, 0.07, 0.02, 0.01],   # mostly 0 (Initial)
            [0.75, 0.18, 0.05, 0.01, 0.01],
            [0.80, 0.12, 0.05, 0.02, 0.01],
            [0.82, 0.12, 0.04, 0.01, 0.01],
            [0.83, 0.11, 0.04, 0.01, 0.01]],

        2: [[0.05, 0.65, 0.20, 0.08, 0.02],   # mostly 0.25 (Basic)
            [0.35, 0.45, 0.15, 0.04, 0.01],
            [0.55, 0.30, 0.10, 0.04, 0.01],
            [0.65, 0.25, 0.07, 0.02, 0.01],
            [0.70, 0.20, 0.07, 0.02, 0.01]],

        3: [[0.02, 0.08, 0.60, 0.25, 0.05],   # mostly 0.5 (Defined)
            [0.05, 0.15, 0.55, 0.20, 0.05],
            [0.10, 0.30, 0.40, 0.15, 0.05],
            [0.40, 0.35, 0.15, 0.08, 0.02],
            [0.50, 0.30, 0.12, 0.06, 0.02]],

        4: [[0.01, 0.03, 0.10, 0.70, 0.16],   # mostly 0.75 (Managed)
            [0.02, 0.05, 0.13, 0.65, 0.15],
            [0.03, 0.08, 0.17, 0.55, 0.17],
            [0.05, 0.15, 0.30, 0.35, 0.15],
            [0.25, 0.35, 0.25, 0.10, 0.05]],

        5: [[0.01, 0.02, 0.05, 0.12, 0.80],   # mostly 1.0 (Optimized)
            [0.01, 0.02, 0.07, 0.15, 0.75],
            [0.01, 0.03, 0.09, 0.17, 0.70],
            [0.02, 0.04, 0.09, 0.20, 0.65],
            [0.03, 0.06, 0.11, 0.25, 0.55]],
    }

    X, y = [], []
    per_level = n // 5

    for level, profile in level_profiles.items():
        for _ in range(per_level):
            q = [np.random.choice(vals, p=profile[i]) for i in range(5)]
            ws  = sum(qi * wi for qi, wi in zip(q, weights)) * 100
            gv  = int(q[0] == 0.0)
            pc  = sum(1 for v in q if v == 0.5)
            yc  = sum(1 for v in q if v == 1.0)
            eg  = int(q[0] >= 0.5 and q[1] >= 0.5 and q[2] == 0.0)

            X.append([q[0], q[1], q[2], q[3], q[4], ws, gv, pc, yc, eg])
            y.append(level)

    return np.array(X), np.array(y)


def train_and_save():
    from sklearn.ensemble import RandomForestClassifier

    print("⚙️  Model not found — training from scratch...")
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    X, y = generate_training_data(5000)

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)

    print(f"✅ Model trained and saved → {MODEL_PATH}")
    print(f"   Classes: {model.classes_}")
    return model


def load_model():
    if os.path.exists(MODEL_PATH):
        print(f"✅ Model loaded → {MODEL_PATH}")
        return joblib.load(MODEL_PATH)
    return train_and_save()


# Load at startup
model = load_model()


# ─── Feature Builder ──────────────────────────────────────────────────────────

def build_features(q):
    """
    q: list of 5 floats in [0.0, 0.25, 0.5, 0.75, 1.0]
    returns: numpy array shape (1, 10)
    """
    weights = [0.10, 0.20, 0.30, 0.20, 0.20]
    weighted_score  = sum(qi * wi for qi, wi in zip(q, weights)) * 100
    gate_violated   = int(q[0] == 0.0)
    partial_count   = sum(1 for v in q if v == 0.5)
    yes_count       = sum(1 for v in q if v == 1.0)
    enforcement_gap = int(q[0] >= 0.5 and q[1] >= 0.5 and q[2] == 0.0)

    return np.array([[
        q[0], q[1], q[2], q[3], q[4],
        weighted_score, gate_violated,
        partial_count, yes_count, enforcement_gap
    ]])


def normalize_answer(val):
    """
    Accept either:
      - float already in [0.0..1.0]
      - int 0..4 from old clients → map to float
      - string 'YES'/'PARTIAL'/'NO' → map to float
    Returns a float in [0.0, 1.0].
    """
    if isinstance(val, str):
        return {'YES': 1.0, 'PARTIAL': 0.5, 'NO': 0.0}.get(val.upper(), 0.0)

    val = float(val)

    # If value is an integer-like 0..4, map to float scale
    if val > 1.0:
        scale = {0: 0.0, 1: 0.25, 2: 0.5, 3: 0.75, 4: 1.0}
        return scale.get(int(val), 0.0)

    return val  # already 0.0..1.0


# ─── Gate Logic ───────────────────────────────────────────────────────────────

def apply_gate(q1_float, raw_level):
    """
    Q1 (Existence) gates the maximum achievable level:
      0.0       → cap at 1
      0.0..0.5  → cap at 2
      > 0.5     → no cap
    """
    if q1_float == 0.0:
        gate_cap = 1
    elif q1_float <= 0.5:
        gate_cap = 2
    else:
        gate_cap = None

    final_level = min(raw_level, gate_cap) if gate_cap else raw_level
    return final_level, gate_cap


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':  'ok',
        'model':   'maturity_classifier v2.0',
        'classes': model.classes_.tolist(),
        'path':    MODEL_PATH,
        'scale':   '0.0/0.25/0.5/0.75/1.0 (5-level)',
    })


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True) or {}

        # Parse q1..q5 — accept int 0..4, float 0.0..1.0, or YES/NO/PARTIAL
        q = []
        for i in range(1, 6):
            val = data.get(f'q{i}', 0.0)
            q.append(normalize_answer(val))

        features    = build_features(q)
        raw_level   = int(model.predict(features)[0])
        proba       = model.predict_proba(features)[0]

        # Confidence for the predicted level
        classes = model.classes_.tolist()
        confidence = round(float(proba[classes.index(raw_level)]) if raw_level in classes else max(proba), 3)

        weighted_score = round(
            sum(qi * wi for qi, wi in zip(q, [0.10, 0.20, 0.30, 0.20, 0.20])) * 100, 2
        )

        final_level, gate_cap = apply_gate(q[0], raw_level)

        return jsonify({
            'maturity_level': final_level,
            'raw_level':      raw_level,
            'gate_capped':    gate_cap is not None and raw_level > (gate_cap or 5),
            'gate_cap':       gate_cap,
            'confidence':     confidence,
            'weighted_score': weighted_score,
            'probabilities':  {
                f'L{int(cls)}': round(float(p), 3)
                for cls, p in zip(model.classes_, proba)
            },
            'source': 'ml_model',
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ─── Roadmap Builder ──────────────────────────────────────────────────────────

def build_roadmap(title, code, current_level, weak, partial, strong):
    specific_by_dim = {
        'Existence':     f'Formally establish that {title} controls exist and are recognized',
        'Formalization': f'Document, get management approval, and communicate {title} procedures',
        'Enforcement':   f'Implement technical controls to enforce {title} compliance',
        'Measurement':   f'Define KPIs and track {title} effectiveness metrics regularly',
        'Optimization':  f'Create feedback loops for continuous {title} improvement',
    }

    level_configs = [
        {
            'level': 1, 'icon': '🔴', 'label': 'Initial', 'subtitle': 'Not implemented',
            'base_actions': [
                f'Acknowledge that {title} controls are not yet in place',
                'Identify the responsible person or team for this requirement',
                'Conduct an initial awareness session with relevant staff',
                'Create a basic inventory of gaps to be addressed',
            ],
        },
        {
            'level': 2, 'icon': '🟠', 'label': 'Basic', 'subtitle': 'Ad-hoc / Informal',
            'base_actions': [
                f'Draft an initial policy or procedure for {title}',
                'Identify the scope and assets concerned by this requirement',
                'Implement basic manual controls and workarounds',
                'Communicate basic rules and expectations to relevant personnel',
            ],
        },
        {
            'level': 3, 'icon': '🟡', 'label': 'Defined', 'subtitle': 'Documented & Approved',
            'base_actions': [
                f'Formalize and obtain management approval for {title} policy',
                'Document procedures clearly and assign responsibilities',
                'Implement technical or administrative enforcement controls',
                'Train all relevant staff on the defined procedures',
            ],
        },
        {
            'level': 4, 'icon': '🟢', 'label': 'Managed', 'subtitle': 'Measured & Monitored',
            'base_actions': [
                f'Define KPIs and metrics to measure {title} effectiveness',
                'Implement regular compliance checks and reviews',
                'Set up dashboards or reports to track performance over time',
                'Review and update procedures based on collected metrics',
            ],
        },
        {
            'level': 5, 'icon': '🔵', 'label': 'Optimized', 'subtitle': 'Continuously Improved',
            'base_actions': [
                f'Establish a continuous improvement cycle for {title}',
                'Integrate lessons learned from incidents, audits, and reviews',
                'Benchmark against industry best practices and standards',
                'Automate controls and monitoring where technically feasible',
            ],
        },
    ]

    roadmap = []
    for cfg in level_configs:
        lv = cfg['level']
        if lv < current_level:
            status = 'completed'
        elif lv == current_level:
            status = 'current'
        else:
            status = 'todo'

        extra_actions = []
        if lv == current_level + 1:
            for dim in weak:
                if dim in specific_by_dim:
                    extra_actions.append(f'[{dim}] {specific_by_dim[dim]}')
            for dim in partial:
                if dim in specific_by_dim:
                    extra_actions.append(f'[{dim}] Complete and formalize existing {dim.lower()} practices')

        roadmap.append({
            'level':      lv,
            'icon':       cfg['icon'],
            'label':      cfg['label'],
            'subtitle':   cfg['subtitle'],
            'status':     status,
            'actions':    cfg['base_actions'] + extra_actions,
            'is_next':    lv == current_level + 1,
            'is_current': lv == current_level,
        })

    return roadmap


# ─── Integer answer converter ─────────────────────────────────────────────────

def answer_to_label(val):
    """
    Convert answer to label.
    Supports:
      - int/float 0..4  → new scale
      - string YES/PARTIAL/NO → legacy (backward compat)
    """
    if isinstance(val, str):
        v = val.upper()
        # legacy YES/NO/PARTIAL → map to int label
        legacy = {'NO': 'NO', 'PARTIAL': 'PARTIAL', 'YES': 'YES'}
        return legacy.get(v, 'NO')

    v = int(float(val))
    return {
        0: 'NO',       # Initial   — rien n'existe
        1: 'BASIC',    # Basic     — ad-hoc
        2: 'PARTIAL',  # Defined   — documenté mais pas complet
        3: 'MANAGED',  # Managed   — mesuré
        4: 'YES',      # Optimized — pleinement implémenté
    }.get(v, 'NO')


@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data    = request.get_json(force=True) or {}
        code    = data.get('requirement_code', '')
        title   = data.get('requirement_title', '')
        level   = int(data.get('maturity_level', 1))
        score   = float(data.get('score', 0))
        gap     = int(data.get('gap', 5 - level))
        answers = data.get('answers', {})

        level_labels = ['', 'Initial', 'Basic', 'Defined', 'Managed', 'Optimized']
        label        = level_labels[level] if 1 <= level <= 5 else 'Unknown'

        # ✅ FIX: convert 0..4 integers to labels (supports legacy YES/NO/PARTIAL too)
        answers_labeled = {k: answer_to_label(v) for k, v in answers.items()}

        # ✅ FIX: weak = NO + BASIC, partial = PARTIAL, strong = MANAGED + YES
        weak    = [k for k, v in answers_labeled.items() if v in ('NO', 'BASIC')]
        partial = [k for k, v in answers_labeled.items() if v == 'PARTIAL']
        strong  = [k for k, v in answers_labeled.items() if v in ('MANAGED', 'YES')]

        if level == 5:
            summary = (
                f'The requirement {code} – {title} has achieved the highest maturity level '
                f'(Level 5: Optimized) with a score of {score:.0f}%. '
                f'All dimensions are fully implemented and continuously improved.'
            )
        else:
            summary = (
                f'The requirement {code} – {title} is currently at maturity Level {level} ({label}) '
                f'with a score of {score:.0f}%, requiring {gap} level(s) of improvement '
                f'to reach full optimization.'
            )

        # ✅ FIX: current_issues plus précis selon les 5 niveaux
        current_issues = []
        if weak:
            no_dims    = [k for k in weak if answers_labeled[k] == 'NO']
            basic_dims = [k for k in weak if answers_labeled[k] == 'BASIC']
            if no_dims:
                current_issues.append(
                    f'Critical gaps in: {", ".join(no_dims)} — not implemented, immediate action required'
                )
            if basic_dims:
                current_issues.append(
                    f'Initial stage in: {", ".join(basic_dims)} — ad-hoc practices only, formalization needed'
                )
        if partial:
            current_issues.append(
                f'Partial implementation in: {", ".join(partial)} — requires formalization and enforcement'
            )
        if strong:
            managed_dims  = [k for k in strong if answers_labeled[k] == 'MANAGED']
            yes_dims      = [k for k in strong if answers_labeled[k] == 'YES']
            if yes_dims:
                current_issues.append(
                    f'Confirmed strengths in: {", ".join(yes_dims)} — fully optimized, maintain and leverage'
                )
            if managed_dims:
                current_issues.append(
                    f'Well managed in: {", ".join(managed_dims)} — focus on continuous improvement'
                )

        roadmap = build_roadmap(title, code, level, weak, partial, strong)

        return jsonify({
            'summary':        summary,
            'current_issues': current_issues,
            'roadmap':        roadmap,
            'current_level':  level,
            'label':          label,
            'source':         'ml_local',
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ─── Retrain ──────────────────────────────────────────────────────────────────

@app.route('/retrain', methods=['POST'])
def retrain():
    global model
    try:
        from sklearn.ensemble import RandomForestClassifier

        data        = request.get_json(force=True) or {}
        new_samples = data.get('samples', [])

        X_base, y_base = generate_training_data(2000)

        if len(new_samples) >= 10:
            X_new = []
            for s in new_samples:
                q = [normalize_answer(s.get(f'q{i}', 0)) for i in range(1, 6)]
                ws  = sum(qi * wi for qi, wi in zip(q, [0.10, 0.20, 0.30, 0.20, 0.20])) * 100
                gv  = int(q[0] == 0.0)
                pc  = sum(1 for v in q if v == 0.5)
                yc  = sum(1 for v in q if v == 1.0)
                eg  = int(q[0] >= 0.5 and q[1] >= 0.5 and q[2] == 0.0)
                X_new.append([q[0], q[1], q[2], q[3], q[4], ws, gv, pc, yc, eg])

            y_new = np.array([s['level'] for s in new_samples])
            X_all = np.vstack([X_base, np.array(X_new)])
            y_all = np.concatenate([y_base, y_new])
        else:
            X_all, y_all = X_base, y_base

        model = RandomForestClassifier(
            n_estimators=300, max_depth=12,
            min_samples_split=4, min_samples_leaf=2,
            class_weight='balanced', random_state=42, n_jobs=-1,
        )
        model.fit(X_all, y_all)
        joblib.dump(model, MODEL_PATH)

        return jsonify({
            'status':        'retrained',
            'total_samples': len(X_all),
            'new_samples':   len(new_samples),
            'model_classes': model.classes_.tolist(),
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("=" * 50)
    print("  NextGRC ML API — http://localhost:5000")
    print("  Scale: 0=Initial, 1=Basic, 2=Defined, 3=Managed, 4=Optimized")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)