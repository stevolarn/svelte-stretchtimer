import type { PainArea, Routine, StockStretch, Stretch } from './types';
import { muscleLabels, musclesFor, stockFor } from './muscles.ts';

/** Finer-grained tags than area, worked out from each movement's name and cues. */
export type Focus = 'neck' | 'shoulders' | 'elbow' | 'wrist-hand' | 'back' | 'core' | 'hips' | 'legs';
export type Equipment = 'none' | 'band' | 'finger-band' | 'dumbbell' | 'flexbar' | 'wall' | 'chair' | 'ball' | 'bar';

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
	flexbar: 'FlexBar or towel',
	wall: 'Wall or door',
	chair: 'Chair or desk',
	ball: 'Soft ball',
	bar: 'Pull-up bar'
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
	'dynamic-controlled-butt-kicks': ['legs'],
	'dynamic-side-bend': ['back', 'core'],
	'dynamic-gate-openers': ['hips'],
	'dynamic-knee-hugs': ['hips', 'legs'],
	'dynamic-side-lunges': ['hips', 'legs'],
	'dynamic-wide-trunk-circles': ['back', 'core', 'hips'],
	'dynamic-zombie-walks': ['legs', 'hips'],
	'dynamic-toe-touch-twist': ['back', 'legs', 'core'],
	'iso-airplane': ['legs', 'hips', 'back'],
	'iso-aquaman': ['back', 'hips', 'shoulders'],
	'iso-back-leg-raise': ['hips', 'legs'],
	'iso-bent-arm-pike': ['shoulders', 'core'],
	'iso-chair-cactus': ['shoulders', 'back'],
	'iso-dead-hang': ['shoulders', 'back', 'wrist-hand'],
	'iso-dip-hold': ['shoulders', 'elbow'],
	'iso-elbow-pike': ['shoulders', 'core'],
	'iso-elbow-plank-leg-lift': ['core', 'hips'],
	'iso-elbow-side-plank-leg-lift': ['core', 'hips'],
	'iso-front-leg-raise': ['hips', 'legs', 'core'],
	'iso-hand-plank-leg-lift': ['core', 'hips', 'shoulders'],
	'iso-hand-side-plank': ['core', 'shoulders'],
	'iso-hand-side-plank-leg-lift': ['core', 'hips', 'shoulders'],
	'iso-leg-lift': ['core', 'hips'],
	'iso-lying-side-leg-raise': ['hips', 'core'],
	'iso-lying-toe-touch': ['core', 'legs'],
	'iso-narrow-push-up': ['shoulders', 'elbow', 'core'],
	'iso-pelvic-tilt': ['core', 'back'],
	'iso-pike': ['shoulders', 'core', 'legs'],
	'iso-reverse-plank': ['core', 'hips', 'shoulders'],
	'iso-reverse-plank-leg-lift': ['core', 'hips', 'shoulders'],
	'iso-reverse-table-top': ['hips', 'shoulders'],
	'iso-side-leg-raise': ['hips', 'legs'],
	'iso-single-arm-plank': ['core', 'shoulders'],
	'sl-deadlift-stretch': ['legs', 'hips', 'back'],
	'iso-spiderman-push-up': ['shoulders', 'core', 'hips'],
	'iso-v-sit': ['core', 'hips'],
	'iso-wall-handstand': ['shoulders', 'core'],
	'iso-wall-pike': ['shoulders', 'core', 'legs'],
	'iso-wall-plank': ['core', 'shoulders'],
	'dynamic-ball-squeeze': ['wrist-hand', 'elbow'],
	'dynamic-ball-pinch': ['wrist-hand'],
	'iso-ball-squeeze-hold': ['wrist-hand', 'elbow'],
	'mob-ball-roll': ['wrist-hand', 'elbow'],
	'static-upward-salute': ['shoulders', 'back'],
	'static-chair-overhead-reach': ['shoulders', 'back'],
	'static-standing-diver': ['back', 'legs'],
	'static-bear-hug': ['shoulders', 'back'],
	'static-cactus-arms': ['shoulders'],
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
	'iso-band-bicep-tricep': ['elbow', 'shoulders'],
	'iso-loop-band-overhead': ['shoulders', 'back'],
	'iso-loop-band-behind-back': ['shoulders', 'back'],
	'iso-palm-press': ['shoulders'],
	'iso-doorway-pec-press': ['shoulders'],
	'iso-wall-push-up-hold': ['shoulders', 'elbow'],
	'iso-band-chest-press': ['shoulders', 'elbow'],
	'iso-doorframe-internal-rotation': ['shoulders'],
	'iso-wall-shoulder-flexion': ['shoulders'],
	'iso-wall-shoulder-abduction': ['shoulders'],
	'iso-wall-shoulder-extension': ['shoulders', 'back'],
	'iso-band-lateral-raise': ['shoulders'],
	'iso-band-front-raise': ['shoulders'],
	'iso-band-overhead-press': ['shoulders', 'elbow'],
	'iso-band-row-hold': ['back', 'shoulders'],
	'iso-band-face-pull': ['shoulders', 'back'],
	'iso-self-curl-hold': ['elbow'],
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
	'ecc-tyler-twist': ['elbow', 'wrist-hand'],
	'ecc-reverse-tyler-twist': ['elbow', 'wrist-hand'],
	'dynamic-band-shrugs': ['neck', 'shoulders'],
	'dynamic-band-lateral-raise': ['shoulders'],
	'dynamic-band-row': ['shoulders', 'back'],
	'dynamic-band-reverse-fly': ['shoulders', 'back'],
	'dynamic-band-wrist-extension': ['elbow', 'wrist-hand'],
	'mob-pendulum-swings': ['shoulders'],
	'iso-doorframe-external-rotation': ['shoulders'],
	'dynamic-forearm-wall-slides': ['shoulders', 'back'],
	'dynamic-prone-ytw': ['shoulders', 'back'],
	'iso-prone-cobra': ['back', 'shoulders', 'neck'],
	'static-towel-roll-chest': ['shoulders', 'back'],
	'static-reach-round': ['back', 'shoulders'],
	'loop-band-external-rotation': ['shoulders'],
	'loop-band-overhead-pull-down': ['shoulders', 'back'],
	'loop-band-behind-back-pull-apart': ['shoulders', 'back'],
	'loop-band-lateral-leg-raise': ['hips', 'legs'],
	'loop-band-front-leg-raise': ['hips', 'legs'],
	'loop-band-wide-squat': ['legs', 'hips'],
	'loop-band-supine-abduction': ['hips'],
	'loop-band-straight-leg-abduction': ['hips'],
	'loop-band-scissor-kicks': ['core', 'hips']
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
		if (/flexbar|tyler/.test(t)) found.push('flexbar');
		if (/finger-band|thumb-band|finger band|thumb band/.test(t)) found.push('finger-band');
		else if (/\bband\b|band-/.test(t)) found.push('band');
		if (/\bwall\b|doorway|door ?frame/.test(t)) found.push('wall');
		if (/\bball\b/.test(t)) found.push('ball');
		if (/pull-up bar|dead-hang/.test(t)) found.push('bar');
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
		...equipmentOf(s).map((e) => equipmentLabels[e]),
		...musclesFor(s).map((m) => muscleLabels[m]),
		s.defaultReps ? 'reps' : 'hold'
	]
		.join(' ')
		.toLowerCase();
}

/** The body focus that covers each pain area you can log. */
export const painAreaFocus: Record<PainArea, Focus> = {
	'wrist-hand': 'wrist-hand',
	thumb: 'wrist-hand',
	'forearm-elbow': 'elbow',
	neck: 'neck',
	shoulder: 'shoulders',
	'upper-back': 'back',
	fingers: 'wrist-hand',
	chest: 'shoulders',
	'lower-back': 'back',
	hip: 'hips',
	knee: 'legs',
	'ankle-foot': 'legs'
};

/** Focus for a stretch inside a routine: its library entry's, else guessed from its name. */
export function stretchFocus(s: Pick<Stretch, 'name' | 'iconKey'>): Focus[] {
	const stock = stockFor(s);
	if (stock) return focusOf(stock);
	const t = s.name.toLowerCase().replace(/-/g, ' ');
	return focusRules.filter(([, re]) => re.test(t)).map(([f]) => f);
}

export function stretchEquipment(s: Pick<Stretch, 'name' | 'iconKey'>): Equipment[] {
	const stock = stockFor(s);
	return stock ? equipmentOf(stock) : ['none'];
}

/** Every focus a routine covers, most-hit first. */
export function routineFocus(r: Pick<Routine, 'stretches'>): Focus[] {
	const counts = new Map<Focus, number>();
	for (const s of r.stretches) for (const f of stretchFocus(s)) counts.set(f, (counts.get(f) ?? 0) + 1);
	return [...counts].toSorted((a, b) => b[1] - a[1]).map(([f]) => f);
}

/** Kit a routine needs beyond the floor. */
export function routineEquipment(r: Pick<Routine, 'stretches'>): Equipment[] {
	return [...new Set(r.stretches.flatMap((s) => stretchEquipment(s)))].filter((e) => e !== 'none');
}
