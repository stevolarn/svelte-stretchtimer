import type { StockStretch } from './types';

/** Finer-grained tags than area, worked out from each movement's name and cues. */
export type Focus = 'neck' | 'shoulders' | 'elbow' | 'wrist-hand' | 'back' | 'core' | 'hips' | 'legs';
export type Equipment = 'none' | 'band' | 'finger-band' | 'dumbbell' | 'wall' | 'chair';

export const focusLabels: Record<Focus, string> = {
	neck: 'Neck',
	shoulders: 'Shoulders & chest',
	elbow: 'Elbow & forearm',
	'wrist-hand': 'Wrist & hand',
	back: 'Back',
	core: 'Core',
	hips: 'Hips',
	legs: 'Legs & feet'
};

export const equipmentLabels: Record<Equipment, string> = {
	none: 'No equipment',
	band: 'Resistance band',
	'finger-band': 'Finger band',
	dumbbell: 'Dumbbell',
	wall: 'Wall or door',
	chair: 'Chair or desk'
};

const focusRules: Array<[Focus, RegExp]> = [
	['neck', /\bneck|chin|scalene|levator|upper trap|cervical/],
	['shoulders', /shoulder|\bpecs?\b|chest|doorway|rotator|scapula|shrug|arm circle|\btriceps?|\bbiceps?|wall angel|thoracic outlet/],
	['elbow', /elbow|forearm|pronation|supination|nerve glide/],
	['wrist-hand', /wrist|finger|thumb|\bhands?\b|forearm|\bgrip|pronation|supination|deviation|tendon glide|prayer|nerve glide/],
	['back', /\bback\b|spine|spinal|thoracic|cat|cobra|twist|lumbar|\btorso|child/],
	['core', /\bcore\b|plank|\babs\b|abdominal|dead bug|bird dog|hollow|crunch|diaphragm/],
	['hips', /\bhips?\b|glute|pigeon|piriformis|groin|adductor|butterfly|hip flexor|bridge/],
	['legs', /hamstring|\bquads?\b|calf|calves|ankle|\bknees?\b|\blegs?\b|shin|lunge|squat|\bfeet\b|\bfoot|\btoes?\b/]
];

/** Movements whose names don't say what they work. */
const focusOverrides: Record<string, Focus[]> = {
	'static-standing-side-bend': ['back', 'core'],
	'static-forward-fold': ['legs', 'back'],
	'static-puppy-pose': ['shoulders', 'back'],
	'static-sphinx': ['back'],
	'static-reclined-figure-four': ['hips'],
	'static-couch-stretch': ['hips', 'legs'],
	'static-seated-forward-fold': ['legs', 'back'],
	'dynamic-worlds-greatest': ['hips', 'back', 'legs'],
	'dynamic-inchworm': ['legs', 'core', 'shoulders'],
	'iso-wall-sit': ['legs'],
	'iso-superman-hold': ['back'],
	'iso-plank': ['core', 'shoulders'],
	'iso-push-up-hold': ['shoulders', 'core'],
	'iso-band-pull-apart': ['shoulders'],
	'iso-band-external-rotation': ['shoulders'],
	'iso-band-serratus-wall-press': ['shoulders'],
	'cali-push-ups': ['shoulders', 'core'],
	'cali-chair-dips': ['shoulders'],
	'cali-bear-crawl-hold': ['core', 'shoulders'],
	'yoga-downward-dog': ['shoulders', 'legs'],
	'yoga-warrior-two': ['legs', 'hips'],
	'yoga-triangle': ['legs', 'hips', 'back'],
	'yoga-tree-pose': ['legs'],
	'yoga-happy-baby': ['hips'],
	'yoga-lizard': ['hips'],
	'yoga-chair-pose': ['legs'],
	'cardio-jumping-jacks': ['legs'],
	'cardio-butt-kicks': ['legs'],
	'cardio-mountain-climbers': ['core', 'legs'],
	'cardio-skater-hops': ['legs'],
	'cardio-shadow-boxing': ['shoulders', 'core'],
	'iso-hand-wrist-extension': ['elbow', 'wrist-hand'],
	'iso-hand-wrist-flexion': ['elbow', 'wrist-hand'],
	'ecc-tennis-elbow': ['elbow', 'wrist-hand'],
	'ecc-golfers-elbow': ['elbow', 'wrist-hand'],
	'mob-pendulum-swings': ['shoulders'],
	'iso-doorframe-external-rotation': ['shoulders'],
	'dynamic-forearm-wall-slides': ['shoulders', 'back'],
	'dynamic-prone-ytw': ['shoulders', 'back'],
	'iso-prone-cobra': ['back', 'shoulders', 'neck'],
	'static-towel-roll-chest': ['shoulders', 'back'],
	'static-reach-round': ['back', 'shoulders']
};

function text(s: StockStretch): string {
	return `${s.name} ${s.description}`.toLowerCase();
}

const focusCache = new Map<string, Focus[]>();
const equipmentCache = new Map<string, Equipment[]>();

export function focusOf(s: StockStretch): Focus[] {
	let hit = focusCache.get(s.id);
	if (!hit) {
		// Names and ids are precise; cues mention hands and feet for nearly everything.
		const t = `${s.id} ${s.name}`.toLowerCase().replace(/-/g, ' ');
		hit = focusOverrides[s.id] ?? focusRules.filter(([, re]) => re.test(t)).map(([f]) => f);
		focusCache.set(s.id, hit);
	}
	return hit;
}

export function equipmentOf(s: StockStretch): Equipment[] {
	let hit = equipmentCache.get(s.id);
	if (!hit) {
		const t = `${s.id} ${text(s)}`;
		const found: Equipment[] = [];
		if (/dumbbell/.test(t)) found.push('dumbbell');
		if (/finger-band|thumb-band|finger band|thumb band/.test(t)) found.push('finger-band');
		else if (/\bband\b|band-/.test(t)) found.push('band');
		if (/\bwall\b|doorway|door ?frame/.test(t)) found.push('wall');
		if (s.id !== 'yoga-chair-pose' && /chair|\bdesk\b/.test(t)) found.push('chair');
		hit = found.length ? found : ['none'];
		equipmentCache.set(s.id, hit);
	}
	return hit;
}

/** Everything a search query should be able to hit for this movement. */
export function searchText(s: StockStretch): string {
	return [
		s.name,
		s.description,
		s.type,
		s.position,
		s.area,
		...focusOf(s).map((f) => focusLabels[f]),
		...equipmentOf(s).map((e) => equipmentLabels[e])
	]
		.join(' ')
		.toLowerCase();
}
