

## TelexLinter - Your AI Code Review Buddy


The **TelexLinter** is a specialized AI Agent built to enhance developer workflows directly inside **Telex.im**. Tired of minor security bugs or outdated API calls slipping through code review? Send your code snippet to the **TelexLinter** chat, and it will provide an immediate, structured review with a clean, refactored solution.

This project was developed for the HNG Internship Stage 3 Backend Task.

### Features


| Feature | Value to You |
| :--- | :--- |
| **Security First** | Uses a custom **`securityScannerTool`** to automatically check for hardcoded secrets (like API keys) and dangerous function calls (`eval()`). |
| **Deprecation Watch** | Employs a **`packageDocsLookupTool`** to verify functions against modern standards, flagging deprecated calls (e.g., old Node.js or React lifecycle methods). |
| **A2A Mastery** | Integrated with Telex via a **custom A2A Gateway (JSON-RPC 2.0)**, demonstrating robust protocol handling. |
| **Clean Output** | Delivers feedback in a strict format: a clear bulleted list of issues (citing tool evidence) followed by a copy-paste-ready, **refactored code block**. |

-----

##  Tech Stack & Architecture

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Agent Framework** | **Mastra (TypeScript)** | Defines the agent, its brain (system prompt), and its custom tools. |
| **LLM Backend** | OpenAI / Gemini (via AI SDK) | Provides the core reasoning and code generation capabilities. |
| **Integration** | **A2A Protocol / JSON-RPC 2.0** | The standard used by the Telex.im platform to communicate with our endpoint. |
| **Gateway** | **Mastra Custom API Route** | The TypeScript code that securely translates Telex's A2A requests to Mastra's internal format and sends back a compliant response. |

-----

##  Getting Started

### Prerequisites

You need the following installed:

  * Node.js (v18+)
  * Mastra CLI
  * A publicly accessible deployment environment (Vercel, Render, Railway, etc.)
  * An LLM API Key (e.g., `OPENAI_API_KEY`)

### Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone [ Repo URL]
    cd TelexLinter
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment:**
    Create a `.env` file in the root directory and add your API key:
    ```
    OPENAI_API_KEY="sk-..."
    ```
4.  **Build and Deploy:**
    Follow your chosen platform's guide to build and deploy the Mastra application. This will give you your base domain 

-----

##  Testing and Integration

### 1\. The Critical Endpoint

The **TelexLinter** agent is accessible via the custom A2A route we implemented:

  * **Final A2A Endpoint:** `https://[YOUR-DEPLOYMENT-DOMAIN]/a2a/agent/TelexLinter`

### 2\. Manual Test (Postman/cURL)

You can verify the gateway works before connecting it to Telex by sending a `POST` request to the URL above with the following JSON body (this sample tests security, deprecation, and general refactoring):

```json
{
    "jsonrpc": "2.0",
    "id": "12345-linter-test-001",
    "method": "tasks/send",
    "params": {
        "messages": [
            {
                "role": "user",
                "parts": [
                    {
                        "kind": "text",
                        "text": "Review this code for security and outdated methods:"
                    },
                    {
                        "kind": "text",
                        "text": "const SECRET = 'hard-pass-123'; \n\napp.use(require('body-parser').json()); \n"
                    }
                ]
            }
        ]
    }
}
```

### 3\. Final Telex Integration

Paste your finalized A2A Endpoint URL into the `url` field of the **A2A Node** when configuring the `TelexLinter` workflow on the Telex.im platform.

-----


