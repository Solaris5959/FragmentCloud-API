const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

const { createSuccessResponse, createErrorResponse } = require('../../response');

const deleteFragmentByID = async (req, res) => {
  const ownerID = req.user;
  const { id } = req.params;

  logger.debug({ ownerID, id }, 'Delete request for fragment');

  try {
    await Fragment.delete(ownerID, id);
    res.status(200).json(createSuccessResponse(200, { message: 'Fragment deleted successfully' }));
  } catch (err) {
    logger.error(`No Fragment with the ID ${id} exists for user ${ownerID}. Error: ${err}`);
    res
      .status(404)
      .json(createErrorResponse(404, `No Fragment with the ID ${id} exists for user ${ownerID}`));
  }

  return;
};

module.exports = { deleteFragmentByID };
