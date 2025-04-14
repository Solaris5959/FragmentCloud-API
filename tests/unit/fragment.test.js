const { Fragment } = require('../../src/model/fragment');
const sharp = require('sharp');

// Wait for a certain number of ms (default 50). Used for waiting for async functions.
const wait = async (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

const validTypes = [
  `text/plain`,
  `text/markdown`,
  `text/html`,
  `application/json`,
  `image/png`,
  `image/jpeg`,
  `image/webp`,
  `image/gif`,
];

describe('Fragment class', () => {
  test('common formats are supported', () => {
    validTypes.forEach((format) => expect(Fragment.isSupportedType(format)).toBe(true));
  });

  describe('Fragment()', () => {
    test('ownerId and type are required', () => {
      expect(() => new Fragment({})).toThrow();
    });

    test('ownerId is required', () => {
      expect(() => new Fragment({ type: 'text/plain', size: 1 })).toThrow();
    });

    test('type is required', () => {
      expect(() => new Fragment({ ownerId: '1234', size: 1 })).toThrow();
    });

    test('type can be a simple media type', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.type).toEqual('text/plain');
    });

    test('type can include a charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.type).toEqual('text/plain; charset=utf-8');
    });

    test('size gets set to 0 if missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      expect(fragment.size).toBe(0);
    });

    test('size must be a number', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: '1' })).toThrow();
    });

    test('size can be 0', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })).not.toThrow();
    });

    test('size cannot be negative', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: -1 })).toThrow();
    });

    test('invalid types throw', () => {
      expect(
        () => new Fragment({ ownerId: '1234', type: 'application/msword', size: 1 })
      ).toThrow();
    });

    test('valid types can be set', () => {
      validTypes.forEach((format) => {
        const fragment = new Fragment({ ownerId: '1234', type: format, size: 1 });
        expect(fragment.type).toEqual(format);
      });
    });

    test('fragments have an id', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 1 });
      expect(fragment.id).toMatch(
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
      );
    });

    test('fragments use id passed in if present', () => {
      const fragment = new Fragment({
        id: 'id',
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(fragment.id).toEqual('id');
    });

    test('fragments get a created datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(Date.parse(fragment.created)).not.toBeNaN();
    });

    test('fragments get an updated datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(Date.parse(fragment.updated)).not.toBeNaN();
    });
  });

  describe('isSupportedType()', () => {
    test('common text types are supported, with and without charset', () => {
      expect(Fragment.isSupportedType('text/plain')).toBe(true);
      expect(Fragment.isSupportedType('text/plain; charset=utf-8')).toBe(true);
      expect(Fragment.isSupportedType('text/markdown')).toBe(true);
      expect(Fragment.isSupportedType('text/html')).toBe(true);
      expect(Fragment.isSupportedType('application/json')).toBe(true);
      expect(Fragment.isSupportedType('application/json; charset=utf-8')).toBe(true);
      expect(Fragment.isSupportedType('image/png')).toBe(true);
      expect(Fragment.isSupportedType('image/jpeg')).toBe(true);
      expect(Fragment.isSupportedType('image/webp')).toBe(true);
      expect(Fragment.isSupportedType('image/gif')).toBe(true);
    });

    test('other types are not supported', () => {
      expect(Fragment.isSupportedType('application/octet-stream')).toBe(false);
      expect(Fragment.isSupportedType('application/msword')).toBe(false);
      expect(Fragment.isSupportedType('audio/webm')).toBe(false);
      expect(Fragment.isSupportedType('video/ogg')).toBe(false);
    });
  });

  describe('mimeType, isText', () => {
    test('mimeType returns the mime type without charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.type).toEqual('text/plain; charset=utf-8');
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('mimeType returns the mime type if charset is missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.type).toEqual('text/plain');
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('isText return expected results', () => {
      // Text fragment
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.isText).toBe(true);
    });
  });

  describe('formats', () => {
    test('formats returns the expected result for plain text', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.formats).toEqual(['text/plain']);
    });

    test('formats returns the expected result for HTML', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/html; charset=utf-8',
        size: 0,
      });
      expect(fragment.formats).toEqual(['text/html', 'text/plain']);
    });

    test('formats returns the expected result for Markdown', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/markdown; charset=utf-8',
        size: 0,
      });
      expect(fragment.formats).toEqual(['text/markdown', 'text/html', 'text/plain']);
    });

    test('formats returns the expected result for JSON', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'application/json; charset=utf-8',
        size: 0,
      });
      expect(fragment.formats).toEqual(['application/json', 'text/plain']);
    });

    test('formats returns the expected result for PNG', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'image/png',
        size: 0,
      });
      expect(fragment.formats).toEqual(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
    });
    test('formats returns the expected result for JPEG', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'image/jpeg',
        size: 0,
      });
      expect(fragment.formats).toEqual(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
    });
    test('formats returns the expected result for WEBP', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'image/webp',
        size: 0,
      });
      expect(fragment.formats).toEqual(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
    });
    test('formats returns the expected result for GIF', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'image/gif',
        size: 0,
      });
      expect(fragment.formats).toEqual(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
    });
  });

  describe('save(), getData(), setData(), byId(), byUser(), delete()', () => {
    test('byUser() returns an empty array if there are no fragments for this user', async () => {
      expect(await Fragment.byUser('1234')).toEqual([]);
    });

    test('a fragment can be created and save() stores a fragment for the user', async () => {
      const data = Buffer.from('hello');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      const fragment2 = await Fragment.byId('1234', fragment.id);
      expect(fragment2).toEqual(fragment);
      expect(await fragment2.getData()).toEqual(data);
    });

    test('save() updates the updated date/time of a fragment', async () => {
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      const modified1 = fragment.updated;
      await wait();
      await fragment.save();
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test('setData() updates the updated date/time of a fragment', async () => {
      const data = Buffer.from('hello');
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      const modified1 = fragment.updated;
      await wait();
      await fragment.setData(data);
      await wait();
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test("a fragment is added to the list of a user's fragments", async () => {
      const data = Buffer.from('hello');
      const ownerId = '5555';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      expect(await Fragment.byUser(ownerId)).toEqual([fragment.id]);
    });

    test('full fragments are returned when requested for a user', async () => {
      const data = Buffer.from('hello');
      const ownerId = '6666';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      expect(await Fragment.byUser(ownerId, true)).toEqual([fragment]);
    });

    test('setData() throws if not give a Buffer', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain', size: 0 });
      expect(() => fragment.setData()).rejects.toThrow();
    });

    test('setData() updates the fragment size', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));
      expect(fragment.size).toBe(1);

      await fragment.setData(Buffer.from('aa'));
      const { size } = await Fragment.byId('1234', fragment.id);
      expect(size).toBe(2);
    });

    test('a fragment can be deleted', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));

      await Fragment.delete('1234', fragment.id);
      expect(() => Fragment.byId('1234', fragment.id)).rejects.toThrow();
    });
  });

  describe('Type Conversions', () => {
    test('text/plain to text/plain', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('Hello'));

      const convertedData = await fragment.convertTo('text/plain');
      const originalData = await fragment.getData();

      expect(convertedData.equals(Buffer.from('Hello'))).toBe(true);
      expect(convertedData.equals(originalData)).toBe(true);
    });

    test('text/markdown to text/plain', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# Hello'));

      const convertedData = await fragment.convertTo('text/plain');
      const originalData = await fragment.getData();

      expect(convertedData.toString()).toBe('# Hello');
      expect(convertedData.equals(originalData)).toBe(true); // Because there is no parsing, the raw tags will still be present
    });

    test('text/markdown to text/markdown', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save;
      await fragment.setData(Buffer.from('# Hello'));

      const convertedData = await fragment.convertTo('text/markdown');
      const originalData = await fragment.getData();

      expect(convertedData.equals(Buffer.from('# Hello'))).toBe(true);
      expect(convertedData.equals(originalData)).toBe(true);
    });

    test('text/markdown to text/html', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# Hello'));

      const convertedFragmentData = await fragment.convertTo('text/html');

      expect(convertedFragmentData.toString()).toBe('<h1>Hello</h1>\n');
    });

    test('text/html to text/plain', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/html', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('<h1>Hello</h1>'));

      const convertedData = await fragment.convertTo('text/plain');
      const originalData = await fragment.getData();

      expect(convertedData.toString()).toBe('<h1>Hello</h1>');
      expect(convertedData.equals(originalData)).toBe(true);
    });

    test('text/html to text/html', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/html', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('<h1>Hello</h1>'));

      const convertedData = await fragment.convertTo('text/html');
      const originalData = await fragment.getData();

      expect(convertedData.equals(originalData)).toBe(true);
    });

    test('application/json to text/plain', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });
      await fragment.save();
      const body = { text: 'Hello' };
      await fragment.setData(Buffer.from(JSON.stringify(body)));

      const convertedData = await fragment.convertTo('text/plain');
      const originalData = await fragment.getData();

      expect(convertedData.toString()).toBe(JSON.stringify(body));
      expect(convertedData.equals(originalData)).toBe(true);
    });

    test('application/json to application/json', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });
      await fragment.save();
      const body = { text: 'Hello' };
      await fragment.setData(Buffer.from(JSON.stringify(body)));

      const convertedData = JSON.parse(await fragment.convertTo('application/json'));
      const originalData = JSON.parse(await fragment.getData());

      expect(convertedData).toStrictEqual(body);
      expect(convertedData).toStrictEqual(originalData);
    });

    describe('Image Conversions', () => {
      test('image/png to image/png', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.png').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/png');
        const originalData = await fragment.getData();

        expect(convertedData.equals(originalData)).toBe(true);
      });

      test('image/png to image/jpeg', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.png').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/jpeg');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('jpeg');

        const inputRaw = await sharp(originalData).resize(1, 1).removeAlpha().raw().toBuffer(); // Remove alpha from all Webp/Jpeg -> Gif and vice versa as they do not have alpha channels
        const convertedRaw = await sharp(convertedData).resize(1, 1).removeAlpha().raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/png to image/webp', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.png').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/webp');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('webp');

        const inputRaw = await sharp(originalData).resize(1, 1).removeAlpha().raw().toBuffer();
        const convertedRaw = await sharp(convertedData).resize(1, 1).removeAlpha().raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/png to image/gif', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.png').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/gif');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('gif');

        const inputRaw = await sharp(originalData).resize(1, 1).removeAlpha().raw().toBuffer();
        const convertedRaw = await sharp(convertedData).resize(1, 1).removeAlpha().raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/jpeg to image/png', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/jpeg', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.jpeg').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/png');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('png');

        const inputRaw = await sharp(originalData).resize(1, 1).raw().toBuffer();
        const convertedRaw = await sharp(convertedData).resize(1, 1).raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/jpeg to image/jpeg', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/jpeg', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.jpeg').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/jpeg');
        const originalData = await fragment.getData();

        expect(convertedData.equals(originalData)).toBe(true);
      });

      test('image/jpeg to image/webp', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/jpeg', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.jpeg').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/webp');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('webp');

        const inputRaw = await sharp(originalData).resize(1, 1).raw().toBuffer();
        const convertedRaw = await sharp(convertedData).resize(1, 1).raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/jpeg to image/gif', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/jpeg', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.jpeg').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/gif');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('gif');

        const inputRaw = await sharp(originalData).resize(1, 1).removeAlpha().raw().toBuffer();
        const convertedRaw = await sharp(convertedData).resize(1, 1).removeAlpha().raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/webp to image/png', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/webp', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.webp').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/png');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('png');

        const inputRaw = await sharp(originalData).resize(1, 1).raw().toBuffer();
        const convertedRaw = await sharp(convertedData).resize(1, 1).raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/webp to image/jpeg', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/webp', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.webp').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/jpeg');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('jpeg');

        const inputRaw = await sharp(originalData).resize(1, 1).raw().toBuffer();
        const convertedRaw = await sharp(convertedData).resize(1, 1).raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/webp to image/webp', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/webp', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.webp').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/webp');
        const originalData = await fragment.getData();

        expect(convertedData.equals(originalData)).toBe(true);
      });

      test('image/webp to image/gif', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/webp', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.webp').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/gif');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('gif');

        const inputRaw = await sharp(originalData).resize(1, 1).removeAlpha().raw().toBuffer();
        const convertedRaw = await sharp(convertedData).resize(1, 1).removeAlpha().raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/gif to image/png', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/gif', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.gif').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/png');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('png');

        const inputRaw = await sharp(originalData).resize(1, 1).raw().toBuffer();
        const convertedRaw = await sharp(convertedData).resize(1, 1).raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/gif to image/jpeg', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/gif', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.gif').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/jpeg');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('jpeg');

        const inputRaw = await sharp(originalData).resize(1, 1).removeAlpha().raw().toBuffer();
        const convertedRaw = await sharp(convertedData).resize(1, 1).removeAlpha().raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/gif to image/webp', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/gif', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.gif').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/webp');
        const originalData = await fragment.getData();

        const convertedMeta = await sharp(convertedData).metadata();
        expect(convertedMeta.format).toBe('webp');

        const inputRaw = await sharp(originalData).resize(1, 1).removeAlpha().raw().toBuffer();
        const convertedRaw = await sharp(convertedData).resize(1, 1).removeAlpha().raw().toBuffer();

        expect(convertedRaw.equals(inputRaw)).toBe(true);
      });

      test('image/gif to image/gif', async () => {
        const fragment = new Fragment({ ownerId: '1234', type: 'image/gif', size: 0 });
        await fragment.save();
        const data = await sharp('tests/unit/test.gif').toBuffer();
        await fragment.setData(data);

        const convertedData = await fragment.convertTo('image/gif');
        const originalData = await fragment.getData();

        expect(convertedData.equals(originalData)).toBe(true);
      });
    });
  });
});
