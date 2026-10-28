import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain"; 
import { tool } from "@langchain/core/tools";
import { getJson } from "serpapi";
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


// Tool B: Web Search (SerpAPI using Bing)
const searchWebTool = tool(
    async ({ query }) => {
console.log(`🌐 [WEB SEARCH] Searching for: ${query}`);
try{
     const response = await getJson({
        engine: "bing",
        q: query,
        api_key: process.env.SERPAPI_API_KEY,
     });
           // Extract the top 3 results to give to the AI
 if(response.organic_results && response.organic_results.length > 0){
        const topResults = response.organic_results.slice(0, 3).map((r) => {
          return `Title: ${r.title}\nSnippet: ${r.snippet}`;
        }).join("\n\n");
        return topResults;
    }
      return "No search results found.";
    } catch (error) {
      console.error("SerpAPI Error:", error);
      return "Failed to search the web.";
    }
  },
     {
    name: "search_web",
    description: "Useful for answering questions about current events, nutrition facts, recipes, or anything not on the restaurant menu.",
    schema: z.object({
      query: z.string().describe("The search query to look up on the web"),
    }),
  }
);
  

// 3. Create the Agent
const agent = createAgent({
  model: model,
  tools: [getMenuTool, searchWebTool],
  systemPrompt: `You are a helpful restaurant assistant. 
  RULE 1: If the user asks what is on the menu (breakfast, lunch, dinner), use the get_menu tool.
  RULE 2: If the user asks for calories, nutrition, recipes, or general facts, you MUST use the search_web tool. 
  Never say "I don't know" or "check the menu" if you haven't used the search_web tool yet.`,
});

// 4. Chat Endpoint (UNCOMMENTED)
app.post("/api/chat", async (req, res) => {
  console.log("\n-----------------------------------------");
  console.log("🔥 [NEW REQUEST] Browser sent a message!");
  
  try {
    const { message } = req.body;
    console.log("📩 User asked:", message);

    const result = await agent.invoke({
      messages: [{ role: "user", content: message }],
    });

    const aiReply = result.messages[result.messages.length - 1].content;
    
    console.log("✅ AI replied:", aiReply);
    console.log("-----------------------------------------\n");
    
    res.json({ reply: aiReply });
  } catch (error) {
    console.error("❌ [AGENT ERROR]:", error); 
    res.status(500).json({ reply: "Something went wrong." });
  }
});


const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});