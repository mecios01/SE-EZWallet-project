import jwt from "jsonwebtoken";
import * as yup from "yup";
import { authTypes, roles } from "../constants/constants.js";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";

/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 */
export const handleDateFilterParams = req => {
	dayjs.extend(utc);
	dayjs.extend(CustomParseFormat); //this enables the plugin to perform the format check of dayjs

	const baseSchema = yup
		.mixed()
		.optional()
		.transform((value, originalValue, schema) => {
			return dayjs.utc(value, "YYYY-MM-DD", true).utcOffset(0).startOf("day");
		})
		.test(function (value, context) {
			return !!value ? value?.isValid() : true; //if it is a valid date test it, otherwise just fallback true (optional fields)
		});
	// field validation transforms into dayjs date

	let validation = {};
	try {
		validation = yup
			.object({
				from: baseSchema.transform(value => value.startOf("day")),
				upTo: baseSchema.transform(value => value.endOf("day")),
				date: baseSchema.transform(value => value.startOf("day")),
			})
			.validateSync({ ...req.query });
		if (!!validation["from"] && !!validation["upTo"]) {
			const isAfter = validation.from.isAfter(validation.upTo);
			if (isAfter) throw new Error();
		}
	} catch (e) {
		throw new Error("Bad request");
	}

	// end validation

	//incompatibility check ('date' is not compatible with 'from' or 'upTo', in those cases throws an error)
	if (!!validation?.date) {
		if (!!validation?.from || !!validation?.upTo) {
			throw new Error("Bad request");
		}
		const date = dayjs.utc(validation.date);
		return {
			date: {
				$gte: date.startOf("day").toDate(),
				$lte: date.endOf("day").toDate(),
			},
		};
	}
	//if no date is present return the others if available (default to {})
	const from = validation?.from
		? { $gte: validation.from.startOf("day").toDate() }
		: {};
	const upTo = validation?.upTo
		? { $lte: validation.upTo.endOf("day").toDate() }
		: {};
	return { date: { ...upTo, ...from } };
};

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info{{authType:string,username?:string,emails?:string[]}} an object that specifies the `authType` and that contains additional information, depending on the value of `authType`
 *      Example: {authType: "Simple"}
 *      Additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => error 401
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => error 401
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => error 401
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => error 401
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => error 401
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => error 401
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @return {{flag:boolean,message:string}}
 * @returns an object containing two fields: flag(boolean) and a message(string) indicating if the authorization was successful
 * (flag:true) and a message (can be Authorized, Unauthorized,,...)
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 */
export const verifyAuth = (req, res, info) => {
	const cookie = req.cookies;
	if (!cookie.accessToken || !cookie.refreshToken) {
		return { flag: false, cause: "Unauthorized" };
	}
	try {
		const decodedAccessToken = jwt.verify(
			cookie.accessToken,
			process.env.ACCESS_KEY,
		);
		const decodedRefreshToken = jwt.verify(
			cookie.refreshToken,
			process.env.ACCESS_KEY,
		);
		if (
			!decodedAccessToken.username ||
			!decodedAccessToken.email ||
			!decodedAccessToken.role
		) {
			return { flag: false, cause: "Token is missing information" };
		}
		if (
			!decodedRefreshToken.username ||
			!decodedRefreshToken.email ||
			!decodedRefreshToken.role
		) {
			return { flag: false, cause: "Token is missing information" };
		}
		if (
			decodedAccessToken.username !== decodedRefreshToken.username ||
			decodedAccessToken.email !== decodedRefreshToken.email ||
			decodedAccessToken.role !== decodedRefreshToken.role
		) {
			return { flag: false, cause: "Mismatched users" };
		}
		if (authChecks(decodedAccessToken, info)) {
			return { flag: true, cause: "Authorized" };
		}
		return { flag: false, cause: "Unauthorized" };
	} catch (err) {
		if (err.name === "TokenExpiredError") {
			try {
				const refreshToken = jwt.verify(
					cookie.refreshToken,
					process.env.ACCESS_KEY,
				);
				const newAccessToken = jwt.sign(
					{
						username: refreshToken.username,
						email: refreshToken.email,
						id: refreshToken.id,
						role: refreshToken.role,
					},
					process.env.ACCESS_KEY,
					{ expiresIn: "1h" },
				);
				res.cookie("accessToken", newAccessToken, {
					httpOnly: true,
					path: "/api",
					maxAge: 60 * 60 * 1000,
					sameSite: "none",
					secure: true,
				});
				res.locals.refreshedTokenMessage =
					"Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls";
				if (authChecks(refreshToken, info)) {
					return { flag: true, cause: "Authorized" };
				}
				return { flag: false, cause: "Unauthorized" };
			} catch (err) {
				if (err.name === "TokenExpiredError") {
					return { flag: false, cause: "Perform login again" };
				} else {
					return { flag: false, cause: err.name };
				}
			}
		} else {
			return { flag: false, cause: err.name };
		}
	}
};

/**
 * Internal utility to perform checks of authType inside verifyAuth()
 *   @param accessToken it is the (pre-verified) decoded access token to be tested
 *   @param info the same info object passed to verifyAuth
 *   @description This utility tests if the claimant (the actor that performs the req) has the right to
 *   access the resource requested.
 *   Checks are performed using the info parameter and the (decoded) accessToken to verify if the user i one of the following:
 *      - ADMIN (authTypes.admin)
 *      - USER (authTypes.user)
 *      - GROUP (authTypes.group) : requires a "emails" array (string array) inside the info parameter
 *  @return boolean
 * */
const authChecks = (accessToken, info) => {
	if (accessToken.role === roles.admin) {
		if (info.username) {
			return info?.username === accessToken.username;
		}
		return true;
	}
	//user
	else if (accessToken.role === roles.normalUser) {
		// normal authType
		if (
			info.authType === authTypes.simple ||
			info.authType === authTypes.user
		) {
			// if username is passed check it
			if (info?.username) {
				return accessToken.username === info.username;
			}
			return true;
		}

		// group authType
		if (info.authType === authTypes.group) {
			if (info?.emails?.includes(accessToken.email)) {
				return true;
			}
		}
		return false;
	}
};
/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 */
export const handleAmountFilterParams = req => {
	const amount_schema = yup.object({
		min: yup.number().optional(),
		max: yup.number().optional(),
	});

	let value = {};

	try {
		value = amount_schema.validateSync(req.query);
	} catch (error) {
		throw new Error("Bad request");
	}

	if (!value) return { amount: {} };

	const min = value.hasOwnProperty("min") ? { $gte: value.min } : {};
	const max = value.hasOwnProperty("max") ? { $lte: value.max } : {};
	return { amount: { ...min, ...max } };
};

/**
 * Validate objects using a yup schema
 * --------------------------------------
 *  you can create one by using the following snippet as an example:
 *
 *  @param {string} yupSchema - the schema that will test the object.
 *  @param {string} objectToBeValidated- the object that will be tested.
 *
 *  @example
 *  import * as yup from "yup"
 *
 *  const object = {
 *      name: "stuff",
 *      pin: 1
 *  };
 *
 *  const schema = yup.object({
 *      name: yup.string().required("No string provided"),
 *      pin: yup.number().min(0).max(10).optional()
 *  });
 *
 *  const
 *      { validatedObject,
 *          isValidationOk,
 *          validationError} = validateObject(schema,object);
 *
 *   if(!isValidationOk){
 *       console.log("An error occurred:");
 *       console.log(validationError);
 *   }
 *   else{
 *       console.log(validatedObject);
 *   }
 * **/
export const validateObject = (yupSchema, objectToBeValidated) => {
	let validatedObject = {};
	let validationError = "default";
	let isValidationOk = true;

	try {
		validatedObject = yupSchema.validateSync(objectToBeValidated);
	} catch (e) {
		validationError = e.errors[0];
		isValidationOk = false;
	}

	return {
		validatedObject,
		isValidationOk,
		validationError,
	};
};
/**
 * Validate a req using yup schemas
 * -----
 * @param req the request object
 * @param paramsSchema the yup schema targeting the req.params
 * @param bodySchema the yup schema targeting the req.body
 * @param querySchema the yup schema targeting the req.query
 *
 * Make use of this utility to validate a request.
 * You can optionally choose to validate only the payload (req.body) and/or the parameters (req.params)
 * If the schema is not suited the validation will be skipped so it is your responsibility to provide a not-empty schema
 * @see validateObject
 */

export const validateRequest = (req, paramsSchema, bodySchema, querySchema) => {
	let isValidationOk = true;
	let params = {};
	let body = {};
	let query = {};
	let errorMessages = [];

	if (yup.isSchema(paramsSchema)) {
		const params_res = validateObject(paramsSchema, req.params);
		if (params_res.isValidationOk) {
			params = { ...params_res.validatedObject };
		} else {
			errorMessages.push(params_res.validationError);
			isValidationOk = false;
		}
	}

	if (yup.isSchema(bodySchema)) {
		const body_res = validateObject(bodySchema, req.body);
		if (body_res.isValidationOk) {
			body = { ...body_res.validatedObject };
		} else {
			errorMessages.push(body_res.validationError);
			isValidationOk = false;
		}
	}

	if (yup.isSchema(querySchema)) {
		const query_res = validateObject(querySchema, req.query);
		if (query_res.isValidationOk) {
			query = { ...query_res.validatedObject };
		} else {
			errorMessages.push(query_res.validationError);
			isValidationOk = false;
		}
	}

	const errorMessage = errorMessages[0] ?? undefined; //returns the first error or undefined

	return {
		params,
		body,
		query,
		isValidationOk,
		errorMessage,
	};
};
