<script>
    import { enhance } from '$app/forms';
    import { slide, fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let { data, form } = $props();

    let filterType = $state('All');

    let filteredFinances = $derived.by(() => {
        if (filterType === 'All') return data.finances;
        return data.finances.filter(/** @param {any} f */ f => f.type === filterType);
    });

    // Chart Time Filtering options
    let timeFilter = $state('7d');
    let customStartDate = $state('');
    let customEndDate = $state('');
    /** @type {HTMLCanvasElement} */ let chartCanvas;
    /** @type {any} */ let chartInstance = null;

    let filteredGraphData = $derived.by(() => {
        const now = new Date();
        let startDate = new Date(0); // far past
        let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (timeFilter === '7d') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        } else if (timeFilter === '1m') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 0, 0, 0, 0);
        } else if (timeFilter === '1y') {
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0);
        } else if (timeFilter === 'custom') {
            if (customStartDate) {
                const s = new Date(customStartDate);
                startDate = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0);
            }
            if (customEndDate) {
                const e = new Date(customEndDate);
                endDate = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999);
            }
        }

        return data.finances.filter(/** @param {any} f */ f => {
            const txDate = new Date(f.date);
            return txDate >= startDate && txDate <= endDate;
        });
    });

    let summaryIncome = $derived.by(() => {
        return filteredGraphData.reduce((sum, tx) => sum + (tx.type === 'income' ? Number(tx.amount) : 0), 0);
    });

    let summaryExpense = $derived.by(() => {
        return filteredGraphData.reduce((sum, tx) => sum + (tx.type === 'expense' ? Number(tx.amount) : 0), 0);
    });

    let allTimeNetBalance = $derived.by(() => {
        return data.finances.reduce((sum, tx) => sum + (tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount)), 0);
    });

    $effect(() => {
        // Trigger chart update when filteredGraphData or timeFilter changes explicitly
        const currentData = filteredGraphData;
        const currentFilter = timeFilter;
        if (chartInstance && currentData.length >= 0) {
            updateChart(currentData, currentFilter);
        }
    });

    /** 
     * @param {any[]} transactions 
     * @param {string} filterMode
     */
    function groupDataByDate(transactions, filterMode) {
        /** @type {Record<string, {label: string, income: number, expense: number, net: number}>} */
        const grouped = {};
        transactions.forEach(/** @param {any} tx */ tx => {
            const dateObj = new Date(tx.date);
            // Format date for chart labels
            const dateStr = dateObj.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                year: (filterMode === 'all' || filterMode === '1y' || filterMode === 'custom') ? 'numeric' : undefined 
            });
            // Use ISO stamp as key to sort accurately later, or just a zero-hour date
            const sortingKey = String(new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime());
            
            if (!grouped[sortingKey]) grouped[sortingKey] = { label: dateStr, income: 0, expense: 0, net: 0 };
            if (tx.type === 'income') {
                grouped[sortingKey].income += Number(tx.amount);
                grouped[sortingKey].net += Number(tx.amount);
            } else {
                grouped[sortingKey].expense += Number(tx.amount);
                grouped[sortingKey].net -= Number(tx.amount);
            }
        });
        return grouped;
    }

    /** 
     * @param {any[]} dataArr
     * @param {string} filterMode
     */
    function updateChart(dataArr, filterMode) {
        const grouped = groupDataByDate(dataArr.slice(), filterMode);
        
        // Sort grouped keys chronologically
        const sortedKeys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));

        const labels = sortedKeys.map(k => grouped[k].label);
        const incomeData = sortedKeys.map(k => grouped[k].income);
        const expenseData = sortedKeys.map(k => grouped[k].expense);
        
        // calculate cumulative net for chart
        let cumulativeNet = 0;
        const netData = sortedKeys.map(k => {
            cumulativeNet += grouped[k].net;
            return cumulativeNet;
        });

        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].data = incomeData;
        chartInstance.data.datasets[1].data = expenseData;
        chartInstance.data.datasets[2].data = netData;
        chartInstance.update();
    }

    onMount(() => {
        if (chartCanvas) {
            const ctx = chartCanvas.getContext('2d');
            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Income',
                            data: [],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 3
                        },
                        {
                            label: 'Expenses',
                            data: [],
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 3
                        },
                        {
                            label: 'Cumulative Net',
                            data: [],
                            borderColor: '#3b82f6',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            tension: 0.4,
                            pointRadius: 0,
                            hidden: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        },
                        legend: {
                            labels: {
                                color: '#94a3b8',
                                usePointStyle: true,
                                boxWidth: 8
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: '#262b36', display: false },
                            ticks: { color: '#94a3b8', maxTicksLimit: 10 }
                        },
                        y: {
                            grid: { color: '#262b36', display: false },
                            ticks: { 
                                color: '#94a3b8',
                                callback: function(/** @type {string | number} */ value) {
                                    const numVal = Number(value);
                                    if (numVal >= 1000) return (numVal / 1000) + 'k';
                                    return value;
                                }
                            }
                        }
                    }
                }
            });
            updateChart(filteredGraphData, timeFilter);
        }

        return () => {
            if (chartInstance) {
                chartInstance.destroy();
            }
        };
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
                <span class="summary-value income">{summaryIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>

        <div class="card summary-card expense-wrap">
            <div class="summary-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
            </div>
            <div class="summary-details">
                <span class="summary-value expense">{summaryExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>

        <div class="card summary-card net-wrap" class:positive={allTimeNetBalance >= 0} class:negative={allTimeNetBalance < 0}>
            <div class="summary-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
            </div>
            <div class="summary-details">
                <span class="summary-value balance">{Math.abs(allTimeNetBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>
    </div>

    <!-- TREND GRAPH -->
    <div class="card graph-card">
        <div class="graph-header">
            <h3 class="card-title" style="margin: 0;">Financial Trend</h3>
            <div class="time-filters">
                <button class="time-btn" class:active={timeFilter === '7d'} onclick={() => timeFilter = '7d'}>7 Days</button>
                <button class="time-btn" class:active={timeFilter === '1m'} onclick={() => timeFilter = '1m'}>1 Month</button>
                <button class="time-btn" class:active={timeFilter === '1y'} onclick={() => timeFilter = '1y'}>1 Year</button>
                <button class="time-btn" class:active={timeFilter === 'all'} onclick={() => timeFilter = 'all'}>All Time</button>
                <button class="time-btn" class:active={timeFilter === 'custom'} onclick={() => timeFilter = 'custom'}>Custom</button>
            </div>
        </div>
        
        {#if timeFilter === 'custom'}
            <div class="custom-date-range" transition:slide>
                <div class="date-input-group">
                    <label for="startDate">From:</label>
                    <input type="date" id="startDate" class="form-input" bind:value={customStartDate} />
                </div>
                <div class="date-input-group">
                    <label for="endDate">To:</label>
                    <input type="date" id="endDate" class="form-input" bind:value={customEndDate} />
                </div>
            </div>
        {/if}

        <div class="chart-container">
            {#if filteredGraphData.length === 0}
                <div class="empty-chart">
                    <p>No data available for this timeframe.</p>
                </div>
            {/if}
            <canvas bind:this={chartCanvas}></canvas>
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
                            <label class="form-label" for="amount">Amount (ETB)</label>
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
                                    {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        padding: 10px;
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

        .graph-header {
            flex-direction: column;
            align-items: stretch;
        }

        .time-filters {
            flex-wrap: wrap;
            justify-content: center;
        }

        .custom-date-range {
            flex-direction: column;
        }
    }

    .graph-card {
        padding: 24px;
        background: #15181e;
        border: 1px solid #262b36;
        border-radius: 12px;
    }

    .graph-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
    }

    .time-filters {
        display: flex;
        gap: 8px;
        background: #0f1115;
        padding: 4px;
        border-radius: 8px;
        border: 1px solid #262b36;
    }

    .time-btn {
        background: transparent;
        border: none;
        color: #64748b;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .time-btn:hover {
        color: #f1f5f9;
        background: #1e222a;
    }

    .time-btn.active {
        background: #2563eb;
        color: #ffffff;
    }

    .custom-date-range {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        padding: 16px;
        background: #0f1115;
        border-radius: 8px;
        border: 1px solid #262b36;
    }

    .date-input-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .date-input-group label {
        color: #94a3b8;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .date-input-group input {
        width: 150px;
        padding: 6px 12px;
    }

    .chart-container {
        position: relative;
        height: 300px;
        width: 100%;
    }

    .empty-chart {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        font-size: 0.95rem;
        background: rgba(21, 24, 30, 0.8);
        z-index: 10;
    }
</style>
