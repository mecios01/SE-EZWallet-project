import { User } from "../models/User.js";
import {
	defaults,
	templateAdmins,
	templateUsers,
} from "../controllers/test-utils.js";
import { login, logout, register, registerAdmin } from "../controllers/auth.js";
import { roles } from "../constants/constants.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../models/User.js");

beforeAll(() => {
	jest.clearAllMocks();
	jest.restoreAllMocks();
});
describe("register", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});
	test("it should create a new user successfully", async () => {
		const mockReq = {
			body: {
				...{ ...templateUsers[0], role: undefined },
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(User, "count").mockResolvedValueOnce(0);
		jest.spyOn(User, "create").mockResolvedValueOnce({ done: true }); //justs avoid the real interaction with db

		await register(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					message: "User added successfully",
				},
			}),
		);
	});
	test("it should fail because of missing or invalid body (username)", async () => {
		const mockReq = {
			body: {
				email: templateUsers[0].email,
				// username: templateUsers[0].username,
				password: templateUsers[0].password,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(User, "count").mockResolvedValueOnce(0);
		jest.spyOn(User, "create").mockResolvedValueOnce({ done: true }); //justs avoid the real interaction with db

		await register(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No username provided",
		});
	});
	test("it should fail because of missing or invalid body (email)", async () => {
		const mockReq = {
			body: {
				// email: templateUsers[0].email,
				username: templateUsers[0].username,
				password: templateUsers[0].password,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(User, "count").mockResolvedValueOnce(0);
		jest.spyOn(User, "create").mockResolvedValueOnce({ done: true }); //justs avoid the real interaction with db

		await register(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No valid email provided",
		});
	});
	test("it should fail because of missing or invalid body (password)", async () => {
		const mockReq = {
			body: {
				email: templateUsers[0].email,
				username: templateUsers[0].username,
				password: "",
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(User, "count").mockResolvedValueOnce(0);
		jest.spyOn(User, "create").mockResolvedValueOnce({ done: true }); //justs avoid the real interaction with db

		await register(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "No password provided",
		});
	});
	test("it should fail because of another user exist with that email/password", async () => {
		const mockReq = {
			body: {
				email: templateUsers[0].email,
				username: templateUsers[0].username,
				password: templateUsers[0].password,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(User, "count").mockResolvedValueOnce(1);
		jest.spyOn(User, "create").mockResolvedValueOnce({ done: true }); //justs avoid the real interaction with db
		await register(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: "there is already a user with that username or email",
		});
	});
});

describe("registerAdmin", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});
	test("it should create a new admin successfully", async () => {
		const mockReq = {
			body: {
				...{ ...templateAdmins[0], role: undefined },
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(bcrypt, "hash").mockResolvedValueOnce("whatsoeverPass");
		jest.spyOn(User, "findOne").mockResolvedValueOnce(null);
		const create = jest
			.spyOn(User, "create")
			.mockResolvedValueOnce({ done: true }); //justs avoid the real interaction with db

		await registerAdmin(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({ role: roles.admin }),
		);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					message: "Admin added successfully",
				},
			}),
		);
	});
	test("it should fail because of missing or invalid body (no username)", async () => {
		const mockReq = {
			body: {
				// username: templateAdmins[0].username,
				email: templateAdmins[0].email,
				password: templateAdmins[0].password,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest
			.spyOn(User, "findOne")
			.mockResolvedValueOnce({ template: "truishObject" });
		const create = jest
			.spyOn(User, "create")
			.mockResolvedValueOnce({ done: true }); //justs avoid the real interaction with db

		await registerAdmin(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(create).not.toHaveBeenCalled();
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No username provided",
			}),
		);
	});
	test("it should fail because of missing or invalid body (no email)", async () => {
		const mockReq = {
			body: {
				username: templateAdmins[0].username,
				email: "",
				password: templateAdmins[0].password,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest
			.spyOn(User, "findOne")
			.mockResolvedValueOnce({ template: "truishObject" });
		const create = jest
			.spyOn(User, "create")
			.mockResolvedValueOnce({ done: true }); //justs avoid the real interaction with db

		await registerAdmin(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(create).not.toHaveBeenCalled();
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No valid email provided",
			}),
		);
	});
	test("it should fail because of missing or invalid body (no password)", async () => {
		const mockReq = {
			body: {
				username: templateAdmins[0].username,
				email: templateAdmins[0].email,
				// password: templateAdmins[0].password,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest
			.spyOn(User, "findOne")
			.mockResolvedValueOnce({ template: "truishObject" });
		const create = jest
			.spyOn(User, "create")
			.mockResolvedValueOnce({ done: true }); //justs avoid the real interaction with db

		await registerAdmin(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(create).not.toHaveBeenCalled();
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No password provided",
			}),
		);
	});
	test("it should fail because of another user exist with that email/password", async () => {
		const mockReq = {
			body: {
				username: templateAdmins[0].username,
				email: templateAdmins[0].email,
				password: templateAdmins[0].password,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest
			.spyOn(User, "findOne")
			.mockResolvedValueOnce({ template: "truishObject" });
		const create = jest
			.spyOn(User, "create")
			.mockResolvedValueOnce({ done: true }); //justs avoid the real interaction with db

		await registerAdmin(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(create).not.toHaveBeenCalled();
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "email or username already exist",
			}),
		);
	});
});

describe("login", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	test("it should perform the login", async () => {
		const mockReq = {
			body: {
				email: templateUsers[0].email,
				password: templateUsers[0].password,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			cookie: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValueOnce({
			email: defaults.user.email,
			id: defaults.user.id,
			username: defaults.user.username,
			password: "hashedPass",
			role: defaults.user.role,
		});
		jest.spyOn(User, "findOneAndUpdate").mockResolvedValueOnce();
		jest
			.spyOn(jwt, "sign")
			.mockReturnValueOnce("accessToken")
			.mockReturnValueOnce("refreshToken");
		jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(true);

		await login(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { accessToken: "accessToken", refreshToken: "refreshToken" },
			}),
		);
		expect(mockRes.cookie).toHaveBeenCalledTimes(2);
	});

	test("it should fail because of missing or invalid body (password)", async () => {
		const mockReq = {
			body: {
				email: templateUsers[0].email,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			cookie: jest.fn(),
		};

		await login(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No password provided",
			}),
		);
		expect(mockRes.cookie).not.toHaveBeenCalled();
	});
	test("it should fail because of missing or invalid body (email)", async () => {
		const mockReq = {
			body: {
				email: "",
				password: templateUsers[0].password,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			cookie: jest.fn(),
		};

		await login(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No valid email provided",
			}),
		);
		expect(mockRes.cookie).not.toHaveBeenCalled();
	});
	test("it should fail because of invalid credentials", async () => {
		const mockReq = {
			body: {
				email: templateUsers[0].email,
				password: templateUsers[0].password,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			cookie: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValueOnce({
			email: defaults.user.email,
			id: defaults.user.id,
			username: defaults.user.username,
			password: "hashedPass",
			role: defaults.user.role,
		});
		jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(false);

		await login(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "wrong credentials",
			}),
		);
		expect(mockRes.cookie).not.toHaveBeenCalled();
	});
	test("it should fail because user does not exist", async () => {
		const mockReq = {
			body: {
				email: templateUsers[0].email,
				password: templateUsers[0].password,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			cookie: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

		await login(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "please you need to register",
			}),
		);
		expect(mockRes.cookie).not.toHaveBeenCalled();
	});
});

describe("logout", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	test("it should perform the logout", async () => {
		const mockReq = {
			cookies: {
				accessToken: "accessToken",
				refreshToken: "refreshToken",
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			cookie: jest.fn(),
		};
		//add the spyOn

		jest.spyOn(User, "findOne").mockResolvedValueOnce(templateUsers[0]);
		await logout(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { message: "User logged out" },
			}),
		);
		expect(mockRes.cookie).toHaveBeenCalledTimes(2);
	});
	test("it should fail because of missing refresh token in cookies", async () => {
		const mockReq = {
			cookies: {
				accessToken: "accessToken",
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			cookie: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValueOnce(templateUsers[0]);
		await logout(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No refresh token provided",
			}),
		);
	});
	test("it should fail because the cookie does not represent a user in the db", async () => {
		const mockReq = {
			cookies: {
				accessToken: "accessToken",
				refreshToken: "refreshToken",
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			cookie: jest.fn(),
		};
		//add the spyOn

		jest.spyOn(User, "findOne").mockResolvedValueOnce(null);
		await logout(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "User not found",
			}),
		);
		expect(mockRes.cookie).toHaveBeenCalledTimes(0);
	});
});
