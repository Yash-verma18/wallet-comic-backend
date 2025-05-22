const express = require('express');
const router = express.Router();
const etherscanService = require('../services/etherscanService');

router.get('/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const data = await etherscanService.getWalletData(address, page, limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet data' });
  }
});

module.exports = router;
