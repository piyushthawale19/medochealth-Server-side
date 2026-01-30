const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/token.controller');

router.post('/', tokenController.requestToken);
router.delete('/:tokenId/cancel', tokenController.cancelToken);
router.get('/:tokenId/status', tokenController.getTokenStatus);

module.exports = router;
