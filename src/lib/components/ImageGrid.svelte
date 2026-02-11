<script>
	/**
	 * @type {{ images?: string[] }}
	 */
	let { images = [] } = $props();
	import {
		Lightbox,
		LightboxGallery,
		GalleryThumbnail,
		GalleryImage
	} from 'svelte-lightbox';

	/** @type {Set<number>} */
	let loadedIndices = $state(new Set());

	/**
	 * Split images into frames of max 4 images each
	 * @param {string[]} imgs
	 * @returns {string[][]}
	 */
	function getFrames(imgs) {
		/** @type {string[][]} */
		const frames = [];
		for (let i = 0; i < imgs.length; i += 4) {
			frames.push(imgs.slice(i, i + 4));
		}
		return frames;
	}

	/** @param {number} fi @param {number} i */
	function getGlobalIndex(fi, i) {
		return fi * 4 + i;
	}

	/** @param {number} fi @param {number} i */
	function markLoaded(fi, i) {
		loadedIndices = new Set(loadedIndices);
		loadedIndices.add(getGlobalIndex(fi, i));
	}

	const frames = $derived(getFrames(images));
</script>

{#if images.length > 0}
	<div class="image-frames">
		{#each frames as frame, fi}
			<div class="image-frame layout-{frame.length}">
				{#each frame as src, i}
					{@const gix = getGlobalIndex(fi, i)}
					<div class="image-cell">
						{#if !loadedIndices.has(gix)}
							<div class="image-skeleton" aria-hidden="true"></div>
						{/if}
						<Lightbox description="Simple lightbox">
							<img
								src={src}
								alt="Post image {gix + 1}"
								loading="lazy"
								decoding="async"
								class:loaded={loadedIndices.has(gix)}
								onload={() => markLoaded(fi, i)}
							/>
						</Lightbox>
					</div>
				{/each}
			</div>
		{/each}
	</div>
{/if}

<style>
	.image-frames {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin: 2rem 0;
	}

	.image-frame {
		display: grid;
		gap: 0.5rem;
		width: 100%;
		aspect-ratio: 16 / 10;
		border-radius: 10px;
		overflow: hidden;
		background: var(--color-bg-alt);
	}

	/* 1 image: full frame, half height */
	.layout-1 {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		aspect-ratio: 16 / 5;
	}

	/* 2 images: side by side */
	.layout-2 {
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
	}

	/* 3 images: 2 on top, 1 centered below */
	.layout-3 {
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
	}

	.layout-3 .image-cell:nth-child(3) {
		grid-column: 1 / -1;
	}

	/* 4 images: 2x2 grid */
	.layout-4 {
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
	}

	.image-cell {
		overflow: hidden;
		position: relative;
	}

	.image-skeleton {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			110deg,
			var(--color-bg-alt, #f3f4f6) 25%,
			var(--color-border-light, #e5e7eb) 50%,
			var(--color-bg-alt, #f3f4f6) 75%
		);
		background-size: 200% 100%;
		animation: skeleton-shine 1.2s ease-in-out infinite;
		border-radius: 4px;
	}

	.image-cell img {
		opacity: 0;
		transition: opacity 0.25s ease;
	}

	.image-cell img.loaded {
		opacity: 1;
	}

	@keyframes skeleton-shine {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Make the Lightbox wrapper fill the cell so the image can fill the space */
	.image-cell :global(> *) {
		width: 100%;
		height: 100%;
		display: block;
		min-width: 0;
		min-height: 0;
	}

	.image-cell img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 4px;
		transition: transform 0.3s ease;
		display: block;
	}

	.image-cell img:hover {
		transform: scale(1.02);
	}
</style>
