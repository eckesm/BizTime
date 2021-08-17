const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(`SELECT id, comp_code FROM invoices`);
		return res.json({ invoices: results.rows });
	} catch (e) {
		return next(e);
	}
});

router.get('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const invoiceResults = await db.query(`SELECT * FROM invoices WHERE id=$1`, [ id ]);
		if (invoiceResults.rows.length === 0) {
			throw new ExpressError(`Cannot find invoice with id of ${id}.`, 404);
		}
		const code = invoiceResults.rows[0].comp_code;
		const companyResults = await db.query(`SELECT * FROM companies WHERE code=$1`, [ code ]);
		if (companyResults.rows.length === 0) {
			throw new ExpressError(`Cannot find company with code of ${code}.`, 404);
		}
		return res.json({
			invoice : {
				id        : invoiceResults.rows[0].id,
				amt       : invoiceResults.rows[0].amt,
				paid      : invoiceResults.rows[0].paid,
				add_date  : invoiceResults.rows[0].add_date,
				paid_date : invoiceResults.rows[0].paid_date,
				company   : companyResults.rows[0]
			}
		});
	} catch (e) {
		return next(e);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { amt, comp_code } = req.body;
		const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`, [
			comp_code,
			amt
		]);
		return res.status(201).json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.put('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const { amt, paid } = req.body;
		const results = await db.query(`UPDATE invoices SET amt = $2, paid = $3 WHERE id = $1 RETURNING *`, [
			id,
			amt,
			paid
		]);
		if (results.rows.length === 0) {
			throw new ExpressError(`Cannot find invoice with id of ${id}.`, 404);
		}
		return res.json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.delete('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const results = await db.query(`DELETE FROM invoices WHERE id = $1`, [ id ]);
		return res.json({ status: 'deleted' });
	} catch (e) {
		return next(e);
	}
});

router.get('/companies/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const companyResults = await db.query(`SELECT * FROM companies WHERE code = $1`, [ code ]);
		if (companyResults.rows.length === 0) {
			throw new ExpressError(`Cannot find company with code of ${code}.`, 404);
		}
		const comp_code = companyResults.rows[0].code;
		const invoiceResults = await db.query(`SELECT * FROM invoices WHERE comp_code = $1`, [ comp_code ]);
		// if (invoiceResults.rows.length === 0) {
		// 	throw new ExpressError(`There are no invoices for ${companyResults.rows[0].name}.`, 200);
		// }
		return res.json({
			company : {
				...companyResults.rows,
				invoices : invoiceResults.rows
			}
		});
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
