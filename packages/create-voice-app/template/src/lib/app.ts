import { Model, action, param, state } from "@pocketcomputer/core";

export class App {
  initialPrompt = "You are the dungeon master for a role-playing game. Call tools to navigate the world.";

  @state
  async main(model: Model) {
    model.prompt(this.initialPrompt);
    model.prompt("You are in the town square.");

    model.state(this.tavern, "Enter the tavern");
  }

  @state
  tavern(model: Model) {
    model.prompt("You are in the tavern.");
    model.prompt("There is quiet music, many adventurers and a burly barkeeper.");

    model.state(this.main, "Leave the tavern");
    model.action(this.playMusic, "Join the band on stage");
  }

  @action
  playMusic(model: Model, @param("instrument", "The instrument to play") instrument: string) {
    prompt(`You play the ${instrument} with incredible talent.`);
  }
}
