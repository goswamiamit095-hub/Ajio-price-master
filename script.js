const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSuN06WhR8p5bs-Jl0_8wZgqudAT14tG5LAOGi26lgWYXNIhgb0RrCzpt3svlChfaC3Q1WoOoujXjXU/pub?gid=287836236&single=true&output=csv";

let globalData = [];

async function loadData() {
  let res = await fetch(sheetURL);
  let text = await res.text();

  Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    complete: function(result) {

      let margin = parseFloat(document.getElementById("margin").value || -10)/100;

      globalData = result.data.map(r => processRow(r, margin));

      renderTable(globalData);
    }
  });
}

function processRow(r, margin){

  let TP = parseFloat(r["TP"]);
  if(!TP) return null;

  let SP = findSP(TP, margin);
  let MRP = SP / 0.4;

  let commission = Math.max(SP*0.36,180);
  let tax = (SP/1.05)*0.05;

  let purchase = SP - commission - tax;
  let invoice = purchase + purchase*0.05;

  let net = invoice - SP*0.03 - (SP<500?25:SP<1000?30:35);

  return {
    ...r,
    SP,
    MRP,
    Payout: net,
    Diff: net - TP
  };
}

function renderTable(data){

  let html="<table><tr>";

  let headers = Object.keys(data[0]||{});

  headers.forEach(h=>html+=`<th>${h}</th>`);
  html+="</tr>";

  data.forEach(d=>{
    if(!d) return;

    html+="<tr>";
    headers.forEach(h=>{
      html+=`<td>${d[h]}</td>`;
    });
    html+="</tr>";
  });

  html+="</table>";

  document.getElementById("table").innerHTML=html;
}

function findSP(TP, targetMargin){
  let low=TP, high=TP*3, sp;

  for(let i=0;i<40;i++){
    sp=(low+high)/2;
    let m=calcMargin(sp,TP);
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