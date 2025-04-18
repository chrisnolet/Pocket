This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-pocket-app`](https://pocketcomputer.com).

## Getting Started

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
