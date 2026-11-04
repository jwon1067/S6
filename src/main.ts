const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Whack-a-Mole";

const hint = document.createElement("p");
hint.className = "hint";
hint.textContent = "Click the button to whack.";

const whackButton = document.createElement("button");
whackButton.id = "whack-button";
whackButton.type = "button";
whackButton.textContent = "Whack the mole";
whackButton.addEventListener("click", () => {
  console.log("Whack!");
});

app.append(heading, hint, whackButton);
