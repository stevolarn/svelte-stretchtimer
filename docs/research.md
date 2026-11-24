# Research notes: RSI recovery and habit building

The evidence behind the app's thresholds, copy and features. Compiled November 2026 from systematic reviews, clinical practice guidelines and trials. Strength ratings: **H** = high, **M** = moderate, **L** = low/weak. Some sources were read through abstracts or secondary summaries; those are marked *(secondary)*.

This is background for design decisions, not medical advice. In-app copy should stay modest and point to a clinician when red flags appear.

---

## 1. What helps RSI and desk-related arm, neck and shoulder pain

### Loading beats stretching alone
- **Neck pain:** strengthening of the neck, shoulder and scapular muscles has moderate-certainty evidence. Stretching alone has low-certainty evidence for changing pain or function. **M**. [Cochrane 2015, exercises for mechanical neck disorders](https://www.cochrane.org/evidence/CD004250_exercises-mechanical-neck-disorders)
- **Office workers:** a 2024 meta-analysis found low-certainty evidence that strengthening reduces neck pain and disability. **L–M**. [PubMed 38219373](https://pubmed.ncbi.nlm.nih.gov/38219373/)
- **Small daily doses work:**
  - The trial: Andersen et al. 2011 (n=198) used elastic-tubing training for 2 or 12 minutes a day, 5 days a week, for 10 weeks. Pain fell 1.4/10 versus control (CI −2.0 to −0.7).
  - The 2-minute dose was reported to be about as effective as the 12-minute dose *(secondary)*.
  - **M**. [Andersen 2011, Pain](https://research.regionh.dk/da/publications/effectiveness-of-small-daily-amounts-of-progressive-resistance-tr/)
- **Lateral elbow (tennis elbow):**
  - Resisted wrist-extensor loading is the core treatment and is grade B. It is unclear which contraction type the guideline favours. [JOSPT/APTA lateral elbow CPG 2022](https://www.apta.org/patient-care/evidence-based-practice-resources/cpgs/lateral-elbow-pain-and-muscle-function-impairments)
  - The WA L&I 2023 guideline lists eccentric exercise as best supported. [WA L&I 2023](https://lni.wa.gov/patient-care/advisory-committees/_docs/2023WorkRelatedEpicondylosis_final.pdf)
  - **M** overall.
- **Isometrics** are not proven better than isotonic or eccentric loading. One RCT found unsupervised isometrics beat wait-and-see for lateral elbow pain. **L–M**. [BMJ Open SEM 2020](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7406028/), [PubMed 31425384](https://pubmed.ncbi.nlm.nih.gov/31425384/)
- **Tyler twist (FlexBar):** the original protocol was 3×15 reps once daily (n=22, 2010). The optimal dose is undefined. **L**. [J Hand Ther 2012 review](https://pubmed.ncbi.nlm.nih.gov/22075055/)
- **Nerve and tendon glides (carpal tunnel):**
  - Cochrane 2012 says the benefit is unknown. [PubMed 22696387](https://pubmed.ncbi.nlm.nih.gov/22696387/)
  - The 2026 carpal tunnel CPG gives only grade C for a combined splint-and-stretch programme. **L**.
  - Keep glides as comfortable movement options, not cures.

### Dose, pain during exercise and progression
- **Pain-monitoring rule:**
  - Pain during exercise of about 4–5/10 or less is acceptable if it is back to baseline within 24 hours. [BMJ 2011 clinical review](https://www.bmj.com/content/342/bmj.d2687.full.pdf), [NHS Plymouth tennis elbow leaflet](https://www.plymouthhospitals.nhs.uk/display-pil/pil-tennis-elbow-4079)
  - The Silbernagel 2007 Achilles RCT found that continued loading under this model did no worse than rest.
  - No trial tests the exact cut-off, so present it as a guideline. **L–M**.
  - The app's zones (green 0–2, amber 3–5, red 6+) match this.
- **Progression:** progress by gains in function. Guidelines give no numeric rule, so the app's steps (+5 s holds, +2 reps up to 15, then heavier load) are a reasonable heuristic, not a prescription.
- **Natural history:** lateral elbow pain is often self-limiting over 6–24 months (WA L&I 2023). Steady, moderate loading matters more than intensity.

### Breaks
- **Effect on pain:**
  - Cochrane 2025 (searches to May 2024) found little or no effect on pain from extra breaks, more frequent breaks, or active versus passive breaks. **L**. [Cochrane CD012886](https://www.cochrane.org/evidence/CD012886_work-break-schedules-preventing-musculoskeletal-symptoms-and-disorders-healthy-workers)
  - Break-reminder software (van den Heuvel 2003, n=268) improved perceived recovery (55% vs 34%) but not complaint severity. [SJWEH](https://www.sjweh.fi/article/712)
- **Effect on how you feel:** microbreaks of 10 minutes or less give small gains in vigour and fatigue (d≈0.35). [Albulescu 2022](https://pubmed.ncbi.nlm.nih.gov/36044424/)
- **Decision:** the app offers an on-demand 2-minute break but no workday interval reminders. Breaks are framed as comfort, not treatment.

### Ergonomics and behaviour
- **Workstation changes:**
  - Arm support plus an alternative mouse lowered neck/shoulder disorders (RR 0.52, moderate certainty).
  - Workstation adjustment and sit-stand desks showed no effect.
  - Ergonomics training was low or very low certainty.
  - [Cochrane 2018, ergonomic interventions (CD008570)](https://www.cochrane.org/evidence/CD008570_ergonomic-interventions-preventing-work-related-musculoskeletal-disorders-upper-limb-and-neck-among-office)
- **Carpal tunnel CPG 2026:** favour individual activity modification over avoiding hand use, and consider alternative input devices (grade C). Computer use is not an independent risk factor.
- **Stress and demands:** perceived stress and job demands are the most consistent risk factors, mostly from observational data. Smartphone overuse is associated with neck pain (OR 2.34, observational). [PubMed 39764644](https://pubmed.ncbi.nlm.nih.gov/39764644/)
- **Pain education alone:** pain neuroscience education gave no clear overall benefit (2023 umbrella review). It may help beliefs in chronic neck pain. **L**. [Frontiers 2023](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2023.1272068/full)

### Measuring progress
| Measure | What it is | Meaningful change | Notes |
|---|---|---|---|
| NPRS 0–10 | Pain rating | ~2 points or 30% ([Farrar 2001](https://pubmed.ncbi.nlm.nih.gov/11690728/)) | Used after each routine |
| PSFS | Up to 3 self-chosen hard activities, each rated 0–10 for ability | ~2 points | Free to use; personal; works for any area |
| QuickDASH | Arm/shoulder/hand disability | ~14 (8–16) ([PubMed 23481405](https://pubmed.ncbi.nlm.nih.gov/23481405/)) | Copyrighted, not used |
| PRTEE | Lateral elbow | ~11 *(secondary)* | Not used |
| NDI | Neck disability | 7.5/50 ([PubMed 39973142](https://pubmed.ncbi.nlm.nih.gov/39973142/)) | Copyrighted, not used |

- **How often:** take a baseline, then repeat every 2–4 weeks (WA L&I). The app repeats PSFS every 14 days.

### Red flags (see a clinician)
- **NHS guidance:** see a GP if symptoms persist or worsen, or come with weakness, numbness, tingling or swelling. [NHS RSI](https://www.nhs.uk/conditions/repetitive-strain-injury-rsi/)
- **Carpal tunnel:** progressive loss of feeling, increasing weakness or wasting at the base of the thumb.
- **Neck:**
  - a fall or injury
  - clumsy hands, loss of dexterity or balance problems (possible cord compression, which is urgent)
  - a history of cancer, weight loss or fever
  - constant pain unrelated to movement
  - [GPnotebook](https://gpnotebook.com/en-GB/pages/rheumatology/red-flags-in-neck-pain)
- **No progress:** after weeks of consistent work, get a review. WA L&I suggests reviewing at around 6 months for elbow tendon tears.

### What not to over-promise
- **Stretching alone:** weak evidence for neck pain. Sources partly disagree for lateral elbow, where stretching combined with exercise helped short term.
- **Wrist splints for carpal tunnel:** little or no short-term benefit versus no treatment (Cochrane 2023, low certainty), yet night splinting is grade B in the 2026 CPG. [PubMed 36848651](https://pubmed.ncbi.nlm.nih.gov/36848651/)
- **De Quervain's:** steroid injection plus a thumb splint has the best support; exercise is an adjunct. [PubMed 28860097](https://pubmed.ncbi.nlm.nih.gov/28860097/)
- **Cubital tunnel:** splinting plus activity modification is supported only by low-quality reviews, and nerve gliding is unproven. [PMC6589621](https://pmc.ncbi.nlm.nih.gov/articles/PMC6589621)
- **Other common fixes:**
  - Kinesiotape: no chronic benefit.
  - Sit-stand desks and workstation tweaks: no effect on upper-limb pain.
  - "Posture correction" and "text neck" claims: observational data only.

---

## 2. What helps people keep exercising

- **Home-exercise adherence:**
  - Non-adherence runs up to about 50%.
  - Predictors of sticking with it: intention, self-motivation, self-efficacy, past adherence and social support. [Essery 2016 systematic review](https://www.pubmed.gov/27097761/)
  - Predictors of dropout: pain during exercise, low self-efficacy and depression. [PubMed 20163979](https://pubmed.ncbi.nlm.nih.gov/20163979/)
  - **M**.
- **Digital support:** digital add-ons likely raise short-term adherence, while long-term effects are unclear. Video beat paper handouts in a hand/wrist RCT (n=89). **L–M**. [2022 review](https://link.springer.com/10.1186/s40945-022-00148-z)
- **If-then plans (implementation intentions):** d=0.65 on goal attainment over goal intentions alone (94 tests, more than 8,000 people). **H**, though most studies are short-term. [Gollwitzer & Sheeran 2006](https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f)
- **Context cues:** habit-formation interventions raise physical-activity habit strength (SMD 0.31). There are no controlled trials of branded "habit stacking" or Tiny Habits. **M**. [2023 meta-analysis](https://pubmed.ncbi.nlm.nih.gov/37700303/)
- **How long a habit takes:**
  - Lally 2010 (n=96): a mean of 66 days, range 18–254. Exercise took about 1.5 times longer than eating or drinking habits.
  - **One missed day did not affect habit formation**; very inconsistent people did not form habits.
  - Singh 2024 (20 studies): medians of 59–66 days, means of 106–154 days.
  - **M–L**. [UCL on Lally 2010](https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit), [Singh 2024](https://pubmed.ncbi.nlm.nih.gov/39685110/)
- **Streaks:**
  - 66% kept going with an intact streak versus 58% after a broken one, and the effect was weaker when the streak could be repaired. [Barasch & Silverman 2022](https://knowledge.insead.edu/marketing/consumer-streaks-are-motivating-key-keeping-them-alive)
  - Duolingo's own (non-peer-reviewed) data credits streak freezes with small retention gains. [Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
  - **M–L**.
- **Flexible goals:**
  - Goals with a few "emergency skip" days were preferred and persisted longer after failure. [Sharif & Shu](https://anderson-review.ucla.edu/emergency-reserves/)
  - "Never miss twice" has no direct trial; Lally's one-miss finding is the closest support.
  - **M**.
- **Fresh starts:** gym visits and goal commitments rise after the start of a week, month or year, or a birthday. The data are archival, so this is association only. **M–L**. [Dai, Milkman & Riis 2014](https://faculty.wharton.upenn.edu/wp-content/uploads/2014/06/Dai_Fresh_Start_2014_Mgmt_Sci.pdf)
- **Self-monitoring and feedback:** pooled effect 0.31; 0.42 when self-monitoring is combined with another feedback technique, versus 0.26 without. **H**. [Michie 2009](https://pubmed.ncbi.nlm.nih.gov/19916637/)
- **Reminders:** the effect is small (text messages d≈0.14), and push notification effects fade over time. No study quantifies notification fatigue, so keep reminders few and user-chosen. **L–M**. [Micro-randomised trial](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6293241/)
- **Short sessions:** exercise "snacks" of 5 minutes or less had 83–91% adherence. **M**. [BJSM 2025](https://blogs.bmj.com/bjsm/2025/10/24/exercise-snacks-small-bouts-big-benefits/)
- **Motivation:** autonomous (intrinsic) motivation predicts long-term adherence better than rewards. **M**. [Teixeira 2012](https://pubmed.ncbi.nlm.nih.gov/22726453/)
- **Gamification:** g=0.42 on steps, with wide uncertainty. **M–L**. [Mazeas 2022](https://www.jmir.org/2022/1/E26779/)

---

## 3. Implications for the app

1. **Make loading the centrepiece.** Add rep-based and isometric moves with tempo and load, Andersen-style 2-minute band routines, and wrist-extensor loading for the elbow. Keep stretches and glides as supporting options.
2. **Guide by pain.** Keep exercise pain at about 5/10 or less and settled by the next morning. Suggest concrete progress steps after a calm fortnight, and suggest easing off when pain runs high. Call it a guideline.
3. **Measure function, not just pain.** Take a PSFS baseline and repeat it every 14 days, showing change against the ~2-point threshold. Offer a printable summary for a clinician.
4. **Screen for red flags.** Ask during check-ins, and prompt a review when there is no improvement after about 6 weeks of consistent practice.
5. **Plan for lapses.**
   - Turn each cue into an if-then plan with a fallback ("if I can't, I'll do the 2-minute version").
   - Nudge "never miss twice" after one miss.
   - Offer fresh starts at month start or after a gap.
   - Show habit progress that does not reset on a single miss.
6. **Keep the minimum dose tiny.** The 2-minute version counts.
7. **Keep reminders few and user-scheduled; skip badges and rewards.**
8. **Educate briefly and honestly.** Cover activity modification rather than avoidance, arm support and the mouse, stress and pacing, and what does not work (splints, posture fixes, stretching alone).
