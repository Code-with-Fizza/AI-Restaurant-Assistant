# 🍽️ Smart Restaurant Assistant

![Smart Restaurant Assistant Screenshot](images/screenshot.png)

A full-stack, locally-run AI chatbot that answers questions about a restaurant's menu. It uses a tool-calling agent to look up specific menu items based on the user's requested meal (breakfast, lunch, dinner) and day (today, tomorrow, yesterday).

The entire application runs 100% locally on your machine—no API keys, no VPNs, and zero cost.

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (Chat interface)
- **Backend:** Node.js, Express.js
- **AI Framework:** LangChain.js (v1)
- **LLM Engine:** Ollama (running Llama 3.2 locally)
- **Validation:** Zod (for tool schema definition)

## ✨ Features

- **Local LLM:** Uses Ollama to run Llama 3.2 directly on your Mac's hardware.
- **Tool Calling:** The AI is given a `get_menu` tool. If a user asks "What's for dinner today?", the AI automatically calls the tool with `category: "dinner"` and `day: "today"`.
- **Modern LangChain v1:** Uses the new `createAgent` and `tool()` APIs (no legacy `AgentExecutor` or `ChatPromptTemplate`).
- **Responsive UI:** A sleek, dark-mode chat interface with a loading indicator.

## 🚀 How to Run Locally

### Prerequisites
1. Install [Node.js](https://nodejs.org/).
2. Install [Ollama](https://ollama.com/).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Code-with-Fizza/AI-Restaurant-Assistant.git
   cd AI-Restaurant-Assistant
