import request from "supertest";
import { app } from "../app";
import { Group, User } from "../models/User.js";
import {
	defaults,
	templateGroups,
	templateUsers,
} from "../controllers/test-utils.js";
import {
	addToGroup,
	createGroup,
	deleteGroup,
	getGroup,
	getGroups,
	getUsers,
	getUser,
	removeFromGroup,
	deleteUser,
} from "../controllers/users.js";
import dotenv from "dotenv";
import { authTypes, roles } from "../constants/constants.js";
import * as utils from "../controllers/utils.js";
import cookieParser from "cookie-parser";
import { transactions } from "../models/model.js";
import { del } from "express/lib/application.js";
dotenv.config();
/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("../models/User");

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
	jest.clearAllMocks();
	jest.restoreAllMocks();
});

describe("getUsers", () => {
	test("it should be unauthorized if not admin", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });

		const expectedRes = { error: "Unauthorized" };
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await getUsers(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
	test("it should return empty list if there are no users", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		//any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
		const expectedRes = [];
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "find").mockResolvedValueOnce(expectedRes);
		await getUsers(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes,
			}),
		);
	});
	test("it should retrieve list of all users", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedRes = [
			{
				username: "test1",
				email: "test1@example.com",
				password: "hashedPassword1",
				role: roles.normalUser,
			},
			{
				username: "test2",
				email: "test2@example.com",
				password: "hashedPassword2",
				role: roles.admin,
			},
		];
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(User, "find").mockResolvedValueOnce(expectedRes);
		await getUsers(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(r => {
					return { email: r.email, role: r.role, username: r.username };
				}),
			}),
		);
	});
});

describe("getUser", () => {
	// User
	test("it should return user detail", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedRes = {
			user: {
				username: defaults.user.username,
				email: defaults.user.email,
				role: roles.normalUser,
			},
		};
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValue(expectedRes.user);
		await getUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.user,
			}),
		);
	});
	test("it should fail, if user is not the same as the route (user)", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedRes = { error: "Unauthorized" };
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: {
				username: "user0",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValue(defaults.user);
		await getUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});

	// Common
	test("it should fail, if user not found", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = { res: undefined, error: "User not found" };
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValue(expectedRes.res);
		await getUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});

	// Admin
	test("it should return user details if not the same as the route (admin)", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedRes = {
			admin: { username: defaults.admin.username, role: roles.admin },
			user: {
				username: "user0",
				email: "user0@email0.it",
				role: roles.normalUser,
			},
		};
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			params: {
				username: "user0",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest
			.spyOn(User, "findOne")
			.mockResolvedValueOnce(expectedRes.admin)
			.mockResolvedValueOnce(expectedRes.user);
		await getUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.user,
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it should fail, if user not found", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedRes = {
			admin: { username: defaults.admin.username, role: roles.admin },
			user: undefined,
			error: "There is not such user",
		};
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			params: {
				username: "notExistingUsername",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};

		jest
			.spyOn(User, "findOne")
			.mockReturnValueOnce(expectedRes.admin)
			.mockReturnValueOnce(expectedRes.user);
		await getUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
});

describe("createGroup", () => {
	test("it should create the group", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				name: "GroupName",
				memberEmails: [
					templateUsers[0].email,
					templateUsers[1].email,
					templateUsers[2].email,
				],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest
			.spyOn(Group, "count")
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(1);
		const caller = {
			_id: defaults.user.id,
			username: defaults.user.username,
			email: defaults.user.email,
			role: defaults.user.role,
		};
		jest
			.spyOn(User, "findOne")
			.mockResolvedValueOnce(caller)
			.mockResolvedValueOnce({ _id: 0, ...templateUsers[0] })
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ _id: 2, ...templateUsers[0] });

		const expectedGroup = {
			name: "GroupName",
			members: [{ email: templateUsers[0].email }, { email: caller.email }],
		};
		jest.spyOn(Group, "create").mockResolvedValueOnce(expectedGroup);
		await createGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					group: expectedGroup,
					membersNotFound: [{ email: templateUsers[1].email }],
					alreadyInGroup: [{ email: templateUsers[2].email }],
				},
			}),
		);
	});
	test("it should fail if user is not authenticated", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });
		const mockReq = {
			body: {
				name: "Family",
				memberEmails: [templateUsers[0].email, templateUsers[1].email],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		await createGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
	});
	test("it should fail for field missing", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			body: {
				name: "Family",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		await createGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No member emails provided",
		});
	});
	test("it should fail if name is an empty string", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			body: {
				name: "",
				memberEmails: [templateUsers[0].email, templateUsers[1].email],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		await createGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No name provided",
		});
	});
	test("it should fail for at least a field being an empty string", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			body: {
				name: "Name",
				memberEmails: [templateUsers[0].email, ""],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		await createGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "The email is not valid",
		});
	});
	test("it should fail if all emails are not valid users or already part of other groups", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				name: "Name",
				memberEmails: [
					templateUsers[0].email,
					templateUsers[1].email,
					templateUsers[2].email,
				],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest
			.spyOn(Group, "count")
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(1);
		jest
			.spyOn(User, "findOne")
			.mockResolvedValueOnce(templateUsers[0])
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ ...templateUsers[2] });

		await createGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No valid users to be added",
		});
	});
	test("it should fail if the calling user is part of a group", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				name: "Name",
				memberEmails: [
					templateUsers[0].email,
					templateUsers[1].email,
					templateUsers[2].email,
				],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest
			.spyOn(Group, "count")
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(1);
		jest.spyOn(User, "findOne").mockResolvedValueOnce(templateUsers[0]);

		await createGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "You are already part of another group",
		});
	});
	test("it should fail if group with same name exists", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				name: "Name",
				memberEmails: [
					templateUsers[0].email,
					templateUsers[1].email,
					templateUsers[2].email,
				],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(Group, "count").mockResolvedValueOnce(1);

		await createGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "Group already exists",
		});
	});
	test("it should fail if at least one email is not a valid email (wrong format)", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				name: "Name",
				memberEmails: [
					templateUsers[0].email,
					"wronG-format.emailò",
					templateUsers[2].email,
				],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await createGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "The email is not valid",
		});
	});
	test("it should fail if at least one email is an empty string", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				name: "Name",
				memberEmails: [templateUsers[0].email, templateUsers[1].email, ""],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await createGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "The email is not valid",
		});
	});
});

describe("getGroups", () => {
	test("it should return all the groups", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedGroups = [
			{
				name: templateGroups[0].name,
				members: templateGroups[0].members.map(m => {
					return { email: m.email };
				}),
			},
			{
				name: templateGroups[4].name,
				members: templateGroups[4].members.map(m => {
					return { email: m.email };
				}),
			},
			{
				name: templateGroups[5].name,
				members: templateGroups[5].members.map(m => {
					return { email: m.email };
				}),
			},
		];
		jest.spyOn(Group, "find").mockResolvedValueOnce(expectedGroups);
		await getGroups(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedGroups,
			}),
		);
	});
	test("it should fail for not being admin", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		await getGroups(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "Unauthorized",
		});
	});
});

describe("getGroup", () => {
	test("it should return the group", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedGroup = {
			name: templateGroups[0].name,
			members: templateGroups[0].members.map(m => {
				return { email: m.email };
			}),
		};
		jest.spyOn(Group, "findOne").mockResolvedValueOnce(expectedGroup);
		await getGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: templateGroups[0].members.map(m => m.email),
		});
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedGroup,
			}),
		);
	});
	test("it should fail if not authenticated (group)", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedGroup = {
			name: templateGroups[0].name,
			members: templateGroups[0].members.map(m => {
				return { email: m.email };
			}),
		};
		jest.spyOn(Group, "findOne").mockResolvedValueOnce(expectedGroup);
		await getGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: templateGroups[0].members.map(m => m.email),
		});
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Unauthorized",
			}),
		);
	});
	test("it should fail if group does not exist", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);
		await getGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Group not found",
			}),
		);
	});
	test("it return the group if admin (part of the group)", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[5].name}`,
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			params: { name: templateGroups[5].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedGroup = {
			name: templateGroups[5].name,
			members: templateGroups[5].members.map(m => {
				return { email: m.email };
			}),
		};
		jest.spyOn(Group, "findOne").mockResolvedValueOnce(expectedGroup);
		await getGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: templateGroups[5].members.map(m => m.email),
		});
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedGroup,
			}),
		);
	});
	test("it return the group if admin (not part of the group)", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[4].name}`,
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			params: { name: templateGroups[4].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedGroup = {
			name: templateGroups[4].name,
			members: templateGroups[4].members.map(m => {
				return { email: m.email };
			}),
		};
		jest.spyOn(Group, "findOne").mockResolvedValueOnce(expectedGroup);
		await getGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: templateGroups[4].members.map(m => m.email),
		});
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedGroup,
			}),
		);
	});
});

describe("addToGroup", () => {
	//user route
	test("it should add users to group (user)", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}/add`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				emails: [
					templateUsers[0].email,
					templateUsers[1].email,
					templateUsers[3].email,
				],
			},
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const group = templateGroups[0];

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(group);
		jest
			.spyOn(User, "findOne")
			.mockResolvedValueOnce(templateUsers[1])
			.mockResolvedValueOnce(templateUsers[0])
			.mockResolvedValueOnce(null);
		jest
			.spyOn(Group, "count")
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(1);
		jest
			.spyOn(Group, "findOneAndUpdate")
			.mockResolvedValueOnce(templateGroups[0]);
		//mock group
		await addToGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith({
			data: {
				group: {
					name: templateGroups[0].name,
					members: templateGroups[0].members.map(m => {
						return { email: m.email };
					}),
				},
				alreadyInGroup: [templateUsers[1].email],
				membersNotFound: [templateUsers[3].email],
			},
		});
	});
	test("it should fail if not part of the group", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}/add`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const group = templateGroups[0];

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(group);
		//mock group
		await addToGroup(mockReq, mockRes);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: group.members.map(m => m.email),
		});
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "Unauthorized",
		});
	});
	//admin route
	test("it should add users to group (admin)", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}/add`,
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				emails: [
					templateUsers[0].email,
					templateUsers[1].email,
					templateUsers[3].email,
				],
			},
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const group = templateGroups[0];

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(group);
		jest
			.spyOn(User, "findOne")
			.mockResolvedValueOnce(templateUsers[1])
			.mockResolvedValueOnce(templateUsers[0])
			.mockResolvedValueOnce(null);
		jest
			.spyOn(Group, "count")
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(1);
		jest
			.spyOn(Group, "findOneAndUpdate")
			.mockResolvedValueOnce(templateGroups[0]);
		//mock group
		await addToGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					group: {
						name: templateGroups[0].name,
						members: templateGroups[0].members.map(m => {
							return { email: m.email };
						}),
					},
					alreadyInGroup: [templateUsers[1].email],
					membersNotFound: [templateUsers[3].email],
				},
			}),
		);
	});
	test("it should fail if not admin", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}/insert`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const group = templateGroups[0];

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(group);
		//mock group
		await addToGroup(mockReq, mockRes);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.admin,
		});
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "Unauthorized",
		});
	});
	//common
	test("it should fail if group does not exist", async () => {
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}/add`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);
		//mock group
		await addToGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "Group does not exist",
		});
	});
	test("it should fail if body does not contain all the fields", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}/add`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {},
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const group = templateGroups[0];

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(group);
		//mock group
		await addToGroup(mockReq, mockRes);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: templateGroups[0].members.map(m => m.email),
		});
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No member emails provided",
		});
	});
	test("it should fail if all the provided emails are already in a group or do not exist", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}/add`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: { emails: [templateUsers[0].email, templateUsers[1].email] },
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const group = templateGroups[0];

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(group);
		jest
			.spyOn(User, "findOne")
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(templateUsers[0]);
		jest.spyOn(Group, "count").mockResolvedValueOnce(1);

		//mock group
		await addToGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "There are no valid users to be added",
		});
	});
	test("it should fail if at least one email is not in a valid format", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}/add`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: { emails: [templateUsers[0].email, "InvaL1DFORM4T"] },
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const group = templateGroups[0];

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(group);

		//mock group
		await addToGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "The email is not valid",
		});
	});
	test("it should fail if at least one email is an empty string", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `/api/groups/${templateGroups[0].name}/add`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: { emails: [templateUsers[0].email, ""] },
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const group = templateGroups[0];

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(group);

		//mock group
		await addToGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "The email is not valid",
		});
	});
});

describe("removeFromGroup", () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	//user
	test("it should fail if authenticated user is not part of the group", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[0].name}/remove`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: { emails: [templateUsers[0].email, templateUsers[1].email] },
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(templateGroups[0]);
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: [templateUsers[0].email],
		});
	});

	//admin
	test("it should fail if not admin", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[0].name}/pull`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: { emails: [templateUsers[0].email, templateUsers[0].email] },
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(templateGroups[0]);
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.admin,
		});
	});

	//common
	test("it should fail if group does not exist", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[0].name}/pull`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: { emails: [templateUsers[0].email, templateUsers[0].email] },
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({ error: "Group not found" });
		expect(auth).not.toHaveBeenCalled();
	});
	test("it should fail if body does not contain all the fields", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[0].name}/remove`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: { emails: [] },
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(templateGroups[0]);
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({ error: "No emails provided" });
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: [templateUsers[0].email],
		});
	});
	test("it should fail if all the provided emails do not belong to the group or do not exist", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[3].name}/remove`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: { emails: [templateUsers[1].email, templateUsers[2].email] },
			params: { name: templateGroups[3].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(templateGroups[3]);
		jest.spyOn(User, "count").mockResolvedValueOnce(0).mockResolvedValueOnce(1);
		jest.spyOn(Group, "count").mockResolvedValueOnce(0);
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No valid users to be removed",
		});
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: templateGroups[3].members.map(m => m.email),
		});
	});
	test("it should fail if at least one email is not in a valid format", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[3].name}/remove`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: { emails: [templateUsers[1].email, "BaDForMAt"] },
			params: { name: templateGroups[3].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(templateGroups[3]);
		jest.spyOn(User, "count").mockResolvedValueOnce(0).mockResolvedValueOnce(1);
		jest.spyOn(Group, "count").mockResolvedValueOnce(0);
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No valid email provided",
		});
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: templateGroups[3].members.map(m => m.email),
		});
	});
	test("it should fail if at least one email is an empty string", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[3].name}/remove`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: { emails: ["", "", "", templateUsers[1].email] },
			params: { name: templateGroups[3].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(templateGroups[3]);
		jest.spyOn(User, "count").mockResolvedValueOnce(0).mockResolvedValueOnce(1);
		jest.spyOn(Group, "count").mockResolvedValueOnce(0);
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No valid email provided",
		});
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: templateGroups[3].members.map(m => m.email),
		});
	});
	test("it should fail if the group contains only one member", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[0].name}/remove`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: { emails: [templateGroups[0].members[0].email] },
			params: { name: templateGroups[0].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValueOnce(templateGroups[0]);
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No users can be removed",
		});
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: templateGroups[0].members.map(m => m.email),
		});
	});
	test("it should remove an user from a group", async () => {
		const deletedEmails = [
			templateGroups[3].members[0].email,
			templateGroups[3].members[1].email,
		];
		const groupAfter = {
			name: templateGroups[3].name,
			members: templateGroups[3].members
				.filter(m => !deletedEmails.includes(m.email))
				.map(m => {
					return { email: m.email };
				}),
		};
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[3].name}/remove`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				emails: deletedEmails,
			},
			params: { name: templateGroups[3].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest
			.spyOn(Group, "findOne")
			.mockResolvedValueOnce(templateGroups[3])
			.mockResolvedValueOnce({
				name: templateGroups[3].name,
				members: groupAfter.members,
			});
		jest
			.spyOn(User, "count")
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1);
		jest
			.spyOn(Group, "count")
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1);
		jest.spyOn(Group, "updateOne").mockReturnValueOnce({ modifiedCount: 1 });
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					group: groupAfter,
					membersNotFound: [],
					notInGroup: [],
				},
			}),
		);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: templateGroups[3].members.map(m => m.email),
		});
	});
	test("it should remove an user from a group and one not found", async () => {
		jest.clearAllMocks();
		const deletedEmails = [
			templateGroups[3].members[0].email,
			templateGroups[3].members[1].email,
		];
		const groupAfter = {
			name: templateGroups[3].name,
			members: templateGroups[3].members
				.filter(m => !deletedEmails.includes(m.email))
				.map(m => {
					return { email: m.email };
				}),
		};
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[3].name}/remove`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				emails: [...deletedEmails, "notme@existing.com"],
			},
			params: { name: templateGroups[3].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest
			.spyOn(Group, "findOne")
			.mockResolvedValueOnce(templateGroups[3])
			.mockResolvedValueOnce({
				name: templateGroups[3].name,
				members: groupAfter.members,
			});
		jest
			.spyOn(User, "count")
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(0);
		jest
			.spyOn(Group, "count")
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1);
		jest.spyOn(Group, "updateOne").mockReturnValueOnce({ modifiedCount: 1 });
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					group: groupAfter,
					membersNotFound: ["notme@existing.com"],
					notInGroup: [],
				},
			}),
		);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.group,
			emails: templateGroups[3].members.map(m => m.email),
		});
	});
	test("it should remove an user from a group and one not in group", async () => {
		jest.resetAllMocks();
		const deletedEmails = [
			templateGroups[3].members[0].email,
			templateGroups[3].members[1].email,
		];
		const groupAfter = {
			name: templateGroups[3].name,
			members: templateGroups[3].members
				.filter(m => !deletedEmails.includes(m.email))
				.map(m => {
					return { email: m.email };
				}),
		};
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[3].name}/remove`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				emails: [...deletedEmails, "newmail@email.com"],
			},
			params: { name: templateGroups[3].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest
			.spyOn(Group, "findOne")
			.mockResolvedValueOnce(templateGroups[3])
			.mockResolvedValueOnce({
				name: templateGroups[3].name,
				members: groupAfter.members,
			});
		jest
			.spyOn(User, "count")
			.mockResolvedValueOnce(1) //those are ignored by jest
			.mockResolvedValueOnce(1) //don't ask me why
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1); //newmail
		jest
			.spyOn(Group, "count")
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(0);
		jest.spyOn(Group, "updateOne").mockReturnValueOnce({ modifiedCount: 1 });
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					group: groupAfter,
					membersNotFound: [],
					notInGroup: ["newmail@email.com"],
				},
			}),
		);
	});
	test("it should remove all the users except the first one", async () => {
		const deletedEmails = [
			templateGroups[3].members[0].email,
			templateGroups[3].members[1].email,
			templateGroups[3].members[2].email,
			templateGroups[3].members[3].email,
		];
		const groupAfter = {
			name: templateGroups[3].name,
			members: [{ email: templateGroups[3].members[0].email }],
		};
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Authorized" });
		const mockReq = {
			url: `api/groups/${templateGroups[3].name}/remove`,
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				emails: deletedEmails,
			},
			params: { name: templateGroups[3].name },
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest
			.spyOn(Group, "findOne")
			.mockResolvedValueOnce(templateGroups[3])
			.mockResolvedValueOnce({
				name: templateGroups[3].name,
				members: groupAfter.members,
			});
		jest
			.spyOn(User, "count")
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1);
		jest
			.spyOn(Group, "count")
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1);
		jest.spyOn(Group, "updateOne").mockReturnValueOnce({ modifiedCount: 1 });
		await removeFromGroup(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					group: groupAfter,
					membersNotFound: [],
					notInGroup: [],
				},
			}),
		);
	});
});

describe("deleteUser", () => {
	test("it should fail if not admin", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				email: defaults.user.email,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteUser(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Unauthorized",
			}),
		);
	});
	test("it should delete the user successfully", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedRes = {
			trans_deleted: 17,
		};
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				email: templateUsers[0].email,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValue(templateUsers[0]);
		jest.spyOn(User, "deleteOne").mockResolvedValue({ deletedCount: 1 });
		jest.spyOn(Group, "findOne").mockResolvedValue(templateGroups[1]);
		jest.spyOn(Group, "updateOne").mockResolvedValue(true);
		jest
			.spyOn(transactions, "deleteMany")
			.mockResolvedValue({ deletedCount: expectedRes.trans_deleted });

		await deleteUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					deletedTransactions: expectedRes.trans_deleted,
					deletedFromGroup: true,
				},
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it should fail because of missing fields in the body", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				username: "abc",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No email provided",
			}),
		);
	});
	test("it should fail if email is not in a valid format", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				email: "not-valid$.email",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Invalid email",
			}),
		);
	});
	test("it should fail if email is an empty string", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				email: "",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No email provided",
			}),
		);
	});
	test("it should fail if the email does not belong to any user in the db", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				email: "notExistin@user.mail",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValue(undefined);
		await deleteUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "User does not exist",
			}),
		);
	});
	test("if the user is the last member of a group the group must be deleted", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				email: templateUsers[0].email,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValue(templateUsers[0]);
		jest.spyOn(User, "deleteOne").mockResolvedValue({ deletedCount: 1 });
		jest.spyOn(Group, "findOne").mockResolvedValue(templateGroups[0]);
		jest.spyOn(Group, "deleteOne").mockResolvedValue({ deletedCount: 1 });
		jest
			.spyOn(transactions, "deleteMany")
			.mockResolvedValue({ deletedCount: 17 });
		await deleteUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					deletedTransactions: 17,
					deletedFromGroup: true,
				},
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
});

describe("deleteGroup", () => {
	test("it should delete the group successfully", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Unauthorized" });
		const mockReq = {
			url: "api/groups",
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				// name: "",
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(Group, "count").mockResolvedValueOnce(0);
		await deleteGroup(mockReq, mockRes);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.admin,
		});
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No name provided",
		});
	});
	test("it should fail if not admin", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
		const mockReq = {
			url: "api/groups",
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				name: templateGroups[0].name,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		await deleteGroup(mockReq, mockRes);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.admin,
		});
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "Unauthorized",
		});
	});
	test("it should fail if there is no group with that name", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Unauthorized" });
		const mockReq = {
			url: "api/groups",
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				name: "notFound",
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(Group, "count").mockResolvedValueOnce(0);
		await deleteGroup(mockReq, mockRes);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.admin,
		});
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "Group not found",
		});
	});
	test("it should fail if there are missing fields in the body", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Unauthorized" });
		const mockReq = {
			url: "api/groups",
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				// name: "",
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(Group, "count").mockResolvedValueOnce(0);
		await deleteGroup(mockReq, mockRes);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.admin,
		});
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No name provided",
		});
	});
	test("it should fail if the name is an empty string", async () => {
		const auth = jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValueOnce({ flag: true, cause: "Unauthorized" });
		const mockReq = {
			url: "api/groups",
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				name: "",
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(Group, "count").mockResolvedValueOnce(0);
		await deleteGroup(mockReq, mockRes);
		expect(auth).toHaveBeenCalledWith(mockReq, mockRes, {
			authType: authTypes.admin,
		});
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No name provided",
		});
	});
});
