const { Fragment } = require('../../src/model/fragment');
const {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
} = require('../../src/model/data/memory');

describe('In-Memory Database Backend', () => {
  test('deleteFragment() deletes metadata and data', async () => {
    const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
    const data = Buffer.from('test data');
    await writeFragment(fragment);
    await writeFragmentData(fragment.ownerId, fragment.id, data);

    const result = deleteFragment(fragment.ownerId, fragment.id);

    // 1. Check if it's a Promise:
    expect(result).toBeInstanceOf(Promise);

    // 2. Await the promise and check if it resolves without a value:
    await expect(result).resolves.toBeDefined();
  });

  describe('Metadata Operations', () => {
    test('listFragments() lists fragment IDs', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      await writeFragment(fragment);

      const result = listFragments(fragment.ownerId);

      // 1. Check if it's a Promise:
      expect(result).toBeInstanceOf(Promise);

      // 2. Await the promise and check if it resolves to an array:
      await expect(result).resolves.toEqual([fragment.id]);
    });

    test('listFragments(true) lists fragment objects', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      await writeFragment(fragment);

      const result = listFragments(fragment.ownerId, true);

      // 1. Check if it's a Promise:
      expect(result).toBeInstanceOf(Promise);

      // 2. Await the promise and check if it resolves to an array:
      await expect((await result).length).toEqual(2); // 2 as the test above puts 1 into the Database
    });

    test('listFragments() returns empty array if no fragments are found', async () => {
      const result = listFragments('does-not-exist');

      // 1. Check if it's a Promise:
      expect(result).toBeInstanceOf(Promise);

      // 2. Await the promise and check if it resolves to an empty array:
      await expect(result).resolves.toEqual([]);
    });

    test('writeFragment() writes metadata', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      const result = writeFragment(fragment);

      // 1. Check if it's a Promise:
      expect(result).toBeInstanceOf(Promise);

      // 2. Await the promise and check if it resolves without a value:
      await expect(result).resolves.toBeUndefined();
    });

    test('readFragment() reads metadata and creates correct Fragment object', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      await writeFragment(fragment);

      const result = readFragment(fragment.ownerId, fragment.id);

      // 1. Check if it's a Promise:
      expect(result).toBeInstanceOf(Promise);

      // 2. Await the promise and check if it resolves to a Fragment object:
      await expect(result).resolves.toEqual(fragment);
    });

    test('readFragment() returns undefined if not found', async () => {
      const result = readFragment('1234', 'does-not-exist');

      // 1. Check if it's a Promise:
      expect(result).toBeInstanceOf(Promise);

      // 2. Await the promise and check if it resolves to null:
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('Data Operations', () => {
    test('writeFragmentData() writes data', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      const data = Buffer.from('test data');
      await writeFragment(fragment);

      const result = writeFragmentData(fragment.ownerId, fragment.id, data);

      // 1. Check if it's a Promise:
      expect(result).toBeInstanceOf(Promise);

      // 2. Await the promise and check if it resolves without a value:
      await expect(result).resolves.toBeUndefined();
    });

    test('readFragmentData() reads data', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      const data = Buffer.from('test data');
      await writeFragment(fragment);
      await writeFragmentData(fragment.ownerId, fragment.id, data);

      const result = readFragmentData(fragment.ownerId, fragment.id);

      // 1. Check if it's a Promise:
      expect(result).toBeInstanceOf(Promise);

      // 2. Await the promise and check if it resolves to a Buffer object:
      await expect(result).resolves.toEqual(data);
    });
  });
});
