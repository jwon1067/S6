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

// The burrow sifts stardust on its own, even while nobody clicks.
const starsPerSecond = 0.2;
const TICK_MS = 250;

function render() {
  starCount.textContent = `★ ${Math.floor(stars)} stars`;
}

whackButton.addEventListener("click", () => {
  stars += 1;
  render();
});

setInterval(() => {
  stars += starsPerSecond * (TICK_MS / 1000);
  render();
}, TICK_MS);

app.append(heading, starCount, whackButton);
render();
