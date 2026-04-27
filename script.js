const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSuN06WhR8p5bs-Jl0_8wZgqudAT14tG5LAOGi26lgWYXNIhgb0RrCzpt3svlChfaC3Q1WoOoujXjXU/pub?gid=287836236&single=true&output=csv";

let globalData = [];

async function loadData() {
  let res = await fetch(sheetURL);
  let text = await res.text();

  Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    complete: function(result) {

      let margin = parseFloat(document.getElementById("margin").value || -10) / 100;

      globalData = result.data
        .map(r => processRow(r, margin))
        .filter(r => r !== null);

      applyFilters();
    }
  });
}

function processRow(r, margin){

  let TP = parseFloat(r["TP"]?.toString().trim());
  if(isNaN(TP)) return null;

  let SP = findSP(TP, margin);
  let MRP = SP / 0.4;

  let commission = Math.max(SP * 0.36, 180);
  let tax = (SP / 1.05) * 0.05;

  let purchase = SP - commission - tax;
  let invoice = purchase + purchase * 0.05;

  let closingFee = SP * 0.03;
  let shipping = (SP < 500 ? 25 : SP < 1000 ? 30 : 35);

  let net = invoice - closingFee - shipping;

  return {
    ...r,

    TP: Math.round(TP),
    SP: Math.round(SP),
    MRP: Math.round(MRP),

    Commission: Math.round(commission),
    Tax: Math.round(tax),
    Purchase: Math.round(purchase),
    Invoice: Math.round(invoice),

    ClosingFee: Math.round(closingFee),
    Shipping: shipping,

    Payout: Math.round(net),
    Diff: Math.round(net - TP)
  };
}

function renderTable(data){

  if(!data.length){
    document.getElementById("table").innerHTML = "No Data Found";
    return;
  }

  let headers = Object.keys(data[0]);

  let html = "<table><tr>";

  headers.forEach(h => html += `<th>${h}</th>`);
  html += "</tr>";

  data.forEach(d => {
    html += "<tr>";

    headers.forEach(h => {
      let val = d[h];

      if(h === "Diff"){
        let color = val >= 0 ? "green" : "red";
        html += `<td style="color:${color};font-weight:bold">${val}</td>`;
      } else {
        html += `<td>${val}</td>`;
      }
    });

    html += "</tr>";
  });

  html += "</table>";

  document.getElementById("table").innerHTML = html;
}

function findSP(TP, targetMargin){

  let low = TP, high = TP * 3, sp;

  for(let i = 0; i < 40; i++){
    sp = (low + high) / 2;
    let m = calcMargin(sp, TP);

    if(m > targetMargin) high = sp;
    else low = sp;
  }

  return sp;
}

function calcMargin(SP, TP){

  let commission = Math.max(SP * 0.36, 180);
  let tax = (SP / 1.05) * 0.05;

  let purchase = SP - commission - tax;
  let invoice = purchase + purchase * 0.05;

  let closingFee = SP * 0.03;
  let shipping = (SP < 500 ? 25 : SP < 1000 ? 30 : 35);

  let net = invoice - closingFee - shipping;

  return (net - TP) / TP;
}

// 🔍 Search + Filter
function applyFilters(){

  let search = document.getElementById("search").value.toLowerCase();
  let filter = document.getElementById("filter").value;

  let filtered = globalData.filter(row => {

    let match = Object.values(row).some(val =>
      String(val).toLowerCase().includes(search)
    );

    if(filter === "profit") return match && row.Diff >= 0;
    if(filter === "loss") return match && row.Diff < 0;

    return match;
  });

  renderTable(filtered);
}

// 📥 Excel Download
function downloadExcel(){

  if(!globalData.length){
    alert("No data to download");
    return;
  }

  let headers = Object.keys(globalData[0]);

  let csv = headers.join(",") + "\n";

  globalData.forEach(row => {
    let values = headers.map(h => `"${row[h]}"`);
    csv += values.join(",") + "\n";
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = "pricing-data.csv";
  a.click();

  URL.revokeObjectURL(url);
}