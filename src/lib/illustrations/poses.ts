import type { Angles, PoseDef } from './figure.ts';

/*
 * Angle cheat sheet: 0 = down, 90 = right, 180 = up, -90 = left.
 * Side-view figures face right unless noted. In front view the "near" limbs
 * are on the right of the picture.
 */

const STAND: Angles = { torso: 180, arm: 4, forearm: 12, farArm: -6, farForearm: 2, thigh: 4, shin: 0, farThigh: -4, farShin: -2 };
const FRONT: Angles = { torso: 180, arm: 16, forearm: 8, farArm: -16, farForearm: -8, thigh: 5, shin: 1, farThigh: -5, farShin: -1 };
/** hands and knees, head to the right */
const FOURS: Angles = { torso: 110, head: 105, arm: 0, forearm: 0, farArm: -4, farForearm: -4, thigh: 0, shin: -90, farThigh: -4, farShin: -90, foot: -90, farFoot: -90 };
/** lying on the back, head to the left */
const SUPINE: Angles = { torso: -90, head: -90, arm: 92, forearm: 90, farArm: 88, farForearm: 90, thigh: 90, shin: 90, farThigh: 90, farShin: 90, foot: 180, farFoot: 180 };
/** lying face down, head to the right */
const PRONE: Angles = { torso: 92, head: 95, arm: 70, forearm: 90, farArm: 66, farForearm: 90, thigh: -90, shin: -90, farThigh: -90, farShin: -90, foot: -90, farFoot: -90 };
/** seated on the floor, legs out front */
const SEATED: Angles = { torso: 178, arm: -12, forearm: -6, farArm: -18, farForearm: -10, thigh: 90, shin: 90, farThigh: 90, farShin: 90, foot: 180, farFoot: 180 };
/** straight-arm plank, head to the right */
const HIGH_PLANK: Angles = { torso: 117, head: 112, arm: 0, forearm: 0, farArm: -3, farForearm: -3, thigh: -63, shin: -63, farThigh: -63, farShin: -63 };
/** forearm plank, head to the right */
const FOREARM_PLANK: Angles = { ...HIGH_PLANK, torso: 104, head: 100, arm: 0, forearm: 90, farArm: -3, farForearm: 88, thigh: -76, shin: -76, farThigh: -76, farShin: -76 };
/** kneeling low lunge, right foot forward */
const LUNGE: Angles = { torso: 178, arm: 20, forearm: 70, farArm: 10, farForearm: 60, thigh: 85, shin: 0, farThigh: -15, farShin: -90, farFoot: -90 };
/** standing split stance */
const SPLIT: Angles = { torso: 180, arm: -25, forearm: 55, farArm: -30, farForearm: 50, thigh: 90, shin: 0, farThigh: -12, farShin: -78, farFoot: 0 };
const DOWN_DOG: Angles = { torso: 50, head: 40, arm: 50, forearm: 50, farArm: 48, farForearm: 48, thigh: -20, shin: -20, farThigh: -22, farShin: -22, foot: 90, farFoot: 90 };

export const poses: Record<string, PoseDef> = {
	/* ---------------------------------------------------------------- Neck */
	'neck-release': {
		view: 'front',
		frames: [{ ...FRONT, head: 168, arm: 146, forearm: -112 }, { head: 150, arm: 134, forearm: -102 }],
		glow: [['neck', 'farShoulder']],
		arrows: [{ at: 'head', d: 'M-10 -6q4 -7 11 -7', gold: true }]
	},
	'upper-trap': {
		view: 'front',
		frames: [{ ...FRONT, head: 162, arm: 150, forearm: -118, farArm: -8, farForearm: -2 }, { head: 140, arm: 128, forearm: -98 }],
		glow: [['neck', 'farShoulder']],
		arrows: [{ at: 'head', d: 'M-9 -8q5 -6 12 -5', gold: true }]
	},
	'neck-press': {
		view: 'front',
		frames: [{ ...FRONT, head: 180, arm: 110, forearm: -120 }, { head: 175 }],
		dur: 2,
		glow: ['neck'],
		arrows: [{ at: 'head', d: 'M14 0h-6', gold: true }]
	},
	'neck-circles': {
		view: 'front',
		frames: [{ ...FRONT, head: 150 }, { head: 180 }, { head: -150 }],
		dur: 4,
		glow: ['neck'],
		arrows: [{ at: 'head', d: 'M-9 4q9 8 18 0' }]
	},

	/* ----------------------------------------------------------- Shoulders */
	'shoulder-rolls': {
		frames: [STAND, { arm: 14, forearm: 18, head: 182 }, { arm: 2, forearm: 10 }, { arm: -8, forearm: 4, head: 178 }],
		loop: true,
		dur: 2.4,
		glow: ['shoulder'],
		arrows: [{ at: 'shoulder', d: 'M-6 -2a6 6 0 1 1 3 5' }]
	},
	'arm-circles': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 90, forearm: 90, farArm: -90, farForearm: -90 },
			{ arm: 100, forearm: 104, farArm: -100, farForearm: -104 },
			{ arm: 90, forearm: 90, farArm: -90, farForearm: -90 },
			{ arm: 80, forearm: 76, farArm: -80, farForearm: -76 }
		],
		loop: true,
		dur: 1.6,
		arrows: [
			{ at: 'hand', d: 'M0 -6a6 6 0 1 1 -5 3' },
			{ at: 'farHand', d: 'M0 -6a6 6 0 1 0 5 3' }
		]
	},
	'wall-angels': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 92, forearm: 180, farArm: -92, farForearm: 180 },
			{ arm: 150, forearm: 172, farArm: -150, farForearm: -172 }
		],
		dur: 3,
		glow: [['shoulder', 'farShoulder']]
	},
	'chest-opener': {
		frames: [
			{ ...STAND, head: 182, arm: -28, forearm: -38, farArm: -32, farForearm: -42 },
			{ head: 188, bend: 1.8, arm: -48, forearm: -58, farArm: -52, farForearm: -62 }
		],
		glow: [['shoulder', 'neck']],
		arrows: [{ at: 'hand', d: 'M3 4q-4 4 -9 3', gold: true }]
	},
	'scapular-squeeze': {
		frames: [
			{ ...STAND, arm: -10, forearm: 70, farArm: -14, farForearm: 66 },
			{ arm: -38, forearm: 52, farArm: -42, farForearm: 48, bend: 1 }
		],
		dur: 2.6,
		glow: ['neck'],
		arrows: [{ at: 'elbow', d: 'M4 -2h-6', gold: true }]
	},
	'cross-body-shoulder': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: -80, forearm: -84, farArm: 20, farForearm: -148 },
			{ arm: -86, forearm: -90, farArm: 24, farForearm: -142 }
		],
		glow: ['shoulder'],
		arrows: [{ at: 'hand', d: 'M6 -6h-6', gold: true }]
	},
	'overhead-triceps': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 165, forearm: -40, farArm: -170, farForearm: 100 },
			{ arm: 170, forearm: -30, farArm: -174, farForearm: 96 }
		],
		glow: ['elbow']
	},
	'thread-needle': {
		still: 1,
		frames: [
			{ ...FOURS, arm: 175, forearm: 178, head: 130 },
			{ torso: 100, head: 70, arm: -55, forearm: -90 }
		],
		dur: 3.6,
		mat: true,
		glow: [['shoulder', 'neck']]
	},

	/* --------------------------------------------------------- Arms & wrists */
	'wrist-forearm': {
		frames: [FOURS, { torso: 120, thigh: -22, farThigh: -26, arm: -14, forearm: -14, farArm: -18, farForearm: -18 }],
		mat: true,
		anchor: 'hand',
		glow: ['hand'],
		arrows: [{ at: 'pelvis', d: 'M-2 -8h-7', gold: true }]
	},
	'wrist-circles': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 20, forearm: -115, farArm: -20, farForearm: 115 },
			{ forearm: -100, farForearm: 130 },
			{ forearm: -125, farForearm: 105 }
		],
		loop: true,
		dur: 1.8,
		glow: ['hand'],
		arrows: [{ at: 'hand', d: 'M-4 -6a6 6 0 1 1 -3 9' }]
	},
	'chair-dips': {
		frames: [
			{ torso: 172, head: 176, arm: -14, forearm: -8, farArm: -18, farForearm: -12, thigh: 78, shin: 10, farThigh: 76, farShin: 8 },
			{ torso: 170, arm: -105, forearm: -4, farArm: -108, farForearm: -6, thigh: 70, shin: 22, farThigh: 68, farShin: 20 }
		],
		anchor: 'foot',
		dur: 2.2,
		props: [{ type: 'block', at: 'hand', w: 16, dx: -4 }],
		glow: ['elbow']
	},

	/* --------------------------------------------------------------- Spine */
	'cat-cow': {
		frames: [
			{ ...FOURS, head: 128, bend: 4 },
			{ head: 55, bend: -5 }
		],
		mat: true,
		dur: 4,
		glow: [['pelvis', 'neck']]
	},
	'childs-pose': {
		frames: [
			{ torso: 100, head: 112, arm: 96, forearm: 92, farArm: 98, farForearm: 94, thigh: 78, shin: -90, farThigh: 76, farShin: -90, foot: -90, farFoot: -90 },
			{ torso: 104, head: 114, arm: 98, forearm: 94 }
		],
		mat: true,
		dur: 4.5,
		glow: [['pelvis', 'neck']]
	},
	'puppy-pose': {
		frames: [
			{ ...FOURS, torso: 62, head: 80, arm: 95, forearm: 90, farArm: 97, farForearm: 92 },
			{ torso: 58, arm: 98, forearm: 92 }
		],
		mat: true,
		dur: 4,
		glow: ['shoulder']
	},
	'cobra-stretch': {
		still: 1,
		frames: [
			{ ...PRONE, torso: 112, head: 118, arm: -10, forearm: 80, farArm: -14, farForearm: 76 },
			{ torso: 140, head: 150, arm: 2, forearm: -4, farArm: -2, farForearm: -8 }
		],
		anchor: 'pelvis',
		mat: true,
		dur: 4,
		glow: [['pelvis', 'neck']]
	},
	sphinx: {
		frames: [
			{ ...PRONE, torso: 112, head: 122, arm: -4, forearm: 88, farArm: -8, farForearm: 86 },
			{ torso: 115, head: 126 }
		],
		anchor: 'pelvis',
		mat: true,
		dur: 4,
		glow: ['pelvis']
	},
	superman: {
		still: 1,
		frames: [
			{ ...PRONE, torso: 94, head: 98, arm: 96, forearm: 96, farArm: 98, farForearm: 98, thigh: -94, shin: -94, farThigh: -96, farShin: -96 },
			{ torso: 102, head: 106, arm: 108, forearm: 108, farArm: 110, farForearm: 110, thigh: -102, shin: -102, farThigh: -104, farShin: -104 }
		],
		anchor: 'pelvis',
		mat: true,
		glow: [['pelvis', 'neck']]
	},
	'bird-dog': {
		frames: [
			{ ...FOURS, farArm: -2, farForearm: -2, arm: 98, forearm: 98, farThigh: -92, farShin: -92, farFoot: -90 },
			{ arm: 102, forearm: 102, farThigh: -98, farShin: -98 }
		],
		anchor: 'farHand',
		mat: true,
		glow: ['pelvis']
	},
	'standing-side-bend': {
		still: 1,
		view: 'front',
		frames: [
			{ ...FRONT, arm: 178, forearm: 182, farArm: -12, farForearm: -8 },
			{ torso: -162, head: -158, bend: 4, arm: -148, forearm: -128, farArm: -2, farForearm: 6 }
		],
		dur: 3.6,
		glow: [['shoulder', 'pelvis']]
	},
	'seated-twist': {
		frames: [
			{ ...SEATED, arm: 115, forearm: 170, farArm: -40, farForearm: -30, thigh: 135, shin: 20, foot: 100 },
			{ arm: 108, forearm: 166, head: 196 }
		],
		mat: true,
		anchor: 'pelvis',
		glow: [['pelvis', 'neck']],
		arrows: [{ at: 'neck', d: 'M8 -2q-8 -6 -16 0' }]
	},
	'torso-rotations': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 70, forearm: -60, farArm: -70, farForearm: 60 },
			{ arm: 30, forearm: -100, farArm: -105, farForearm: -95 },
			{ arm: 70, forearm: -60, farArm: -70, farForearm: 60 },
			{ arm: 105, forearm: 95, farArm: -30, farForearm: 100 }
		],
		loop: true,
		dur: 3,
		glow: [['pelvis', 'neck']],
		arrows: [{ at: 'neck', d: 'M-10 6q10 6 20 0' }]
	},
	'thoracic-rotation': {
		frames: [
			{ ...SUPINE, torso: -90, head: -96, arm: 176, forearm: 176, farArm: 100, farForearm: 92, thigh: 140, shin: 50, farThigh: 136, farShin: 46, foot: 140, farFoot: 136 },
			{ arm: -112, forearm: -100 }
		],
		mat: true,
		anchor: 'pelvis',
		dur: 4,
		glow: ['shoulder'],
		arrows: [{ at: 'shoulder', d: 'M10 -12q-8 -8 -18 0' }]
	},
	'reclined-twist': {
		frames: [
			{ ...SUPINE, arm: -96, forearm: -92, farArm: -100, farForearm: -94, thigh: 150, shin: 92, farThigh: 146, farShin: 90, foot: 180, farFoot: 180 },
			{ thigh: 112, shin: 62, farThigh: 108, farShin: 58 }
		],
		mat: true,
		anchor: 'pelvis',
		dur: 4,
		glow: ['pelvis'],
		arrows: [{ at: 'knee', d: 'M2 -6q6 2 6 8' }]
	},
	'knees-to-chest': {
		frames: [
			{ ...SUPINE, head: -100, arm: 140, forearm: 100, farArm: 136, farForearm: 96, thigh: 158, shin: 102, farThigh: 154, farShin: 98, foot: 190, farFoot: 186 },
			{ thigh: -178, shin: 116, farThigh: 178, farShin: 112, arm: 150, forearm: 112 }
		],
		mat: true,
		anchor: 'pelvis',
		dur: 4,
		glow: ['pelvis']
	},
	'happy-baby': {
		frames: [
			{ ...SUPINE, head: -100, thigh: -135, shin: 180, farThigh: -130, farShin: 178, foot: 90, farFoot: 92, arm: 160, forearm: 172, farArm: 156, farForearm: 168 },
			{ thigh: -128, farThigh: -124, arm: 156, forearm: 168 }
		],
		mat: true,
		anchor: 'pelvis',
		dur: 3,
		glow: ['pelvis']
	},
	'legs-up-wall': {
		frames: [
			{ ...SUPINE, thigh: 180, shin: 180, farThigh: 178, farShin: 178, foot: 92, farFoot: 92, arm: -100, forearm: -92, farArm: 96, farForearm: 90 },
			{ arm: -104, forearm: -94 }
		],
		mat: true,
		anchor: 'pelvis',
		dur: 5,
		props: [{ type: 'wall', at: 'foot', dx: 5 }],
		glow: ['pelvis']
	},

	/* ---------------------------------------------------------------- Hips */
	'low-lunge': {
		frames: [LUNGE, { thigh: 95, farThigh: -32, torso: 176 }],
		mat: true,
		glow: [['pelvis', 'farKnee']]
	},
	'hip-flexor-press': {
		frames: [{ ...LUNGE, thigh: 95, farThigh: -32 }, { torso: 176 }],
		mat: true,
		dur: 2.4,
		glow: [['pelvis', 'farKnee']],
		arrows: [{ at: 'farKnee', d: 'M0 -12v6', gold: true }]
	},
	'couch-stretch': {
		frames: [
			{ ...LUNGE, thigh: 92, farThigh: -8, farShin: 180, farFoot: -90, torso: 172 },
			{ torso: 180, thigh: 98 }
		],
		mat: true,
		anchor: 'farKnee',
		props: [{ type: 'wall', at: 'farKnee', dx: -4 }],
		glow: [['pelvis', 'farKnee']]
	},
	lizard: {
		frames: [
			{ ...LUNGE, torso: 128, head: 110, thigh: 100, shin: -6, farThigh: -62, farShin: -82, arm: 0, forearm: 0, farArm: -2, farForearm: -2 },
			{ torso: 116, head: 100, arm: -20, forearm: 70, farArm: -22, farForearm: 68 }
		],
		mat: true,
		dur: 4,
		glow: ['pelvis']
	},
	'pigeon-pose': {
		frames: [
			{ torso: 170, arm: 8, forearm: 0, farArm: 2, farForearm: -4, thigh: 72, shin: -102, foot: -60, farThigh: -86, farShin: -88, farFoot: -90 },
			{ torso: 118, head: 108, arm: 92, forearm: 92, farArm: 94, farForearm: 94 }
		],
		mat: true,
		anchor: 'pelvis',
		dur: 4,
		glow: ['pelvis']
	},
	'reclined-figure-four': {
		frames: [
			{ ...SUPINE, farThigh: 150, farShin: 90, farFoot: 180, thigh: 100, shin: -145, foot: -60, arm: 132, forearm: 116, farArm: 128, farForearm: 112 },
			{ farThigh: 168, farShin: 104, thigh: 115, shin: -160, arm: 138, forearm: 126 }
		],
		mat: true,
		anchor: 'pelvis',
		glow: ['pelvis']
	},
	'butterfly-stretch': {
		view: 'front',
		frames: [
			{ ...FRONT, torso: 180, arm: 14, forearm: -12, farArm: -14, farForearm: 12, thigh: 64, shin: -68, farThigh: -64, farShin: 68, foot: -100, farFoot: 100 },
			{ thigh: 76, shin: -78, farThigh: -76, farShin: 78 }
		],
		anchor: 'pelvis',
		mat: true,
		glow: [
			['pelvis', 'knee'],
			['pelvis', 'farKnee']
		]
	},
	'butterfly-press': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 30, forearm: 10, farArm: -30, farForearm: -10, thigh: 66, shin: -68, farThigh: -66, farShin: 68, foot: -100, farFoot: 100 },
			{ thigh: 74, shin: -76, farThigh: -74, farShin: 76 }
		],
		anchor: 'pelvis',
		mat: true,
		dur: 2.4,
		glow: [
			['pelvis', 'knee'],
			['pelvis', 'farKnee']
		],
		arrows: [
			{ at: 'knee', d: 'M0 2v-7', gold: true },
			{ at: 'farKnee', d: 'M0 2v-7', gold: true }
		]
	},
	frog: {
		view: 'front',
		frames: [
			{ torso: 180, head: 180, arm: 34, forearm: 70, farArm: -34, farForearm: -70, thigh: 70, shin: 92, farThigh: -70, farShin: -92, foot: 180, farFoot: 180 },
			{ thigh: 76, farThigh: -76 }
		],
		anchor: 'pelvis',
		mat: true,
		dur: 4,
		glow: [
			['pelvis', 'knee'],
			['pelvis', 'farKnee']
		]
	},
	'ninety-ninety': {
		frames: [
			{ torso: 180, arm: 30, forearm: 60, farArm: -20, farForearm: -10, thigh: 88, shin: -92, foot: -60, farThigh: -88, farShin: -150, farFoot: -60 },
			{ torso: 168, head: 160, arm: 40, forearm: 70 }
		],
		anchor: 'pelvis',
		mat: true,
		dur: 3,
		glow: ['pelvis']
	},
	'deep-squat-pry': {
		frames: [
			{ torso: 166, head: 172, arm: 30, forearm: 160, farArm: 26, farForearm: 156, thigh: 108, shin: -22, farThigh: 104, farShin: -24 },
			{ torso: 174, head: 178, arm: 36, forearm: 150, thigh: 112, farThigh: 110 }
		],
		dur: 3.4,
		glow: ['pelvis']
	},
	'side-lunge': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 40, forearm: -60, farArm: -40, farForearm: 60, thigh: 52, shin: -8, farThigh: -36, farShin: -36, foot: 20, farFoot: -100 },
			{ thigh: 56, shin: -12 }
		],
		dur: 3.6,
		glow: [['pelvis', 'farKnee']]
	},
	cossack: {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 40, forearm: -60, farArm: -40, farForearm: 60, thigh: 52, shin: -8, farThigh: -36, farShin: -36, foot: 20, farFoot: -100 },
			{ thigh: 36, shin: 36, farThigh: -52, farShin: 8, foot: 100, farFoot: -20 }
		],
		anchor: 'pelvis',
		dur: 3.2,
		glow: ['pelvis']
	},
	'hip-circles': {
		frames: [
			{ ...STAND, arm: 70, forearm: 90, thigh: 95, shin: 5 },
			{ thigh: 70, shin: -14 },
			{ thigh: 40, shin: -8 },
			{ thigh: 70, shin: 18 }
		],
		loop: true,
		anchor: 'farFoot',
		dur: 2.6,
		glow: ['pelvis'],
		arrows: [{ at: 'knee', d: 'M0 -7a7 7 0 1 1 -6 4' }]
	},

	/* ---------------------------------------------------------------- Legs */
	'quad-stretch': {
		frames: [
			{ ...STAND, thigh: -4, shin: -168, foot: -100, arm: -22, forearm: -4, farArm: 80, farForearm: 90, farThigh: 0, farShin: 0 },
			{ thigh: -14, shin: -164, arm: -28, forearm: -2 }
		],
		anchor: 'farFoot',
		glow: [['pelvis', 'knee']]
	},
	'forward-fold': {
		frames: [
			{ ...STAND, torso: 150, head: 145, arm: 60, forearm: 70, farArm: 56, farForearm: 66, thigh: 6, farThigh: 2 },
			{ torso: 28, head: 18, arm: 4, forearm: 0, farArm: 0, farForearm: -4, thigh: 10, shin: 0, farThigh: 8, farShin: 0 }
		],
		still: 1,
		dur: 4,
		glow: [['pelvis', 'knee']]
	},
	'wide-leg-fold': {
		view: 'front',
		frames: [
			{ torso: 0, head: 0, arm: -18, forearm: 0, farArm: 18, farForearm: 0, thigh: 28, shin: 28, farThigh: -28, farShin: -28, foot: 100, farFoot: -100 },
			{ thigh: 31, shin: 31, farThigh: -31, farShin: -31 }
		],
		anchor: 'pelvis',
		dur: 4,
		glow: [
			['pelvis', 'knee'],
			['pelvis', 'farKnee']
		]
	},
	'hamstring-fold': {
		frames: [
			{ ...SEATED, torso: 160, arm: 110, forearm: 106, farArm: 106, farForearm: 102, farThigh: 112, farShin: -112, farFoot: -60 },
			{ torso: 112, head: 104, arm: 94, forearm: 92, farArm: 92, farForearm: 90 }
		],
		mat: true,
		anchor: 'pelvis',
		dur: 4,
		still: 1,
		glow: [['pelvis', 'knee']]
	},
	'hamstring-press': {
		frames: [
			{ ...SEATED, torso: 126, head: 116, arm: 96, forearm: 94, farArm: 94, farForearm: 92, farThigh: 112, farShin: -112, farFoot: -60 },
			{ torso: 120, head: 110 }
		],
		mat: true,
		anchor: 'pelvis',
		dur: 2.4,
		glow: [['pelvis', 'knee']],
		arrows: [{ at: 'foot', d: 'M0 -9v6', gold: true }]
	},
	'seated-forward-fold': {
		frames: [
			{ ...SEATED, torso: 164, arm: 110, forearm: 108, farArm: 108, farForearm: 106 },
			{ torso: 108, head: 100, arm: 92, forearm: 90, farArm: 90, farForearm: 88 }
		],
		mat: true,
		anchor: 'pelvis',
		dur: 4.4,
		still: 1,
		glow: [['pelvis', 'knee']]
	},
	'standing-calf': {
		frames: [
			{ torso: 158, head: 162, arm: 112, forearm: 104, farArm: 110, farForearm: 102, thigh: 22, shin: -6, farThigh: -18, farShin: -18, farFoot: 90 },
			{ torso: 154, thigh: 28, shin: 0, farThigh: -22, farShin: -22 }
		],
		anchor: 'farFoot',
		props: [{ type: 'wall', at: 'hand', dx: 3 }],
		glow: [['farKnee', 'farFoot']]
	},
	'calf-raise': {
		frames: [STAND, { foot: 30, farFoot: 30 }],
		dur: 2.4,
		still: 1,
		glow: [['knee', 'foot']],
		arrows: [{ at: 'knee', d: 'M6 6v-7' }]
	},
	'ankle-circles': {
		frames: [
			{ ...STAND, arm: -10, forearm: 60, farArm: -14, farForearm: 56, thigh: 50, shin: 20, foot: 70, farThigh: -2, farShin: 0 },
			{ foot: 110 },
			{ foot: 160 },
			{ foot: 110 }
		],
		loop: true,
		anchor: 'farFoot',
		dur: 2.4,
		glow: ['foot'],
		arrows: [{ at: 'foot', d: 'M2 -6a6 6 0 1 1 -5 2' }]
	},
	'ankle-dorsiflexion': {
		frames: [
			{ ...LUNGE, thigh: 92, shin: 0, arm: 40, forearm: 80, farArm: 36, farForearm: 76, farThigh: -20 },
			{ thigh: 104, shin: 18, arm: 50, forearm: 90 }
		],
		mat: true,
		anchor: 'foot',
		dur: 2.6,
		glow: ['foot'],
		arrows: [{ at: 'knee', d: 'M2 -6h7' }]
	},
	'leg-swings': {
		frames: [
			{ ...STAND, arm: 80, forearm: 92, thigh: 55, shin: 55 },
			{ thigh: -35, shin: -30 }
		],
		anchor: 'farFoot',
		dur: 1.6,
		glow: [['pelvis', 'knee']],
		arrows: [{ at: 'pelvis', d: 'M-10 20q10 10 20 0' }]
	},
	'lateral-swings': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 70, forearm: 80, farArm: -70, farForearm: -80, thigh: 42, shin: 42, foot: 100, farThigh: -2, farShin: 0 },
			{ thigh: -18, shin: -18, foot: 60 }
		],
		anchor: 'farFoot',
		dur: 1.6,
		glow: ['pelvis'],
		arrows: [{ at: 'pelvis', d: 'M-10 22q10 8 20 0' }]
	},

	/* ---------------------------------------------------------- Isometrics */
	'plank-hold': {
		frames: [FOREARM_PLANK, { torso: 103, thigh: -77, shin: -77, farThigh: -77, farShin: -77 }],
		mat: true,
		dur: 3,
		glow: [['pelvis', 'neck']]
	},
	'high-plank': {
		frames: [HIGH_PLANK, { torso: 116, thigh: -64, shin: -64, farThigh: -64, farShin: -64 }],
		mat: true,
		dur: 3,
		glow: [['pelvis', 'neck']]
	},
	'side-plank': {
		view: 'front',
		frames: [
			{ torso: 104, head: 104, arm: 0, forearm: 90, farArm: 180, farForearm: 180, thigh: -76, shin: -76, farThigh: -76, farShin: -76, foot: -40, farFoot: -40 },
			{ torso: 106, thigh: -74, shin: -74, farThigh: -74, farShin: -74, farArm: 176, farForearm: 176 }
		],
		mat: true,
		dur: 3,
		glow: ['pelvis']
	},
	'wall-sit': {
		frames: [
			{ torso: 180, arm: 20, forearm: 80, farArm: 16, farForearm: 76, thigh: 90, shin: 0, farThigh: 88, farShin: -2 },
			{ arm: 24, forearm: 86 }
		],
		anchor: 'pelvis',
		props: [{ type: 'wall', at: 'pelvis', dx: -5 }],
		glow: [['pelvis', 'knee']]
	},
	squat: {
		frames: [
			{ ...STAND, arm: 90, forearm: 90, farArm: 88, farForearm: 88 },
			{ torso: 145, head: 160, arm: 92, forearm: 92, farArm: 90, farForearm: 90, thigh: 82, shin: -16, farThigh: 80, farShin: -18 }
		],
		dur: 2.4,
		still: 1,
		glow: [['pelvis', 'knee']]
	},
	'squat-hold': {
		frames: [
			{ torso: 145, head: 160, arm: 92, forearm: 92, farArm: 90, farForearm: 90, thigh: 82, shin: -16, farThigh: 80, farShin: -18 },
			{ torso: 147, thigh: 84, farThigh: 82 }
		],
		dur: 3,
		glow: [['pelvis', 'knee']]
	},
	'chair-pose': {
		frames: [
			{ torso: 155, head: 160, arm: 160, forearm: 162, farArm: 158, farForearm: 160, thigh: 70, shin: -16, farThigh: 68, farShin: -18 },
			{ arm: 164, forearm: 166, thigh: 74, farThigh: 72 }
		],
		dur: 3,
		glow: [['pelvis', 'knee']]
	},
	'split-squat': {
		frames: [SPLIT, { thigh: 94, farThigh: -16 }],
		mat: true,
		dur: 3,
		glow: [['pelvis', 'knee']]
	},
	'reverse-lunge': {
		frames: [
			{ ...STAND, arm: -25, forearm: 55, farArm: -30, farForearm: 50, thigh: 0, shin: 0, farThigh: -4, farShin: 0 },
			SPLIT
		],
		anchor: 'foot',
		dur: 2.4,
		still: 1,
		glow: [['pelvis', 'knee']]
	},
	'push-up': {
		frames: [HIGH_PLANK, { torso: 96, head: 96, arm: -108, forearm: -2, farArm: -110, farForearm: -4, thigh: -84, shin: -84, farThigh: -84, farShin: -84 }],
		mat: true,
		anchor: 'foot',
		dur: 2.2,
		glow: [['shoulder', 'elbow']]
	},
	'push-up-hold': {
		frames: [
			{ ...HIGH_PLANK, torso: 104, head: 102, arm: -70, forearm: 0, farArm: -72, farForearm: -2, thigh: -76, shin: -76, farThigh: -76, farShin: -76 },
			{ torso: 103, thigh: -77, shin: -77, farThigh: -77, farShin: -77 }
		],
		mat: true,
		dur: 3,
		glow: [['shoulder', 'elbow']]
	},
	'bridge-hold': {
		frames: [
			{ ...SUPINE, torso: -66, head: -80, arm: 90, forearm: 90, farArm: 88, farForearm: 88, thigh: 124, shin: 4, farThigh: 122, farShin: 2, foot: 94, farFoot: 92 },
			{ torso: -68, thigh: 122 }
		],
		mat: true,
		anchor: 'foot',
		dur: 3,
		glow: ['pelvis']
	},
	'bridge-pulses': {
		frames: [
			{ ...SUPINE, torso: -88, head: -92, arm: 90, forearm: 90, farArm: 88, farForearm: 88, thigh: 140, shin: 18, farThigh: 138, farShin: 16, foot: 108, farFoot: 106 },
			{ torso: -66, head: -80, thigh: 124, shin: 4, farThigh: 122, farShin: 2, foot: 94, farFoot: 92 }
		],
		mat: true,
		anchor: 'foot',
		dur: 1.6,
		still: 1,
		glow: ['pelvis'],
		arrows: [{ at: 'pelvis', d: 'M0 8v-8' }]
	},
	'single-leg-bridge': {
		frames: [
			{ ...SUPINE, torso: -66, head: -80, arm: 90, forearm: 90, farArm: 88, farForearm: 88, thigh: 122, shin: 122, foot: 212, farThigh: 122, farShin: 2, farFoot: 92 },
			{ torso: -68, thigh: 120, shin: 120 }
		],
		mat: true,
		anchor: 'farFoot',
		dur: 3,
		glow: ['pelvis']
	},
	'bear-crawl': {
		frames: [
			{ ...FOURS, torso: 98, head: 96, thigh: 34, shin: -62, farThigh: 32, farShin: -64, foot: 10, farFoot: 8 },
			{ torso: 97, thigh: 36, farThigh: 34 }
		],
		mat: true,
		dur: 3,
		glow: [['pelvis', 'neck']]
	},

	/* ---------------------------------------------------------- Mini band */
	'band-pull-apart': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 40, forearm: -40, farArm: -40, farForearm: 40 },
			{ arm: 76, forearm: 86, farArm: -76, farForearm: -86 }
		],
		dur: 2.6,
		still: 1,
		props: [{ type: 'band', from: 'hand', to: 'farHand', w: 2 }],
		glow: [['shoulder', 'farShoulder']]
	},
	'band-external-rotation': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 4, forearm: -60, farArm: -4, farForearm: 60 },
			{ forearm: 78, farForearm: -78 }
		],
		dur: 2.6,
		still: 1,
		props: [{ type: 'band', from: 'hand', to: 'farHand', w: 2 }],
		glow: ['shoulder', 'farShoulder']
	},
	'band-wall-press': {
		frames: [
			{ ...STAND, torso: 172, head: 174, arm: 102, forearm: 180, farArm: 98, farForearm: 176, thigh: -6, shin: -6, farThigh: -10, farShin: -10 },
			{ torso: 168, arm: 106, farArm: 102 }
		],
		anchor: 'foot',
		dur: 2.6,
		props: [
			{ type: 'wall', at: 'hand', dx: 3.5 },
			{ type: 'band', from: 'hand', to: 'farHand', w: 1.6 }
		],
		glow: ['shoulder']
	},
	'band-bicep': {
		frames: [
			{ ...STAND, arm: 4, forearm: 60, farArm: 14, farForearm: 4 },
			{ forearm: 96 }
		],
		dur: 2.6,
		still: 1,
		props: [{ type: 'band', from: 'hand', to: 'farHand', w: 1.6 }],
		glow: [['shoulder', 'elbow']]
	},
	'band-tricep': {
		frames: [
			{ ...STAND, arm: 6, forearm: 90, farArm: 30, farForearm: -168 },
			{ forearm: 4 }
		],
		dur: 2.6,
		still: 1,
		props: [{ type: 'band', from: 'hand', to: 'farHand', w: 1.6 }],
		glow: [['shoulder', 'elbow']]
	},
	'band-plank': {
		frames: [
			{ ...HIGH_PLANK, arm: 6, forearm: 6, farArm: -10, farForearm: -10 },
			{ arm: 10, forearm: 10, farArm: -14, farForearm: -14 }
		],
		mat: true,
		dur: 2.6,
		props: [{ type: 'band', from: 'hand', to: 'farHand', w: 1.4 }],
		glow: [['pelvis', 'neck']]
	},

	/* -------------------------------------------------- Yoga & full body */
	'downward-dog': {
		frames: [DOWN_DOG, { torso: 46, arm: 46, forearm: 46, farArm: 44, farForearm: 44, thigh: -16, shin: -16, farThigh: -18, farShin: -18 }],
		mat: true,
		dur: 4,
		glow: [['pelvis', 'knee']]
	},
	inchworm: {
		frames: [
			{ ...STAND, torso: 10, head: 4, arm: 4, forearm: 0, farArm: 0, farForearm: -4, thigh: 10, farThigh: 8 },
			DOWN_DOG,
			{ ...HIGH_PLANK, torso: 117 }
		],
		mat: true,
		anchor: 'foot',
		dur: 4.5,
		still: 1,
		glow: [['pelvis', 'knee']]
	},
	'warrior-two': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 90, forearm: 90, farArm: -90, farForearm: -90, thigh: 44, shin: 0, foot: 60, farThigh: -38, farShin: -38, farFoot: -100 },
			{ thigh: 48, shin: 2, arm: 92, forearm: 92, farArm: -92, farForearm: -92 }
		],
		dur: 4,
		glow: [['pelvis', 'knee']]
	},
	'triangle-pose': {
		view: 'front',
		frames: [
			{ torso: 115, head: 125, arm: 4, forearm: 2, farArm: 180, farForearm: 180, thigh: 34, shin: 34, farThigh: -34, farShin: -34, foot: 100, farFoot: -100 },
			{ torso: 112, head: 122, arm: 6, forearm: 4, farArm: 178, farForearm: 178 }
		],
		dur: 4,
		glow: [['pelvis', 'neck']]
	},
	'tree-pose': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 160, forearm: -135, farArm: -160, farForearm: 135, thigh: 46, shin: -75, foot: -40, farThigh: -2, farShin: 0 },
			{ arm: 164, forearm: -140, farArm: -164, farForearm: 140 }
		],
		anchor: 'farFoot',
		dur: 4,
		glow: ['pelvis']
	},
	'worlds-greatest': {
		frames: [
			{ torso: 125, head: 115, arm: 30, forearm: 20, farArm: 4, farForearm: 0, thigh: 98, shin: -4, farThigh: -56, farShin: -66, farFoot: 0 },
			{ arm: 178, forearm: 180, head: 150 }
		],
		mat: true,
		anchor: 'foot',
		dur: 3.6,
		glow: [['pelvis', 'neck']]
	},

	/* --------------------------------------------------------------- Cardio */
	'jumping-jacks': {
		still: 1,
		view: 'front',
		frames: [
			{ ...FRONT, arm: 14, forearm: 8, farArm: -14, farForearm: -8, thigh: 3, shin: 1, farThigh: -3, farShin: -1 },
			{ arm: 156, forearm: 164, farArm: -156, farForearm: -164, thigh: 24, shin: 24, farThigh: -24, farShin: -24 }
		],
		anchor: 'pelvis',
		dur: 1.2
	},
	'high-knees': {
		frames: [
			{ ...STAND, arm: -40, forearm: 60, farArm: 40, farForearm: 150, thigh: 92, shin: 4, farThigh: -2, farShin: 0 },
			{ arm: 40, forearm: 150, farArm: -40, farForearm: 60, thigh: -2, shin: 0, farThigh: 92, farShin: 4 }
		],
		anchor: 'pelvis',
		dur: 0.9,
		glow: ['pelvis']
	},
	'butt-kicks': {
		frames: [
			{ ...STAND, arm: -30, forearm: 50, farArm: 30, farForearm: 140, thigh: -6, shin: -170, foot: -100, farThigh: 0, farShin: 0 },
			{ arm: 30, forearm: 140, farArm: -30, farForearm: 50, thigh: 0, shin: 0, foot: 90, farThigh: -6, farShin: -170, farFoot: -100 }
		],
		anchor: 'pelvis',
		dur: 0.9,
		glow: [['pelvis', 'knee']]
	},
	'mountain-climbers': {
		frames: [
			{ ...HIGH_PLANK, thigh: 55, shin: -40, farThigh: -63, farShin: -63 },
			{ thigh: -63, shin: -63, farThigh: 55, farShin: -40 }
		],
		mat: true,
		anchor: 'hand',
		dur: 1,
		glow: [['pelvis', 'neck']]
	},
	skater: {
		view: 'front',
		frames: [
			{ torso: 160, head: 170, arm: 120, forearm: 130, farArm: -40, farForearm: 20, thigh: 30, shin: -8, foot: 60, farThigh: 50, farShin: -50, farFoot: -120 },
			{ torso: -160, head: -170, arm: 40, forearm: -20, farArm: -120, farForearm: -130, thigh: -50, shin: 50, foot: 120, farThigh: -30, farShin: 8, farFoot: -60 }
		],
		anchor: 'pelvis',
		dur: 1.3,
		glow: ['pelvis']
	},
	'shadow-boxing': {
		still: 1,
		frames: [
			{ ...STAND, torso: 176, arm: 40, forearm: 150, farArm: 30, farForearm: 160, thigh: 16, shin: 0, farThigh: -16, farShin: -4 },
			{ arm: 92, forearm: 92 },
			{ arm: 40, forearm: 150, farArm: 90, farForearm: 90 }
		],
		loop: true,
		anchor: 'foot',
		dur: 1.4
	},

	/* ------------------------------------------------------------ Fallback */
	stretch: {
		still: 0,
		view: 'front',
		frames: [
			{ ...FRONT, torso: 180, head: 180, arm: 150, forearm: 222, farArm: -150, farForearm: -222 },
			{ torso: 172, head: 174, arm: 142, forearm: 214, farArm: -158, farForearm: -230 },
			{ torso: 180, head: 180, arm: 150, forearm: 222, farArm: -150, farForearm: -222 },
			{ torso: 188, head: 186, arm: 158, forearm: 230, farArm: -142, farForearm: -214 }
		],
		loop: true,
		dur: 6
	},

	/* ------------------------------------------------- RSI and thoracic outlet */
	'chin-tuck': {
		frames: [{ ...STAND, head: 170 }, { head: 188 }],
		dur: 2.4,
		glow: ['neck'],
		arrows: [{ at: 'head', d: 'M8 -2h-6', gold: true }]
	},
	scalene: {
		view: 'front',
		frames: [{ ...FRONT, head: 192, farArm: -8, farForearm: 128 }, { head: 208 }],
		glow: [['neck', 'shoulder']],
		arrows: [{ at: 'head', d: 'M-4 -10q-6 2 -8 8', gold: true }]
	},
	levator: {
		frames: [{ ...STAND, head: 150, arm: 172, forearm: 112 }, { head: 132, arm: 166, forearm: 104 }],
		glow: [['neck', 'shoulder']],
		arrows: [{ at: 'head', d: 'M6 -4q3 5 0 9', gold: true }]
	},
	'wrist-flexor': {
		frames: [
			{ ...STAND, arm: 90, forearm: 90, farArm: 62, farForearm: 104 },
			{ arm: 88, forearm: 88, farArm: 58, farForearm: 108 }
		],
		glow: [['elbow', 'hand']],
		arrows: [{ at: 'hand', d: 'M5 3q2 -6 -2 -9', gold: true }]
	},
	'wrist-extensor': {
		frames: [
			{ ...STAND, arm: 90, forearm: 90, farArm: 70, farForearm: 96 },
			{ arm: 88, forearm: 88, farArm: 66, farForearm: 100 }
		],
		glow: [['elbow', 'hand']],
		arrows: [{ at: 'hand', d: 'M5 -3q2 6 -2 9', gold: true }]
	},
	'prayer-stretch': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 34, forearm: -92, farArm: -34, farForearm: 92 },
			{ arm: 50, forearm: -100, farArm: -50, farForearm: 100 }
		],
		dur: 3,
		glow: ['hand'],
		arrows: [{ at: 'hand', d: 'M0 8v6', gold: true }]
	},
	'tendon-glides': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 18, forearm: 160, farArm: -18, farForearm: -160 },
			{ arm: 22, forearm: 150, farArm: -22, farForearm: -150 }
		],
		dur: 2,
		glow: ['hand', 'farHand']
	},
	'nerve-glide': {
		view: 'front',
		frames: [{ ...FRONT, arm: 92, forearm: 96 }, { arm: 94, forearm: 108, head: 200 }],
		dur: 2.6,
		glow: [['shoulder', 'elbow']],
		arrows: [{ at: 'head', d: 'M-6 -10q-6 2 -8 8' }]
	},
	'ulnar-glide': {
		view: 'front',
		frames: [{ ...FRONT, arm: 100, forearm: -160 }, { arm: 94, forearm: -140, head: 196 }],
		dur: 2.6,
		glow: ['elbow']
	},
	'radial-glide': {
		view: 'front',
		frames: [{ ...FRONT, arm: 14, forearm: 6 }, { arm: 30, forearm: 22, head: 200 }],
		dur: 2.6,
		glow: [['shoulder', 'hand']],
		arrows: [{ at: 'head', d: 'M-6 -10q-6 2 -8 8' }]
	},
	'doorway-stretch': {
		frames: [
			{ ...STAND, arm: -88, forearm: 180, farArm: -92, farForearm: 176, thigh: 18, shin: 4, farThigh: -10, farShin: -6 },
			{ torso: 172, head: 176, arm: -100, forearm: 178, farArm: -104, farForearm: 174, thigh: 24, shin: 2 }
		],
		anchor: 'hand',
		props: [{ type: 'wall', at: 'hand', dx: -1.5 }],
		glow: [['shoulder', 'neck']],
		arrows: [{ at: 'neck', d: 'M4 -4h6', gold: true }]
	},
	'thoracic-extension': {
		frames: [
			{ ...STAND, head: 184, arm: 152, forearm: -132, farArm: 148, farForearm: -136 },
			{ head: 210, bend: -5, arm: 164, forearm: -120, farArm: 160, farForearm: -124 }
		],
		dur: 3.4,
		glow: [['neck', 'pelvis']],
		arrows: [{ at: 'head', d: 'M-2 -10q-6 0 -9 5' }]
	},
	'belly-breathing': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 12, forearm: -64, farArm: -12, farForearm: 64 },
			{ arm: 16, forearm: -60, farArm: -16, farForearm: 60 }
		],
		dur: 4.5,
		glow: [['neck', 'pelvis']]
	},

	/* -------------------------------------------- Finger extensor band (one hand) */
	'finger-band': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 48, forearm: 160, farArm: -16, farForearm: -8 },
			{ arm: 50, forearm: 164 }
		],
		dur: 2.2,
		glow: ['hand'],
		arrows: [
			{ at: 'hand', d: 'M1 -5v-6', gold: true },
			{ at: 'hand', d: 'M4 -3l5 -5', gold: true },
			{ at: 'hand', d: 'M5 1h7', gold: true }
		]
	},
	'thumb-band': {
		view: 'front',
		frames: [
			{ ...FRONT, arm: 48, forearm: 160, farArm: -16, farForearm: -8 },
			{ arm: 50, forearm: 164 }
		],
		dur: 2.2,
		glow: ['hand'],
		arrows: [{ at: 'hand', d: 'M-3 -3l-4 -6', gold: true }]
	},

	/* ------------------------------------------------------- Wrist dumbbell */
	'db-wrist-extension': {
		frames: [{ ...STAND, arm: 22, forearm: 98 }, { forearm: 82 }],
		dur: 2.4,
		props: [{ type: 'dumbbell', at: 'hand', angle: [8, -14] }],
		glow: [['elbow', 'hand']],
		arrows: [{ at: 'hand', d: 'M6 2v-8', gold: true }]
	},
	'db-wrist-flexion': {
		frames: [{ ...STAND, arm: 22, forearm: 82 }, { forearm: 98 }],
		dur: 2.4,
		props: [{ type: 'dumbbell', at: 'hand', angle: [-14, 8] }],
		glow: [['elbow', 'hand']],
		arrows: [{ at: 'hand', d: 'M6 -6v8', gold: true }]
	},
	'db-forearm-rotation': {
		frames: [{ ...STAND, arm: 22, forearm: 90 }, { forearm: 91 }],
		dur: 2.6,
		props: [{ type: 'dumbbell', at: 'hand', angle: [0, 90] }],
		glow: [['elbow', 'hand']],
		arrows: [{ at: 'hand', d: 'M-2 -8a8 8 0 0 1 10 6', gold: true }]
	},
	'db-ulnar-deviation': {
		frames: [{ ...STAND, arm: 14, forearm: 18 }, { forearm: 20 }],
		dur: 2.4,
		props: [{ type: 'dumbbell', at: 'hand', angle: [90, 118] }],
		glow: ['hand'],
		arrows: [{ at: 'hand', d: 'M-6 4v-7', gold: true }]
	},
	'db-radial-deviation': {
		frames: [{ ...STAND, arm: 14, forearm: 18 }, { forearm: 20 }],
		dur: 2.4,
		props: [{ type: 'dumbbell', at: 'hand', angle: [90, 62] }],
		glow: ['hand'],
		arrows: [{ at: 'hand', d: 'M6 4v-7', gold: true }]
	}
};
