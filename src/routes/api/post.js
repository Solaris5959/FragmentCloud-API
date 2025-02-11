const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const contentType = require('content-type');

module.exports = async (req, res) => {
  const { type } = contentType.parse(req);

  logger.debug('POST Request with fragment of type: ' + type);

  const rawFragmentData = req.body;
  logger.debug(`Fragment body: ${rawFragmentData}`);

  if (!Buffer.isBuffer(rawFragmentData)) {
    logger.error({ type }, 'Attempted to store non-supported fragment type');
    res.status(415).json(createErrorResponse(415, 'Fragment type not supported'));
    return;
  }

  logger.debug({ contentType: type }, 'Content-Type accepted');

  let fragment;

  logger.debug(`User creating fragment: ${req.user}`);

  fragment = new Fragment({ ownerId: req.user, type: type });

  await fragment.save();
  await fragment.setData(rawFragmentData);

  logger.debug({ fragment }, 'Fragment created');

  const host = process.env.API_URL || req.headers.host;
  const location = `http://${host}/v1/fragments/${fragment.id}`;

  res
    .status(201)
    .location(location)
    .json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
        },
      })
    );
};
