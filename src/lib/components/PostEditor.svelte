<script>
	/**
	 * @type {{
	 *   post?: any,
	 *   onSave?: (data: any) => void,
	 *   saving?: boolean,
	 *   error?: string
	 * }}
	 */
	const props = $props();

	// Destructure with defaults
	const post = props.post ?? null;
	const onSave = props.onSave;

	// These need to stay reactive (read from props each render)
	const isSaving = $derived(props.saving ?? false);
	const errorMsg = $derived(props.error ?? '');

	let title = $state(post?.title || '');
	let excerpt = $state(post?.excerpt || '');
	let content = $state(post?.content || '');
	let status = $state(post?.status || 'draft');
	let metaTitle = $state(post?.meta_title || '');
	let metaDescription = $state(post?.meta_description || '');
	let ogImage = $state(post?.og_image || '');
	
	// Track if user has manually edited these fields
	let metaTitleManuallyEdited = $state(false);
	let metaDescriptionManuallyEdited = $state(false);
	
	// Initialize manual edit flags based on existing data
	$effect(() => {
		if (post?.meta_title && post.meta_title !== post?.title) {
			metaTitleManuallyEdited = true;
		}
		if (post?.meta_description && post.meta_description !== post?.excerpt) {
			metaDescriptionManuallyEdited = true;
		}
	});
	
	// Auto-sync Meta title with title (unless manually edited)
	$effect(() => {
		if (title && !metaTitleManuallyEdited) {
			metaTitle = title;
		}
	});
	
	// Auto-sync Meta description with excerpt (unless manually edited)
	$effect(() => {
		if (excerpt && !metaDescriptionManuallyEdited) {
			metaDescription = excerpt;
		}
	});
	
	// Track manual edits
	function handleMetaTitleInput() {
		metaTitleManuallyEdited = true;
	}
	
	function handleMetaDescriptionInput() {
		metaDescriptionManuallyEdited = true;
	}
	
	// Reset sync functions
	function resetMetaTitleSync() {
		metaTitleManuallyEdited = false;
		metaTitle = title;
	}
	
	function resetMetaDescriptionSync() {
		metaDescriptionManuallyEdited = false;
		metaDescription = excerpt;
	}
	let tagsInput = $state(post?.tags?.join(', ') || '');
	let images = $state(post?.images || []);
	let uploading = $state(false);
	let showSeo = $state(true);
	let validationError = $state('');

	function handleSubmit(e) {
		e.preventDefault();
		validationError = '';
		const trimmedTitle = typeof title === 'string' ? title.trim() : '';
		if (!trimmedTitle) {
			validationError = 'Please enter a post title.';
			return;
		}
		const tags = tagsInput
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);

		onSave?.({
			title: trimmedTitle,
			excerpt: excerpt.trim(),
			content,
			status,
			meta_title: metaTitle,
			meta_description: metaDescription,
			og_image: ogImage,
			tags,
			images
		});
	}

	async function handleImageUpload(e) {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		uploading = true;
		try {
			for (const file of files) {
				const formData = new FormData();
				formData.append('file', file);

				const res = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				if (res.ok) {
					const data = await res.json();
					images = [...images, data.url];
				}
			}
		} catch (err) {
			console.error('Upload failed:', err);
		}
		uploading = false;
		e.target.value = '';
	}

	function removeImage(index) {
		images = images.filter((_, i) => i !== index);
	}

	function setAsOgImage(url) {
		ogImage = url;
		// Auto-expand SEO section so user can see the change
		showSeo = true;
	}
</script>

<form class="editor-form" onsubmit={handleSubmit}>
	{#if errorMsg || validationError}
		<div class="error-banner">{errorMsg || validationError}</div>
	{/if}

	<div class="editor-main">
		<div class="editor-content-area">
			<div class="form-group">
				<input
					type="text"
					class="input title-input"
					placeholder="Post title"
					bind:value={title}
					required
				/>
			</div>

			<div class="form-group">
				<textarea
					class="input excerpt-input"
					placeholder="Brief description of your post..."
					bind:value={excerpt}
					rows="3"
				></textarea>
			</div>

			<div class="form-group">
				<textarea
					class="input content-input"
					placeholder="Write your post in Markdown..."
					bind:value={content}
					rows="24"
				></textarea>
			</div>
		</div>

		<div class="editor-sidebar">
			<div class="sidebar-section">
				<h3 class="sidebar-title">Publish</h3>
				<div class="form-group">
				<label class="form-label" for="post-status">Status</label>
				<select id="post-status" class="input" bind:value={status}>
						<option value="draft">Draft</option>
						<option value="published">Published</option>
					</select>
				</div>
				<div class="publish-actions">
					<button
						type="submit"
						class="btn btn-primary"
						disabled={isSaving}
						title={isSaving ? 'Saving...' : !title?.trim() ? 'Enter a post title first' : ''}
					>
						{isSaving ? 'Saving...' : status === 'published' ? 'Publish' : 'Save Draft'}
					</button>
				</div>
			</div>

			<div class="sidebar-section">
				<h3 class="sidebar-title">Tags</h3>
				<input
					type="text"
					class="input"
					placeholder="tag1, tag2, tag3"
					bind:value={tagsInput}
				/>
				<p class="help-text">Separate with commas</p>
			</div>

			<div class="sidebar-section">
				<h3 class="sidebar-title">Images</h3>
				<label class="upload-area">
					<input
						type="file"
						accept="image/*"
						multiple
						onchange={handleImageUpload}
						class="file-input"
					/>
					<span class="upload-label">
						{uploading ? 'Uploading...' : 'Click to upload images'}
					</span>
				</label>
				<p class="help-text">Use "Set as OG Image" to add images to social media previews</p>
				{#if images.length > 0}
					<div class="image-list">
						{#each images as img, i}
							<div class="image-item" class:og-active={ogImage === img}>
								<img src={img} alt="Uploaded {i + 1}" class="image-thumb" />
								<div class="image-item-actions">
									<button 
										type="button" 
										class="btn btn-sm" 
										class:btn-primary={ogImage === img}
										class:btn-secondary={ogImage !== img}
										onclick={() => setAsOgImage(img)}
									>
										{ogImage === img ? 'OG Image ✓' : 'Set as OG Image'}
									</button>
									<button type="button" class="btn btn-sm btn-danger" onclick={() => removeImage(i)}>
										&times;
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="sidebar-section">
				<button type="button" class="seo-toggle" onclick={() => (showSeo = !showSeo)}>
					<span>SEO Settings</span>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class:rotated={showSeo}>
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</button>
				{#if showSeo}
					<div class="seo-fields">
						<div class="form-group">
						<label class="form-label" for="meta-title">
							Meta title
							{#if !metaTitleManuallyEdited}
								<span class="auto-sync-indicator">🔗 Auto-synced with title</span>
							{:else}
								<button 
									type="button" 
									class="sync-reset-btn" 
									onclick={resetMetaTitleSync}
									title="Reset to auto-sync with title"
								>
									🔗 Re-sync with title
								</button>
							{/if}
						</label>
						<input 
							id="meta-title" 
							type="text" 
							class="input" 
							bind:value={metaTitle} 
							placeholder="SEO title" 
							oninput={handleMetaTitleInput}
						/>
						</div>
						<div class="form-group">
						<label class="form-label" for="meta-desc">
							Meta description
							{#if !metaDescriptionManuallyEdited}
								<span class="auto-sync-indicator">🔗 Auto-synced with excerpt</span>
							{:else}
								<button 
									type="button" 
									class="sync-reset-btn" 
									onclick={resetMetaDescriptionSync}
									title="Reset to auto-sync with excerpt"
								>
									🔗 Re-sync with excerpt
								</button>
							{/if}
						</label>
						<textarea 
							id="meta-desc" 
							class="input" 
							bind:value={metaDescription} 
							placeholder="SEO description" 
							rows="3"
							oninput={handleMetaDescriptionInput}
						></textarea>
						</div>
						<div class="form-group">
						<label class="form-label" for="og-image">OG Image URL</label>
						<input id="og-image" type="text" class="input" bind:value={ogImage} placeholder="https://..." />
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</form>

<style>
	.editor-form {
		width: 100%;
	}

	.error-banner {
		background: rgba(220, 38, 38, 0.08);
		color: var(--color-danger);
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-size: 0.8125rem;
		margin-bottom: 1.25rem;
	}

	.editor-main {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 2rem;
		align-items: start;
	}

	.form-group {
		margin-bottom: 0.875rem;
	}

	.form-label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		margin-bottom: 0.375rem;
	}

	.title-input {
		font-size: 1.375rem;
		font-family: 'Lora', Georgia, serif;
		font-weight: 600;
		padding: 0.75rem;
		border: none;
		background: transparent;
		border-bottom: 1px solid var(--color-border);
		border-radius: 0;
	}

	.title-input:focus {
		box-shadow: none;
		border-color: var(--color-accent);
	}

	.excerpt-input {
		font-size: 0.9375rem;
		min-height: 60px;
		resize: vertical;
	}

	.content-input {
		font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
		font-size: 0.875rem;
		line-height: 1.7;
		min-height: 500px;
		resize: vertical;
		tab-size: 2;
	}

	/* Sidebar */
	.sidebar-section {
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.sidebar-title {
		font-family: 'Inter', sans-serif;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	.publish-actions {
		margin-top: 0.5rem;
	}

	.publish-actions .btn {
		width: 100%;
	}

	.help-text {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	/* Image upload */
	.upload-area {
		display: block;
		border: 2px dashed var(--color-border);
		border-radius: 8px;
		padding: 1.25rem;
		text-align: center;
		cursor: pointer;
		transition: border-color 0.15s ease;
	}

	.upload-area:hover {
		border-color: var(--color-text-muted);
	}

	.file-input {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
	}

	.upload-label {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.image-list {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.image-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem;
		border: 1px solid var(--color-border-light);
		border-radius: 6px;
		transition: border-color 0.2s ease;
	}

	.image-item.og-active {
		border-color: var(--color-accent, #0066cc);
		background: rgba(0, 102, 204, 0.05);
	}

	.image-thumb {
		width: 48px;
		height: 48px;
		object-fit: cover;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.image-item-actions {
		display: flex;
		gap: 0.25rem;
		margin-left: auto;
	}

	/* SEO toggle */
	.seo-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
	}

	.seo-toggle svg {
		transition: transform 0.15s ease;
	}

	.seo-toggle :global(.rotated) {
		transform: rotate(180deg);
	}

	.seo-fields {
		margin-top: 0.75rem;
	}

	.auto-sync-indicator {
		font-size: 0.6875rem;
		color: var(--color-accent, #0066cc);
		font-weight: 400;
		margin-left: 0.5rem;
		opacity: 0.8;
	}

	.sync-reset-btn {
		font-size: 0.6875rem;
		color: var(--color-accent, #0066cc);
		font-weight: 400;
		margin-left: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
		opacity: 0.8;
		transition: opacity 0.2s ease;
	}

	.sync-reset-btn:hover {
		opacity: 1;
	}

	@media (max-width: 768px) {
		.editor-main {
			grid-template-columns: 1fr;
		}

		.content-input {
			min-height: 300px;
		}
	}
</style>
