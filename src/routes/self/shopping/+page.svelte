<script>
    import { enhance } from '$app/forms';
    import { fade, slide } from 'svelte/transition';

    let { data, form } = $props();

    let filterCategory = $state('All');
    
    // Grouping items by category
    let categories = $derived.by(() => {
        const cats = new Set(['All']);
        for (const item of data.items) {
            cats.add(item.category);
        }
        return Array.from(cats);
    });

    let groupedItems = $derived.by(() => {
        let items = data.items;
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
</script>

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
                <input 
                    type="text" 
                    name="category" 
                    placeholder="Category (e.g. Groceries)" 
                    class="form-input category-input"
                    list="category-suggestions"
                />
                <datalist id="category-suggestions">
                    {#each categories.filter(c => c !== 'All') as c}
                        <option value={c}></option>
                    {/each}
                </datalist>
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
                                        <h5 class="item-name" class:bought={item.status === 'Bought'}>{item.item_name}</h5>
                                        {#if item.due_date}
                                            <span class="item-meta">
                                                🗓 {new Date(item.due_date).toLocaleDateString()}
                                            </span>
                                        {/if}
                                    </div>

                                    <div class="item-actions">
                                        <form action="?/updateStatus" method="POST" use:enhance>
                                            <input type="hidden" name="id" value={item.id} />
                                            <div class="status-dropdown-wrap">
                                                <select 
                                                    name="status" 
                                                    class="item-status-select {getBadgeClass(item.status)}"
                                                    onchange={(e) => e.target.form.requestSubmit()}
                                                >
                                                    {#each statusOptions as opt}
                                                        <option value={opt} selected={item.status === opt}>{opt}</option>
                                                    {/each}
                                                </select>
                                            </div>
                                        </form>
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

    .status-dropdown-wrap {
        position: relative;
    }

    .item-status-select {
        appearance: none;
        background: transparent;
        border: 1px solid transparent;
        padding: 4px 28px 4px 10px;
        font-family: inherit;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .item-status-select:hover {
        border-color: rgba(255, 255, 255, 0.2);
    }
    
    .status-dropdown-wrap::after {
        content: "▼";
        font-size: 0.5rem;
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        opacity: 0.6;
    }

    @media (max-width: 768px) {
        .form-row {
            flex-direction: column;
        }
        
        .category-input,
        .date-input {
            width: 100%;
        }
    }
</style>
