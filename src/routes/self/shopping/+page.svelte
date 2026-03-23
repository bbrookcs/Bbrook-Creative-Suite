<script>
    import { enhance } from '$app/forms';
    import { fade, slide } from 'svelte/transition';
    import { onMount, onDestroy } from 'svelte';

    let { data, form } = $props();

    let filterCategory = $state('All');
    let deleteModalTarget = $state(null);
    let openDropdown = $state(null);

    let now = $state(new Date());
    let interval;

    onMount(() => {
        interval = setInterval(() => { now = new Date(); }, 1000);
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });

    function getItemStatus(item) {
        if (item.status === 'Bought' || item.status === 'Canceled') return item.status;
        if (item.due_date && new Date(item.due_date) < now) return 'Due';
        return item.status;
    }

    function getCountdown(dueDate) {
        if (!dueDate) return '';
        const diff = new Date(dueDate) - now;
        if (diff <= 0) return 'Overdue';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        
        if (days > 0) return `${days}d ${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
        if (hours > 0) return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
        return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }

    const defaultCategories = ['General', 'Groceries', 'Electronics', 'Home', 'Personal Care', 'Other'];
    
    let categories = $derived.by(() => {
        const cats = new Set(['All', ...defaultCategories]);
        for (const item of data.items) {
            cats.add(item.category);
        }
        return Array.from(cats);
    });

    let groupedItems = $derived.by(() => {
        let items = [...data.items].map(item => ({
            ...item,
            derivedStatus: getItemStatus(item)
        }));
        
        if (filterCategory !== 'All') {
            items = items.filter(t => t.category === filterCategory);
        }
        
        const groups = {};
        for (const item of items) {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        }
        return groups;
    });

    const statusOptions = ['Pending', 'Due', 'Bought', 'Canceled'];

    function getBadgeClass(status) {
        if (status === 'Bought') return 'badge badge-completed';
        if (status === 'Due') return 'badge badge-due';
        if (status === 'Canceled') return 'badge badge-canceled';
        return 'badge badge-pending';
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        openDropdown = openDropdown === id ? null : id;
    }

    function closeAllDropdowns() {
        openDropdown = null;
    }
</script>

<svelte:window onclick={closeAllDropdowns} />

<svelte:head>
    <title>Shopping | /self OS</title>
</svelte:head>

<div class="module-container">
    <!-- QUICK ADD -->
    <div class="card add-card">
        <h3 class="card-title">Quick Add to Shopping List</h3>
        <form action="?/add" method="POST" use:enhance class="quick-add-form">
            <div class="form-row">
                <input 
                    type="text" 
                    name="itemName" 
                    placeholder="Item name..." 
                    class="form-input flex-grow" 
                    required 
                    autocomplete="off"
                />
                <select 
                    name="category" 
                    class="form-input category-input select-input"
                    required
                >
                    {#each defaultCategories as c}
                        <option value={c}>{c}</option>
                    {/each}
                </select>
                <input 
                    type="date" 
                    name="dueDate" 
                    class="form-input date-input"
                    title="Optional due date"
                />
                <button type="submit" class="btn btn-primary">Add Item</button>
            </div>
            {#if form?.missing}
                <p class="error-msg">Item name is required.</p>
            {/if}
        </form>
    </div>

    <!-- MAIN LIST -->
    <div class="card list-card">
        <div class="list-controls">
            <div class="filter-group">
                <label for="filter" class="control-label">Filter Category</label>
                <select id="filter" class="form-input select-input" bind:value={filterCategory}>
                    {#each categories as opt}
                        <option value={opt}>{opt}</option>
                    {/each}
                </select>
            </div>
        </div>

        {#if Object.keys(groupedItems).length === 0}
            <div class="empty-state">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48" style="opacity:0.3; margin-bottom: 16px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>Your shopping list is empty! Enjoy.</p>
            </div>
        {:else}
            <div class="category-lists">
                {#each Object.entries(groupedItems) as [catName, items] (catName)}
                    <div class="category-group" transition:fade>
                        <h4 class="category-header">{catName}</h4>
                        <ul class="simple-list">
                            {#each items as item (item.id)}
                                <li class="simple-item" transition:slide>
                                    <div class="item-main">
                                        <h5 class="item-name" class:bought={item.derivedStatus === 'Bought' || item.derivedStatus === 'Canceled'}>{item.item_name}</h5>
                                        {#if item.achieved_date}
                                            <div class="task-meta">
                                                <span class="meta-item">
                                                    Bought: {new Date(item.achieved_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        {/if}
                                    </div>

                                    {#if item.due_date && item.derivedStatus !== 'Bought' && item.derivedStatus !== 'Canceled'}
                                        <div class="task-timer time-remaining" class:overdue={item.derivedStatus === 'Due'}>
                                            ⏱ {getCountdown(item.due_date)}
                                        </div>
                                    {/if}

                                    <div class="task-actions item-actions">
                                        <span class={getBadgeClass(item.derivedStatus)}>{item.derivedStatus}</span>
                                        {#if item.derivedStatus !== 'Bought' && item.derivedStatus !== 'Canceled'}
                                            <form action="?/updateStatus" method="POST" use:enhance class="inline-form">
                                                <input type="hidden" name="id" value={item.id} />
                                                <input type="hidden" name="status" value="Bought" />
                                                <button type="submit" class="btn btn-primary mark-done-btn" title="Mark Bought">
                                                    ✓
                                                </button>
                                            </form>
                                        {/if}
                                        
                                        <div class="dropdown-container">
                                            <button type="button" class="dots-btn" onclick={(e) => toggleDropdown(item.id, e)}>
                                                ⋮
                                            </button>
                                            {#if openDropdown === item.id}
                                                <div class="dropdown-menu" transition:fade={{duration: 100}}>
                                                    {#if item.derivedStatus !== 'Canceled' && item.derivedStatus !== 'Bought'}
                                                        <form action="?/updateStatus" method="POST" use:enhance>
                                                            <input type="hidden" name="id" value={item.id} />
                                                            <input type="hidden" name="status" value="Canceled" />
                                                            <button type="submit" class="dropdown-item">Cancel Item</button>
                                                        </form>
                                                    {/if}
                                                    <button type="button" class="dropdown-item danger-text" onclick={() => deleteModalTarget = item.id}>
                                                        Delete Item
                                                    </button>
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

{#if deleteModalTarget}
    <div class="custom-modal-overlay" onclick={() => deleteModalTarget = null}>
        <div class="custom-modal card" onclick={(e) => e.stopPropagation()}>
            <h3>Delete Item</h3>
            <p>Are you sure you want to completely delete this item from your shopping list?</p>
            <form action="?/delete" method="POST" use:enhance={() => {
                return async ({ update }) => {
                    await update();
                    deleteModalTarget = null;
                };
            }}>
                <input type="hidden" name="id" value={deleteModalTarget} />
                <div class="modal-actions">
                    <button type="button" class="btn secondary" onclick={() => deleteModalTarget = null}>Cancel</button>
                    <button type="submit" class="btn danger">Delete</button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    .module-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
        max-width: 900px;
        margin: 0 auto;
    }

    .add-card {
        padding: 24px;
    }

    .quick-add-form {
        margin-top: 16px;
    }

    .form-row {
        display: flex;
        gap: 12px;
        align-items: stretch;
    }

    .flex-grow {
        flex-grow: 1;
    }

    .category-input,
    .date-input {
        width: 140px;
    }

    .error-msg {
        color: #ef4444;
        font-size: 0.85rem;
        margin-top: 8px;
    }

    .list-controls {
        display: flex;
        gap: 20px;
        margin-bottom: 32px;
        padding-bottom: 16px;
        border-bottom: 1px solid #262b36;
    }

    .filter-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .control-label {
        font-size: 0.85rem;
        font-weight: 500;
        color: #94a3b8;
    }

    .select-input {
        width: 160px;
        padding: 8px 10px;
        height: auto;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 0;
        color: #64748b;
        font-size: 0.95rem;
    }

    .category-lists {
        display: flex;
        flex-direction: column;
        gap: 32px;
    }

    .category-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .category-header {
        font-size: 1.1rem;
        font-weight: 600;
        color: #e2e8f0;
        margin: 0;
        padding-bottom: 8px;
        border-bottom: 1px dashed #334155;
    }

    .simple-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .simple-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(17, 19, 24, 0.5);
        border: 1px solid #262b36;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .simple-item:hover {
        background: #111318;
        border-color: #334155;
    }

    .item-main {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex-grow: 1;
    }

    .item-name {
        font-size: 1rem;
        font-weight: 500;
        color: #f1f5f9;
        margin: 0;
        transition: color 0.15s;
    }

    .item-name.bought {
        text-decoration: line-through;
        color: #64748b;
    }

    .item-meta {
        font-size: 0.75rem;
        color: #94a3b8;
    }

    .item-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .inline-form {
        display: inline-block;
        margin: 0;
        padding: 0;
    }

    .delete-icon-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .delete-icon-btn:hover {
        background: rgba(239, 68, 68, 0.2);
    }

    .task-timer {
        text-align: center;
        font-variant-numeric: tabular-nums;
        font-size: 0.95rem;
        margin: 0 16px;
        white-space: nowrap;
    }

    .time-remaining {
        color: #44f63b;
        font-weight: 500;
    }
    .time-remaining.overdue {
        color: #ef4444;
    }

    .mark-done-btn {
        padding: 4px 10px;
        font-size: 0.8rem;
        border-radius: 4px;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.2);
        cursor: pointer;
        transition: all 0.2s;
    }
    .mark-done-btn:hover {
        background: rgba(16, 185, 129, 0.2);
    }

    .dropdown-container {
        position: relative;
    }

    .dots-btn {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        transition: all 0.2s;
        line-height: 1;
    }
    
    .dots-btn:hover {
        background: rgba(255,255,255,0.05);
        color: #cbd5e1;
    }

    .dropdown-menu {
        position: absolute;
        right: 0;
        top: 100%;
        margin-top: 4px;
        background: #1e222a;
        border: 1px solid #334155;
        border-radius: 6px;
        min-width: 140px;
        z-index: 10;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }

    .dropdown-item {
        display: block;
        width: 100%;
        text-align: left;
        padding: 10px 16px;
        background: transparent;
        border: none;
        color: #cbd5e1;
        font-family: inherit;
        font-size: 0.9rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .dropdown-item:hover {
        background: #262b36;
    }

    .danger-text {
        color: #ef4444 !important;
    }

    /* Custom Modals */
    .custom-modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }

    .custom-modal {
        width: 100%;
        max-width: 400px;
        padding: 24px;
        background: #111318;
    }

    .custom-modal h3 {
        margin: 0 0 12px 0;
        color: #f8fafc;
    }

    .custom-modal p {
        color: #cbd5e1;
        margin-bottom: 24px;
        line-height: 1.5;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    }

    .modal-actions .btn {
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        border: none;
    }

    .btn.secondary {
        background: transparent;
        color: #cbd5e1;
        border: 1px solid #262b36;
    }

    .btn.secondary:hover {
        background: #1e222a;
    }

    .btn.danger {
        background: #ef4444;
        color: white;
    }

    .btn.danger:hover {
        background: #dc2626;
    }
</style>
