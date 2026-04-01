<script>
    import { enhance } from '$app/forms';
    import { fade, slide } from 'svelte/transition';

    let { data, form } = $props();

    let showCreateForm = $state(false);
    let activeDropdown = $state(null);
    let deleteModal = $state(null);
    let resetModal = $state(null);
    let newPassword = $state('');

    function toggleDropdown(id, e) {
        e.stopPropagation();
        activeDropdown = activeDropdown === id ? null : id;
    }

    function closeDropdowns() {
        activeDropdown = null;
    }

    function getRoleBadge(role) {
        if (role === 'admin') return 'role-admin';
        if (role === 'self') return 'role-self';
        if (role === 'editor') return 'role-editor';
        return 'role-viewer';
    }

    function formatDate(d) {
        return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function timeAgo(dateString) {
        if (!dateString) return 'Never';
        // Database connection sends raw UTC time assuming it's local. We account for the offset here:
        const rawDate = new Date(dateString);
        const offset = rawDate.getTimezoneOffset() * 60000;
        const date = new Date(rawDate.getTime() - offset);
        
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 30) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        
        const m = Math.floor(seconds / 60);
        if (m < 60) return `${m}m ago`;
        
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        
        const d = Math.floor(h / 24);
        if (d < 30) return `${d} day${d !== 1 ? 's' : ''} ago`;
        
        const mo = Math.floor(d / 30);
        if (mo < 12) return `${mo} month${mo !== 1 ? 's' : ''} ago`;
        
        const y = Math.floor(mo / 12);
        return `${y} year${y !== 1 ? 's' : ''} ago`;
    }
</script>

<svelte:window onclick={closeDropdowns} />

<svelte:head>
    <title>Users | /self OS</title>
</svelte:head>

<div class="module-container">
    <!-- HEADER -->
    <div class="page-header">
        <div class="header-left">
            <h1 class="page-title">User Management</h1>
            <p class="page-sub">Manage accounts, roles, and access</p>
        </div>
        <button class="btn btn-primary" onclick={() => showCreateForm = !showCreateForm}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New User
        </button>
    </div>

    <!-- CREATE FORM -->
    {#if showCreateForm}
        <div class="card create-card" transition:slide>
            <h3 class="card-title">Create New User</h3>
            {#if form?.error}
                <div class="form-error">{form.error}</div>
            {/if}
            {#if form?.success}
                <div class="form-success">✓ User created successfully!</div>
            {/if}
            <form action="?/createUser" method="POST" use:enhance={() => {
                return async ({ update }) => {
                    await update();
                    if (!form?.error) showCreateForm = false;
                };
            }} class="create-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="username">Username</label>
                        <input class="form-input" id="username" type="text" name="username" placeholder="johndoe" required autocomplete="off" />
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="password">Password</label>
                        <input class="form-input" id="password" type="password" name="password" placeholder="Min. 6 characters" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="role">Role</label>
                        <select class="form-input" id="role" name="role">
                            <option value="admin">Admin</option>
                            <option value="self">Owner</option> 
                            <option value="editor">Editor</option>
                            <option value="viewer" selected>Viewer</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-ghost" onclick={() => showCreateForm = false}>Cancel</button>
                    <button type="submit" class="btn btn-primary">Create User</button>
                </div>
            </form>
        </div>
    {/if}

    <!-- STATS -->
    <div class="stats-row">
        <div class="stat-card">
            <div class="stat-value">{data.users.length}</div>
            <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{data.users.filter(u => u.role === 'admin').length}</div>
            <div class="stat-label">Admins</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{data.users.filter(u => u.role === 'self').length}</div>
            <div class="stat-label">Owner</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{data.users.filter(u => u.role === 'editor').length}</div>
            <div class="stat-label">Editors</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{data.users.filter(u => u.role === 'viewer').length}</div>
            <div class="stat-label">Viewers</div>
        </div>
    </div>

    <!-- USERS TABLE -->
    <div class="card table-card">
        <div class="table-header">
            <h3 class="card-title" style="margin:0">All Users</h3>
            <span class="user-count">{data.users.length} accounts</span>
        </div>

        {#if data.users.length === 0}
            <div class="empty-state">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48" style="opacity:0.3; margin-bottom: 16px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>No users found.</p>
            </div>
        {:else}
            <div class="users-table">
                <div class="table-head">
                    <div class="th">User</div>
                    <div class="th">Role</div>
                    <div class="th hide-mobile">Joined</div>
                    <div class="th">Last Active</div>
                    <div class="th" style="text-align:right">Actions</div>
                </div>
                {#each data.users as user (user.id)}
                    <div class="table-row" transition:slide>
                        <div class="td user-cell">
                            <div class="user-avatar">{user.username[0].toUpperCase()}</div>
                            <div class="user-details" style="min-width:0; overflow:hidden;">
                                <span class="user-name-text" style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">{user.username}</span>
                                <span class="user-id">ID #{user.id}</span>
                            </div>
                        </div>
                        <div class="td">
                            <span class="role-badge {getRoleBadge(user.role)}">{user.role}</span>
                        </div>
                        <div class="td date-cell hide-mobile">{formatDate(user.created_at)}</div>
                        <div class="td date-cell" style="font-size: 0.8rem; white-space:nowrap;">{timeAgo(user.last_active)}</div>
                        <div class="td actions-cell">
                            <div class="dropdown-wrap">
                                <button class="dots-btn" onclick={(e) => toggleDropdown(user.id, e)} title="Options">⋮</button>
                                {#if activeDropdown === user.id}
                                    <div class="dropdown-menu" transition:fade={{duration: 100}}>
                                        <button class="dropdown-item" onclick={() => { resetModal = user; newPassword = ''; activeDropdown = null; }}>
                                            🔑 Reset Password
                                        </button>
                                        <div class="dropdown-divider"></div>
                                        <div class="dropdown-label">Change Role</div>
                                        {#each ['admin', 'self', 'editor', 'viewer'] as role}
                                            {#if role !== user.role}
                                                <form action="?/changeRole" method="POST" use:enhance>
                                                    <input type="hidden" name="id" value={user.id} />
                                                    <input type="hidden" name="role" value={role} />
                                                    <button type="submit" class="dropdown-item">→ {role}</button>
                                                </form>
                                            {/if}
                                        {/each}
                                        <div class="dropdown-divider"></div>
                                        <button class="dropdown-item danger-item" onclick={() => { deleteModal = user; activeDropdown = null; }}>
                                            🗑 Delete User
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

<!-- RESET PASSWORD MODAL -->
{#if resetModal}
    <div class="modal-overlay" onclick={() => resetModal = null} role="dialog" aria-modal="true">
        <div class="modal-card card" onclick={(e) => e.stopPropagation()}>
            <h3>Reset Password</h3>
            <p>Set a new password for <strong>{resetModal.username}</strong></p>
            <form action="?/resetPassword" method="POST" use:enhance={() => {
                return async ({ update }) => {
                    await update();
                    resetModal = null;
                    newPassword = '';
                };
            }}>
                <input type="hidden" name="id" value={resetModal.id} />
                <div class="form-group">
                    <label class="form-label" for="new-pw">New Password</label>
                    <input class="form-input" id="new-pw" type="password" name="newPassword" bind:value={newPassword} placeholder="Min. 6 characters" required />
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-ghost" onclick={() => resetModal = null}>Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Password</button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- DELETE MODAL -->
{#if deleteModal}
    <div class="modal-overlay" onclick={() => deleteModal = null} role="dialog" aria-modal="true">
        <div class="modal-card card" onclick={(e) => e.stopPropagation()}>
            <h3>Delete User</h3>
            <p>Are you sure you want to permanently delete <strong>{deleteModal.username}</strong>? This cannot be undone.</p>
            <form action="?/deleteUser" method="POST" use:enhance={() => {
                return async ({ update }) => {
                    await update();
                    deleteModal = null;
                };
            }}>
                <input type="hidden" name="id" value={deleteModal.id} />
                <div class="modal-actions">
                    <button type="button" class="btn btn-ghost" onclick={() => deleteModal = null}>Cancel</button>
                    <button type="submit" class="btn btn-danger">Delete</button>
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
        max-width: 960px;
        margin: 0 auto;
    }

    .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }

    .page-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0 0 4px 0;
    }

    .page-sub {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0;
    }

    /* Stats */
    .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
    }

    .stat-card {
        background: #15181e;
        border: 1px solid #262b36;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
    }
    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #60a5fa;
        line-height: 1;
        margin-bottom: 6px;
    }

    .stat-label {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    /* Create Form */
    .create-card {
        border-color: rgba(37, 99, 235, 0.3);
    }
    .create-form {
        margin-top: 16px;
    }

    .form-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 20px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    }

    .form-error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #f87171;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 0.875rem;
        margin-bottom: 16px;
    }

    .form-success {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: #34d399;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 0.875rem;
        margin-bottom: 16px;
    }

    /* Table */
    .table-card {
        padding: 0;
        overflow: visible;
    }

    .table-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid #262b36;
        border-radius: 12px 12px 0 0;
        overflow: hidden;
    }

    .user-count {
        font-size: 0.8rem;
        color: #64748b;
        background: #1e222a;
        padding: 4px 10px;
        border-radius: 20px;
    }

    .users-table {
        display: flex;
        flex-direction: column;
    }

    .table-head {
        display: grid;
        grid-template-columns: 1fr 100px 120px 160px 80px;
        padding: 10px 24px;
        border-bottom: 1px solid #1a1e26;
        background: #111318;
    }

    .th {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .table-row {
        display: grid;
        grid-template-columns: 1fr 100px 120px 160px 80px;
        align-items: center;
        padding: 14px 24px;
        border-bottom: 1px solid #1a1e26;
        transition: background 0.15s;
    }

    .table-row:last-child {
        border-bottom: none;
    }

    .table-row:hover {
        background: #111318;
    }

    .td {
        font-size: 0.9rem;
        color: #cbd5e1;
    }

    .user-cell {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.9rem;
        color: white;
        flex-shrink: 0;
    }

    .user-details {
        display: flex;
        flex-direction: column;
    }

    .user-name-text {
        font-weight: 600;
        color: #f1f5f9;
    }

    .user-id {
        font-size: 0.75rem;
        color: #475569;
    }

    .date-cell {
        font-size: 0.82rem;
        color: #64748b;
    }

    /* Role Badges */
    .role-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }

    .role-admin { background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
    .role-editor { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
    .role-viewer { background: rgba(100, 116, 139, 0.12); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.2); }
    .role-self { background: rgba(100, 116, 139, 0.12); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.2); }

    /* Actions */
    .actions-cell {
        display: flex;
        justify-content: flex-end;
    }

    .dropdown-wrap {
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
        border-radius: 10px;
        min-width: 180px;
        z-index: 50;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        padding: 4px;
    }

    .dropdown-item {
        display: block;
        width: 100%;
        text-align: left;
        padding: 9px 14px;
        background: transparent;
        border: none;
        color: #cbd5e1;
        font-family: inherit;
        font-size: 0.875rem;
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.15s;
    }

    .dropdown-item:hover {
        background: #262b36;
    }

    .danger-item {
        color: #f87171 !important;
    }

    .danger-item:hover {
        background: rgba(239, 68, 68, 0.1) !important;
    }

    .dropdown-divider {
        height: 1px;
        background: #262b36;
        margin: 4px 0;
    }

    .dropdown-label {
        padding: 4px 14px;
        font-size: 0.7rem;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
    }

    /* Buttons */
    .btn-ghost {
        background: transparent;
        color: #94a3b8;
        border: 1px solid #262b36;
        padding: 9px 18px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.9rem;
        transition: all 0.2s;
    }

    .btn-ghost:hover {
        background: #1e222a;
        color: #f1f5f9;
    }

    .btn-danger {
        background: #ef4444;
        color: white;
        border: none;
        padding: 9px 18px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.9rem;
        transition: all 0.2s;
    }

    .btn-danger:hover {
        background: #dc2626;
    }

    /* Empty */
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 0;
        color: #64748b;
        font-size: 0.95rem;
    }

    /* Modals */
    .modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.65);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }

    .modal-card {
        width: 100%;
        max-width: 420px;
        padding: 28px;
        background: #111318;
    }

    .modal-card h3 {
        margin: 0 0 8px 0;
        color: #f8fafc;
        font-size: 1.2rem;
    }

    .modal-card p {
        color: #94a3b8;
        margin-bottom: 24px;
        line-height: 1.5;
        font-size: 0.9rem;
    }

    .modal-card strong {
        color: #f1f5f9;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 20px;
    }

    /* Responsive */
    @media (max-width: 700px) {
        .stats-row { grid-template-columns: repeat(2, 1fr); }
        .form-row { grid-template-columns: 1fr; }
        .table-head, .table-row { grid-template-columns: 1fr 70px 80px 40px; gap: 8px; }
        .hide-mobile { display: none !important; }
        .th { font-size: 0.65rem; }
    }
</style>
