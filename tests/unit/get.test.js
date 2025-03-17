const request = require('supertest');

const { Fragment } = require('../../src/model/fragment');
const hash = require('../../src/hash');
const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  // fetching correct fragments
  test('fetching correct fragments', async () => {
    const ownerId = hash('user1@email.com');
    const id = '1234';
    const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    const body = 'Hello World';
    fragment.save();
    fragment.setData(Buffer.from(body));

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');

    expect(res.body.fragments[0]).toBe(id);
  });
});

// Get all fragments with expand=1
describe('/v1/fragments?expand=1', () => {
  test('fetching correct fragments when passed expand=1', async () => {
    const ownerId = hash('user1@email.com');
    const id = '1234';
    const type = 'text/plain';
    const fragment = new Fragment({ id: id, ownerId: ownerId, type: type });
    const body = 'This is a fragment';
    fragment.setData(Buffer.from(body));
    fragment.save();

    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');

    expect(res.body.fragments[0].id).toBe(id);
    expect(res.body.fragments[0].ownerId).toBe(hash('user1@email.com'));
    expect(res.body.fragments[0].type).toBe(type);
  });
});

// Get specific fragment from ID
describe('GET /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/ecdca9b2-b841-47e5-be4d-7f880d3c8c59').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/ecdca9b2-b841-47e5-be4d-7f880d3c8c59')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Throws 404 Error if fragment not found
  test('should return HTTP 404 error if fragment not found', async () => {
    const res = await request(app).get('/v1/fragments/0').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
  });

  // return specific fragment data without post request creation
  test('return fragment data by id without POST request', async () => {
    const ownerId = hash('user1@email.com');
    const id = '1234';
    const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    const body = 'Hello World';
    fragment.save();
    fragment.setData(Buffer.from(body));

    const res = await request(app).get(`/v1/fragments/${id}`).auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(body);
  });

  // return specific fragment data
  test('return fragment data by id', async () => {
    const ownerId = hash('user1@email.com');
    const id = '1234';
    const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    const body = 'Hello World';
    fragment.save();
    fragment.setData(Buffer.from(body));

    const res = await request(app).get(`/v1/fragments/${id}`).auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(body);
  });

  test('return fragment with markdown type', async () => {
    const ownerId = hash('user1@email.com');
    const id = '4321';
    const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'text/markdown' });
    const body = '# Hello World\n';
    fragment.save();
    fragment.setData(Buffer.from(body));

    const res = await request(app).get(`/v1/fragments/${id}`).auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('# Hello World\n');
  });

  test('return fragment with html type', async () => {
    const ownerId = hash('user1@email.com');
    const id = '1324';
    const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'text/html' });
    const body = '<h1>Hello World</h1>';
    fragment.save();
    fragment.setData(Buffer.from(body));

    const res = await request(app).get(`/v1/fragments/${id}`).auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('<h1>Hello World</h1>');
  });

  test('return fragment with json type', async () => {
    const ownerId = hash('user1@email.com');
    const id = '1423';
    const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'application/json' });
    const body = { key: 'value' };
    fragment.save();
    fragment.setData(Buffer.from(JSON.stringify(body)));

    const res = await request(app).get(`/v1/fragments/${id}`).auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.text)).toStrictEqual({ key: 'value' });
  });
});

// Get metadata of specific fragments from ID
describe('GET /v1/fragments/:id/info', () => {
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/123/info').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/123/info')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Using a valid username/password pair should return fragment info
  test('Successful read of fragment metadata', async () => {
    const ownerId = hash('user1@email.com');
    const body = 'Hello';
    const contentType = 'text/plain';
    const id = 'rmdID';
    const fragMetadata = new Fragment({ id: id, ownerId: ownerId, type: contentType });

    fragMetadata.setData(Buffer.from(body));
    fragMetadata.save();

    const res = await request(app)
      .get(`/v1/fragments/${id}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.fragment.id).toBe(id);
    expect(res.body.fragment.ownerId).toBe(ownerId);
    expect(res.body.fragment.type).toBe(contentType);
    expect(res.body.fragment.size).toBe(body.length);
  });

  // Requesting info for a non-existent fragment should return 404
  test('requesting info for non-existent fragment returns 404', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id/info')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('No fragment with ID nonexistent-id found');
  });
});

// Get & convert specific fragment from ID
describe('GET /v1/fragments/:id.extension', () => {
  describe('Same type conversion', () => {
    test('Return fragment with Plaintext -> Plaintext type', async () => {
      const ownerId = hash('user1@email.com');
      const id = '1537';
      const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
      const body = 'Hello World';
      fragment.save();
      fragment.setData(Buffer.from(body));

      const res = await request(app)
        .get(`/v1/fragments/${id}.txt`)
        .auth('user1@email.com', 'password1');

      expect(res.text).toBe('Hello World');
      expect(res.statusCode).toBe(200);
    });

    test('Return fragment with Markdown -> Markdown type', async () => {
      const ownerId = hash('user1@email.com');
      const id = '4321';
      const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'text/markdown' });
      const body = '# Hello World\n';
      fragment.save();
      fragment.setData(Buffer.from(body));

      const res = await request(app)
        .get(`/v1/fragments/${id}.md`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.text).toBe('# Hello World\n');
    });

    test('Return fragment with HTML -> HTML type', async () => {
      const ownerId = hash('user1@email.com');
      const id = '4321';
      const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'text/html' });
      const body = '<h1>Hello World</h1>';
      fragment.save();
      fragment.setData(Buffer.from(body));

      const res = await request(app)
        .get(`/v1/fragments/${id}.html`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.text).toBe('<h1>Hello World</h1>');
    });

    test('Return fragment with JSON -> JSON type', async () => {
      const ownerId = hash('user1@email.com');
      const id = '4321';
      const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'application/json' });
      const body = { key: 'value' };
      fragment.save();
      fragment.setData(Buffer.from(JSON.stringify(body)));

      const res = await request(app)
        .get(`/v1/fragments/${id}.json`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.text)).toStrictEqual({ key: 'value' });
    });
  });

  describe('Conversion between types', () => {
    test('Unsupported but Valid Conversion', async () => {
      const ownerId = hash('user1@email.com');
      const id = '9834';
      const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
      const body = 'Hello World';
      fragment.save();
      fragment.setData(Buffer.from(body));

      const res = await request(app)
        .get(`/v1/fragments/${id}.html`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(415);
      expect(res.text).toContain('Error while converting the fragment');
    });

    test('Unsupported Conversion', async () => {
      const ownerId = hash('user1@email.com');
      const id = '6824';
      const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
      const body = 'Hello World';
      fragment.save();
      fragment.setData(Buffer.from(body));

      const res = await request(app)
        .get(`/v1/fragments/${id}.webm`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(415);
      expect(res.text).toContain('The requested extension is not currently supported');
    });

    test('Return fragment with Markdown -> HTML type', async () => {
      const ownerId = hash('user1@email.com');
      const id = '4321';
      const fragment = new Fragment({ id: id, ownerId: ownerId, type: 'text/markdown' });
      const body = '# Hello World';
      fragment.save();
      fragment.setData(Buffer.from(body));

      const res = await request(app)
        .get(`/v1/fragments/${id}.html`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.text).toBe('<h1>Hello World</h1>\n');
    });
  });
});
