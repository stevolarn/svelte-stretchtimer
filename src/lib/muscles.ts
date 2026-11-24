import type { Routine, StockStretch, Stretch } from './types.ts';
import { stockStretches } from './stockStretches.ts';
import { stockMuscles } from './stockMuscles.ts';

/** Muscle groups, roughly head to toe. */
export const muscleList = [
	'neck',
	'upper-traps',
	'chest',
	'front-shoulders',
	'rear-shoulders',
	'rotator-cuff',
	'upper-back',
	'lats',
	'biceps',
	'triceps',
	'forearms',
	'hands',
	'abs',
	'obliques',
	'lower-back',
	'hip-flexors',
	'glutes',
	'outer-hips',
	'adductors',
	'hamstrings',
	'quads',
	'calves',
	'shins-feet'
] as const;

export type Muscle = (typeof muscleList)[number];

export const muscleLabels: Record<Muscle, string> = {
	neck: 'Neck',
	'upper-traps': 'Upper traps',
	chest: 'Chest',
	'front-shoulders': 'Front shoulders',
	'rear-shoulders': 'Rear shoulders',
	'rotator-cuff': 'Rotator cuff',
	'upper-back': 'Upper back',
	lats: 'Lats',
	biceps: 'Biceps',
	triceps: 'Triceps',
	forearms: 'Forearms',
	hands: 'Wrists & hands',
	abs: 'Abs',
	obliques: 'Obliques',
	'lower-back': 'Lower back',
	'hip-flexors': 'Hip flexors',
	glutes: 'Glutes',
	'outer-hips': 'Outer hips',
	adductors: 'Inner thighs',
	hamstrings: 'Hamstrings',
	quads: 'Quads',
	calves: 'Calves',
	'shins-feet': 'Shins, ankles & feet'
};

const known = new Set<string>(muscleList);

export function isMuscle(value: unknown): value is Muscle {
	return typeof value === 'string' && known.has(value);
}

function stockFor(s: Pick<Stretch, 'name' | 'iconKey'>): StockStretch | undefined {
	const name = s.name.trim().toLowerCase();
	return (
		stockStretches.find((item) => item.name.toLowerCase() === name) ??
		(s.iconKey ? stockStretches.find((item) => item.iconKey === s.iconKey) : undefined)
	);
}

/** Muscles a stretch works: the user's own pick, else its library entry (by name, then picture). */
export function musclesFor(s: Pick<Stretch, 'name' | 'iconKey' | 'muscles'> | StockStretch): Muscle[] {
	if ('muscles' in s && s.muscles) return s.muscles.filter(isMuscle);
	if ('defaultSeconds' in s) return stockMuscles[s.id] ?? [];
	const stock = stockFor(s);
	return stock ? (stockMuscles[stock.id] ?? []) : [];
}

/** Muscles across a routine, most-worked first, with how many of its stretches hit each. */
export function routineMuscles(r: Pick<Routine, 'stretches'>): Array<{ muscle: Muscle; count: number }> {
	const counts = new Map<Muscle, number>();
	for (const s of r.stretches) for (const m of new Set(musclesFor(s))) counts.set(m, (counts.get(m) ?? 0) + 1);
	return [...counts]
		.map(([muscle, count]) => ({ muscle, count }))
		.toSorted((a, b) => b.count - a.count || muscleList.indexOf(a.muscle) - muscleList.indexOf(b.muscle));
}
