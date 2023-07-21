import jwt from "jsonwebtoken";
import { roles } from "../constants/constants.js";

import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const userToken = jwt.sign(
	{
		username: "user",
		email: "randomuser1@userdom.com",
		id: "6464db162098d36f5097b73d",
		role: roles.normalUser,
	},
	process.env.ACCESS_KEY,
	{ expiresIn: "2000d" },
);
const adminToken = jwt.sign(
	{
		username: "admin",
		email: "ezadmin@admin.com",
		id: "6464db162098d36f5097b73d",
		role: roles.admin,
	},
	process.env.ACCESS_KEY,
	{ expiresIn: "2000d" },
);
console.log(userToken);
console.log(adminToken);
