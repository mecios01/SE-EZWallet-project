import request from "supertest";
import { app } from "../app";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
const bcrypt = require("bcryptjs");
import mongoose, { Model } from "mongoose";
import dotenv from "dotenv";
import {
	createUser,
	defaults,
	templateAdmins,
	templateUsers,
} from "../controllers/test-utils.js";

dotenv.config();

beforeAll(async () => {
	const dbName = "testingDatabaseAuth";
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

describe("register", () => {
	beforeEach(async () => {
		await User.deleteMany({});
	});
	test("It should register a normal user", async () => {
		const response = await request(app).post("/api/register").send({
			email: templateUsers[0].email,
			username: templateUsers[0].username,
			password: templateUsers[0].password,
		});
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { message: "User added successfully" },
		});
	});
	test("It should fail because user already exists", async () => {
		const user = await createUser(templateUsers[0], true);
		const response = await request(app).post("/api/register").send({
			email: templateUsers[0].email,
			username: templateUsers[0].username,
			password: templateUsers[0].password,
		});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "there is already a user with that username or email",
		});
	});
	test("It should fail for missing email", async () => {
		const response = await request(app).post("/api/register").send({
			username: templateUsers[0].username,
			password: templateUsers[0].password,
		});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No valid email provided",
		});
	});
	test("It should fail for missing username", async () => {
		const response = await request(app).post("/api/register").send({
			username: "",
			email: templateUsers[0].email,
			password: templateUsers[0].password,
		});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No username provided",
		});
	});
	test("It should fail for missing password", async () => {
		const response = await request(app).post("/api/register").send({
			username: templateUsers[0].username,
			email: templateUsers[0].email,
			password: {},
		});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No password provided",
		});
	});
});

describe("registerAdmin", () => {
	beforeEach(async () => {
		await User.deleteMany({});
	});
	test("It should register an admin user", async () => {
		const response = await request(app).post("/api/admin").send({
			email: templateAdmins[0].email,
			username: templateAdmins[0].username,
			password: templateAdmins[0].password,
		});
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: { message: "Admin added successfully" },
		});
	});
	test("It should fail because admin already exists", async () => {
		const admin = await createUser(templateAdmins[0]);
		const response = await request(app).post("/api/admin").send({
			email: templateAdmins[0].email,
			username: templateAdmins[0].username,
			password: templateAdmins[0].password,
		});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "email or username already exist",
		});
	});
	test("It should fail for missing email", async () => {
		const response = await request(app).post("/api/admin").send({
			username: templateAdmins[0].username,
			password: templateAdmins[0].password,
		});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No valid email provided",
		});
	});
	test("It should fail for missing username", async () => {
		const response = await request(app).post("/api/admin").send({
			username: "",
			email: templateAdmins[0].email,
			password: templateAdmins[0].password,
		});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No username provided",
		});
	});
	test("It should fail for missing password", async () => {
		const response = await request(app).post("/api/admin").send({
			username: templateAdmins[0].username,
			email: templateAdmins[0].email,
			password: {},
		});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No password provided",
		});
	});
});

describe("login", () => {
	beforeEach(async () => {
		await User.deleteMany({});
	});
	test("It should perform the login", async () => {
		const user = await createUser(templateUsers[0]);
		const response = await request(app)
			.post("/api/login")
			.send({ email: user.email, password: templateUsers[0].password });

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("data");
		expect(response.body.data).toHaveProperty("accessToken");
		expect(response.body.data).toHaveProperty("refreshToken");
	});
	test("It should fail for missing email", async () => {
		const user = await createUser(templateUsers[0]);
		const response = await request(app)
			.post("/api/login")
			.send({ email: "", password: templateUsers[0].password });

		expect(response.status).toBe(400);
		expect(response.body).toEqual(
			expect.objectContaining({
				error: "No valid email provided",
			}),
		);
	});
	test("It should fail for missing password", async () => {
		const user = await createUser(templateUsers[0]);
		const response = await request(app).post("/api/login").send({
			email: templateUsers[0].email,
			password: "",
		});

		expect(response.status).toBe(400);
		expect(response.body).toEqual(
			expect.objectContaining({
				error: "No password provided",
			}),
		);
	});
	test("It should fail for wrong credentials", async () => {
		const user = await createUser(templateUsers[0]);
		const response = await request(app)
			.post("/api/login")
			.send({ email: user.email, password: "notTheRealPassword" });

		expect(response.status).toBe(400);
		expect(response.body).toEqual(
			expect.objectContaining({
				error: "wrong credentials",
			}),
		);
	});
	test("It should fail for not existing user", async () => {
		const response = await request(app).post("/api/login").send({
			email: templateUsers[0].email,
			password: templateUsers[0].password,
		});

		expect(response.status).toBe(400);
		expect(response.body).toEqual(
			expect.objectContaining({
				error: "please you need to register",
			}),
		);
	});
});

describe("logout", () => {
	beforeEach(async () => {
		await User.deleteMany({});
	});
	test("It should fail for no refreshToken", async () => {
		const user = await createUser(templateUsers[0]);
		const response = await request(app)
			.get("/api/logout")
			.set("Cookie", [`accessToken=${user.accessToken}`]);
		expect(response.status).toBe(400);
		expect(response.body).toEqual(
			expect.objectContaining({
				error: "No refresh token provided",
			}),
		);
	});
	test("It should fail for no user found", async () => {
		// const user = await createUser(templateUsers[0]);
		const response = await request(app)
			.get("/api/logout")
			.set("Cookie", [
				`accessToken=${defaults.user.accessToken}`,
				`refreshToken=${defaults.user.refreshToken}`,
			]);
		expect(response.status).toBe(400);
		expect(response.body).toEqual(
			expect.objectContaining({
				error: "User not found",
			}),
		);
	});
	test("It should logout", async () => {
		const user = await createUser(templateUsers[0]);
		const response = await request(app)
			.get("/api/logout")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: { message: "User logged out" },
			}),
		);
	});
});
