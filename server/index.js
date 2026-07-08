import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
import groq from "./services/ai.js";

const app = express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send('api is running')
})

app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;


        if (!messages || messages.length === 0) {
            return res.status(400).json({
                error: "Messages are required",
            });
        }


        const stream = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            stream: true,
            messages: messages,
        });
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");

        for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content !== undefined) {
                res.write(content);
            }
        }
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Something went wrong.",
        });
    }
});

// app.post("/api/chat", (req, res) => {
//     const { message } = req.body
//     res.json({
//         message: 'message sent successfully!',
//         data: message
//     });
// })

app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`)
})