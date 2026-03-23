<script>
    import { slide } from 'svelte/transition';
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';
    import { marked } from 'marked';

    let { data } = $props();
    
    let prompt = $state('');
    let isThinking = $state(false);

    let currentSessionId = $state(data.sessionId);
    let sessions = $state(data.sessions || []);
    let chatHistory = $state([]);
    let mobileSidebarOpen = $state(false);
    
    let activeDropdownId = $state(null);
    let actionModal = $state(null);

    async function handleDeleteConfirm() {
        if (!actionModal || actionModal.type !== 'delete') return;
        const id = actionModal.id;
        actionModal = null;
        
        sessions = sessions.filter(s => s.id !== id);
        if (currentSessionId === id || sessions.length === 0) {
            goto('/self/ai');
        }
        
        await fetch('/self/ai/session', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
    }

    async function handleRenameConfirm() {
        if (!actionModal || actionModal.type !== 'rename') return;
        const { id, newTitle } = actionModal;
        if (!newTitle.trim()) return;
        
        const session = sessions.find(s => s.id === id);
        if (session) session.title = newTitle;
        actionModal = null;
        
        await fetch('/self/ai/session', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, title: newTitle })
        });
    }

    function openDropdown(id, e) {
        e.preventDefault();
        e.stopPropagation();
        activeDropdownId = activeDropdownId === id ? null : id;
    }

    function openModal(type, session, e) {
        e.preventDefault();
        e.stopPropagation();
        activeDropdownId = null;
        actionModal = { type, id: session.id, title: session.title, newTitle: session.title };
    }

    $effect(() => {
        currentSessionId = data.sessionId;
        sessions = data.sessions || [];
        chatHistory = data.initialMessages.length 
            ? data.initialMessages.map(m => ({ role: m.role, text: m.text })) 
            : [{ role: 'assistant', text: "Hello brook. How can I help you today?" }];
            
        tick().then(() => scrollToBottom());
    });
    
    let chatContainer;

    function handleInput(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitPrompt();
        }
    }

    async function submitPrompt() {
        if (!prompt.trim()) return;
        
        const currentMessages = [...chatHistory, { role: 'user', text: prompt }];
        chatHistory = currentMessages;
        prompt = '';
        
        await tick();
        scrollToBottom(true);

        isThinking = true;
        
        try {
            const res = await fetch('/self/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: currentMessages, session_id: currentSessionId })
            });

            const resData = await res.json();
            
            if (res.ok) {
                chatHistory = [...chatHistory, { role: 'assistant', text: resData.reply }];
                
                // If this was a new session, update GUI and URL safely
                if (!currentSessionId && resData.session_id) {
                    currentSessionId = resData.session_id;
                    goto(`/self/ai?session=${currentSessionId}`, { replaceState: true, noScroll: true });
                    sessions = [{id: currentSessionId, title: resData.title || currentMessages[0].text.substring(0,30)}, ...sessions];
                }
            } else {
                chatHistory = [...chatHistory, { role: 'assistant', text: "System Error: " + (resData.error || "Could not connect to AI node.") }];
            }
        } catch(e) {
            chatHistory = [...chatHistory, { role: 'assistant', text: "Network connection failed. Unable to reach intelligence server." }];
        } finally {
            isThinking = false;
            await tick();
            scrollToBottom(true);
        }
    }
    
    function scrollToBottom(smooth = false) {
        if (!chatContainer) return;
        const doScroll = () => {
            if (!chatContainer) return;
            if (smooth) {
                chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
            } else {
                // scrollTop assignment is more reliable than scrollTo for large content
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        };
        // Fire immediately, then retry as markdown/images progressively render
        doScroll();
        setTimeout(doScroll, 50);
        setTimeout(doScroll, 200);
        setTimeout(doScroll, 500);
    }
    
    onMount(() => {
        scrollToBottom();
        // Extra safety net for long previous conversations with markdown
        setTimeout(() => scrollToBottom(), 500);
    });
</script>

<svelte:window onclick={() => activeDropdownId = null} />

<svelte:head>
    <title>AI Assistant | /self OS</title>
</svelte:head>

<div class="ai-container">
    {#if mobileSidebarOpen}
        <div class="mobile-overlay" transition:slide="{{ duration: 200 }}" onclick={() => mobileSidebarOpen = false}></div>
    {/if}

    <div class="sessions-sidebar card {mobileSidebarOpen ? 'open' : ''}">
        <div class="sidebar-header-mobile">
            <h3>Conversations</h3>
            <button class="close-sidebar-btn" onclick={() => mobileSidebarOpen = false}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <button class="new-chat-btn" onclick={() => { goto('/self/ai'); mobileSidebarOpen = false; }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Chat
        </button>
        
        <div class="sessions-list">
            {#each sessions as session}
                <a 
                    href="/self/ai?session={session.id}" 
                    class="session-item {currentSessionId == session.id ? 'active' : ''}"
                    onclick={() => mobileSidebarOpen = false}
                >
                    <div class="session-item-content">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16" class="session-icon">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span class="session-title">{session.title}</span>
                    </div>
                    <div class="session-actions">
                        <button class="options-btn" onclick={(e) => openDropdown(session.id, e)} title="Options">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>
                        {#if activeDropdownId === session.id}
                            <div class="dropdown-menu">
                                <button onclick={(e) => openModal('rename', session, e)}>
                                    Rename
                                </button>
                                <button class="danger" onclick={(e) => openModal('delete', session, e)}>
                                    Delete Chat
                                </button>
                            </div>
                        {/if}
                    </div>
                </a>
            {/each}
            {#if sessions.length === 0}
                <p class="no-sessions">No previous chats.</p>
            {/if}
        </div>
    </div>

    <div class="chat-wrapper card">
        <button class="mobile-menu-btn" onclick={() => mobileSidebarOpen = !mobileSidebarOpen}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>

        <div class="chat-history" bind:this={chatContainer}>
            {#each chatHistory as msg}
                <div class="message-row {msg.role}" transition:slide>
                    <div class="message-bubble {msg.role}">
                        <div class="bubble-text">
                            {#if msg.role === 'assistant'}
                                {@html marked.parse(msg.text)}
                            {:else}
                                {msg.text}
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
            
            {#if isThinking}
                <div class="message-row assistant" transition:slide>
                    <div class="message-bubble assistant thinking-bubble">
                        <div class="thinking-dots">
                            <div class="dot"></div>
                            <div class="dot"></div>
                            <div class="dot"></div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <div class="chat-input-area">
            <textarea 
                bind:value={prompt}
                onkeydown={handleInput}
                class="prompt-input" 
                placeholder="Ask your self anything..."
                rows="1"
            ></textarea>
            <button class="send-btn" onclick={submitPrompt} disabled={!prompt.trim() || isThinking}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            </button>
        </div>
    </div>
</div>

{#if actionModal}
    <div class="custom-modal-overlay" onclick={() => actionModal = null}>
        <div class="custom-modal card" onclick={(e) => e.stopPropagation()}>
            {#if actionModal.type === 'delete'}
                <h3>Delete Conversation</h3>
                <p>Are you sure you want to permanently delete "{actionModal.title}"?</p>
                <div class="modal-actions">
                    <button class="btn secondary" onclick={() => actionModal = null}>Cancel</button>
                    <button class="btn danger" onclick={handleDeleteConfirm}>Delete</button>
                </div>
            {:else if actionModal.type === 'rename'}
                <h3>Rename Conversation</h3>
                <input class="prompt-input inline-modal-input" type="text" bind:value={actionModal.newTitle} placeholder="New title..." />
                <div class="modal-actions">
                    <button class="btn secondary" onclick={() => actionModal = null}>Cancel</button>
                    <button class="btn primary" onclick={handleRenameConfirm}>Save Changes</button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .ai-container {
        max-width: 1100px;
        margin: 0 auto;
        height: calc(100vh - 120px);
        display: flex;
        gap: 20px;
    }

    .sessions-sidebar {
        width: 250px;
        display: flex;
        flex-direction: column;
        padding: 16px;
        gap: 16px;
        overflow-y: auto;
        flex-shrink: 0;
    }

    .new-chat-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 10px 16px;
        background: rgba(102, 13, 97, 0.15);
        color: #c94cc3;
        border: 1px solid rgba(102, 13, 97, 0.3);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }

    .new-chat-btn:hover {
        background: rgba(102, 13, 97, 0.3);
    }

    .sessions-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .session-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        color: #94a3b8;
        text-decoration: none;
        border-radius: 8px;
        font-size: 0.9rem;
        transition: all 0.2s;
        border: 1px solid transparent;
        position: relative;
    }

    .session-item-content {
        display: flex;
        align-items: center;
        gap: 12px;
        overflow: hidden;
        flex-grow: 1;
    }

    .session-icon {
        flex-shrink: 0;
    }

    .session-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .session-actions {
        position: relative;
    }

    .options-btn {
        background: transparent;
        color: #94a3b8;
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .session-item:hover .options-btn, .options-btn:focus {
        opacity: 1;
    }

    .options-btn:hover, .dropdown-menu {
        background: rgba(255, 255, 255, 0.1);
        color: #f8fafc;
    }

    .dropdown-menu {
        position: absolute;
        top: 32px;
        right: 0;
        background: #1e222a;
        border: 1px solid #262b36;
        border-radius: 8px;
        padding: 4px;
        min-width: 120px;
        z-index: 50;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }

    .dropdown-menu button {
        width: 100%;
        text-align: left;
        padding: 8px 12px;
        background: transparent;
        border: none;
        color: #e2e8f0;
        font-size: 0.85rem;
        cursor: pointer;
        border-radius: 4px;
    }

    .dropdown-menu button:hover {
        background: #2a2f3a;
    }

    .dropdown-menu button.danger {
        color: #ef4444;
    }
    
    .dropdown-menu button.danger:hover {
        background: rgba(239, 68, 68, 0.1);
    }

    .session-item:hover {
        background: #111318;
        color: #f8fafc;
    }

    .session-item.active {
        background: #111318;
        color: #f8fafc;
        border-color: #262b36;
    }

    .sidebar-header-mobile {
        display: none;
    }

    .mobile-overlay {
        display: none;
    }

    .no-sessions {
        color: #64748b;
        font-size: 0.85rem;
        text-align: center;
        margin-top: 10px;
    }

    .chat-wrapper {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        padding: 0;
        overflow: hidden;
    }

    .mobile-menu-btn {
        display: none;
    }

    .chat-history {
        flex-grow: 1;
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .message-row {
        display: flex;
        width: 100%;
    }

    .message-row.user {
        justify-content: flex-end;
    }

    .message-row.assistant {
        justify-content: flex-start;
    }

    .message-bubble {
        max-width: 80%;
        padding: 14px 20px;
        border-radius: 12px;
        line-height: 1.6;
        font-size: 0.95rem;
        display: flex;
        gap: 12px;
        align-items: flex-start;
    }

    .message-bubble.user {
        background: #660d61;
        color: #ffffff;
        border-bottom-right-radius: 4px;
    }

    .message-bubble.assistant {
        background: #1e222a;
        color: #cbd5e1;
        border: 1px solid #262b36;
        border-bottom-left-radius: 4px;
    }

    .bubble-text {
        white-space: normal; /* Override pre-wrap for markdown to look natural */
        word-break: break-word;
    }

    :global(.bubble-text p) {
        margin: 0 0 12px 0;
    }
    :global(.bubble-text p:last-child) {
        margin-bottom: 0;
    }
    :global(.bubble-text strong) {
        font-weight: 700;
        color: #f8fafc;
    }
    :global(.bubble-text ul), :global(.bubble-text ol) {
        margin: 10px 0;
        padding-left: 24px;
    }
    :global(.bubble-text li) {
        margin-bottom: 6px;
    }
    :global(.bubble-text code) {
        background: rgba(0, 0, 0, 0.4);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.85em;
        color: #e2e8f0;
    }
    :global(.bubble-text pre) {
        background: #0d0f12;
        padding: 14px;
        border-radius: 8px;
        overflow-x: auto;
        border: 1px solid #262b36;
        margin: 12px 0;
    }
    :global(.bubble-text pre code) {
        background: transparent;
        padding: 0;
        color: #cbd5e1;
        font-size: 0.9em;
    }

    .bubble-icon {
        background: rgba(255, 255, 255, 0.1);
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .thinking-bubble {
        align-items: center;
        padding: 12px 20px;
    }

    .thinking-dots {
        display: flex;
        gap: 4px;
        padding: 4px 0;
    }

    .dot {
        width: 6px;
        height: 6px;
        background: #64748b;
        border-radius: 50%;
        animation: think 1.4s infinite ease-in-out both;
    }

    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes think {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
    }

    .chat-input-area {
        padding: 10px 20px;
        display: flex;
        align-items: flex-end;
        gap: 16px;
    }

    .prompt-input {
        flex-grow: 1;
        background: #0f1115;
        border: 1px solid #262b36;
        color: #f8fafc;
        border-radius: 12px;
        padding: 14px 16px;
        font-family: inherit;
        font-size: 0.95rem;
        resize: none;
        max-height: 120px;
        line-height: 1.5;
        outline: none;
        transition: border-color 0.2s;
    }

    .prompt-input:focus {
        border-color: #9a1892;
    }

    .prompt-input::placeholder {
        color: #64748b;
    }

    .send-btn {
        background: #660d61;
        color: white;
        border: none;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .send-btn:hover:not(:disabled) {
        background: #4d0948;
    }

    .send-btn:disabled {
        background: #1e293b;
        color: #475569;
        cursor: not-allowed;
    }

    @media (max-width: 860px) {
        .ai-container {
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            bottom: 64px;
            height: auto;
            max-width: none;
            margin: 0;
            z-index: 40;
            background: #0f1115;
        }
        .chat-wrapper {
            border-radius: 0;
            border: none;
            height: 100%;
        }
        .mobile-menu-btn {
            display: flex;
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 50;
            background: rgba(30, 34, 42, 0.8);
            backdrop-filter: blur(4px);
            border: 1px solid #334155;
            color: #f8fafc;
            border-radius: 8px;
            width: 40px;
            height: 40px;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }

        .mobile-overlay {
            display: block;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(2px);
            z-index: 990;
        }

        .sessions-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 280px;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: #0b0d10;
            border-right: 1px solid #262b36;
            margin: 0;
            border-radius: 0;
        }

        .sessions-sidebar.open {
            transform: translateX(0);
        }

        .sidebar-header-mobile {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #262b36;
            padding-bottom: 16px;
            margin-bottom: 8px;
        }

        .sidebar-header-mobile h3 {
            margin: 0;
            color: #f8fafc;
            font-size: 1.1rem;
        }

        .close-sidebar-btn {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            padding: 4px;
        }

        .options-btn {
            opacity: 1; /* Always show options button on mobile */
        }
        
        .chat-history {
            padding: 60px 10px 10px 10px;
        }

        .chat-input-area {
            padding: 5px 10px;
        }

        .message-bubble {
            max-width: 90%;
            padding: 10px;
        }
        
        .message-bubble.assistant {
            max-width: 96%;
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

    .inline-modal-input {
        width: 100%;
        margin-bottom: 24px;
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

    .btn.primary {
        background: #2563eb;
        color: white;
    }

    .btn.primary:hover {
        background: #1d4ed8;
    }

    .btn.danger {
        background: #ef4444;
        color: white;
    }

    .btn.danger:hover {
        background: #dc2626;
    }
</style>
