import type { StockStretch } from './types.ts';

export const stockStretches: StockStretch[] = [
	/* ==========================================================================
	   1. STATIC STRETCHES
	   ========================================================================== */
	{
		id: 'static-neck-release',
		name: 'Neck Release',
		type: 'static',
		position: 'seated',
		area: 'upper-body',
		description: 'Relax your shoulders and gently tilt your ear toward your shoulder. Use light hand weight for extra release.',
		sides: 'two',
		defaultSeconds: 30,
		iconKey: 'neck-release'
	},
	{
		id: 'static-chest-opener',
		name: 'Doorway / Clasp Chest Opener',
		type: 'static',
		position: 'standing',
		area: 'upper-body',
		description: 'Clasp hands behind your back or place forearms on a doorframe, opening the chest and front shoulders.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'chest-opener'
	},
	{
		id: 'static-cross-body-shoulder',
		name: 'Cross-Body Shoulder Stretch',
		type: 'static',
		position: 'standing',
		area: 'upper-body',
		description: 'Draw one straight arm across your chest using your opposite forearm, keeping shoulders depressed.',
		sides: 'two',
		defaultSeconds: 30,
		iconKey: 'cross-body-shoulder'
	},
	{
		id: 'static-overhead-triceps',
		name: 'Overhead Triceps & Lat Stretch',
		type: 'static',
		position: 'standing',
		area: 'upper-body',
		description: 'Reach one elbow overhead and behind your neck, using the opposite hand to gently guide it back.',
		sides: 'two',
		defaultSeconds: 30,
		iconKey: 'overhead-triceps'
	},
	{
		id: 'static-wrist-forearm',
		name: 'Kneeling Wrist & Forearm Stretch',
		type: 'static',
		position: 'floor',
		area: 'upper-body',
		description: 'On hands and knees, rotate palms facing down with fingers pointing back toward knees; lean gently back.',
		sides: 'one',
		defaultSeconds: 35,
		iconKey: 'wrist-forearm'
	},
	{
		id: 'static-standing-side-bend',
		name: 'Standing Side Bend',
		type: 'static',
		position: 'standing',
		area: 'spine',
		description: 'Reach one arm overhead and lengthen your ribcage, gently arcing sideways without collapsing forward.',
		sides: 'two',
		defaultSeconds: 30,
		iconKey: 'standing-side-bend'
	},
	{
		id: 'static-seated-spinal-twist',
		name: 'Seated Spinal Twist',
		type: 'static',
		position: 'seated',
		area: 'spine',
		description: 'Sit tall, rotate gently through your thoracic spine, and place your opposite hand on your knee.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'seated-twist'
	},
	{
		id: 'static-cobra-stretch',
		name: 'Cobra Spine Extension',
		type: 'static',
		position: 'floor',
		area: 'spine',
		description: 'Lie face down, press gently through your hands to elevate your chest, keeping shoulders down and hips grounded.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'cobra-stretch'
	},
	{
		id: 'static-standing-quad',
		name: 'Standing Quad Stretch',
		type: 'static',
		position: 'standing',
		area: 'hips',
		description: 'Stand tall on one leg, grasp the top of your opposite foot, and gently tuck your pelvis forward.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'quad-stretch'
	},
	{
		id: 'static-low-lunge',
		name: 'Low Lunge Hip Flexor Stretch',
		type: 'static',
		position: 'floor',
		area: 'hips',
		description: 'Step into a deep lunge with back knee grounded; press hips forward while keeping chest upright.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'low-lunge'
	},
	{
		id: 'static-pigeon-pose',
		name: 'Pigeon / Figure-Four Glute Stretch',
		type: 'static',
		position: 'floor',
		area: 'hips',
		description: 'Fold front shin forward onto mat, square your hips, and sink comfortably into the outer hip and glute.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'pigeon-pose'
	},
	{
		id: 'static-seated-butterfly',
		name: 'Seated Butterfly Stretch',
		type: 'static',
		position: 'seated',
		area: 'hips',
		description: 'Bring soles of feet together, sit tall with long spine, and let knees drop out to open inner thighs.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'butterfly-stretch'
	},
	{
		id: 'static-standing-calf',
		name: 'Wall Calf Stretch',
		type: 'static',
		position: 'standing',
		area: 'legs',
		description: 'Step one foot back with heel flat on the floor; bend front knee and press gently into the wall.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'standing-calf'
	},
	{
		id: 'static-forward-fold',
		name: 'Standing Forward Fold',
		type: 'static',
		position: 'standing',
		area: 'legs',
		description: 'Hinge forward from the hips with soft knees, letting upper body and head hang loosely.',
		sides: 'one',
		defaultSeconds: 60,
		iconKey: 'forward-fold'
	},
	{
		id: 'static-seated-hamstring',
		name: 'Seated Single-Leg Hamstring Reach',
		type: 'static',
		position: 'seated',
		area: 'legs',
		description: 'Extend one leg forward with toes up, hinge at the waist with flat back, reaching toward the toes.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'hamstring-fold'
	},

	/* ==========================================================================
	   2. DYNAMIC MOVEMENTS
	   ========================================================================== */
	{
		id: 'dynamic-arm-circles',
		name: 'Standing Arm Circles & Swings',
		type: 'dynamic',
		position: 'standing',
		area: 'upper-body',
		description: 'Make smooth, controlled circles with outstretched arms, switching between forward and backward rotations.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'arm-circles'
	},
	{
		id: 'dynamic-shoulder-rolls',
		name: 'Shoulder Rolls & Shrugs',
		type: 'dynamic',
		position: 'standing',
		area: 'upper-body',
		description: 'Roll shoulders up toward ears, back and down in fluid circular motions to relieve upper back tension.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'shoulder-rolls'
	},
	{
		id: 'dynamic-cat-cow',
		name: 'Cat-Cow Flow',
		type: 'dynamic',
		position: 'floor',
		area: 'spine',
		description: 'On hands and knees, alternate inhaling to lower belly & lift chest, then exhaling to round the spine upward.',
		sides: 'one',
		defaultSeconds: 60,
		iconKey: 'cat-cow'
	},
	{
		id: 'dynamic-torso-rotations',
		name: 'Standing Torso Rotations',
		type: 'dynamic',
		position: 'standing',
		area: 'spine',
		description: 'Stand with soft knees, rotate torso gently from side to side, letting arms swing naturally around hips.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'seated-twist'
	},
	{
		id: 'dynamic-worlds-greatest',
		name: 'World’s Greatest Stretch Flow',
		type: 'dynamic',
		position: 'floor',
		area: 'full-body',
		description: 'Step into a deep runner’s lunge, drop inside elbow to instep, then rotate and reach outside hand high.',
		sides: 'two',
		defaultSeconds: 60,
		iconKey: 'worlds-greatest'
	},
	{
		id: 'dynamic-leg-swings',
		name: 'Front-to-Back Leg Swings',
		type: 'dynamic',
		position: 'standing',
		area: 'legs',
		description: 'Hold a wall for balance, swing one leg smoothly forward and backward through a comfortable range of motion.',
		sides: 'two',
		defaultSeconds: 30,
		iconKey: 'leg-swings'
	},
	{
		id: 'dynamic-lateral-swings',
		name: 'Side-to-Side Leg Swings',
		type: 'dynamic',
		position: 'standing',
		area: 'hips',
		description: 'Facing a wall, swing one leg laterally across the body and out to the side in a rhythmic motion.',
		sides: 'two',
		defaultSeconds: 30,
		iconKey: 'leg-swings'
	},
	{
		id: 'dynamic-glute-bridge-pulses',
		name: 'Glute Bridge Pulses',
		type: 'dynamic',
		position: 'floor',
		area: 'hips',
		description: 'Lie on your back with knees bent, drive through heels to lift hips, squeeze glutes at the top, and pulse smoothly.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'bridge-hold'
	},
	{
		id: 'dynamic-thoracic-openers',
		name: 'Side-Lying Thoracic Open-Book',
		type: 'dynamic',
		position: 'floor',
		area: 'spine',
		description: 'Lie on your side with knees stacked, sweep the top arm in an arc across your body to open the chest, and return.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'thoracic-rotation'
	},

	/* ==========================================================================
	   3. ISOMETRICS
	   ========================================================================== */
	{
		id: 'iso-wall-sit',
		name: 'Wall Sit Hold',
		type: 'isometrics',
		position: 'standing',
		area: 'legs',
		description: 'Lean back against a wall, slide down until knees are at 90 degrees, and hold thighs parallel to floor.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'wall-sit'
	},
	{
		id: 'iso-plank',
		name: 'Forearm Plank Hold',
		type: 'isometrics',
		position: 'floor',
		area: 'full-body',
		description: 'Support body on forearms and toes in a straight line from head to heels; brace core firmly.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'plank-hold'
	},
	{
		id: 'iso-side-plank',
		name: 'Side Plank Hold',
		type: 'isometrics',
		position: 'floor',
		area: 'spine',
		description: 'Stack feet, elevate hips off floor on one forearm, keeping spine neutral and hips lifted.',
		sides: 'two',
		defaultSeconds: 30,
		iconKey: 'plank-hold'
	},
	{
		id: 'iso-glute-bridge-hold',
		name: 'Isometric Glute Bridge Hold',
		type: 'isometrics',
		position: 'floor',
		area: 'hips',
		description: 'Drive through heels, lift hips into a straight diagonal line from knees to shoulders, and hold squeeze.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'bridge-hold'
	},
	{
		id: 'iso-superman-hold',
		name: 'Superman Prone Hold',
		type: 'isometrics',
		position: 'floor',
		area: 'spine',
		description: 'Lie face down, lift arms, chest, and legs simultaneously off floor, engaging glutes and spinal erectors.',
		sides: 'one',
		defaultSeconds: 30,
		iconKey: 'cobra-stretch'
	},
	{
		id: 'iso-calf-raise-hold',
		name: 'Standing Calf Raise Hold',
		type: 'isometrics',
		position: 'standing',
		area: 'legs',
		description: 'Press onto the balls of your feet at maximum height and hold steady for calf and ankle stability.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'standing-calf'
	},

	/* ==========================================================================
	   4. CALISTHENICS
	   ========================================================================== */
	{
		id: 'cali-air-squats',
		name: 'Bodyweight Air Squats',
		type: 'calisthenics',
		position: 'standing',
		area: 'legs',
		description: 'Feet shoulder-width, sit hips down and back with chest proud, driving up through full foot.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'squat'
	},
	{
		id: 'cali-push-ups',
		name: 'Push-Ups (Standard / Incline)',
		type: 'calisthenics',
		position: 'floor',
		area: 'upper-body',
		description: 'Hands slightly wider than shoulders, lower chest until elbows reach 90 degrees, press up firmly.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'push-up'
	},
	{
		id: 'cali-reverse-lunges',
		name: 'Alternating Reverse Lunges',
		type: 'calisthenics',
		position: 'standing',
		area: 'legs',
		description: 'Step backward into a lunge with front knee over ankle, tap back knee lightly, and push back up.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'low-lunge'
	},
	{
		id: 'cali-chair-dips',
		name: 'Bench / Floor Dips',
		type: 'calisthenics',
		position: 'seated',
		area: 'upper-body',
		description: 'Hands on bench or floor behind you, lower hips by bending elbows to 90 degrees, press through palms.',
		sides: 'one',
		defaultSeconds: 40,
		iconKey: 'overhead-triceps'
	},
	{
		id: 'cali-bear-crawl-hold',
		name: 'Bear Crawl Static Hold',
		type: 'calisthenics',
		position: 'floor',
		area: 'full-body',
		description: 'On hands and toes with knees hovering 2 inches off the ground directly below hips, back flat.',
		sides: 'one',
		defaultSeconds: 35,
		iconKey: 'cat-cow'
	},

	/* ==========================================================================
	   5. MOBILITY
	   ========================================================================== */
	{
		id: 'mob-deep-squat-pry',
		name: 'Deep Squat Pry / Malasana',
		type: 'mobility',
		position: 'standing',
		area: 'hips',
		description: 'Sink into a deep squat, use elbows to gently press knees outward, shift weight smoothly side to side.',
		sides: 'one',
		defaultSeconds: 60,
		iconKey: 'deep-squat-pry'
	},
	{
		id: 'mob-90-90-hip-switches',
		name: '90/90 Seated Hip Switches',
		type: 'mobility',
		position: 'seated',
		area: 'hips',
		description: 'Sit with front and back legs bent at 90 degrees, rotate knees through center to opposite side without hands.',
		sides: 'one',
		defaultSeconds: 60,
		iconKey: 'pigeon-pose'
	},
	{
		id: 'mob-thread-needle',
		name: 'Thread the Needle Shoulder Mobility',
		type: 'mobility',
		position: 'floor',
		area: 'upper-body',
		description: 'From all fours, slide one arm underneath your chest along the floor, resting shoulder and temple down.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'thoracic-rotation'
	},
	{
		id: 'mob-frog-pose',
		name: 'Frog Pose Groin Opener',
		type: 'mobility',
		position: 'floor',
		area: 'hips',
		description: 'On hands and knees, walk knees wide apart with feet turned outward, gently sink hips back toward heels.',
		sides: 'one',
		defaultSeconds: 60,
		iconKey: 'butterfly-stretch'
	},
	{
		id: 'mob-ankle-dorsiflexion',
		name: 'Kneeling Ankle Mobility',
		type: 'mobility',
		position: 'floor',
		area: 'legs',
		description: 'In a half-kneel, drive front knee forward over toes without letting the heel leave the floor.',
		sides: 'two',
		defaultSeconds: 40,
		iconKey: 'standing-calf'
	},

	/* ==========================================================================
	   6. YOGA POSES
	   ========================================================================== */
	{
		id: 'yoga-downward-dog',
		name: 'Downward-Facing Dog',
		type: 'yoga',
		position: 'floor',
		area: 'full-body',
		description: 'Press through palms, lift hips up and back into inverted V shape, pedal heels toward floor.',
		sides: 'one',
		defaultSeconds: 60,
		iconKey: 'downward-dog'
	},
	{
		id: 'yoga-childs-pose',
		name: 'Child’s Pose (Balasana)',
		type: 'yoga',
		position: 'floor',
		area: 'spine',
		description: 'Sit hips onto heels, extend arms forward along floor, resting forehead down in peaceful relaxation.',
		sides: 'one',
		defaultSeconds: 60,
		iconKey: 'childs-pose'
	},
	{
		id: 'yoga-warrior-two',
		name: 'Warrior II Pose (Virabhadrasana II)',
		type: 'yoga',
		position: 'standing',
		area: 'legs',
		description: 'Wide stance, bend front knee to 90 degrees, arms extended parallel to floor, gaze over front fingertips.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'warrior-two'
	},
	{
		id: 'yoga-triangle',
		name: 'Triangle Pose (Trikonasana)',
		type: 'yoga',
		position: 'standing',
		area: 'spine',
		description: 'Straight legs in wide stance, reach front hand down to shin/floor, extend top arm toward sky.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'triangle-pose'
	},
	{
		id: 'yoga-tree-pose',
		name: 'Tree Pose Balance (Vrksasana)',
		type: 'yoga',
		position: 'standing',
		area: 'full-body',
		description: 'Place sole of one foot against inner calf or thigh, hands at heart center or reaching overhead.',
		sides: 'two',
		defaultSeconds: 45,
		iconKey: 'tree-pose'
	},
	{
		id: 'yoga-happy-baby',
		name: 'Happy Baby (Ananda Balasana)',
		type: 'yoga',
		position: 'floor',
		area: 'hips',
		description: 'Lie on your back, hold outer edges of feet with knees wide, gently pull knees toward armpits.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'happy-baby'
	},

	/* ==========================================================================
	   7. CARDIO & DYNAMIC FLOWS
	   ========================================================================== */
	{
		id: 'cardio-jumping-jacks',
		name: 'Jumping Jacks / Star Steps',
		type: 'cardio',
		position: 'standing',
		area: 'full-body',
		description: 'Jump feet wide while bringing hands overhead, then return to center in continuous rhythmic flow.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'jumping-jacks'
	},
	{
		id: 'cardio-high-knees',
		name: 'High Knees in Place',
		type: 'cardio',
		position: 'standing',
		area: 'legs',
		description: 'Drive knees up toward waist height in a quick running tempo, pumping arms in rhythm.',
		sides: 'one',
		defaultSeconds: 30,
		iconKey: 'jumping-jacks'
	},
	{
		id: 'cardio-butt-kicks',
		name: 'Butt Kicks in Place',
		type: 'cardio',
		position: 'standing',
		area: 'legs',
		description: 'Jog in place, kicking heels up toward glutes with quick light foot contacts.',
		sides: 'one',
		defaultSeconds: 30,
		iconKey: 'quad-stretch'
	},
	{
		id: 'cardio-mountain-climbers',
		name: 'Mountain Climbers',
		type: 'cardio',
		position: 'floor',
		area: 'full-body',
		description: 'From a plank position, alternate driving knees toward chest in a smooth, rhythmic running motion.',
		sides: 'one',
		defaultSeconds: 40,
		iconKey: 'mountain-climbers'
	},
	{
		id: 'cardio-skater-hops',
		name: 'Skater Hops / Lateral Bounds',
		type: 'cardio',
		position: 'standing',
		area: 'legs',
		description: 'Hop laterally from one foot to the other, sweeping opposite leg behind with control.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'leg-swings'
	},
	{
		id: 'cardio-shadow-boxing',
		name: 'Shadow Boxing Punch Combos',
		type: 'cardio',
		position: 'standing',
		area: 'upper-body',
		description: 'In an athletic stance, throw crisp jab-cross combinations while lightly bouncing on feet.',
		sides: 'one',
		defaultSeconds: 45,
		iconKey: 'arm-circles'
	}
];

const keywordMap: Record<string, string> = {
	neck: 'neck-release',
	shoulder: 'shoulder-rolls',
	arm: 'arm-circles',
	circle: 'arm-circles',
	chest: 'chest-opener',
	door: 'chest-opener',
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
	reach: 'overhead-reach',
	plank: 'plank-hold',
	wall: 'wall-sit',
	squat: 'squat',
	push: 'push-up',
	dog: 'downward-dog',
	bridge: 'bridge-hold',
	jack: 'jumping-jacks',
	jump: 'jumping-jacks',
	climber: 'mountain-climbers',
	warrior: 'warrior-two',
	triangle: 'triangle-pose',
	tree: 'tree-pose',
	swing: 'leg-swings',
	pry: 'deep-squat-pry'
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
