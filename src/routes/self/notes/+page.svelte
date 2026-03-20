<script>
    import { enhance } from '$app/forms';
    import { slide } from 'svelte/transition';

    let { data, form } = $props();
    let isEditing = $state(false);
</script>

<svelte:head>
    <title>Thinking Layer | /self OS</title>
</svelte:head>

<div class="thinking-layer">
    <header class="notes-header">
        <div>
            <h2 class="layer-title">Thinking Layer</h2>
            <p class="layer-subtitle">Principles. Reminders. Raw thoughts.</p>
        </div>
        <button class="btn btn-secondary compose-btn" onclick={() => isEditing = !isEditing}>
            {isEditing ? 'Close' : 'New Thought'}
        </button>
    </header>

    {#if isEditing}
        <div class="compose-area" transition:slide>
            <form action="?/add" method="POST" use:enhance class="compose-form">
                <input 
                    type="text" 
                    name="title" 
                    placeholder="Title your thought..." 
                    class="compose-title" 
                    required 
                    autocomplete="off"
                />
                
                <textarea 
                    name="content" 
                    placeholder="Capture your raw thoughts here..." 
                    class="compose-body" 
                    required
                ></textarea>
                
                <div class="compose-footer">
                    <input 
                        type="text" 
                        name="tags" 
                        placeholder="Tags (comma separated)..." 
                        class="compose-tags" 
                        autocomplete="off"
                    />
                    <div class="actions">
                        <button type="button" class="btn text-btn" onclick={() => isEditing = false}>Cancel</button>
                        <button type="submit" class="btn btn-primary" onclick={() => {
                            setTimeout(() => { isEditing = false }, 100);
                        }}>Save</button>
                    </div>
                </div>
                {#if form?.missing}
                    <p class="error-msg" style="margin-top: 12px;">Content cannot be empty.</p>
                {/if}
            </form>
        </div>
    {/if}

    <div class="notes-feed">
        {#if data.notes.length === 0}
            <div class="empty-state">
                <p>The thinking layer is quiet. Record your first thought above.</p>
            </div>
        {:else}
            {#each data.notes as note (note.id)}
                {@const tagsArray = typeof note.tags === 'string' ? (note.tags ? JSON.parse(note.tags) : []) : (note.tags || [])}
                <article class="note-card">
                    <div class="note-meta-top">
                        <span class="note-date">{new Date(note.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <form action="?/delete" method="POST" use:enhance>
                            <input type="hidden" name="id" value={note.id} />
                            <button type="submit" class="delete-btn" title="Delete note">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </form>
                    </div>
                    
                    <h3 class="note-title">{note.title}</h3>
                    
                    <div class="note-content">
                        {note.content}
                    </div>
                    
                    {#if tagsArray && tagsArray.length > 0}
                        <div class="note-tags">
                            {#each tagsArray as tag}
                                <span class="tag">#{tag}</span>
                            {/each}
                        </div>
                    {/if}
                </article>
            {/each}
        {/if}
    </div>
</div>

<style>
    .thinking-layer {
        max-width: 768px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 32px;
        padding-bottom: 60px;
    }

    .notes-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding-bottom: 24px;
        border-bottom: 1px solid #262b36;
    }

    .layer-title {
        font-family: var(--font-serif, Georgia, serif);
        font-size: 2rem;
        font-weight: 400;
        color: #f8fafc;
        margin: 0 0 8px 0;
        letter-spacing: -0.02em;
    }

    .layer-subtitle {
        font-size: 0.95rem;
        color: #94a3b8;
        margin: 0;
    }

    .compose-btn {
        background: transparent;
        color: #f1f5f9;
        border: 1px solid #334155;
        border-radius: 99px;
        padding: 8px 20px;
        font-weight: 500;
    }

    .compose-btn:hover {
        background: #1e293b;
        border-color: #475569;
    }

    .compose-area {
        background: #111318;
        border: 1px solid #262b36;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    .compose-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .compose-title {
        font-family: inherit;
        font-size: 1.5rem;
        font-weight: 600;
        color: #f8fafc;
        background: transparent;
        border: none;
        outline: none;
        padding: 0;
    }

    .compose-title::placeholder {
        color: #475569;
    }

    .compose-body {
        font-family: inherit;
        font-size: 1.05rem;
        line-height: 1.7;
        color: #e2e8f0;
        background: transparent;
        border: none;
        outline: none;
        resize: vertical;
        min-height: 150px;
        padding: 0;
    }

    .compose-body::placeholder {
        color: #475569;
    }

    .compose-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px dashed #334155;
        padding-top: 16px;
        margin-top: 8px;
    }

    .compose-tags {
        background: transparent;
        border: none;
        outline: none;
        color: #94a3b8;
        font-size: 0.9rem;
        width: 100%;
        max-width: 250px;
    }

    .actions {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .text-btn {
        background: transparent;
        color: #94a3b8;
        padding: 8px 12px;
    }
    
    .text-btn:hover {
        color: #f1f5f9;
        background: rgba(255,255,255,0.05);
    }

    .notes-feed {
        display: flex;
        flex-direction: column;
        gap: 40px;
    }

    .empty-state {
        text-align: center;
        color: #64748b;
        font-style: italic;
        padding: 60px 0;
    }

    .note-card {
        background: transparent;
        border-left: 1px solid #334155;
        padding-left: 24px;
        position: relative;
        transition: border-color 0.2s;
    }
    
    .note-card:hover {
        border-left-color: #60a5fa;
    }

    .note-meta-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .note-date {
        font-size: 0.8rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .delete-btn {
        background: transparent;
        border: none;
        color: #475569;
        cursor: pointer;
        opacity: 0;
        transition: all 0.2s;
        padding: 4px;
        border-radius: 4px;
    }

    .note-card:hover .delete-btn {
        opacity: 1;
    }

    .delete-btn:hover {
        color: #f87171;
        background: rgba(248, 113, 113, 0.1);
    }

    .note-title {
        font-size: 1.4rem;
        font-weight: 600;
        color: #f8fafc;
        margin: 0 0 16px 0;
        letter-spacing: -0.01em;
        line-height: 1.3;
    }

    .note-content {
        font-size: 1.05rem;
        line-height: 1.8;
        color: #cbd5e1;
        white-space: pre-wrap;
    }

    .note-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 20px;
    }

    .tag {
        font-size: 0.75rem;
        color: #94a3b8;
        background: rgba(15, 23, 42, 0.6);
        padding: 4px 10px;
        border-radius: 99px;
        border: 1px solid #1e293b;
        transition: all 0.2s;
    }

    .tag:hover {
        color: #cbd5e1;
        border-color: #334155;
    }
    
    @media (max-width: 640px) {
        .compose-footer {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
        }
        
        .compose-tags {
            max-width: none;
        }
        
        .actions {
            justify-content: flex-end;
        }
    }
</style>
