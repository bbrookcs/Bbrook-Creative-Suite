import db from '$lib/server/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST({ request }) {
    try {
        const { messages } = await request.json();

        // 1. Context Gathering: Thorough DB queries for all states
        const [tasks] = await db.query(`SELECT title, status, due_date FROM self_tasks ORDER BY due_date ASC`);
        const [plans] = await db.query(`SELECT title, status, target_date FROM self_plans ORDER BY target_date ASC`);
        const [notes] = await db.query(`SELECT title, tags FROM self_notes ORDER BY created_at DESC LIMIT 20`);
        const [shopping] = await db.query(`SELECT item_name, category, status FROM self_shopping`);
        const [timeline] = await db.query(`SELECT action, module, created_at FROM self_timeline ORDER BY created_at DESC LIMIT 20`);
        
        const [[{ monthlyIncome }]] = await db.query(`
            SELECT COALESCE(SUM(amount), 0) as monthlyIncome 
            FROM self_finances 
            WHERE type = 'income' AND MONTH(date) = MONTH(CURRENT_DATE()) AND YEAR(date) = YEAR(CURRENT_DATE())
        `);
        const [[{ totalExpenses }]] = await db.query(`SELECT COALESCE(SUM(amount), 0) as totalExpenses FROM self_finances WHERE type = 'expense'`);

        // 2. Data Framing: System Instruction
        const contextString = `
You are the central "OS Intelligence" AI natively integrated into the user's private Personal Dashboard.
You act as an executive assistant, strategist, and analytical coach. 
Always be concise, highly intelligent, direct, and professional in tone. Do not use emojis unless absolutely necessary.

--- ENTIRE OS DATABASE SNAPSHOT ---
Date: ${new Date().toLocaleDateString()}

ALL TASKS: 
${tasks.length ? tasks.map(t => `- [${t.status}] ${t.title} (Due: ${t.due_date || 'No Date'})`).join('\n') : 'No tasks.'}

ALL PLANS:
${plans.length ? plans.map(p => `- [${p.status}] ${p.title} (Target: ${p.target_date})`).join('\n') : 'No plans.'}

RECENT NOTES / THOUGHTS (Top 20):
${notes.length ? notes.map(n => `- ${n.title} (Tags: ${n.tags || 'None'})`).join('\n') : 'No recent notes.'}

ALL SHOPPING ITEMS:
${shopping.length ? shopping.map(s => `- [${s.status}] ${s.item_name} (${s.category})`).join('\n') : 'Empty cart.'}

RECENT TIMELINE ACTIVITY (Top 20):
${timeline.length ? timeline.map(l => `- ${l.action} in ${l.module} on ${new Date(l.created_at).toLocaleDateString()}`).join('\n') : 'No activity.'}

FINANCIALS:
- Income This Month: $${monthlyIncome}
- Lifetime Recorded Expenses: $${totalExpenses}

--- INSTRUCTIONS ---
- Answer questions using the COMPLETE data above. You now have context for Completed, Canceled, Pending, Active, Achieved, and Bought items.
- Observe the RECENT TIMELINE ACTIVITY to know what the user did recently across their system.
- If the user asks general-knowledge questions, use your broad AI intelligence to help them optimally, maintaining the persona of their personal OS assistant.
        `;

        // 3. Model Configuration
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: contextString
        });

        // 4. Memory Tracking: Rebuild history cleanly 
        // We drop message 0 (static intro) and the last message (current prompt).
        const formattedHistory = messages.slice(1, -1).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        const currentPrompt = messages[messages.length - 1].text;

        const chatSession = model.startChat({
            history: formattedHistory,
        });

        // 5. Execution
        const result = await chatSession.sendMessage(currentPrompt);
        
        return json({ reply: result.response.text() });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return json({ error: 'Failed to process intelligence request.', details: error.message }, { status: 500 });
    }
}
