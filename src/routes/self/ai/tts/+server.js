import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    try {
        const { text, voice } = await request.json();

        if (!text) {
            return json({ error: 'Text is required' }, { status: 400 });
        }

        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: text,
                voice: voice || 'echo' // Voices available: alloy, echo, nova,
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("OpenAI Error Response:", error);
            return json({ error: error.error?.message || 'Failed to generate audio' }, { status: response.status });
        }

        const audioBuffer = await response.arrayBuffer();
        
        return new Response(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg'
            }
        });
    } catch (error) {
        console.error('TTS Error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
