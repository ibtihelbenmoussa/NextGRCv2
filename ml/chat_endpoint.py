# ─── Chatbot ML Module ────────────────────────────────────────────────────────
# Add this to your existing app.py
# Requirements: pip install scikit-learn numpy flask flask-cors joblib

import re
import json
from datetime import datetime, date
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import numpy as np

# ─── Intent Training Data ─────────────────────────────────────────────────────

INTENT_TRAINING = [
    # overdue
    ("which plans are overdue", "overdue"),
    ("show me overdue plans", "overdue"),
    ("what is late", "overdue"),
    ("overdue action plans", "overdue"),
    ("plans past deadline", "overdue"),
    ("delayed plans", "overdue"),
    ("late plans", "overdue"),
    ("quels plans sont en retard", "overdue"),
    ("plans en retard", "overdue"),
    ("chkoun ki overdue", "overdue"),
    ("chkoun met5ar", "overdue"),

    # due_soon
    ("due this week", "due_soon"),
    ("due soon", "due_soon"),
    ("plans due in 7 days", "due_soon"),
    ("upcoming deadlines", "due_soon"),
    ("plans expiring soon", "due_soon"),
    ("deadlines this week", "due_soon"),
    ("plans proches deadline", "due_soon"),
    ("bientot deadline", "due_soon"),

    # assignee_load
    ("who has the most plans", "assignee_load"),
    ("assignee workload", "assignee_load"),
    ("who is overloaded", "assignee_load"),
    ("workload per person", "assignee_load"),
    ("who has most tasks", "assignee_load"),
    ("qui a le plus de plans", "assignee_load"),
    ("charge de travail", "assignee_load"),
    ("chkoun 3andou plans kther", "assignee_load"),
    ("mta3 chkoun kther plans", "assignee_load"),

    # status_summary
    ("how many open plans", "status_summary"),
    ("status summary", "status_summary"),
    ("how many plans are closed", "status_summary"),
    ("give me a summary", "status_summary"),
    ("overall status", "status_summary"),
    ("breakdown of plans", "status_summary"),
    ("resume des plans", "status_summary"),
    ("combien de plans ouverts", "status_summary"),
    ("9adech plans", "status_summary"),
    ("statistiques plans", "status_summary"),

    # open_plans
    ("show open plans", "open_plans"),
    ("list open plans", "open_plans"),
    ("which plans are open", "open_plans"),
    ("open action plans", "open_plans"),
    ("plans not started", "open_plans"),
    ("plans ouverts", "open_plans"),
    ("plans en attente", "open_plans"),

    # in_progress_plans
    ("in progress plans", "in_progress"),
    ("plans being worked on", "in_progress"),
    ("active plans", "in_progress"),
    ("plans en cours", "in_progress"),
    ("plans actifs", "in_progress"),

    # closed_plans
    ("closed plans", "closed_plans"),
    ("completed plans", "closed_plans"),
    ("done plans", "closed_plans"),
    ("finished plans", "closed_plans"),
    ("plans termines", "closed_plans"),
    ("plans cloturer", "closed_plans"),

    # priority
    ("what should i work on first", "priority"),
    ("most urgent plans", "priority"),
    ("top priority", "priority"),
    ("critical plans", "priority"),
    ("highest risk plans", "priority"),
    ("what to do first", "priority"),
    ("priorites", "priority"),
    ("quelle priorite", "priority"),
    ("chnou nahki bih awel", "priority"),
    ("el hem lezem", "priority"),

    # unassigned
    ("unassigned plans", "unassigned"),
    ("plans without assignee", "unassigned"),
    ("who owns these plans", "unassigned"),
    ("plans sans assignee", "unassigned"),
    ("plans non assignes", "unassigned"),
    ("plans bila assignee", "unassigned"),

    # search_plan
    ("find plan about", "search_plan"),
    ("search for plan", "search_plan"),
    ("plan about firewall", "search_plan"),
    ("plan about access", "search_plan"),
    ("find kpi", "search_plan"),
    ("cherche plan", "search_plan"),
    ("plan qui parle de", "search_plan"),

    # stats_advanced
    ("completion rate", "stats_advanced"),
    ("average days to close", "stats_advanced"),
    ("performance metrics", "stats_advanced"),
    ("how long to complete", "stats_advanced"),
    ("taux de completion", "stats_advanced"),
    ("performance globale", "stats_advanced"),

    # help
    ("what can you do", "help"),
    ("help", "help"),
    ("commands", "help"),
    ("how to use", "help"),
    ("aide", "help"),
    ("chnou ta3mel", "help"),
    ("kifech t5eddem", "help"),
]

# ─── Train Intent Classifier ──────────────────────────────────────────────────

def build_intent_classifier():
    texts, labels = zip(*INTENT_TRAINING)
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 3),
            min_df=1,
            analyzer='char_wb',
            sublinear_tf=True,
        )),
        ('clf', MultinomialNB(alpha=0.3)),
    ])
    pipeline.fit(texts, labels)
    return pipeline

_intent_clf = build_intent_classifier()


def classify_intent(text: str) -> tuple[str, float]:
    text = text.lower().strip()
    proba = _intent_clf.predict_proba([text])[0]
    idx   = int(np.argmax(proba))
    intent = _intent_clf.classes_[idx]
    confidence = float(proba[idx])

    # Keyword override for high-precision cases
    kw_map = {
        r'\boverdue\b|en retard|met5ar':                   'overdue',
        r'\bdue soon\b|bient.t|this week|cette semaine':   'due_soon',
        r'\bunassign|sans assign|bila assign':             'unassigned',
        r'\bpriority\b|priorit|urgent|awel':               'priority',
        r'\bsummary\b|resum|statistique|9adech':           'status_summary',
        r'\bin.progress\b|en cours|actif':                 'in_progress',
        r'\bclosed\b|termin|clot':                         'closed_plans',
        r'\bopen\b|ouvert|en attente':                     'open_plans',
        r'\bworkload\b|charge|kther plans|kther tasks':    'assignee_load',
        r'\bhelp\b|aide\b|chnou ta3mel':                   'help',
    }
    for pattern, forced_intent in kw_map.items():
        if re.search(pattern, text, re.IGNORECASE):
            return forced_intent, 0.99

    return intent, confidence


# ─── Risk Scorer (ML-based) ───────────────────────────────────────────────────

def compute_risk_score(plan: dict) -> float:
    """
    Local ML scoring — no external API.
    Score 0..100 based on: status, overdue, due_soon, unassigned, level.
    """
    score = 0.0

    status = plan.get('status', 'open')
    if status == 'open':       score += 30
    if status == 'in_progress': score += 15

    due_date = plan.get('due_date')
    if due_date:
        try:
            due = datetime.strptime(str(due_date), '%Y-%m-%d').date()
            today = date.today()
            diff = (due - today).days
            if diff < 0:
                score += 40  # overdue
            elif diff <= 7:
                score += 25  # due soon
            elif diff <= 14:
                score += 10
        except Exception:
            pass

    if not plan.get('assigned_to'):
        score += 20  # unassigned

    # Level from description e.g. "L1[0]|..."
    desc = plan.get('description', '')
    m = re.match(r'^L(\d)\[', desc or '')
    if m:
        level_num = int(m.group(1))
        score += (5 - level_num) * 4  # L1=+16, L5=+0

    return min(score, 100.0)


def is_overdue(plan: dict) -> bool:
    due = plan.get('due_date')
    status = plan.get('status', 'open')
    if not due or status == 'closed':
        return False
    try:
        return datetime.strptime(str(due), '%Y-%m-%d').date() < date.today()
    except Exception:
        return False


def is_due_soon(plan: dict) -> bool:
    due = plan.get('due_date')
    status = plan.get('status', 'open')
    if not due or status == 'closed':
        return False
    try:
        diff = (datetime.strptime(str(due), '%Y-%m-%d').date() - date.today()).days
        return 0 <= diff <= 7
    except Exception:
        return False


# ─── Response Generators ──────────────────────────────────────────────────────

def fmt_plan(p: dict, show_risk=False) -> str:
    status_icon = {'open': '🔵', 'in_progress': '🟠', 'closed': '✅'}.get(p.get('status',''), '⚪')
    assignee = p.get('assigned_user_name') or 'Unassigned'
    due = p.get('due_date') or 'No date'
    title = p.get('title', 'Untitled')[:60]
    risk = f" | Risk: {compute_risk_score(p):.0f}/100" if show_risk else ""
    return f"{status_icon} **{title}**\n   👤 {assignee} | 📅 {due}{risk}"


def generate_response(intent: str, confidence: float, plans: list, question: str) -> dict:
    active = [p for p in plans if p.get('status') != 'closed']
    total  = len(plans)

    # ── overdue ───────────────────────────────────────────────────────────────
    if intent == 'overdue':
        overdue_plans = [p for p in active if is_overdue(p)]
        if not overdue_plans:
            return {
                'text': "✅ Great news! No action plans are currently overdue.",
                'intent': intent, 'count': 0,
            }
        lines = [f"⚠️ **{len(overdue_plans)} overdue plan(s) found:**\n"]
        for p in sorted(overdue_plans, key=lambda x: x.get('due_date','') or ''):
            lines.append(fmt_plan(p))
        lines.append(f"\n💡 *Tip: Overdue plans block your maturity progress. Prioritize closing them.*")
        return {'text': '\n'.join(lines), 'intent': intent, 'count': len(overdue_plans)}

    # ── due_soon ──────────────────────────────────────────────────────────────
    if intent == 'due_soon':
        soon_plans = [p for p in active if is_due_soon(p)]
        if not soon_plans:
            return {'text': "📅 No plans are due in the next 7 days. You're on track!", 'intent': intent}
        lines = [f"⏰ **{len(soon_plans)} plan(s) due within 7 days:**\n"]
        for p in sorted(soon_plans, key=lambda x: x.get('due_date','') or ''):
            lines.append(fmt_plan(p))
        return {'text': '\n'.join(lines), 'intent': intent, 'count': len(soon_plans)}

    # ── assignee_load ─────────────────────────────────────────────────────────
    if intent == 'assignee_load':
        load: dict = {}
        for p in active:
            name = p.get('assigned_user_name') or 'Unassigned'
            load[name] = load.get(name, 0) + 1
        if not load:
            return {'text': "No active plans found.", 'intent': intent}
        sorted_load = sorted(load.items(), key=lambda x: -x[1])
        lines = ["👥 **Assignee Workload:**\n"]
        for name, count in sorted_load:
            bar = '█' * min(count, 20)
            lines.append(f"  **{name}**: {bar} {count} plan(s)")
        top = sorted_load[0]
        if top[1] > 3:
            lines.append(f"\n⚠️ *{top[0]} is carrying the most load ({top[1]} plans). Consider redistributing.*")
        return {'text': '\n'.join(lines), 'intent': intent}

    # ── status_summary ────────────────────────────────────────────────────────
    if intent == 'status_summary':
        counts = {
            'open': sum(1 for p in plans if p.get('status') == 'open'),
            'in_progress': sum(1 for p in plans if p.get('status') == 'in_progress'),
            'closed': sum(1 for p in plans if p.get('status') == 'closed'),
            'overdue': sum(1 for p in active if is_overdue(p)),
            'due_soon': sum(1 for p in active if is_due_soon(p)),
            'unassigned': sum(1 for p in active if not p.get('assigned_to')),
        }
        closed_rate = round((counts['closed'] / total * 100)) if total else 0
        lines = [
            f"📊 **Action Plans Summary** ({total} total)\n",
            f"🔵 Open:        {counts['open']}",
            f"🟠 In Progress: {counts['in_progress']}",
            f"✅ Closed:      {counts['closed']} ({closed_rate}% completion rate)",
            f"🔴 Overdue:     {counts['overdue']}",
            f"⏰ Due soon:    {counts['due_soon']}",
            f"👤 Unassigned:  {counts['unassigned']}",
        ]
        if counts['overdue'] > 0:
            lines.append(f"\n⚠️ *You have {counts['overdue']} overdue plan(s) requiring immediate attention.*")
        elif closed_rate >= 80:
            lines.append(f"\n🎉 *Excellent! {closed_rate}% completion rate. Keep it up!*")
        return {'text': '\n'.join(lines), 'intent': intent, 'stats': counts}

    # ── open_plans ────────────────────────────────────────────────────────────
    if intent == 'open_plans':
        open_plans = [p for p in plans if p.get('status') == 'open']
        if not open_plans:
            return {'text': "✅ No open plans. Everything is in progress or closed!", 'intent': intent}
        lines = [f"🔵 **{len(open_plans)} Open Plan(s):**\n"]
        for p in open_plans[:10]:
            lines.append(fmt_plan(p))
        if len(open_plans) > 10:
            lines.append(f"\n*...and {len(open_plans) - 10} more*")
        return {'text': '\n'.join(lines), 'intent': intent, 'count': len(open_plans)}

    # ── in_progress ───────────────────────────────────────────────────────────
    if intent == 'in_progress':
        ip_plans = [p for p in plans if p.get('status') == 'in_progress']
        if not ip_plans:
            return {'text': "🟠 No plans currently in progress.", 'intent': intent}
        lines = [f"🟠 **{len(ip_plans)} Plan(s) In Progress:**\n"]
        for p in ip_plans:
            lines.append(fmt_plan(p))
        return {'text': '\n'.join(lines), 'intent': intent}

    # ── closed_plans ──────────────────────────────────────────────────────────
    if intent == 'closed_plans':
        closed = [p for p in plans if p.get('status') == 'closed']
        if not closed:
            return {'text': "No closed plans yet. Keep working!", 'intent': intent}
        lines = [f"✅ **{len(closed)} Closed Plan(s):**\n"]
        for p in closed[:8]:
            lines.append(fmt_plan(p))
        return {'text': '\n'.join(lines), 'intent': intent}

    # ── priority ──────────────────────────────────────────────────────────────
    if intent == 'priority':
        scored = [(p, compute_risk_score(p)) for p in active]
        scored.sort(key=lambda x: -x[1])
        top5 = scored[:5]
        lines = ["🎯 **Top Priority Plans (ML Risk Score):**\n"]
        for i, (p, score) in enumerate(top5, 1):
            risk_label = "🔴 Critical" if score >= 70 else "🟠 High" if score >= 40 else "🟡 Medium"
            lines.append(f"{i}. {risk_label} ({score:.0f}/100)\n   {fmt_plan(p)}\n")
        lines.append("*Risk score = status + overdue days + unassigned + gap level*")
        return {'text': '\n'.join(lines), 'intent': intent, 'top': [p[0]['id'] for p in top5]}

    # ── unassigned ────────────────────────────────────────────────────────────
    if intent == 'unassigned':
        unassigned = [p for p in active if not p.get('assigned_to')]
        if not unassigned:
            return {'text': "✅ All active plans are assigned!", 'intent': intent}
        lines = [f"👤 **{len(unassigned)} Unassigned Plan(s):**\n"]
        for p in unassigned:
            lines.append(f"  ⚪ **{p.get('title','')[:55]}**\n   📅 {p.get('due_date') or 'No date'}")
        lines.append("\n⚠️ *Unassigned plans are at risk. Please assign them immediately.*")
        return {'text': '\n'.join(lines), 'intent': intent, 'count': len(unassigned)}

    # ── search_plan ───────────────────────────────────────────────────────────
    if intent == 'search_plan':
        # Extract keywords from question (remove stop words)
        stop = {'plan','find','search','about','show','cherche','qui','parle','de','un','le','la','les'}
        keywords = [w for w in re.findall(r'\w+', question.lower()) if w not in stop and len(w) > 2]
        if not keywords:
            return {'text': "Please specify what you're looking for. Example: *'find plan about KPI'*", 'intent': intent}
        results = []
        for p in plans:
            text = f"{p.get('title','')} {p.get('description','')} {p.get('gap_assessment_name','')}".lower()
            if any(kw in text for kw in keywords):
                results.append(p)
        if not results:
            return {'text': f"No plans found matching: **{', '.join(keywords)}**", 'intent': intent}
        lines = [f"🔍 **{len(results)} plan(s) matching '{' '.join(keywords)}':**\n"]
        for p in results[:8]:
            lines.append(fmt_plan(p))
        return {'text': '\n'.join(lines), 'intent': intent, 'count': len(results)}

    # ── stats_advanced ────────────────────────────────────────────────────────
    if intent == 'stats_advanced':
        closed_plans = [p for p in plans if p.get('status') == 'closed']
        closed_rate = round(len(closed_plans) / total * 100) if total else 0
        unassigned_rate = round(sum(1 for p in active if not p.get('assigned_to')) / max(len(active),1) * 100)
        overdue_count = sum(1 for p in active if is_overdue(p))
        overdue_rate = round(overdue_count / max(len(active),1) * 100)

        risk_scores = [compute_risk_score(p) for p in active]
        avg_risk = round(np.mean(risk_scores)) if risk_scores else 0

        health = "🟢 Healthy" if avg_risk < 30 else "🟠 At Risk" if avg_risk < 60 else "🔴 Critical"

        lines = [
            f"📈 **Advanced Analytics**\n",
            f"📌 Completion Rate:   {closed_rate}%",
            f"👤 Unassigned Rate:   {unassigned_rate}%",
            f"🔴 Overdue Rate:      {overdue_rate}%",
            f"🧠 Avg ML Risk Score: {avg_risk}/100",
            f"💊 Portfolio Health:  {health}",
        ]
        return {'text': '\n'.join(lines), 'intent': intent}

    # ── help ──────────────────────────────────────────────────────────────────
    if intent == 'help':
        return {
            'text': (
                "🤖 **What I can do:**\n\n"
                "• `overdue` — Show overdue plans\n"
                "• `due soon` — Plans due this week\n"
                "• `priority` — Top risk plans (ML scored)\n"
                "• `workload` — Assignee load distribution\n"
                "• `summary` — Full status breakdown\n"
                "• `open plans` — List open plans\n"
                "• `in progress` — Active plans\n"
                "• `unassigned` — Plans without owner\n"
                "• `find [keyword]` — Search by title/description\n"
                "• `analytics` — Advanced ML metrics\n\n"
                "*I understand English, French, and Tunisian dialect 🇹🇳*"
            ),
            'intent': 'help',
        }

    # ── fallback ──────────────────────────────────────────────────────────────
    return {
        'text': (
            f"🤔 I understood: **{intent}** (confidence: {confidence:.0%})\n\n"
            "Try asking:\n"
            "• *'show overdue plans'*\n"
            "• *'who has the most plans'*\n"
            "• *'top priority'*\n"
            "• *'help'* for all commands"
        ),
        'intent': 'unknown',
    }


# ─── Flask Route (add to your app.py) ────────────────────────────────────────

"""
Copy-paste this route into your existing app.py:

@app.route('/chat', methods=['POST'])
def chat():
    from chat_endpoint import classify_intent, generate_response
    try:
        data     = request.get_json(force=True) or {}
        question = data.get('question', '').strip()
        plans    = data.get('plans', [])

        if not question:
            return jsonify({'error': 'question is required'}), 400

        intent, confidence = classify_intent(question)
        response = generate_response(intent, confidence, plans, question)

        return jsonify({
            'answer':     response.get('text', ''),
            'intent':     response.get('intent', 'unknown'),
            'confidence': round(confidence, 3),
            'meta':       {k: v for k, v in response.items() if k not in ('text','intent')},
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
"""