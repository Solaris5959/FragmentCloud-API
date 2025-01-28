const { createSuccessResponse } = require('../../response');

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  const response = createSuccessResponse({ fragments: ['fragment1', 'fragment2'] });

  res.status(200).json(response);
};
