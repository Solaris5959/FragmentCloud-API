// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');
const md = require('markdown-it')();

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data/memory');

const validTypes = [
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  // 'image/png',
  // 'image/jpeg',
  // 'image/webp',
  // 'image/gif',
];

//const { read } = require('fs'); // Not sure what this is needed for

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (typeof size !== 'number' || size < 0) {
      throw new Error('Size must be a positive number');
    }
    if (!Fragment.isSupportedType(type)) {
      throw new Error(`type must be a supported type and got ${type}`);
    }
    if (ownerId === undefined || type === undefined) {
      throw new Error('OwnerId and type must be defined');
    }
    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.type = type;
    this.size = size;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    return listFragments(ownerId, expand);
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);

    if (!fragment) {
      throw new Error(`Fragment not found for ownerId=${ownerId} and id=${id}`);
    } else {
      return new Fragment({
        id: fragment.id,
        ownerId: fragment.ownerId,
        created: fragment.created,
        updated: fragment.updated,
        type: fragment.type,
        size: fragment.size,
      });
    }
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment (metadata) to the database
   * @returns Promise<void>
   */
  save() {
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer');
    }

    this.size = data.length;
    await this.save();
    return writeFragmentData(this.ownerId, this.id, data);
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    const primaryType = this.mimeType.split('/')[0];
    return primaryType === 'text';
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    const validConversions = {
      'text/plain': ['text/plain'],
      'text/markdown': ['text/markdown', 'text/html'],
      'text/html': ['text/html'],
      'application/json': ['application/json'],
    };

    return validConversions[this.mimeType] || false;
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    return validTypes.includes(contentType.parse(value).type);
  }

  async convertTo(type) {
    const fragmentData = await this.getData();
    const fragmentType = this.type;

    const conversionMap = {
      'text/plain': {
        'text/plain': () => fragmentData,
      },
      'text/markdown': {
        'text/markdown': () => fragmentData,
        'text/html': async () => md.render(fragmentData.toString('utf8')),
      },
      'text/html': {
        'text/html': () => fragmentData,
      },
      'application/json': {
        'application/json': () => fragmentData,
      },
    };

    if (conversionMap[fragmentType] && conversionMap[fragmentType][type]) {
      return conversionMap[fragmentType][type]();
    } else {
      throw new Error(`Conversion from ${fragmentType} to ${type} is not supported`);
    }
  }
}

module.exports = {
  Fragment,
};
