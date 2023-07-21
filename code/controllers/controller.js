import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import {
	handleDateFilterParams,
	handleAmountFilterParams,
	verifyAuth,
	validateRequest,
} from "./utils.js";
import { authTypes } from "../constants/constants.js";
import * as yup from "yup";
import mongoose, { Types } from "mongoose";

/**
 * Create a new category
 - Request Body Content: An object having attributes `type` and `color`
 - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = async (req, res) => {
	try {
		const adminAuth = verifyAuth(req, res, { authType: authTypes.admin });
		if (!adminAuth.flag) {
			return res.status(401).json({ error: adminAuth.cause });
		}

		// start validation
		const body_schema = yup.object({
			type: yup
				.string()
				.typeError("No type provided")
				.required("No type provided"),
			color: yup
				.string()
				.typeError("No color provided")
				.required("No color provided"),
		});

		const { body, isValidationOk, errorMessage } = validateRequest(
			req,
			undefined,
			body_schema,
		);

		if (!isValidationOk) {
			return res.status(400).json({
				error: errorMessage ?? "Bad request",
			});
		}
		// validation successful

		const categoryExist = await categories.count({ type: body.type });
		if (categoryExist !== 0) {
			return res.status(400).json({
				error: "Category already exist",
			});
		}

		const new_category = await categories.create({
			type: body.type,
			color: body.color,
		});
		return res.status(200).json({
			data: {
				type: new_category.type,
				color: new_category.color,
			},
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Edit a category's type or color
 - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
 - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
 - Optional behavior:
 - error 401 returned if the specified category does not exist
 - error 401 is returned if new parameters have invalid values
 */
export const updateCategory = async (req, res) => {
	try {
		const adminAuth = verifyAuth(req, res, { authType: authTypes.admin });
		if (!adminAuth.flag) {
			return res.status(401).json({ error: adminAuth.cause });
		}

		// params validation
		const params_schema = yup.object({
			type: yup
				.string()
				.typeError("No type provided")
				.required("No type provided"),
		});
		const body_schema = yup.object({
			type: yup
				.string()
				.typeError("No new type provided")
				.required("No new type provided"),
			color: yup
				.string()
				.typeError("No color provided")
				.required("No color provided"),
		});
		const { params, body, isValidationOk, errorMessage } = validateRequest(
			req,
			params_schema,
			body_schema,
		);

		if (!isValidationOk) {
			return res.status(400).json({
				error: errorMessage ?? "Bad request",
			});
		}
		// validation successful

		const type = params.type;
		const new_type = body.type;
		const color = body.color;

		// Check - Category existence
		const category = await categories.findOne({ type });
		if (!category) {
			return res.status(400).json({ error: "Category not found" });
		}

		// is the category the same as the old one? => change only the color
		let changeColorOnly = false;
		if (params.type === body.type) {
			changeColorOnly = true;
		}

		// Check - New Type
		const new_cat = await categories.findOne({ type: new_type });
		if (new_cat && !changeColorOnly)
			return res
				.status(400)
				.json({ error: "Category with such type already exists" });

		const count = await transactions.count({ type: type });
		const response = await categories.updateOne(
			{ type: type },
			{ $set: { color: color, type: new_type } },
		);

		if (count > 0) {
			return res.status(200).json({
				data: {
					message: "Category edited successfully",
					count: changeColorOnly ? 0 : count,
				},
				refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
			});
		} else {
			return res.status(200).json({
				data: { message: "No changes applied", count: 0 },
				refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
			});
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Delete a category
 - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
 - Response `data` Content: An object with parameter `message` that confirms successful deletion and a parameter `count` that is equal to the count of affected transactions (deleting a category sets all transactions with that category to have `investment` as their new category)
 - Optional behavior:
 - error 401 is returned if the specified category does not exist
 */
export const deleteCategory = async (req, res) => {
	try {
		const adminAuth = verifyAuth(req, res, { authType: authTypes.admin });
		if (!adminAuth.flag) {
			return res.status(401).json({ error: adminAuth.cause });
		}
		//body validation
		const body_schema = yup.object({
			types: yup
				.array()
				.typeError("No categories provided")
				.of(
					yup
						.string()
						.typeError("Wrong format of category")
						.required("Wrong format of category"),
				)
				.required("No body provided")
				.min(1, "No categories provided"),
		});
		const { body, isValidationOk, errorMessage } = validateRequest(
			req,
			undefined,
			body_schema,
		);

		if (!isValidationOk) {
			return res.status(400).json({
				error: errorMessage ?? "Bad request",
			});
		}

		// IT ASSUMES AN ARRAY OF STRINGS CALLED "categories" IN THE HTTP REQUEST BODY
		const categoryArray = body.types;
		let doAllCategoriesExist = true;

		// Collection containing all not duplicated types of categories provided (notice: we know already that the array is not null)
		const typeSet = Array.from(new Set(categoryArray));

		const categoriesCount = await categories.count({}); //total number of categories
		let canDeleteFirstCategory = true;
		if (categoriesCount === 1) {
			return res
				.status(400)
				.json({ error: "There is only 1 category in database" });
		} else if (categoriesCount <= typeSet.length) {
			canDeleteFirstCategory = false;
		}

		await Promise.all(
			typeSet.map(async t => {
				const found = await categories.findOne({ type: t });
				if (!found) {
					doAllCategoriesExist = false;
				}
			}),
		);

		if (!doAllCategoriesExist) {
			return res.status(400).json({ error: "Category no found" });
		}

		let firstCategory = await categories.findOne({});
		const affectedSet = new Set();
		for (const type of typeSet) {
			if (!canDeleteFirstCategory && type === firstCategory.type) {
				continue; //if we cannot delete the first category skip
			}
			const deleteResponse = await categories.deleteOne({ type: type });
			if (deleteResponse?.deletedCount !== 1) continue; //if not deleted goto next

			if (canDeleteFirstCategory && type === firstCategory.type) {
				firstCategory = await categories.findOne({}); //update the first category if we just deleted it
			}
			const affected = await transactions.find({ type: type }, { _id: 1 });
			await transactions.updateMany(
				{ type: type },
				{ $set: { type: firstCategory.type } },
			);
			//this avoids counting more than once the same transactions that have been re-modified during the for loop
			affected.map(a => affectedSet.add(a._id.toString()));
		}
		return res.status(200).json({
			data: {
				count: affectedSet.size,
				message: "Categories deleted",
			},
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Return all the categories
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `type` and `color`
 - Optional behavior:
 - empty array is returned if there are no categories
 */
export const getCategories = async (req, res) => {
	try {
		const adminAuth = verifyAuth(req, res, { authType: authTypes.simple });
		if (!adminAuth.flag) {
			return res.status(401).json({ error: adminAuth.cause });
		}
		let data = await categories.find({});

		if (!data || data?.length === 0)
			return res.status(200).json({
				data: [],
				refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
			});

		let filter = data.map(v =>
			Object.assign({}, { type: v.type, color: v.color }),
		);

		return res.status(200).json({
			data: filter,
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Create a new transaction made by a specific user
 - Request Body Content: An object having attributes `username`, `type` and `amount`
 - Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
 - Optional behavior:
 - error 401 is returned if the username or the type of category does not exist
 */
export const createTransaction = async (req, res) => {
	try {
		const simpleAuth = verifyAuth(req, res, {
			authType: authTypes.user,
			username: req.body.username,
		});
		if (!simpleAuth.flag) {
			// Check - Usernames from body and path are equal
			if (req.body.username !== req.params.username)
				return res.status(400).json({ error: "Usernames are not the same" });

			return res.status(401).json({ error: simpleAuth.cause });
		}

		// params and body validation
		const param_schema = yup.object({
			username: yup.string().required("Username required"),
		});
		const body_schema = yup.object({
			username: yup.string().required("No username provided"),
			amount: yup
				.number()
				.typeError("The amount must be a number")
				.required("No amount provided"),
			type: yup.string().required("No category provided"),
		});

		const { params, body, isValidationOk, errorMessage } = validateRequest(
			req,
			param_schema,
			body_schema,
		);

		if (!isValidationOk) {
			return res.status(400).json({
				error: errorMessage ?? "Bad request",
			});
		}
		// validation successful

		// Check - Usernames from body and path are equal
		if (body.username !== params.username)
			return res.status(400).json({ error: "Usernames are not the same" });

		const username = body.username;
		const amount = body.amount;
		const type = body.type;

		// Check - Type
		const category = await categories.findOne({ type });
		if (!category) return res.status(400).json({ error: "Category not found" });

		// Check - Username
		const user = await User.findOne({ username });
		if (!user) return res.status(400).json({ error: "User not found" });

		const transaction = await transactions.create({ username, amount, type });
		if (!transaction) {
			return res
				.status(400)
				.json({ error: "Transaction not created something went wrong" });
		}
		return res.status(200).json({
			data: {
				username: transaction.username,
				date: transaction.date,
				amount: transaction.amount,
				type: transaction.type,
			},
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Return all transactions made by all users
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
 - Optional behavior:
 - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
	try {
		const adminAuth = verifyAuth(req, res, { authType: authTypes.admin });
		if (!adminAuth.flag) {
			return res.status(401).json({ error: adminAuth.cause });
		}
		/**
		 * MongoDB equivalent to the query "SELECT * FROM transactions, categories WHERE transactions.type = categories.type"
		 */
		const transactionsList = await transactions.aggregate([
			{
				$lookup: {
					from: "categories",
					localField: "type",
					foreignField: "type",
					as: "categories_info",
				},
			},
			{ $unwind: "$categories_info" },
		]);

		if (!transactionsList) {
			return res.status(500).json({ error: "An error occurred" });
		}
		const data = transactionsList.map(v => {
			return {
				username: v.username,
				type: v.type,
				amount: v.amount,
				date: v.date,
				color: v.categories_info.color,
			};
		});

		return res.status(200).json({
			data,
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Return all transactions made by a specific user
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
 - Optional behavior:
 - error 401 is returned if the user does not exist
 - empty array is returned if there are no transactions made by the user
 - if there are query parameters and the function has been called by a Regular user then the returned transactions must be filtered according to the query parameters
 */
export const getTransactionsByUser = async (req, res) => {
	try {
		let info;
		const isAdminOnly = req.url.indexOf("/transactions/users/");
		if (isAdminOnly >= 0) {
			info = { authType: authTypes.admin };
		} else {
			info = { authType: authTypes.user, username: req?.params?.username };
		}
		const auth = verifyAuth(req, res, info);
		if (!auth.flag) {
			return res.status(401).json({ error: auth.cause });
		}

		// start validation
		const params_schema = yup.object({
			username: yup.string().required("No username provided"),
		});
		const query_schema = yup.object({
			from: yup.date().optional(),
			upTo: yup.date().optional(),
			date: yup.date().optional(),
			min: yup.number().optional(),
			max: yup.number().optional(),
		});

		const { params, query, isValidationOk, errorMessage } = validateRequest(
			req,
			params_schema,
			undefined,
			query_schema,
		);

		if (!isValidationOk) {
			return res.status(400).json({
				error: "Bad request",
			});
		}
		// end validation

		const userResponse = await User.count({ username: params.username });
		if (userResponse !== 1) {
			return res.status(400).json({ error: "User not found" });
		}

		//generates the filters (includes validation)
		let dateFilters = {};
		let amountFilters = {};
		try {
			dateFilters = handleDateFilterParams(req);
			amountFilters = handleAmountFilterParams(req);
		} catch (e) {
			return res.status(400).json({ error: "Bad request" });
		}
		let filters = {
			username: params.username,
		};
		if (isAdminOnly === -1) {
			if (Object.keys(dateFilters.date)?.length > 0) {
				Object.assign(filters, { date: dateFilters.date });
			}
			if (Object.keys(amountFilters.amount)?.length > 0) {
				Object.assign(filters, { amount: amountFilters.amount });
			}
		}

		//execute the aggregate pipeline
		const transactionList = await transactions.aggregate([
			{
				$match: filters,
			},
			{
				$lookup: {
					from: "categories",
					localField: "type",
					foreignField: "type",
					as: "categories_info",
				},
			},
			{ $unwind: "$categories_info" },
			// { $sort: { date: 1, amount: 1 } }, //not required but good for debug
		]);
		const data = transactionList.map(t => {
			return {
				username: t.username,
				type: t.type,
				color: t.categories_info.color,
				amount: t.amount,
				date: t.date,
			};
		});
		return res.status(200).json({
			data: data,
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Return all transactions made by a specific user filtered by a specific category
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
 - Optional behavior:
 - empty array is returned if there are no transactions made by the user with the specified category
 - error 401 is returned if the user or the category does not exist
 */
export const getTransactionsByUserByCategory = async (req, res) => {
	try {
		let info;
		const isAdminOnly = req.url.indexOf("/transactions/users/");
		if (isAdminOnly >= 0) {
			info = { authType: authTypes.admin };
		} else {
			info = { authType: authTypes.simple, username: req?.params?.username };
		}
		const auth = verifyAuth(req, res, info);
		if (!auth.flag) {
			return res.status(401).json({ error: auth.cause });
		}

		// start validation
		const params_schema = yup.object({
			category: yup.string().required("No type provided"),
			username: yup.string().required("No username provided"),
		});

		const { params, isValidationOk, errorMessage } = validateRequest(
			req,
			params_schema,
			undefined,
		);

		if (!isValidationOk) {
			return res.status(400).json({ error: errorMessage ?? "Bad request" });
		}
		// end validation

		// Check - User existence
		const userResponse = await User.count({ username: params.username });
		if (userResponse !== 1) {
			return res.status(400).json({ error: "User not found" });
		}

		// Check - Category existence
		const categoryResponse = await categories.count({ type: params.category });
		if (categoryResponse !== 1) {
			return res.status(400).json({ error: "Category not found" });
		}

		const transactionList = await transactions.aggregate([
			{
				$match: {
					username: params.username,
					type: params.category,
				},
			},
			{
				$lookup: {
					from: "categories",
					localField: "type",
					foreignField: "type",
					as: "categories_info",
				},
			},
			{ $unwind: "$categories_info" },
		]);

		let data = [];
		if (!!transactionList) {
			transactionList.forEach(v => {
				data.push({
					username: v.username,
					type: v.type,
					amount: v.amount,
					date: v.date,
					color: v.categories_info.color,
				});
			});
		}
		return res.status(200).json({
			data: data,
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Return all transactions made by members of a specific group
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
 - Optional behavior:
 - error 401 is returned if the group does not exist
 - empty array must be returned if there are no transactions made by the group
 */
export const getTransactionsByGroup = async (req, res) => {
	try {
		// PARAMETERS VALIDATION -> needed to retrieve the list of members
		const params_schema = yup.object({
			name: yup.string().required("Group name not provided"),
		});

		const { params, isValidationOk, errorMessage } = validateRequest(
			req,
			params_schema,
			undefined,
		);

		if (!isValidationOk) {
			return res.status(400).json({ error: errorMessage ?? "Bad request" });
		}

		// retrieve the list of the group members, if the group exists
		const group = await Group.findOne(
			{ name: params.name },
			{ "members.email": 1 },
		);
		if (!group?.members) {
			return res.status(400).json({ error: "Group does not exist" });
		}
		const memberEmails = group.members.map(u => u.email.toString());

		//route check (is admin route or user route?)
		let info;
		if (req.url.indexOf("/transactions/groups") >= 0) {
			info = { authType: authTypes.admin };
		} else {
			info = { authType: authTypes.group, emails: memberEmails };
		}

		const auth = verifyAuth(req, res, info);
		if (!auth.flag) {
			return res.status(401).json({ error: auth.cause });
		}

		const users = await User.find(
			{ email: { $in: memberEmails } },
			{ _id: 0, username: 1 },
		);
		const usernames = users?.map(u => u.username.toString()) ?? [];

		const groupTransactions = await transactions.aggregate([
			{ $match: { username: { $in: usernames } } },
			{
				$lookup: {
					from: "categories",
					localField: "type",
					foreignField: "type",
					as: "categories_info",
				},
			},
			{
				$unwind: "$categories_info",
			},
		]);
		return res.status(200).json({
			data: groupTransactions.map(v => {
				return {
					username: v.username,
					type: v.type,
					amount: v.amount,
					date: v.date,
					color: v.categories_info.color,
				};
			}),
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Return all transactions made by members of a specific group filtered by a specific category
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
 - Optional behavior:
 - error 401 is returned if the group or the category does not exist
 - empty array must be returned if there are no transactions made by the group with the specified category
 */
export const getTransactionsByGroupByCategory = async (req, res) => {
	try {
		// PARAMETERS VALIDATION -> needed to retrieve the list of members
		const params_schema = yup.object({
			name: yup.string().required("Group name not provided"),
			category: yup.string().required("Category name not provided"),
		});

		const { params, isValidationOk, errorMessage } = validateRequest(
			req,
			params_schema,
			undefined,
		);

		if (!isValidationOk) {
			return res.status(400).json({ error: errorMessage ?? "Error" });
		}

		// retrieve the list of the group  members, if the group  exists
		const memberEmails = [];
		const group = await Group.findOne(
			{ name: params.name },
			{ "members.email": 1 },
		);
		if (!group) {
			return res.status(400).json({ error: "Group doesn't exist" });
		}
		group.members.forEach(member => {
			memberEmails.push(member.email.toString());
		});

		let info;
		if (req.url.indexOf("/transactions/groups/") >= 0) {
			info = { authType: authTypes.admin };
		} else {
			info = { authType: authTypes.group, emails: memberEmails };
		}

		const auth = verifyAuth(req, res, info);
		if (!auth.flag) {
			return res.status(401).json({ error: auth.cause });
		}

		// retrieve the list of the category,if the category exists
		const category = await categories.count({ type: params.category });
		if (category !== 1) {
			return res.status(400).json({ error: "Category not found" });
		}

		const users = await User.find(
			{ email: { $in: memberEmails } },
			{ _id: 0, username: 1 },
		);

		const usernames = users.map(user => user.username.toString()) ?? [];

		const transactionsResponse = await transactions.aggregate([
			{ $match: { username: { $in: usernames }, type: params.category } },
			{
				$lookup: {
					from: "categories",
					localField: "type",
					foreignField: "type",
					as: "categories_info",
				},
			},
			{
				$unwind: "$categories_info",
			},
		]);
		return res.status(200).json({
			data: transactionsResponse.map(v => {
				return {
					username: v.username,
					type: v.type,
					amount: v.amount,
					date: v.date,
					color: v.categories_info.color,
				};
			}),
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Delete a transaction made by a specific user
 - Request Body Content: The `_id` of the transaction to be deleted
 - Response `data` Content: A string indicating successful deletion of the transaction
 - Optional behavior:
 - error 401 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => {
	try {
		// start validation
		const params_schema = yup.object({
			username: yup.string().required("No username provided"),
		});
		const body_schema = yup.object({
			_id: yup
				.string()
				.typeError("The _id must be a string")
				.required("The _id is required")
				.test("objectIdTest", "_id is not valid", function (value, context) {
					const { path, createError } = this;
					if (value !== new Types.ObjectId(value).toString()) {
						return createError({ path });
					}
					if (!mongoose.isValidObjectId(value)) {
						return createError({ path });
					}
					return true;
				}),
		});

		const { body, params, errorMessage, isValidationOk } = validateRequest(
			req,
			params_schema,
			body_schema,
		);
		if (!isValidationOk) {
			return res.status(400).json({ error: errorMessage ?? "Bad request" });
		}
		// end validation

		const simpleAuth = verifyAuth(req, res, {
			authType: authTypes.simple,
			username: params.username,
		});
		if (!simpleAuth.flag) {
			return res.status(401).json({ error: simpleAuth.cause });
		}

		const user = await User.count({ username: params.username });
		if (user !== 1) {
			return res.status(400).json({ error: "User not found" });
		}

		const transactionUsername = await transactions.findOne(
			{ _id: body._id },
			{ username: 1 },
		);

		if (transactionUsername === null)
			return res.status(400).json({ error: "Transaction does not exist" });
		else if (transactionUsername.username !== params.username) {
			return res.status(400).json({
				error: `Cannot delete the transaction corresponding to _id: ${body._id}`,
			});
		}
		const data = await transactions.deleteOne({ _id: body._id });
		if (data === null)
			return res.status(400).json({
				error: "Something went wrong during deletion",
			});
		return res.status(200).json({
			data: { message: "Transaction deleted" },
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Delete multiple transactions identified by their ids
 - Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
 - Response `data` Content: A message confirming successful deletion
 - Optional behavior:
 - error 401 is returned if at least one of the `_ids` does not have a corresponding transaction. Transactions that have an id are not deleted in this case
 */
export const deleteTransactions = async (req, res) => {
	try {
		const adminAuth = verifyAuth(req, res, { authType: authTypes.admin });
		if (!adminAuth.flag) {
			return res.status(401).json({ error: adminAuth.cause });
		}

		const objectIdSchema = yup
			.string()
			.typeError("_id must be a string")
			.min(1, "_ids cannot be empty strings")
			.test("objectIdTest", "ObjectId is not valid", function (value, context) {
				const { path, createError } = this;
				if (value !== new Types.ObjectId(value).toString()) {
					return createError({ path });
				}
				if (!mongoose.isValidObjectId(value)) {
					return createError({ path });
				}
				return true;
			});

		const body_schema = yup.object({
			_ids: yup
				.array()
				.of(objectIdSchema)
				.required("No body provided")
				.min(1, "No _ids provided"),
		});

		const { body, isValidationOk, errorMessage } = validateRequest(
			req,
			undefined,
			body_schema,
		);

		if (!isValidationOk) {
			return res.status(400).json({
				error: errorMessage ?? "Bad request",
			});
		}
		const _idsArray = body._ids;
		let doAll_idsExist = true;

		// check if all the _ids are present in the db
		await Promise.all(
			_idsArray.map(async id => {
				const found = await transactions.findOne({ _id: id });
				if (!found) doAll_idsExist = false;
			}),
		);

		if (!doAll_idsExist) {
			return res.status(400).json({ error: "Transaction not found" });
		}
		for (const id of _idsArray) {
			const deleteResponse = await transactions.deleteOne({ _id: id });
			// ERROR if at least one id has been removed
			if (deleteResponse === null)
				return res
					.status(400)
					.json({ error: "Transactions not deleted. Something went wrong!" });
		}
		return res.status(200).json({
			data: { message: "Transactions deleted" },
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
