const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Whack-a-Mole";

const starCount = document.createElement("p");
starCount.id = "star-count";
starCount.textContent = "★ 0 stars";

const rate = document.createElement("p");
rate.id = "rate";

const field = document.createElement("div");
field.id = "field";

const shop = document.createElement("div");
shop.id = "shop";

app.append(heading, starCount, rate, field, shop);

const BURROW_COUNT = 3;
const POP_DURATION_MS = 1400;

// Upgrades. Costs are flat for now; repeated buys will grow them soon.
const MALLET_COST = 10; // +1★ per whack
const BURROW_COST = 25; // +0.4★ per second
const TREATS_COST = 40; // moles pop 15% faster
const TREATS_MAX = 8;

let stars = 0;
let whacks = 0;
let malletLevel = 0;
let burrowLevel = 0;
let treatsLevel = 0;

function currentWhack(): number {
  return 1 + malletLevel;
}

function currentDrip(): number {
  return 0.2 + 0.4 * burrowLevel;
}

function currentPopInterval(): number {
  return 1800 * Math.pow(0.85, treatsLevel);
}

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

const malletButton = document.createElement("button");
malletButton.id = "mallet";
malletButton.type = "button";
malletButton.addEventListener("click", () => {
  if (stars < MALLET_COST) {
    return;
  }
  stars -= MALLET_COST;
  malletLevel += 1;
  render();
});
shop.append(malletButton);

const burrowButton = document.createElement("button");
burrowButton.id = "burrow-upgrade";
burrowButton.type = "button";
burrowButton.addEventListener("click", () => {
  if (stars < BURROW_COST) {
    return;
  }
  stars -= BURROW_COST;
  burrowLevel += 1;
  render();
});
shop.append(burrowButton);

const treatsButton = document.createElement("button");
treatsButton.id = "treats";
treatsButton.type = "button";
treatsButton.addEventListener("click", () => {
  if (stars < TREATS_COST || treatsLevel >= TREATS_MAX) {
    return;
  }
  stars -= TREATS_COST;
  treatsLevel += 1;
  render();
});
shop.append(treatsButton);

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
    popTimerMs = currentPopInterval() * (0.9 + Math.random() * 0.2);
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
  whacks += 1;
  stars += currentWhack();
  render();
}

function render() {
  starCount.textContent = `★ ${Math.floor(stars)} stars`;
  rate.textContent = `${
    currentDrip().toFixed(1)
  }★ per second · ${currentWhack()}★ per whack`;
  for (const burrow of burrows) {
    burrow.button.textContent = burrow.up ? "mole!" : "•";
  }
  malletButton.disabled = stars < MALLET_COST;
  malletButton.textContent =
    `Bigger Mallet — ${MALLET_COST}★ · owned ×${malletLevel} (+1★ per whack)`;
  burrowButton.disabled = stars < BURROW_COST;
  burrowButton.textContent =
    `Extra Burrow — ${BURROW_COST}★ · owned ×${burrowLevel} (+0.4★ per second)`;
  const treatsMaxed = treatsLevel >= TREATS_MAX;
  treatsButton.disabled = treatsMaxed || stars < TREATS_COST;
  treatsButton.textContent = treatsMaxed
    ? `Mole Treats — maxed out · owned ×${treatsLevel}`
    : `Mole Treats — ${TREATS_COST}★ · owned ×${treatsLevel} (moles pop 15% faster)`;
}

function tick(nowMs: number) {
  const dtMs = Math.min(nowMs - lastMs, 60_000);
  lastMs = nowMs;
  stars += currentDrip() * (dtMs / 1000);
  updateMoles(nowMs, dtMs);
  render();
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
