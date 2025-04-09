# Create Pocket App

A CLI tool to quickly create voice-first applications.

## Quick Start

Create a new app:

```bash
npx create-pocket-app
```

Edit `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=your-api-key-here
```

Start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app in action.

## Customize Your App

The main application logic is in `src/lib/app.ts`. This file contains a simple demo that showcases states, actions, and parameters:

```typescript
@state
async main(c: Context) {
  c.display("Town Square");

  c.prompt("The user is in the town square.");
  c.prompt("They can enter the tavern or talk to the merchant.");

  c.action(this.talk, "Talk to the merchant");
  c.state(this.tavern, "Enter the tavern");
}
```

Edit this file to create your own voice application.

## Learn More

Visit [pocketcomputer.com](https://pocketcomputer.com) for examples and documentation.

---

Copyright (c) 2025 Chris Nolet
