/* === Стоимость кадров. Ключ – количество кадров. === */
const FRAMES = {0:0, 10:1700, 20:3300, 30:4800, 40:6200, 50:7500, 60:8700, 70:9800, 80:10800, 90:11700, 100:12500};
const BOOKING = 350;

const DATA = {
  9:  {name:"Instax Mini 9",  steps:[400,800,1200,1600], extra:300, dep:4000},
  11: {name:"Instax Mini 11", steps:[500,1000,1500,2000], extra:400, dep:5000},
  12: {name:"Instax Mini 12", steps:[600,1200,1800,2400], extra:500, dep:6000}
};
let model = 12, days = 2, frames = 0, two = false;

const fmt = n => Math.round(n).toLocaleString("ru-RU").replace(/ /g,"\u00a0") + "\u00a0₽";
const wordDays = n => (n % 10 === 1 && n % 100 !== 11) ? "сутки" : "суток";
const priceFor = (m, n) => {
  const d = DATA[m];
  if (n <= 4) return d.steps[n - 1];
  return d.steps[3] + Math.max(0, n - 5) * d.extra;
};

const $ = id => document.getElementById(id);

function render(){
  const d = DATA[model];
  const mult = (model === 12 && two) ? 2 : 1;
  const rent = priceFor(model, days) * mult;
  const framesSum = FRAMES[frames] || 0;
  const total = rent + framesSum + BOOKING;

  $("l-model").textContent = d.name + (mult === 2 ? " × 2" : "") + ", " + days + " " + wordDays(days);
  $("l-rent").textContent = fmt(rent);
  $("row-frames").classList.toggle("is-blank", frames === 0);
  $("l-frames-name").textContent = "Кадры, " + frames + " шт.";
  $("l-frames").textContent = fmt(framesSum);
  const deposit = d.dep * mult;
  $("l-total").textContent = fmt(total);
  $("l-dep").textContent = fmt(deposit);
  $("l-grand").textContent = fmt(total + deposit);

  $("days-word").textContent = wordDays(days);
  document.querySelectorAll("#seg-model button").forEach(b =>
    b.setAttribute("aria-pressed",
      String(Number(b.dataset.m) === model && (b.dataset.two === "1") === two)));
  // не трогаем поле, пока в нём печатают, иначе набор перебивается округлением
  if (document.activeElement !== framesInput) framesInput.value = frames;
  $("f-own").setAttribute("aria-pressed", String(frames === 0));
  $("frame-price").classList.toggle("is-blank", frames === 0);
  // при нуле оставляем неразрывный пробел: строка невидима, но место под неё остаётся
  $("frame-price").innerHTML = frames > 0
    ? "<b>" + fmt(framesSum / frames) + "</b> за кадр"
    : "&nbsp;";
}

document.querySelectorAll("#seg-model button").forEach(b =>
  b.addEventListener("click", () => {
    model = Number(b.dataset.m);
    two = b.dataset.two === "1";
    render();
  }));
const framesInput = $("frames");
const setFrames = n => { frames = Math.min(100, Math.max(0, Math.round(n / 10) * 10)); render(); };
framesInput.addEventListener("input", e => {
  const v = parseInt(e.target.value, 10);
  if (isNaN(v)) return;
  frames = Math.min(100, Math.max(0, Math.round(v / 10) * 10));
  render();
});
framesInput.addEventListener("blur", () => { framesInput.value = frames; });
$("f-minus").addEventListener("click", () => setFrames(frames - 10));
$("f-plus").addEventListener("click", () => setFrames(frames + 10));
$("f-own").addEventListener("click", () => setFrames(0));

const daysInput = $("days");
daysInput.addEventListener("input", e => {
  const v = parseInt(e.target.value, 10);
  if (isNaN(v)) return;
  days = Math.min(60, Math.max(1, v));
  render();
});
daysInput.addEventListener("blur", () => { daysInput.value = days; });
$("d-minus").addEventListener("click", () => { days = Math.max(1, days - 1); daysInput.value = days; render(); });
$("d-plus").addEventListener("click", () => { days = Math.min(60, days + 1); daysInput.value = days; render(); });

render();
