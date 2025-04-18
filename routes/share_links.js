const express = require('express');
const router = express.Router();

const { createShareLink, getSharedTransactions, deleteSharedLinks, getSharedLinksByUserId } = require('../controllers/share_link');

router.route('/share-link').post(createShareLink);

router.route('/user-transactions/:token').get(getSharedTransactions);

router.route('/user-links/:id').get(getSharedLinksByUserId);

router.route('/:idOrToken').delete(deleteSharedLinks);

module.exports = router;