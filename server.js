import { systemPrompt, userPrompt, GenerateCategory } from './prompts.js';
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post('/api/generate', async (req, res) => {
    const category = GenerateCategory();
    const dynamicUserPrompt = userPrompt + category;
    
    console.log("🎲 Selected category:", category);
    
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
                temperature: 1,
                max_tokens: 200  // Increased for full JSON response
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        let rawJsonString = response.data.choices[0].message.content.trim();
        
        console.log("--- RAW AI OUTPUT START ---");
        console.log(rawJsonString);
        console.log("--- RAW AI OUTPUT END ---");
        
        // Clean markdown formatting
        rawJsonString = rawJsonString
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
        
        console.log("--- CLEANED OUTPUT ---");
        console.log(rawJsonString);
        
        // Parse JSON
        const groqData = JSON.parse(rawJsonString);
        
        // Validate structure
        if (!groqData.word || !groqData.category || !groqData.public_hints || !groqData.private_hints) {
            throw new Error('Missing required fields in AI response');
        }
        
        if (!Array.isArray(groqData.public_hints) || groqData.public_hints.length !== 7) {
            console.warn('⚠️ Expected 7 public hints, got', groqData.public_hints.length);
        }
        
        if (!Array.isArray(groqData.private_hints) || groqData.private_hints.length !== 4) {
            console.warn('⚠️ Expected 4 private hints, got', groqData.private_hints.length);
        }
        
        const finalClientResponse = {
            category: groqData.category,
            word: groqData.word,
            public_hints: groqData.public_hints,
            private_hints: groqData.private_hints,
        };
        
        console.log("✅ Sending response to client");
        res.json(finalClientResponse);
        
    } catch (parseError) {
        console.error('❌ Error:', parseError.message);
        if (response && response.data) {
            console.error('Raw API response:', response.data.choices[0].message.content);
        }
        res.status(500).json({ 
            error: 'Failed to generate word', 
            details: parseError.message 
        });
    }
});

app.get('/', (req, res) => {
    res.json({ status: 'Server is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});