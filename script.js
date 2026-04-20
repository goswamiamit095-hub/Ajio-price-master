function calculate() {
  let TP = parseFloat(document.getElementById("tp").value);
  let targetMargin = parseFloat(document.getElementById("margin").value) / 100;

  let sp = findSP(TP, targetMargin);
  let breakdown = calcFull(sp, TP);

  document.getElementById("result").innerText = "SP = " + sp;

  document.getElementById("details").innerHTML = `
    Commission: ${breakdown.commission}<br>
    Tax: ${breakdown.tax}<br>
    Marketing: ${breakdown.marketing}<br>
    Dispatch: ${breakdown.dispatch}<br>
    Net Payout: ${breakdown.net}<br>
    Margin: ${(breakdown.margin * 100).toFixed(2)}%
  `;
}

function calcFull(SP, TP) {
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
