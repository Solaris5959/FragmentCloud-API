const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const hash = require('../../src/hash');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('Should update specified fragment for given id with given new fragment', async () => {
    const ownerId = hash('user1@email.com');
    const id = '9583';
    const fragmentMetadata = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    const body = Buffer.from('This is a fragment');
    const updated_body = Buffer.from('This is updated fragment');
    fragmentMetadata.setData(body);
    fragmentMetadata.save();

    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(updated_body);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.id).toBe(id);

    // fetch updated body.
    const newData = await fragmentMetadata.getData();
    expect(newData.toString('UTF-8')).toBe(updated_body.toString('UTF-8'));
  });

  // Should throw if new content type is not supported
  test('Should throw if new content type is not supported', async () => {
    const ownerId = hash('user1@email.com');
    const id = '7801';
    const fragmentMetadata = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    const body = Buffer.from('This is a fragment');
    fragmentMetadata.save();
    fragmentMetadata.setData(body);

    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/abc')
      .send(body);
    expect(res.statusCode).toBe(415);
    expect(res.body.error.message).toBe('Unsupported fragment type requested by the client!');
  });

  // Should throw if fragment didn't exist
  test("Should throw if fragment didn't exist", async () => {
    const id = '4734';
    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a test fragment');
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe(`No fragment with ID ${id} found`);
  });

  // Should throw if new fragment content type is not same to prev content type
  test('Should throw if new fragment content type is not same to prev content type', async () => {
    const ownerId = hash('user1@email.com');
    const id = '1285';
    const fragmentMetadata = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    const body = Buffer.from('This is a fragment');
    const updated_body = Buffer.from('This is updated fragment');
    fragmentMetadata.save();
    fragmentMetadata.setData(body);

    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(updated_body);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toBe('Cannot change type of the fragment to text/html!');
  });
});
