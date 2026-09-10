# EnterpriseGPT — HR Assistant Chat UI

A React (Vite) reproduction of the EnterpriseGPT chat interface: left app rail,
secondary navigation, conversations list, chat thread, and a right-hand
"Context & Sources" panel.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Stack

- **React 18 + Vite** — fast dev server, no extra config needed
- **Tailwind CSS (Play CDN)** — loaded in `index.html` for zero-build-step styling.
  For a production app, swap this for a compiled Tailwind setup
  (`npm install -D tailwindcss postcss autoprefixer` + `tailwind.config.js`
  with `content: ['./index.html', './src/**/*.{js,jsx}']`) — the utility
  classes used throughout the components will work unchanged.
- **lucide-react** — icon set matching the outline icons in the design

## Project structure

```
enterprise-gpt-chat/
├── index.html                     # HTML shell, fonts, Tailwind config
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                   # React root
    ├── App.jsx                    # Top-level layout composition
    ├── index.css                  # Global resets + scrollbar styling
    ├── data/
    │   └── mockData.js            # All sample data (conversations, messages,
    │                               #   sources, agents, nav items) in one place
    └── components/
        ├── layout/
        │   ├── IconRail.jsx        # Far-left slim app-switcher rail
        │   ├── SecondaryNav.jsx    # "EnterpriseGPT" nav (Conversations, Agents…)
        │   └── TopBar.jsx          # Search bar, back/forward, avatar
        ├── conversations/
        │   ├── ConversationsPanel.jsx  # Panel shell: header, search, list
        │   ├── FilterTabs.jsx          # All / HR Agent / IT Support / …
        │   └── ConversationItem.jsx    # Single row in the list
        ├── chat/
        │   ├── ChatPanel.jsx        # Message list + composer, owns chat state
        │   ├── ChatHeader.jsx       # Agent name, status, session actions
        │   ├── UserMessage.jsx      # Right-aligned bubble
        │   ├── AssistantMessage.jsx # Left-aligned bubble (bullets/steps/etc.)
        │   ├── EmailDraftCard.jsx   # Drafted email preview + actions
        │   ├── FeedbackRow.jsx      # Helpful/Copy/Regenerate + meta badges
        │   ├── SuggestedPrompts.jsx # Quick-prompt chips above input
        │   └── ChatInput.jsx        # Message composer
        └── context/
            ├── ContextPanel.jsx      # Right sidebar shell
            ├── SourceCard.jsx        # Referenced document row
            ├── RelatedAgentCard.jsx  # Related agent row
            └── SessionInsights.jsx   # Messages/Duration/Sentiment/Tokens stats

```

## Notes

- All content is driven by `src/data/mockData.js` — edit that file to change
  conversations, messages, sources, or nav items without touching any component.
- `ChatPanel` holds local state for the message list; sending a message from
  the composer or a suggested-prompt chip appends a new user bubble.
- `ConversationsPanel` supports live search/filter and clicking a conversation
  marks it active and clears its unread dot.
- The context panel can be closed via its `X` button (state lives in `App.jsx`).
- Swap `currentUser.avatar` and any icon/text in `mockData.js` to re-skin the
  UI for a different agent or company.
# Persistent conversation API

The app uses Node's built-in SQLite driver and stores chat history in
`data/enterprise-gpt.sqlite`.

Start the SQLite API and frontend together:

```bash
npm run api
npm run dev
```

`npm run dev` is the normal command and starts both services. `npm run api` is
only provided when you intentionally want to run the REST API by itself.

Available endpoints:

- `GET /api/health`
- `GET /api/bootstrap` — user, navigation, prompts, sources, agents and users
- `GET /api/sessions`
- `POST /api/sessions` with `{ "title": "...", "message": "..." }`
- `GET /api/sessions/:id`
- `POST /api/sessions/:id/messages` with `{ "role": "user|assistant", "text": "..." }`
- `DELETE /api/sessions/:id`
- `POST /api/chat/respond` with `{ "sessionId": 1, "message": "..." }`

The frontend uses `/api/chat/respond` as its conversation boundary. The API
creates a session when `sessionId` is omitted, stores both user and assistant
messages, and returns the saved session and response. Replace this endpoint's
implementation when connecting the production assistant backend; UI components
do not need to change.
