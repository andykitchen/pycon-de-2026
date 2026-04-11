# Interventional Generalisation

## Framing question

- **Central question:** If I take action **X** instead of action **Y**, will I obtain desired outcome **Z**?
- This must be answered under **uncertainty** (limited knowledge, stochastic outcomes) and **novelty** (settings not seen before, distribution shift).

---

## Positioning

- Ideas are offered **toward a methodology for systematic decision making** — not a finished science, but a direction of travel.
- Goal: make **compound, difficult judgments** traceable to **simpler, less controversial base judgments**, in a repeatable way.

---

## Why systems? What is systematization?

- **Systems** are ways to **crystallize judgment**: explicit structure for what we believe, what we observe, and what we recommend.
- Systematization means: **names, relationships, and rules** that others can inspect, criticize, and extend — instead of ad hoc intuition alone.
- Systems **move judgments around**: they let us build **difficult, compound conclusions** from **easier premises** while exposing where disagreement actually lives.

---

## Three conceptual lenses (preview)

| Lens | Typical phrasing | Rough formal home |
|------|------------------|-------------------|
| **Uncertainty** | “It’ll be about twenty-something tomorrow” | Random variables, distributions, calibration |
| **Causality** | “If we want X we should do Y” | Causal graphs, structural causal models (SCMs), identification |
| **Decision** | “The best thing to do is X” | Decision theory, payoffs, policies, **interventional generalisation** |

---

## Three-step hierarchy (depth of methodology)

### 1. Signal and noise (observational)

- Where **most of statistics** lives: estimation, testing, prediction from data **as drawn**.
- **Highly developed** tools and methodology (design, inference, uncertainty quantification for *associations* and forecasts).

### 2. Cause and effect (causal / interventional)

- **Judea Pearl** and others: causal graphs, do-calculus, SCMs; strong presence in **econometrics / economics**.
- **Moderately developed** relative to (1); still **uncommon** in day-to-day practice outside specialists.
- Bridges “what tends to happen” with “what happens **if we intervene**.”

### 3. Decide and act (utilitarian / prescriptive)

- Choose actions under **costs, benefits, and uncertainty** — not only “what is true” but **what to do**.
- **Few standardized tools** and **no single widely accepted methodology** (compared to classical stats).
- Natural connections to **game theory**, especially **games of imperfect information** (others’ moves, hidden state).

---

## Two separable sources of uncertainty

Distinguish them because they call for **different responses** in models and in process.

### Uncertainty in parameters (epistemic / structural)

- Limits on **how well we know the system**: functional form, coefficients, heterogeneity across units or time.
- Often addressable with **hierarchical structure**, priors, model comparison, and careful scope statements.

### Uncertainty from noise (aleatoric / outcome variability)

- Limits **how tightly outcomes can be predicted** even with a perfect model of the mechanism.
- Sets a **ceiling** on predictability; shapes **risk** and the value of **measurement** vs **action**.

---

## Interveneability measures

- Fix an **outcome variable** of interest.
- Compare the **distribution of that outcome** under:
  - **no intervention** (baseline), versus
  - **intervention** (a specified action or policy).
- One concrete summary: **KL divergence** between the two outcome distributions — how much the intervention **moves** the outcome distribution (subject to modeling choices and identification).

*(Refine: which baseline, which horizon, conditional on what information.)*

---

## Will a causal model generalize to new situations?

### Known unknowns (structured heterogeneity)

- Use **Bayesian hierarchical models**, **random effects**, **partial pooling**: borrow strength across similar units while allowing variation.
- Encode **what we expect to vary** and **how** — even when we cannot observe every facet directly.

### Unknown unknowns (unmodeled failure modes)

- **Safety margins** and **explicit conservatism** in policies.
- **Heuristic biases** as second-order guardrails when the model is necessarily incomplete:
  - **Bias to inaction** when downside risk dominates: e.g. require **high confidence** (e.g. well above “more likely than not”) that an intervention improves expected utility net of harm.
  - **Bias to action** in **winner-take-all** or **option value** settings: favor actions that materially **raise the probability** of the best outcome when passivity loses by construction.

---

## Address criticisms (placeholder sections)

- **Over-quantification / false precision:** when numbers are theater; when to keep ordinal or qualitative structure.
- **Ethics vs utilitarian framing:** whose costs and benefits; non-compensatory values.
- **Identification vs ambition:** what the data can actually support for causal and decision claims.
- **Governance:** who owns the model, audits, and the right to override.

*(Expand with anticipated audience objections.)*

---

## Closing anchor

- **Interventional generalisation** ties **causal** claims about **do(·)** to **out-of-sample** and **novel** regimes — where both **models** and **values** must travel carefully.
- Systems are the **scaffolding**: they make that travel **inspectable** and **negotiable**.
