import { Model, action, param, state } from "@pocketcomputer/core";

export class App {
  initialPrompt = `We're going to play 20 questions. You'll have a word and the player needs to
    guess. Briefly explain the rules to the user. Good luck!`;

  wordList: string[] = [
    "elephant",
    "computer",
    "bicycle",
    "chocolate",
    "umbrella",
    "guitar",
    "mountain",
    "telescope",
    "butterfly",
    "watermelon"
  ];

  word: string = "";
  count: number = 20;

  @state
  async main(model: Model) {
    const randomIndex = Math.floor(Math.random() * this.wordList.length);

    this.word = this.wordList[randomIndex];

    model.prompt(this.initialPrompt);
    model.prompt(`The word is ${this.word}.`);

    model.action(this.guess, "Make a guess");
    model.action(this.exit, "Exit the game");
  }

  @action
  guess(model: Model, @param("guess", "The word the player guessed") guess: string) {
    if (guess === this.word) {
      model.prompt("You won! Make it exciting. Say wow a lot.");
      return;
    }

    this.count--;

    if (this.count === 0) {
      model.prompt("Game over!");
      return;
    }

    model.prompt("Nope! Guess again.");
    model.prompt("The player has ${this.count} guesses left.");
    model.prompt(`${this.count < 5 ? "Do" : "Don't"} tell the player how many guesses they have left`);

    model.action(this.hint, "The player asks for a hint");
  }

  @action
  hint(model: Model) {
    model.prompt("Give the player a hint");
  }

  @action
  exit(model: Model) {
    model.exit();
  }
}
