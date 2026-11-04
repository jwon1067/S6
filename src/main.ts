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

// Upgrades grow more expensive with every purchase, so early buys are
// quick wins and later ones are real decisions.
const MALLET_BASE = 10;
const MALLET_GROWTH = 1.65; // +1★ per whack per level
const BURROW_BASE = 25;
const BURROW_GROWTH = 1.75; // +0.4★ per second per level
const TREATS_BASE = 40;
const TREATS_GROWTH = 1.9; // pops 15% faster per level
const TREATS_MAX = 8;
const GOLDEN_BASE = 120;
const GOLDEN_GROWTH = 2.2; // one-time: every 8th whack pays eightfold
const GOLDEN_MAX = 1;
const GOLDEN_EVERY = 8;
const GOLDEN_PAYOUT = 8;

let stars = 0;
let whacks = 0;
let malletLevel = 0;
let burrowLevel = 0;
let treatsLevel = 0;
let goldenLevel = 0;

function costFor(baseCost: number, growth: number, level: number): number {
  return Math.round(baseCost * Math.pow(growth, level));
}

function malletCost(): number {
  return costFor(MALLET_BASE, MALLET_GROWTH, malletLevel);
}

function burrowCost(): number {
  return costFor(BURROW_BASE, BURROW_GROWTH, burrowLevel);
}

function treatsCost(): number {
  return costFor(TREATS_BASE, TREATS_GROWTH, treatsLevel);
}

function goldenCost(): number {
  return costFor(GOLDEN_BASE, GOLDEN_GROWTH, goldenLevel);
}

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
  if (stars < malletCost()) {
    return;
  }
  stars -= malletCost();
  malletLevel += 1;
  render();
});
shop.append(malletButton);

const burrowButton = document.createElement("button");
burrowButton.id = "burrow-upgrade";
burrowButton.type = "button";
burrowButton.addEventListener("click", () => {
  if (stars < burrowCost()) {
    return;
  }
  stars -= burrowCost();
  burrowLevel += 1;
  render();
});
shop.append(burrowButton);

const treatsButton = document.createElement("button");
treatsButton.id = "treats";
treatsButton.type = "button";
treatsButton.addEventListener("click", () => {
  if (stars < treatsCost() || treatsLevel >= TREATS_MAX) {
    return;
  }
  stars -= treatsCost();
  treatsLevel += 1;
  render();
});
shop.append(treatsButton);

const goldenButton = document.createElement("button");
goldenButton.id = "golden";
goldenButton.type = "button";
goldenButton.addEventListener("click", () => {
  if (stars < goldenCost() || goldenLevel >= GOLDEN_MAX) {
    return;
  }
  stars -= goldenCost();
  goldenLevel += 1;
  render();
});
shop.append(goldenButton);

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

function floatStars(anchor: HTMLElement, text: string, golden: boolean) {
  const span = document.createElement("span");
  span.className = golden ? "float-star golden" : "float-star";
  span.textContent = text;
  const fieldRect = field.getBoundingClientRect();
  const rect = anchor.getBoundingClientRect();
  span.style.left = `${rect.left - fieldRect.left + rect.width / 2}px`;
  span.style.top = `${rect.top - fieldRect.top}px`;
  field.append(span);
  setTimeout(() => span.remove(), 900);
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
  const golden = goldenLevel > 0 && whacks % GOLDEN_EVERY === 0;
  const payout = golden ? currentWhack() * GOLDEN_PAYOUT : currentWhack();
  stars += payout;
  floatStars(burrow.button, `+${payout}★`, golden);
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
  malletButton.disabled = stars < malletCost();
  malletButton.textContent =
    `Bigger Mallet — ${malletCost()}★ · owned ×${malletLevel} (+1★ per whack)`;
  burrowButton.disabled = stars < burrowCost();
  burrowButton.textContent =
    `Extra Burrow — ${burrowCost()}★ · owned ×${burrowLevel} (+0.4★ per second)`;
  const treatsMaxed = treatsLevel >= TREATS_MAX;
  treatsButton.disabled = treatsMaxed || stars < treatsCost();
  treatsButton.textContent = treatsMaxed
    ? `Mole Treats — maxed out · owned ×${treatsLevel}`
    : `Mole Treats — ${treatsCost()}★ · owned ×${treatsLevel} (moles pop 15% faster)`;
  const goldenMaxed = goldenLevel >= GOLDEN_MAX;
  goldenButton.disabled = goldenMaxed || stars < goldenCost();
  goldenButton.textContent = goldenMaxed
    ? `Golden Mole — maxed out`
    : `Golden Mole — ${goldenCost()}★ · every 8th whack pays eightfold`;
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
