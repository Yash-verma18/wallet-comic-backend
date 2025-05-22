const axios = require('axios');

const openSeaKey = process.env.OPENSEA_API_KEY;

async function fetchOpenSeaMetadata(contractAddress, tokenId) {
  try {
    const url = `https://api.opensea.io/api/v2/chain/ethereum/contract/${contractAddress}/nfts/${tokenId}`;

    const response = await axios.get(url, {
      headers: {
        'x-api-key': openSeaKey,
      },
    });

    const data = response.data.nft;

    return {
      name: data.name,
      description: data.description,
      image: data.display_image_url || data.image_url,
      animation_url: data.display_animation_url || data.animation_url,
      traits: data.traits || [],
    };
  } catch (err) {
    console.error(`❌ Error fetching OpenSea metadata:`, err.message);
    return null;
  }
}

module.exports = { fetchOpenSeaMetadata };
