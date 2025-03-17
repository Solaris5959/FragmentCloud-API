const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const path = require('path');

const validTypeMap = {
  // '.txt': 'text/plain',
  // '.md': 'text/markdown',
  '.html': 'text/html',
  // '.json': 'application/json',
  // '.png': 'image/png',
  // '.jpg': 'image/jpeg',
  // '.jpeg': 'image/jpeg',
  // '.webp': 'image/webp',
  // '.gif': 'image/gif',
};

/**
 * Get a list of fragments for the current user
 */
const getFragments = async (req, res) => {
  logger.debug(`Get all fragments for "${req.user}"`);

  try {
    const expandMetadata = req.query.expand || 0;
    const fragments = await Fragment.byUser(req.user, expandMetadata);

    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (error) {
    logger.error(`Error while trying to get the fragments for "${req.user}": ${error}`);
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};

const splitExtension = (id) => {
  const extension = path.extname(id);
  const baseName = path.basename(id, extension);

  return { fragmentId: baseName, extension: extension || null };
};

/**
 * Get the fragment with the passed ID for user with OwnerID
 */
const getFragmentByID = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user;
  logger.debug(`Get fragment by ID ${id} for user ${ownerId}`);

  let { fragmentId, extension } = splitExtension(id);

  let fragment, fragmentData;
  try {
    fragment = await Fragment.byId(ownerId, fragmentId);

    logger.debug({ fragment }, 'Fragment found:');

    if (extension) {
      if (
        fragment.mimeType == 'text/markdown' && // Markdown req is for A2 as only md -> html is supported
        Fragment.isSupportedType(validTypeMap[extension])
      ) {
        logger.debug(`Fragment is being converted to type ${validTypeMap[extension]}`);

        try {
          fragmentData = await fragment.convertTo(extension);

          res.status(200).type(validTypeMap[extension]).send(fragmentData);
          return;
        } catch (error) {
          logger.error(
            `Error while trying to convert the fragment to type ${validTypeMap[extension]}: ${error}`
          );
          res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
          return;
        }
      } else {
        logger.error(`Fragment is not of type markdown or the extension is not supported.
          Fragment Type: ${fragment.mimeType}, Extension: ${extension}`);

        res
          .status(415)
          .json(
            createErrorResponse(415, 'Fragment cannot be converted into the requested extension')
          );
        return;
      }
    } else {
      fragmentData = await fragment.getData();

      res.status(200).type(fragment.mimeType).send(fragmentData);
    }
  } catch (error) {
    logger.error(`No fragment with ID ${fragmentId} found. Error: ${error}`);
    res.status(404).json(createErrorResponse(404, `No fragment with ID ${fragmentId} found`));
    return;
  }
};

const getFragmentInfo = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user;
  logger.debug(`Get fragment info by ID ${id} for user ${ownerId}`);

  let fragmentMetadata;
  try {
    fragmentMetadata = await Fragment.byId(ownerId, id);

    logger.debug({ fragmentMetadata }, 'Fragment Metadata found:');

    res.status(200).json(createSuccessResponse({ fragment: fragmentMetadata }));
    return;
  } catch (error) {
    logger.error(`No fragment with ID ${id} found. Error: ${error}`);
    res.status(404).json(createErrorResponse(404, `No fragment with ID ${id} found`));
    return;
  }
};

module.exports = {
  getFragments,
  getFragmentByID,
  getFragmentInfo,
};
