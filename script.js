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

      globalData = result.data.map(r => processRow(r, margin));

      populateFilters();
      renderTable(globalData);
    }
  });
}

function processRow(r, margin) {

  let TP = parseFloat(r["TP"]);
  if (!TP) return null;

  let SP = findSP(TP, margin);
  let MRP = SP / 0.4;

  let BAU_TD = 1 - SP/MRP;
  let TD_Amount = MRP - SP;

  let commission = Math.max(SP*0.36, 180);
  let GST1 = Math.round((SP/1.05)*0.05);

  let purchase = SP - commission - GST1;
  let GST2 = Math.round(purchase*0.05);

  let invoice = purchase + GST2;
  let marketing = SP*0.03*1.18;

  let dispatch = SP<500?25:SP<1000?30:35;

  let payout = invoice - marketing - dispatch;

  let diff = payout - TP;
  let diffPct = (diff/TP)*100;

  return {
    ...r,
    SP, MRP,
    BAU_TD,
    TD_Amount,
    "Ajio Margin": commission,
    GST1,
    "Purchase Price": purchase,
    GST2,
    Invoice: invoice,
    Marketing: marketing,
    Dispatch: dispatch,
    Payout: payout,
    Diff: diff,
    DiffPct: diffPct
  };
}

function findSP(TP, targetMargin) {
  let low = TP, high = TP*3, sp;

  for (let i=0;i<40;i++){
    sp=(low+high)/2;
    let m = calcMargin(sp,TP);
    if(m>targetMargin) high=sp;
    else low=sp;
  }
  return Math.round(sp);
}

function calcMargin(SP, TP){
  let commission = Math.max(SP*0.36,180);
  let tax = (SP/1.05)*0.05;
  let purchase = SP - commission - tax;
  let invoice = purchase + purchase*0.05;
  let net = invoice - SP*0.03 - (SP<500?25:SP<1000?30:35);
  return (net-TP)/TP;
}

function renderTable(data){

  let search = document.getElementById("search").value?.toLowerCase();

  let html="<table><tr>";

  let headers = Object.keys(data[0]);
  headers.forEach(h=>html+=`<th>${h}</th>`);

  html+="</tr>";

  data.forEach(d=>{

    if(!d) return;

    if(search && !JSON.stringify(d).toLowerCase().includes(search)) return;

    html+="<tr>";

    headers.forEach(h=>{
      let val = d[h];

      let cls = "";
      if(h==="DiffPct"){
        if(d.Status==="Continue" && val<-17) cls="red";
        if(d.Status==="Special" && val<-40) cls="red";
        if(d.Status==="Discontinue" && val<-30) cls="red";
      }

      html+=`<td class="${cls}">${typeof val==="number"?val.toFixed(2):val}</td>`;
    });

    html+="</tr>";
  });

  html+="</table>";
  document.getElementById("table").innerHTML=html;
}
function exportExcel(){

  let ws = XLSX.utils.json_to_sheet(globalData);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");

  XLSX.writeFile(wb, "pricing.xlsx");

  saveHistory();
}

function saveHistory(){
  let hist = JSON.parse(localStorage.getItem("history")||"[]");
  hist.unshift(new Date().toLocaleString());
  hist = hist.slice(0,10);
  localStorage.setItem("history", JSON.stringify(hist));
}