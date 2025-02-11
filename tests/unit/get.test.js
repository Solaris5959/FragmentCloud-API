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
});
