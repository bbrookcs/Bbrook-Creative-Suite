<script>
    import { fade } from 'svelte/transition';

    let { data } = $props();

    let groupedLogs = $derived.by(() => {
        const groups = {};
        for (const log of data.logs) {
            const dateStr = new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(log);
        }
        return groups;
    });

    const getIcon = (module) => {
        switch(module) {
            case 'Tasks': return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
            case 'Shopping': return 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z';
            case 'Plans': return 'M9 19V6l12-3v13M9 19c-1.657 0-3-1.343-3-3S7.343 13 9 13s3 1.343 3 3-1.343 3-3 3z';
            case 'Notes': return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
            case 'Finances': return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
            default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        }
    };
</script>

<svelte:head>
    <title>Timeline | /self OS</title>
</svelte:head>

<div class="timeline-container">
    <header class="module-header">
        <h2 class="module-title">Activity Timeline</h2>
        <p class="module-subtitle">A chronological record of actions inside the OS</p>
    </header>

    {#if Object.keys(groupedLogs).length === 0}
        <div class="empty-state">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48" style="opacity:0.3; margin-bottom: 16px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No activity recorded yet.</p>
        </div>
    {:else}
        <div class="timeline">
            {#each Object.entries(groupedLogs) as [dateLabel, logs] (dateLabel)}
                <div class="timeline-group" transition:fade>
                    <div class="date-header">
                        <span class="date-text">{dateLabel}</span>
                    </div>
                    
                    <div class="log-entries">
                        {#each logs as log (log.id)}
                            <div class="log-item">
                                <div class="log-time">
                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div class="log-marker">
                                    <div class="marker-dot">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="12" height="12">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(log.module)} />
                                        </svg>
                                    </div>
                                    <div class="marker-line"></div>
                                </div>
                                <div class="log-content card">
                                    <div class="log-module badge badge-pending">{log.module}</div>
                                    <h4 class="log-action">{log.action}</h4>
                                    
                                    {#if log.details}
                                        {@const parsed = typeof log.details === 'string' ? JSON.parse(log.details) : log.details}
                                        {#if parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0}
                                            <div class="log-details">
                                                {#each Object.entries(parsed) as [k, v]}
                                                    <div class="detail-row">
                                                        <span class="detail-key">{k}:</span>
                                                        <span class="detail-val">{v}</span>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .timeline-container {
        max-width: 800px;
        margin: 0 auto;
        padding-bottom: 60px;
    }

    .module-header {
        margin-bottom: 40px;
        border-bottom: 1px solid #262b36;
        padding-bottom: 20px;
    }

    .module-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #f8fafc;
    }

    .module-subtitle {
        color: #94a3b8;
        margin: 0;
        font-size: 0.95rem;
    }

    .empty-state {
        text-align: center;
        padding: 60px 0;
        color: #64748b;
    }

    .timeline {
        display: flex;
        flex-direction: column;
        gap: 32px;
    }

    .timeline-group {
        display: flex;
        flex-direction: column;
    }

    .date-header {
        margin-bottom: 24px;
        position: relative;
        padding-left: 104px; /* match log-item structure */
    }

    .date-text {
        font-size: 0.85rem;
        font-weight: 600;
        color: #94a3b8;
        background: #111318;
        border: 1px solid #262b36;
        padding: 6px 16px;
        border-radius: 99px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: inline-block;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .log-entries {
        display: flex;
        flex-direction: column;
    }

    .log-item {
        display: flex;
        align-items: stretch;
        min-height: 80px;
    }

    .log-item:last-child .marker-line {
        display: none;
    }

    .log-time {
        width: 80px;
        flex-shrink: 0;
        text-align: right;
        padding-right: 16px;
        padding-top: 16px;
        font-family: inherit;
        font-size: 0.85rem;
        color: #64748b;
        font-weight: 500;
    }

    .log-marker {
        width: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        flex-shrink: 0;
    }

    .marker-dot {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #2563eb;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 12px;
        box-shadow: 0 0 0 4px #0f1115;
        z-index: 2;
    }

    .marker-line {
        flex-grow: 1;
        width: 2px;
        background: #262b36;
        margin-top: 4px;
    }

    .log-content {
        flex-grow: 1;
        margin-left: 20px;
        margin-bottom: 24px;
        padding: 16px 20px;
        transition: none;
        position: relative;
    }

    .log-content::before {
        content: '';
        position: absolute;
        top: 20px;
        left: -6px;
        width: 12px;
        height: 12px;
        background: #15181e;
        border-top: 1px solid #262b36;
        border-left: 1px solid #262b36;
        transform: rotate(-45deg);
    }

    .log-module {
        background: rgba(37, 99, 235, 0.1);
        color: #60a5fa;
        font-size: 0.65rem;
        margin-bottom: 8px;
    }

    .log-action {
        font-size: 1.1rem;
        color: #f1f5f9;
        font-weight: 500;
        margin: 0;
        line-height: 1.4;
    }

    .log-details {
        margin-top: 12px;
        background: rgba(15, 23, 42, 0.5);
        border: 1px solid #1e293b;
        border-radius: 6px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .detail-row {
        font-size: 0.85rem;
        display: flex;
        gap: 8px;
    }

    .detail-key {
        color: #64748b;
        font-weight: 500;
        min-width: 80px;
        text-transform: capitalize;
    }

    .detail-val {
        color: #cbd5e1;
    }

    @media (max-width: 640px) {
        .date-header {
            padding-left: 0;
            text-align: center;
        }

        .log-item {
            flex-direction: column;
            gap: 12px;
        }

        .log-time {
            width: 100%;
            text-align: left;
            padding: 0;
            padding-left: 12px;
        }

        .log-marker {
            display: none;
        }

        .log-content {
            margin-left: 0;
        }

        .log-content::before {
            display: none;
        }
    }
</style>
