<script>
    import { slide } from 'svelte/transition';
    import { onMount } from 'svelte';

    let prompt = $state('');
    let isThinking = $state(false);

    let chatHistory = $state([
        { role: 'assistant', text: "Hello brook. How can I help you today?" }
    ]);
    
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
        
        setTimeout(() => scrollToBottom(), 50);

        isThinking = true;
        
        try {
            const res = await fetch('/self/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: currentMessages })
            });

            const data = await res.json();
            
            if (res.ok) {
                chatHistory = [...chatHistory, { role: 'assistant', text: data.reply }];
            } else {
                chatHistory = [...chatHistory, { role: 'assistant', text: "System Error: " + (data.error || "Could not connect to AI node.") }];
            }
        } catch(e) {
            chatHistory = [...chatHistory, { role: 'assistant', text: "Network connection failed. Unable to reach intelligence server." }];
        } finally {
            isThinking = false;
            setTimeout(() => scrollToBottom(), 50);
        }
    }
    
    function scrollToBottom() {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
    
    onMount(() => {
        scrollToBottom();
    });
</script>

<svelte:head>
    <title>AI Assistant | /self OS</title>
</svelte:head>

<div class="ai-container">
    <div class="chat-wrapper card">
        <div class="chat-header">
            <div class="ai-avatar">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <div>
                <h2 class="chat-title">Self Intelligence</h2>
            </div>
        </div>

        <div class="chat-history" bind:this={chatContainer}>
            {#each chatHistory as msg}
                <div class="message-row {msg.role}" transition:slide>
                    <div class="message-bubble {msg.role}">
                        {#if msg.role === 'assistant'}
                            <div class="bubble-icon">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="14" height="14">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        {/if}
                        <div class="bubble-text">{msg.text}</div>
                    </div>
                </div>
            {/each}
            
            {#if isThinking}
                <div class="message-row assistant" transition:slide>
                    <div class="message-bubble assistant thinking-bubble">
                        <div class="bubble-icon">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="14" height="14">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
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

<style>
    .ai-container {
        max-width: 800px;
        margin: 0 auto;
        height: calc(100vh - 120px);
        display: flex;
        flex-direction: column;
    }

    .chat-wrapper {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        padding: 0;
        overflow: hidden;
    }

    .chat-header {
        padding: 20px 24px;
        border-bottom: 1px solid #262b36;
        display: flex;
        align-items: center;
        gap: 16px;
        background: #111318;
    }

    .ai-avatar {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #2563eb, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    }

    .chat-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        color: #f8fafc;
    }

    .chat-subtitle {
        font-size: 0.8rem;
        color: #64748b;
        margin: 2px 0 0 0;
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
        background: #2563eb;
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
        white-space: pre-wrap;
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
        padding: 20px 24px;
        background: #111318;
        border-top: 1px solid #262b36;
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
        border-color: #3b82f6;
    }

    .prompt-input::placeholder {
        color: #64748b;
    }

    .send-btn {
        background: #2563eb;
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
        background: #1d4ed8;
    }

    .send-btn:disabled {
        background: #1e293b;
        color: #475569;
        cursor: not-allowed;
    }

    @media (max-width: 640px) {
        .ai-container {
            height: calc(100vh - 100px);
        }
        
        .chat-header, .chat-history, .chat-input-area {
            padding: 16px;
        }

        .message-bubble {
            max-width: 90%;
            padding: 12px 16px;
        }
    }
</style>
