const logger = require('../../logger');
logger.debug('Loading data model');
if (process.env.AWS_REGION) {
  logger.debug('Using S3 data model');
} else {
  logger.debug('Using memory data model');
}
module.exports = process.env.AWS_REGION ? require('./aws') : require('./memory');
