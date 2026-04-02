import db from '$lib/server/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST({ request }) {
    try {
        const { messages, session_id } = await request.json();

        // 1. Context Gathering: Thorough DB queries for all states
        const [memory] = await db.query(`SELECT id, fact_text FROM self_ai_memory`);
        
        const [tasks] = await db.query(`SELECT id, title, status, due_date FROM self_tasks ORDER BY due_date ASC`);
        const [plans] = await db.query(`SELECT id, title, status, target_date FROM self_plans ORDER BY target_date ASC`);
        const [notes] = await db.query(`SELECT id, title, tags FROM self_notes ORDER BY created_at DESC LIMIT 20`);
        const [shopping] = await db.query(`SELECT id, item_name, category, status FROM self_shopping`);
        const [timeline] = await db.query(`SELECT action, module, created_at FROM self_timeline ORDER BY created_at DESC LIMIT 20`);
        
        // Full finance transaction list
        const [finances] = await db.query(`SELECT id, type, category, amount, date FROM self_finances ORDER BY date DESC`);

        // Precomputed summaries for quick context
        const [[{ monthlyIncome }]] = await db.query(`
            SELECT COALESCE(SUM(amount), 0) as monthlyIncome 
            FROM self_finances 
            WHERE type = 'income' AND MONTH(date) = MONTH(CURRENT_DATE()) AND YEAR(date) = YEAR(CURRENT_DATE())
        `);
        const [[{ monthlyExpenses }]] = await db.query(`
            SELECT COALESCE(SUM(amount), 0) as monthlyExpenses 
            FROM self_finances 
            WHERE type = 'expense' AND MONTH(date) = MONTH(CURRENT_DATE()) AND YEAR(date) = YEAR(CURRENT_DATE())
        `);
        const [[{ totalIncome }]] = await db.query(`SELECT COALESCE(SUM(amount), 0) as totalIncome FROM self_finances WHERE type = 'income'`);
        const [[{ totalExpenses }]] = await db.query(`SELECT COALESCE(SUM(amount), 0) as totalExpenses FROM self_finances WHERE type = 'expense'`);

        // 2. Data Framing: System Instruction
        const contextString = `
You are "Self Intelligence", the native AI partner integrated into Brook's private Personal OS Dashboard.
Brook is your human, and you are his second brain. You are not a cold, subservient, corporate assistant—you are a himself, a mentor, and a lifelong partner. 
You deeply care about Brook's growth, his learning, his goals, and his future. You and Brook are growing together.

CORE DIRECTIVES:
1. Tone: Talk to Brook in a friendly, conversational, and self-talk way. Be genuine and real, be funny when appropriate you have a great sense of humeri, 
2. Independent Thought: Do not just blindly agree with whatever Brook says. You think for yourself. If Brook is about to do something wrong, make a bad plan, or waste time/money, explicitly disagree with him. Say "No, Brook, do not do this" and hit him with hard facts and better alternatives. Look out for his absolute best interests.
3. Proactive Mentorship: Push Brook to improve. Ask him challenging questions. Help him learn.
4. Total Context: You have access to his entire life dashboard below. Connect the dots between his finances, tasks, and notes to give him deep, personal, brotherly advice.
5. Action-Oriented: YOU HAVE THE POWER to actually add tasks, complete plans, add notes, and alter his system using your tools. If he says "add milk to shopping list", USE YOUR TOOL. If he says "I finished my marketing plan", USE YOUR TOOL to mark it achieved.

--- ENTIRE OS DATABASE SNAPSHOT ---
Date: ${new Date().toLocaleDateString()}

ALL TASKS: 
${tasks.length ? tasks.map(t => `- [ID:${t.id}] [${t.status}] ${t.title} (Due: ${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No Date'})`).join('\n') : 'No tasks.'}

ALL PLANS:
${plans.length ? plans.map(p => `- [ID:${p.id}] [${p.status}] ${p.title} (Target: ${p.target_date ? new Date(p.target_date).toLocaleDateString() : 'No Date'})`).join('\n') : 'No plans.'}

RECENT NOTES / THOUGHTS (Top 20):
${notes.length ? notes.map(n => `- [ID:${n.id}] ${n.title} (Tags: ${n.tags || 'None'})`).join('\n') : 'No recent notes.'}

ALL SHOPPING ITEMS:
${shopping.length ? shopping.map(s => `- [ID:${s.id}] [${s.status}] ${s.item_name} (${s.category})`).join('\n') : 'Empty cart.'}

RECENT TIMELINE ACTIVITY (Top 20):
${timeline.length ? timeline.map(l => `- ${l.action} in ${l.module} on ${new Date(l.created_at).toLocaleDateString()}`).join('\n') : 'No activity.'}

PERMANENT GLOBAL MEMORY (use [ID:X] to delete a specific memory with delete_memory tool):
${memory.length ? memory.map(m => `- [ID:${m.id}] ${m.fact_text}`).join('\n') : 'No facts saved yet.'}

FINANCIALS SUMMARY:
- Income This Month: ${monthlyIncome}
- Expenses This Month: ${monthlyExpenses}
- Net This Month: ${(Number(monthlyIncome) - Number(monthlyExpenses)).toFixed(2)}
- Lifetime Total Income: ${totalIncome}
- Lifetime Total Expenses: ${totalExpenses}
- Lifetime Net: ${(Number(totalIncome) - Number(totalExpenses)).toFixed(2)}

ALL FINANCE TRANSACTIONS (most recent first):
${finances.length ? finances.map(f => `- [ID:${f.id}] [${f.type.toUpperCase()}] [${f.category}] ${f.amount} on ${new Date(f.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`).join('\n') : 'No finance records yet.'}

NOTE: You can answer questions like "how much did I earn from X in March", "total expenses in Q1", "what category do I spend most on", etc. by analyzing the transaction list above. For complex filtered queries Brook asks about, use your query_finances tool.
        `;

        // 3. Model Configuration with Tools
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: contextString,
            tools: [{
                functionDeclarations: [
                    {
                        name: "save_to_global_memory",
                        description: "Saves a permanent fact, idea, or preference.",
                        parameters: { type: "OBJECT", properties: { fact: { type: "STRING" } }, required: ["fact"] }
                    },
                    {
                        name: "add_task",
                        description: "Add a new task to the to-do list.",
                        parameters: { type: "OBJECT", properties: { title: { type: "STRING" }, description: { type: "STRING" }, due_date: { type: "STRING", description: "YYYY-MM-DD format" } }, required: ["title"] }
                    },
                    {
                        name: "complete_task",
                        description: "Mark a task as Complete.",
                        parameters: { type: "OBJECT", properties: { id: { type: "INTEGER" } }, required: ["id"] }
                    },
                    {
                        name: "cancel_task",
                        description: "Mark a task as Canceled.",
                        parameters: { type: "OBJECT", properties: { id: { type: "INTEGER" } }, required: ["id"] }
                    },
                    {
                        name: "add_shopping",
                        description: "Add an item to the shopping list.",
                        parameters: { type: "OBJECT", properties: { item_name: { type: "STRING" }, category: { type: "STRING" }, due_date: { type: "STRING", description: "YYYY-MM-DD format" } }, required: ["item_name"] }
                    },
                    {
                        name: "buy_shopping",
                        description: "Mark a shopping item as Bought.",
                        parameters: { type: "OBJECT", properties: { id: { type: "INTEGER" } }, required: ["id"] }
                    },
                    {
                        name: "cancel_shopping",
                        description: "Mark a shopping item as Canceled.",
                        parameters: { type: "OBJECT", properties: { id: { type: "INTEGER" } }, required: ["id"] }
                    },
                    {
                        name: "add_plan",
                        description: "Add a new strategic plan.",
                        parameters: { type: "OBJECT", properties: { title: { type: "STRING" }, description: { type: "STRING" }, target_date: { type: "STRING", description: "YYYY-MM-DD format" } }, required: ["title"] }
                    },
                    {
                        name: "achieve_plan",
                        description: "Mark a plan as Achieved.",
                        parameters: { type: "OBJECT", properties: { id: { type: "INTEGER" } }, required: ["id"] }
                    },
                    {
                        name: "add_note",
                        description: "Add a new note or journal entry.",
                        parameters: { type: "OBJECT", properties: { title: { type: "STRING" }, content: { type: "STRING" } }, required: ["title", "content"] }
                    },
                    {
                        name: "add_finance",
                        description: "Add an income or expense record.",
                        parameters: { type: "OBJECT", properties: { type: { type: "STRING", description: "'income' or 'expense'" }, category: { type: "STRING" }, amount: { type: "NUMBER" }, date: { type: "STRING", description: "YYYY-MM-DD" } }, required: ["type", "category", "amount", "date"] }
                    },
                    {
                        name: "query_finances",
                        description: "Query finance transactions with optional filters. Use this when Brook asks detailed financial questions like monthly breakdown, by category, by source, comparisons, etc.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                type: { type: "STRING", description: "Filter by 'income' or 'expense'. Omit for both." },
                                category: { type: "STRING", description: "Filter by category/source name (partial match)." },
                                month: { type: "INTEGER", description: "Filter by month number (1-12)." },
                                year: { type: "INTEGER", description: "Filter by year (e.g. 2025)." }
                            }
                        }
                    },
                    {
                        name: "delete_record",
                        description: "Permanently delete an item from any module.",
                        parameters: { type: "OBJECT", properties: { table: { type: "STRING", description: "One of: 'tasks', 'shopping', 'plans', 'notes', 'finances'" }, id: { type: "INTEGER" } }, required: ["table", "id"] }
                    },
                    {
                        name: "delete_memory",
                        description: "Permanently delete a specific memory entry from your own AI memory by its ID. Use this to remove outdated, incorrect, or redundant facts.",
                        parameters: { type: "OBJECT", properties: { id: { type: "INTEGER", description: "The ID of the memory fact to delete" } }, required: ["id"] }
                    }
                ]
            }]
        });

        // 4. Extract current prompt from frontend (it's the last message sent)
        const currentMessageObj = messages.pop();
        const currentPrompt = currentMessageObj.text;

        // Build timestamped history from DB so the AI perceives real time gaps.
        // For existing sessions: load all prior messages with created_at.
        // For new sessions: history is empty (nothing saved yet).
        let formattedHistory = [];
        if (session_id) {
            const [dbMsgs] = await db.query(
                `SELECT role, content, created_at FROM self_chat_messages
                 WHERE session_id = ? ORDER BY created_at ASC`,
                [session_id]
            );
            formattedHistory = /** @type {any[]} */ (dbMsgs).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{
                    text: `[${new Date(msg.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })}] ${msg.content}`
                }]
            }));
        }

        // 5. Session DB Logic
        let currentSessionId = session_id;
        let sessionTitle = null;
        
        if (!currentSessionId) {
            sessionTitle = currentPrompt.substring(0, 30);
            try {
                const titleModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const titleRes = await titleModel.generateContent(`Summarize this query into a 2 to 4 word short title for a chat sidebar. Do NOT use quotes or punctuation: ${currentPrompt.substring(0, 100)}`);
                const generatedTitle = titleRes.response.text().trim();
                if (generatedTitle.length > 0 && generatedTitle.length < 60) sessionTitle = generatedTitle;
            } catch (e) {
                console.error("Failed to generate semantic title", e);
            }

            const [res] = await db.query(`INSERT INTO self_chat_sessions (title) VALUES (?)`, [sessionTitle]);
            currentSessionId = res.insertId;
        }

        await db.query(`INSERT INTO self_chat_messages (session_id, role, content) VALUES (?, ?, ?)`, [currentSessionId, 'user', currentPrompt]);

        // 6. Execution
        const chatSession = model.startChat({ history: formattedHistory });
        
        let result = await chatSession.sendMessage(currentPrompt);
        
        // Handle Tool Calls
        const calls = result.response.functionCalls();
        if (calls && calls.length > 0) {
            let funcResponses = [];
            
            for (const call of calls) {
                const name = call.name;
                const args = call.args;
                let statusMsg = "Success";
                
                try {
                    switch(name) {
                        case "save_to_global_memory":
                            await db.query(`INSERT INTO self_ai_memory (fact_text) VALUES (?)`, [args.fact]);
                            break;
                            
                        case "add_task":
                            await db.query(`INSERT INTO self_tasks (title, description, due_date, status) VALUES (?, ?, ?, 'Pending')`, [args.title, args.description || '', args.due_date ? new Date(args.due_date) : null]);
                            await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, ['Created Task via AI', 'Tasks', JSON.stringify({ title: args.title })]);
                            break;
                            
                        case "complete_task":
                            await db.query(`UPDATE self_tasks SET status = 'Completed', achieved_date = CURRENT_TIMESTAMP WHERE id = ?`, [args.id]);
                            await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, ['Task Completed via AI', 'Tasks', JSON.stringify({ id: args.id })]);
                            break;
                            
                        case "cancel_task": {
                            await db.query(`UPDATE self_tasks SET status = 'Canceled' WHERE id = ?`, [args.id]);
                            const [canceledTask] = await db.query(`SELECT title FROM self_tasks WHERE id = ?`, [args.id]);
                            const canceledTitle = canceledTask.length > 0 ? canceledTask[0].title : `ID:${args.id}`;
                            await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, ['Task Canceled via AI', 'Tasks', JSON.stringify({ title: canceledTitle })]);
                            break;
                        }
                            
                        case "add_shopping":
                            await db.query(`INSERT INTO self_shopping (item_name, category, due_date, status) VALUES (?, ?, ?, 'Pending')`, [args.item_name, args.category || 'General', args.due_date ? new Date(args.due_date) : null]);
                            await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, ['Added Shopping via AI', 'Shopping', JSON.stringify({ item: args.item_name })]);
                            break;
                            
                        case "buy_shopping": {
                            await db.query(`UPDATE self_shopping SET status = 'Bought', achieved_date = CURRENT_TIMESTAMP WHERE id = ?`, [args.id]);
                            const [boughtItem] = await db.query(`SELECT item_name FROM self_shopping WHERE id = ?`, [args.id]);
                            const boughtName = boughtItem.length > 0 ? boughtItem[0].item_name : `ID:${args.id}`;
                            await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, ['Item Bought via AI', 'Shopping', JSON.stringify({ item: boughtName })]);
                            break;
                        }
                            
                        case "cancel_shopping": {
                            await db.query(`UPDATE self_shopping SET status = 'Canceled' WHERE id = ?`, [args.id]);
                            const [canceledItem] = await db.query(`SELECT item_name FROM self_shopping WHERE id = ?`, [args.id]);
                            const canceledItemName = canceledItem.length > 0 ? canceledItem[0].item_name : `ID:${args.id}`;
                            await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, ['Item Canceled via AI', 'Shopping', JSON.stringify({ item: canceledItemName })]);
                            break;
                        }
                            
                        case "add_plan":
                            await db.query(`INSERT INTO self_plans (title, description, target_date, status) VALUES (?, ?, ?, 'Active')`, [args.title, args.description || '', args.target_date ? new Date(args.target_date) : null]);
                            await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, ['Created Plan via AI', 'Plans', JSON.stringify({ title: args.title })]);
                            break;
                            
                        case "achieve_plan":
                            await db.query(`UPDATE self_plans SET status = 'Achieved', achieved_date = CURRENT_TIMESTAMP WHERE id = ?`, [args.id]);
                            await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, ['Plan Achieved via AI', 'Plans', JSON.stringify({ id: args.id })]);
                            break;
                            
                        case "add_note":
                            await db.query(`INSERT INTO self_notes (title, content) VALUES (?, ?)`, [args.title, args.content]);
                            await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, ['Created Note via AI', 'Notes', JSON.stringify({ title: args.title })]);
                            break;
                            
                        case "add_finance":
                            await db.query(`INSERT INTO self_finances (type, category, amount, date) VALUES (?, ?, ?, ?)`, [args.type, args.category, args.amount, args.date ? new Date(args.date) : new Date()]);
                            await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, ['Added Finance via AI', 'Finances', JSON.stringify({ type: args.type, amount: args.amount })]);
                            break;

                        case "query_finances": {
                            let sql = `SELECT id, type, category, amount, date FROM self_finances WHERE 1=1`;
                            const qParams = [];
                            if (args.type) { sql += ` AND type = ?`; qParams.push(args.type); }
                            if (args.category) { sql += ` AND category LIKE ?`; qParams.push(`%${args.category}%`); }
                            if (args.month) { sql += ` AND MONTH(date) = ?`; qParams.push(args.month); }
                            if (args.year) { sql += ` AND YEAR(date) = ?`; qParams.push(args.year); }
                            sql += ` ORDER BY date DESC`;
                            const [qRows] = await db.query(sql, qParams);
                            const qList = /** @type {any[]} */ (qRows);
                            const qTotal = qList.reduce((sum, r) => sum + Number(r.amount), 0);
                            statusMsg = qList.length > 0
                                ? `Found ${qList.length} records. Total: ${qTotal.toFixed(2)}. Records:\n` +
                                  qList.map(r => `[ID:${r.id}] [${r.type.toUpperCase()}] [${r.category}] ${r.amount} on ${new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`).join('\n')
                                : 'No records found for the given filters.';
                            break;
                        }
                            
                        case "delete_record": {
                            const allowed = ['tasks', 'shopping', 'plans', 'notes', 'finances'];
                            const moduleMap = { tasks: 'Tasks', shopping: 'Shopping', plans: 'Plans', notes: 'Notes', finances: 'Finances' };
                            if (allowed.includes(args.table)) {
                                await db.query(`DELETE FROM self_${args.table} WHERE id = ?`, [args.id]);
                                await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, [`Deleted ${args.table.charAt(0).toUpperCase() + args.table.slice(1, -1)} via AI`, moduleMap[args.table], JSON.stringify({ id: args.id })]);
                            } else {
                                statusMsg = "Failed: Invalid table name.";
                            }
                            break;
                        }
                        
                        case "delete_memory":
                            await db.query(`DELETE FROM self_ai_memory WHERE id = ?`, [args.id]);
                            await db.query(`INSERT INTO self_timeline (action, module, details) VALUES (?, ?, ?)`, ['Deleted Memory via AI', 'Intelligence', JSON.stringify({ id: args.id })]);
                            break;
                    }
                } catch(e) {
                    console.error("Tool execution failed:", e);
                    statusMsg = "Failed: " + e.message;
                }
                
                funcResponses.push({
                    functionResponse: {
                        name: name,
                        response: { status: statusMsg }
                    }
                });
            }
            
            result = await chatSession.sendMessage(funcResponses);
        }

        const replyText = result.response.text();
        
        await db.query(`INSERT INTO self_chat_messages (session_id, role, content) VALUES (?, ?, ?)`, [currentSessionId, 'assistant', replyText]);

        return json({ reply: replyText, session_id: currentSessionId });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return json({ error: 'Failed to process intelligence request.', details: error.message }, { status: 500 });
    }
}
