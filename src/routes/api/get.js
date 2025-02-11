const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

/**
 * Get a list of fragments for the current user
 */
const getFragments = async (req, res) => {
  logger.debug(`Get all fragments for "${req.user}"`);

  try {
    const expand = req.query.expand || 0;
    const fragments = await Fragment.byUser(req.user, expand);

    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (error) {
    logger.error(`Error while trying to get the fragments for "${req.user}": ${error}`);
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};

const splitExtension = (id) => {
  const arr = id.split('.');
  const extension = arr[1] ? '.' + arr[1] : null;

  return { fragmentId: arr[0], extension: extension };
};

/**
 * Get the fragment with the passed ID for user with OwnerID
 */
const getFragmentByID = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user;
  logger.debug(`Get fragment by ID ${id} for user ${ownerId}`);

  let { fragmentId } = splitExtension(id);

  let fragment, fragmentMetadata;
  try {
    fragmentMetadata = await Fragment.byId(ownerId, fragmentId);

    logger.debug({ fragmentMetadata }, 'Fragment Metadata');

    fragment = new Fragment(fragmentMetadata);

    const fragmentData = await fragment.getData();

    res.status(200).type(fragment.mimeType).send(fragmentData);
  } catch (error) {
    logger.error(`No fragment with ID ${fragmentId} found. Error: ${error}`);
    res.status(404).json(createErrorResponse(404, `No fragment with ID ${fragmentId} found`));
    return;
  }
};

module.exports = {
  getFragments,
  getFragmentByID,
};
