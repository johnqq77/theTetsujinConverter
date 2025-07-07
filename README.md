// theTetsujinConverter (Now with Balance Checker, Tx History, Wallet Import, Logging Dashboard)

import axios from 'axios';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const LIVE_MODE = process.env.LIVE_MODE === 'true';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let transactionLog = [];

// Endpoint: Block Number
app.get('/api/blocknumber', async (req, res) => {
  try {
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_blockNumber",
      params: []
    };
    const url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
    const response = await axios.post(url, payload);
    const blockHex = response.data.result;
    const blockDecimal = parseInt(blockHex, 16);
    res.json({ blockHex, blockDecimal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch block number' });
  }
});

// Endpoint: Balance Checker
app.get('/api/balance/:address', async (req, res) => {
  const address = req.params.address;
  if (!address || !address.startsWith('0x')) {
    return res.status(400).json({ error: 'Invalid address' });
  }
  try {
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"]
    };
    const url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
    const response = await axios.post(url, payload);
    const balanceWei = response.data.result;
    const balanceEth = parseInt(balanceWei, 16) / 1e18;
    res.json({ address, balanceEth });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Endpoint: Convert Transaction + Logging
app.post('/api/convert', async (req, res) => {
  try {
    const rawTx = req.body.rawTransaction;
    if (!rawTx || typeof rawTx !== 'string' || !rawTx.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid or missing rawTransaction payload' });
    }
    if (rawTx.length < 64 || rawTx.length % 2 !== 0) {
      return res.status(400).json({ error: 'Payload appears malformed or incomplete' });
    }

    let result;
    if (!LIVE_MODE) {
      result = {
        status: 'success',
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        message: 'Simulated Transaction'
      };
    } else {
      const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendRawTransaction",
        params: [rawTx]
      };
      const url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
      const response = await axios.post(url, payload);
      result = { status: 'broadcasted', txHash: response.data.result };
    }

    transactionLog.push({ timestamp: new Date(), ...result });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

// Endpoint: Transaction History
app.get('/api/tx-history', (req, res) => {
  res.json(transactionLog);
});

// Endpoint: Wallet Import (for simulation only)
app.post('/api/import-wallet', (req, res) => {
  const { privateKey } = req.body;
  if (!privateKey || !privateKey.startsWith('0x')) {
    return res.status(400).json({ error: 'Invalid private key' });
  }
  res.json({ status: 'imported', address: `0xImported${privateKey.slice(-6)}` });
});

app.listen(PORT, () => {
  console.log(`theTetsujinConverter running at http://localhost:${PORT}`);
});
