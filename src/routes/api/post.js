const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const contentType = require('content-type');

module.exports = async (req, res) => {
  const { type } = contentType.parse(req);
  const charset = contentType.parse(req).parameters.charset;

  logger.debug('POST Request with fragment of type: ' + type + ' ' + charset);

  const rawFragmentData = req.body;
  logger.debug(`Fragment body: ${rawFragmentData}`);

  if (!Buffer.isBuffer(rawFragmentData) || !Fragment.isSupportedType(type)) {
    logger.error({ type }, 'Attempted to store non-supported fragment type');
    res.status(415).json(createErrorResponse(415, 'Fragment type not supported'));
    return;
  }

  logger.debug({ contentType: type, charset: charset }, 'Content-Type accepted');

  let fragment;

  logger.debug(`User creating fragment: ${req.user}`);

  if (typeof charset !== 'undefined')
    fragment = new Fragment({ ownerId: req.user, type: type + '; charset=' + charset });
  else fragment = new Fragment({ ownerId: req.user, type: type });

  try {
    await fragment.save();
    await fragment.setData(rawFragmentData);

    logger.debug({ fragment }, 'Fragment created');

    const host = process.env.API_URL || req.headers.host;
    const cleanHost = host.replace(/^http?:\/\//i, '');
    const location = `http://${cleanHost}/v1/fragments/${fragment.id}`;

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
  } catch (err) {
    logger.error({ err }, 'Failed to save fragment');
    res
      .status(500)
      .json(createErrorResponse(500, 'Internal Server Error: Failed to save fragment'));
    return;
  }
};
