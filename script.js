const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSuN06WhR8p5bs-Jl0_8wZgqudAT14tG5LAOGi26lgWYXNIhgb0RrCzpt3svlChfaC3Q1WoOoujXjXU/pub?gid=287836236&single=true&output=csv";

let globalData = [];

// FIXED COLUMN ORDER
const FINAL_HEADERS = [
"ERP Launch Date","Launch Date","Jio Code","Gen_Code","EAN Code","Vendor SKU",
"Parent","ERP SKU","SKU Code","Category","Brand","Status",
"TP","MRP","BAU TD","TD Amount","SP","Ajio Margin","GST1",
"Purchase Price","GST2","Invoice","Marketing","Dispatch Cost",
"Payout","Diffrence (Rs.)","Diffrence (%)"
];

// TAB SWITCH
function showTab(tab){
  document.getElementById("dashboard").style.display = tab === "dashboard" ? "block" : "none";
  document.getElementById("calculator").style.display = tab === "calculator" ? "block" : "none";
}

// LOAD DATA
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

      renderTable(globalData);
    }
  });
}

// PROCESS ROW
function processRow(r, margin){

  let TP = parseFloat(r["TP"]?.toString().trim());
  if(isNaN(TP)) return null;

  let SP = findSP(TP, margin);
  let MRP = SP / 0.4;

  let commission = Math.max(SP * 0.36, 180);
  let gst1 = (SP / 1.05) * 0.05;

  let purchase = SP - commission - gst1;
  let gst2 = purchase * 0.05;

  let invoice = purchase + gst2;

  let marketing = SP * 0.03;
  let dispatch = (SP < 500 ? 25 : SP < 1000 ? 30 : 35);

  let payout = invoice - marketing - dispatch;

  let diffRs = payout - TP;
  let diffPer = (diffRs / TP) * 100;

  return {
    "ERP Launch Date": r["ERP Launch Date"] || "",
    "Launch Date": r["Launch Date"] || "",
    "Jio Code": r["Jio Code"] || "",
    "Gen_Code": r["Gen_Code"] || "",
    "EAN Code": r["EAN Code"] || "",
    "Vendor SKU": r["Vendor SKU"] || "",
    "Parent": r["Parent"] || "",
    "ERP SKU": r["ERP SKU"] || "",
    "SKU Code": r["SKU Code"] || "",
    "Category": r["Category"] || "",
    "Brand": r["Brand"] || "",
    "Status": r["Status"] || "",

    "TP": Math.round(TP),
    "MRP": Math.round(MRP),

    "BAU TD": "",
    "TD Amount": "",

    "SP": Math.round(SP),
    "Ajio Margin": Math.round(commission),

    "GST1": Math.round(gst1),
    "Purchase Price": Math.round(purchase),
    "GST2": Math.round(gst2),

    "Invoice": Math.round(invoice),

    "Marketing": Math.round(marketing),
    "Dispatch Cost": dispatch,

    "Payout": Math.round(payout),

    "Diffrence (Rs.)": Math.round(diffRs),
    "Diffrence (%)": diffPer.toFixed(2)
  };
}

// TABLE
function renderTable(data){

  let html = "<table><tr>";

  FINAL_HEADERS.forEach(h => html += `<th>${h}</th>`);
  html += "</tr>";

  data.forEach(d => {
    html += "<tr>";

    FINAL_HEADERS.forEach(h => {
      let val = d[h] ?? "";

      if(h === "Diffrence (Rs.)"){
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

// DOWNLOAD
function downloadExcel(){

  let csv = FINAL_HEADERS.join(",") + "\n";

  globalData.forEach(row => {
    let values = FINAL_HEADERS.map(h => `"${row[h] ?? ""}"`);
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

// CALCULATOR TP→SP
function calcSP(){
  let TP = parseFloat(document.getElementById("tpInput").value);
  let margin = parseFloat(document.getElementById("margin").value || -10) / 100;

  let SP = findSP(TP, margin);

  document.getElementById("spResult").innerText = "SP = " + Math.round(SP);
}

// CALCULATOR SP→TP
function calcTP(){
  let SP = parseFloat(document.getElementById("spInput").value);

  let commission = Math.max(SP * 0.36, 180);
  let gst1 = (SP / 1.05) * 0.05;

  let purchase = SP - commission - gst1;
  let gst2 = purchase * 0.05;

  let invoice = purchase + gst2;

  let marketing = SP * 0.03;
  let dispatch = (SP < 500 ? 25 : SP < 1000 ? 30 : 35);

  let payout = invoice - marketing - dispatch;

  document.getElementById("tpResult").innerText = "TP ≈ " + Math.round(payout);
}

// CORE ENGINE
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
  let gst1 = (SP / 1.05) * 0.05;

  let purchase = SP - commission - gst1;
  let gst2 = purchase * 0.05;

  let invoice = purchase + gst2;

  let marketing = SP * 0.03;
  let dispatch = (SP < 500 ? 25 : SP < 1000 ? 30 : 35);

  let net = invoice - marketing - dispatch;

  return (net - TP) / TP;
}