# Bluu for AI assistants

Your money in [Bluu](https://bluulabs.com) from your AI assistant: what you spend and earn, what you owe and are owed, your budgets, goals and net worth. Ask about it and record it without leaving the chat.

**Bluu keeps the books. It never moves money, makes payments or recommends investments, and nothing is saved without your confirmation.**

This repository holds the plugin manifests and skills for Claude, ChatGPT, Cursor and Grok Bot. The connector itself is Bluu's remote MCP server at `https://api.bluulabs.com/api/v1/mcp`, which you sign in to with your Bluu account (OAuth). No code from Bluu's backend lives here.

## Install

| Assistant | How |
| --- | --- |
| Claude (web, desktop, mobile) | Settings › Connectors › Add custom connector › `https://api.bluulabs.com/api/v1/mcp` |
| Claude Code | `/plugin marketplace add bluuulabs/bluu-plugin`, then `/plugin install bluu@bluu` |
| ChatGPT | Plugins › Add custom MCP server › `https://api.bluulabs.com/api/v1/mcp` |
| Cursor | [One-click install](https://bluulabs.com/mcp), or add `mcp.json` from `.cursor-plugin/plugin.json` |
| Grok | Settings › Connectors › add a custom connector with the server URL |
| VS Code | `code --add-mcp '{"name":"bluu","type":"http","url":"https://api.bluulabs.com/api/v1/mcp"}'` |

Step-by-step instructions, in Spanish and English: [bluulabs.com/mcp](https://bluulabs.com/mcp).

## What it can do

- **Ask:** spending by category, budgets, goals, upcoming payments, money with other people, net worth per currency.
- **Record:** expenses, income and moves between spaces, after you say yes.
- **Statements and receipts:** share a file in the chat; the assistant checks its rows against Bluu and proposes the missing ones with your own categories.
- **Split bills:** share an expense with other people and get a link for each of them.
- **Plan:** budgets, savings goals, reminders and subscriptions.

### Skills

| Skill | What it does |
| --- | --- |
| `weekly-check-in` | The week: spending, what is due, budgets over, goal pace |
| `month-in-review` | A month: in and out, top categories, budgets, goals |
| `split-a-bill` | Splits a bill and returns a link per person |
| `record-from-a-file` | Records the movements of a statement or receipt you share |

## Layout

| Path | Read by |
| --- | --- |
| `plugin.json`, `mcp.json`, `skills/`, `assets/` | Agent Plugins standard: ChatGPT and Codex (with `extensions.com.openai`), Cursor |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.mcp.json` | Claude Code and the Claude directory |
| `.cursor-plugin/plugin.json` | Cursor and Grok Bot (static client as a fallback when CIMD is unavailable) |
| `review/` | Directory reviewers |

`node scripts/check.mjs` validates the manifests against the directories' limits. `scripts/package-openai.sh` builds the ZIP for OpenAI's plugin dashboard.

## Privacy and support

- Privacy policy: [bluulabs.com/privacy](https://bluulabs.com/privacy). Bluu does not receive your conversation with the assistant, only the requests it makes to Bluu.
- Disconnect at any time in Bluu › Settings › Connections.
- Support: [bluulabs.com/support](https://bluulabs.com/support) or hello@bluulabs.com.

## License

MIT, for the manifests and skills in this repository.
