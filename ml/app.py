from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'maturity_classifier.pkl')
model = joblib.load(MODEL_PATH)


def build_features(q):
    weighted_score  = (q[0]*0.10 + q[1]*0.20 + q[2]*0.30 + q[3]*0.20 + q[4]*0.20) * 100
    gate_violated   = int(q[0] == 0.0)
    partial_count   = sum(1 for v in q if v == 0.5)
    yes_count       = sum(1 for v in q if v == 1.0)
    enforcement_gap = int(q[0] >= 0.5 and q[1] >= 0.5 and q[2] == 0.0)
    return np.array([[q[0], q[1], q[2], q[3], q[4],
                      weighted_score, gate_violated,
                      partial_count, yes_count, enforcement_gap]])


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'maturity_classifier v1.0'})


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        q = [float(data.get(f'q{i}', 0)) for i in range(1, 6)]
        features       = build_features(q)
        level          = int(model.predict(features)[0])
        proba          = model.predict_proba(features)[0]
        confidence     = round(float(proba[level - 1]), 3)
        weighted_score = round((q[0]*0.10 + q[1]*0.20 + q[2]*0.30 + q[3]*0.20 + q[4]*0.20) * 100, 2)
        return jsonify({
            'maturity_level': level,
            'confidence':     confidence,
            'weighted_score': weighted_score,
            'probabilities':  {f'level_{i+1}': round(float(p), 3) for i, p in enumerate(proba)},
            'source':         'ml_model'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


def build_roadmap(title, code, current_level, weak, partial, strong):
    """
    Génère un roadmap structuré niveau par niveau avec actions spécifiques.
    """
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
            ]
        },
        {
            'level': 2, 'icon': '🟠', 'label': 'Developing', 'subtitle': 'Basic / Informal',
            'base_actions': [
                f'Draft an initial policy or procedure for {title}',
                'Identify the scope and assets concerned by this requirement',
                'Implement basic manual controls and workarounds',
                'Communicate basic rules and expectations to relevant personnel',
            ]
        },
        {
            'level': 3, 'icon': '🟡', 'label': 'Defined', 'subtitle': 'Documented & Approved',
            'base_actions': [
                f'Formalize and obtain management approval for {title} policy',
                'Document procedures clearly and assign responsibilities',
                'Implement technical or administrative enforcement controls',
                'Train all relevant staff on the defined procedures',
            ]
        },
        {
            'level': 4, 'icon': '🟢', 'label': 'Managed', 'subtitle': 'Measured & Monitored',
            'base_actions': [
                f'Define KPIs and metrics to measure {title} effectiveness',
                'Implement regular compliance checks and reviews',
                'Set up dashboards or reports to track performance over time',
                'Review and update procedures based on collected metrics',
            ]
        },
        {
            'level': 5, 'icon': '🔵', 'label': 'Optimizing', 'subtitle': 'Continuously Improved',
            'base_actions': [
                f'Establish a continuous improvement cycle for {title}',
                'Integrate lessons learned from incidents, audits, and reviews',
                'Benchmark against industry best practices and standards',
                'Automate controls and monitoring where technically feasible',
            ]
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

        # Extra actions for the next target level
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


@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data    = request.get_json()
        code    = data.get('requirement_code', '')
        title   = data.get('requirement_title', '')
        level   = int(data.get('maturity_level', 1))
        score   = float(data.get('score', 0))
        gap     = int(data.get('gap', 5 - level))
        answers = data.get('answers', {})

        level_labels = ['', 'Initial', 'Developing', 'Defined', 'Managed', 'Optimizing']
        label        = level_labels[level] if 1 <= level <= 5 else 'Unknown'

        weak    = [k for k, v in answers.items() if v == 'NO']
        partial = [k for k, v in answers.items() if v == 'PARTIAL']
        strong  = [k for k, v in answers.items() if v == 'YES']

        # Summary text
        if level == 5:
            summary = (
                f'The requirement {code} – {title} has achieved the highest maturity level '
                f'(Level 5: Optimizing) with a score of {score:.0f}%. '
                f'All dimensions are fully implemented and continuously improved.'
            )
        else:
            summary = (
                f'The requirement {code} – {title} is currently at maturity Level {level} ({label}) '
                f'with a score of {score:.0f}%, requiring {gap} level(s) of improvement to reach full optimization.'
            )

        # Current issues
        current_issues = []
        if weak:
            current_issues.append(f'Critical gaps in: {", ".join(weak)} — not implemented, must be addressed as priority')
        if partial:
            current_issues.append(f'Partial implementation in: {", ".join(partial)} — requires formalization and enforcement')
        if strong:
            current_issues.append(f'Confirmed strengths in: {", ".join(strong)} — maintain and leverage as foundation')

        roadmap = build_roadmap(title, code, level, weak, partial, strong)

        return jsonify({
            'summary':        summary,
            'current_issues': current_issues,
            'roadmap':        roadmap,
            'current_level':  level,
            'source':         'ml_local',
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    print("NextGRC ML API — http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)