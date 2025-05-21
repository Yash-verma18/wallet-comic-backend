const express = require('express');
const router = express.Router();
const etherscanService = require('../services/etherscanService');

router.get('/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const data = await etherscanService.getWalletData(address);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet data' });
  }
});

module.exports = router;
