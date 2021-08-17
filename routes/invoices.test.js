process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
beforeAll(async () => {
	const result = await db.query(
		`INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple', 'Makers of OSX.') RETURNING code, name, description`
	);
	testCompany = result.rows[0];
});

let testInvoice;
beforeEach(async () => {
	const result = await db.query(
		`INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('apple', 300, true, null) RETURNING *`
	);
	testInvoice = result.rows[0];
});

afterEach(async () => {
	await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
	await db.query(`DELETE FROM companies`);
	await db.end();
});

describe('GET /invoices', () => {
	test('Get a list of all invoices', async () => {
		const res = await request(app).get(`/invoices`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoices : [
				{
					id        : testInvoice.id,
					comp_code : testInvoice.comp_code
				}
			]
		});
	});
});

describe('GET /invoices/:id', () => {
	test('Get a single invoice', async () => {
		const res = await request(app).get(`/invoices/${testInvoice.id}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoice : {
				id        : testInvoice.id,
				amt       : testInvoice.amt,
				paid      : testInvoice.paid,
				add_date  : expect.any(String),
				paid_date : testInvoice.paid_date,
				company   : testCompany
			}
		});
	});
	test('Responds with 404 for invalid invoice id', async () => {
		const res = await request(app).get(`/invoices/0`);
		expect(res.statusCode).toBe(404);
	});
});

const newTestInvoice = {
	comp_code : 'apple',
	amt       : 1000,
	paid      : false,
	paid_date : null
};
describe('POST /invoices', () => {
	test('Creates a single invoice', async () => {
		const res = await request(app).post(`/invoices`).send(newTestInvoice);
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			invoice : {
				...newTestInvoice,
				id       : expect.any(Number),
				add_date : expect.any(String)
			}
		});
	});
});

const updateTestInvoice = {
	comp_code : 'apple',
	amt       : 500,
	paid      : false
};
describe('PUT /invoices', () => {
	test('Update a single invoice', async () => {
		const res = await request(app).put(`/invoices/${testInvoice.id}`).send(updateTestInvoice);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoice : {
				...testInvoice,
				id        : testInvoice.id,
				add_date  : expect.any(String),
				amt       : updateTestInvoice.amt,
				paid      : updateTestInvoice.paid,
				paid_date : null
			}
		});
	});
	test('Responds with 404 for invalid invoice id', async () => {
		const res = await request(app).put(`/invoices/0`);
		expect(res.statusCode).toBe(404);
	});
});

describe('DELETE /invoices/:id', () => {
	test('Delete a single invoice', async () => {
		const res = await request(app).delete(`/invoices/${testInvoice.id}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ status: 'deleted' });
	});
});
