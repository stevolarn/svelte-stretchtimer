import type { StockStretch } from './types.ts';

export const stockStretches: StockStretch[] = [
	/* --------------------------- Upper Body --------------------------- */
	{
		id: 'neck-release',
		name: 'Neck Release',
		category: 'upper-body',
		description: 'Relax your shoulders and gently tilt your ear toward each shoulder, then slowly look left and right.',
		sides: 'one',
		defaultSeconds: 30,
		iconKey: 'neck-release'
	},
	{
		id: 'shoulder-rolls',
		name: 'Shoulder Rolls',
		category: 'upper-body',
		description: 'Lift shoulders toward your ears and roll smoothly backwards in big circles, then reverse direction.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'shoulder-rolls'
	},
	{
		id: 'chest-opener',
		name: 'Chest Opener',
		category: 'upper-body',
		description: 'Clasp your hands behind your back or place hands on lower back, gently opening the front of your chest.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'chest-opener'
	},
	{
		id: 'wrist-forearm',
		name: 'Wrist & Forearm Stretch',
		category: 'upper-body',
		description: 'Extend your arm straight ahead with palm up/down and use your opposite hand for gentle pressure.',
		sides: 'two',
		defaultSeconds: 30,
		iconKey: 'wrist-forearm'
	},
	{
		id: 'cross-body-shoulder',
		name: 'Cross-Body Shoulder Stretch',
		category: 'upper-body',
		description: 'Bring one arm across your chest and gently draw it closer with the opposite forearm without twisting.',
		sides: 'two',
		defaultSeconds: 30,
		iconKey: 'cross-body-shoulder'
	},
	{
		id: 'overhead-triceps',
		name: 'Overhead Triceps & Lat Stretch',
		category: 'upper-body',
		description: 'Reach one elbow overhead and bend it behind your neck, using the other hand to ease the elbow gently back.',
		sides: 'two',
		defaultSeconds: 30,
		iconKey: 'overhead-triceps'
	},

	/* ------------------------------ Spine ------------------------------ */
	{
		id: 'cat-cow',
		name: 'Cat-Cow Flow',
		category: 'spine',
		description: 'On all fours, inhale as your belly lowers and chest lifts (Cow), exhale as you arch your spine up (Cat).',
		sides: 'one',
		defaultSeconds: 60,
		iconKey: 'cat-cow'
	},
	{
		id: 'childs-pose',
		name: 'Child’s Pose',
		category: 'spine',
		description: 'Sit back onto your heels, lengthen your arms forward on the floor, and let your chest and forehead relax.',
		sides: 'one',
		defaultSeconds: 60,
		iconKey: 'childs-pose'
	},
	{
		id: 'cobra-stretch',
		name: 'Cobra Stretch',
		category: 'spine',
		description: 'Lie face down and gently press through your hands to lift your chest, keeping hips and tops of feet grounded.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'cobra-stretch'
	},
	{
		id: 'standing-side-bend',
		name: 'Standing Side Bend',
		category: 'spine',
		description: 'Reach one arm overhead and lengthen through your ribcage as you gently lean to the opposite side.',
		sides: 'two',
		defaultSeconds: 30,
		iconKey: 'standing-side-bend'
	},
	{
		id: 'seated-spinal-twist',
		name: 'Seated Spinal Twist',
		category: 'spine',
		description: 'Sit tall with legs extended or crossed, rotate smoothly from your mid-back, and look over your shoulder.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'seated-twist'
	},
	{
		id: 'thoracic-rotation',
		name: 'Thoracic Rotation',
		category: 'spine',
		description: 'On all fours or in a half-kneel, place one hand behind your head and rotate your elbow up toward the ceiling.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'thoracic-rotation'
	},

	/* ------------------------------ Hips ------------------------------- */
	{
		id: 'low-lunge',
		name: 'Low Lunge',
		category: 'hips',
		description: 'Step one foot forward into a deep lunge with back knee down; press hips gently forward and keep chest tall.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'low-lunge'
	},
	{
		id: 'pigeon-pose',
		name: 'Figure-Four / Pigeon Pose',
		category: 'hips',
		description: 'Cross one ankle over the opposite knee or fold the front shin onto the mat to open the outer hip and glute.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'pigeon-pose'
	},
	{
		id: 'butterfly-stretch',
		name: 'Butterfly Stretch',
		category: 'hips',
		description: 'Sit upright, bring the soles of your feet together, and let your knees relax naturally toward the ground.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'butterfly-stretch'
	},
	{
		id: 'standing-quad',
		name: 'Standing Quad Stretch',
		category: 'hips',
		description: 'Stand tall on one leg, hold the top of your opposite foot behind you, and tuck your pelvis gently forward.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'quad-stretch'
	},
	{
		id: 'hip-flexor-release',
		name: 'Hip Flexor Release',
		category: 'hips',
		description: 'Half-kneeling with tailbone tucked under, squeeze the glute of the back leg to feel a stretch along the front of the hip.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'hip-flexor-release'
	},
	{
		id: 'happy-baby',
		name: 'Happy Baby Pose',
		category: 'hips',
		description: 'Lie on your back, grab the outside edges of your feet with knees bent wide, and gently draw knees toward the floor.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'happy-baby'
	},

	/* ------------------------------ Legs ------------------------------- */
	{
		id: 'forward-fold',
		name: 'Forward Fold',
		category: 'legs',
		description: 'Hinge from your hips with soft knees, letting your torso hang freely over your legs and releasing head and neck.',
		sides: 'one',
		defaultSeconds: 60,
		iconKey: 'forward-fold'
	},
	{
		id: 'standing-calf',
		name: 'Standing Calf Stretch',
		category: 'legs',
		description: 'Place your hands on a wall, step one leg straight back with heel pressed firmly to the ground, and bend front knee.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'standing-calf'
	},
	{
		id: 'hamstring-fold',
		name: 'Seated Hamstring Fold',
		category: 'legs',
		description: 'Sit with legs extended straight, hinge from your hips with a flat back, and reach gently toward your ankles or toes.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'hamstring-fold'
	},
	{
		id: 'worlds-greatest',
		name: 'World’s Greatest Stretch',
		category: 'legs',
		description: 'Step into a runner’s lunge, place opposite hand on floor, rotate outside arm toward the sky, and sink hips.',
		sides: 'two',
		defaultSeconds: 60,
		iconKey: 'worlds-greatest'
	},
	{
		id: 'overhead-reach',
		name: 'Full-Body Overhead Reach',
		category: 'legs',
		description: 'Stand with feet hip-width, interlace fingers overhead, and reach as tall as possible from heels through fingertips.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'overhead-reach'
	}
];

/** Map of name keywords to icon keys for matching custom/existing stretch names. */
const keywordMap: Record<string, string> = {
	neck: 'neck-release',
	shoulder: 'shoulder-rolls',
	chest: 'chest-opener',
	wrist: 'wrist-forearm',
	forearm: 'wrist-forearm',
	tricep: 'overhead-triceps',
	cat: 'cat-cow',
	cow: 'cat-cow',
	child: 'childs-pose',
	cobra: 'cobra-stretch',
	side: 'standing-side-bend',
	twist: 'seated-twist',
	rotate: 'thoracic-rotation',
	thoracic: 'thoracic-rotation',
	lunge: 'low-lunge',
	pigeon: 'pigeon-pose',
	figure: 'pigeon-pose',
	butterfly: 'butterfly-stretch',
	quad: 'quad-stretch',
	happy: 'happy-baby',
	baby: 'happy-baby',
	fold: 'forward-fold',
	hamstring: 'hamstring-fold',
	calf: 'standing-calf',
	world: 'worlds-greatest',
	reach: 'overhead-reach'
};

export function resolveIconKey(iconKey?: string, name?: string): string {
	if (iconKey) return iconKey;
	if (!name) return 'stretch';
	const lower = name.toLowerCase();
	for (const [kw, key] of Object.entries(keywordMap)) {
		if (lower.includes(kw)) return key;
	}
	return 'stretch';
}
