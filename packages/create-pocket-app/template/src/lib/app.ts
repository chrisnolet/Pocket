import { Context, action, param, state } from "@pocketcomputer/core";

export class App {
  initialPrompt = `You are the dungeon master for a role-playing game. Use tool calls to navigate
    the world. Speak in a fast half-whisper.`;

  gold = 15;

  @state
  async main(c: Context) {
    c.display("Town Square");

    c.prompt(this.initialPrompt);
    c.prompt("The user is in the town square.");
    c.prompt("They can enter the tavern or talk to the merchant.");

    c.action(this.talk, "Talk to the merchant");
    c.state(this.tavern, "Enter the tavern");
  }

  @action
  talk(c: Context) {
    c.display("Merchant");

    c.prompt("Involve the user in an engaging conversation.");
    c.prompt("When voicing the merchant, speak in a thick British accent without whispering.");
  }

  @state
  tavern(c: Context) {
    c.display("Tavern");

    c.prompt("The user is in a lively tavern.");
    c.prompt("There is a bard, a table of adventurers and a burly barkeeper.");
    c.prompt("Describe the tavern and suggest possible actions.");

    c.action(this.buyDrink, "Ask for a drink");
    c.action(this.joinGroup, "Talk to the adventurers");
    c.state(this.main, "Leave the tavern");
  }

  @action
  buyDrink(c: Context, @param("drink", "The drink to buy") drink: string) {
    c.display("Buy:");
    c.display(`Glass of ${drink}`);

    if (this.gold < 5) {
      c.prompt("The user doesn't have enough gold for a drink.");
      return;
    }

    this.gold -= 5;

    c.prompt(`The barkeeper pours the user a large glass of ${drink}.`);
    c.prompt(`The user has ${this.gold} gold coins remaining.`);
  }

  @action
  joinGroup(c: Context) {
    c.display("The Adventure Continues...");

    c.prompt("Explain to the user that this is a demo experience.");
    c.prompt("They can expand the adventure by running 'npx create-pocket-app' and editing 'app.ts'.");
    c.prompt("Notice how the demo uses the @action, @state and @param decorators.");
  }
}
