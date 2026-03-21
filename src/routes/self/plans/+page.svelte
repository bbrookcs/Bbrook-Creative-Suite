<script>
    import { enhance } from '$app/forms';
    import { slide } from 'svelte/transition';

    let { data, form } = $props();

    let showAddForm = $state(false);
    let deleteModalTarget = $state(null);

    let activePlans = $derived(data.plans.filter(p => p.status === 'Active'));
    let achievedPlans = $derived(data.plans.filter(p => p.status === 'Achieved'));

    function getPercentage(daysRemaining, createdAt, targetDate) {
        if (!createdAt || !targetDate) return 0;
        const totalDays = Math.max(1, (new Date(targetDate) - new Date(createdAt)) / (1000 * 60 * 60 * 24));
        const passedDays = totalDays - Math.max(0, daysRemaining);
        return Math.min(100, Math.max(0, (passedDays / totalDays) * 100));
    }
</script>

<svelte:head>
    <title>Plans | /self OS</title>
</svelte:head>

<div class="module-container">
    <div class="header-actions">
        <h2 class="module-title">Strategic Plans</h2>
        <button class="btn btn-primary" onclick={() => showAddForm = !showAddForm}>
            {showAddForm ? 'Cancel' : 'New Plan'}
        </button>
    </div>

    {#if showAddForm}
        <div class="card add-card" transition:slide>
            <form action="?/add" method="POST" use:enhance class="quick-add-form">
                <div class="form-group row-flex">
                    <div class="flex-grow">
                        <label class="form-label" for="title">Plan Title</label>
                        <input type="text" id="title" name="title" class="form-input" required autocomplete="off" />
                    </div>
                    <div>
                        <label class="form-label" for="targetDate">Target Date</label>
                        <input type="date" id="targetDate" name="targetDate" class="form-input" required />
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="description">Detailed Description</label>
                    <textarea id="description" name="description" class="form-input text-area" rows="3" placeholder="What are the steps to achieve this?"></textarea>
                </div>
                
                <div style="text-align: right; margin-top: 16px;">
                    <button type="submit" class="btn btn-primary">Save Plan</button>
                </div>
                {#if form?.missing}
                    <p class="error-msg">Title and Target Date are required.</p>
                {/if}
            </form>
        </div>
    {/if}

    <div class="plans-sections">
        <!-- ACTIVE PLANS -->
        <div class="plan-group">
            <h3 class="group-title">Active Plans</h3>
            {#if activePlans.length === 0}
                <div class="empty-state">No active plans. Time to dream big!</div>
            {:else}
                <div class="grid-cards plan-grid">
                    {#each activePlans as plan (plan.id)}
                        <div class="card plan-card active-highlight" transition:slide>
                            <div class="plan-header">
                                <h4 class="plan-title">{plan.title}</h4>
                                <div class="plan-actions">
                                    <form action="?/updateStatus" method="POST" use:enhance class="inline-form">
                                        <input type="hidden" name="id" value={plan.id} />
                                        <input type="hidden" name="status" value="Achieved" />
                                        <button type="submit" class="finish-btn" title="Mark as Achieved">
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    </form>
                                    <div class="inline-form">
                                        <button type="button" class="delete-plan-btn" title="Delete Plan" onclick={() => deleteModalTarget = plan.id}>
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <p class="plan-desc">{plan.description}</p>
                            
                            <div class="plan-meta">
                                <span class="meta-label">Target: {new Date(plan.target_date).toLocaleDateString()}</span>
                            </div>

                            <div class="countdown-wrap">
                                <div class="days-remaining">
                                    <span class="days-count">{Math.max(0, plan.days_remaining || 0)}</span>
                                    <span class="days-text">days left</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" style="width: {getPercentage(plan.days_remaining, plan.created_at, plan.target_date)}%"></div>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- ACHIEVED PLANS -->
        {#if achievedPlans.length > 0}
            <div class="plan-group mt-12">
                <h3 class="group-title">Achieved Plans</h3>
                <div class="grid-cards plan-grid">
                    {#each achievedPlans as plan (plan.id)}
                        <div class="card plan-card achieved" transition:slide>
                            <div class="plan-header">
                                <h4 class="plan-title">{plan.title}</h4>
                                <div class="plan-actions">
                                    <span class="badge badge-completed">Achieved</span>
                                    <div class="inline-form">
                                        <button type="button" class="delete-plan-btn outline-btn" title="Delete Plan" onclick={() => deleteModalTarget = plan.id}>
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p class="plan-desc">{plan.description}</p>
                            <div class="plan-meta">
                                <span class="meta-label">Target was: {new Date(plan.target_date).toLocaleDateString()}</span>
                                {#if plan.achieved_date}
                                    <span class="meta-label" style="display:block; margin-top:4px;">Achieved: {new Date(plan.achieved_date).toLocaleDateString()}</span>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

{#if deleteModalTarget}
    <div class="custom-modal-overlay" onclick={() => deleteModalTarget = null}>
        <div class="custom-modal card" onclick={(e) => e.stopPropagation()}>
            <h3>Delete Plan</h3>
            <p>Are you sure you want to completely delete this strategic plan? This action is permanent.</p>
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
        max-width: 1000px;
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
        background: #15181e;
        border: 1px dashed #334155;
    }

    .row-flex {
        display: flex;
        gap: 16px;
    }

    .flex-grow {
        flex-grow: 1;
    }

    .text-area {
        resize: vertical;
        min-height: 80px;
    }

    .empty-state {
        color: #64748b;
        padding: 40px 0;
        text-align: center;
        font-size: 0.95rem;
    }

    .plan-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .mt-12 {
        margin-top: 48px;
    }

    .group-title {
        font-size: 1.1rem;
        color: #94a3b8;
        margin: 0;
        font-weight: 500;
    }

    .plan-grid {
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }

    .plan-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        position: relative;
        overflow: hidden;
    }

    .active-highlight {
        border-top: 3px solid #3b82f6;
    }

    .achieved {
        opacity: 0.6;
        border-top: 3px solid #10b981;
    }

    .plan-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .plan-title {
        font-size: 1.15rem;
        font-weight: 600;
        color: #f1f5f9;
        margin: 0;
        line-height: 1.3;
        flex-grow: 1;
        padding-right: 12px;
    }

    .finish-btn {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 6px;
        padding: 6px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .finish-btn:hover {
        background: rgba(16, 185, 129, 0.2);
        color: #059669;
    }

    .plan-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .inline-form {
        margin: 0;
        display: flex;
    }

    .delete-plan-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid transparent;
        border-radius: 6px;
        padding: 6px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .delete-plan-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.3);
    }
    
    .delete-plan-btn.outline-btn {
        background: transparent;
        padding: 4px;
        color: #64748b;
    }
    
    .delete-plan-btn.outline-btn:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
    }

    .plan-desc {
        font-size: 0.9rem;
        color: #cad5e2;
        margin: 0;
        line-height: 1.5;
        flex-grow: 1;
    }

    .plan-meta {
        font-size: 0.8rem;
        color: #64748b;
        display: flex;
        justify-content: space-between;
    }

    .countdown-wrap {
        margin-top: 8px;
        background: rgba(15, 23, 42, 0.6);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        border: 1px solid #1e293b;
    }

    .days-remaining {
        display: flex;
        align-items: baseline;
        gap: 6px;
    }

    .days-count {
        font-size: 1.75rem;
        font-weight: 700;
        color: #3b82f6;
        line-height: 1;
    }

    .days-text {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #94a3b8;
        font-weight: 500;
        letter-spacing: 0.05em;
    }

    .progress-bar-container {
        height: 6px;
        background: #1e293b;
        border-radius: 3px;
        overflow: hidden;
    }

        .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            border-radius: 3px;
        }

        @media (max-width: 640px) {
            .row-flex {
                flex-direction: column;
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
