import type { PainArea, PainEntry, PainSide, PainSpotEntry, PainType } from './types.ts';

/** Coarse areas: what routines, filters and older entries use. Each fine spot rolls up to one. */
export const PAIN_AREAS: { id: PainArea; label: string }[] = [
	{ id: 'head-jaw', label: 'Head & jaw' },
	{ id: 'neck', label: 'Neck' },
	{ id: 'shoulder', label: 'Shoulder' },
	{ id: 'upper-arm', label: 'Upper arm' },
	{ id: 'upper-back', label: 'Upper back' },
	{ id: 'chest', label: 'Chest' },
	{ id: 'forearm-elbow', label: 'Forearm & elbow' },
	{ id: 'wrist-hand', label: 'Wrist & hand' },
	{ id: 'thumb', label: 'Thumb' },
	{ id: 'fingers', label: 'Fingers' },
	{ id: 'lower-back', label: 'Lower back' },
	{ id: 'hip', label: 'Hip' },
	{ id: 'thigh', label: 'Thigh' },
	{ id: 'knee', label: 'Knee' },
	{ id: 'calf-shin', label: 'Calf & shin' },
	{ id: 'ankle-foot', label: 'Ankle & foot' }
];

export function isPainArea(value: unknown): value is PainArea {
	return PAIN_AREAS.some((a) => a.id === value);
}

export function painAreaLabel(id: PainArea): string {
	return PAIN_AREAS.find((a) => a.id === id)?.label ?? id;
}

export type SpotRegion = 'Head & neck' | 'Shoulder & chest' | 'Arm' | 'Wrist & hand' | 'Back' | 'Hip & thigh' | 'Knee & lower leg' | 'Foot';

export interface PainSpot {
	id: string;
	label: string;
	region: SpotRegion;
	area: PainArea;
	/** has a left and a right (most spots); false for midline spots like the tailbone */
	sided: boolean;
	/**
	 * Where it sits on the body map. `dx` is the distance from the midline toward the
	 * person's left, `y` the height, in the BodyMap's 120 × 240 frame. Missing = list only
	 * (too small to tap on a whole-body map, e.g. single fingers).
	 */
	map?: { view: 'front' | 'back'; dx: number; y: number };
	/** for list-only spots: the map spot whose dot shows them */
	proxy?: string;
}

const s = (
	id: string,
	label: string,
	region: SpotRegion,
	area: PainArea,
	map?: PainSpot['map'],
	sided = true
): PainSpot => ({ id, label, region, area, sided, ...(map && { map }) });

/** List-only spots are drawn on the map at a nearby spot's dot. */
const PROXIES: Record<string, string> = {
	'wrist-thumb-side': 'wrist-palm',
	'wrist-pinky-side': 'wrist-palm',
	'thumb-base': 'palm',
	thumb: 'fingers-all',
	'finger-index': 'fingers-all',
	'finger-middle': 'fingers-all',
	'finger-ring': 'fingers-all',
	'finger-little': 'fingers-all'
};

export const PAIN_SPOTS: PainSpot[] = [
	// Head & neck
	s('temple', 'Head / temple', 'Head & neck', 'head-jaw', { view: 'front', dx: 9, y: 14 }),
	s('jaw', 'Jaw', 'Head & neck', 'head-jaw', { view: 'front', dx: 7, y: 27 }),
	s('back-of-head', 'Back of head', 'Head & neck', 'head-jaw', { view: 'back', dx: 0, y: 16 }, false),
	s('neck-front', 'Front of neck', 'Head & neck', 'neck', { view: 'front', dx: 0, y: 39 }, false),
	s('neck-side', 'Side of neck', 'Head & neck', 'neck', { view: 'back', dx: 6, y: 36 }),
	s('neck-back', 'Back of neck', 'Head & neck', 'neck', { view: 'back', dx: 0, y: 39 }, false),
	s('upper-trap', 'Top of shoulder (trap)', 'Head & neck', 'neck', { view: 'back', dx: 13, y: 46 }),
	// Shoulder & chest
	s('shoulder-front', 'Front of shoulder', 'Shoulder & chest', 'shoulder', { view: 'front', dx: 20, y: 52 }),
	s('shoulder-outer', 'Outer shoulder', 'Shoulder & chest', 'shoulder', { view: 'front', dx: 26, y: 56 }),
	s('shoulder-back', 'Back of shoulder', 'Shoulder & chest', 'shoulder', { view: 'back', dx: 25, y: 55 }),
	s('shoulder-blade', 'Shoulder blade', 'Shoulder & chest', 'shoulder', { view: 'back', dx: 14, y: 64 }),
	s('chest', 'Chest', 'Shoulder & chest', 'chest', { view: 'front', dx: 10, y: 64 }),
	s('ribs', 'Ribs', 'Shoulder & chest', 'chest', { view: 'front', dx: 14, y: 84 }),
	s('breastbone', 'Breastbone', 'Shoulder & chest', 'chest', { view: 'front', dx: 0, y: 66 }, false),
	// Arm
	s('biceps', 'Biceps', 'Arm', 'upper-arm', { view: 'front', dx: 28, y: 74 }),
	s('triceps', 'Triceps', 'Arm', 'upper-arm', { view: 'back', dx: 28, y: 74 }),
	s('elbow-inner', 'Inner elbow', 'Arm', 'forearm-elbow', { view: 'front', dx: 31, y: 95 }),
	s('elbow-outer', 'Outer elbow', 'Arm', 'forearm-elbow', { view: 'back', dx: 32, y: 95 }),
	s('forearm-under', 'Forearm, palm side', 'Arm', 'forearm-elbow', { view: 'front', dx: 33, y: 113 }),
	s('forearm-top', 'Forearm, back', 'Arm', 'forearm-elbow', { view: 'back', dx: 33, y: 113 }),
	// Wrist & hand
	s('wrist-palm', 'Wrist, palm side', 'Wrist & hand', 'wrist-hand', { view: 'front', dx: 35, y: 132 }),
	s('wrist-back', 'Wrist, back', 'Wrist & hand', 'wrist-hand', { view: 'back', dx: 35, y: 132 }),
	s('wrist-thumb-side', 'Wrist, thumb side', 'Wrist & hand', 'wrist-hand'),
	s('wrist-pinky-side', 'Wrist, little-finger side', 'Wrist & hand', 'wrist-hand'),
	s('palm', 'Palm', 'Wrist & hand', 'wrist-hand', { view: 'front', dx: 36, y: 144 }),
	s('hand-back', 'Back of hand', 'Wrist & hand', 'wrist-hand', { view: 'back', dx: 36, y: 144 }),
	s('thumb-base', 'Base of thumb', 'Wrist & hand', 'thumb'),
	s('thumb', 'Thumb', 'Wrist & hand', 'thumb'),
	s('finger-index', 'Index finger', 'Wrist & hand', 'fingers'),
	s('finger-middle', 'Middle finger', 'Wrist & hand', 'fingers'),
	s('finger-ring', 'Ring finger', 'Wrist & hand', 'fingers'),
	s('finger-little', 'Little finger', 'Wrist & hand', 'fingers'),
	s('fingers-all', 'Several fingers', 'Wrist & hand', 'fingers', { view: 'front', dx: 37, y: 154 }),
	// Back
	s('between-blades', 'Between the shoulder blades', 'Back', 'upper-back', { view: 'back', dx: 0, y: 62 }, false),
	s('mid-back', 'Mid back', 'Back', 'upper-back', { view: 'back', dx: 0, y: 84 }, false),
	s('lower-back', 'Lower back', 'Back', 'lower-back', { view: 'back', dx: 6, y: 104 }),
	s('tailbone', 'Tailbone', 'Back', 'lower-back', { view: 'back', dx: 0, y: 121 }, false),
	// Hip & thigh
	s('groin', 'Front of hip / groin', 'Hip & thigh', 'hip', { view: 'front', dx: 9, y: 124 }),
	s('hip-outer', 'Outer hip', 'Hip & thigh', 'hip', { view: 'front', dx: 18, y: 120 }),
	s('glute', 'Buttock', 'Hip & thigh', 'hip', { view: 'back', dx: 10, y: 128 }),
	s('thigh-front', 'Front of thigh', 'Hip & thigh', 'thigh', { view: 'front', dx: 13, y: 146 }),
	s('thigh-inner', 'Inner thigh', 'Hip & thigh', 'thigh', { view: 'front', dx: 6, y: 152 }),
	s('thigh-outer', 'Outer thigh', 'Hip & thigh', 'thigh', { view: 'back', dx: 19, y: 148 }),
	s('hamstring', 'Back of thigh', 'Hip & thigh', 'thigh', { view: 'back', dx: 12, y: 150 }),
	// Knee & lower leg
	s('knee-front', 'Front of knee', 'Knee & lower leg', 'knee', { view: 'front', dx: 13, y: 172 }),
	s('knee-inner', 'Inner knee', 'Knee & lower leg', 'knee', { view: 'front', dx: 7, y: 175 }),
	s('knee-outer', 'Outer knee', 'Knee & lower leg', 'knee', { view: 'front', dx: 19, y: 175 }),
	s('knee-back', 'Back of knee', 'Knee & lower leg', 'knee', { view: 'back', dx: 13, y: 173 }),
	s('shin', 'Shin', 'Knee & lower leg', 'calf-shin', { view: 'front', dx: 13, y: 196 }),
	s('calf', 'Calf', 'Knee & lower leg', 'calf-shin', { view: 'back', dx: 13, y: 193 }),
	// Foot
	s('ankle', 'Ankle', 'Foot', 'ankle-foot', { view: 'front', dx: 13, y: 219 }),
	s('achilles', 'Achilles / heel', 'Foot', 'ankle-foot', { view: 'back', dx: 13, y: 224 }),
	s('foot-top', 'Top of foot / toes', 'Foot', 'ankle-foot', { view: 'front', dx: 15, y: 231 }),
	s('arch', 'Arch / sole', 'Foot', 'ankle-foot', { view: 'back', dx: 14, y: 233 })
];

for (const p of PAIN_SPOTS) if (!p.map && PROXIES[p.id]) p.proxy = PROXIES[p.id];

const spotById = new Map(PAIN_SPOTS.map((p) => [p.id, p]));

/** Map marks keyed by drawn spot: list-only spots fold into their proxy dot (worst score wins). */
export function mapMarks(marks: Record<string, number>): Record<string, number> {
	const out: Record<string, number> = {};
	for (const [key, score] of Object.entries(marks)) {
		const [id, side] = key.split(':');
		const spot = spotById.get(id);
		const drawn = spot?.map ? key : spot?.proxy ? spotKey(spot.proxy, side as PainSide | undefined) : null;
		if (drawn) out[drawn] = Math.max(out[drawn] ?? -1, score);
	}
	return out;
}

export function painSpot(id: string): PainSpot | undefined {
	return spotById.get(id);
}

/** "Left outer elbow", "Tailbone"; an unknown id falls back to itself. */
export function spotLabel(spot: string, side?: PainSide): string {
	const label = spotById.get(spot)?.label ?? spot;
	if (!side) return label;
	return `${side === 'left' ? 'Left' : 'Right'} ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

/** Key for one side of one spot: 'elbow-outer:left', or just 'tailbone'. */
export function spotKey(spot: string, side?: PainSide): string {
	return side ? `${spot}:${side}` : spot;
}

export const PAIN_TYPES: { id: PainType; label: string }[] = [
	{ id: 'aching', label: 'Aching' },
	{ id: 'sharp', label: 'Sharp' },
	{ id: 'burning', label: 'Burning' },
	{ id: 'stiff', label: 'Stiff' },
	{ id: 'throbbing', label: 'Throbbing' },
	{ id: 'shooting', label: 'Shooting' },
	{ id: 'tingling', label: 'Pins & needles' },
	{ id: 'numb', label: 'Numb' },
	{ id: 'weak', label: 'Weak' },
	{ id: 'cramping', label: 'Cramping' }
];

export function isPainType(value: unknown): value is PainType {
	return PAIN_TYPES.some((t) => t.id === value);
}

/** Preset causes; custom ones are stored as their text and remembered in settings. */
export const PAIN_CAUSES: { id: string; label: string }[] = [
	{ id: 'typing', label: 'Typing' },
	{ id: 'phone', label: 'Phone' },
	{ id: 'mouse', label: 'Mouse' },
	{ id: 'gaming', label: 'Gaming' },
	{ id: 'sleep', label: 'Sleep position' },
	{ id: 'lifting', label: 'Lifting' },
	{ id: 'sport', label: 'Sport' },
	{ id: 'driving', label: 'Driving' },
	{ id: 'stress', label: 'Stress' },
	{ id: 'posture', label: 'Posture' },
	{ id: 'cold', label: 'Cold' },
	{ id: 'unknown', label: 'Not sure' }
];

export const PAIN_HELPED: { id: string; label: string }[] = [
	{ id: 'stretching', label: 'Stretching' },
	{ id: 'rest', label: 'Rest' },
	{ id: 'heat', label: 'Heat' },
	{ id: 'ice', label: 'Ice' },
	{ id: 'painkiller', label: 'Painkiller' },
	{ id: 'massage', label: 'Massage' },
	{ id: 'brace', label: 'Brace / splint' },
	{ id: 'movement', label: 'Moving around' },
	{ id: 'break', label: 'Taking a break' },
	{ id: 'nothing', label: 'Nothing helped' }
];

/** Label for a stored cause or "what helped" value: a preset id, else the custom text itself. */
export function tagLabel(value: string): string {
	return (PAIN_CAUSES.find((c) => c.id === value) ?? PAIN_HELPED.find((c) => c.id === value))?.label ?? value;
}

/**
 * Tidy a spot list: known spots only, side only on sided spots (sided spots need one),
 * score 0-10 rounded, one entry per spot+side (the last wins), types de-duplicated.
 */
export function cleanSpots(value: unknown): PainSpotEntry[] {
	if (!Array.isArray(value)) return [];
	const byKey = new Map<string, PainSpotEntry>();
	for (const raw of value) {
		if (!raw || typeof raw !== 'object') continue;
		const r = raw as Record<string, unknown>;
		const spot = typeof r.spot === 'string' ? spotById.get(r.spot) : undefined;
		if (!spot || typeof r.score !== 'number' || !Number.isFinite(r.score)) continue;
		const side = r.side === 'left' || r.side === 'right' ? r.side : undefined;
		if (spot.sided !== Boolean(side)) continue;
		const types = Array.isArray(r.types) ? [...new Set(r.types.filter(isPainType))] : [];
		const entry: PainSpotEntry = {
			spot: spot.id,
			...(side && { side }),
			score: Math.min(10, Math.max(0, Math.round(r.score))),
			...(types.length && { types })
		};
		byKey.set(spotKey(spot.id, side), entry);
	}
	return [...byKey.values()];
}

/** Tidy free-text tags: trimmed, non-empty, max 40 chars, de-duplicated case-insensitively, max 20. */
export function cleanTags(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	const seen = new Set<string>();
	const out: string[] = [];
	for (const v of value) {
		if (typeof v !== 'string') continue;
		const t = v.trim().slice(0, 40);
		if (!t || seen.has(t.toLowerCase())) continue;
		seen.add(t.toLowerCase());
		out.push(t);
	}
	return out.slice(0, 20);
}

/** Coarse areas an entry covers: from its spots when it has them, else its old `areas`. */
export function entryAreas(entry: Pick<PainEntry, 'spots' | 'areas'>): PainArea[] {
	if (entry.spots?.length) {
		return [...new Set(entry.spots.filter((p) => p.score > 0).map((p) => spotById.get(p.spot)?.area).filter((a): a is PainArea => !!a))];
	}
	return entry.areas ?? [];
}

/** Highest score an entry gives an area: the max over its spots there, else the entry score. */
export function entryAreaScore(entry: PainEntry, area: PainArea): number | null {
	if (entry.spots?.length) {
		const scores = entry.spots.filter((p) => spotById.get(p.spot)?.area === area).map((p) => p.score);
		return scores.length ? Math.max(...scores) : null;
	}
	return entry.areas?.includes(area) ? entry.score : null;
}
