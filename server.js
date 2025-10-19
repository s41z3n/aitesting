import { systemPrompt, userPrompt, GenerateCategory } from './prompts.js';
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY not set!");
    process.exit(1);
}

app.post('/api/generate', async (req, res) => {
    let apiResponse = null;  // ✅ Declare outside try block
    
    try {
        const category = GenerateCategory();
        console.log("\n🎲 Category:", category);
        
        apiResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt + category }
                ],
                temperature: 1.3,
                max_tokens: 200
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        let raw = apiResponse.data.choices[0].message.content.trim();
        console.log("📥 Raw:", raw);
        
        // ✅ AGGRESSIVE CLEANING
        raw = raw
            .replace(/```json|```/g, '')  // Remove markdown
            .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas before } or ]
            .trim();
        
        // Extract JSON only
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}') + 1;
        if (start >= 0 && end > start) {
            raw = raw.substring(start, end);
        }
        
        console.log("🧹 Cleaned:", raw);
        
        // ✅ SAFE JSON PARSE
        let data;
        try {
            data = JSON.parse(raw);
        } catch (jsonError) {
            console.error("❌ JSON Parse Error:", jsonError.message);
            console.error("Attempted to parse:", raw);
            
            // Return error but keep server running
            return res.status(500).json({ 
                error: 'AI returned invalid JSON',
                details: jsonError.message,
                raw: raw.substring(0, 200)  // First 200 chars for debugging
            });
        }
        
        // ✅ VALIDATE STRUCTURE
        if (!data.word || !data.category) {
            throw new Error('Missing word or category');
        }
        
        if (!Array.isArray(data.public_hints)) {
            throw new Error('public_hints must be an array');
        }
        
        if (!Array.isArray(data.private_hints)) {
            throw new Error('private_hints must be an array');
        }
        
        // ✅ FIX HINT COUNTS
        while (data.public_hints.length < 7) {
            data.public_hints.push("Keep trying!");
        }
        if (data.public_hints.length > 7) {
            data.public_hints = data.public_hints.slice(0, 7);
        }
        
        while (data.private_hints.length < 4) {
            data.private_hints.push("You're close!");
        }
        if (data.private_hints.length > 4) {
            data.private_hints = data.private_hints.slice(0, 4);
        }
        
        console.log("✅ Valid! Word:", data.word);
        console.log("   Public hints:", data.public_hints.length);
        console.log("   Private hints:", data.private_hints.length);
        
        // ✅ SEND RESPONSE
        res.json({
            category: data.category,
            word: data.word,
            public_hints: data.public_hints,
            private_hints: data.private_hints
        });
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        
        // ✅ SAFELY LOG API RESPONSE IF IT EXISTS
        if (apiResponse && apiResponse.data) {
            console.error("API Response:", apiResponse.data.choices[0].message.content.substring(0, 200));
        }
        
        // ✅ KEEP SERVER RUNNING
        res.status(500).json({ 
            error: 'Failed to generate word',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ✅ HEALTH CHECK
app.get('/', (req, res) => {
    res.json({ 
        status: 'Server is running!',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ✅ CATCH ALL ERRORS (PREVENT CRASHES)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ✅ HANDLE UNCAUGHT ERRORS (LAST RESORT)
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    // Don't exit, just log
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit, just log
});
