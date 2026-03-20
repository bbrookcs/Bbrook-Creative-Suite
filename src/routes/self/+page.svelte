<script>
    let { data } = $props();
</script>

<svelte:head>
    <title>Dashboard | self OS</title>
</svelte:head>

<div class="dashboard-overview">
    <!-- STATS CARDS -->
    <div class="grid-cards stats-grid">
        <div class="card stat-card">
            <h3 class="card-title">Pending Tasks</h3>
            <p class="card-value">{data.stats.pendingTasks}</p>
        </div>
        <div class="card stat-card">
            <h3 class="card-title">Pending Shopping</h3>
            <p class="card-value">{data.stats.pendingShopping}</p>
        </div>
        <div class="card stat-card">
            <h3 class="card-title">Active Plans</h3>
            <p class="card-value">{data.stats.activePlans}</p>
        </div>
        <div class="card stat-card">
            <h3 class="card-title">Monthly Income</h3>
            <p class="card-value">${Number(data.stats.monthlyIncome).toLocaleString()}</p>
        </div>
    </div>

    <div class="lists-grid">
        <!-- UPCOMING TASKS -->
        <div class="card list-card">
            <div class="card-header">
                <h3 class="card-title">Upcoming Tasks</h3>
                <a href="/self/tasks" class="view-all">View all</a>
            </div>
            {#if data.upcomingTasks.length === 0}
                <div class="empty-state">No upcoming tasks. You are all caught up!</div>
            {:else}
                <ul class="item-list">
                    {#each data.upcomingTasks as task}
                        <li class="list-item">
                            <div class="item-main">
                                <span class="item-title">{task.title}</span>
                                {#if task.due_date}
                                    <span class="item-meta">
                                        🗓 {new Date(task.due_date).toLocaleDateString()}
                                    </span>
                                {/if}
                            </div>
                            <span class="badge badge-{task.status.toLowerCase()}">{task.status}</span>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>

        <!-- ACTIVE PLANS -->
        <div class="card list-card">
            <div class="card-header">
                <h3 class="card-title">Active Plans</h3>
                <a href="/self/plans" class="view-all">View all</a>
            </div>
            {#if data.activePlanList.length === 0}
                <div class="empty-state">No active plans. Create a new plan to get started.</div>
            {:else}
                <ul class="item-list plan-list">
                    {#each data.activePlanList as plan}
                        <li class="list-item plan-item">
                            <div class="item-main">
                                <span class="item-title">{plan.title}</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 100%;"></div>
                                </div>
                            </div>
                            <div class="days-remaining">
                                <span class="days-count">{Math.max(0, plan.days_remaining || 0)}</span>
                                <span class="days-label">days left</span>
                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</div>

<style>
    .dashboard-overview {
        display: flex;
        flex-direction: column;
        gap: 32px;
    }

    .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .stat-card {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .lists-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #262b36;
    }

    .view-all {
        font-size: 0.85rem;
        color: #3b82f6;
        text-decoration: none;
    }

    .view-all:hover {
        text-decoration: underline;
    }

    .empty-state {
        color: #64748b;
        font-size: 0.9rem;
        text-align: center;
        padding: 40px 0;
    }

    .item-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #111318;
        border: 1px solid #262b36;
        border-radius: 8px;
        transition: transform 0.1s ease;
    }

    .list-item:hover {
        transform: translateX(4px);
        border-color: #334155;
    }

    .item-main {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .item-title {
        font-weight: 500;
        color: #e2e8f0;
    }

    .item-meta {
        font-size: 0.75rem;
        color: #64748b;
    }

    /* Plan specific styles */
    .plan-item {
        gap: 24px;
    }

    .plan-item .item-main {
        flex-grow: 1;
    }

    .days-remaining {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(37, 99, 235, 0.1);
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid rgba(37, 99, 235, 0.2);
    }

    .days-count {
        font-size: 1.25rem;
        font-weight: 700;
        color: #60a5fa;
        line-height: 1;
    }

    .days-label {
        font-size: 0.65rem;
        text-transform: uppercase;
        color: #94a3b8;
        letter-spacing: 0.05em;
        margin-top: 2px;
    }

    @media (max-width: 1024px) {
        .lists-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
