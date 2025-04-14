const request = require('supertest');
const hash = require('../../src/hash');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('DELETE /v1/fragments/:id', () => {
  test('Create and delete fragment', async () => {
    const ownerId = hash('user1@email.com');
    const id = '5959';
    const fragmentMetadata = new Fragment({ id: id, ownerId: ownerId, type: 'text/plain' });
    const body = Buffer.from('Deleting our Fragments');
    fragmentMetadata.save();
    fragmentMetadata.setData(body);

    const delRes = await request(app)
      .delete(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.status).toBe('ok');

    // Check that the fragment is deleted
    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(getRes.statusCode).toBe(404);
  });

  test("Throws 404 if Fragment doesn't exist", async () => {
    const id = '5959';

    const res = await request(app)
      .delete(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });
});
