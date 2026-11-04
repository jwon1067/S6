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

function render() {
  starCount.textContent = `★ ${Math.floor(stars)} stars`;
}

whackButton.addEventListener("click", () => {
  stars += 1;
  render();
});

// One animation-frame loop drives every timed change. Growth is paid
// out per elapsed second (not per frame), so it is independent of the
// display's frame rate. The setInterval from the previous step is gone,
// so the drip cannot be counted twice.
let lastMs = performance.now();

function tick(nowMs: number) {
  const dtMs = nowMs - lastMs;
  lastMs = nowMs;
  stars += starsPerSecond * (dtMs / 1000);
  render();
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

app.append(heading, starCount, whackButton);
render();
