const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Whack-a-Mole";

const starCount = document.createElement("p");
starCount.id = "star-count";
starCount.textContent = "★ 0 stars";

const whackButton = document.createElement("button");
whackButton.id = "whack-button";
whackButton.type = "button";
whackButton.textContent = "Whack the mole";

let stars = 0;

function render() {
  starCount.textContent = `★ ${stars} stars`;
}

whackButton.addEventListener("click", () => {
  stars += 1;
  render();
});

app.append(heading, starCount, whackButton);
render();
