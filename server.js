import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain"; 
import { tool } from "@langchain/core/tools";
import { z } from "zod";

dotenv.config();

const app = express();

// Required to read JSON from the frontend
app.use(express.json()); 

// Setup static folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// 1. Setup Ollama
const model = new ChatOllama({
  model: "llama3.2",
  temperature: 0,
});

// 2. Create the Menu Tool
const getMenuTool = tool(
  async ({ category, day }) => {
    const menu = {
      breakfast: {
        today: "Pancakes with maple syrup",
        tomorrow: "Omelette with toast",
        yesterday: "French toast with berries",
      },
      lunch: {
        today: "Grilled chicken salad",
        tomorrow: "Turkey sandwich with chips",
        yesterday: "Veggie wrap with hummus",
      },
      dinner: {
        today: "Spaghetti Bolognese",
        tomorrow: "Grilled salmon with vegetables",
        yesterday: "Beef stir-fry with rice",
      },
    };

    const categoryMenu = menu[category.toLowerCase()];
    if (!categoryMenu) return "Invalid category.";
    
    return categoryMenu[day] || "Menu not available for the given category and day.";
  },
  {
    name: "get_menu",
    description: "Return the final answer for today's menu. Use this tool directly to answer the user's menu question.",
    schema: z.object({
      category: z.string().describe("Type of food: 'breakfast', 'lunch', 'dinner'"),
      day: z.enum(["today", "tomorrow", "yesterday"]),
    }),
  }
);

// 3. Create the Agent
const agent = createAgent({
  model: model,
  tools: [getMenuTool],
systemPrompt: "You are a helpful restaurant assistant. If the user says hello or makes small talk, answer them politely. If they ask about the menu, use the get_menu tool. Keep answers short."});

// 4. Chat Endpoint (UNCOMMENTED)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    console.log("User asked:", message);

    const result = await agent.invoke({
      messages: [{ role: "user", content: message }],
    });

    const aiReply = result.messages[result.messages.length - 1].content;
    console.log("AI replied:", aiReply);

    res.json({ reply: aiReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World! fizza ====")
})
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});