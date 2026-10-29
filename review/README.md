# Review materials

Files a directory reviewer uses with the Bluu reviewer account. Reviewer credentials are never stored here: they are entered in each directory's private form.

- `sample-statement.csv`: the statement for the "A shared statement checked against Bluu" test case. The reviewer account already has two of its rows (EXITO CALLE 80 and NETFLIX.COM), and PAGO TARJETA DE CREDITO is a payment to the user's own card, so the expected answer lists the other five.
- `screenshots/`: the Bluu cards (MCP Apps) at 1236 px wide, for the Claude directory's carousel (PNG, at least 1000 px wide, cropped to the app's response). Rendered from real tool results with `bluu-mcp-server/scripts/render-cards.ts` and `CARD_SCALE=3`. The prompt for each:

| File | Prompt |
| --- | --- |
| `proposal-expense-light.png` | Record a 38,900 COP lunch with Ana at Crepes & Waffles under Restaurantes. |
| `glance-budgets-dark.png` | How are my budgets doing? |
| `glance-overview-light.png` | How is my money looking this week? |
| `share-bill-es-light.png` | Divide la cena entre Ana y yo, yo pagué. |
| `glance-what-if-es-dark.png` | ¿Cuándo junto 6 millones ahorrando 500 mil al mes? |
