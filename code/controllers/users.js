import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { validateRequest, verifyAuth } from "./utils.js";
import * as yup from "yup";
import { authTypes, roles } from "../constants/constants.js";

/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
   - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
	try {
		const adminAuth = verifyAuth(req, res, {
			authType: authTypes.admin,
		});
		if (!adminAuth.flag) {
			return res.status(401).json({ error: adminAuth.cause });
		}
		let users = await User.find();
		let data = [];
		if (users) {
			data = users.map(v => {
				return { username: v.username, email: v.email, role: v.role };
			});
		}
		return res.status(200).json({
			data,
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Return information of a specific user
  - Request Body Content: None
  - Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Optional behavior:
   - error 401 is returned if the user is not found in the system
 */
export const getUser = async (req, res) => {
	try {
		const simpleAuth = verifyAuth(req, res, { authType: authTypes.simple });
		if (!simpleAuth.flag) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		const params_schema = yup.object({
			username: yup
				.string()
				.typeError("No 'username' provided")
				.required("No 'username' provided"),
		});
		const { params, isValidationOk, errorMessage } = validateRequest(
			req,
			params_schema,
		);
		if (!isValidationOk) {
			return res.status(400).json({
				error: errorMessage ?? "Error",
			});
		}
		// validation successful

		const user = await User.findOne({ refreshToken: req.cookies.refreshToken });
		if (!user) return res.status(400).json({ error: "User not found" });

		if (user.role === roles.normalUser && user.username === params.username) {
			return res.status(200).json({
				data: {
					username: user.username,
					email: user.email,
					role: user.role,
				},
				refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
			});
		} else if (user.role === roles.admin) {
			const data = await User.findOne({ username: params.username });
			if (!data)
				return res.status(400).json({ error: "There is not such user" });
			return res.status(200).json({
				data: {
					username: data.username,
					email: data.email,
					role: data.role,
				},
				refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
			});
		} else {
			return res.status(401).json({ error: "Unauthorized" });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Create a new group
  - Request Body Content: An object having a string attribute for the `name` of the group and an array that lists all the `memberEmails`
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name`
    of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members
    (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email
    +does not appear in the system)
  - Optional behavior:
    - error 401 is returned if there is already an existing group with the same name
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const createGroup = async (req, res) => {
	try {
		const simpleAuth = verifyAuth(req, res, { authType: authTypes.simple });
		if (!simpleAuth.flag) {
			return res.status(401).json({ error: simpleAuth.cause });
		}

		const body_schema = yup.object({
			name: yup.string().required("No name provided"),
			memberEmails: yup
				.array()
				.of(
					yup
						.string()
						.typeError("The email is not valid")
						.required("The email is not valid")
						.email("The email is not valid"),
				)
				.min(1, "No member emails")
				.required("No member emails provided"),
		});

		const { isValidationOk, errorMessage, body } = validateRequest(
			req,
			undefined,
			body_schema,
		);

		if (!isValidationOk) {
			return res.status(400).json({ error: errorMessage ?? "Bad request" });
		}
		const foundGroup = await Group.count({ name: body.name });

		if (foundGroup === 1) {
			return res.status(400).json({ error: "Group already exists" });
		}
		const claimantUser = await User.findOne({
			refreshToken: req.cookies.refreshToken,
		});

		if (!claimantUser) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const isClaimantPartOfAGroup = await Group.count({
			"members.email": claimantUser.email,
		});
		if (isClaimantPartOfAGroup === 1) {
			return res
				.status(400)
				.json({ error: "You are already part of another group" });
		}

		const emailsSet = Array.from(new Set(body.memberEmails));
		let validUsers = [];
		let membersNotFound = [];
		let alreadyInGroup = [];

		for (let memberEmail of emailsSet) {
			// check if memberEmail is associated to a user
			const user = await User.findOne(
				{ email: memberEmail },
				{ email: 1, _id: 1, username: 1 },
			);
			if (!user) {
				membersNotFound.push(memberEmail);
				continue;
			}
			//check if the memberEmail is part of a group
			const isPartOfGroup = await Group.count({ "members.email": memberEmail });
			if (isPartOfGroup === 1) {
				alreadyInGroup.push(memberEmail);
				continue;
			}
			//existing user, not part of any group
			validUsers.push(user);
		}
		if (!validUsers.find(u => u.email === claimantUser.email)) {
			validUsers.push({ _id: claimantUser._id, email: claimantUser.email });
		}
		//group can be created adding at least another member (claimant + another user)
		if (validUsers.length < 2) {
			return res.status(400).json({ error: "No valid users to be added" });
		}
		const members = validUsers.map(v => {
			return {
				email: v.email,
				user: v._id,
			};
		});

		const groupResponse = await Group.create({
			name: body.name,
			members,
		});

		if (!groupResponse) {
			return res.status(500).json({ error: "Cannot create group" });
		}
		return res.status(200).json({
			data: {
				group: {
					name: groupResponse.name,
					members: members.map(m => {
						return { email: m.email };
					}),
				},
				membersNotFound: membersNotFound.map(m => {
					return { email: m };
				}),
				alreadyInGroup: alreadyInGroup.map(m => {
					return { email: m };
				}),
			},
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Return all the groups
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having a string attribute for the `name` of the group
    and an array for the `members` of the group
  - Optional behavior:
    - empty array is returned if there are no groups
 */
export const getGroups = async (req, res) => {
	try {
		const adminAuth = verifyAuth(req, res, { authType: authTypes.admin });
		if (!adminAuth.flag) {
			return res.status(401).json({ error: adminAuth.cause });
		}
		const groups = await Group.find();
		let data = [];
		groups.forEach(v => {
			data.push({
				name: v.name,
				members: v.members.map(m => {
					return { email: m.email };
				}),
			});
		});

		return res.status(200).json({
			data,
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Return information of a specific group
  - Request Body Content: None
  - Response `data` Content: An object having a string attribute for the `name` of the group and an array for the 
    `members` of the group
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const getGroup = async (req, res) => {
	try {
		// auth
		const group = await Group.findOne({ name: req?.params?.name });
		if (!group) {
			return res.status(400).json({ error: "Group not found" });
		}

		const groupAuth = verifyAuth(req, res, {
			authType: authTypes.group,
			emails: group.members.map(m => m.email),
		});
		if (!groupAuth.flag) {
			return res.status(401).json({ error: groupAuth.cause });
		}
		//validation
		const params_schema = yup.object({
			name: yup
				.string()
				.typeError("No group name provided")
				.required("No group name provided"),
		});
		const { params, isValidationOk, errorMessage } = validateRequest(
			req,
			params_schema,
		);
		if (!isValidationOk) {
			return res.status(400).json({
				error: errorMessage,
			});
		}

		return res.status(200).json({
			data: {
				name: group.name,
				members: group.members.map(m => {
					return { email: m.email };
				}),
			},
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Add new members to a group
  - Request Body Content: An array of strings containing the emails of the members to add to the group
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include the new members as well as the old ones), 
    an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const addToGroup = async (req, res) => {
	try {
		// Checks Group Existence
		if (!req?.params?.name) {
			return res.status(400).json({ error: "Group does not exist" });
		}
		const group = await Group.findOne({ name: req.params.name });
		if (!group) {
			return res.status(400).json({ error: "Group does not exist" });
		}
		let group_emails = group.members.map(m => m.email);
		let info;
		if (req.url.endsWith("/insert")) {
			info = { authType: authTypes.admin };
		} else {
			info = {
				authType: authTypes.group,
				emails: group_emails,
			};
		}
		const auth = verifyAuth(req, res, info);
		if (!auth.flag) {
			return res.status(401).json({ error: auth.cause });
		}
		// start validation
		const params_schema = yup.object({
			name: yup
				.string()
				.typeError("No group name provided")
				.required("No group name provided"),
		});
		const body_schema = yup.object({
			emails: yup
				.array()
				.of(
					yup
						.string()
						.typeError("The email is not valid")
						.required("The email is not valid")
						.email("The email is not valid"),
				)
				.min(1, "No member emails provided")
				.required("No member emails provided"),
		});
		const { params, body, isValidationOk, errorMessage } = validateRequest(
			req,
			params_schema,
			body_schema,
		);
		if (!isValidationOk) {
			return res.status(400).json({ error: errorMessage ?? "Error" });
		}
		// validation successful

		const emailSet = Array.from(new Set(body.emails));
		let validUsers = [];
		let membersNotFound = [];
		let alreadyInGroup = [];

		for (let memberEmail of emailSet) {
			// check if memberEmail is associated to a user
			const user = await User.findOne(
				{ email: memberEmail },
				{ email: 1, _id: 1 },
			);
			if (!user) {
				membersNotFound.push(memberEmail);
				continue;
			}
			//check if the memberEmail is part of a group
			const isPartOfGroup = await Group.count({ "members.email": memberEmail });
			if (isPartOfGroup === 1) {
				alreadyInGroup.push(memberEmail);
				continue;
			}
			//existing user, not part of any group
			validUsers.push({ email: user.email, user: user._id });
		}

		// Check if there is new valid users to be added
		if (validUsers.length === 0) {
			return res
				.status(400)
				.json({ error: "There are no valid users to be added" });
		}

		// Updates and gets group
		const updated_group = await Group.findOneAndUpdate(
			{ name: group.name },
			{ $push: { members: { $each: validUsers } } },
			{ new: true },
		);

		if (!updated_group) {
			return res
				.status(500)
				.json({ error: "An error occurred while updating" });
		}
		const groupSended = {
			name: updated_group.name,
			members: updated_group.members.map(m => {
				return { email: m.email };
			}),
		};
		return res.status(200).json({
			data: {
				group: groupSended,
				membersNotFound: membersNotFound,
				alreadyInGroup: alreadyInGroup,
			},
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Remove members from a group
  - Request Body Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include only the remaining members),
    an array that lists the `notInGroup` members (members whose email is not in the group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are not in the group
 */
export const removeFromGroup = async (req, res) => {
	try {
		// find group
		const group = await Group.findOne({ name: req.params.name });
		if (!group?.members) {
			return res.status(400).json({ error: "Group not found" });
		}

		// auth
		let info = {};
		if (req.url.endsWith("/pull")) {
			info = { authType: authTypes.admin };
		} else {
			const emails = group.members.map(m => m.email);
			info = { authType: authTypes.group, emails };
		}
		const auth = verifyAuth(req, res, info);
		if (!auth.flag) {
			return res.status(401).json({ error: auth.cause });
		}

		// param validation
		const params_schema = yup.object({
			name: yup
				.string()
				.typeError("No group name provided")
				.required("No group name provided"),
		});
		const body_schema = yup.object({
			emails: yup
				.array()
				.of(
					yup
						.string()
						.typeError("No valid email provided")
						.required("No valid email provided")
						.email("No valid email provided"),
				)
				.required("No emails provided")
				.min(1, "No emails provided"),
		});

		const { body, params, isValidationOk, errorMessage } = validateRequest(
			req,
			params_schema,
			body_schema,
		);
		if (!isValidationOk) {
			return res.status(400).json({ error: errorMessage });
		}

		/////////////////////////////////////////////////////////////////

		const membersNotFound = [];
		const notInGroup = [];
		const validMembers = [];
		const uniqueEmails = Array.from(new Set(body.emails));

		if (group.members.length === 1) {
			return res.status(400).json({ error: "No users can be removed" });
		}
		for (const email of uniqueEmails) {
			const doesUserExist = await User.count({ email });
			if (doesUserExist === 0) {
				membersNotFound.push(email);
				continue;
			}
			const isMemberOfThisGroup = await Group.count({
				name: group.name,
				"members.email": email,
			});
			if (isMemberOfThisGroup === 0) {
				notInGroup.push(email);
				continue;
			}
			validMembers.push(email);
		}

		// if we are trying to delete all the members skip the first one (group cannot be empty)
		let toBeDeleted = validMembers;
		const firstMember = group.members[0];
		if (validMembers.length === group.members.length) {
			toBeDeleted = validMembers.filter(m => m !== firstMember.email);
		}

		if (toBeDeleted.length === 0) {
			return res.status(400).json({ error: "No valid users to be removed" });
		}
		const removedMembers = await Group.updateOne(
			{ name: group.name },
			{ $pull: { members: { email: { $in: toBeDeleted } } } },
		);
		if (removedMembers.modifiedCount === 0) {
			return res.status(500).json({ error: "Cannot perform update" });
		}

		const updateGroup = await Group.findOne(
			{ name: group.name },
			{ _id: 0, "members.user": 0, "members._id": 0, __v: 0 },
		);

		return res.status(200).json({
			data: {
				group: {
					name: updateGroup.name,
					members: updateGroup.members.map(m => {
						return { email: m.email };
					}),
				},
				notInGroup,
				membersNotFound,
			},
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Delete a user
  - Request Parameters: None
  - Request Body Content: A string equal to the `email` of the user to be deleted
  - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and a boolean attribute that
    specifies whether the user was also `deletedFromGroup` or not.
  - Optional behavior:
    - error 401 is returned if the user does not exist 
 */
export const deleteUser = async (req, res) => {
	try {
		const adminAuth = verifyAuth(req, res, { authType: authTypes.admin });
		if (!adminAuth.flag) {
			return res.status(401).json({ error: adminAuth.cause });
		}
		const body_schema = yup.object({
			email: yup
				.string()
				.typeError("No email provided")
				.required("No email provided")
				.email("Invalid email"),
		});

		const { errorMessage, isValidationOk, body } = validateRequest(
			req,
			undefined,
			body_schema,
		);

		if (!isValidationOk) {
			return res.status(400).json({ error: errorMessage ?? "Error" });
		}

		const user = await User.findOne({ email: body.email });

		if (!user) {
			return res.status(400).json({ error: "User does not exist" });
		}
		if (user.role === roles.admin) {
			return res.status(400).json({ error: "Cannot delete admins" });
		}

		const deleteResponse = await User.deleteOne({ _id: user._id });
		if (deleteResponse.deletedCount !== 1) {
			return res.status(500).json({ error: "Cannot delete the user" });
		}
		let deletedFromGroup = false;
		const isPartOfGroup = await Group.findOne({ "member.email": user.email });
		if (isPartOfGroup) {
			if (isPartOfGroup.members.length === 1) {
				await Group.deleteOne({ name: isPartOfGroup.name }); //if user is the only member delete the group
			} else {
				await Group.update(
					{ "members.email": user.email },
					{
						$pull: {
							members: {
								email: user.email,
							},
						},
					},
				);
			}
			deletedFromGroup = true;
		}

		const deletedTransactions = await transactions.deleteMany({
			username: user.username,
		});

		return res.status(200).json({
			data: {
				deletedTransactions: deletedTransactions.deletedCount,
				deletedFromGroup,
			},
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Delete a group
  - Request Body Content: A string equal to the `name` of the group to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const deleteGroup = async (req, res) => {
	try {
		const adminAuth = verifyAuth(req, res, { authType: authTypes.admin });
		if (!adminAuth.flag)
			return res.status(401).json({ error: adminAuth.cause });
		const body_schema = yup.object({
			name: yup
				.string()
				.typeError("No name provided")
				.required("No name provided"),
		});
		const { body, isValidationOk, errorMessage } = validateRequest(
			req,
			undefined,
			body_schema,
		);
		if (!isValidationOk)
			return res.status(400).json({ error: errorMessage ?? "Error" });

		const groupFound = await Group.count({ name: body.name });
		if (groupFound !== 1)
			return res.status(400).json({ error: "Group not found" });

		const delResponse = await Group.deleteOne({ name: body.name });
		if (!delResponse)
			return res.status(500).json({ error: "Cannot delete group" });

		return res.status(200).json({
			data: { message: "Group was successfully deleted" },
			refreshedTokenMessage: res?.locals?.refreshedTokenMessage,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
