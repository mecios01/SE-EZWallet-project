import { roles } from "../constants/constants.js";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const defaults = {
	admin: {
		username: "admin",
		email: "ezadmin@admin.com",
		id: "6464db162098d36f5097b73d",
		role: roles.admin,
		tokens: {
			accessToken:
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJlemFkbWluQGFkbWluLmNvbSIsImlkIjoiNjQ2NGRiMTYyMDk4ZDM2ZjUwOTdiNzNkIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1MDk1ODY3LCJleHAiOjE4NTc4OTU4Njd9.2jksfOjtRS0J1lDqH2Z5WyH1yygihl2g9yJLMKaa52c",
			refreshToken:
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJlemFkbWluQGFkbWluLmNvbSIsImlkIjoiNjQ2NGRiMTYyMDk4ZDM2ZjUwOTdiNzNkIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1MDk1ODY3LCJleHAiOjE4NTc4OTU4Njd9.2jksfOjtRS0J1lDqH2Z5WyH1yygihl2g9yJLMKaa52c",
			expiredToken:
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJlemFkbWluQGFkbWluLmNvbSIsImlkIjoiNjQ2NGRiMTYyMDk4ZDM2ZjUwOTdiNzNkIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1NzE4Nzk2LCJleHAiOjE2ODU3MTg3OTZ9.GlIRA82-3xEEhnuGZqdm6rF11AbF38DjVWHUR268wS4",
		},
	},
	user: {
		username: "user",
		email: "randomuser1@userdom.com",
		id: "6464db162098d36f5097b83d",
		role: roles.normalUser,
		tokens: {
			accessToken:
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJlbWFpbCI6InJhbmRvbXVzZXIxQHVzZXJkb20uY29tIiwiaWQiOiI2NDY0ZGIxNjIwOThkMzZmNTA5N2I3M2QiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTA5NTg2NywiZXhwIjoxODU3ODk1ODY3fQ.lP5OmN4K_bJKL8sJGxN2iWmAEf7qvn35x0ZuwW-XJhk",
			refreshToken:
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJlbWFpbCI6InJhbmRvbXVzZXIxQHVzZXJkb20uY29tIiwiaWQiOiI2NDY0ZGIxNjIwOThkMzZmNTA5N2I3M2QiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTA5NTg2NywiZXhwIjoxODU3ODk1ODY3fQ.lP5OmN4K_bJKL8sJGxN2iWmAEf7qvn35x0ZuwW-XJhk",
			expiredToken:
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJlbWFpbCI6InJhbmRvbXVzZXIxQHVzZXJkb20uY29tIiwiaWQiOiI2NDY0ZGIxNjIwOThkMzZmNTA5N2I3M2QiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTcxNzY4MCwiZXhwIjoxNjg1NzE3NjgwfQ.tHCJ2LEWpXOZcloPwOlSHClC5vjebo2I2B4-z7Cili0",
		},
	},
};

export const templateUsers = [
	{
		username: "user0",
		email: "user0@email0.it",
		password: "securePass",
		role: roles.normalUser,
	},
	{
		username: "user1",
		email: "user1@email1.it",
		password: "securePass",
		role: roles.normalUser,
	},
	{
		username: "user2",
		email: "user2@email2.it",
		password: "securePass",
		role: roles.normalUser,
	},
	{
		username: "user3",
		email: "user3@email3.it",
		password: "securePass",
		role: roles.normalUser,
	},
];

export const templateAdmins = [
	{
		username: "admin0",
		email: "admin0@admins0.it",
		password: "adminPass",
		role: roles.admin,
	},
	{
		username: "admin1",
		email: "admin1@admins1.it",
		password: "adminPass",
		role: roles.admin,
	},
	{
		username: "admin2",
		email: "admin2@admins2.it",
		password: "adminPass",
		role: roles.admin,
	},
	{
		username: "admin3",
		email: "admin3@admins3.it",
		password: "adminPass",
		role: roles.admin,
	},
];

export const templateCategories = [
	{
		type: "category0",
		color: "color0",
	},
	{
		type: "category1",
		color: "color1",
	},
	{
		type: "category2",
		color: "color2",
	},
	{
		type: "category3",
		color: "color3",
	},
	{
		type: "category4",
		color: "color4",
	},
];

export const templateTransactions = [
	{
		username: templateUsers[0].username,
		amount: 123.3,
		type: templateCategories[0].type,
	},
	{
		username: templateUsers[1].username,
		amount: 94.4,
		type: templateCategories[1].type,
	},
	{
		username: templateUsers[2].username,
		amount: 12.78,
		type: templateCategories[2].type,
	},
	{
		username: templateUsers[3].username,
		amount: 213,
		type: templateCategories[3].type,
	},
	{
		username: templateAdmins[0].username,
		amount: 21.27,
		type: templateCategories[0].type,
	},
];

export const templateGroups = [
	{
		name: "group0",
		members: [{ email: templateUsers[0].email, user: "idOfTheUser0" }],
	},
	{
		name: "group1",
		members: [
			{ email: templateUsers[0].email, user: "idOfTheUser0" },
			{ email: templateUsers[1].email, user: "idOfTheUser1" },
		],
	},
	{
		name: "group2",
		members: [
			{ email: templateUsers[0].email, user: "idOfTheUser0" },
			{ email: templateUsers[1].email, user: "idOfTheUser1" },
			{ email: templateUsers[2].email, user: "idOfTheUser2" },
		],
	},
	{
		name: "group3",
		members: [
			{ email: templateUsers[0].email, user: "idOfTheUser0" },
			{ email: templateUsers[1].email, user: "idOfTheUser1" },
			{ email: templateUsers[2].email, user: "idOfTheUser2" },
			{ email: templateUsers[3].email, user: "idOfTheUser3" },
		],
	},
	{
		name: "group4",
		members: [
			{ email: templateUsers[1].email, user: "idOfTheUser1" },
			{ email: templateUsers[2].email, user: "idOfTheUser2" },
		],
	},
	{
		name: "group5",
		members: [
			{ email: templateUsers[2].email, user: "idOfTheUser2" },
			{ email: templateUsers[3].email, user: "idOfTheUser3" },
		],
	},
	{
		name: "group6",
		members: [
			{ email: templateAdmins[0].email, user: "idOfTheAdmin0" },
			{ email: templateUsers[3].email, user: "idOfTheUser3" },
		],
	},
];

/***
 * This utility helps you to create quickly a new user (this assumes requires mongoose to be setup)
 * @param data {{email:string;password:string,username:string}} an object containing email, password, email
 * @param isAdmin {boolean} a boolean that will allow you to create a user (false) or admin (true)
 * @returns {Promise<{_id:string;username:string;password:string;email:string;refreshToken:string;accessToken:string;}>}
 */
export const createUser = async (data, isAdmin) => {
	const user = await User.create({
		username: data.username,
		email: data.email,
		password: await bcrypt.hash(data.password, 12),
		role: isAdmin ? roles.admin : roles.normalUser,
	});
	const refreshToken = jwt.sign(
		{
			username: data.username,
			email: data.email,
			id: user.id,
			role: user.role,
		},
		process.env.ACCESS_KEY,
	);
	await User.findOneAndUpdate({ _id: user._id }, { refreshToken });
	return {
		...user.toObject(),
		refreshToken: refreshToken,
		accessToken: refreshToken,
	};
};
