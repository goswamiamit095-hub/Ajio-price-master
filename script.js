function calculate() {
  let TP = parseFloat(document.getElementById("tp").value);
  let targetMargin = parseFloat(document.getElementById("margin").value) / 100;

  if (isNaN(TP) || isNaN(targetMargin)) {
    document.getElementById("result").innerText = "";
    document.getElementById("details").innerHTML = "";
    return;
  }

  let sp = findSP(TP, targetMargin);
  let breakdown = calcFull(sp, TP);

  document.getElementById("result").innerText = "SP = " + sp;

  document.getElementById("details").innerHTML = `
  <table>
<tr><td>Commission</td><td>${breakdown.commission.toFixed(2)}</td></tr>
<tr><td>Tax</td><td>${breakdown.tax.toFixed(2)}</td></tr>
<tr><td>Marketing</td><td>${breakdown.marketing.toFixed(2)}</td></tr>
<tr><td>Dispatch</td><td>${breakdown.dispatch}</td></tr>
<tr><td>Net Payout</td><td>${breakdown.net.toFixed(2)}</td></tr>
<tr><td>Margin</td><td>${(breakdown.margin * 100).toFixed(2)}%</td></tr>
</table>
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
function findSP(TP, targetMargin) {
  let low = 200, high = 5000, sp;

  for (let i = 0; i < 30; i++) {
    sp = (low + high) / 2;
    let margin = calcMargin(sp, TP);

    if (margin > targetMargin) {
      high = sp;
    } else {
      low = sp;
    }
  }

  return Math.round(sp);
}
function calcMargin(SP, TP) {
  let commission = Math.max(SP * 0.36, 180);

  let taxable = SP / 1.05;
  let tax = taxable * 0.05;

  let purchaseValue = SP - commission - tax;
  let purchaseGST = purchaseValue * 0.05;
  let invoiceValue = purchaseValue + purchaseGST;

  let marketing = SP * 0.03;

  let dispatch = SP < 500 ? 25 : SP < 1000 ? 30 : 35;

  let netPayout = invoiceValue - marketing - dispatch;

  return (netPayout - TP) / TP;
}
document.getElementById("tp").addEventListener("input", calculate);
document.getElementById("margin").addEventListener("input", calculate);
