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
        
        
        // 1. Extract the raw JSON string from the Groq API response
        const rawJsonString = response.data.choices[0].message.content.trim();
        
        console.log("--- RAW AI OUTPUT START ---");
        console.log(rawJsonString);
        console.log("--- RAW AI OUTPUT END ---");

        // 2. Parse the JSON string into a JavaScript object
        const groqData = JSON.parse(rawJsonString);

        // 3. Map the data to the format your Roblox client expects
        const finalClientResponse = {
            category: groqData.category,
            word: groqData.word,
            public_hints: groqData.public_hints,
            private_hints: groqData.private_hints,
        };
        
        // 4. Send the clean data back to the client
        res.json(finalClientResponse);

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