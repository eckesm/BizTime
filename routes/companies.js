const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

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
		const { code } = req.params;
		const results = await db.query(`SELECT * FROM companies WHERE code=$1`, [ code ]);
		if (results.rows.length === 0) {
			throw new ExpressError(`Cannot find company with code of ${code}.`, 404);
		}
		return res.json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { code, description, name } = req.body;
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
		const results = await db.query(`UPDATE companies SET name=$2, description=$3 WHERE code=$1 RETURNING *`, [
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
		const results = await db.query(`DELETE FROM companies WHERE code=$1`, [ code ]);
		// if (results.rows.length === 0) {
		// 	throw new ExpressError(`Cannot find company with code of ${code}.`, 404);
		// }
		return res.json({ status: 'deleted' });
	} catch (e) {
		return next(e);
	}
});

// router.get('/',async (req,res,next)=>{
//     try{
//         const results=await db.query(``)
//         return res.json({})
//     }catch(e){
//         return next(e)
//     }
// })

module.exports = router;
