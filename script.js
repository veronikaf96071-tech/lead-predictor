/* =========================================================
   LeadPredictor - логика на калкулатора

   Трите формули от условието:
     Формула 01:  Клиенти   = Оборот / Средна стойност на поръчката
     Формула 02:  Leads     = Клиенти * 100 / Процент отговори от leads
     Формула 03:  Prospects = Leads * 100 / Процент отговори от prospects
   ========================================================= */


/* ---------------------------------------------------------
   1. ПРЕВОДИ НА НАДПИСИТЕ
   Обект, в който всеки език е ключ, а стойността е друг обект
   с надписите за този език.
   --------------------------------------------------------- */
const translations = {
  en: {
    language: "Language",
    currency: "Currency",
    campaignStart: "Campaign Start",
    campaignEnd: "Campaign End",
    totalRevenue: "Total Revenue",
    avgOrderValue: "Avg. Order Value",
    prospects: "Prospects",
    leads: "Leads",
    customers: "Customers",
    leadResponseRate: "Lead Response Rate",
    prospectResponseRate: "Prospect Response Rate",
    months: "Months",
    people: "people",
    month: "Month",
    invalidDates: "The end date must be after the start date."
  },
  bg: {
    language: "Език",
    currency: "Валута",
    campaignStart: "Начало на кампанията",
    campaignEnd: "Край на кампанията",
    totalRevenue: "Общ оборот",
    avgOrderValue: "Средна стойност на поръчка",
    prospects: "Контакти",
    leads: "Потенциални клиенти",
    customers: "Клиенти",
    leadResponseRate: "Отговори от потенциални клиенти",
    prospectResponseRate: "Отговори от контакти",
    months: "Месеци",
    people: "души",
    month: "Месец",
    invalidDates: "Крайната дата трябва да е след началната."
  },
  de: {
    language: "Sprache",
    currency: "Währung",
    campaignStart: "Kampagnenstart",
    campaignEnd: "Kampagnenende",
    totalRevenue: "Gesamtumsatz",
    avgOrderValue: "Durchschn. Bestellwert",
    prospects: "Kontakte",
    leads: "Leads",
    customers: "Kunden",
    leadResponseRate: "Lead-Antwortrate",
    prospectResponseRate: "Kontakt-Antwortrate",
    months: "Monate",
    people: "Personen",
    month: "Monat",
    invalidDates: "Das Enddatum muss nach dem Startdatum liegen."
  },
  es: {
    language: "Idioma",
    currency: "Moneda",
    campaignStart: "Inicio de campaña",
    campaignEnd: "Fin de campaña",
    totalRevenue: "Ingresos totales",
    avgOrderValue: "Valor medio del pedido",
    prospects: "Contactos",
    leads: "Clientes potenciales",
    customers: "Clientes",
    leadResponseRate: "Tasa de respuesta de leads",
    prospectResponseRate: "Tasa de respuesta de contactos",
    months: "Meses",
    people: "personas",
    month: "Mes",
    invalidDates: "La fecha final debe ser posterior a la inicial."
  }
};

/* ---------------------------------------------------------
   2. ВАЛУТИ - знакът, който се показва пред сумите
   --------------------------------------------------------- */
const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£"
};


/* ---------------------------------------------------------
   3. ЕЛЕМЕНТИ ОТ СТРАНИЦАТА
   --------------------------------------------------------- */
const languageSelect = document.getElementById("languageSelect");
const currencySelect = document.getElementById("currencySelect");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const revenueInput = document.getElementById("totalRevenue");
const orderValueInput = document.getElementById("orderValue");
const leadRateSlider = document.getElementById("leadRate");
const prospectRateSlider = document.getElementById("prospectRate");

const leadRateValue = document.getElementById("leadRateValue");
const prospectRateValue = document.getElementById("prospectRateValue");
const errorMessage = document.getElementById("errorMessage");

const chartRows = document.getElementById("chartRows");
const gridLayer = document.getElementById("gridLayer");
const chartAxis = document.getElementById("chartAxis");
const chartTooltip = document.getElementById("chartTooltip");


/* ---------------------------------------------------------
   4. ИЗЧИСЛЕНИЯ
   --------------------------------------------------------- */

// Формули 01, 02 и 03 - изчисляват цялата фуния
function calculateFunnel(revenue, orderValue, leadRate, prospectRate) {
  const customers = Math.ceil(revenue / orderValue);          // Формула 01
  const leads = Math.ceil(customers * 100 / leadRate);        // Формула 02
  const prospects = Math.ceil(leads * 100 / prospectRate);    // Формула 03

  return { prospects, leads, customers };
}

// Брой месеци между двете дати (поне 1)
function countMonths(startDate, endDate) {
  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  const total = years * 12 + months;

  return total < 1 ? 1 : total;
}

// Разпределя общите числа по месеци - натрупващо се до края на кампанията
function buildMonthlyData(funnel, monthsCount) {
  const data = [];

  for (let month = 1; month <= monthsCount; month++) {
    const part = month / monthsCount;

    data.push({
      month: month,
      prospects: Math.round(funnel.prospects * part),
      leads: Math.round(funnel.leads * part),
      customers: Math.round(funnel.customers * part)
    });
  }

  return data;
}

// Избира "кръгла" стъпка за хоризонталната ос (1, 2, 2.5, 5, 10, 20, 25, 50, ...)
function chooseAxisStep(maxValue) {
  const rough = maxValue / 7;
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const bases = [1, 2, 2.5, 5, 10];

  for (const base of bases) {
    const step = base * power;
    if (step >= rough) {
      return step;
    }
  }

  return 10 * power;
}


/* ---------------------------------------------------------
   5. РИСУВАНЕ НА ЕКРАНА
   --------------------------------------------------------- */

// Трите карти с показателите вдясно
function renderStats(funnel) {
  const leadsPercent = funnel.leads * 100 / funnel.prospects;
  const customersPercent = funnel.customers * 100 / funnel.prospects;

  document.getElementById("prospectsValue").textContent = funnel.prospects;
  document.getElementById("leadsValue").textContent = funnel.leads;
  document.getElementById("customersValue").textContent = funnel.customers;

  document.getElementById("prospectsPercent").textContent = "100%";
  document.getElementById("leadsPercent").textContent = Math.round(leadsPercent) + "%";
  document.getElementById("customersPercent").textContent = Math.round(customersPercent) + "%";

  document.getElementById("prospectsBar").style.width = "100%";
  document.getElementById("leadsBar").style.width = leadsPercent + "%";
  document.getElementById("customersBar").style.width = customersPercent + "%";
}

// Хоризонталната ос: помощни линии + надписи "0 people", "20 people", ...
function renderAxis(maxValue, texts) {
  chartAxis.innerHTML = "";
  gridLayer.innerHTML = "";

  const step = chooseAxisStep(maxValue);

  for (let value = 0; value <= maxValue; value += step) {
    const position = value * 100 / maxValue;

    const line = document.createElement("div");
    line.className = "grid-line";
    line.style.left = position + "%";
    gridLayer.appendChild(line);

    const label = document.createElement("span");
    label.className = "axis-label";
    label.style.left = position + "%";
    label.textContent = value + " " + texts.people;
    chartAxis.appendChild(label);
  }
}

// Колоните на графиката - по една за всеки месец
function renderChart(monthlyData, maxValue, texts) {
  chartRows.innerHTML = "";

  monthlyData.forEach(item => {
    const row = document.createElement("div");
    row.className = "chart-row";

    const label = document.createElement("span");
    label.className = "row-label";
    label.textContent = item.month;

    const track = document.createElement("div");
    track.className = "bar-track";

    const bar = document.createElement("div");
    bar.className = "bar";
    // Цялата колона е широка колкото контактите за този месец
    bar.style.width = (item.prospects * 100 / maxValue) + "%";

    // Трите части на колоната, наредени една след друга
    const rest = item.prospects - item.leads - item.customers;
    const segments = [
      { cssClass: "bar-customers", value: item.customers },
      { cssClass: "bar-leads", value: item.leads },
      { cssClass: "bar-prospects", value: rest }
    ];

    segments.forEach(segment => {
      if (segment.value > 0) {
        const piece = document.createElement("div");
        piece.className = "bar-segment " + segment.cssClass;
        piece.style.width = (segment.value * 100 / item.prospects) + "%";
        bar.appendChild(piece);
      }
    });

    // Подсказката се показва при минаване с мишката върху колоната
    bar.addEventListener("mousemove", event => showTooltip(event, item, texts));
    bar.addEventListener("mouseleave", hideTooltip);

    track.appendChild(bar);
    row.appendChild(label);
    row.appendChild(track);
    chartRows.appendChild(row);
  });
}

// Показва подсказката до курсора
function showTooltip(event, item, texts) {
  chartTooltip.innerHTML =
    texts.month + " #" + item.month + "<br>" +
    texts.prospects + ": " + item.prospects + "<br>" +
    texts.leads + ": " + item.leads + "<br>" +
    texts.customers + ": " + item.customers;

  chartTooltip.classList.add("visible");

  const chartBox = chartTooltip.parentElement.getBoundingClientRect();
  chartTooltip.style.left = (event.clientX - chartBox.left + 14) + "px";
  chartTooltip.style.top = (event.clientY - chartBox.top - 10) + "px";
}

function hideTooltip() {
  chartTooltip.classList.remove("visible");
}

// Подменя надписите според избрания език
function applyLanguage(texts) {
  const elements = document.querySelectorAll("[data-i18n]");

  elements.forEach(element => {
    const key = element.getAttribute("data-i18n");
    if (texts[key]) {
      element.textContent = texts[key];
    }
  });
}

// Слага валутния знак пред полетата за сума
function applyCurrency(symbol) {
  const symbols = document.querySelectorAll(".currency-symbol");
  symbols.forEach(element => element.textContent = symbol);
}

// Оцветява изминатата част от плъзгача в бяло
function paintSlider(slider) {
  const percent = (slider.value - slider.min) * 100 / (slider.max - slider.min);
  slider.style.background =
    "linear-gradient(to right, #ffffff 0%, #ffffff " + percent + "%, #46536b " + percent + "%, #46536b 100%)";
}


/* ---------------------------------------------------------
   6. ГЛАВНА ФУНКЦИЯ - събира всичко заедно
   --------------------------------------------------------- */
function updateAll() {
  const texts = translations[languageSelect.value];

  applyLanguage(texts);
  applyCurrency(currencySymbols[currencySelect.value]);

  // Стойностите под плъзгачите
  const leadRate = parseFloat(leadRateSlider.value);
  const prospectRate = parseFloat(prospectRateSlider.value);

  leadRateValue.textContent = leadRate.toFixed(2) + "%";
  prospectRateValue.textContent = prospectRate.toFixed(2) + "%";

  paintSlider(leadRateSlider);
  paintSlider(prospectRateSlider);

  // Проверка на въведените данни
  const revenue = parseFloat(revenueInput.value);
  const orderValue = parseFloat(orderValueInput.value);
  const startDate = new Date(startDateInput.value);
  const endDate = new Date(endDateInput.value);

  errorMessage.textContent = "";

  if (endDate <= startDate) {
    errorMessage.textContent = texts.invalidDates;
    return;
  }

  if (!revenue || !orderValue || revenue <= 0 || orderValue <= 0) {
    return;
  }

  // Изчисления
  const funnel = calculateFunnel(revenue, orderValue, leadRate, prospectRate);
  const monthsCount = countMonths(startDate, endDate);
  const monthlyData = buildMonthlyData(funnel, monthsCount);

  // Рисуване
  renderStats(funnel);
  renderChart(monthlyData, funnel.prospects, texts);
  renderAxis(funnel.prospects, texts);
}


/* ---------------------------------------------------------
   7. СЪБИТИЯ - при всяка промяна преизчисляваме всичко
   --------------------------------------------------------- */
const controls = [
  languageSelect, currencySelect, startDateInput, endDateInput,
  revenueInput, orderValueInput, leadRateSlider, prospectRateSlider
];

controls.forEach(control => {
  control.addEventListener("input", updateAll);
  control.addEventListener("change", updateAll);
});

// Първоначално зареждане
updateAll();