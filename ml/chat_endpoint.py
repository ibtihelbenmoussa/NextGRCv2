# ─── chat_endpoint.py ────────────────────────────────────────────────────────
# Chatbot ML Module for NextGRC — NLP local + Groq fallback
# Place this file next to your app.py
# Requirements: pip install scikit-learn numpy flask flask-cors requests python-dotenv

import os
import re
import requests as http_req
from datetime import datetime, date
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import numpy as np
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"

# ─── Intent Training Data ─────────────────────────────────────────────────────

INTENT_TRAINING = [
    # overdue
    ("which plans are overdue",        "overdue"),
    ("show me overdue plans",          "overdue"),
    ("what is late",                   "overdue"),
    ("overdue action plans",           "overdue"),
    ("plans past deadline",            "overdue"),
    ("delayed plans",                  "overdue"),
    ("late plans",                     "overdue"),
    ("quels plans sont en retard",     "overdue"),
    ("plans en retard",                "overdue"),
    ("chkoun ki overdue",              "overdue"),
    ("chkoun met5ar",                  "overdue"),

    # due_soon
    ("due this week",                  "due_soon"),
    ("due soon",                       "due_soon"),
    ("plans due in 7 days",            "due_soon"),
    ("upcoming deadlines",             "due_soon"),
    ("plans expiring soon",            "due_soon"),
    ("deadlines this week",            "due_soon"),
    ("plans proches deadline",         "due_soon"),
    ("bientot deadline",               "due_soon"),

    # assignee_load
    ("who has the most plans",         "assignee_load"),
    ("assignee workload",              "assignee_load"),
    ("who is overloaded",              "assignee_load"),
    ("workload per person",            "assignee_load"),
    ("who has most tasks",             "assignee_load"),
    ("qui a le plus de plans",         "assignee_load"),
    ("charge de travail",              "assignee_load"),
    ("chkoun 3andou plans kther",      "assignee_load"),
    ("mta3 chkoun kther plans",        "assignee_load"),

    # status_summary
    ("how many open plans",            "status_summary"),
    ("status summary",                 "status_summary"),
    ("how many plans are closed",      "status_summary"),
    ("give me a summary",              "status_summary"),
    ("overall status",                 "status_summary"),
    ("breakdown of plans",             "status_summary"),
    ("resume des plans",               "status_summary"),
    ("combien de plans ouverts",       "status_summary"),
    ("9adech plans",                   "status_summary"),
    ("statistiques plans",             "status_summary"),

    # open_plans
    ("show open plans",                "open_plans"),
    ("list open plans",                "open_plans"),
    ("which plans are open",           "open_plans"),
    ("open action plans",              "open_plans"),
    ("plans not started",              "open_plans"),
    ("plans ouverts",                  "open_plans"),
    ("plans en attente",               "open_plans"),

    # in_progress
    ("in progress plans",              "in_progress"),
    ("plans being worked on",          "in_progress"),
    ("active plans",                   "in_progress"),
    ("plans en cours",                 "in_progress"),
    ("plans actifs",                   "in_progress"),

    # closed_plans
    ("closed plans",                   "closed_plans"),
    ("completed plans",                "closed_plans"),
    ("done plans",                     "closed_plans"),
    ("finished plans",                 "closed_plans"),
    ("plans termines",                 "closed_plans"),
    ("plans cloturer",                 "closed_plans"),

    # priority
    ("what should i work on first",    "priority"),
    ("most urgent plans",              "priority"),
    ("top priority",                   "priority"),
    ("critical plans",                 "priority"),
    ("highest risk plans",             "priority"),
    ("what to do first",               "priority"),
    ("priorites",                      "priority"),
    ("quelle priorite",                "priority"),
    ("chnou nahki bih awel",           "priority"),
    ("el hem lezem",                   "priority"),

    # unassigned
    ("unassigned plans",               "unassigned"),
    ("plans without assignee",         "unassigned"),
    ("who owns these plans",           "unassigned"),
    ("plans sans assignee",            "unassigned"),
    ("plans non assignes",             "unassigned"),
    ("plans bila assignee",            "unassigned"),

    # search_plan
    ("find plan about",                "search_plan"),
    ("search for plan",                "search_plan"),
    ("plan about firewall",            "search_plan"),
    ("plan about access",              "search_plan"),
    ("find kpi",                       "search_plan"),
    ("cherche plan",                   "search_plan"),
    ("plan qui parle de",              "search_plan"),

    # stats_advanced
    ("completion rate",                "stats_advanced"),
    ("average days to close",          "stats_advanced"),
    ("performance metrics",            "stats_advanced"),
    ("how long to complete",           "stats_advanced"),
    ("taux de completion",             "stats_advanced"),
    ("performance globale",            "stats_advanced"),

    # help
    ("what can you do",                "help"),
    ("help",                           "help"),
    ("commands",                       "help"),
    ("how to use",                     "help"),
    ("aide",                           "help"),
    ("chnou ta3mel",                   "help"),
    ("kifech t5eddem",                 "help"),

    # compliance_score
    ("compliance score",               "compliance_score"),
    ("quel est le score",              "compliance_score"),
    ("score global",                   "compliance_score"),
    ("taux de conformite",             "compliance_score"),
    ("9adech el score",                "compliance_score"),
    ("compliance rate",                "compliance_score"),

    # maturity
    ("maturity level",                 "maturity"),
    ("niveau de maturite",             "maturity"),
    ("maturite globale",               "maturity"),
    ("quel niveau",                    "maturity"),

    # frameworks
    ("frameworks",                     "frameworks"),
    ("quel framework",                 "frameworks"),
    ("framework comparison",           "frameworks"),
    ("meilleur framework",             "frameworks"),
    ("worst framework",                "frameworks"),
    ("framework critique",             "frameworks"),

    # business_units
    ("business unit",                  "business_units"),
    ("best bu",                        "business_units"),
    ("worst bu",                       "business_units"),
    ("quelle bu",                      "business_units"),
    ("unite metier",                   "business_units"),
    ("compliance par bu",              "business_units"),

    # critical_gaps
    ("critical gaps",                  "critical_gaps"),
    ("gaps critiques",                 "critical_gaps"),
    ("chkoun gap critique",            "critical_gaps"),
    ("assessments critiques",          "critical_gaps"),

    # evolution
    ("evolution",                      "evolution"),
    ("trend",                          "evolution"),
    ("historique",                     "evolution"),
    ("progression",                    "evolution"),
    ("compliance evolution",           "evolution"),
    ("derniers mois",                  "evolution"),

    # recommendations
    ("recommendations",                "recommendations"),
    ("recommandations",                "recommendations"),
    ("que faire",                      "recommendations"),
    ("quoi ameliorer",                 "recommendations"),
    ("chnou nlazem na3mel",            "recommendations"),

    # executive_summary
    ("executive summary",              "executive_summary"),
    ("resume executif",                "executive_summary"),
    ("vue globale",                    "executive_summary"),
    ("situation globale",              "executive_summary"),
    ("chnou ysir",                     "executive_summary"),
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
    proba      = _intent_clf.predict_proba([text])[0]
    idx        = int(np.argmax(proba))
    intent     = _intent_clf.classes_[idx]
    confidence = float(proba[idx])

    # Keyword override for high-precision cases
    kw_map = {
        r'\boverdue\b|en retard|met5ar':                  'overdue',
        r'\bdue soon\b|bient.t|this week|cette semaine':  'due_soon',
        r'\bunassign|sans assign|bila assign':            'unassigned',
        r'\bpriority\b|priorit|urgent|awel':              'priority',
        r'\bsummary\b|resum|statistique|9adech plans':    'status_summary',
        r'\bin.progress\b|en cours|actif':                'in_progress',
        r'\bclosed\b|termin|clot':                        'closed_plans',
        r'\bopen\b|ouvert|en attente':                    'open_plans',
        r'\bworkload\b|charge|kther plans':               'assignee_load',
        r'\bhelp\b|aide\b|chnou ta3mel':                  'help',
        # ── Dashboard ──
        r'\bscore\b|conformit|compliance score|9adech score': 'compliance_score',
        r'\bmaturit|maturity':                            'maturity',
        r'\bframework':                                   'frameworks',
        r'\bbu\b|business.unit|unite.metier':             'business_units',
        r'\bgap.critique|critical.gap':                   'critical_gaps',
        r'\bevolution|trend|progression|derniers.mois':   'evolution',
        r'\brecommand|que faire|chnou nlazem':            'recommendations',
        r'\bexecutive|vue.globale|situation.globale':     'executive_summary',
    }
    for pattern, forced_intent in kw_map.items():
        if re.search(pattern, text, re.IGNORECASE):
            return forced_intent, 0.99

    return intent, confidence


# ─── Groq Fallback ────────────────────────────────────────────────────────────



   def ask_groq_fallback(question: str, plans: list, dashboard: dict = {}) -> str:
    kpis = dashboard.get('kpis', {})
    exec_sum = dashboard.get('executiveSummary', {})
    fws  = dashboard.get('frameworkComparison', [])

    context = f"""
Dashboard GRC:
- Score conformité: {kpis.get('compliance_score', 'N/A')}%
- Maturité: {kpis.get('avg_maturity', 'N/A')}/5
- Gaps critiques: {exec_sum.get('critical_gaps', 'N/A')}
- Plans overdue: {exec_sum.get('overdue_plans', 'N/A')}
- Frameworks: {', '.join([f"{f['framework']} ({f['compliance']}%)" for f in fws[:5]])}

Action Plans (total: {len(plans)}):
"""
    for p in plans[:10]:
        context += f"- [{p.get('status','?')}] {p.get('title','?')[:50]} | due: {p.get('due_date','N/A')}\n"

    try:
        resp = http_req.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a GRC assistant for NextGRC platform. "
                            "Answer questions about action plans concisely and clearly. "
                            "Respond in the same language as the user "
                            "(English, French, or Tunisian Arabic).\n\n"
                            f"Current action plans data:\n{plans_context}"
                        ),
                    },
                    {"role": "user", "content": question},
                ],
                "max_tokens": 500,
                "temperature": 0.3,
            },
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    except Exception as e:
        return f"⚠️ AI fallback unavailable: {str(e)}"


# ─── Risk Scorer ──────────────────────────────────────────────────────────────

def compute_risk_score(plan: dict) -> float:
    """Score 0..100 based on: status, overdue, due_soon, unassigned, gap level."""
    score = 0.0

    status = plan.get('status', 'open')
    if status == 'open':        score += 30
    if status == 'in_progress': score += 15

    due_date = plan.get('due_date')
    if due_date:
        try:
            due   = datetime.strptime(str(due_date), '%Y-%m-%d').date()
            today = date.today()
            diff  = (due - today).days
            if diff < 0:    score += 40  # overdue
            elif diff <= 7: score += 25  # due soon
            elif diff <= 14: score += 10
        except Exception:
            pass

    if not plan.get('assigned_to'):
        score += 20  # unassigned

    desc = plan.get('description', '')
    m = re.match(r'^L(\d)\[', desc or '')
    if m:
        level_num = int(m.group(1))
        score += (5 - level_num) * 4   # L1=+16, L5=+0

    return min(score, 100.0)


def is_overdue(plan: dict) -> bool:
    due    = plan.get('due_date')
    status = plan.get('status', 'open')
    if not due or status == 'closed':
        return False
    try:
        return datetime.strptime(str(due), '%Y-%m-%d').date() < date.today()
    except Exception:
        return False


def is_due_soon(plan: dict) -> bool:
    due    = plan.get('due_date')
    status = plan.get('status', 'open')
    if not due or status == 'closed':
        return False
    try:
        diff = (datetime.strptime(str(due), '%Y-%m-%d').date() - date.today()).days
        return 0 <= diff <= 7
    except Exception:
        return False


# ─── Formatters ───────────────────────────────────────────────────────────────

def fmt_plan(p: dict, show_risk: bool = False) -> str:
    status_icon = {'open': '🔵', 'in_progress': '🟠', 'closed': '✅'}.get(p.get('status', ''), '⚪')
    assignee    = p.get('assigned_user_name') or 'Unassigned'
    due         = p.get('due_date') or 'No date'
    title       = p.get('title', 'Untitled')[:60]
    risk        = f" | Risk: {compute_risk_score(p):.0f}/100" if show_risk else ""
    return f"{status_icon} **{title}**\n   👤 {assignee} | 📅 {due}{risk}"


# ─── Response Generator ───────────────────────────────────────────────────────

def generate_response(intent: str, confidence: float, plans: list, question: str, dashboard: dict = {}) -> dict:
    
    kpis     = dashboard.get('kpis', {})
    exec_sum = dashboard.get('executiveSummary', {})
    gaps     = dashboard.get('topCriticalGaps', [])
    overdue  = dashboard.get('overdueActionPlans', [])
    recs     = dashboard.get('recommendations', [])
    fws      = dashboard.get('frameworkComparison', [])
    bus      = dashboard.get('businessUnitCompliance', [])
    evo      = dashboard.get('complianceEvolution', [])
    procs    = dashboard.get('processCompliance', [])

    active = [p for p in plans if p.get('status') != 'closed']
    total  = len(plans)

    # ── compliance_score ─────────────────────────────────────────────────────
    if intent == 'compliance_score':
        score    = kpis.get('compliance_score', 'N/A')
        maturity = kpis.get('avg_maturity', 'N/A')
        label    = '🟢 Bon niveau' if isinstance(score, (int,float)) and score >= 60 else '🔴 À améliorer'
        return {'text': (
            f"📊 **Score de conformité global : {score}%** {label}\n"
            f"🧠 Maturité moyenne : **{maturity}/5**\n"
            f"📋 Total assessments : **{kpis.get('gap_assessments', {}).get('total', 'N/A')}**\n"
            f"📈 Score moyen assessments : **{kpis.get('gap_assessments', {}).get('avg_score', 'N/A')}/100**"
        ), 'intent': intent}

    # ── maturity ──────────────────────────────────────────────────────────────
    if intent == 'maturity':
        maturity = kpis.get('avg_maturity', 0)
        labels   = ['', 'Initial', 'Basic', 'Defined', 'Managed', 'Optimized']
        lvl      = int(round(maturity))
        lvl_name = labels[lvl] if 1 <= lvl <= 5 else 'N/A'
        return {'text': (
            f"🧠 **Maturité globale : {maturity}/5** — *{lvl_name}*\n\n"
            f"Niveaux :\n"
            f"  1 — Initial → 2 — Basic → **3 — Defined** → 4 — Managed → 5 — Optimized\n\n"
            f"💡 *Pour progresser, focus sur les frameworks avec maturité < 3.*"
        ), 'intent': intent}

    # ── frameworks ────────────────────────────────────────────────────────────
    if intent == 'frameworks':
        if not fws:
            return {'text': "Aucun framework disponible.", 'intent': intent}
        lines = ["🏗️ **Framework Comparison :**\n"]
        for fw in fws:
            icon = '🟢' if fw['compliance'] >= 70 else '🟠' if fw['compliance'] >= 40 else '🔴'
            lines.append(
                f"{icon} **{fw['framework']}** : {fw['compliance']}% conformité | "
                f"Maturité {fw['maturity']}/5 | {fw['critical']} critiques | {fw['overdue_plans']} overdue"
            )
        best  = max(fws, key=lambda x: x['compliance'])
        worst = min(fws, key=lambda x: x['compliance'])
        lines.append(f"\n✅ Meilleur : **{best['framework']}** ({best['compliance']}%)")
        lines.append(f"⚠️ Plus faible : **{worst['framework']}** ({worst['compliance']}%)")
        return {'text': '\n'.join(lines), 'intent': intent}

    # ── business_units ────────────────────────────────────────────────────────
    if intent == 'business_units':
        if not bus:
            return {'text': "Aucune business unit disponible.", 'intent': intent}
        lines = ["🏢 **Compliance par Business Unit :**\n"]
        for bu in bus:
            icon = '🟢' if bu['score'] >= 70 else '🟠' if bu['score'] >= 40 else '🔴'
            lines.append(f"{icon} **{bu['name']}** : {bu['score']}% ({bu['count']} assessments)")
        return {'text': '\n'.join(lines), 'intent': intent}

    # ── critical_gaps ─────────────────────────────────────────────────────────
    if intent == 'critical_gaps':
        if not gaps:
            return {'text': "✅ Aucun gap critique détecté !", 'intent': intent}
        lines = [f"🚨 **{len(gaps)} Gap(s) Critique(s) :**\n"]
        for g in gaps:
            sev = '🔴 CRITICAL' if g['severity'] == 'critical' else '🟠 HIGH'
            lines.append(f"{sev} **{g['name']}** ({g['framework']}) — Maturité {g['maturity']}/5")
        lines.append("\n💡 *Ces gaps nécessitent une remédiation immédiate.*")
        return {'text': '\n'.join(lines), 'intent': intent}

    # ── evolution ─────────────────────────────────────────────────────────────
    if intent == 'evolution':
        if not evo:
            return {'text': "Pas de données d'évolution disponibles.", 'intent': intent}
        lines = ["📈 **Évolution de conformité (6 derniers mois) :**\n"]
        for e in evo:
            bar = '█' * int(e['score'] / 10)
            lines.append(f"  **{e['month']}** : {bar} {e['score']}% ({e['new_assessments']} nouveaux assessments)")
        first, last = evo[0]['score'], evo[-1]['score']
        diff  = round(last - first, 1)
        trend = f"📈 +{diff}%" if diff > 0 else f"📉 {diff}%"
        lines.append(f"\n{trend} sur la période")
        return {'text': '\n'.join(lines), 'intent': intent}

    # ── recommendations ───────────────────────────────────────────────────────
    if intent == 'recommendations':
        if not recs:
            return {'text': "✅ Aucune recommandation critique pour le moment.", 'intent': intent}
        icons = {'critical': '🔴', 'warning': '🟠', 'success': '🟢', 'info': '🔵'}
        lines = ["💡 **Smart Recommendations :**\n"]
        for r in recs:
            icon = icons.get(r['type'], '⚪')
            lines.append(f"{icon} **{r['title']}**\n   {r['message']}\n")
        return {'text': '\n'.join(lines), 'intent': intent}

    # ── executive_summary ─────────────────────────────────────────────────────
    if intent == 'executive_summary':
        best  = exec_sum.get('best_bu', {}) or {}
        worst = exec_sum.get('worst_bu', {}) or {}
        lines = [
            "📋 **Executive Summary :**\n",
            f"📊 Score global : **{kpis.get('compliance_score', 'N/A')}%**",
            f"🧠 Maturité : **{kpis.get('avg_maturity', 'N/A')}/5**",
            f"✅ Meilleure BU : **{best.get('name', 'N/A')}** ({best.get('score', 'N/A')}%)",
            f"⚠️ BU la plus faible : **{worst.get('name', 'N/A')}** ({worst.get('score', 'N/A')}%)",
            f"🚨 Gaps critiques : **{exec_sum.get('critical_gaps', 0)}**",
            f"🕐 Plans overdue : **{exec_sum.get('overdue_plans', 0)}**",
            f"🔄 Taux remédiation : **{exec_sum.get('remediation_rate', 0)}%**",
            f"📁 Total assessments : **{exec_sum.get('total_assessments', 0)}**",
        ]
        return {'text': '\n'.join(lines), 'intent': intent}

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
        top5  = scored[:5]
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
            lines.append(f"  ⚪ **{p.get('title', '')[:55]}**\n   📅 {p.get('due_date') or 'No date'}")
        lines.append("\n⚠️ *Unassigned plans are at risk. Please assign them immediately.*")
        return {'text': '\n'.join(lines), 'intent': intent, 'count': len(unassigned)}

    # ── search_plan ───────────────────────────────────────────────────────────
    if intent == 'search_plan':
        stop     = {'plan','find','search','about','show','cherche','qui','parle','de','un','le','la','les'}
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
        closed_plans     = [p for p in plans if p.get('status') == 'closed']
        closed_rate      = round(len(closed_plans) / total * 100) if total else 0
        unassigned_rate  = round(sum(1 for p in active if not p.get('assigned_to')) / max(len(active), 1) * 100)
        overdue_count    = sum(1 for p in active if is_overdue(p))
        overdue_rate     = round(overdue_count / max(len(active), 1) * 100)
        risk_scores      = [compute_risk_score(p) for p in active]
        avg_risk         = round(np.mean(risk_scores)) if risk_scores else 0
        health           = "🟢 Healthy" if avg_risk < 30 else "🟠 At Risk" if avg_risk < 60 else "🔴 Critical"
        lines = [
            "📈 **Advanced Analytics**\n",
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

    # ── fallback : confidence faible → Groq ───────────────────────────────────
    if confidence < 0.75 and GROQ_API_KEY:
        groq_answer = ask_groq_fallback(question, plans)
        return {
            'text':   groq_answer,
            'intent': 'ai_assisted',
        }

    # ── fallback ultime (pas de clé Groq) ────────────────────────────────────
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