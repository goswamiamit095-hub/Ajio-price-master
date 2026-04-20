const sheetURL = "https://api.allorigins.win/raw?url=https://docs.google.com/spreadsheets/d/1IAxE3UoG-sghflJw4ZQYfmsdEDhQEj0ViYtIuxEy0Yk/export?format=csv&gid=287836236";

let globalData = [];

async function loadData() {
  const res = await fetch(sheetURL);
  const text = await res.text();

  Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {

      let data = results.data;
      let marginInput = parseFloat(document.getElementById("margin")?.value || -10) / 100;

      globalData = [];
      let brands = new Set();
      let statuses = new Set();

      data.forEach(row => {
        let tp = parseFloat(row["TP"]);
        if (!tp || isNaN(tp)) return;

        let sp = findSP(tp, marginInput);
        let mrp = sp * 1.6;
        let diff = mrp - sp;

        let item = {
          product: row["ERP SKU"],
          brand: row["Brand"],
          status: row["Status"],
          tp,
          sp,
          mrp,
          diff,
          jio: row["Jio Code"]
        };

        brands.add(item.brand);
        statuses.add(item.status);
        globalData.push(item);
      });

      populateFilters(brands, statuses);
      renderTable(globalData);
    }
  });
}

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
      (!brand || d.brand === brand) &&
      (!status || d.status === status)
    );

    renderTable(filtered);
  }
});

function renderTable(data) {
  let el = document.getElementById("table");
  if (!el) return;

  let html = "<table><tr><th>ERP SKU</th><th>Brand</th><th>Status</th><th>TP</th><th>SP</th><th>MRP</th><th>Diff</th></tr>";

  data.forEach(d => {
    html += `<tr>
      <td>${d.product}</td>
      <td>${d.brand}</td>
      <td>${d.status}</td>
      <td>${d.tp}</td>
      <td>${d.sp}</td>
      <td>${d.mrp.toFixed(2)}</td>
      <td>${d.diff.toFixed(2)}</td>
    </tr>`;
  });

  html += "</table>";
  el.innerHTML = html;
}

function exportExcel() {
  const ws = XLSX.utils.json_to_sheet(globalData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pricing");
  XLSX.writeFile(wb, "pricing.xlsx");
}

/* ===== CALC ===== */

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