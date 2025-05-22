const axios = require('axios');
const { fetchOpenSeaMetadata } = require('./fetchOpenSeaMetadata');
const API_KEY = process.env.ETHERSCAN_API_KEY;
const baseURL = 'https://api.etherscan.io/api';

function paginate(data, offset, limit) {
  return data.slice(offset, offset + limit);
}

function unixToDate(ts) {
  return new Date(Number(ts) * 1000).toISOString();
}

function shorten(addr) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

async function fetch(endpoint, address, page, offset) {
  const url = `${baseURL}?module=account&action=${endpoint}&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${API_KEY}`;
  const res = await axios.get(url);
  return res.data.result || [];
}

async function getWalletData(address, page = 1, limit = 10) {
  const [txs, tokens, nfts] = await Promise.all([
    fetch('txlist', address, page, limit),
    fetch('tokentx', address, page, limit),
    fetch('tokennfttx', address, page, limit),
  ]);

  const normalized = [];

  // 🔹 Normalize ETH + contract interactions
  for (const tx of txs) {
    const isContract = tx.to === '' || tx.input !== '0x';
    normalized.push({
      type: isContract ? 'CONTRACT_CALL' : 'ETH_TRANSFER',
      label: isContract
        ? `Interacted with contract at ${shorten(tx.to)}`
        : `Sent ${Number(tx.value) / 1e18} ETH to ${shorten(tx.to)}`,
      from: tx.from,
      to: tx.to,
      txHash: tx.hash,
      date: unixToDate(tx.timeStamp),
      value: `${Number(tx.value) / 1e18} ETH`,
      gasUsed: tx.gasUsed,
      contractAddress: tx.to,
    });
  }

  // 🔹 Normalize ERC-20 token transfers
  for (const token of tokens) {
    normalized.push({
      type: 'ERC20_TRANSFER',
      label: `Sent ${Number(token.value) / 10 ** token.tokenDecimal} ${
        token.tokenSymbol
      } to ${shorten(token.to)}`,
      from: token.from,
      to: token.to,
      txHash: token.hash,
      date: unixToDate(token.timeStamp),
      value: `${Number(token.value) / 10 ** token.tokenDecimal} ${
        token.tokenSymbol
      }`,
      contractAddress: token.contractAddress,
      tokenSymbol: token.tokenSymbol,
      tokenName: token.tokenName,
    });
  }

  // 🔹 Normalize NFT transfers
  for (const nft of nfts) {
    const isMint = nft.from === '0x0000000000000000000000000000000000000000';

    const metadata = await fetchOpenSeaMetadata(
      nft.contractAddress,
      nft.tokenID
    );

    if (!metadata) {
      throw new Error('Failed to fetch metadata');
    }

    // tx.nftName = metadata?.name || `${tx.tokenName} #${tx.tokenId}`;
    normalized.push({
      type: isMint ? 'NFT_MINT' : 'NFT_TRANSFER',
      label: isMint
        ? `Minted ${nft.tokenName} #${nft.tokenID}`
        : `Received ${nft.tokenName} #${nft.tokenID}`,
      from: nft.from,
      to: nft.to,
      txHash: nft.hash,
      date: unixToDate(nft.timeStamp),
      tokenId: nft.tokenID,
      tokenName: nft.tokenName,
      tokenSymbol: nft.tokenSymbol,
      contractAddress: nft.contractAddress,
      image: metadata?.image || null,
    });
  }

  // 🔃 Sort all entries by time (latest last)
  normalized.sort((a, b) => new Date(a.date) - new Date(b.date));
  return {
    address,
    page,
    limit,
    timeline: normalized,
  };
}

module.exports = { getWalletData };
