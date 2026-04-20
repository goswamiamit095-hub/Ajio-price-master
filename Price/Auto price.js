function calculate() {
  let TP = parseFloat(document.getElementById("tp").value);
  let targetMargin = parseFloat(document.getElementById("margin").value) / 100;

  let sp = findSP(TP, targetMargin);

  document.getElementById("result").innerText = "SP = " + sp;
}

function findSP(TP, targetMargin) {
  let low = 200, high = 5000, sp;

  for (let i = 0; i < 30; i++) {
    sp = (low + high) / 2;
    let margin = calcMargin(sp, TP);

    if (margin > targetMargin) high = sp;
    else low = sp;
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
