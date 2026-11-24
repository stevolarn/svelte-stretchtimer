// Short "Learn" notes shown on the Learn page and as the Home tip card.
// Content is drawn from docs/research.md. It is general guidance, not a
// diagnosis, and the evidence rating on each lesson is deliberately modest.

export interface Lesson {
	id: string;
	title: string;
	/** One line (90 characters or fewer) shown on the Home tip card. */
	summary: string;
	/** Short paragraphs. */
	body: string[];
	evidence: 'strong' | 'moderate' | 'limited';
	sources: { label: string; url: string }[];
}

export const lessons: Lesson[] = [
	{
		id: 'loading',
		title: 'Loading helps more than stretching alone',
		summary: 'Gentle strengthening has better evidence than stretching on its own.',
		evidence: 'moderate',
		body: [
			'For neck and shoulder pain, strengthening has the better evidence. A Cochrane review found moderate-certainty evidence for strengthening the neck, shoulder and shoulder-blade muscles, and only low-certainty evidence for stretching on its own.',
			'Small amounts seem to be enough. In a trial of 198 people, elastic-band training for 2 or 12 minutes a day, 5 days a week, for 10 weeks cut pain by about 1.4 points out of 10 compared with a control group. The 2-minute dose was reportedly about as good as the 12-minute one.',
			'For tennis elbow, resisted wrist-extensor exercises are the core treatment in clinical guidelines.',
			'Stretches and nerve or tendon glides are still fine if they feel good. Treat them as comfort options rather than cures.'
		],
		sources: [
			{
				label: 'Cochrane 2015: exercises for mechanical neck disorders',
				url: 'https://www.cochrane.org/evidence/CD004250_exercises-mechanical-neck-disorders'
			},
			{
				label: 'Andersen 2011: small daily amounts of resistance training',
				url: 'https://research.regionh.dk/da/publications/effectiveness-of-small-daily-amounts-of-progressive-resistance-tr/'
			},
			{
				label: 'APTA clinical guideline: lateral elbow pain',
				url: 'https://www.apta.org/patient-care/evidence-based-practice-resources/cpgs/lateral-elbow-pain-and-muscle-function-impairments'
			},
			{
				label: '2024 review: strengthening for office workers with neck pain',
				url: 'https://pubmed.ncbi.nlm.nih.gov/38219373/'
			}
		]
	},
	{
		id: 'pain-rule',
		title: 'How much pain is OK while exercising?',
		summary: 'Up to about 5/10 is fine if it settles by the next morning.',
		evidence: 'limited',
		body: [
			'A common clinical guideline says pain during exercise of up to about 5 out of 10 is acceptable, as long as it is back to normal within 24 hours. In an Achilles tendon trial, people who kept loading under this approach did no worse than people who rested.',
			'No trial has tested the exact cut-off, so treat it as a sensible guide rather than a rule.',
			'The app uses the same idea. Green is 0 to 2, amber is 3 to 5 (fine if it settles) and red is 6 or more, which is a sign to ease off. The next-morning check is there to see whether things have settled.'
		],
		sources: [
			{
				label: 'BMJ 2011 clinical review',
				url: 'https://www.bmj.com/content/342/bmj.d2687.full.pdf'
			},
			{
				label: 'NHS Plymouth: tennis elbow leaflet',
				url: 'https://www.plymouthhospitals.nhs.uk/display-pil/pil-tennis-elbow-4079'
			}
		]
	},
	{
		id: 'one-miss',
		title: 'One missed day is not a failure',
		summary: 'A single miss does not undo a habit. Just try not to miss twice.',
		evidence: 'moderate',
		body: [
			'In a study of habit formation, a habit took 66 days to form on average, with a range of 18 to 254 days. Exercise took longer than simpler habits such as drinking water.',
			'One missed day did not affect how well the habit formed. "Don’t miss twice" is a handy rule of thumb, although no trial has tested it directly.',
			'Short sessions are easier to keep up. Exercise "snacks" of 5 minutes or less had 83 to 91% adherence, so the 2-minute version counts.',
			'Reserve days exist because a streak you can repair seems to hurt less when it breaks.'
		],
		sources: [
			{
				label: 'UCL: how long does it take to form a habit?',
				url: 'https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit'
			},
			{
				label: 'Singh 2024: time to form a habit',
				url: 'https://pubmed.ncbi.nlm.nih.gov/39685110/'
			},
			{
				label: 'Emergency reserves (Sharif & Shu)',
				url: 'https://anderson-review.ucla.edu/emergency-reserves/'
			},
			{
				label: 'INSEAD: consumer streaks',
				url: 'https://knowledge.insead.edu/marketing/consumer-streaks-are-motivating-key-keeping-them-alive'
			},
			{
				label: 'BJSM 2025: exercise snacks',
				url: 'https://blogs.bmj.com/bjsm/2025/10/24/exercise-snacks-small-bouts-big-benefits/'
			}
		]
	},
	{
		id: 'if-then',
		title: 'Tie it to something you already do',
		summary: 'An "after I…, I’ll…" plan makes follow-through more likely.',
		evidence: 'strong',
		body: [
			'Plans in the form "After I [existing habit], I’ll [my routine]" help people follow through. A large review of 94 tests found a medium-to-large effect (d = 0.65) compared with simply intending to do something, although most of the studies were short-term.',
			'Pick something you already do every day, such as making a coffee or closing your laptop, and attach your routine to it.',
			'Choose a fallback as well: "If I can’t, I’ll do the 2-minute version."'
		],
		sources: [
			{
				label: 'Gollwitzer & Sheeran 2006: implementation intentions',
				url: 'https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f'
			},
			{
				label: '2023 meta-analysis: habit-formation interventions',
				url: 'https://pubmed.ncbi.nlm.nih.gov/37700303/'
			}
		]
	},
	{
		id: 'modify-dont-avoid',
		title: 'Adjust how you use your hands, don’t avoid them',
		summary: 'Vary tasks and spread the load rather than stopping everything.',
		evidence: 'limited',
		body: [
			'Guidelines tend to favour adjusting how you use your hands over avoiding using them.',
			'Vary your tasks, and break up long stints of one grip or one movement. Keyboard or voice alternatives may help spread the load, although there is no direct evidence for that.',
			'When you go back to heavier tasks, do it gradually.'
		],
		sources: [
			{
				label: 'NHS: repetitive strain injury (RSI)',
				url: 'https://www.nhs.uk/conditions/repetitive-strain-injury-rsi/'
			}
		]
	},
	{
		id: 'arm-support-mouse',
		title: 'Arm support and a different mouse',
		summary: 'Together they roughly halved neck and shoulder problems in trials.',
		evidence: 'moderate',
		body: [
			'A Cochrane review of ergonomic changes for office workers found that arm support combined with an alternative mouse roughly halved neck and shoulder disorders (moderate certainty).',
			'Other changes did less well. Sit-stand desks and general workstation adjustment showed no effect on their own, and ergonomics training alone was low certainty.',
			'If you can only change one thing, a supported forearm and a mouse that suits your hand are worth a look.'
		],
		sources: [
			{
				label: 'Cochrane 2018: ergonomic interventions for office workers',
				url: 'https://www.cochrane.org/evidence/CD008570_ergonomic-interventions-preventing-work-related-musculoskeletal-disorders-upper-limb-and-neck-among-office'
			}
		]
	},
	{
		id: 'stress-sleep-pacing',
		title: 'Stress, sleep and pacing your days',
		summary: 'Stress and workload are the most consistent risk factors.',
		evidence: 'limited',
		body: [
			'In the research, stress and high job demands are the most consistent risk factors for neck and arm pain. This comes from observational studies, so it shows a link rather than proving a cause. Heavy phone use has also been linked with neck pain, again from observational data.',
			'The studies behind these notes didn’t cover sleep, so there is no claim about it here. Still, protecting your rest is a kind thing to do for yourself on a hard week.',
			'Pacing is a sensible idea rather than a proven one. On heavy days, try mixing demanding tasks with lighter ones and leaving some slack in the day.'
		],
		sources: [
			{
				label: 'Review of risk factors for neck pain',
				url: 'https://pubmed.ncbi.nlm.nih.gov/39764644/'
			}
		]
	},
	{
		id: 'what-not-to-expect',
		title: 'What not to expect',
		summary: 'Splints, tape and posture fixes have weaker evidence than you might think.',
		evidence: 'limited',
		body: [
			'Wrist splints for carpal tunnel gave little or no short-term benefit in a 2023 Cochrane review (low certainty), although night splints are still recommended in a 2026 guideline. Kinesiotape showed no lasting benefit.',
			'Posture correction and "text neck" claims rest on observational data. Nerve glides are unproven for carpal tunnel, and for cubital tunnel, splinting plus activity change is supported only by low-quality evidence.',
			'For De Quervain’s, an injection plus a thumb splint is best supported, with exercise as an add-on. Pain education on its own has shown no clear overall benefit.',
			'None of this means these things can never help, only that the evidence is weak. Talk to a clinician before relying on any of them.'
		],
		sources: [
			{
				label: 'Cochrane 2023: splinting for carpal tunnel',
				url: 'https://pubmed.ncbi.nlm.nih.gov/36848651/'
			},
			{
				label: 'Cochrane 2012: nerve and tendon gliding for carpal tunnel',
				url: 'https://pubmed.ncbi.nlm.nih.gov/22696387/'
			},
			{
				label: 'De Quervain’s tenosynovitis treatments',
				url: 'https://pubmed.ncbi.nlm.nih.gov/28860097/'
			},
			{
				label: 'Cubital tunnel syndrome: conservative treatment',
				url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6589621'
			},
			{
				label: 'Frontiers 2023: pain education umbrella review',
				url: 'https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2023.1272068/full'
			}
		]
	},
	{
		id: 'when-to-get-checked',
		title: 'When to get it checked',
		summary: 'Some signs mean a GP or physio visit, and a few mean the same day.',
		evidence: 'moderate',
		body: [
			'See a GP or physio soon if the pain is not settling or is getting worse, numbness or tingling spreads or lasts, you notice weakness or keep dropping things, you have night pain or constant pain unrelated to movement, or you are no better after about 6 weeks of consistent work.',
			'Get same-day or urgent help if you have clumsy hands or balance problems, pain after a fall or injury, a hot, red or swollen area or a fever, or new pain alongside a history of cancer or unexplained weight loss.',
			'This app cannot tell what is going on in your body. If something feels wrong, trust that and get it checked.'
		],
		sources: [
			{
				label: 'NHS: repetitive strain injury (RSI)',
				url: 'https://www.nhs.uk/conditions/repetitive-strain-injury-rsi/'
			},
			{
				label: 'GPnotebook: red flags in neck pain',
				url: 'https://gpnotebook.com/en-GB/pages/rheumatology/red-flags-in-neck-pain'
			}
		]
	}
];

/**
 * The lesson for the week containing `today` ('YYYY-MM-DD'). Weeks are
 * Monday-aligned (1970-01-01 was a Thursday), so it changes each Monday and
 * cycles through the list.
 */
export function lessonOfWeek(today: string): Lesson {
	const [y, m, d] = today.split('-').map(Number);
	const days = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
	const week = Math.floor((days + 3) / 7);
	const n = lessons.length;
	return lessons[((week % n) + n) % n];
}
