import { categories, transactions } from "../models/model";
import * as utils from "../controllers/utils.js";
import {
	defaults,
	templateAdmins,
	templateCategories,
	templateTransactions,
	templateUsers,
} from "../controllers/test-utils.js";
import dayjs from "dayjs";
import { Group, User } from "../models/User.js";
import {
	createTransaction,
	deleteTransaction,
	deleteTransactions,
	getAllTransactions,
	getTransactionsByGroup,
	getTransactionsByGroupByCategory,
	getTransactionsByUser,
	getTransactionsByUserByCategory,
	createCategory,
	updateCategory,
	deleteCategory,
	getCategories,
} from "../controllers/controller.js";
import { validateRequest, verifyAuth } from "../controllers/utils.js";

jest.mock("../models/model");
beforeEach(() => {
	jest.clearAllMocks();
});

describe("createCategory", () => {
	test("it should return unauthorized (not admin)", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				type: templateCategories[0].type,
				color: templateCategories[0].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: false, cause: "Unauthorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		await createCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
	test("it should create a new category", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				type: templateCategories[0].type,
				color: templateCategories[0].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedcategory = {
			type: templateCategories[0].type,
			color: templateCategories[0].color,
		};
		jest.spyOn(categories, "count").mockReturnValue(0);
		jest.spyOn(categories, "create").mockResolvedValueOnce(expectedcategory);

		await createCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedcategory,
			}),
		);
	});
	test("it should fail for missing body fields", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				//type: templateCategories[0].type,
				color: templateCategories[0].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(categories, "count").mockReturnValue(0);
		jest.spyOn(categories, "create").mockResolvedValueOnce({ done: true });

		await createCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No type provided",
			}),
		);
	});
	test("it should fail for one or both fields being an empty string", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				type: templateCategories[0].type,
				color: "",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(categories, "count").mockReturnValue(0);
		jest.spyOn(categories, "create").mockResolvedValueOnce({ done: true });

		await createCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No color provided",
			}),
		);
	});
	test("it should fail for category already existing", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				type: templateCategories[0].type,
				color: templateCategories[0].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest
			.spyOn(categories, "count")
			.mockReturnValue({ type: templateCategories[0].type });
		jest.spyOn(categories, "create").mockResolvedValueOnce({ done: true });

		await createCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Category already exist",
			}),
		);
	});
});
describe("updateCategory", () => {
	test("it should return unauthorized (not admin)", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				type: templateCategories[0].type,
				color: templateCategories[0].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: false, cause: "Unauthorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		await updateCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
	test("It should fail because of the body missing", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: {
				type: templateCategories[0].type,
			},
			body: {
				type: templateCategories[0].type,
				//color: templateCategories[0].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: true, cause: "Authorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		await updateCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No color provided",
			}),
		);
	});
	test("it should fail for at least one field being an empty string", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: {
				type: templateCategories[0].type,
			},
			body: {
				type: "",
				color: templateCategories[0].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: true, cause: "Authorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		await updateCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No new type provided",
			}),
		);
	});
	test("It should fail for no category found", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: {
				type: templateCategories[0].type,
			},
			body: {
				type: templateCategories[0].type,
				color: templateCategories[0].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: true, cause: "Authorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		jest.spyOn(categories, "findOne").mockReturnValue(0);
		await updateCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Category not found",
			}),
		);
	});
	test("It should update the category with no changes", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: {
				type: templateCategories[0].type,
			},
			body: {
				type: templateCategories[1].type,
				color: templateCategories[0].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: true, cause: "Authorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		jest
			.spyOn(categories, "findOne")
			.mockResolvedValueOnce(templateCategories[0]);
		jest.spyOn(categories, "findOne").mockResolvedValueOnce(false);
		jest.spyOn(categories, "updateOne").mockReturnThis();
		jest.spyOn(transactions, "count").mockResolvedValueOnce(0);
		await updateCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { message: "No changes applied", count: 0 },
			}),
		);
	});
	test("It should update the category with changes", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: {
				type: templateCategories[0].type,
			},
			body: {
				type: templateCategories[1].type,
				color: templateCategories[0].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: true, cause: "Authorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		jest
			.spyOn(categories, "findOne")
			.mockResolvedValueOnce({ type: templateCategories[0].type });
		jest.spyOn(categories, "findOne").mockResolvedValueOnce(false);
		jest.spyOn(categories, "updateOne").mockResolvedValueOnce({
			type: templateCategories[1].type,
			color: templateCategories[0].color,
		});
		jest.spyOn(transactions, "count").mockResolvedValueOnce(1);
		await updateCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { message: "Category edited successfully", count: 1 },
			}),
		);
	});
	//new feature: allow change the color only (same type bypasses the "already existing error")
	test("It should update the color of a given category", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: {
				type: templateCategories[0].type,
			},
			body: {
				type: templateCategories[0].type,
				color: templateCategories[2].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: true, cause: "Authorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		jest
			.spyOn(categories, "findOne")
			.mockResolvedValueOnce(templateCategories[0]);
		jest.spyOn(categories, "findOne").mockResolvedValueOnce(false);
		jest.spyOn(categories, "updateOne").mockResolvedValueOnce({
			type: templateCategories[0].type,
			color: templateCategories[2].color,
		});
		jest.spyOn(transactions, "count").mockResolvedValueOnce(1);
		await updateCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { message: "Category edited successfully", count: 0 },
			}),
		);
	});
	test("it should fail for category already existing", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: {
				type: templateCategories[0].type,
			},
			body: {
				type: templateCategories[2].type,
				color: templateCategories[2].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest
			.spyOn(categories, "findOne")
			.mockResolvedValueOnce(templateCategories[1]);
		jest
			.spyOn(categories, "findOne")
			.mockResolvedValueOnce(templateCategories[2]);

		await updateCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Category with such type already exists",
			}),
		);
	});
});
describe("deleteCategory", () => {
	test("it should return unauthorized (not admin)", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				types: [
					templateCategories[0].type,
					templateCategories[1].type,
					templateCategories[2].type,
				],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: false, cause: "Unauthorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		await deleteCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
	test("it should fail for missing attributes", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			// body: {
			// 	types: [
			// 		templateCategories[0].type,
			// 		templateCategories[1].type,
			// 		templateCategories[2].type,
			// 	],
			// },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: true, cause: "Authorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		await deleteCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No body provided",
			}),
		);
	});
	test("it should fail for having only a category in the database", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				types: [
					templateCategories[0].type,
					templateCategories[1].type,
					templateCategories[2].type,
				],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: true, cause: "Authorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);
		jest.spyOn(categories, "count").mockResolvedValueOnce(1);
		jest.spyOn(Array, "from").mockResolvedValueOnce(true);
		jest.spyOn(Promise, "all").mockResolvedValueOnce(true);
		await deleteCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "There is only 1 category in database",
			}),
		);
	});
	test("it should fail for at least one of the categories in the body not in the database", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				types: [
					templateCategories[0].type,
					templateCategories[1].type,
					templateCategories[2].type,
				],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const expectedRes = { flag: true, cause: "Authorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);
		jest.spyOn(categories, "count").mockResolvedValueOnce({
			types: [
				templateCategories[0].type,
				templateCategories[1].type,
				templateCategories[2].type,
				templateCategories[3].type,
				templateCategories[4].type,
			],
		});
		jest.spyOn(Array, "from").mockResolvedValueOnce(true);
		jest.spyOn(Promise, "all").mockResolvedValueOnce(true);
		jest.spyOn(categories, "findOne").mockResolvedValueOnce(false);
		await deleteCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Category no found",
			}),
		);
	});
	test("it should remove all the categories in the array if N>T", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				types: [
					templateCategories[0].type,
					templateCategories[1].type,
					templateCategories[2].type,
				],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		jest.spyOn(categories, "count").mockResolvedValueOnce(5);
		jest.spyOn(categories, "findOne").mockResolvedValueOnce(true);

		jest.spyOn(categories, "findOne").mockResolvedValueOnce({
			type: templateCategories[0].type,
			color: templateCategories[0].color,
		});
		jest
			.spyOn(categories, "deleteOne")
			.mockResolvedValueOnce(templateCategories[0])
			.mockResolvedValueOnce(templateCategories[1])
			.mockResolvedValueOnce(templateCategories[2]);

		jest
			.spyOn(categories, "findOne")
			.mockResolvedValueOnce(templateCategories[1])
			.mockResolvedValueOnce(templateCategories[2]);

		const expectedRes = {
			count: 0,
			message: "Categories deleted",
		};
		jest.spyOn(transactions, "find").mockResolvedValueOnce(true);
		jest.spyOn(transactions, "updateMany").mockResolvedValueOnce(true);
		await deleteCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes,
			}),
		);
	});
	test("it should remove all the categories except the first one if N=T", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				types: [
					templateCategories[0].type,
					templateCategories[1].type,
					templateCategories[2].type,
				],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		jest.spyOn(categories, "count").mockResolvedValueOnce(3);
		//return a set
		jest.spyOn(Array, "from").mockResolvedValueOnce(true);
		//find all categories that are wanted to delete
		jest.spyOn(Promise, "all").mockResolvedValueOnce(true);
		jest.spyOn(categories, "findOne").mockResolvedValueOnce(true);

		jest.spyOn(categories, "findOne").mockResolvedValueOnce({
			type: templateCategories[0].type,
			color: templateCategories[0].color,
		});
		jest
			.spyOn(categories, "deleteOne")
			.mockResolvedValueOnce({
				type: templateCategories[0].type,
				color: templateCategories[0].color,
			})
			.mockResolvedValueOnce({
				type: templateCategories[1].type,
				color: templateCategories[1].color,
			})
			.mockResolvedValueOnce({
				type: templateCategories[2].type,
				color: templateCategories[2].color,
			});
		jest
			.spyOn(categories, "findOne")
			.mockResolvedValueOnce({
				type: templateCategories[1].type,
				color: templateCategories[1].color,
			})
			.mockResolvedValueOnce({
				type: templateCategories[2].type,
				color: templateCategories[2].color,
			});
		const expectedRes = {
			count: 0,
			message: "Categories deleted",
		};
		jest.spyOn(transactions, "find").mockResolvedValueOnce(true);
		jest.spyOn(transactions, "updateMany").mockResolvedValueOnce(true);
		await deleteCategory(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes,
			}),
		);
	});
});
describe("getCategories", () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});
	test("it should fail if the user is not authenticated (simple auth)", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				//refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				type: templateCategories[0].type,
				color: templateCategories[0].color,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const expectedRes = { flag: false, cause: "Unauthorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		await getCategories(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Unauthorized",
			}),
		);
	});
	test("it should return the categories", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
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
		const expectedcategories = [
			{
				type: templateCategories[0].type,
				color: templateCategories[0].color,
			},
			{
				type: templateCategories[1].type,
				color: templateCategories[1].color,
			},
			{
				type: templateCategories[2].type,
				color: templateCategories[2].color,
			},
		];

		jest.spyOn(categories, "find").mockReturnValue(expectedcategories);

		await getCategories(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedcategories.map(v => {
					return {
						type: v.type,
						color: v.color,
					};
				}),
			}),
		);
	});
	test("it should return null if no category", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
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

		jest.spyOn(categories, "find").mockReturnValue(0);
		await getCategories(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: [],
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
});
describe("createTransaction", () => {
	test("it should create the transaction", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expected = {
			body: {
				username: defaults.user.username,
				amount: 10,
				type: "food",
			},
			status: 200,
		};

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: {
				username: defaults.user.username,
			},
			body: expected.body,
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(categories, "findOne").mockResolvedValue(expected.body.type);
		jest.spyOn(User, "findOne").mockResolvedValue(expected.body.username);
		jest.spyOn(transactions, "create").mockResolvedValue(expected.body);

		await createTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(expected.status);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expected.body,
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it should fail for missing or wrong parameters", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expected = {
			body: {
				username: defaults.user.username,
				amount: 10,
				type: "food",
			},
			status: 400,
		};

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: expected.body,
			params: {},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValue(expected.body.username);
		jest.spyOn(categories, "findOne").mockResolvedValue(expected.body.type);
		jest.spyOn(transactions, "create").mockResolvedValue(expected.body);

		await createTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(expected.status);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: "Username required" }),
		);
	});
	test("it should fail for missing at least one field being an empty string", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expected = {
			body: {
				username: defaults.user.username,
				amount: 10,
				type: "",
			},
			status: 400,
		};

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
			body: expected.body,
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await createTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(expected.status);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: "No category provided" }),
		);
	});
	test("it should fail if the amount cannot be parsed as a float value", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expected = {
			body: {
				username: defaults.user.username,
				amount: "wrong",
				type: "food",
			},
			status: 400,
		};

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: {
				username: defaults.user.username,
			},
			body: expected.body,
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await createTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(expected.status);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "The amount must be a number",
			}),
		);
	});
	test("it should fail for missing category", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expected = {
			body: {
				username: defaults.user.username,
				amount: 10,
				type: "food",
			},
			status: 400,
		};

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
			body: expected.body,
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValue(expected.body.username);
		jest.spyOn(categories, "findOne").mockResolvedValue(null);

		await createTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(expected.status);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: "Category not found" }),
		);
	});
	test("it should fail for username not equal to the one passed as route parameter", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expected = {
			body: {
				username: defaults.user.username,
				amount: 10,
				type: "food",
			},
			status: 400,
		};

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: {
				username: templateUsers[0].username,
			},
			body: expected.body,
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await createTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(expected.status);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Usernames are not the same",
			}),
		);
	});
	test("it should fail for user not in the database", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expected = {
			body: {
				username: defaults.user.username,
				amount: 10,
				type: "food",
			},
			status: 400,
		};

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
			body: expected.body,
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "findOne").mockResolvedValue(null);
		jest.spyOn(categories, "findOne").mockResolvedValue(expected.body.type);
		jest.spyOn(transactions, "create").mockResolvedValue(expected.body);

		await createTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(expected.status);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: "User not found" }),
		);
	});
});
describe("getAllTransactions", () => {
	test("it should fail for not being admin", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });
		const expectedRes = { flag: false, cause: "Unauthorized" };
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

		await getAllTransactions(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
	test("it returns all the transactions", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = [
			{
				username: templateUsers[3].username,
				amount: 213,
				categories_info: {
					type: templateCategories[1].type,
					color: templateCategories[1].color,
				},
				type: templateCategories[1].type,
				date: dayjs(),
			},
			{
				username: templateAdmins[0].username,
				amount: 21.27,
				type: templateCategories[0].type,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				date: dayjs(),
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

		jest.spyOn(transactions, "aggregate").mockResolvedValue(expectedRes);

		await getAllTransactions(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it returns an empty array", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
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

		jest.spyOn(transactions, "aggregate").mockResolvedValue(expectedRes);

		await getAllTransactions(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: [],
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
});
describe("getTransactionsByUser", () => {
	//user only route
	test("it should fail for an authenticated user not being the same as the one in the route", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });

		const expectedRes = { flag: false, cause: "Unauthorized" };
		const otherUsername = "otheruser";

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url: "http://localhost:3000/api/users/" + otherUsername + "/transactions",
			params: { username: otherUsername },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await getTransactionsByUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
	test("it should fail user not in the db", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = { res: 0, error: "User not found" };
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/users/" +
				defaults.user.username +
				"/transactions",
			params: { username: defaults.user.username },
		};

		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(expectedRes.res);

		await getTransactionsByUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
	test("it should return the transactions (not filtered)", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = [
			{
				username: defaults.user.username,
				amount: 213,
				categories_info: {
					type: templateCategories[1].type,
					color: templateCategories[1].color,
				},
				type: templateCategories[1].type,
				date: dayjs(),
			},
			{
				username: defaults.user.username,
				amount: 21.27,
				type: templateCategories[0].type,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				date: dayjs(),
			},
		];
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/users/" +
				defaults.user.username +
				"/transactions",
			params: { username: defaults.user.username },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		jest.spyOn(transactions, "aggregate").mockResolvedValue(expectedRes);
		await getTransactionsByUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it should return the transactions (filtered by date)", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedRes = [
			{
				username: defaults.user.username,
				amount: 213,
				categories_info: {
					type: templateCategories[1].type,
					color: templateCategories[1].color,
				},
				type: templateCategories[1].type,
				date: "2023-05-05",
			},
			{
				username: defaults.user.username,
				amount: 21.27,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				type: templateCategories[0].type,
				date: "2023-05-05",
			},
		];
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/users/" +
				defaults.user.username +
				"/transactions",
			params: { username: defaults.user.username },
			query: {
				date: "2023-05-05",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const endOfTheDay = dayjs
			.utc("2023-05-05", "YYYY-MM-DD", true)
			.utcOffset(0)
			.endOf("day")
			.toDate();
		const startOfTheDay = dayjs
			.utc("2023-05-05", "YYYY-MM-DD", true)
			.utcOffset(0)
			.startOf("day")
			.toDate();

		const expectedDateFilter = {
			$gte: startOfTheDay,
			$lte: endOfTheDay,
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		const aggregate = jest
			.spyOn(transactions, "aggregate")
			.mockResolvedValue(expectedRes);
		await getTransactionsByUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(aggregate).toHaveBeenCalledWith([
			{
				$match: {
					date: expectedDateFilter,
					username: defaults.user.username,
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
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it should return the transactions (filtered by amount)", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = [
			{
				username: defaults.user.username,
				amount: 213,
				categories_info: {
					type: templateCategories[1].type,
					color: templateCategories[1].color,
				},
				type: templateCategories[1].type,
				date: dayjs(),
			},
			{
				username: defaults.user.username,
				amount: 23.5,
				type: templateCategories[0].type,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				date: dayjs(),
			},
		];
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/users/" +
				defaults.user.username +
				"/transactions",
			params: { username: defaults.user.username },
			query: {
				min: 50,
				max: 250,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const expectedAmountFilter = {
			$gte: 50,
			$lte: 250,
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		const aggregate = jest
			.spyOn(transactions, "aggregate")
			.mockResolvedValue(expectedRes);
		await getTransactionsByUser(mockReq, mockRes);

		expect(aggregate).toHaveBeenCalledWith([
			{
				$match: {
					amount: expectedAmountFilter,
					username: defaults.user.username,
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
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it should return the transactions (filtered by date and amount)", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedRes = [
			{
				username: defaults.user.username,
				amount: 213,
				categories_info: {
					type: templateCategories[1].type,
					color: templateCategories[1].color,
				},
				type: templateCategories[1].type,
				date: "2023-05-05",
			},
			{
				username: defaults.user.username,
				amount: 21.27,
				type: templateCategories[0].type,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				date: "2023-05-05",
			},
		];
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/users/" +
				defaults.user.username +
				"/transactions",
			params: { username: defaults.user.username },
			query: {
				date: "2023-05-05",
				min: 20,
				max: 250,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		const endOfTheDay = dayjs
			.utc("2023-05-05", "YYYY-MM-DD", true)
			.utcOffset(0)
			.endOf("day")
			.toDate();
		const startOfTheDay = dayjs
			.utc("2023-05-05", "YYYY-MM-DD", true)
			.utcOffset(0)
			.startOf("day")
			.toDate();

		const expectedDateFilter = {
			$gte: startOfTheDay,
			$lte: endOfTheDay,
		};
		const expectedAmountFilter = {
			$gte: 20,
			$lte: 250,
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		const aggregate = jest
			.spyOn(transactions, "aggregate")
			.mockResolvedValue(expectedRes);
		await getTransactionsByUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(aggregate).toHaveBeenCalledWith([
			{
				$match: {
					date: expectedDateFilter,
					amount: expectedAmountFilter,
					username: defaults.user.username,
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
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	//admin only route
	test("it should fail for not being an admin", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });
		const expectedRes = { flag: false, cause: "Unauthorized" };
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url: "http://localhost:3000/api/transactions/users/",
			params: { username: defaults.user.username },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await getTransactionsByUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
	test("it should return the transactions (not filtered)", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = [
			{
				username: defaults.user.username,
				amount: 213,
				categories_info: {
					type: templateCategories[1].type,
					color: templateCategories[1].color,
				},
				type: templateCategories[1].type,
				date: dayjs(),
			},
			{
				username: defaults.user.username,
				amount: 21.27,
				type: templateCategories[0].type,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				date: dayjs(),
			},
		];
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			url: "http://localhost:3000/api/transactions/users/",
			params: { username: defaults.user.username },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		jest.spyOn(transactions, "aggregate").mockResolvedValue(expectedRes);
		await getTransactionsByUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it should returns the transactions without applying the filter", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = [
			{
				username: defaults.user.username,
				amount: 213,
				categories_info: {
					type: templateCategories[1].type,
					color: templateCategories[1].color,
				},
				type: templateCategories[1].type,
				date: dayjs("2022-05-05"),
			},
			{
				username: defaults.user.username,
				amount: 21.27,
				type: templateCategories[0].type,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				date: dayjs("2020-05-05"),
			},
		];
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/transactions/users/" +
				defaults.user.username,
			params: { username: defaults.user.username },
			query: {
				date: "2022-05-05",
				min: 50,
				max: 250,
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		const aggregate = jest
			.spyOn(transactions, "aggregate")
			.mockResolvedValue(expectedRes);
		await getTransactionsByUser(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(aggregate).toHaveBeenCalledWith([
			{
				$match: { username: defaults.user.username },
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
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
});

describe("getTransactionsByUserByCategory", () => {
	//user only route
	test("it should fail for an authenticated user not being the same as the one in the route", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });

		const expectedRes = { flag: false, cause: "Unauthorized" };
		const requestedCategory = "food";

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/users/" +
				templateUsers[0].username +
				"transactions/category/" +
				requestedCategory,
			params: { username: defaults.user.username, type: requestedCategory },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await getTransactionsByUserByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
	test("it should return an empty array", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = [];
		const requestedCategory = "food";
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/users/" +
				defaults.user.username +
				"/transactions/category/" +
				requestedCategory,
			params: { username: defaults.user.username, category: requestedCategory },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.spyOn(User, "count").mockResolvedValue(1);
		jest.spyOn(categories, "count").mockResolvedValue(1);
		const aggregate = jest
			.spyOn(transactions, "aggregate")
			.mockResolvedValue(expectedRes);
		await getTransactionsByUserByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(aggregate).toHaveBeenCalledWith([
			{
				$match: {
					username: defaults.user.username,
					type: requestedCategory,
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
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes,
				refreshedTokenMessage: mockReq?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it should return the transactions", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedRes = [
			{
				username: defaults.user.username,
				amount: 213,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				type: templateCategories[0].type,
				date: "2023-05-05",
			},
			{
				username: defaults.user.username,
				amount: 21.27,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				type: templateCategories[0].type,
				date: "2023-05-05",
			},
		];
		const requestedCategory = templateCategories[0].type;

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/users/" +
				defaults.user.username +
				"/transactions/category/" +
				requestedCategory,
			params: { username: defaults.user.username, category: requestedCategory },
		};

		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		jest.spyOn(categories, "count").mockResolvedValue(1);

		const aggregate = jest
			.spyOn(transactions, "aggregate")
			.mockResolvedValue(expectedRes);
		await getTransactionsByUserByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(aggregate).toHaveBeenCalledWith([
			{
				$match: {
					username: defaults.user.username,
					type: requestedCategory,
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
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockReq?.locals?.refreshedTokenMessage,
			}),
		);
	});
	//common
	test("it should fail for not existing user", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = { error: "User not found" };
		const requestedCategory = "food";

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/users/" +
				defaults.user.username +
				"/transactions/category/" +
				requestedCategory,
			params: { username: defaults.user.username, category: requestedCategory },
		};

		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(0);

		await getTransactionsByUserByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
	test("it should fail for not existing category", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = { error: "Category not found" };
		const requestedCategory = "food";

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/users/" +
				defaults.user.username +
				"/transactions/category/" +
				requestedCategory,
			params: { username: defaults.user.username, category: requestedCategory },
		};

		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		jest.spyOn(categories, "count").mockResolvedValue(0);

		await getTransactionsByUserByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
	//admin only route
	test("it should return unauthorized if the authenticated user is not an admin", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });

		const expectedRes = { flag: false, cause: "Unauthorized" };
		const requestedCategory = "food";

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/transactions/users/" +
				templateUsers[0].username +
				"/category/" +
				requestedCategory,
			params: { username: defaults.user.username, type: requestedCategory },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await getTransactionsByUserByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
	test("it should return the transactions", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedRes = [
			{
				username: defaults.user.username,
				amount: 213,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				type: templateCategories[0].type,
				date: "2023-05-05",
			},
			{
				username: defaults.user.username,
				amount: 21.27,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				type: templateCategories[0].type,
				date: "2023-05-05",
			},
		];
		const requestedCategory = templateCategories[0].type;

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/transactions/users/" +
				defaults.user.username +
				"/category/" +
				requestedCategory,
			params: { username: defaults.user.username, category: requestedCategory },
		};

		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		jest.spyOn(categories, "count").mockResolvedValue(1);

		const aggregate = jest
			.spyOn(transactions, "aggregate")
			.mockResolvedValue(expectedRes);
		await getTransactionsByUserByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(aggregate).toHaveBeenCalledWith([
			{
				$match: {
					username: defaults.user.username,
					type: requestedCategory,
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
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockReq?.locals?.refreshedTokenMessage,
			}),
		);
	});
});

describe("getTransactionsByGroup", () => {
	// user only route
	test("it should return the transactions", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = [
			{
				username: defaults.user.username,
				amount: 213,
				categories_info: {
					type: templateCategories[1].type,
					color: templateCategories[1].color,
				},
				type: templateCategories[1].type,
				date: dayjs(),
			},
			{
				username: templateUsers[0].username,
				amount: 21.27,
				type: templateCategories[0].type,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				date: dayjs(),
			},
		];
		const expectedEmails = {
			members: [
				{ email: templateUsers[0].email },
				{ email: defaults.user.email },
			],
		};
		const expectedUsernames = [
			{ username: templateUsers[0].username },
			{ username: defaults.user.username },
		];
		const groupName = "group";
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url: "http://localhost:3000/api/groups/" + groupName + "/transactions",
			params: { name: groupName },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValue(expectedEmails);
		jest.spyOn(User, "find").mockResolvedValue(expectedUsernames);
		const aggregate = jest
			.spyOn(transactions, "aggregate")
			.mockResolvedValue(expectedRes);
		await getTransactionsByGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(aggregate).toHaveBeenCalledWith([
			{
				$match: {
					username: {
						$in: expectedUsernames.map(u => u.username.toString()) ?? [],
					},
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
			{
				$unwind: "$categories_info",
			},
		]);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it should fail if the user is not part of that group", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });
		const expectedAuthRes = { cause: "Unauthorized" };

		const expectedEmails = {
			members: [
				{ email: templateUsers[0].email },
				{ email: templateUsers[1].email },
			],
		};

		const groupName = "group";
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url: "http://localhost:3000/api/groups/" + groupName + "/transactions",
			params: { name: groupName },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValue(expectedEmails);

		await getTransactionsByGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedAuthRes.cause,
			}),
		);
	});
	test("it should fail if the group does not exist", async () => {
		const groupName = "group";
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url: "http://localhost:3000/api/groups/" + groupName + "/transactions",
			params: { name: groupName },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValue(null);

		await getTransactionsByGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Group does not exist",
			}),
		);
	});
	test("it should fail if the group name parameter is missing or empty", async () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url: "http://localhost:3000/api/groups//transactions",
			params: { name: "" },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		await getTransactionsByGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Group name not provided",
			}),
		);
	});
	test("it should return an empty list if there are no transactions in the group", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = [];
		const expectedEmails = {
			members: [
				{ email: templateUsers[0].email },
				{ email: defaults.user.email },
			],
		};
		const expectedUsernames = [
			{ username: templateUsers[0].username },
			{ username: defaults.user.username },
		];
		const groupName = "group";
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url: "http://localhost:3000/api/groups/" + groupName + "/transactions",
			params: { name: groupName },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValue(expectedEmails);
		jest.spyOn(User, "find").mockResolvedValue(expectedUsernames);
		const aggregate = jest
			.spyOn(transactions, "aggregate")
			.mockResolvedValue(expectedRes);
		await getTransactionsByGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(aggregate).toHaveBeenCalledWith([
			{
				$match: {
					username: {
						$in: expectedUsernames.map(u => u.username.toString()) ?? [],
					},
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
			{
				$unwind: "$categories_info",
			},
		]);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	// admin only route
	test("it should fail if not admin", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: false, cause: "Unauthorized" });
		const expectedAuthRes = { cause: "Unauthorized" };

		const expectedEmails = {
			members: [
				{ email: templateUsers[0].email },
				{ email: templateUsers[1].email },
			],
		};

		const groupName = "group";
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url: "http://localhost:3000/api/transactions/groups/" + groupName,
			params: { name: groupName },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValue(expectedEmails);

		await getTransactionsByGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedAuthRes.cause,
			}),
		);
	});
	test("it should return the transactions(admin)", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });
		const expectedRes = [
			{
				username: defaults.user.username,
				amount: 213,
				categories_info: {
					type: templateCategories[1].type,
					color: templateCategories[1].color,
				},
				type: templateCategories[1].type,
				date: dayjs(),
			},
			{
				username: templateUsers[0].username,
				amount: 21.27,
				type: templateCategories[0].type,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				date: dayjs(),
			},
		];
		const expectedEmails = {
			members: [
				{ email: templateUsers[0].email },
				{ email: defaults.user.email },
			],
		};
		const expectedUsernames = [
			{ username: templateUsers[0].username },
			{ username: defaults.user.username },
		];
		const groupName = "group";
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			url: "http://localhost:3000/api/transactions/groups/" + groupName,
			params: { name: groupName },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValue(expectedEmails);
		jest.spyOn(User, "find").mockResolvedValue(expectedUsernames);
		const aggregate = jest
			.spyOn(transactions, "aggregate")
			.mockResolvedValue(expectedRes);
		await getTransactionsByGroup(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(aggregate).toHaveBeenCalledWith([
			{
				$match: {
					username: {
						$in: expectedUsernames.map(u => u.username.toString()) ?? [],
					},
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
			{
				$unwind: "$categories_info",
			},
		]);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
});

describe("getTransactionsByGroupByCategory", () => {
	//user
	test("it should fail if user is not part of the group", async () => {
		const expectedRes = { flag: false, cause: "Unauthorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		const expectedEmails = {
			members: [
				{ email: templateUsers[0].email },
				{ email: templateUsers[1].email },
			],
		};

		const groupName = "group";
		const categoryReq = templateCategories[0].type;
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/groups/" +
				groupName +
				"/transactions/category/" +
				categoryReq,
			params: { name: groupName, category: categoryReq },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValue(expectedEmails);

		await getTransactionsByGroupByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);

		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
	//common
	test("it should fail if the group does not exist", async () => {
		const expectedRes = { error: "Group doesn't exist" };

		const groupName = "group";
		const categoryReq = templateCategories[0].type;
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/groups/" +
				groupName +
				"/transactions/category/" +
				categoryReq,
			params: { name: groupName, category: categoryReq },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValue(null);

		await getTransactionsByGroupByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
	test("it should fail if the category does not exist", async () => {
		const expectedRes = { error: "Category not found" };
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedEmails = {
			members: [
				{ email: templateUsers[0].email },
				{ email: defaults.user.email },
			],
		};

		const groupName = "group";
		const categoryReq = templateCategories[0].type;
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/groups/" +
				groupName +
				"/transactions/category/" +
				categoryReq,
			params: { name: groupName, category: categoryReq },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValue(expectedEmails);
		jest.spyOn(categories, "count").mockResolvedValue(0);

		await getTransactionsByGroupByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);

		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
	test("it should fail if some parameter is missing or empty", async () => {
		const categoryReq = templateCategories[0].type;
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/groups//transactions/category/" +
				categoryReq,
			params: { category: categoryReq },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await getTransactionsByGroupByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "Group name not provided",
			}),
		);
	});
	test("it should return all the transactions", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const expectedRes = [
			{
				username: defaults.user.username,
				amount: 213,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				type: templateCategories[0].type,
				date: new Date().toISOString(),
			},
			{
				username: templateUsers[0].username,
				amount: 21.27,
				type: templateCategories[0].type,
				categories_info: {
					type: templateCategories[0].type,
					color: templateCategories[0].color,
				},
				date: new Date().toISOString(),
			},
		];
		const expectedEmails = {
			members: [
				{ email: templateUsers[0].email },
				{ email: defaults.user.email },
			],
		};
		const expectedUsernames = [
			{ username: templateUsers[0].username },
			{ username: defaults.user.username },
		];

		const groupName = "group";
		const categoryReq = templateCategories[0].type;
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/groups/" +
				groupName +
				"/transactions/category/" +
				categoryReq,
			params: { name: groupName, category: categoryReq },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValue(expectedEmails);
		jest.spyOn(categories, "count").mockResolvedValue(1);
		jest.spyOn(User, "find").mockResolvedValue(expectedUsernames);
		const aggregate = jest
			.spyOn(transactions, "aggregate")
			.mockResolvedValue(expectedRes);
		await getTransactionsByGroupByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(aggregate).toHaveBeenCalledWith([
			{
				$match: {
					username: {
						$in: expectedUsernames.map(user => user.username.toString()) ?? [],
					},
					type: categoryReq,
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
			{
				$unwind: "$categories_info",
			},
		]);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes.map(v => {
					return {
						username: v.username,
						type: v.type,
						amount: v.amount,
						date: v.date,
						color: v.categories_info.color,
					};
				}),
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	//admin
	test("it should fail if not admin", async () => {
		const expectedRes = { flag: false, cause: "Unauthorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		const expectedEmails = {
			members: [
				{ email: templateUsers[0].email },
				{ email: templateUsers[1].email },
			],
		};

		const groupName = "group";
		const categoryReq = templateCategories[0].type;
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			url:
				"http://localhost:3000/api/transactions/groups/" +
				groupName +
				"/category/" +
				categoryReq,
			params: { name: groupName, category: categoryReq },
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(Group, "findOne").mockResolvedValue(expectedEmails);

		await getTransactionsByGroupByCategory(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
});

describe("deleteTransaction", () => {
	test("it should fail if the user is not the same as the one on the route", async () => {
		const expectedRes = { flag: false, cause: "Unauthorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: templateUsers[0].username },
			body: {
				_id: "594ced02ed345b2b049222c5",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
	test("it should fail if the transaction doesn't belong to the requesting user", async () => {
		const expectedRes = {
			error:
				"Cannot delete the transaction corresponding to _id: 594ced02ed345b2b049222c5",
		};
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
			body: {
				_id: "594ced02ed345b2b049222c5",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		jest
			.spyOn(transactions, "findOne")
			.mockResolvedValue(templateUsers[0].username);

		await deleteTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
	test("it should fail if the user does not exist", async () => {
		const expectedRes = { error: "User not found" };
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
			body: {
				_id: "594ced02ed345b2b049222c5",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(0);
		await deleteTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
	test("it should fail if _id is missing", async () => {
		const expectedRes = { error: "The _id is required" };
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
			body: {},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
	test("it should fail if _id is an empty string", async () => {
		const expectedRes = { error: "The _id is required" };
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
			body: {
				_id: "",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
	test("it should fail if the transaction does not exist", async () => {
		const expectedRes = {
			error: "Transaction does not exist",
		};
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
			body: {
				_id: "594ced02ed345b2b049222c5",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		jest.spyOn(transactions, "findOne").mockResolvedValue(null);

		await deleteTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
	test("it should return a success message", async () => {
		const expectedRes = {
			message: "Transaction deleted",
		};
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
			body: {
				_id: "594ced02ed345b2b049222c5",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(User, "count").mockResolvedValue(1);
		jest.spyOn(transactions, "findOne").mockResolvedValue(defaults.user);
		jest
			.spyOn(transactions, "deleteOne")
			.mockResolvedValue(templateTransactions[0]);

		await deleteTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes,
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it should fail for invalid _id", async () => {
		const expectedRes = {
			error: "_id is not valid",
		};
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
			body: {
				_id: "timtamtomted",
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteTransaction(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
});

describe("deleteTransactions", () => {
	test("it should return a success message", async () => {
		const expectedRes = {
			message: "Transactions deleted",
		};
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				_ids: ["594ced02ed345b2b049222c5", "594ced02ed345b2b049222c6"],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest
			.spyOn(transactions, "findOne")
			.mockResolvedValueOnce(mockReq.body._ids[0])
			.mockResolvedValueOnce(mockReq.body._ids[1]);
		jest
			.spyOn(transactions, "deleteOne")
			.mockResolvedValueOnce(templateTransactions[0])
			.mockResolvedValueOnce(templateTransactions[1]);

		await deleteTransactions(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expectedRes,
				refreshedTokenMessage: mockRes?.locals?.refreshedTokenMessage,
			}),
		);
	});
	test("it should fail if not admin", async () => {
		const expectedRes = { flag: false, cause: "Unauthorized" };
		jest.spyOn(utils, "verifyAuth").mockReturnValue(expectedRes);

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			body: {
				_ids: ["594ced02ed345b2b049222c5", "594ced02ed345b2b049222c6"],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteTransactions(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.cause,
			}),
		);
	});
	test("it should fail if array of _id is missing", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {},
		};

		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteTransactions(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No body provided",
			}),
		);
	});
	test("it should fail if array of _id is empty", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: { _ids: [] },
		};

		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteTransactions(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "No _ids provided",
			}),
		);
	});
	test("it should fail if at least one _id is an empty string", async () => {
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				_ids: ["594ced02ed345b2b049222c5", ""],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteTransactions(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: "_ids cannot be empty strings",
			}),
		);
	});
	test("it should fail if at least one _id is not on the db", async () => {
		const expectedRes = {
			message: "Transaction not found",
		};
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
			body: {
				_ids: ["594ced02ed345b2b049222c5"],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		jest.spyOn(transactions, "findOne").mockResolvedValue(null);

		await deleteTransactions(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.message,
			}),
		);
	});
	test("it should fail for invalid _id", async () => {
		const expectedRes = {
			error: "ObjectId is not valid",
		};
		jest
			.spyOn(utils, "verifyAuth")
			.mockReturnValue({ flag: true, cause: "Authorized" });

		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
			params: { username: defaults.user.username },
			body: {
				_ids: ["timtamtomted"],
			},
		};
		const mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await deleteTransactions(mockReq, mockRes);
		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expectedRes.error,
			}),
		);
	});
});
