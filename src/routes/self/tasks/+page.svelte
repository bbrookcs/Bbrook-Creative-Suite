<script>
    import { enhance } from '$app/forms';
    import { fade, slide } from 'svelte/transition';

    let { data, form } = $props();

    let filterStatus = $state('All');
    let sortBy = $state('date');

    let tasks = $derived.by(() => {
        let t = [...data.tasks];
        
        if (filterStatus !== 'All') {
            t = t.filter(task => task.status === filterStatus);
        }
        
        if (sortBy === 'date') {
            t.sort((a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date) - new Date(b.due_date);
            });
        }
        return t;
    });

    const statusOptions = ['All', 'Pending', 'Due', 'Completed', 'Canceled'];

    function getBadgeClass(status) {
        return `badge badge-${status.toLowerCase()}`;
    }
</script>

<svelte:head>
    <title>Tasks | /self OS</title>
</svelte:head>

<div class="module-container">
    <!-- QUICK ADD -->
    <div class="card add-card">
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
            <div class="filter-group">
                <label for="sort" class="control-label">Sort By</label>
                <select id="sort" class="form-input select-input" bind:value={sortBy}>
                    <option value="status">Status Priority</option>
                    <option value="date">Due Date</option>
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
                            <h4 class="task-title" class:completed={task.status === 'Completed'}>{task.title}</h4>
                            <div class="task-meta">
                                {#if task.due_date}
                                    <span class="meta-item">
                                        🗓 {new Date(task.due_date).toLocaleDateString()}
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <div class="task-actions">
                            <form action="?/updateStatus" method="POST" use:enhance>
                                <input type="hidden" name="id" value={task.id} />
                                <div class="status-dropdown-wrap">
                                    <select 
                                        name="status" 
                                        class="task-status-select {getBadgeClass(task.status)}"
                                        onchange={(e) => e.target.form.requestSubmit()}
                                    >
                                        {#each statusOptions.slice(1) as opt}
                                            <option value={opt} selected={task.status === opt}>{opt}</option>
                                        {/each}
                                    </select>
                                </div>
                            </form>
                        </div>
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
    }

    .status-dropdown-wrap {
        position: relative;
    }

    .task-status-select {
        appearance: none;
        background: transparent;
        border: 1px solid transparent;
        padding: 6px 32px 6px 12px;
        font-family: inherit;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .task-status-select:hover {
        border-color: rgba(255, 255, 255, 0.2);
    }
    
    .status-dropdown-wrap::after {
        content: "▼";
        font-size: 0.6rem;
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        opacity: 0.6;
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
</style>
