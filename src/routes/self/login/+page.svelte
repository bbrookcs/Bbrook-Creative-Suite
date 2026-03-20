<script>
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';

    let { form } = $props();
    let loading = $state(false);
</script>

<svelte:head>
    <title>Login | /self OS</title>
</svelte:head>

<div class="login-wrapper">
    <div class="login-card">
        <div class="brand">
            <h1 class="brand-text">/self</h1>
            <span class="brand-sub"> os</span>
        </div>
        <form method="POST" use:enhance={() => {
            loading = true;
            return async ({ update }) => {
                await update();
                loading = false;
            };
        }} class="login-form">
            <div class="form-group">
                <label for="username" class="form-label">Username</label>
                <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    class="form-input" 
                    required 
                    autocomplete="username"
                    autofocus
                />
            </div>
            
            <div class="form-group">
                <label for="password" class="form-label">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    class="form-input" 
                    required 
                    autocomplete="current-password"
                />
            </div>

            <button 
                type="submit" 
                class="btn btn-primary login-btn" 
                disabled={loading}
            >
                {#if loading}
                    <div class="loader-inner"></div>
                {:else}
                    Self
                {/if}
            </button>

            {#if form?.missing}
                <p class="error-msg">Both username and password are required.</p>
            {/if}
            {#if form?.invalid}
                <p class="error-msg">Invalid credentials. Please try again.</p>
            {/if}
            {#if form?.notAdmin}
                <p class="error-msg">Access denied. Admin privileges required.</p>
            {/if}
        </form>
    </div>
</div>

<style>
    :global(body) {
        background-color: #0f1115;
        color: #e2e8f0;
        margin: 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .login-wrapper {
        min-height: 80vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }

    .login-card {
        background: #15181e;
        border: 1px solid #262b36;
        border-radius: 12px;
        padding: 40px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
    }

    .brand-text {
        font-size: 2rem;
        font-weight: 700;
        color: #f8fafc;
        margin: 0;
        letter-spacing: -0.04em;
    }

    .brand-sub {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        background: #2563eb;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 600;
    }

    .login-desc {
        color: #94a3b8;
        font-size: 0.95rem;
        margin: 0 0 32px 0;
        line-height: 1.5;
    }

    .login-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .form-label {
        font-size: 0.85rem;
        font-weight: 500;
        color: #cbd5e1;
    }

    .form-input {
        background: #0f1115;
        border: 1px solid #334155;
        color: #f8fafc;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: inherit;
        font-size: 1rem;
        transition: all 0.2s;
    }

    .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .login-btn {
        margin-top: 12px;
        padding: 14px;
        font-size: 1rem;
        font-weight: 600;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .login-btn:hover {
        background: #1d4ed8;
    }

    .login-btn:disabled {
        background: #1e293b;
        color: #475569;
        cursor: not-allowed;
        opacity: 0.7;
    }

    .loader-inner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .error-msg {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        padding: 12px;
        border-radius: 8px;
        font-size: 0.9rem;
        text-align: center;
        margin: 0;
        border: 1px solid rgba(239, 68, 68, 0.2);
    }
</style>
