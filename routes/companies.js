const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(`SELECT * FROM companies`);
		return res.json({ companies: results.rows });
	} catch (e) {
		return next(e);
	}
});

router.get('/:code', async (req, res, next) => {
	try {
		const comp_code = req.params.code;
		const results = await db.query(
			`SELECT c.code, c.name, c.description, i.industry
			FROM companies AS c
			LEFT JOIN companies_industries AS ci
			ON c.code = ci.company_code
			LEFT JOIN industries AS i
			ON ci.industry_code = i.code
			WHERE c.code = $1`,
			[ comp_code ]
		);

		if (results.rows.length === 0) {
			throw new ExpressError(`Cannot find company with code of ${code}.`, 404);
		}

		let { code, name, description } = results.rows[0];
		let industries = results.rows.map(i => i.industry);

		// return res.json({ company: results.rows[0] });
		return res.json({ company: { code, name, description, industries } });
	} catch (e) {
		return next(e);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { description, name } = req.body;
		const code = slugify(name, { lower: true });
		const results = await db.query(
			`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`,
			[ code, name, description ]
		);
		return res.status(201).json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.put('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const { description, name } = req.body;
		const results = await db.query(`UPDATE companies SET name = $2, description = $3 WHERE code = $1 RETURNING *`, [
			code,
			name,
			description
		]);
		if (results.rows.length === 0) {
			throw new ExpressError(`Cannot find company with code of ${code}.`, 404);
		}
		return res.json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.delete('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const results = await db.query(`DELETE FROM companies WHERE code = $1`, [ code ]);
		// if (results.rows.length === 0) {
		// 	throw new ExpressError(`Cannot find company with code of ${code}.`, 404);
		// }
		return res.json({ status: 'deleted' });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
