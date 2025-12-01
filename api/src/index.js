require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const simpleStorageAbi = require("./simpleStorageAbi");

const app = express();
app.use(express.json());

// Carrega variáveis de ambiente
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SIMPLE_STORAGE_ADDRESS = process.env.SIMPLE_STORAGE_ADDRESS;

if (!RPC_URL || !PRIVATE_KEY || !SIMPLE_STORAGE_ADDRESS) {
    console.error("Faltando RPC_URL, PRIVATE_KEY ou SIMPLE_STORAGE_ADDRESS no .env");
    process.exit(1);
}

// Provider e wallet (ethers v6)
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

(async () => {
    const addr = await wallet.getAddress();
    const bal = await provider.getBalance(addr);
    console.log("Wallet da API:", addr);
    console.log("Saldo da wallet:", ethers.formatEther(bal), "ETH");
})().catch(console.error);

// Instância do contrato
const contract = new ethers.Contract(
  SIMPLE_STORAGE_ADDRESS,
  simpleStorageAbi,
  wallet
);

// Rota para ler o valor
app.get("/value", async (req, res) => {
  try {
    const value = await contract.get();
    res.json({ value: value.toString() });
  } catch (err) {
    console.error("Erro ao ler valor:", err);
    res.status(500).json({ error: "Erro ao ler valor" });
  }
});

// Rota para atualizar o valor
app.post("/value", async (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: "Campo 'value' é obrigatório" });
    }

    const tx = await contract.set(value);
    console.log("Tx enviada:", tx.hash);

    const receipt = await tx.wait();
    console.log("Tx confirmada em bloco:", receipt.blockNumber);

    res.json({
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });
  } catch (err) {
    console.error("Erro ao atualizar valor:", err);
    res.status(500).json({ error: "Erro ao atualizar valor" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Web3 rodando em http://localhost:${PORT}`);
});
console.log('API Web3 up!');
