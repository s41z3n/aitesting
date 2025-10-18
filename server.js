import {systemPrompt, userPrompt, GenerateCategory} from './prompts.js';

import express from 'express';
import axios from 'axios';
const app = express();

app.use(express.json());

// Replace with your Groq API key
const GROQ_API_KEY = process.env.GROQ_API_KEY;


// Generate a secret word/object for guessing
app.post('/api/generate', async (req, res) => {
    let dynamicUserPrompt = GenerateCategory() + userPrompt;
    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [
                     {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: dynamicUserPrompt
                    }
                ],
                temperature: 1.5,
                max_tokens: 30
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const secret = response.data.choices[0].message.content.trim();
        console.log(response)
        res.json(response)
        //res.json({ secret: secret, category: category, public_hints: public_hints[7], private_hints: private_hints[4] || 'error' });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to generate secret' });
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