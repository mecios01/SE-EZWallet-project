import request from "supertest";
import { app } from "../app";
import { User, Group } from "../models/User.js";
import { transactions, categories } from "../models/model";
import mongoose, { Model } from "mongoose";
import dotenv from "dotenv";
import {
	createUser,
	defaults,
	templateAdmins,
	templateUsers,
} from "../controllers/test-utils.js";
import { getUser } from "../controllers/users.js";
/**
 * Necessary setup in order to create a new database for testing purposes before starting the execution of test cases.
 * Each test suite has its own database in order to avoid different tests accessing the same database at the same time and expecting different data.
 */
dotenv.config();
beforeAll(async () => {
	const dbName = "testingDatabaseUsers";
	const url = `${process.env.MONGO_URI}/${dbName}`;

	await mongoose.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
});

/**
 * After all test cases have been executed the database is deleted.
 * This is done so that subsequent executions of the test suite start with an empty database.
 */
afterAll(async () => {
	await mongoose.connection.db.dropDatabase();
	await mongoose.connection.close();
});

describe("getUsers", () => {
	/**
	 * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
	 */
	beforeEach(async () => {
		await User.deleteMany({});
	});

	test("it should return empty list if there are no users", async () => {
		const response = await request(app)
			.get("/api/users")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.accessToken}`,
			]);
		expect(response.status).toBe(200);
		expect(response.body).toEqual({ data: [] });
	});

	test("it should retrieve list of all users", async () => {
		await User.create({
			...templateUsers[0],
		});

		const response = await request(app)
			.get("/api/users")
			.set("Cookie", [
				`accessToken=${defaults.admin.tokens.accessToken}`,
				`refreshToken=${defaults.admin.tokens.accessToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [{ ...templateUsers[0], password: undefined }],
		});
	});
});

describe("getUser", () => {
	beforeEach(async () => {
		await User.deleteMany({});
	});
	test("it should be unauthorized (no cookies)", async () => {
		const response = await request(app).get("/api/groups");
		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Unauthorized" });
	});
	test("it should be unauthorized (for asking another user's data while being regular user)", async () => {
		const user = await createUser(templateUsers[0]);

		const response = await request(app)
			.get("/api/users/:anotherUser")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);
		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Unauthorized" });
	});
	test("it should get own user's data", async () => {
		const user = await createUser(templateUsers[0]);
		const response = await request(app)
			.get(`/api/users/${user.username}`)
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: {
				email: user.email,
				role: user.role,
				username: user.username,
			},
		});
	});
	test("it should get another user's data (admin)", async () => {
		const user = await createUser(templateUsers[0]);
		const admin = await createUser(templateAdmins[0], true);
		const response = await request(app)
			.get(`/api/users/${user.username}`)
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			]);
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: {
				email: user.email,
				role: user.role,
				username: user.username,
			},
		});
	});
	test("it should fail for asking not existing user's data (admin)", async () => {
		// const user = await createUser(templateUsers[0]);
		const admin = await createUser(templateUsers[0], true);
		const response = await request(app)
			.get(`/api/users/${defaults.user.username}`)
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			]);
		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "There is not such user" });
	});
});

describe("createGroup", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await Group.deleteMany({});
	});
	test("it should be unauthorized", async () => {
		const response = await request(app).post("/api/groups");
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should create a group", async () => {
		const user = await createUser(templateUsers[0], false);
		const user1 = await createUser(templateUsers[1], false);
		const user2 = await createUser(templateUsers[2], false);

		const otherGroup = await Group.create({
			name: "groupExisting",
			members: [{ user: user2._id, email: user2.email }],
		});
		const response = await request(app)
			.post("/api/groups")
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				name: "Group1",
				memberEmails: [user1.email, user2.email, "notfound1@email.com"],
			});
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: {
					group: {
						name: "Group1",
						members: [{ email: user1.email }, { email: user.email }],
					},
					alreadyInGroup: [{ email: user2.email }],
					membersNotFound: [{ email: "notfound1@email.com" }],
				},
			}),
		);
	});
	test("it should not create a group (only 1 user)", async () => {
		const user = await createUser(templateUsers[0], false);
		const user1 = await createUser(templateUsers[1], false);
		const user2 = await createUser(templateUsers[2], false);

		const otherGroup = await Group.create({
			name: "groupExisting",
			members: [{ user: user2._id, email: user2.email }],
		});
		const response = await request(app)
			.post("/api/groups")
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				name: "Group1",
				memberEmails: [user.email, user2.email, "notfound1@email.com"],
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No valid users to be added",
		});
	});
	test("it should not create a group (at least one email is invalid)", async () => {
		const user = await createUser(templateUsers[0], false);

		const response = await request(app)
			.post("/api/groups")
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				name: "Group1",
				memberEmails: [user.email, user.email, ""],
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "The email is not valid",
		});
	});
	test("it should not create a group (no valid user except the caller)", async () => {
		const user = await createUser(templateUsers[0], false);
		const user1 = await createUser(templateUsers[1], false);
		const user2 = await createUser(templateUsers[2], false);

		const otherGroup = await Group.create({
			name: "groupExisting",
			members: [{ user: user2._id, email: user2.email }],
		});
		const response = await request(app)
			.post("/api/groups")
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				name: "Group1",
				memberEmails: [
					"notfound1@email.com",
					user.email,
					user.email,
					user.email,
				],
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No valid users to be added",
		});
	});
	test("it should fail for already existing group", async () => {
		const user = await createUser(templateUsers[0], false);
		const user1 = await createUser(templateUsers[1], false);
		const fakeGroup = await Group.create({ name: "Group1", members: [] });
		const response = await request(app)
			.post("/api/groups")
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				name: "Group1",
				memberEmails: [user1.email],
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Group already exists",
		});
	});
	test("it should add the caller to the group even if not in the array", async () => {
		const user = await createUser(templateUsers[0], false);
		const user1 = await createUser(templateUsers[1], false);

		const response = await request(app)
			.post("/api/groups")
			.set("Accept", "application/json")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				name: "Group2",
				memberEmails: [user.email, user1.email],
			});
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: {
					group: {
						name: "Group2",
						members: [{ email: user.email }, { email: user1.email }],
					},
					alreadyInGroup: [],
					membersNotFound: [],
				},
			}),
		);
	});
});

describe("getGroups", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await Group.deleteMany({});
	});
	test("it should be unauthorized (no cookies)", async () => {
		const response = await request(app).get("/api/groups");
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should be unauthorized (no admin)", async () => {
		const user = await createUser(templateUsers[0]);
		const response = await request(app)
			.get("/api/groups")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should get an empty list", async () => {
		const admin = await createUser(templateAdmins[0], true);
		const response = await request(app)
			.get("/api/groups")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			]);
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: [],
			}),
		);
	});
	test("it should get the list of groups", async () => {
		const admin = await createUser(templateAdmins[0], true);
		const user1 = await createUser(templateAdmins[1], false);
		const user2 = await createUser(templateAdmins[2], true);
		const g1 = await Group.create({
			name: "group1",
			members: [{ user: user1._id, email: user1.email }],
		});
		const g2 = await Group.create({
			name: "group2",
			members: [{ user: user2._id, email: user2.email }],
		});
		const response = await request(app)
			.get("/api/groups")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			]);
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: [g1, g2].map(g => {
					return {
						name: g.name,
						members: g.members.map(m => {
							return { email: m.email };
						}),
					};
				}),
			}),
		);
	});
});

describe("getGroup", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await Group.deleteMany({});
	});
	test("it should be unauthorized (no cookies)", async () => {
		await Group.create({ name: "group1", members: [] });
		const response = await request(app).get("/api/groups/group1");
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should be unauthorized not part of the group (not admin)", async () => {
		const user = await createUser(templateUsers[0]);
		await Group.create({ name: "group1", members: [] });
		const response = await request(app)
			.get("/api/groups/group1")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should fail for not existing group", async () => {
		const user = await createUser(templateUsers[0]);
		await Group.create({ name: "group1", members: [] });
		const response = await request(app)
			.get("/api/groups/group2")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Group not found",
		});
	});
	test("it should be authorized even if not part of the group (admin)", async () => {
		const admin = await createUser(templateAdmins[0], true);
		const user = await createUser(templateUsers[0]);
		const group = await Group.create({
			name: "group1",
			members: [{ user: user._id, email: user.email }],
		});
		const response = await request(app)
			.get("/api/groups/group1")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			]);
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: {
					name: group.name,
					members: group.members.map(m => {
						return { email: m.email };
					}),
				},
			}),
		);
	});
});

describe("addToGroup", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await Group.deleteMany({});
	});
	test("it should fail for not being an admin(admin route)", async () => {
		const user = await createUser(templateUsers[0]);
		const user1 = await createUser(templateUsers[1]);
		const user2 = await createUser(templateUsers[2]);
		const group = await Group.create({
			name: "group1",
			members: [user].map(u => {
				return { user: u._id, email: u.email };
			}),
		});
		const response = await request(app)
			.patch("/api/groups/group1/insert")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				emails: [
					...[user, user1, user2].map(u => u.email),
					"notfound@user.com",
				],
			});
		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Unauthorized" });
	});
	test("it should fail if not part of the group(group route)", async () => {
		const user = await createUser(templateUsers[0]);
		await Group.create({ name: "group1", members: [] });
		const response = await request(app)
			.patch("/api/groups/group1/add")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should fail if part of the body is missing", async () => {
		const user = await createUser(templateUsers[0]);
		const user1 = await createUser(templateUsers[1]);
		const user2 = await createUser(templateUsers[2]);
		const group = await Group.create({
			name: "group1",
			members: [user].map(u => {
				return { user: u._id, email: u.email };
			}),
		});
		const response = await request(app)
			.patch("/api/groups/group1/add")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				// emails: [], //this has been tested too
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No member emails provided",
		});
	});
	test("it should fail if group does not exist", async () => {
		const user = await createUser(templateUsers[0]);
		const response = await request(app)
			.patch("/api/groups/group2/add")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			]);
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Group does not exist",
		});
	});
	test("it should add to group", async () => {
		const user = await createUser(templateUsers[0]);
		const user1 = await createUser(templateUsers[1]);
		const user2 = await createUser(templateUsers[2]);
		const group = await Group.create({
			name: "group1",
			members: [user].map(u => {
				return { user: u._id, email: u.email };
			}),
		});
		const response = await request(app)
			.patch("/api/groups/group1/add")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				emails: [
					...[user, user1, user2].map(u => u.email),
					"notfound@user.com",
				],
			});
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: {
					group: {
						name: "group1",
						members: [user, user1, user2].map(u => {
							return { email: u.email };
						}),
					},
					membersNotFound: ["notfound@user.com"],
					alreadyInGroup: [user.email],
				},
			}),
		);
	});
});

describe("removeFromGroup", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await Group.deleteMany({});
	});
	test("it should fail for not existing group", async () => {
		const response = await request(app).patch("/api/groups/not-existing/pull");
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Group not found",
		});
	});
	test("it should fail for missing body", async () => {
		const user = await createUser(templateUsers[0]);
		const user1 = await createUser(templateUsers[1]);
		const user2 = await createUser(templateUsers[2]);
		const group1 = await Group.create({
			name: "group1",
			members: [user, user1, user2].map(u => {
				return { user: u._id, email: u.email };
			}),
		});
		const response = await request(app)
			.patch("/api/groups/group1/remove")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No emails provided",
		});
	});
	test("it should fail for not being part of the group", async () => {
		const user = await createUser(templateUsers[0]);
		const user1 = await createUser(templateUsers[1]);
		const user2 = await createUser(templateUsers[2]);
		const group = await Group.create({
			name: "group1",
			members: [user1, user2].map(u => {
				return { user: u._id, email: u.email };
			}),
		});
		const response = await request(app)
			.patch("/api/groups/group1/add")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({});
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should fail for not being admin", async () => {
		const user = await createUser(templateUsers[0]);
		const user1 = await createUser(templateUsers[1]);
		const user2 = await createUser(templateUsers[2]);
		const group = await Group.create({
			name: "group1",
			members: [user1, user2].map(u => {
				return { user: u._id, email: u.email };
			}),
		});
		const response = await request(app)
			.patch("/api/groups/group1/pull")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({});
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should fail for all users not in group or not found", async () => {
		const user = await createUser(templateUsers[0]);
		const user1 = await createUser(templateUsers[1]);
		const user2 = await createUser(templateUsers[2]);
		await Group.create({
			name: "group1",
			members: [user].map(u => {
				return { user: u._id, email: u.email };
			}),
		});
		await Group.create({
			name: "group2",
			members: [user1, user2].map(u => {
				return { user: u._id, email: u.email };
			}),
		});
		const response = await request(app)
			.patch("/api/groups/group1/remove")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				emails: [user1.email, user2.email, "notexisting@email.com"],
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No users can be removed",
		});
	});
	test("it should delete all the users but but not the first one", async () => {
		const user = await createUser(templateUsers[0]);
		const user1 = await createUser(templateUsers[1]);
		const user2 = await createUser(templateUsers[2]);
		await Group.create({
			name: "group1",
			members: [user, user1].map(u => {
				return { user: u._id, email: u.email };
			}),
		});
		const response = await request(app)
			.patch("/api/groups/group1/remove")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				emails: [user.email, user1.email, user2.email, "notexisting@email.com"],
			});
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: {
					group: {
						members: [{ email: user.email }],
						name: "group1",
					},
					membersNotFound: ["notexisting@email.com"],
					notInGroup: [user2.email],
				},
			}),
		);
	});
	test("it should delete all the users requested", async () => {
		const user = await createUser(templateUsers[0]);
		const user1 = await createUser(templateUsers[1]);
		const user2 = await createUser(templateUsers[2]);
		await Group.create({
			name: "group1",
			members: [user, user1, user2].map(u => {
				return { user: u._id, email: u.email };
			}),
		});
		const response = await request(app)
			.patch("/api/groups/group1/remove")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				emails: [user1.email, user2.email, "notexisting@email.com"],
			});
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: {
					group: {
						members: [{ email: user.email }],
						name: "group1",
					},
					membersNotFound: ["notexisting@email.com"],
					notInGroup: [],
				},
			}),
		);
	});
	test("it should fail to delete the last user of a group", async () => {
		const user = await createUser(templateUsers[0]);
		await Group.create({
			name: "group1",
			members: [user].map(u => {
				return { user: u._id, email: u.email };
			}),
		});
		const response = await request(app)
			.patch("/api/groups/group1/remove")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				emails: [user.email, "notexisting@email.com"],
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "No users can be removed" });
	});
});

describe("deleteUser", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await Group.deleteMany({});
	});
	test("it should be unauthorized (no cookies)", async () => {
		const response = await request(app).delete("/api/users");
		expect(response.status).toBe(401);
		expect(response.body).toEqual({ error: "Unauthorized" });
	});
	test("it should fail (for not existing user)", async () => {
		const admin = await createUser(templateUsers[1], true);

		const response = await request(app)
			.delete("/api/users")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			])
			.send({ email: defaults.user.email });
		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "User does not exist" });
	});
	test("it should delete user ", async () => {
		const user = await createUser(templateUsers[0]);
		const admin = await createUser(templateUsers[1], true);

		const response = await request(app)
			.delete("/api/users")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			])
			.send({ email: user.email });
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: {
					deletedTransactions: 0,
					deletedFromGroup: false,
				},
			}),
		);
	});
});

describe("deleteGroup", () => {
	beforeEach(async () => {
		await User.deleteMany({});
		await Group.deleteMany({});
	});
	test("it should delete the group", async () => {
		//empty groups should not be in db but for testing purposes it does not matter
		const admin = await createUser(templateAdmins[0], true);
		await Group.create({ name: "group1", members: [] });
		const response = await request(app)
			.delete("/api/groups")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			])
			.send({
				name: "group1",
			});
		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				data: { message: "Group was successfully deleted" },
			}),
		);
	});
	test("it should be unauthorized (not admin)", async () => {
		//empty groups should not be in db but for testing purposes it does not matter
		const user = await createUser(templateUsers[0]);
		await Group.create({ name: "group1", members: [] });
		const response = await request(app)
			.delete("/api/groups")
			.set("Cookie", [
				`accessToken=${user.accessToken}`,
				`refreshToken=${user.refreshToken}`,
			])
			.send({
				name: "group1",
			});
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Unauthorized",
		});
	});
	test("it should fail for empty/not valid body", async () => {
		//empty groups should not be in db but for testing purposes it does not matter
		const admin = await createUser(templateAdmins[0], true);
		await Group.create({ name: "group1", members: [] });
		const response = await request(app)
			.delete("/api/groups")
			.set("Cookie", [
				`accessToken=${admin.accessToken}`,
				`refreshToken=${admin.refreshToken}`,
			])
			.send({
				name: "",
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "No name provided",
		});
	});
});
