/**
 * Pose engine for stretch illustrations.
 *
 * A pose is a set of absolute segment angles (forward kinematics), so every
 * figure shares the same proportions. Angles use dir(θ) = (sin θ, cos θ) in
 * screen space: 0 = down, 90 = right, 180 = up, -90 = left.
 * The figure is grounded on the floor automatically and centred unless placed.
 */

export type Pt = [number, number];

export type JointName =
	| 'head'
	| 'neck'
	| 'shoulder'
	| 'farShoulder'
	| 'pelvis'
	| 'elbow'
	| 'hand'
	| 'farElbow'
	| 'farHand'
	| 'knee'
	| 'foot'
	| 'farKnee'
	| 'farFoot';

export interface Angles {
	torso: number;
	/** neck → head direction; defaults to torso */
	head?: number;
	/** spine curve, positive bows toward the front */
	bend?: number;
	arm: number;
	forearm: number;
	farArm: number;
	farForearm: number;
	thigh: number;
	shin: number;
	farThigh: number;
	farShin: number;
	/** foot direction; defaults to perpendicular to the shin, toward the front */
	foot?: number;
	farFoot?: number;
}

export type Prop =
	| { type: 'wall'; at: JointName; dx: number }
	| { type: 'block'; at: JointName; w?: number; dx?: number }
	| { type: 'band'; from: JointName; to: JointName; w?: number }
	/** handle direction per frame (same angle convention as limbs) */
	| { type: 'dumbbell'; at: JointName; angle: number[] };

export interface Arrow {
	at: JointName;
	/** path relative to the joint */
	d: string;
	gold?: boolean;
}

export interface PoseDef {
	view?: 'side' | 'front';
	/** which way the front of the body points, relative to the spine */
	facing?: 1 | -1;
	frames: [Angles, ...Partial<Angles>[]];
	/** cycle frames A→B→C→A instead of ping-pong */
	loop?: boolean;
	dur?: number;
	/** joint kept at a fixed x across frames */
	anchor?: JointName;
	/** place the anchor joint at this x instead of centring */
	x?: number;
	/** lift the figure off the floor per frame (e.g. a hop) */
	lift?: number[];
	/** frame shown when not animated */
	still?: number;
	mat?: boolean;
	props?: Prop[];
	/** highlighted muscle: a joint or the midpoint of two joints */
	glow?: Array<JointName | [JointName, JointName]>;
	arrows?: Arrow[];
}

export type Layer =
	| {
			tag: 'path';
			d: string[];
			stroke?: string;
			fill?: string;
			width?: number;
			opacity?: number;
			dash?: string;
			cls?: string;
			marker?: string;
	  }
	| { tag: 'circle'; cx: number[]; cy: number[]; r: number; fill: string; opacity?: number; cls?: string }
	| { tag: 'rect'; x: number; y: number; w: number; h: number; rx: number; fill: string; opacity?: number };

export interface Rendered {
	layers: Layer[];
	/** SMIL values helper: indices into the frame arrays, in play order */
	order: number[];
	dur: number;
	still: number;
}

export const FLOOR = 70;
const L = { torso: 19, head: 7, arm: 11, forearm: 10, thigh: 14, shin: 13, foot: 3.6 };
const R = { head: 5.4, hand: 2.3, trunk: 4.3, limb: 2.6 };

const C = {
	shirt: 'var(--ill-shirt)',
	shirtFar: 'var(--ill-shirt-far)',
	pants: 'var(--ill-body)',
	pantsFar: 'var(--ill-body-far)',
	skin: 'var(--ill-skin)',
	hair: 'var(--ill-hair)',
	shoe: 'var(--ill-shoe)',
	accent: 'var(--ill-accent)',
	gold: 'var(--ill-gold)',
	mat: 'var(--ill-mat)',
	wall: 'var(--ill-wall)',
	band: 'var(--ill-band)',
	weight: 'var(--ill-weight)'
};

const rad = (deg: number) => (deg * Math.PI) / 180;
const dir = (deg: number): Pt => [Math.sin(rad(deg)), Math.cos(rad(deg))];
const add = (a: Pt, b: Pt, s = 1): Pt => [a[0] + b[0] * s, a[1] + b[1] * s];
const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const n2 = (v: number) => Math.round(v * 100) / 100;
const pt = (p: Pt) => `${n2(p[0])} ${n2(p[1])}`;

interface Skeleton {
	joints: Record<JointName, Pt>;
	spineMid: Pt;
	toe: Pt;
	farToe: Pt;
	hipNear: Pt;
	hipFar: Pt;
	face: Pt;
	up: Pt;
}

function solve(a: Angles, view: 'side' | 'front', facing: 1 | -1): Skeleton {
	const pelvis: Pt = [0, 0];
	const up = dir(a.torso);
	const right: Pt = [-up[1] * facing, up[0] * facing];
	const neck = add(pelvis, up, L.torso);
	const bend = a.bend ?? 0;
	const spineMid = add(mid(pelvis, neck), right, bend);

	const front = view === 'front';
	const sw = front ? 4.6 : 0;
	const hw = front ? 3 : 0;
	const shoulderBase = add(neck, up, -1.6);
	const shoulder = add(shoulderBase, right, sw);
	const farShoulder = add(shoulderBase, right, -sw);
	const hipNear = add(pelvis, right, hw);
	const hipFar = add(pelvis, right, -hw);

	const headDir = dir(a.head ?? a.torso);
	const head = add(neck, headDir, L.head);
	const elbow = add(shoulder, dir(a.arm), L.arm);
	const hand = add(elbow, dir(a.forearm), L.forearm);
	const farElbow = add(farShoulder, dir(a.farArm), L.arm);
	const farHand = add(farElbow, dir(a.farForearm), L.forearm);
	const knee = add(hipNear, dir(a.thigh), L.thigh);
	const foot = add(knee, dir(a.shin), L.shin);
	const farKnee = add(hipFar, dir(a.farThigh), L.thigh);
	const farFoot = add(farKnee, dir(a.farShin), L.shin);
	const footLen = front ? 2.4 : L.foot;
	const toe = add(foot, dir(a.foot ?? a.shin + (front ? 30 : 90 * facing)), footLen);
	const farToe = add(farFoot, dir(a.farFoot ?? a.farShin + (front ? -30 : 90 * facing)), footLen);
	const face: Pt = [-headDir[1] * facing, headDir[0] * facing];

	return {
		joints: { head, neck, shoulder, farShoulder, pelvis, elbow, hand, farElbow, farHand, knee, foot, farKnee, farFoot },
		spineMid,
		toe,
		farToe,
		hipNear,
		hipFar,
		face,
		up: headDir
	};
}

function shift(s: Skeleton, dx: number, dy: number): Skeleton {
	const m = (p: Pt): Pt => [p[0] + dx, p[1] + dy];
	const joints = Object.fromEntries(Object.entries(s.joints).map(([k, v]) => [k, m(v)])) as Skeleton['joints'];
	return { ...s, joints, spineMid: m(s.spineMid), toe: m(s.toe), farToe: m(s.farToe), hipNear: m(s.hipNear), hipFar: m(s.hipFar) };
}

function radius(name: JointName): number {
	if (name === 'head') return R.head;
	if (name === 'hand' || name === 'farHand') return R.hand;
	if (name === 'pelvis' || name === 'neck' || name === 'shoulder' || name === 'farShoulder') return R.trunk;
	return R.limb;
}

function extents(s: Skeleton) {
	let minX = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const [name, p] of Object.entries(s.joints) as [JointName, Pt][]) {
		const r = radius(name);
		minX = Math.min(minX, p[0] - r);
		maxX = Math.max(maxX, p[0] + r);
		maxY = Math.max(maxY, p[1] + r);
	}
	for (const p of [s.toe, s.farToe, s.spineMid]) {
		minX = Math.min(minX, p[0] - R.limb);
		maxX = Math.max(maxX, p[0] + R.limb);
		maxY = Math.max(maxY, p[1] + R.limb);
	}
	return { minX, maxX, maxY };
}

function hairPath(s: Skeleton, front: boolean): string {
	const c = s.joints.head;
	const f = s.face;
	const u = s.up;
	const r = R.head + 0.35;
	const at = (deg: number): Pt => add(c, [f[0] * Math.cos(rad(deg)) + u[0] * Math.sin(rad(deg)), f[1] * Math.cos(rad(deg)) + u[1] * Math.sin(rad(deg))], r);
	const [a, b] = front ? [12, 168] : [62, 212];
	const cross = f[0] * u[1] - f[1] * u[0];
	const sweep = cross < 0 ? 0 : 1;
	const inner = add(c, u, front ? 1.2 : 0.6);
	return `M${pt(at(a))}A${r} ${r} 0 0 ${sweep} ${pt(at(b))}Q${pt(inner)} ${pt(at(a))}Z`;
}

function bandPath(a: Pt, b: Pt, w: number): string {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const len = Math.hypot(dx, dy) || 1;
	const nx = (-dy / len) * w;
	const ny = (dx / len) * w;
	const m = mid(a, b);
	return `M${pt(a)}Q${pt([m[0] + nx, m[1] + ny])} ${pt(b)}Q${pt([m[0] - nx, m[1] - ny])} ${pt(a)}Z`;
}

export function renderPose(def: PoseDef): Rendered {
	const view = def.view ?? 'side';
	const facing = def.facing ?? 1;
	const front = view === 'front';
	const base = def.frames[0];
	const angles = def.frames.map((f) => ({ ...base, ...f }) as Angles);
	const anchor = def.anchor ?? 'foot';

	const raw = angles.map((a) => solve(a, view, facing));
	const first = extents(raw[0]);
	const dx0 = def.x !== undefined ? def.x - raw[0].joints[anchor][0] : 50 - (first.minX + first.maxX) / 2;
	const anchorX = raw[0].joints[anchor][0] + dx0;
	const sk = raw.map((s, i) => {
		const dx = anchorX - s.joints[anchor][0];
		const dy = FLOOR - 0.6 - extents(s).maxY - (def.lift?.[i] ?? 0);
		return shift(s, dx, dy);
	});

	const P = (fn: (s: Skeleton) => string) => sk.map(fn);
	const J = (name: JointName) => sk.map((s) => s.joints[name]);
	const layers: Layer[] = [];
	// static scenery and arrows follow the frame shown when not animating
	const rest = sk[Math.min(def.still ?? 0, sk.length - 1)];

	// Scenery
	for (const prop of def.props ?? []) {
		if (prop.type === 'wall') {
			const x = rest.joints[prop.at][0] + prop.dx;
			const w = 14;
			const left = prop.dx < 0;
			layers.push({ tag: 'rect', x: left ? x - w : x, y: 4, w, h: FLOOR - 4, rx: 0, fill: C.wall });
			layers.push({ tag: 'path', d: [`M${n2(x)} 4V${FLOOR}`], stroke: C.wall, width: 1.6, opacity: 1 });
		} else if (prop.type === 'block') {
			const p = rest.joints[prop.at];
			const w = prop.w ?? 14;
			const top = p[1] + radius(prop.at);
			layers.push({ tag: 'rect', x: n2(p[0] + (prop.dx ?? 0) - w / 2), y: n2(top), w, h: n2(FLOOR - top), rx: 1.5, fill: C.wall });
		}
	}
	if (def.mat) layers.push({ tag: 'rect', x: 8, y: FLOOR - 1.6, w: 84, h: 3.2, rx: 1.6, fill: C.mat, opacity: 0.85 });
	else layers.push({ tag: 'path', d: [`M8 ${FLOOR + 0.6}H92`], stroke: C.mat, width: 1.4, opacity: 0.8 });

	const e = extents(rest);
	const shadowRx = n2(Math.max(8, (e.maxX - e.minX) / 2));
	layers.push({
		tag: 'path',
		d: [`M${n2((e.minX + e.maxX) / 2 - shadowRx)} ${FLOOR}a${shadowRx} 2.2 0 1 0 ${n2(shadowRx * 2)} 0a${shadowRx} 2.2 0 1 0 ${n2(-shadowRx * 2)} 0`],
		fill: 'var(--ill-shadow)'
	});

	for (const g of def.glow ?? []) {
		const pts = Array.isArray(g) ? sk.map((s) => mid(s.joints[g[0]], s.joints[g[1]])) : J(g);
		layers.push({ tag: 'circle', cx: pts.map((p) => n2(p[0])), cy: pts.map((p) => n2(p[1])), r: 8, fill: 'url(#ill-glow)', cls: 'glow-pulse' });
	}

	const limb = (a: JointName, b: JointName, c: JointName) => P((s) => `M${pt(s.joints[a])}L${pt(s.joints[b])}L${pt(s.joints[c])}`);
	const legPath = (hip: 'hipNear' | 'hipFar', k: JointName, f: JointName) => P((s) => `M${pt(s[hip])}L${pt(s.joints[k])}L${pt(s.joints[f])}`);
	const shoe = (f: JointName, t: 'toe' | 'farToe') => P((s) => `M${pt(s.joints[f])}L${pt(s[t])}`);
	const hand = (h: JointName): Layer => ({ tag: 'circle', cx: J(h).map((p) => n2(p[0])), cy: J(h).map((p) => n2(p[1])), r: R.hand, fill: C.skin });

	const armW = 4.3;
	const legW = 5.4;
	const shirtFar = front ? C.shirt : C.shirtFar;
	const pantsFar = front ? C.pants : C.pantsFar;

	// Far side limbs
	layers.push({ tag: 'path', d: shoe('farFoot', 'farToe'), stroke: C.shoe, width: 4 });
	layers.push({ tag: 'path', d: legPath('hipFar', 'farKnee', 'farFoot'), stroke: pantsFar, width: legW });
	if (!front) {
		layers.push({ tag: 'path', d: limb('farShoulder', 'farElbow', 'farHand'), stroke: shirtFar, width: armW });
		layers.push(hand('farHand'));
	}

	// Bands sit between far and near limbs
	for (const prop of def.props ?? []) {
		if (prop.type !== 'band') continue;
		layers.push({ tag: 'path', d: P((s) => bandPath(s.joints[prop.from], s.joints[prop.to], prop.w ?? 2.4)), stroke: C.band, width: 1.8, fill: 'none' });
	}

	// Trunk
	layers.push({ tag: 'path', d: shoe('foot', 'toe'), stroke: C.shoe, width: 4 });
	layers.push({ tag: 'path', d: legPath('hipNear', 'knee', 'foot'), stroke: C.pants, width: legW });
	layers.push({
		tag: 'path',
		d: P((s) => `M${pt(s.hipNear)}L${pt(s.hipFar)}`),
		stroke: C.pants,
		width: front ? 7 : 8
	});
	layers.push({
		tag: 'path',
		d: P((s) => `M${pt(add(s.joints.pelvis, s.up, 0))}Q${pt(s.spineMid)} ${pt(s.joints.neck)}`),
		stroke: C.shirt,
		width: front ? 10.5 : 8.6
	});
	layers.push({ tag: 'path', d: P((s) => `M${pt(s.joints.neck)}L${pt(add(s.joints.neck, s.up, 2.4))}`), stroke: C.skin, width: 3.2 });
	if (front) {
		layers.push({ tag: 'path', d: limb('farShoulder', 'farElbow', 'farHand'), stroke: shirtFar, width: armW });
		layers.push(hand('farHand'));
	}
	layers.push({ tag: 'circle', cx: J('head').map((p) => n2(p[0])), cy: J('head').map((p) => n2(p[1])), r: R.head, fill: C.skin });
	layers.push({ tag: 'path', d: P((s) => hairPath(s, front)), fill: C.hair });

	// Near arm on top, gripping any dumbbell
	layers.push({ tag: 'path', d: limb('shoulder', 'elbow', 'hand'), stroke: C.shirt, width: armW });
	for (const prop of def.props ?? []) {
		if (prop.type !== 'dumbbell') continue;
		const ends = sk.map((s, i) => {
			const a = prop.angle[Math.min(i, prop.angle.length - 1)] * (Math.PI / 180);
			const d: Pt = [Math.sin(a), Math.cos(a)];
			const n: Pt = [-d[1], d[0]];
			const p = s.joints[prop.at];
			return { a: add(p, d, -3.6), b: add(p, d, 3.6), n };
		});
		layers.push({ tag: 'path', d: ends.map((e) => `M${pt(e.a)}L${pt(e.b)}`), stroke: C.weight, width: 1.6 });
		layers.push({
			tag: 'path',
			d: ends.map((e) => `M${pt(add(e.a, e.n, 2.3))}L${pt(add(e.a, e.n, -2.3))}M${pt(add(e.b, e.n, 2.3))}L${pt(add(e.b, e.n, -2.3))}`),
			stroke: C.weight,
			width: 2.6
		});
	}
	layers.push(hand('hand'));

	for (const a of def.arrows ?? []) {
		const p = rest.joints[a.at];
		layers.push({
			tag: 'path',
			d: [relPath(a.d, p)],
			stroke: a.gold ? C.gold : C.accent,
			width: 1.7,
			dash: '3 2.4',
			cls: 'anim-dash-flow',
			marker: a.gold ? 'url(#motion-gold-arrow)' : 'url(#motion-arrow)'
		});
	}

	const n = sk.length;
	const order = def.loop ? [...Array(n).keys(), 0] : n > 1 ? [...Array(n).keys(), ...[...Array(n - 1).keys()].reverse()] : [0];
	return { layers, order, dur: def.dur ?? 3.2, still: def.still ?? 0 };
}

/** Translate a path whose first command is a relative-style `M x y` to an absolute joint position. */
function relPath(d: string, p: Pt): string {
	return d.replace(/^M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/, (_, x, y) => `M${n2(p[0] + Number(x))} ${n2(p[1] + Number(y))}`);
}
