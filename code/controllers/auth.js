import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { validateRequest, verifyAuth } from "./utils.js";
import * as yup from "yup";
import { authTypes } from "../constants/constants.js";
/**
 * Register a new user in the system
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */
export const register = async (req, res) => {
	try {
		const body_schema = yup.object({
			username: yup
				.string()
				.typeError("No username provided")
				.required("No username provided"),
			email: yup
				.string()
				.typeError("No valid email provided")
				.email("No valid email provided")
				.required("No valid email provided"),
			password: yup
				.string()
				.typeError("No password provided")
				.required("No password provided"),
		});

		const { body, errorMessage, params, isValidationOk } = validateRequest(
			req,
			undefined,
			body_schema,
		);

		if (!isValidationOk) {
			return res.status(400).json({ error: errorMessage });
		}
		const existingUser = await User.count({
			$or: [{ email: body.email }, { username: body.username }],
		});
		if (existingUser !== 0)
			return res.status(400).json({
				error: "there is already a user with that username or email",
			});
		const hashedPassword = await bcrypt.hash(body.password, 12);
		const newUser = await User.create({
			username: body.username,
			email: body.email,
			password: hashedPassword,
		});
		res.status(200).json({ data: { message: "User added successfully" } });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Register a new user in the system with an Admin role
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */
export const registerAdmin = async (req, res) => {
	try {
		//
		// const adminAuth = verifyAuth(req, res, { authType: authTypes.admin });
		// if (!adminAuth.flag) {
		// 	return res.status(401).json({ error: adminAuth.cause });
		// }
		const body_schema = yup.object({
			username: yup
				.string()
				.typeError("No username provided")
				.required("No username provided"),
			email: yup
				.string()
				.typeError("No valid email provided")
				.email("No valid email provided")
				.required("No valid email provided"),
			password: yup
				.string()
				.typeError("No password provided")
				.required("No password provided"),
		});

		const { body, errorMessage, isValidationOk } = validateRequest(
			req,
			undefined,
			body_schema,
		);
		if (!isValidationOk) {
			return res.status(400).json({ error: errorMessage });
		}
		const existingUser = await User.findOne({
			$or: [{ email: body.email }, { username: body.username }],
		});
		if (existingUser)
			return res.status(400).json({ error: "email or username already exist" });
		const hashedPassword = await bcrypt.hash(body.password, 12);
		const newUser = await User.create({
			username: body.username,
			email: body.email,
			password: hashedPassword,
			role: "Admin",
		});
		res.status(200).json({ data: { message: "Admin added successfully" } });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Perform login 
  - Request Body Content: An object having attributes `email` and `password`
  - Response `data` Content: An object with the created accessToken and refreshToken
  - Optional behavior:
    - error 400 is returned if the user does not exist
    - error 400 is returned if the supplied password does not match with the one in the database
 */
export const login = async (req, res) => {
	try {
		const body_schema = yup.object({
			email: yup
				.string()
				.typeError("No valid email provided")
				.email("No valid email provided")
				.required("No valid email provided"),
			password: yup
				.string()
				.typeError("No password provided")
				.required("No password provided"),
		});

		const { body, errorMessage, isValidationOk } = validateRequest(
			req,
			undefined,
			body_schema,
		);
		if (!isValidationOk) {
			return res.status(400).json({ error: errorMessage });
		}

		const { email, password } = body;

		const existingUser = await User.findOne({ email: email });
		if (!existingUser)
			return res.status(400).json({ error: "please you need to register" });

		const match = await bcrypt.compare(password, existingUser.password);
		if (!match) return res.status(400).json({ error: "wrong credentials" });
		//CREATE ACCESS_TOKEN
		const accessToken = jwt.sign(
			{
				email: existingUser.email,
				id: existingUser.id,
				username: existingUser.username,
				role: existingUser.role,
			},
			process.env.ACCESS_KEY,
			{ expiresIn: "1h" },
		);
		//CREATE REFRESH TOKEN
		const refreshToken = jwt.sign(
			{
				email: existingUser.email,
				id: existingUser.id,
				username: existingUser.username,
				role: existingUser.role,
			},
			process.env.ACCESS_KEY,
			{ expiresIn: "7d" },
		);
		//SAVE REFRESH TOKEN TO DB
		await User.findOneAndUpdate({ _id: existingUser._id }, { refreshToken });
		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			domain: "localhost",
			path: "/api",
			maxAge: 60 * 60 * 1000,
			sameSite: "none",
			secure: true,
		});
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			domain: "localhost",
			path: "/api",
			maxAge: 7 * 24 * 60 * 60 * 1000,
			sameSite: "none",
			secure: true,
		});
		res
			.status(200)
			.json({ data: { accessToken: accessToken, refreshToken: refreshToken } });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Perform logout
  - Auth type: Simple
  - Request Body Content: None
  - Response `data` Content: A message confirming successful logout
  - Optional behavior:
    - error 400 is returned if the user does not exist
 */
export const logout = async (req, res) => {
	try {
		const refreshToken = req?.cookies?.refreshToken;
		if (!refreshToken)
			return res.status(400).json({ error: "No refresh token provided" });
		const user = await User.findOne({ refreshToken: refreshToken });
		if (!user) return res.status(400).json({ error: "User not found" });
		res.cookie("accessToken", "", {
			httpOnly: true,
			path: "/api",
			maxAge: 0,
			sameSite: "none",
			secure: true,
		});
		res.cookie("refreshToken", "", {
			httpOnly: true,
			path: "/api",
			maxAge: 0,
			sameSite: "none",
			secure: true,
		});
		const savedUser = await User.findOneAndUpdate(
			{ _id: user._id },
			{ $set: { refreshToken: null } },
		);
		res.status(200).json({ data: { message: "User logged out" } });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
