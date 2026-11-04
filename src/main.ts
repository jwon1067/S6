// @deno-types="./asset-url.d.ts"
import burrowUrl from "./assets/burrow.svg?no-inline";
// @deno-types="./asset-url.d.ts"
import moleUrl from "./assets/mole.svg?no-inline";

const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Star Burrow";

const tagline = document.createElement("p");
tagline.className = "tagline";
tagline.textContent = "Whack the star moles; collect what falls.";

const stats = document.createElement("div");
stats.id = "stats";

const starCount = document.createElement("p");
starCount.id = "star-count";
starCount.textContent = "★ 0";

const rate = document.createElement("p");
rate.id = "rate";

stats.append(starCount, rate);

const field = document.createElement("div");
field.id = "field";

const shop = document.createElement("div");
shop.className = "shop";

const shopHeading = document.createElement("h2");
shopHeading.textContent = "Burrow shop";
shop.append(shopHeading);

const footer = document.createElement("p");
footer.className = "footer";
footer.textContent =
  "Moles, burrows, and fallen stars — a CMPM 121 D1 clicker.";

app.append(heading, tagline, stats, field, shop, footer);

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
  mole: HTMLImageElement;
};

const burrows: Burrow[] = [];

for (let i = 0; i < BURROW_COUNT; i++) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "burrow";
  button.setAttribute("aria-label", `Burrow ${i + 1}`);
  const mole = document.createElement("img");
  mole.className = "mole";
  mole.src = moleUrl;
  mole.alt = "";
  mole.draggable = false;
  const hole = document.createElement("img");
  hole.className = "hole";
  hole.src = burrowUrl;
  hole.alt = "";
  hole.draggable = false;
  button.append(mole, hole);
  field.append(button);
  const burrow: Burrow = { up: false, upUntil: 0, button, mole };
  burrows.push(burrow);
  button.addEventListener("click", () => whack(burrow));
}

function createShopButton(
  id: string,
  name: string,
  description: string,
): { button: HTMLButtonElement; meta: HTMLSpanElement } {
  const button = document.createElement("button");
  button.id = id;
  button.type = "button";
  button.className = "upgrade";
  const nameSpan = document.createElement("span");
  nameSpan.className = "name";
  nameSpan.textContent = name;
  const descSpan = document.createElement("span");
  descSpan.className = "desc";
  descSpan.textContent = description;
  const meta = document.createElement("span");
  meta.className = "meta";
  button.append(nameSpan, descSpan, meta);
  shop.append(button);
  return { button, meta };
}

const mallet = createShopButton(
  "mallet",
  "Bigger Mallet",
  "Each whack shakes loose one more star.",
);
const burrowUpgrade = createShopButton(
  "burrow-upgrade",
  "Extra Burrow",
  "Another burrow sifts stardust around the clock.",
);
const treats = createShopButton(
  "treats",
  "Mole Treats",
  "Well-fed moles pop up 15% faster per treat.",
);
const golden = createShopButton(
  "golden",
  "Golden Mole",
  "Every 8th whack strikes gold and pays eightfold.",
);

mallet.button.addEventListener("click", () => {
  if (stars < malletCost()) {
    return;
  }
  stars -= malletCost();
  malletLevel += 1;
  render();
});

burrowUpgrade.button.addEventListener("click", () => {
  if (stars < burrowCost()) {
    return;
  }
  stars -= burrowCost();
  burrowLevel += 1;
  render();
});

treats.button.addEventListener("click", () => {
  if (stars < treatsCost() || treatsLevel >= TREATS_MAX) {
    return;
  }
  stars -= treatsCost();
  treatsLevel += 1;
  render();
});

golden.button.addEventListener("click", () => {
  if (stars < goldenCost() || goldenLevel >= GOLDEN_MAX) {
    return;
  }
  stars -= goldenCost();
  goldenLevel += 1;
  render();
});

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

function floatStars(anchor: HTMLElement, text: string, goldenPayout: boolean) {
  const span = document.createElement("span");
  span.className = goldenPayout ? "float-star golden" : "float-star";
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
  const goldenWhack = goldenLevel > 0 && whacks % GOLDEN_EVERY === 0;
  const payout = goldenWhack ? currentWhack() * GOLDEN_PAYOUT : currentWhack();
  stars += payout;
  burrow.mole.classList.add("whacked");
  if (goldenWhack) {
    burrow.mole.classList.add("golden");
  }
  setTimeout(() => burrow.mole.classList.remove("whacked", "golden"), 250);
  floatStars(burrow.button, `+${payout}★`, goldenWhack);
  render();
}

function render() {
  starCount.textContent = `★ ${Math.floor(stars)}`;
  rate.textContent = `${
    currentDrip().toFixed(1)
  }★ per second · ${currentWhack()}★ per whack`;
  mallet.button.disabled = stars < malletCost();
  mallet.meta.textContent = `${malletCost()}★ · owned ×${malletLevel}`;
  burrowUpgrade.button.disabled = stars < burrowCost();
  burrowUpgrade.meta.textContent = `${burrowCost()}★ · owned ×${burrowLevel}`;
  const treatsMaxed = treatsLevel >= TREATS_MAX;
  treats.button.disabled = treatsMaxed || stars < treatsCost();
  treats.meta.textContent = treatsMaxed
    ? `maxed out · owned ×${treatsLevel}`
    : `${treatsCost()}★ · owned ×${treatsLevel}`;
  const goldenMaxed = goldenLevel >= GOLDEN_MAX;
  golden.button.disabled = goldenMaxed || stars < goldenCost();
  golden.meta.textContent = goldenMaxed
    ? `maxed out`
    : `${goldenCost()}★ · one-time`;
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
