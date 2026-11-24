<script lang="ts">
	import Modal from './Modal.svelte';

	let { onclose }: { onclose: () => void } = $props();
</script>

<Modal title="When to get it checked" subtitle="General guidance, not a diagnosis" {onclose}>
	<div class="signs">
		<p class="small">See a GP or physio soon if:</p>
		<ul>
			<li>pain isn’t settling after a few weeks, or keeps getting worse</li>
			<li>about six weeks of regular practice haven’t made a real difference</li>
			<li>it wakes you at night, or aches all the time whether you move or not</li>
			<li>numbness, tingling or pins and needles are spreading or lasting</li>
			<li>your grip or hand feels weak, you drop things, or the base of your thumb looks thinner</li>
			<li>neck pain comes with fever, weight loss you can’t explain, or a history of cancer</li>
		</ul>
		<p class="small">Get help the same day if:</p>
		<ul>
			<li>your hands have become clumsy (buttons, writing) or your balance is off</li>
			<li>you suddenly can’t straighten a finger or thumb</li>
			<li>it started with a fall or injury, or a joint looks out of shape</li>
			<li>the area is hot, red and swollen, or you have a fever</li>
		</ul>
		<p class="muted small">
			Most RSI settles over a few months with lighter loading and regular movement. Stop any exercise that makes
			tingling or numbness worse.
		</p>
		<button class="btn primary" style="width: 100%" onclick={onclose}>Got it</button>
	</div>
</Modal>

<style>
	.signs p {
		margin: 0 0 0.3rem;
	}
	.signs ul {
		margin: 0 0 0.9rem;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.25rem;
	}
</style>
