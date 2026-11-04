// @deno-types="./asset-url.d.ts"
import burrowUrl from "./assets/burrow.svg?no-inline";
// @deno-types="./asset-url.d.ts"
import moleUrl from "./assets/mole.svg?no-inline";
import { deriveRates, type Rates } from "./rates.ts";
import {
  buy,
  canBuy,
  costOfNext,
  createInitialState,
  type GameState,
  levelOf,
} from "./state.ts";
import { type Upgrade, UPGRADES } from "./upgrades.ts";

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

const state: GameState = createInitialState();

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

type ShopEntry = {
  upgrade: Upgrade;
  button: HTMLButtonElement;
  meta: HTMLSpanElement;
};

function createShopButton(upgrade: Upgrade): ShopEntry {
  const button = document.createElement("button");
  button.id = upgrade.id;
  button.type = "button";
  button.className = "upgrade";
  const nameSpan = document.createElement("span");
  nameSpan.className = "name";
  nameSpan.textContent = upgrade.name;
  const descSpan = document.createElement("span");
  descSpan.className = "desc";
  descSpan.textContent = upgrade.description;
  const meta = document.createElement("span");
  meta.className = "meta";
  button.append(nameSpan, descSpan, meta);
  shop.append(button);
  return { upgrade, button, meta };
}

// The shop is rendered straight from the catalog: one purchase
// handler and one render path serve every upgrade.
const shopEntries: ShopEntry[] = [];

for (const upgrade of UPGRADES) {
  const entry = createShopButton(upgrade);
  entry.button.addEventListener("click", () => {
    if (buy(state, upgrade)) {
      entry.button.classList.remove("bought");
      void entry.button.offsetWidth;
      entry.button.classList.add("bought");
      render(deriveRates(state));
    }
  });
  shopEntries.push(entry);
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

function updateMoles(nowMs: number, dtMs: number, rates: Rates) {
  popTimerMs -= dtMs;
  if (popTimerMs <= 0) {
    spawnMole(nowMs);
    popTimerMs = rates.popIntervalMs * (0.9 + Math.random() * 0.2);
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
  const rates = deriveRates(state);
  state.whacks += 1;
  const goldenWhack = rates.goldenEveryN > 0 &&
    state.whacks % rates.goldenEveryN === 0;
  const payout = goldenWhack
    ? rates.perWhack * rates.goldenPayout
    : rates.perWhack;
  state.stars += payout;
  burrow.mole.classList.add("whacked");
  if (goldenWhack) {
    burrow.mole.classList.add("golden");
  }
  setTimeout(() => burrow.mole.classList.remove("whacked", "golden"), 250);
  floatStars(burrow.button, `+${payout}★`, goldenWhack);
  render(rates);
}

function render(rates: Rates) {
  starCount.textContent = `★ ${Math.floor(state.stars)}`;
  rate.textContent = `${
    rates.perSecond.toFixed(1)
  }★ per second · ${rates.perWhack}★ per whack`;
  for (const entry of shopEntries) {
    const level = levelOf(state, entry.upgrade.id);
    const maxed = level >= entry.upgrade.maxLevel;
    entry.button.disabled = !canBuy(state, entry.upgrade);
    entry.meta.textContent = maxed
      ? `maxed out · owned ×${level}`
      : `${costOfNext(state, entry.upgrade)}★ · owned ×${level}`;
  }
}

function tick(nowMs: number) {
  const dtMs = Math.min(nowMs - lastMs, 60_000);
  lastMs = nowMs;
  const rates = deriveRates(state);
  state.stars += rates.perSecond * (dtMs / 1000);
  updateMoles(nowMs, dtMs, rates);
  render(rates);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
