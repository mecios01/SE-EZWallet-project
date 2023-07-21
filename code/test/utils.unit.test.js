import {
	handleDateFilterParams,
	verifyAuth,
	handleAmountFilterParams,
} from "../controllers/utils";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";
import { defaults } from "../controllers/test-utils.js";
import { authTypes } from "../constants/constants.js";
dayjs.extend(utc);
dayjs.extend(CustomParseFormat); //this enables the plugin to perform the format check of dayjs

process.env.ACCESS_KEY = "EZWALLET"; //this should be the same as .env
describe("handleDateFilterParams", () => {
	test("it should return a filter with only gte (from)", () => {
		const date = "2022-12-12";
		const mockReq = {
			query: { from: date },
		};
		const expectedDate = dayjs
			.utc(date, "YYYY-MM-DD", true)
			.startOf("day")
			.toDate();
		const dateFilter = handleDateFilterParams(mockReq);
		expect(dateFilter).toEqual(
			expect.objectContaining({ date: { $gte: expectedDate } }),
		);
	});
	test("it should return a filter with only lte (upTo)", () => {
		const date = "2022-12-12";
		const mockReq = {
			query: { upTo: date },
		};
		const expectedDate = dayjs
			.utc(date, "YYYY-MM-DD", true)
			.endOf("day")
			.toDate();
		const dateFilter = handleDateFilterParams(mockReq);
		expect(dateFilter).toEqual(
			expect.objectContaining({ date: { $lte: expectedDate } }),
		);
	});
	test("it should return a filter with both gte and lte (from+upTo)", () => {
		const startDate = "2022-12-12";
		const endDate = "2023-01-02";
		const mockReq = {
			query: { upTo: endDate, from: startDate },
		};
		const start = dayjs
			.utc(startDate, "YYYY-MM-DD", true)
			.startOf("day")
			.toDate();
		const end = dayjs.utc(endDate, "YYYY-MM-DD", true).endOf("day").toDate();
		const dateFilter = handleDateFilterParams(mockReq);
		expect(dateFilter).toEqual(
			expect.objectContaining({ date: { $gte: start, $lte: end } }),
		);
	});
	test("it should return a filter with both gte and lte (date)", () => {
		const date = "2022-12-12";
		const mockReq = {
			query: { date },
		};
		const start = dayjs.utc(date, "YYYY-MM-DD", true).startOf("day").toDate();
		const end = dayjs.utc(date, "YYYY-MM-DD", true).endOf("day").toDate();
		const dateFilter = handleDateFilterParams(mockReq);
		expect(dateFilter).toEqual(
			expect.objectContaining({ date: { $gte: start, $lte: end } }),
		);
	});
	test("it should THROW and error because of invalid date (whatsoever)", () => {
		const date = "wtfDate-12";
		const mockReq = {
			query: { date },
		};
		expect(() => handleDateFilterParams(mockReq)).toThrow("Bad request");
	});
	test("it should THROW and error because of invalid date (2021-02-31)", () => {
		const date = "2021-02-31";
		const mockReq = {
			query: { date },
		};
		expect(() => handleDateFilterParams(mockReq)).toThrow("Bad request");
	});
	test("it should THROW and error because from is after upTo", () => {
		const date1 = "2011-11-20";
		const date2 = "2023-02-20";
		const mockReq = {
			query: { from: date2, upTo: date1 },
		};
		expect(() => handleDateFilterParams(mockReq)).toThrow("Bad request");
	});
	test("it should THROW and error because of presence of from and date", () => {
		const date = "2023-12-12";
		const mockReq = {
			query: { from: date, date },
		};
		expect(() => handleDateFilterParams(mockReq)).toThrow("Bad request");
	});
	test("it should THROW and error because of presence of upTo and date", () => {
		const date = "2023-12-12";
		const mockReq = {
			query: { upTo: date, date },
		};
		expect(() => handleDateFilterParams(mockReq)).toThrow("Bad request");
	});
	test("it should THROW and error because of presence of upTo, from and date", () => {
		const date = "2023-12-12";
		const mockReq = {
			query: { from: date, upTo: date, date },
		};
		expect(() => handleDateFilterParams(mockReq)).toThrow("Bad request");
	});
});

describe("verifyAuth", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});
	test("it should authorize a user given the correct cookie", () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
		};
		const info = {
			authType: authTypes.user,
		};
		const expectedReturn = {
			flag: true,
			cause: "Authorized",
		};

		const response = verifyAuth(mockReq, mockRes, info);

		expect(response).toEqual(expectedReturn);
		expect(mockRes.locals).not.toHaveBeenCalled();
		expect(mockRes.refreshedTokenMessage).not.toHaveBeenCalled();
	});
	test("it should authorize a user given the correct cookie and username ", () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
		};
		const info = {
			authType: authTypes.user,
			username: defaults.user.username,
		};
		const expectedReturn = {
			flag: true,
			cause: "Authorized",
		};

		const response = verifyAuth(mockReq, mockRes, info);

		expect(response).toEqual(expectedReturn);
		expect(mockRes.locals).not.toHaveBeenCalled();
		expect(mockRes.refreshedTokenMessage).not.toHaveBeenCalled();
	});
	test("it should authorize an admin given the correct cookie", () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.admin.tokens.refreshToken,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
		};
		const info = {
			authType: authTypes.admin,
			username: defaults.admin.username,
		};
		const expectedReturn = {
			flag: true,
			cause: "Authorized",
		};

		const response = verifyAuth(mockReq, mockRes, info);

		expect(response).toEqual(expectedReturn);
		expect(mockRes.locals).not.toHaveBeenCalled();
		expect(mockRes.refreshedTokenMessage).not.toHaveBeenCalled();
	});
	test("it should authorize an user given the correct cookie and group emails", () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
		};
		const info = {
			authType: authTypes.group,
			emails: [
				"email1@nothis.com",
				"email2@nothis.com",
				"email3@nothis.com",
				defaults.user.email,
			],
		};
		const expectedReturn = {
			flag: true,
			cause: "Authorized",
		};

		const response = verifyAuth(mockReq, mockRes, info);

		expect(response).toEqual(expectedReturn);
		expect(mockRes.locals).not.toHaveBeenCalled();
		expect(mockRes.refreshedTokenMessage).not.toHaveBeenCalled();
	});
	test("it should not authorize an user given the correct cookie and group emails ", () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
		};
		const info = {
			authType: authTypes.group,
			emails: ["email1@nothis.com", "email2@nothis.com", "email3@nothis.com"],
		};
		const expectedReturn = {
			flag: false,
			cause: "Unauthorized",
		};

		const response = verifyAuth(mockReq, mockRes, info);

		expect(response).toEqual(expectedReturn);
		expect(mockRes.locals).not.toHaveBeenCalled();
		expect(mockRes.refreshedTokenMessage).not.toHaveBeenCalled();
	});
	test("it should not authorize and ask to perform login again through the refreshedTokenMessage", () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.expiredToken,
				refreshToken: defaults.user.tokens.expiredToken,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
		};
		const info = {
			authType: authTypes.simple,
		};
		const expectedReturn = {
			flag: false,
			cause: "Perform login again",
		};

		const response = verifyAuth(mockReq, mockRes, info);

		expect(response).toEqual(expectedReturn);
		expect(mockRes.locals).not.toHaveBeenCalled();
		expect(mockRes.refreshedTokenMessage).not.toHaveBeenCalled();
	});
	test("it should not authorize an if at least one of refresh token or access token is missing ", () => {
		const mockReq = {
			cookies: {
				refreshToken: defaults.user.tokens.expiredToken,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
		};
		const info = {
			authType: authTypes.simple,
		};
		const expectedReturn = {
			flag: false,
			cause: "Unauthorized",
		};

		const response = verifyAuth(mockReq, mockRes, info);

		expect(response).toEqual(expectedReturn);
		expect(mockRes.locals).not.toHaveBeenCalled();
		expect(mockRes.refreshedTokenMessage).not.toHaveBeenCalled();
	});
	test("it should not authorize an if accessToken is missing information (access missing info)", () => {
		const mockReq = {
			cookies: {
				accessToken:
					"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJpZCI6IjY0NjRkYjE2MjA5OGQzNmY1MDk3YjczZCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NzIxOTgwLCJleHAiOjE4NTg1MjE5ODB9.2dcKMPP-O5uAG2piYrHECIhqHTW2T7HYGud5ryu1xHY",
				refreshToken: defaults.user.tokens.refreshToken,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
		};
		const info = {
			authType: authTypes.simple,
		};
		const expectedReturn = {
			flag: false,
			cause: "Token is missing information",
		};

		const response = verifyAuth(mockReq, mockRes, info);

		expect(response).toEqual(expectedReturn);
		expect(mockRes.locals).not.toHaveBeenCalled();
		expect(mockRes.refreshedTokenMessage).not.toHaveBeenCalled();
	});
	test("it should not authorize an if accessToken is missing information (refresh missing info)", () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.accessToken,
				refreshToken:
					"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJpZCI6IjY0NjRkYjE2MjA5OGQzNmY1MDk3YjczZCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NzIxOTgwLCJleHAiOjE4NTg1MjE5ODB9.2dcKMPP-O5uAG2piYrHECIhqHTW2T7HYGud5ryu1xHY",
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
		};
		const info = {
			authType: authTypes.simple,
		};
		const expectedReturn = {
			flag: false,
			cause: "Token is missing information",
		};

		const response = verifyAuth(mockReq, mockRes, info);

		expect(response).toEqual(expectedReturn);
		expect(mockRes.locals).not.toHaveBeenCalled();
		expect(mockRes.refreshedTokenMessage).not.toHaveBeenCalled();
	});
	test("it should not authorize an the tokens are mismatched (different user/email/id)", () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.admin.tokens.accessToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
		};
		const mockRes = {
			locals: jest.fn().mockReturnThis(),
			refreshedTokenMessage: jest.fn(),
		};
		const info = {
			authType: authTypes.simple,
		};
		const expectedReturn = {
			flag: false,
			cause: "Mismatched users",
		};

		const response = verifyAuth(mockReq, mockRes, info);

		expect(response).toEqual(expectedReturn);
		expect(mockRes.locals).not.toHaveBeenCalled();
		expect(mockRes.refreshedTokenMessage).not.toHaveBeenCalled();
	});
	test("it should authorize and refresh the expired accessToken", () => {
		const mockReq = {
			cookies: {
				accessToken: defaults.user.tokens.expiredToken,
				refreshToken: defaults.user.tokens.refreshToken,
			},
		};
		const mockRes = {
			cookie: jest.fn().mockReturnThis(),
			locals: {
				refreshedTokenMessage: "",
			},
		};
		const info = {
			authType: authTypes.simple,
		};
		const expectedReturn = {
			flag: true,
			cause: "Authorized",
		};

		const response = verifyAuth(mockReq, mockRes, info);

		expect(response).toEqual(expectedReturn);
		expect(mockRes.cookie).toHaveBeenCalled();
		expect(mockRes.locals.refreshedTokenMessage).toEqual(
			"Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls",
		);
	});
});

describe("handleAmountFilterParams", () => {
	test("it should return a filter with min", () => {
		const min = "2e-2";
		const mockReq = {
			query: { min },
		};
		const amountFilter = handleAmountFilterParams(mockReq);
		expect(amountFilter).toEqual({ amount: { $gte: Number.parseFloat(min) } });
	});
	test("it should return a filter with max", () => {
		const max = "2e-2";
		const mockReq = {
			query: { max },
		};
		const amountFilter = handleAmountFilterParams(mockReq);
		expect(amountFilter).toEqual({ amount: { $lte: Number.parseFloat(max) } });
	});
	test("it should return a filter with min and max", () => {
		const min = "0.11123";
		const max = "23e3";
		const mockReq = {
			query: { min, max },
		};
		const amountFilter = handleAmountFilterParams(mockReq);
		expect(amountFilter).toEqual({
			amount: { $gte: Number.parseFloat(min), $lte: Number.parseFloat(max) },
		});
	});
	test("it should return a filter with min and max using negative numbers", () => {
		const min = "-13e3";
		const max = "-2";
		const mockReq = {
			query: { min, max },
		};
		const amountFilter = handleAmountFilterParams(mockReq);
		expect(amountFilter).toEqual({
			amount: { $gte: Number.parseFloat(min), $lte: Number.parseFloat(max) },
		});
	});
	test("it should THROW an error if one of min/max is not a floating point", () => {
		const min = "notANumber";
		const max = "-2";
		const mockReq = {
			query: { min, max },
		};
		expect(() => handleAmountFilterParams(mockReq)).toThrow("Bad request");
	});
});
