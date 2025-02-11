const express = require('express');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const { getFragments, getFragmentByID } = require('./get');

const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      // See if we can parse this content type. If we can, `req.body` will be
      // a Buffer (e.g., `Buffer.isBuffer(req.body) === true`). If not, `req.body`
      // will be equal to an empty Object `{}` and `Buffer.isBuffer(req.body) === false`
      const { type } = contentType.parse(req);
      return Fragment.isSupportedType(type);
    },
  });

// Create a router on which to mount our API endpoints
const router = express.Router();

// Define our first route, which will be: GET /v1/fragments
router.get('/fragments', getFragments);
// Get /v1/fragments/:id
router.get('/fragments/:id', getFragmentByID);
// Post /v1/fragment
router.post('/fragments', rawBody(), require('./post'));

module.exports = router;
