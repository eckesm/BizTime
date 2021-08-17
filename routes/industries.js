const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(
			`SELECT i.code, i.industry, c.code AS company_code
            FROM industries AS i
            LEFT JOIN companies_industries AS ci
            ON i.code = ci.industry_code
            LEFT JOIN companies AS c
            ON ci.company_code = c.code`
		);

		const industries = [];
		for (let i of results.rows) {
			let newIndustry = true;
			for (let ind of industries) {
				if (ind.code === i.code) {
					newIndustry = false;
					ind.companies.push(i.company_code);
				}
			}
			if (newIndustry === true) {
				industries.push({
					code      : i.code,
					industry  : i.industry,
					companies : [ i.company_code ]
				});
			}
		}

		return res.json({ industries });
	} catch (e) {
		return next(e);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { code, industry } = req.body;
		const results = await db.query(`INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING *`, [
			code,
			industry
		]);
		return res.status(201).json({ industry: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.post('/:industry_code/companies', async (req, res, next) => {
	try {
		const { industry_code } = req.params;
		const { comp_code } = req.body;
		const results = await db.query(
			`INSERT INTO companies_industries (company_code, industry_code) VALUES ($1, $2) RETURNING *`,
			[ comp_code, industry_code ]
		);

		// if (results.rows.length === 0) {
		// 	throw new ExpressError(`Cannot find industry and/or company.`, 404);
		// }

		return res.status(201).json({ industry: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
