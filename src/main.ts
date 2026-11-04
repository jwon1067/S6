const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Whack-a-Mole";

const starCount = document.createElement("p");
starCount.id = "star-count";
starCount.textContent = "★ 0 stars";

const field = document.createElement("div");
field.id = "field";

app.append(heading, starCount, field);

const BURROW_COUNT = 3;
const POP_INTERVAL_MS = 1800;
const POP_DURATION_MS = 1400;

// The burrow sifts stardust on its own, even while nobody clicks.
const STARS_PER_SECOND = 0.2;

let stars = 0;
const starsPerWhack = 1;

type Burrow = {
  up: boolean;
  upUntil: number;
  button: HTMLButtonElement;
};

const burrows: Burrow[] = [];

for (let i = 0; i < BURROW_COUNT; i++) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "burrow";
  button.textContent = "•";
  field.append(button);
  const burrow: Burrow = { up: false, upUntil: 0, button };
  burrows.push(burrow);
  button.addEventListener("click", () => whack(burrow));
}

let lastMs = performance.now();
let popTimerMs = 600;

// Timed mole appearances share the same frame loop as the drip, and
// still measure elapsed time, so pops keep their cadence at any frame
// rate and no timer runs twice.
function spawnMole(nowMs: number) {
  const down = burrows.filter((burrow) => !burrow.up);
  if (down.length === 0) {
    return;
  }
  const burrow = down[Math.floor(Math.random() * down.length)];
  burrow.up = true;
  burrow.upUntil = nowMs + POP_DURATION_MS;
  burrow.button.classList.add("up");
}

function updateMoles(nowMs: number, dtMs: number) {
  popTimerMs -= dtMs;
  if (popTimerMs <= 0) {
    spawnMole(nowMs);
    popTimerMs = POP_INTERVAL_MS * (0.9 + Math.random() * 0.2);
  }
  for (const burrow of burrows) {
    if (burrow.up && nowMs >= burrow.upUntil) {
      burrow.up = false;
      burrow.button.classList.remove("up");
    }
  }
}

function whack(burrow: Burrow) {
  if (!burrow.up) {
    // Whiffing an empty burrow earns nothing, just a shake.
    burrow.button.classList.remove("whiff");
    void burrow.button.offsetWidth;
    burrow.button.classList.add("whiff");
    return;
  }
  burrow.up = false;
  burrow.button.classList.remove("up");
  stars += starsPerWhack;
  render();
}

function render() {
  starCount.textContent = `★ ${Math.floor(stars)} stars`;
  for (const burrow of burrows) {
    burrow.button.textContent = burrow.up ? "mole!" : "•";
  }
}

function tick(nowMs: number) {
  const dtMs = Math.min(nowMs - lastMs, 60_000);
  lastMs = nowMs;
  stars += STARS_PER_SECOND * (dtMs / 1000);
  updateMoles(nowMs, dtMs);
  render();
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
