const axios = require('axios');
const API_KEY = process.env.ETHERSCAN_API_KEY;

const baseURL = 'https://api.etherscan.io/api';

async function fetch(endpoint, address) {
  const url = `${baseURL}?module=account&action=${endpoint}&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY}`;
  const res = await axios.get(url);
  return res.data.result || [];
}

async function getWalletData(address) {
  const [txs, tokens, nfts] = await Promise.all([
    fetch('txlist', address), // ETH + contract txs
    fetch('tokentx', address), // ERC20 transfers
    fetch('tokennfttx', address), // NFT txs
  ]);

  // Optional: You can normalize and sort here
  return {
    transactions: txs,
    erc20Transfers: tokens,
    nftTransfers: nfts,
  };
}

module.exports = { getWalletData };
