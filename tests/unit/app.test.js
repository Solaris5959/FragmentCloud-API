const request = require('supertest');

const app = require('../../src/app');

describe('Application Tests', () => {
  test('404 Error Handling', () => request(app).get('/does-not-exist').expect(404));
});
