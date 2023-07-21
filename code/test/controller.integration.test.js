import request from "supertest";
import { app } from "../app";
import { categories, transactions } from "../models/model";
import mongoose, { Model } from "mongoose";
import dotenv from "dotenv";
import {
	defaults,
	templateTransactions,
	templateUsers,
	templateCategories,
	templateAdmins,
	createUser,
} from "../controllers/test-utils.js";
import { Group, User } from "../models/User.js";
import {
	createCategory,
	updateCategory,
	deleteCategory,
	getCategories,
	createTransaction,
} from "../controllers/controller.js";
import * as utils from "../controllers/utils.js";
dotenv.config();

beforeAll(async () => {
	const dbName = "testingDatabaseController";
	const url = `${process.env.MONGO_URI}/${dbName}`;

	await mongoose.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
});

afterAll(async () => {
	await mongoose.connection.db.dropDatabase();
	await mongoose.connection.close();
});

describe("createCategory", () => {
	beforeEach(async () => {
		await categories.deleteMany({});
	});
	test("It should return Unauthorized if not logged", async () => {
		const response = await request(app).post("/api/categories");
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should return Unauthorized if not admin logged", async () => {
		const response = await request(app)
			.post("/api/categories")
			.set("Cookie", [
				`accessToken=${defaults.user.tokens.accessToken}`,
				`refreshToken=${defaults.user.tokens.refreshToken}`,
			]);
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should create a category", async () => {
		const response = await request(app)
			.post("/api/categories")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				type: templateCategories[0].type,
				color: templateCategories[0].color,
			});
		const expectedcategory = {
			type: templateCategories[0].type,
			color: templateCategories[0].color,
		};
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: expectedcategory,
		});
	});
	test("It should fail because type lost", async () => {
		const response = await request(app)
			.post("/api/categories")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				//type: templateCategories[0].type,
				color: templateCategories[0].color,
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No type provided",
		});
	});
	test("It should fail because color lost", async () => {
		const response = await request(app)
			.post("/api/categories")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				type: templateCategories[0].type,
				//color: templateCategories[0].color,
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No color provided",
		});
	});
	test("it should fail for missing at least one field being an empty string", async () => {
		const response = await request(app)
			.post("/api/categories")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				type: "",
				color: templateCategories[0].color,
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No type provided",
		});
	});
	test("It should fail because an existing category", async () => {
		await categories.create({
			...templateCategories[0],
		});
		const response = await request(app)
			.post("/api/categories")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				type: templateCategories[0].type,
				color: templateCategories[0].color,
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Category already exist",
		});
	});
});

describe("updateCategory", () => {
	beforeEach(async () => {
		await categories.deleteMany({});
		await transactions.deleteMany({});
	});
	test("It should return Unauthorized if not logged", async () => {
		const type = "food";
		const response = await request(app)
			.patch(`/api/categories/${type}`)
			.set("Accept", "application/json")
			.send({
				type: templateCategories[4].type,
				color: templateCategories[4].color,
			});
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should return Unauthorized if not admin logged", async () => {
		const type = "food";
		const response = await request(app)
			.patch(`/api/categories/${type}`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${defaults.user.tokens.accessToken}`,
				`refreshToken=${defaults.user.tokens.refreshToken}`,
			])
			.send({
				type: templateCategories[4].type,
				color: templateCategories[4].color,
			});
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should fail because not find the category", async () => {
		const type = "food";
		const response = await request(app)
			.patch(`/api/categories/${type}`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				type: templateCategories[4].type,
				color: templateCategories[4].color,
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Category not found",
		});
	});
	test("It should fail because type missing", async () => {
		const type = "food";
		const response = await request(app)
			.patch(`/api/categories/${type}`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				color: templateCategories[4].color,
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No new type provided",
		});
	});
	test("It should fail because color missing", async () => {
		const type = "food";
		const response = await request(app)
			.patch(`/api/categories/${type}`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				type: templateCategories[4].type,
				//color: templateCategories[4].color,
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No color provided",
		});
	});
	test("it should fail because missing at least one field being an empty string", async () => {
		const type = "food";
		const response = await request(app)
			.patch(`/api/categories/${type}`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				type: "",
				color: templateCategories[4].color,
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No new type provided",
		});
	});
	test("It should change the category successfully with changes", async () => {
		await categories.create({ ...templateCategories[0] });
		await categories.create({ ...templateCategories[1] });
		await transactions.create({ ...templateTransactions[0] });

		const type = templateCategories[0].type;
		const response = await request(app)
			.patch(`/api/categories/${type}`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				type: templateCategories[4].type,
				color: templateCategories[4].color,
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { message: "Category edited successfully", count: 1 },
		});
	});
	test("it should change the category successfully with no change", async () => {
		await categories.create({
			...templateCategories[0],
		});
		const response = await request(app)
			.patch(`/api/categories/${templateCategories[0].type}`)
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({ type: "newType", color: "blue" });
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: {
				count: 0,
				message: "No changes applied",
			},
		});
	});
	test("It should change the color only", async () => {
		await categories.create({ ...templateCategories[0] });
		await transactions.create({ ...templateTransactions[0] });

		const type = templateCategories[0].type;
		const response = await request(app)
			.patch(`/api/categories/${type}`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				type: templateCategories[0].type,
				color: templateCategories[4].color,
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { message: "Category edited successfully", count: 0 },
		});
	});
});

describe("deleteCategory", () => {
	beforeEach(async () => {
		await categories.deleteMany({});
		await mongoose.connection.db.dropDatabase();
	});
	test("It should return Unauthorized if not logged", async () => {
		const response = await request(app).post("/api/categories");
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should return Unauthorized if not admin logged", async () => {
		const response = await request(app)
			.post("/api/categories")
			.set("Cookie", [
				`accessToken=${defaults.user.tokens.accessToken}`,
				`refreshToken=${defaults.user.tokens.refreshToken}`,
			]);
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should fail because having only a category in the database", async () => {
		await categories.create({
			...templateCategories[0],
		});
		const response = await request(app)
			.delete("/api/categories")
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				types: [templateCategories[0].type, templateCategories[1].type],
			});
		//const categoriesCount = await categories.count({});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "There is only 1 category in database",
		});
	});
	test("it should fail because at least one of the categories in the body not in the database", async () => {
		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await categories.create({
			...templateCategories[2],
		});
		const response = await request(app)
			.delete("/api/categories")
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				types: [templateCategories[0].type, templateCategories[3].type],
			});
		//const categoriesCount = await categories.count({});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Category no found",
		});
	});
	test("It should delete the category", async () => {
		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await categories.create({
			...templateCategories[2],
		});
		const response = await request(app)
			.delete("/api/categories")
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.refreshToken}`,
			])
			.send({
				types: [templateCategories[0].type, templateCategories[1].type],
			});
		//const categoriesCount = await categories.count({});
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: {
				count: 0,
				message: "Categories deleted",
			},
		});
	});
});

describe("getCategories", () => {
	beforeEach(async () => {
		await categories.deleteMany({});
	});
	test("It should return Unauthorized if not logged", async () => {
		const response = await request(app).get("/api/categories");
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should get the categories", async () => {
		const category0 = await categories.create(templateCategories[0]);
		const category1 = await categories.create(templateCategories[1]);
		const response = await request(app)
			.get("/api/categories")
			.set("Cookie", [
				`accessToken=${defaults.user.tokens.accessToken}`,
				`refreshToken=${defaults.user.tokens.refreshToken}`,
			]);
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: [
					{
						color: "color0",
						type: "category0",
					},
					{
						color: "color1",
						type: "category1",
					},
				],
			}),
		);
	});
	test("It should get null because categories is null", async () => {
		const response = await request(app)
			.get("/api/categories")
			.set("Cookie", [
				`accessToken=${defaults.user.tokens.accessToken}`,
				`refreshToken=${defaults.user.tokens.refreshToken}`,
			]);
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: [],
			}),
		);
	});
});

describe("createTransaction", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await transactions.deleteMany({});
		await categories.deleteMany({});
	});
	test("It should return Unauthorized if not logged", async () => {
		const response = await request(app)
			.post("/api/users/user/transactions")
			.send({
				username: "user",
			});
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should create a transaction", async () => {
		const user = await createUser(templateUsers[0], false);
		await categories.create({
			...templateCategories[0],
		});

		const response = await request(app)
			.post(`/api/users/${templateUsers[0].username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				username: templateUsers[0].username,
				amount: templateTransactions[0].amount,
				type: templateTransactions[0].type,
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: {
				username: templateUsers[0].username,
				amount: templateTransactions[0].amount,
				type: templateTransactions[0].type,
				date: response.body.data.date,
			},
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("it should fail for missing or wrong parameters", async () => {
		const user = await createUser(templateUsers[0], false);
		await categories.create({
			...templateCategories[0],
		});

		const response = await request(app)
			.post(`/api/users/${templateUsers[0].username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				username: templateUsers[0].username,
				type: templateCategories[0].type,
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No amount provided",
		});
	});
	test("it should fail for missing at least one field being an empty string", async () => {
		const user = await createUser(templateUsers[0], false);
		await categories.create({
			...templateCategories[0],
		});

		const response = await request(app)
			.post(`/api/users/${templateUsers[0].username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				username: templateUsers[0].username,
				amount: templateTransactions[0].amount,
				type: "",
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No category provided",
		});
	});
	test("it should fail if the amount cannot be parsed as a float value", async () => {
		const user = await createUser(templateUsers[0], false);
		await categories.create({
			...templateCategories[0],
		});

		const response = await request(app)
			.post(`/api/users/${templateUsers[0].username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				username: templateUsers[0].username,
				amount: "a lot of money",
				type: templateCategories[0].type,
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "The amount must be a number",
		});
	});
	test("it should fail if category not in the db", async () => {
		const user = await createUser(templateUsers[0], false);

		const response = await request(app)
			.post(`/api/users/${templateUsers[0].username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				username: templateUsers[0].username,
				amount: templateTransactions[0].amount,
				type: templateCategories[0].type,
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Category not found",
		});
	});
	test("it should fail for username not equal to the one passed as route parameter", async () => {
		const user = await createUser(templateUsers[0], false);
		await categories.create({
			...templateCategories[0],
		});

		const response = await request(app)
			.post(`/api/users/${templateUsers[1].username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				username: templateUsers[0].username,
				amount: templateTransactions[0].amount,
				type: templateCategories[0].type,
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Usernames are not the same",
		});
	});
});

describe("getAllTransactions", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await transactions.deleteMany({});
		await categories.deleteMany({});
	});
	test("It should return Unauthorized if not logged", async () => {
		const response = await request(app).get("/api/transactions");
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should get all the transactions", async () => {
		const admin = await createUser(templateUsers[0], true);
		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await transactions.create({ ...templateTransactions[0] });
		await transactions.create({ ...templateTransactions[1] });

		const response = await request(app)
			.get(`/api/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					username: templateUsers[0].username,
					amount: templateTransactions[0].amount,
					type: templateTransactions[0].type,
					color: templateCategories[0].color,
					date: response.body.data[0].date,
				},
				{
					username: templateUsers[1].username,
					amount: templateTransactions[1].amount,
					type: templateTransactions[1].type,
					color: templateCategories[1].color,
					date: response.body.data[1].date,
				},
			],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should fail for not being admin", async () => {
		const user = await createUser(templateUsers[0], false);

		const response = await request(app)
			.get(`/api/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should return an empty array", async () => {
		const admin = await createUser(templateUsers[0], true);

		const response = await request(app)
			.get(`/api/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
});

describe("getTransactionsByUser", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await transactions.deleteMany({});
		await categories.deleteMany({});
	});
	test("It should return Unauthorized if not logged", async () => {
		const response = await request(app).get(
			`/api/users/${templateTransactions[0].username}/transactions`,
		);
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should get the transactions of a user(user)", async () => {
		const user = await createUser(templateUsers[0], false);
		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await transactions.create({ ...templateTransactions[0] });
		await transactions.create({ ...templateTransactions[1] });

		const response = await request(app)
			.get(`/api/users/${templateTransactions[0].username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					username: templateTransactions[0].username,
					amount: templateTransactions[0].amount,
					type: templateTransactions[0].type,
					color: templateCategories[0].color,
					date: response.body.data[0].date,
				},
			],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should get the transactions of a user(filtered by date)", async () => {
		const user = await createUser(templateUsers[0], false);
		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await transactions.create({ ...templateTransactions[0] });
		await transactions.create({ ...templateTransactions[1] });

		const response = await request(app)
			.get(
				`/api/users/${templateTransactions[0].username}/transactions?from=2020-05-05`,
			)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					username: templateTransactions[0].username,
					amount: templateTransactions[0].amount,
					type: templateTransactions[0].type,
					color: templateCategories[0].color,
					date: response.body.data[0].date,
				},
			],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should get the transactions of a user(filtered by amount)", async () => {
		const user = await createUser(templateUsers[0], false);
		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await transactions.create({ ...templateTransactions[0] });
		await transactions.create({ ...templateTransactions[1] });

		const response = await request(app)
			.get(`/api/users/${user.username}/transactions?max=100`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should get the transactions of a user(filtered by amount and date)", async () => {
		const user = await createUser(templateUsers[0], false);
		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await transactions.create({ ...templateTransactions[0] });
		await transactions.create({ ...templateTransactions[1] });

		const response = await request(app)
			.get(`/api/users/${user.username}/transactions?max=100&from=2020-05-05`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should get an empty array if no transactions(user)", async () => {
		const user = await createUser(templateUsers[0], false);

		const response = await request(app)
			.get(`/api/users/${user.username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("it should fail for an authenticated user not being the same as the one in the route", async () => {
		const user = await createUser(templateUsers[0], false);

		const response = await request(app)
			.get(`/api/users/${templateUsers[1].username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should return unauthorized for not being an admin", async () => {
		const user = await createUser(templateUsers[0], false);

		const response = await request(app)
			.get(`/api/transactions/users/${templateTransactions[0].username}`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should get the transactions of a user(admin)", async () => {
		const admin = await createUser(templateUsers[0], true);
		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await transactions.create({ ...templateTransactions[0] });
		await transactions.create({ ...templateTransactions[1] });

		const response = await request(app)
			.get(`/api/transactions/users/${templateTransactions[0].username}`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					username: templateTransactions[0].username,
					amount: templateTransactions[0].amount,
					type: templateTransactions[0].type,
					color: templateCategories[0].color,
					date: response.body.data[0].date,
				},
			],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should get the transactions of a user(filters not applied - admin)", async () => {
		const admin = await createUser(templateUsers[0], true);
		const user = await createUser(templateUsers[1], true);
		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await transactions.create({ ...templateTransactions[0] });
		await transactions.create({ ...templateTransactions[1] });

		const response = await request(app)
			.get(`/api/transactions/users/${user.username}?max=100&from=2020-05-05`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					username: templateTransactions[1].username,
					amount: templateTransactions[1].amount,
					type: templateTransactions[1].type,
					color: templateCategories[1].color,
					date: response.body.data[0].date,
				},
			],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
});

describe("getTransactionsByUserByCategory", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await transactions.deleteMany({});
		await categories.deleteMany({});
	});
	test("It should return Unauthorized if not logged", async () => {
		const response = await request(app).get(
			`/api/users/${templateTransactions[0].username}/transactions/category/${templateTransactions[0].type}`,
		);
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should get the transactions of a given user and category pair", async () => {
		const user = await createUser(templateUsers[0], false);
		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await transactions.create({ ...templateTransactions[0] });
		await transactions.create({ ...templateTransactions[1] });

		const response = await request(app)
			.get(
				`/api/users/${templateTransactions[0].username}/transactions/category/${templateTransactions[0].type}`,
			)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					username: templateTransactions[0].username,
					amount: templateTransactions[0].amount,
					type: templateTransactions[0].type,
					color: templateCategories[0].color,
					date: response.body.data[0].date,
				},
			],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should get an empty array if no transactions for that category", async () => {
		const user = await createUser(templateUsers[0], false);
		await categories.create({
			...templateCategories[0],
		});
		const response = await request(app)
			.get(
				`/api/users/${user.username}/transactions/category/${templateCategories[0].type}`,
			)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should fail if the category not in the database", async () => {
		const user = await createUser(templateUsers[0], false);

		const response = await request(app)
			.get(
				`/api/users/${user.username}/transactions/category/${templateCategories[0].type}`,
			)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Category not found",
		});
	});
	test("It should fail if the user is not an admin", async () => {
		const user = await createUser(templateUsers[0], false);

		const response = await request(app)
			.get(
				`/api/transactions/users/${user.username}/category/${templateCategories[0].type}`,
			)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
});

describe("getTransactionsByGroup", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await transactions.deleteMany({});
		await categories.deleteMany({});
		await Group.deleteMany({});
	});
	test("It should get the transactions of all the members of a group", async () => {
		const u1 = await createUser(templateUsers[0], false);
		const u2 = await createUser(templateUsers[1], false);

		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await transactions.create({ ...templateTransactions[0] });
		await transactions.create({ ...templateTransactions[1] });

		const groupName = "group";
		await Group.create({
			name: groupName,
			members: [
				{
					email: u1.email,
					user: u1._id,
				},
				{
					email: u2.email,
					user: u2._id,
				},
			],
		});
		const response = await request(app)
			.get(`/api/groups/${groupName}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					username: templateTransactions[0].username,
					amount: templateTransactions[0].amount,
					type: templateTransactions[0].type,
					color: templateCategories[0].color,
					date: response.body.data[0].date,
				},
				{
					username: templateTransactions[1].username,
					amount: templateTransactions[1].amount,
					type: templateTransactions[1].type,
					color: templateCategories[1].color,
					date: response.body.data[1].date,
				},
			],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should get an empty array if no transactions in that group", async () => {
		const u1 = await createUser(templateUsers[0], false);
		const u2 = await createUser(templateUsers[1], false);

		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});

		const groupName = "group";
		await Group.create({
			name: groupName,
			members: [
				{
					email: u1.email,
					user: u1._id,
				},
				{
					email: u2.email,
					user: u2._id,
				},
			],
		});
		const response = await request(app)
			.get(`/api/groups/${groupName}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should return unauthorized cause user not in the group", async () => {
		const u1 = await createUser(templateUsers[0], false);
		const u2 = await createUser(templateUsers[1], false);

		const groupName = "group";
		await Group.create({
			name: groupName,
			members: [
				{
					email: u2.email,
					user: u2._id,
				},
			],
		});
		const response = await request(app)
			.get(`/api/groups/${groupName}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			]);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should return unauthorized for not been admin", async () => {
		const u1 = await createUser(templateUsers[0], false);

		const groupName = "group";
		await Group.create({
			name: groupName,
			members: [
				{
					email: u1.email,
					user: u1._id,
				},
			],
		});
		const response = await request(app)
			.get(`/api/transactions/groups/${groupName}`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			]);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should return Group does not exist", async () => {
		const u1 = await createUser(templateUsers[0], false);

		const groupName = "group";

		const response = await request(app)
			.get(`/api/groups/${groupName}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			]);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Group does not exist",
		});
	});
});

describe("getTransactionsByGroupByCategory", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await transactions.deleteMany({});
		await categories.deleteMany({});
		await Group.deleteMany({});
	});
	test("It should get the transactions of all the members of a group filtered by category", async () => {
		const u1 = await createUser(templateUsers[0], false);
		const u2 = await createUser(templateUsers[1], false);

		await categories.create({
			...templateCategories[0],
		});
		await categories.create({
			...templateCategories[1],
		});
		await transactions.create({ ...templateTransactions[0] });
		await transactions.create({ ...templateTransactions[1] });

		const groupName = "group";
		await Group.create({
			name: groupName,
			members: [
				{
					email: u1.email,
					user: u1._id,
				},
				{
					email: u2.email,
					user: u2._id,
				},
			],
		});
		const response = await request(app)
			.get(
				`/api/groups/${groupName}/transactions/category/${templateCategories[0].type}`,
			)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					username: templateTransactions[0].username,
					amount: templateTransactions[0].amount,
					type: templateTransactions[0].type,
					color: templateCategories[0].color,
					date: response.body.data[0].date,
				},
			],
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should return unauthorized if user not part of the group", async () => {
		const u1 = await createUser(templateUsers[0], false);
		const u2 = await createUser(templateUsers[1], false);

		const groupName = "group";
		await Group.create({
			name: groupName,
			members: [
				{
					email: u2.email,
					user: u2._id,
				},
			],
		});
		const response = await request(app)
			.get(
				`/api/groups/${groupName}/transactions/category/${templateCategories[0].type}`,
			)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			]);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("It should return group doesn't exist if group does not exist", async () => {
		const u1 = await createUser(templateUsers[0], false);

		const groupName = "group";
		const response = await request(app)
			.get(
				`/api/groups/${groupName}/transactions/category/${templateCategories[0].type}`,
			)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			]);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Group doesn't exist",
		});
	});
	test("It should return Category not found if the category does not exist", async () => {
		const u1 = await createUser(templateUsers[0], false);

		const groupName = "group";
		await Group.create({
			name: groupName,
			members: [
				{
					email: u1.email,
					user: u1._id,
				},
			],
		});
		const response = await request(app)
			.get(
				`/api/groups/${groupName}/transactions/category/${templateCategories[0].type}`,
			)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			]);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Category not found",
		});
	});
	test("It should return unauthorized if not an admin", async () => {
		const u1 = await createUser(templateUsers[0], false);
		const u2 = await createUser(templateUsers[1], false);

		const groupName = "group";
		await Group.create({
			name: groupName,
			members: [
				{
					email: u2.email,
					user: u2._id,
				},
			],
		});
		const response = await request(app)
			.get(
				`/api/transactions/groups/${groupName}/category/${templateCategories[0].type}`,
			)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			]);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
});

describe("deleteTransaction", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await transactions.deleteMany({});
		await categories.deleteMany({});
		await Group.deleteMany({});
	});
	test("It should delete a transaction", async () => {
		const u1 = await createUser(templateUsers[0], false);

		await categories.create({
			...templateCategories[0],
		});
		const transaction = await transactions.create({
			...templateTransactions[0],
		});

		const response = await request(app)
			.delete(`/api/users/${u1.username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			])
			.send({
				_id: transaction._id,
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { message: "Transaction deleted" },
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should return Cannot delete the transaction corresponding to _id: ${_id}", async () => {
		const u1 = await createUser(templateUsers[0], false);

		await categories.create({
			...templateCategories[0],
		});
		const transaction = await transactions.create({
			...templateTransactions[1],
		});

		const response = await request(app)
			.delete(`/api/users/${u1.username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			])
			.send({
				_id: transaction._id,
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: `Cannot delete the transaction corresponding to _id: ${transaction._id}`,
		});
	});
	test("It should return The _id is required if not provided", async () => {
		const u1 = await createUser(templateUsers[0], false);

		await categories.create({
			...templateCategories[0],
		});
		const transaction = await transactions.create({
			...templateTransactions[1],
		});

		const response = await request(app)
			.delete(`/api/users/${u1.username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			])
			.send({
				_id: "",
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "The _id is required",
		});
	});
	test("It should return Transaction does not exist if the provided _id is not in the db", async () => {
		const u1 = await createUser(templateUsers[0], false);

		await categories.create({
			...templateCategories[0],
		});

		const response = await request(app)
			.delete(`/api/users/${u1.username}/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			])
			.send({
				_id: "594ced02ed345b2b049222c5",
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Transaction does not exist",
		});
	});
});

describe("deleteTransactions", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await transactions.deleteMany({});
		await categories.deleteMany({});
		await Group.deleteMany({});
	});
	test("It should delete a list of transactions", async () => {
		const admin = await createUser(templateUsers[0], true);

		await categories.create({
			...templateCategories[0],
		});
		const t1 = await transactions.create({
			...templateTransactions[0],
		});
		const t2 = await transactions.create({
			...templateTransactions[1],
		});

		const response = await request(app)
			.delete(`/api/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			])
			.send({
				_ids: [t1._id, t2._id],
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { message: "Transactions deleted" },
			refreshedTokenMessage: response?.locals?.refreshedTokenMessage,
		});
	});
	test("It should return _ids cannot be empty strings", async () => {
		const admin = await createUser(templateUsers[0], true);

		const t2 = await transactions.create({
			...templateTransactions[1],
		});

		const response = await request(app)
			.delete(`/api/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			])
			.send({
				_ids: ["", t2._id],
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "_ids cannot be empty strings",
		});
	});
	test("It should return No _ids provided if the _ids array is empty", async () => {
		const admin = await createUser(templateUsers[0], true);

		const response = await request(app)
			.delete(`/api/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			])
			.send({
				_ids: [],
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No _ids provided",
		});
	});
	test("It should return Transaction not found if it isn't in the db", async () => {
		const admin = await createUser(templateUsers[0], true);

		const response = await request(app)
			.delete(`/api/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			])
			.send({
				_ids: ["594ced02ed345b2b049222c5"],
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Transaction not found",
		});
	});
	test("It should return unauthorized if not an admin", async () => {
		const u1 = await createUser(templateUsers[0], false);

		const response = await request(app)
			.delete(`/api/transactions`)
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${u1.accessToken}`,
				`refreshToken=${u1.refreshToken}`,
			]);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
});
