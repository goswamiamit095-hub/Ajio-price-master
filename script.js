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