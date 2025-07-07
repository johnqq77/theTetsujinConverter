let userAddress = "";

function authorize() {
  const code = document.getElementById("access-code").value;
  if (code === "077") {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
  } else {
    alert("ACCESS DENIED");
  }
}

async function connectWallet() {
  if (window.ethereum) {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    userAddress = accounts[0];
    log(`Wallet connected: ${userAddress}`);
  } else {
    alert("MetaMask not detected");
  }
}

async function checkBalance() {
  if (!userAddress) return alert("Connect wallet first.");
  const res = await fetch(`/api/balance/${userAddress}`);
  const data = await res.json();
  log(`Balance: ${data.balanceEth} ETH`);
}

async function fetchTxHistory() {
  const res = await fetch('/api/tx-history');
  const data = await res.json();
  log("Transaction History:");
  data.forEach(tx => log(`[${tx.timestamp}] ${tx.txHash} - ${tx.status}`));
}

function log(msg) {
  const output = document.getElementById("output");
  output.innerText += msg + "\n";
}
