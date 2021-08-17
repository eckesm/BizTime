process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
beforeEach(async () => {
	const result = await db.query(
		`INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple', 'Makers of OSX.') RETURNING code, name, description`
	);
	testCompany = result.rows[0];
});

afterEach(async () => {
	await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
	await db.end();
});

describe('GET /companies', () => {
	test('Get a list of all companies', async () => {
		const res = await request(app).get(`/companies`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ companies: [ testCompany ] });
	});
});

describe('GET /companies/:id', () => {
	test('Get a single company', async () => {
		const res = await request(app).get(`/companies/${testCompany.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ company: testCompany });
	});
	test('Responds with 404 for invalid company id', async () => {
		const res = await request(app).get(`/companies/incorrect_company_code`);
		expect(res.statusCode).toBe(404);
	});
});

const newTestCompany = {
	code        : 'msft',
	name        : 'Microsoft',
	description : 'Makers of Microsoft.'
};
describe('POST /companies', () => {
	test('Creates a single company', async () => {
		const res = await request(app).post(`/companies`).send(newTestCompany);
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({ company: newTestCompany });
	});
});

const updateTestCompany = {
	code        : 'apple',
	name        : 'Mac',
	description : 'Makers of Apple OSX.'
};
describe('PUT /companies', () => {
	test('Update a single company', async () => {
		const res = await request(app).put(`/companies/${testCompany.code}`).send(updateTestCompany);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ company: updateTestCompany });
	});
	test('Responds with 404 for invalid company id', async () => {
		const res = await request(app).put(`/companies/incorrect_company_code`);
		expect(res.statusCode).toBe(404);
	});
});

describe('DELETE /companies/:id', () => {
	test('Delete a single company', async () => {
		const res = await request(app).delete(`/companies/${testCompany.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ status: 'deleted' });
	});
});
