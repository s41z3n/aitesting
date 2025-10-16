const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Replace with your Groq API key
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Generate a secret word/object for guessing
app.post('/api/generate', async (req, res) => {
    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a game host. Generate ONE random object, animal, or concept for players to guess. Respond with ONLY the word, nothing else.'
                    },
                    {
                        role: 'user',
                        content: 'Generate a random thing to guess'
                    }
                ],
                temperature: 1.2,
                max_tokens: 20
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const secret = response.data.choices[0].message.content.trim();
        res.json({ secret: secret });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to generate secret' });
    }
});

// Evaluate a player's guess
app.post('/api/evaluate', async (req, res) => {
    const { secret, guess } = req.body;

    if (!secret || !guess) {
        return res.status(400).json({ error: 'Missing secret or guess' });
    }

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'You are evaluating guesses in a guessing game. The secret word is "' + secret + '". Respond in this format:\nCORRECT: true/false\nHINT: [short helpful hint if wrong]'
                    },
                    {
                        role: 'user',
                        content: 'Player guessed: ' + guess
                    }
                ],
                temperature: 0.7,
                max_tokens: 100
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = response.data.choices[0].message.content;
        const isCorrect = result.toLowerCase().includes('correct: true');
        const hintMatch = result.match(/HINT: (.+)/i);
        const hint = hintMatch ? hintMatch[1].trim() : 'Try thinking differently!';

        res.json({ 
            correct: isCorrect,
            hint: hint,
            rawResponse: result
        });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to evaluate guess' });
    }
});

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'Server is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});