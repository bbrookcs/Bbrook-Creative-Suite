<script>
    import { enhance } from '$app/forms';
    import { fade, slide } from 'svelte/transition';
    import { onMount, onDestroy } from 'svelte';

    let { data, form } = $props();

    let filterStatus = $state('All');
    let showAddForm = $state(false);
    let sortBy = $state('date');
    let deleteModalTarget = $state(null);
    let openDropdown = $state(null);

    let now = $state(new Date());
    let interval;

    onMount(() => {
        interval = setInterval(() => {
            now = new Date();
        }, 1000); // UI updates every second
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });

    function getEndOfDay(dateInput) {
        if (!dateInput) return new Date();
        const d = new Date(dateInput);
        if (typeof dateInput === 'string') {
            const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), 23, 59, 59, 999);
            }
        }
        d.setHours(23, 59, 59, 999);
        return d;
    }

    function getTaskStatus(task) {
        if (task.status === 'Completed' || task.status === 'Canceled') return task.status;
        if (task.due_date && getEndOfDay(task.due_date) < now) return 'Due';
        return task.status;
    }

    function getCountdown(dueDate) {
        if (!dueDate) return '';
        const due = getEndOfDay(dueDate);
        const diff = due - now;
        if (diff <= 0) return 'Overdue';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        
        if (days > 0) return `${days}d ${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
        if (hours > 0) return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
        return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }

    let tasks = $derived.by(() => {
        let t = [...data.tasks].map(task => ({
            ...task,
            derivedStatus: getTaskStatus(task)
        }));
        
        if (filterStatus !== 'All') {
            t = t.filter(task => task.derivedStatus === filterStatus);
        }
        
        const statusOrder = {
            'Due': 1,
            'Pending': 2,
            'Canceled': 3,
            'Completed': 4
        };

        t.sort((a, b) => {
            const orderA = statusOrder[a.derivedStatus] || 99;
            const orderB = statusOrder[b.derivedStatus] || 99;
            
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
        });
        return t;
    });

    const statusOptions = ['All', 'Pending', 'Due', 'Completed', 'Canceled'];

    function getBadgeClass(status) {
        return `badge badge-${status.toLowerCase()}`;
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
    <title>Tasks | /self OS</title>
</svelte:head>

<div class="module-container">
    <div class="header-actions">
        <h2 class="module-title">Tasks/event</h2>
        <button class="btn btn-primary" onclick={() => showAddForm = !showAddForm}>
            {showAddForm ? 'Cancel' : 'New Task'}
        </button>
    </div>

    {#if showAddForm}
        <!-- QUICK ADD -->
        <div class="card add-card" transition:slide>
            <h3 class="card-title">Quick Add Task</h3>
            <form action="?/add" method="POST" use:enhance class="quick-add-form">
                <div class="form-row">
                    <input 
                        type="text" 
                        name="title" 
                        placeholder="Task title..." 
                        class="form-input flex-grow" 
                        required 
                        autocomplete="off"
                    />
                    <input 
                        type="date" 
                        name="dueDate" 
                        class="form-input date-input"
                    />
                    <button type="submit" class="btn btn-primary">Add Task</button>
                </div>
                {#if form?.missing}
                    <p class="error-msg">Task title is required.</p>
                {/if}
            </form>
        </div>
    {/if}

    <!-- FILTERS AND LIST -->
    <div class="card list-card">
        <div class="list-controls">
            <div class="filter-group">
                <label for="filter" class="control-label">Filter</label>
                <select id="filter" class="form-input select-input" bind:value={filterStatus}>
                    {#each statusOptions as opt}
                        <option value={opt}>{opt}</option>
                    {/each}
                </select>
            </div>
            
        </div>

        {#if tasks.length === 0}
            <div class="empty-state">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48" style="opacity:0.3; margin-bottom: 16px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No tasks found. Get started above!</p>
            </div>
        {:else}
            <div class="tasks-list">
                {#each tasks as task (task.id)}
                    <div class="task-item" transition:slide>
                        <div class="task-content">
                            <h4 class="task-title" class:completed={task.derivedStatus === 'Completed' || task.derivedStatus === 'Canceled'}>{task.title}</h4>
                            <div class="task-meta">
                                {#if task.created_at}
                                    <span class="meta-item">
                                        Created: {new Date(task.created_at).toLocaleDateString()}
                                    </span>
                                {/if}
                                {#if task.derivedStatus === 'Completed' && task.achieved_date}
                                    <span class="meta-item">
                                        Completed: {new Date(task.achieved_date).toLocaleDateString()}
                                    </span>
                                {:else if task.derivedStatus === 'Canceled' && task.updated_at}
                                    <span class="meta-item">
                                        Canceled: {new Date(task.updated_at).toLocaleDateString()}
                                    </span>
                                {/if}
                            </div>
                        </div>

                        {#if task.due_date && task.derivedStatus !== 'Completed' && task.derivedStatus !== 'Canceled'}
                            <div class="task-timer time-remaining" class:overdue={task.derivedStatus === 'Due'}>
                                ⏱ {getCountdown(task.due_date)}
                            </div>
                        {/if}

                        <div class="task-actions">
                            <span class={getBadgeClass(task.derivedStatus)}>{task.derivedStatus}</span>
                            {#if task.derivedStatus !== 'Completed' && task.derivedStatus !== 'Canceled'}
                                <form action="?/updateStatus" method="POST" use:enhance class="inline-form">
                                    <input type="hidden" name="id" value={task.id} />
                                    <input type="hidden" name="status" value="Completed" />
                                    <button type="submit" class="btn btn-primary mark-done-btn" title="Mark Done">
                                        ✓
                                    </button>
                                </form>
                            {/if}
                            
                            <div class="dropdown-container">
                                <button type="button" class="dots-btn" onclick={(e) => toggleDropdown(task.id, e)}>
                                    ⋮
                                </button>
                                {#if openDropdown === task.id}
                                    <div class="dropdown-menu" transition:fade={{duration: 100}}>
                                        {#if task.derivedStatus !== 'Canceled' && task.derivedStatus !== 'Completed'}
                                            <form action="?/updateStatus" method="POST" use:enhance>
                                                <input type="hidden" name="id" value={task.id} />
                                                <input type="hidden" name="status" value="Canceled" />
                                                <button type="submit" class="dropdown-item">Cancel Task</button>
                                            </form>
                                        {/if}
                                        <button type="button" class="dropdown-item danger-text" onclick={() => deleteModalTarget = task.id}>
                                            Delete Task
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

{#if deleteModalTarget}
    <div class="custom-modal-overlay" onclick={() => deleteModalTarget = null}>
        <div class="custom-modal card" onclick={(e) => e.stopPropagation()}>
            <h3>Delete Task</h3>
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>
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

    .header-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #262b36;
        padding-bottom: 20px;
    }

    .module-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        color: #f8fafc;
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

    .date-input {
        width: auto;
        min-width: 150px;
    }

    .error-msg {
        color: #ef4444;
        font-size: 0.85rem;
        margin-top: 8px;
    }

    .list-controls {
        display: flex;
        gap: 20px;
        margin-bottom: 24px;
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
        padding: 6px 10px;
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

    .tasks-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .task-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #111318;
        border: 1px solid #262b36;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .task-item:hover {
        border-color: #334155;
        background: #15181e;
    }

    .task-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex-grow: 1;
    }

    .task-title {
        font-size: 1.05rem;
        font-weight: 500;
        color: #f1f5f9;
        margin: 0;
        transition: color 0.2s;
    }

    .task-title.completed {
        text-decoration: line-through;
        color: #64748b;
    }

    .task-meta {
        display: flex;
        gap: 12px;
        font-size: 0.8rem;
        color: #94a3b8;
    }

    .task-actions {
        flex-shrink: 0;
        margin-left: 24px;
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
        width: 32px;
        height: 32px;
        border-radius: 6px;
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
        padding: 6px 12px;
        font-size: 0.85rem;
        border-radius: 6px;
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
        padding: 4px 8px;
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
        border-radius: 8px;
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

    @media (max-width: 640px) {
        .form-row {
            flex-direction: column;
        }
        
        .list-controls {
            flex-direction: column;
            gap: 12px;
        }

        .task-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
        }

        .task-actions {
            margin-left: 0;
            width: 100%;
        }

        .status-dropdown-wrap {
            width: 100%;
        }

        .task-status-select {
            width: 100%;
        }
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
