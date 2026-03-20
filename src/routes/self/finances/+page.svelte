<script>
    import { enhance } from '$app/forms';
    import { slide, fade } from 'svelte/transition';

    let { data, form } = $props();

    let filterType = $state('All');

    let filteredFinances = $derived.by(() => {
        if (filterType === 'All') return data.finances;
        return data.finances.filter(f => f.type === filterType);
    });
</script>

<svelte:head>
    <title>Finances | /self OS</title>
</svelte:head>

<div class="module-container">
    <!-- DASHBOARD SUMMARY -->
    <div class="financial-summary grid-cards">
        <div class="card summary-card income-wrap">
            <div class="summary-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
            </div>
            <div class="summary-details">
                <span class="summary-label">Monthly Income</span>
                <span class="summary-value income">${Number(data.monthlyIncome).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>

        <div class="card summary-card expense-wrap">
            <div class="summary-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
            </div>
            <div class="summary-details">
                <span class="summary-label">Monthly Expenses</span>
                <span class="summary-value expense">${Number(data.monthlyExpense).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>

        <div class="card summary-card net-wrap" class:positive={data.netBalance >= 0} class:negative={data.netBalance < 0}>
            <div class="summary-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
            </div>
            <div class="summary-details">
                <span class="summary-label">Net Balance</span>
                <span class="summary-value balance">${Math.abs(data.netBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>
    </div>

    <div class="content-split">
        <!-- QUICK ADD -->
        <div class="side-panel">
            <div class="card form-card">
                <h3 class="card-title">Add Transaction</h3>
                <form action="?/add" method="POST" use:enhance class="transaction-form" autocomplete="off">
                    <div class="type-switch">
                        <label class="radio-label income-radio">
                            <input type="radio" name="type" value="income" required />
                            <span>Income</span>
                        </label>
                        <label class="radio-label expense-radio">
                            <input type="radio" name="type" value="expense" checked required />
                            <span>Expense</span>
                        </label>
                    </div>

                    <div class="form-group row-flex">
                        <div style="flex-grow: 1;">
                            <label class="form-label" for="category">Category / Source</label>
                            <input type="text" id="category" name="category" placeholder="e.g. Salary, Groceries..." class="form-input" required />
                        </div>
                        <div style="width: 140px;">
                            <label class="form-label" for="amount">Amount ($)</label>
                            <input type="number" id="amount" name="amount" min="0" step="0.01" placeholder="0.00" class="form-input" required />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="date">Date</label>
                        <input type="date" id="date" name="date" class="form-input" required value={new Date().toISOString().split('T')[0]} />
                    </div>

                    <button type="submit" class="btn btn-primary submit-btn">Save Transaction</button>
                    
                    {#if form?.missing}
                        <p class="error-msg text-center" style="margin-top: 12px;">Please fill in all fields.</p>
                    {/if}
                </form>
            </div>
        </div>

        <!-- TRANSACTIONS LIST -->
        <div class="main-panel">
            <div class="card list-card">
                <div class="list-header">
                    <h3 class="card-title" style="margin: 0;">Recent Transactions</h3>
                    <select class="form-input filter-type" bind:value={filterType}>
                        <option value="All">All Types</option>
                        <option value="income">Income Only</option>
                        <option value="expense">Expenses Only</option>
                    </select>
                </div>

                {#if filteredFinances.length === 0}
                    <div class="empty-state">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48" style="opacity:0.3; margin-bottom: 16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No transactions found for this filter.</p>
                    </div>
                {:else}
                    <div class="transaction-list">
                        {#each filteredFinances as tx (tx.id)}
                            <div class="transaction-item" transition:fade>
                                <div class="tx-icon {tx.type}">
                                    {#if tx.type === 'income'}
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    {:else}
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                                        </svg>
                                    {/if}
                                </div>
                                <div class="tx-details">
                                    <span class="tx-category">{tx.category}</span>
                                    <span class="tx-date">{new Date(tx.date).toLocaleDateString()}</span>
                                </div>
                                <div class="tx-amount {tx.type}">
                                    {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <form action="?/delete" method="POST" use:enhance class="delete-form">
                                    <input type="hidden" name="id" value={tx.id} />
                                    <button type="submit" class="delete-btn" title="Delete">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .module-container {
        display: flex;
        flex-direction: column;
        gap: 32px;
        max-width: 1000px;
        margin: 0 auto;
    }

    .financial-summary {
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
    }

    .summary-card {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 24px;
    }

    .summary-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .income-wrap .summary-icon {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }

    .expense-wrap .summary-icon {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    .net-wrap.positive .summary-icon {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }

    .net-wrap.negative .summary-icon {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    .summary-details {
        display: flex;
        flex-direction: column;
    }

    .summary-label {
        font-size: 0.85rem;
        color: #94a3b8;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .summary-value {
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1.2;
    }

    .summary-value.income { color: #34d399; }
    .summary-value.expense { color: #f87171; }
    .summary-value.balance { color: #f8fafc; }
    .net-wrap.negative .summary-value.balance { color: #f87171; }

    .content-split {
        display: flex;
        gap: 24px;
        align-items: flex-start;
    }

    .side-panel {
        width: 320px;
        flex-shrink: 0;
    }

    .main-panel {
        flex-grow: 1;
    }

    .form-card {
        background: #15181e;
        border: 1px solid #262b36;
    }

    .type-switch {
        display: flex;
        background: #0f1115;
        border-radius: 8px;
        padding: 4px;
        border: 1px solid #262b36;
        margin: 20px 0;
    }

    .radio-label {
        flex: 1;
        text-align: center;
        cursor: pointer;
        position: relative;
    }

    .radio-label input {
        position: absolute;
        opacity: 0;
    }

    .radio-label span {
        display: block;
        padding: 8px 12px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #94a3b8;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .income-radio input:checked + span {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
    }

    .expense-radio input:checked + span {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
    }

    .row-flex {
        display: flex;
        gap: 12px;
    }

    .submit-btn {
        width: 100%;
        margin-top: 8px;
        padding: 12px;
    }

    .list-card {
        padding: 0;
    }

    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid #262b36;
    }

    .filter-type {
        width: 150px;
        padding: 6px 12px;
        background: #0f1115;
    }

    .empty-state {
        padding: 60px 0;
        text-align: center;
        color: #64748b;
        font-size: 0.95rem;
    }

    .transaction-list {
        display: flex;
        flex-direction: column;
    }

    .transaction-item {
        display: flex;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #1e222a;
        transition: background 0.2s;
    }

    .transaction-item:hover {
        background: #1a1d24;
    }

    .transaction-item:last-child {
        border-bottom: none;
    }

    .tx-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        flex-shrink: 0;
    }

    .tx-icon.income {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }

    .tx-icon.expense {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    .tx-details {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .tx-category {
        font-weight: 500;
        color: #f1f5f9;
        font-size: 1rem;
    }

    .tx-date {
        font-size: 0.8rem;
        color: #94a3b8;
    }

    .tx-amount {
        font-weight: 600;
        font-size: 1.1rem;
        font-variant-numeric: tabular-nums;
        text-align: right;
        margin-right: 20px;
    }

    .tx-amount.income { color: #34d399; }
    .tx-amount.expense { color: #f8fafc; }

    .delete-form {
        flex-shrink: 0;
    }

    .delete-btn {
        background: transparent;
        color: #475569;
        border: none;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .delete-btn:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    @media (max-width: 860px) {
        .financial-summary {
            grid-template-columns: 1fr;
            gap: 16px;
        }

        .content-split {
            flex-direction: column;
            align-items: stretch;
        }

        .side-panel {
            width: 100%;
        }
    }
</style>
