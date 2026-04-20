// 🔗 SHEET LINKS
const inputURL = "https://api.allorigins.win/raw?url=https://docs.google.com/spreadsheets/d/1IAxE3UoG-sghflJw4ZQYfmsdEDhQEj0ViYtIuxEy0Yk/export?format=csv&gid=287836236";

const exportURL = "https://api.allorigins.win/raw?url=https://docs.google.com/spreadsheets/d/1IAxE3UoG-sghflJw4ZQYfmsdEDhQEj0ViYtIuxEy0Yk/export?format=csv&gid=1736969456";

let globalData = [];
let exportHeaders = [];

// 🚀 MAIN LOAD
async function loadData() {

  // 👉 1. EXPORT SHEET (structure)
  const expRes = await fetch(exportURL);
  const expText = await expRes.text();

  Papa.parse(expText, {
    header: true,
    skipEmptyLines: true,
    complete: function(expResult) {

      exportHeaders = expResult.meta.fields;

      // 👉 2. INPUT SHEET (data)
      fetch(inputURL)
        .then(res => res.text())
        .then(text => {

          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: function(result) {

              processData(result.data);
            }
          });

        });
    }
  });
}

// 🧠 PROCESS DATA
function processData(data) {

  let marginInput = parseFloat(document.getElementById("margin")?.value || -10) / 100;

  globalData = [];
  let brands = new Set();
  let statuses = new Set();

  data.forEach(row => {

    let tp = parseFloat(row["TP"]);
    if (!tp) return;

    let sp = findSP(tp, marginInput);
    let mrp = sp * 1.6;
    let diff = mrp - sp;

    let item = {
      raw: row,
      sp,
      mrp,
      diff
    };

    brands.add(row["Brand"]);
    statuses.add(row["Status"]);

    globalData.push(item);
  });

  populateFilters(brands, statuses);
  renderTable(globalData);
}

// 🎯 TABLE RENDER (EXPORT FORMAT)
function renderTable(data) {
  let el = document.getElementById("table");
  if (!el) return;

  let html = "<table><tr>";

  // EXPORT HEADERS
  exportHeaders.forEach(h => {
    html += `<th>${h}</th>`;
  });

  // EXTRA
  html += "<th>SP</th><th>MRP</th><th>Diff</th>";

  html += "</tr>";

  data.forEach(d => {
    html += "<tr>";

    exportHeaders.forEach(h => {
      html += `<td>${d.raw[h] || ""}</td>`;
    });

    html += `
      <td>${d.sp}</td>
      <td>${d.mrp.toFixed(2)}</td>
      <td>${d.diff.toFixed(2)}</td>
    `;

    html += "</tr>";
  });

  html += "</table>";
  el.innerHTML = html;
}

// 🎛️ FILTERS
function populateFilters(brands, statuses) {
  let b = document.getElementById("brandFilter");
  let s = document.getElementById("statusFilter");

  if (!b) return;

  b.innerHTML = `<option value="">All Brands</option>`;
  s.innerHTML = `<option value="">All Status</option>`;

  brands.forEach(v => b.innerHTML += `<option>${v}</option>`);
  statuses.forEach(v => s.innerHTML += `<option>${v}</option>`);
}

document.addEventListener("change", function(e) {
  if (e.target.id === "brandFilter" || e.target.id === "statusFilter") {

    let brand = document.getElementById("brandFilter").value;
    let status = document.getElementById("statusFilter").value;

    let filtered = globalData.filter(d =>
      (!brand || d.raw["Brand"] === brand) &&
      (!status || d.raw["Status"] === status)
    );

    renderTable(filtered);
  }
});

// 📤 EXPORT
function exportExcel() {
  const ws = XLSX.utils.json_to_sheet(globalData.map(d => ({
    ...d.raw,
    SP: d.sp,
    MRP: d.mrp,
    Diff: d.diff
  })));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pricing");
  XLSX.writeFile(wb, "pricing.xlsx");
}

/* ===== CALC ENGINE ===== */

function calcAll(SP, TP) {
  let commission = Math.max(SP * 0.36, 180);
  let taxable = SP / 1.05;
  let tax = taxable * 0.05;

  let purchaseValue = SP - commission - tax;
  let purchaseGST = purchaseValue * 0.05;
  let invoiceValue = purchaseValue + purchaseGST;

  let marketing = SP * 0.03;
  let dispatch = SP < 500 ? 25 : SP < 1000 ? 30 : 35;

  let net = invoiceValue - marketing - dispatch;
  let margin = (net - TP) / TP;

  return { commission, tax, marketing, dispatch, net, margin };
}

function findSP(TP, targetMargin) {
  let low = TP;
  let high = TP * 3;
  let sp;

  for (let i = 0; i < 40; i++) {
    sp = (low + high) / 2;
    let margin = calcAll(sp, TP).margin;

    if (Math.abs(margin - targetMargin) < 0.001) break;

    if (margin > targetMargin) high = sp;
    else low = sp;
  }

  return Math.round(sp);
}