import ObjectID from "mongodb";
import updateOrderStatus from "../utils/updateOrderStatus.js";
import ReactionError from "@reactioncommerce/reaction-error";
// import { canCreateUser } from "../utils/canCreateUser";
export default {
    Mutation: {
        async createRiderOrder(parent, { orders }, context, info) {
            console.log(orders);
            console.log(context.user);
            // const assignTo = ""
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("access-denied", "Please Login First");
            }
            // if (!orders[0].assignTo) {
            //     orders[0].assignTo = context.user.id
            // }

            const AllOrdersArray = orders;
            const { RiderOrder, Accounts, Orders } = context.collections;
            const CurrentRiderID = context.user.id;
            const RiderIDForAssign = orders[0].riderID;
            const currentDate = new Date().toISOString().substr(0, 10);
            const currentOrderDate = new Date().toISOString();
            console.log(RiderIDForAssign);
            console.log(currentDate);
            const riderStatus = await Accounts.findOne({ _id: RiderIDForAssign });
            console.log("Status of Rider : ", riderStatus)
            if (riderStatus.currentStatus === "offline") {
                throw new ReactionError("Rider is offline, cannot create order");
            }

            const ordersWithRiderId = orders.map((order) => ({
                ...order,
                LoginRiderID: RiderIDForAssign,
                createdAt: currentOrderDate,
            }));
            console.log("ordersWithRiderId", ordersWithRiderId)
            const existingOrders = await RiderOrder.find({
                RiderOrderID: { $in: ordersWithRiderId.map((o) => o.RiderOrderID) },
                branchname: { $in: ordersWithRiderId.map((o) => o.branchname) },
            }).toArray();
            console.log("existingOrders :", existingOrders);
            if (existingOrders.length > 0) {
                throw new ReactionError("One or more orders already exist for the same branch and day");
            }
            try {
                const insertedOrders = await RiderOrder.insertMany(ordersWithRiderId);
                console.log(insertedOrders.insertedIds);
                console.log(AllOrdersArray);
                updateOrderStatus(orders, "pickedUp", Orders);
                return insertedOrders.ops;
            } catch (err) {
                if (err.code === 11000) {
                    throw new ReactionError("Order Already Exists");
                }
                throw err;
            }
        },
        async updateRiderOrder(
            parent,
            { id, startTime, endTime, OrderStatus, RiderOrderID },
            context,
            info
        ) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("access-denied", "Please Login First");
            }
            const CurrentRiderID = context.user.id;

            const { RiderOrder } = context.collections;
            const filter = { RiderOrderID: RiderOrderID };
            const update = {};
            if (startTime) {
                update.startTime = startTime;
            }
            if (endTime) {
                update.endTime = endTime;
            }
            if (OrderStatus) {
                update.OrderStatus = OrderStatus;
            }
            if (RiderOrderID) {
                update.RiderOrderID = RiderOrderID;
            }
            const options = { returnOriginal: false };
            const response = await RiderOrder.findOneAndUpdate(
                filter,
                { $set: update },
                options
            );
            console.log(response);
            console.log(response.value);
            return {
                id: response.value._id,
                startTime: response.value.startTime,
                endTime: response.value.endTime,
                OrderStatus: response.value.OrderStatus,
                RiderOrderID: response.value.RiderOrderID,
                LoginRiderID: response.value.LoginRiderID,
                OrderID: response.value.OrderID,
            };
        },
        async updateUserCurrentStatus(parent, args, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("Unauthorized access. Please login first");
            }
            const { Accounts } = context.collections;
            console.log(args.status);
            console.log(context.user.id);
            const currentStatus = args.status;
            const userID = context.user.id;
            if (!userID) {
                throw new ReactionError("Please Login First");
            }
            const updatedUser = await Accounts.findOneAndUpdate(
                { _id: userID },
                { $set: { currentStatus } },
                { returnOriginal: false }
            );
            console.log(updatedUser.value);
            if (!updatedUser) {
                throw new ReactionError(`User with ID ${userID} not found`);
            }

            return updatedUser.value;

        },
        async assignBranchtoUser(parent, args, context, info) {
            console.log(args);
            // console.log(context.collections);
            console.log(context.user);

            if (
                context.user === undefined ||
                context.user === null ||
                context.user === ""
            ) {
                throw new ReactionError("Unauthorized access. Please login first");
            }

            const { userID, branches } = args;
            const CurrentUserID = context.user.id;
            const { Accounts } = context.collections;
            const filter = { _id: userID };
            const update = { $push: { branches: branches } };
            const options = { new: true };
            console.log(branches);
            const userAccount = await Accounts.findOne(filter);
            console.log(userAccount);
            if (
                userAccount.branches &&
                userAccount.branches.includes(args.branches)
            ) {
                throw new ReactionError("Branch Already Assigned");
            }

            if (
                context.user.UserRole.toLowerCase() === "admin" ||
                context.user.UserRole.toLowerCase() === "dispatcher"
            ) {
                const updatedAccount = await Accounts.findOneAndUpdate(
                    filter,
                    update,
                    options
                );
                console.log(updatedAccount);
                const updatedUser = await Accounts.findOne({ _id: userID });
                console.log("updatedUser--->", updatedUser);
                return updatedUser;
            } else {
                throw new ReactionError("Unauthorized access!");
            }
        },
        async updateAccountAdmin(parent, args, context, info) {
            console.log(args);
            console.log(context.user);
            console.log(context.user.UserRole);
            if (
                context.user === undefined ||
                context.user === null ||
                context.user === ""
            ) {
                throw new ReactionError("Unauthorized access. Please login first");
            }
            if (
                context.user.UserRole.toLowerCase() === "admin" ||
                context.user.UserRole.toLowerCase() === "dispatcher"
            ) {
                const { Accounts } = context.collections;
                const { userID, branches } = args;
                const newBranchValue = branches;
                console.log(newBranchValue);
                const checkAccountResponse = await Accounts.findOne({ _id: userID });
                // console.log(checkAccountResponse);
                // Check if the new branch already exists in the branches array
                if (
                    checkAccountResponse.branches &&
                    checkAccountResponse.branches.includes(newBranchValue)
                ) {
                    throw new ReactionError("Branch Already Assigned");
                }
                // If the new value doesn't exist, update the branches array and return the new value
                const updateAccountResult = await Accounts.updateOne(
                    { _id: userID },
                    { $addToSet: { branches: newBranchValue } } // $addToSet only adds the value if it doesn't already exist
                );
                console.log(updateAccountResult);
                if (updateAccountResult.modifiedCount !== 1) {
                    throw new ReactionError(`Failed to update branch value to user: ${userID}`);
                }
                const updatedUser = await Accounts.findOne({ _id: userID });
                console.log("updatedUser--->", updatedUser);
                return updatedUser;
            } else {
                throw new ReactionError("Unauthorized");
            }
        },
    },
    Query: {
        async getOrderById(parent, { id }, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("Unauthorized access. Please login first");
            }
            const { RiderOrder } = context.collections;
            if (id === null || id === undefined) {
                id = context.user.id;
            }
            const currentDate = new Date().toISOString().substr(0, 10); // get current date in ISO format (yyyy-mm-dd)

            const ordersresp = await RiderOrder.find({
                assignTo: id,
                $or: [
                    { startTime: { $gte: currentDate } }, // include orders that start on or after the current date
                ],
            })
                .sort({ createdAt: -1 })
                .toArray();
            console.log(ordersresp);

            // replace null createdAt with empty string
            ordersresp.forEach(order => {
                if (order.createdAt === null || order.createdAt === undefined) {
                    order.createdAt = new Date(0)
                }
            });
            if (ordersresp) {
                return ordersresp;
            } else {
                return null;
            }
        },
        async getOrdersByStatus(parent, { OrderStatus }, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("Unauthorized access. Please login first");
            }
            console.log(OrderStatus);
            console.log(context.user.id);
            const LoginUserID = context.user.id;
            const { RiderOrder } = context.collections;
            // Get Order by status
            const orders = await RiderOrder.find({
                OrderStatus: OrderStatus,
            })
                .sort({ createdAt: -1 })
                .toArray();
            console.log(orders);
            if (orders) {
                // Current Login User Order
                const filteredOrders = orders.filter(
                    (order) => order.assignTo === LoginUserID
                );
                const ordersWithId = filteredOrders.map((order) => ({
                    id: order._id,
                    ...order,
                }));
                return ordersWithId;
            } else {
                return null;
            }
        },
        async generateOrderReport(parent, args, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("Unauthorized access. Please login first");
            }
            const { RiderOrder, Users } = context.collections;
            const { id } = context.user;
            console.log(id);

            // const { branchName } = args;
            let match = {};
            if (args.LoginRiderID) {
                match.LoginRiderID = args.LoginRiderID;
            }
            if (args.branchName) {
                match.branchname = args.branchName;
                // match["RiderOrder.branchname"] = args.branchName;
            }
            if (args.startDate && args.startDate !== undefined) {
                console.log(args.startDate);
                match.startTime = { $gte: new Date(args.startDate) };
            }
            if (args.RiderOrderID) {
                match.RiderOrderID = args.RiderOrderID;
            }
            if (args.endDate && args.endDate !== undefined) {
                console.log(args.endDate);
                match.endTime = { $lte: new Date(args.endDate) };
            }
            console.log(match);
            const report = await RiderOrder.aggregate([
                {
                    $match: match,
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "LoginRiderID",
                        foreignField: "_id",
                        as: "Rider",
                    },
                },
                {
                    $unwind: "$Rider",
                },
                {
                    $project: {
                        LoginRiderID: "$LoginRiderID",
                        riderName: {
                            $concat: ["$Rider.firstName", " ", "$Rider.lastName"],
                        },
                        branchCity: "$Rider.branchCity",
                        branchName: "$Rider.branchname",
                        orderStatus: "$OrderStatus",
                        username: "$Rider.username",
                        startTime: {
                            $cond: {
                                if: { $ne: ["$startTime", ""] },
                                then: { $toDate: "$startTime" },
                                else: null,
                            },
                        },
                        endTime: {
                            $cond: {
                                if: { $ne: ["$endTime", ""] },
                                then: { $toDate: "$endTime" },
                                else: null,
                            },
                        },
                        // startTime: { $toDate: "$startTime" },
                        // endTime: { $toDate: "$endTime" },
                        RiderOrderID: "$RiderOrderID",
                    },
                },
                {
                    $addFields: {
                        deliveryTime: {
                            $divide: [{ $subtract: ["$endTime", "$startTime"] }, 60000],
                        },
                        startTime: { $toDate: "$startTime" },
                        endTime: { $toDate: "$endTime" },
                    },
                },
                // {
                //     $addFields: {
                //         deliveryTime: {
                //             $divide: [{ $subtract: ["$endTime", "$startTime"] }, 60000],
                //         },
                //     },
                // },
                {
                    $sort: {
                        createdAt: -1,
                    },
                },
            ]).toArray();
            console.log(report);
            return report;
        },
        async getRiderOrdersByLoginRider(parent, args, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("Unauthorized access. Please login first");
            }
            // const today = new Date().toISOString().substr(0, 10);

            const { startDate, endDate, LoginRiderID } = args;
            const { RiderOrder } = context.collections;
            const { id } = context.user;
            console.log(id)
            // const query = {};
            // if (LoginRiderID) {
            //     query.LoginRiderID = LoginRiderID;
            // }

            // if (startDate && endDate) {
            //     const start = new Date(startDate);
            //     const end = new Date(endDate);
            //     query.createdAt = {
            //         $gte: start,
            //         $lte: end,
            //     };
            // }
            // console.log(query);
            const orders = await RiderOrder.find({ LoginRiderID: LoginRiderID })
                .sort({ createdAt: -1 })
                .toArray();
            console.log(orders);
            // get today's date
            const today = new Date().toISOString().substring(0, 10);
            console.log(today)
            // filter data array to include only items with today's date in startTime
            const filteredData = orders.filter((item) => {
                if (!item.createdAt) {
                    return false;
                }
                const itemDate = item.createdAt.substring(0, 10);
                return itemDate === today;
            });
            console.log(filteredData);
            return filteredData;
        },
        async getKitchenReport(parent, args, context, info) {
            // console.log(context.collections)
            console.log(args);
            const { startDate, endDate, branchID, Orderstatus } = args;
            console.log(context.user);
            // console.log(context.user.UserRole);
            // console.log(!context.user.branches);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError("Unauthorized access. Please login first");
            }
            if (
                context.user.UserRole !== "admin" &&
                (!context.user.branches ||
                    (context.user.branches && !context.user.branches.includes(branchID)))
            ) {
                throw new ReactionError(
                    "Only admins or authorized branch users can access orders report"
                );
            }
            const { BranchData, Orders } = context.collections;
            const query = {};
            if (branchID) {
                query.branchID = branchID;
            }
            // else if (context.user.branches) {
            //     query.branchID = { $in: context.user.branches };
            // }
            if (Orderstatus) {
                // query.workflow.status = args.Orderstatus;
                query['workflow.status'] = Orderstatus;
            }
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                query.createdAt = {
                    $gte: start,
                    $lte: end,
                };
            }
            console.log(query);
            const ordersResp = await Orders.find(query)
                .sort({ createdAt: -1 })
                .toArray();
            console.log(ordersResp);
            const ordersWithId = ordersResp.map((order) => ({
                id: order._id,
                ...order,
            }));
            return ordersWithId;
        },
    },
};
