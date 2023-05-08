import ObjectID from "mongodb";
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";
// import updateOrderStatus from "../utils/updateOrderStatus.js";
import ReactionError from "@reactioncommerce/reaction-error";
export default {
    Order: {
        async branchInfo(parent, args, context, info) {
            // console.log("parent", parent)
            const BranchID = parent.branchID;
            // console.log("BranchID:- ", BranchID)
            if (BranchID) {
                const { BranchData } = context.collections;
                const branchDataResponse = await BranchData.find({
                    _id: ObjectID.ObjectId(BranchID),
                }).toArray();
                // console.log("Branch Data : ", branchDataResponse[0])
                return branchDataResponse[0];
            } else {
                return [];
            }
        },
        async riderInfo(parent, args, context, info) {
            // console.log("parent", parent);
            const { RiderOrder, Accounts } = context.collections;
            const { id } = parent;
            // console.log("OrderID:- ", id);
            if (id) {
                const RiderOrderResponse = await RiderOrder.find({
                    OrderID: id,
                }).toArray();
                if (RiderOrderResponse[0] !== undefined) {
                    // console.log("rider ID Data : ", RiderOrderResponse[0].riderID);
                    const RiderDataResponse = await Accounts.find({
                        _id: RiderOrderResponse[0].riderID,
                    }).toArray();
                    // console.log("RiderDataResponse Data : ", RiderDataResponse[0]);
                    return RiderDataResponse[0];
                }
            } else {
                return [];
            }
        },
        async customerInfo(parent, args, context, info) {
            const { Orders } = context.collections;
            const orderInfoResponse = await Orders.find({
                _id: parent.OrderID,
            }).toArray();
            if (orderInfoResponse) {
                return orderInfoResponse[0].shipping[0].address
            }
            else {
                return null
            }

        },
        async customerOrderTime(parent, args, context, info) {
            // console.log("Parent ", parent.OrderID);
            const { Orders } = context.collections
            const customerOrderTimeResp = await Orders.findOne({ _id: parent.OrderID });
            // console.log("Customer Resp ", customerOrderTimeResp.createdAt)
            if (customerOrderTimeResp) {
                return {
                    "customerOrderTime": customerOrderTimeResp.createdAt
                }
            }
            else {
                return null
            }
        },
        async branchTimePickup(parent, args, context, info) {
            // console.log("branch riderID ", parent.riderID);
            const { RiderOrder } = context.collections;
            const branchTimePickupResp = await RiderOrder.findOne({ riderID: parent.riderID });
            // console.log("branchTimePickupResp ", branchTimePickupResp)
            if (branchTimePickupResp) {
                return {
                    "branchOrderTime": branchTimePickupResp.createdAt
                }
            }
            else {
                return null;
            }
        },
        async kitchenOrderIDInfo(parent, args, context, info) {
            // console.log("Parent ", parent.OrderID);
            const { Orders } = context.collections
            const kitchenOrderIDResp = await Orders.findOne({ _id: parent.OrderID });
            // console.log("Customer Resp ", kitchenOrderIDResp.kitchenOrderID)
            if (kitchenOrderIDResp) {
                return {
                    "kitchenOrderID": kitchenOrderIDResp.kitchenOrderID
                };
            }
            else {
                return null;
            }
        }
    },
    OrderReport: {
        async branchInfo(parent, args, context, info) {
            // console.log("parent", parent);
            const BranchID = parent.branches;
            // console.log("BranchID:- ", BranchID);
            if (BranchID) {
                const { BranchData } = context.collections;
                const branchDataResponse = await BranchData.find({
                    _id: ObjectID.ObjectId(BranchID),
                }).toArray();
                // console.log("Branch Data : ", branchDataResponse[0]);
                return branchDataResponse[0];
            } else {
                return [];
            }
        },
    },
    Mutation: {
        async createRiderOrder(parent, { orders }, context, info) {
            // console.log(orders);
            // console.log(context.user);
            // Get the start and end of today

            const now = new Date();
            if (context.user === undefined || context.user === null) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            // console.log("Hello");
            const AllOrdersArray = orders;
            const { RiderOrder, Accounts, Orders } = context.collections;
            const CurrentRiderID = context.user.id;
            const RiderIDForAssign = orders.map((order) => {
                const riderId = order.riderID ? order.riderID : CurrentRiderID;
                return {
                    ...order,
                    riderID: riderId,
                    createdAt: now,
                };
            });

            // console.log("RiderIDForAssign", RiderIDForAssign);

            const riderStatus = await Accounts.findOne({ _id: RiderIDForAssign });
            // console.log("Status of Rider : ", riderStatus);

            if (riderStatus && riderStatus.currentStatus === "offline") {
                throw new ReactionError(
                    "not-found",
                    "Rider is offline, cannot create order"
                );
            }
            const existingRiderOrders = await RiderOrder.find({
                OrderID: { $in: RiderIDForAssign.map((o) => o.OrderID) },
            }).toArray();
            // console.log("existingRiderOrders:- ", existingRiderOrders);
            if (existingRiderOrders.length > 0) {
                if (existingRiderOrders[0].riderID !== RiderIDForAssign[0].riderID) {
                    // const insertedOrders1 = await RiderOrder.insertOne(RiderIDForAssign[0]);
                    const update = {};
                    // if (existingRiderOrders[0].startTime) {
                    //     update.startTime = existingRiderOrders[0].startTime;
                    // }
                    const insertedOrders1 = await RiderOrder.findOneAndUpdate(
                        { _id: existingRiderOrders[0]._id },
                        // { $set: { riderID: RiderIDForAssign[0].riderID } },
                        {
                            $set: {
                                riderID: RiderIDForAssign[0].riderID,
                                branches: RiderIDForAssign[0].branches,
                                OrderID: RiderIDForAssign[0].OrderID,
                                OrderStatus: RiderIDForAssign[0].OrderStatus,
                                startTime: RiderIDForAssign[0].startTime
                            }
                        },
                        { new: true }
                    );
                    // console.log("insertedOrders1:- ", insertedOrders1);
                    if (insertedOrders1) {
                        return insertedOrders1.value
                    }
                    else {
                        // console.log("else part uper")
                        try {
                            const insertedOrders = await RiderOrder.insertMany(RiderIDForAssign);
                            // console.log("here");
                            // console.log("inserted Data:- ", insertedOrders[0])
                            // console.log(AllOrdersArray);
                            // console.log("Order ID:- ", AllOrdersArray[0].OrderID);
                            if (insertedOrders) {
                                const updateOrders = { $set: { "workflow.status": "pickedUp" } };
                                const options = { new: true };
                                const updatedOrder = await Orders.findOneAndUpdate(
                                    { _id: AllOrdersArray[0].OrderID },
                                    updateOrders,
                                    options
                                );
                                // console.log("updated Order:- ", updatedOrder);
                            }
                            // (AllOrdersArray[0].OrderID, "pickedUp", Orders);
                            return insertedOrders.ops;
                        } catch (err) {
                            if (err.code === 11000) {
                                throw new ReactionError("duplicate", "Order Already Exists");

                                // throw new ReactionError("Order Already Exists");
                            }
                            throw err;
                        }
                    }
                }
                else {
                    throw new ReactionError(
                        "duplicate",
                        "One or more orders already exist for the same branch and day"
                    );
                }
            }
            else {
                // console.log("else 2 part")
                try {
                    const insertedOrders = await RiderOrder.insertMany(RiderIDForAssign);
                    // console.log(insertedOrders.insertedIds);
                    // console.log("inserted Data:- ", insertedOrders)
                    // console.log(AllOrdersArray);
                    // console.log("Order ID:- ", AllOrdersArray[0].OrderID);
                    if (insertedOrders) {
                        const updateOrders = { $set: { "workflow.status": "pickedUp" } };
                        const options = { new: true };
                        const updatedOrder = await Orders.findOneAndUpdate(
                            { _id: AllOrdersArray[0].OrderID },
                            updateOrders,
                            options
                        );
                        // console.log("updated Order:- ", updatedOrder);
                    }
                    // updateOrderStatus(AllOrdersArray[0].OrderID, "pickedUp", Orders);
                    return insertedOrders.ops[0];
                } catch (err) {
                    if (err.code === 11000) {
                        throw new ReactionError("duplicate", "Order Already Exists");

                        // throw new ReactionError("Order Already Exists");
                    }
                    throw err;
                }
            }

            // const existingOrders = await RiderOrder.find({
            //     OrderID: { $in: RiderIDForAssign.map((o) => o.OrderID) },
            //     branches: { $in: RiderIDForAssign.map((o) => o.branches) },
            //     createdAt: {
            //         $gte: todayStart,
            //         $lte: todayEnd,
            //     },
            // }).toArray();
            // console.log("existingOrders :", existingOrders);
            // if (existingOrders.length > 0) {
            //     throw new ReactionError("duplicate", "One or more orders already exist for the same branch and day");
            // }
            // try {
            //     const insertedOrders = await RiderOrder.insertMany(RiderIDForAssign);
            //     console.log(insertedOrders.insertedIds);
            //     console.log(AllOrdersArray);
            //     console.log("Order ID:- ", AllOrdersArray[0].OrderID);
            //     if (insertedOrders) {
            //         const updateOrders = { $set: { "workflow.status": "pickedUp" } };
            //         const options = { new: true };
            //         const updatedOrder = await Orders.findOneAndUpdate(
            //             { _id: AllOrdersArray[0].OrderID },
            //             updateOrders,
            //             options
            //         );
            //         console.log("updated Order:- ", updatedOrder);
            //     }
            //     // updateOrderStatus(AllOrdersArray[0].OrderID, "pickedUp", Orders);
            //     return insertedOrders.ops;
            // } catch (err) {
            //     if (err.code === 11000) {
            //         throw new ReactionError("duplicate", "Order Already Exists");

            //         // throw new ReactionError("Order Already Exists");
            //     }
            //     throw err;
            // }
        },
        async updateRiderOrder(
            parent,
            { id, startTime, endTime, OrderStatus, OrderID, rejectionReason },
            context,
            info
        ) {
            // console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
            const CurrentRiderID = context.user.id;

            const { RiderOrder, Orders } = context.collections;
            const filter = { OrderID: OrderID };
            const update = {};
            if (rejectionReason) {
                update.rejectionReason = rejectionReason;
            }
            if (startTime) {
                update.startTime = startTime;
            }
            if (endTime) {
                update.endTime = endTime;
            }
            if (OrderStatus) {
                update.OrderStatus = OrderStatus;
                const updateOrders = { $set: { "workflow.status": OrderStatus } };
                const options = { new: true };
                const updatedOrder = await Orders.findOneAndUpdate(
                    { _id: OrderID },
                    updateOrders,
                    options
                );
                // console.log("updated Order:- ", updatedOrder);
            }
            if (OrderStatus === "ready") {
                const updatedBranch = {
                    prepTime: 0, // add prepTime field here
                    updatedAt: new Date().toISOString(),
                };
                // const UpdatedBranchDataResp = await BranchData.updateOne({ _id: branch._id }, { $set: updatedBranch });
                // console.log(UpdatedBranchDataResp)
            }
            if (OrderID) {
                update.OrderID = OrderID;
            }
            // console.log("Update ", update)
            const options = { new: true };
            const response = await RiderOrder.findOneAndUpdate(
                filter,
                { $set: update },
                options
            );

            console.log("response", response);
            console.log(response.value);
            if (response.value !== null) {
                const updatedOrderResp = await RiderOrder.findOne({ _id: response.value._id });
                console.log(updatedOrderResp);
                // return updatedOrderResp;
                return {
                    id: updatedOrderResp._id,
                    ...updatedOrderResp
                    // startTime:updatedOrderResp.startTime,
                    // endTime: updatedOrderResp.endTime,
                    // OrderStatus: updatedOrderResp.OrderStatus,
                    // OrderID: updatedOrderResp.OrderID,
                    // riderID: updatedOrderResp.riderID,
                    // rejectionReason: updatedOrderResp.rejectionReason,
                };
            } else {
                return null
            }

        },
        async updateUserCurrentStatus(parent, args, context, info) {
            // console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
            const { Accounts } = context.collections;
            // console.log(args.status);
            // console.log(context.user.id);
            const currentStatus = args.status;
            const userID = context.user.id;
            if (!userID) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
            const updatedUser = await Accounts.findOneAndUpdate(
                { _id: userID },
                { $set: { currentStatus } },
                { returnOriginal: false }
            );
            // console.log(updatedUser.value);
            if (!updatedUser) {
                throw new ReactionError(
                    "not-found",
                    `User with ID ${userID} not found`
                );
            }

            return updatedUser.value;
        },
        async assignBranchtoUser(parent, args, context, info) {
            // console.log(args);
            // console.log(context.collections);
            // console.log(context.user);

            if (
                context.user === undefined ||
                context.user === null ||
                context.user === ""
            ) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }

            const { userID, branches } = args;
            const CurrentUserID = context.user.id;
            const { Accounts } = context.collections;
            const filter = { _id: userID };
            const update = { $push: { branches: branches } };
            const options = { new: true };
            // console.log(branches);
            const userAccount = await Accounts.findOne(filter);
            // console.log(userAccount);
            if (
                userAccount.branches &&
                userAccount.branches.includes(args.branches)
            ) {
                throw new ReactionError("duplicate", "Branch Already Assigned");

                // throw new ReactionError("Branch Already Assigned");
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
                // console.log(updatedAccount);
                const updatedUser = await Accounts.findOne({ _id: userID });
                // console.log("updatedUser--->", updatedUser);
                return updatedUser;
            } else {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );

                // throw new ReactionError("Unauthorized access!");
            }
        },
        async updateAccountAdmin(parent, args, context, info) {
            // console.log(args);
            // console.log(context.user);
            // console.log(context.user.UserRole);
            if (
                context.user === undefined ||
                context.user === null ||
                context.user === ""
            ) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
            if (
                context.user.UserRole.toLowerCase() === "admin" ||
                context.user.UserRole.toLowerCase() === "dispatcher"
            ) {
                const { Accounts } = context.collections;
                const { userID, branches } = args;
                const newBranchValue = branches;
                // console.log(newBranchValue);
                const checkAccountResponse = await Accounts.findOne({ _id: userID });
                // console.log(checkAccountResponse);
                // Check if the new branch already exists in the branches array
                if (
                    checkAccountResponse.branches &&
                    checkAccountResponse.branches.includes(newBranchValue)
                ) {
                    throw new ReactionError("duplicate", "branch already assigned");

                    // throw new ReactionError("Duplicate Error", "branch already assigned");
                }
                // If the new value doesn't exist, update the branches array and return the new value
                const updateAccountResult = await Accounts.updateOne(
                    { _id: userID },
                    { $addToSet: { branches: newBranchValue } } // $addToSet only adds the value if it doesn't already exist
                );
                // console.log(updateAccountResult);
                if (updateAccountResult.modifiedCount !== 1) {
                    if (!updatedAccount)
                        throw new ReactionError(
                            "server-error",
                            "Unable to update Account, Try again later"
                        );

                    // throw new ReactionError("Failed", `Failed to update branch value to user: ${userID}`);
                }
                const updatedUser = await Accounts.findOne({ _id: userID });
                // console.log("updatedUser--->", updatedUser);
                return updatedUser;
            } else {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
        },
        async addBranchNotes(parent, args, context, info) {
            // console.log(args);
            const { orderId, Notes } = args;
            const { Orders } = context.collections;
            // console.log(orderId);
            const updateOrders = { $set: { Notes: Notes } };
            const options = { new: true };
            const updatedOrderResp = await Orders.findOneAndUpdate(
                { _id: orderId },
                updateOrders,
                options
            );
            // console.log("Update Order:- ", updatedOrderResp);
            if (updatedOrderResp.value) {
                return updatedOrderResp.value;
            } else {
                throw new ReactionError(
                    "server-error",
                    "Something went wrong , please try later"
                );
            }
        },
    },
    Query: {
        async getOrderById(parent, { id }, context, info) {
            // console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
            const { RiderOrder } = context.collections;
            if (id === null || id === undefined) {
                id = context.user.id;
            }
            const currentDate = new Date().toISOString().substr(0, 10); // get current date in ISO format (yyyy-mm-dd)

            const ordersresp = await RiderOrder.find({
                riderID: id,
                $or: [
                    { startTime: { $gte: currentDate } }, // include orders that start on or after the current date
                ],
            })
                .sort({ createdAt: -1 })
                .toArray();
            // console.log(ordersresp);

            // replace null createdAt with empty string
            ordersresp.forEach((order) => {
                if (order.createdAt === null || order.createdAt === undefined) {
                    order.createdAt = new Date(0);
                }
            });
            if (ordersresp) {
                return ordersresp;
            } else {
                return null;
            }
        },
        async getOrdersByStatus(parent, { OrderStatus }, context, info) {
            // console.log("context.user ", context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
            // console.log(OrderStatus);
            // console.log(context.user.id);
            const LoginUserID = context.user.id;
            const { RiderOrder, Orders } = context.collections;
            // Get Order by status
            const orders = await RiderOrder.find({
                OrderStatus: OrderStatus,
            })
                .sort({ createdAt: -1 })
                .toArray();
            // console.log(orders);

            if (orders) {
                // Current Login User Order
                const filteredOrders = orders.filter(
                    (order) => order.riderID === LoginUserID
                );
                // console.log("Filter Order: ", filteredOrders);
                // console.log("Filter Order ID: ", filteredOrders[0].OrderID);
                if (filteredOrders[0]) {
                    const kitchenOrderIDResp = await Orders.find({
                        _id: filteredOrders[0].OrderID,
                    }).sort({ createdAt: -1 }).toArray();
                    // console.log("kitchenOrderID: ", kitchenOrderIDResp);
                    if (kitchenOrderIDResp[0]) {
                        const ordersWithId = filteredOrders.map((order) => ({
                            id: order._id,
                            ...order,
                            kitchenOrderID: kitchenOrderIDResp[0]?.kitchenOrderID
                        }));
                        return ordersWithId;
                    }
                    else {
                        const ordersWithId = filteredOrders.map((order) => ({
                            id: order._id,
                            ...order,
                        }));
                        return ordersWithId;
                    }
                    // const OrderWithkitchenOrderID =
                    // console.log("Order with ID: ", ordersWithId);
                }
                else {
                    return null
                }


            } else {
                return null;
            }
        },
        async generateOrderReport(parent, args, context, info) {
            // console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
            const { RiderOrder, Users } = context.collections;
            const { id } = context.user;
            // console.log(id);

            // const { branches } = args;
            let match = {};
            if (args.riderID) {
                match.riderID = args.riderID;
            }
            if (args.branches) {
                match.branches = args.branches;
                // match["RiderOrder.branches"] = args.branches;
            }
            if (args.startDate && args.startDate !== undefined) {
                // console.log(args.startDate);
                match.startTime = { $gte: new Date(args.startDate) };
            }
            if (args.OrderID) {
                match.OrderID = args.OrderID;
            }
            if (args.endDate && args.endDate !== undefined) {
                // console.log(args.endDate);
                match.endTime = { $lte: new Date(args.endDate) };
            }
            // console.log(match);
            const report = await RiderOrder.aggregate([
                {
                    $match: match,
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "riderID",
                        foreignField: "_id",
                        as: "Rider",
                    },
                },
                {
                    $unwind: "$Rider",
                },
                {
                    $project: {
                        riderID: "$riderID",
                        riderName: {
                            $concat: ["$Rider.firstName", " ", "$Rider.lastName"],
                        },
                        branchCity: "$Rider.branchCity",
                        branches: "$branches",
                        OrderStatus: "$OrderStatus",
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
                        OrderID: "$OrderID",
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
                        startTime: -1,
                    },
                },
            ]).toArray();
            // console.log("FInal Order Report :- ", report);
            return report;
        },
        async getRiderOrdersByLoginRider(parent, args, context, info) {
            // console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
            // const today = new Date().toISOString().substr(0, 10);

            const { startDate, endDate, riderID } = args;
            const { RiderOrder } = context.collections;
            const { id } = context.user;
            // console.log(id);
            // const query = {};
            // if (riderID) {
            //     query.riderID = riderID;
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
            const orders = await RiderOrder.find({ riderID: riderID })
                .sort({ createdAt: -1 })
                .toArray();
            // console.log(orders);
            // get today's date
            const today = new Date().toISOString().substring(0, 10);
            // console.log(today);
            // filter data array to include only items with today's date in startTime
            const filteredData = orders.filter((item) => {
                if (!item.createdAt) {
                    return false;
                }
                const itemDate = item.createdAt.substring(0, 10);
                return itemDate === today;
            });
            // console.log(filteredData);
            return filteredData;
        },
        async getKitchenReport(parent, args, context, info) {
            const { startDate, endDate, branchID, OrderStatus } = args;

            if (context.user === undefined || context.user === null) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
            if (
                context.user.UserRole !== "admin" &&
                (!context.user.branches ||
                    (context.user.branches && !context.user.branches.includes(branchID)))
            ) {
                throw new ReactionError(
                    "conflict",
                    "Only admins or authorized branch users can access orders report"
                );
            }
            const { BranchData, Orders } = context.collections;
            const query = {};
            if (branchID) {
                query.branchID = branchID;
            }
            if (OrderStatus) {
                query["workflow.status"] = args.OrderStatus;
            }
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                query.createdAt = {
                    $gte: start,
                    $lte: end,
                };
            }
            // console.log("query:- ", query);
            const ordersResp = await Orders.find(query)
                .sort({ createdAt: -1 })
                .toArray();
            const ordersWithId = ordersResp.map((order) => ({
                id: order._id,
                ...order,
            }));
            // console.log("ordersWithId:- ", ordersWithId);
            return ordersWithId;
        },
        async getCustomerOrderbyID(parent, args, context, info) {
            if (context.user === undefined || context.user === null) {
                throw new ReactionError(
                    "access-denied",
                    "Unauthorized access. Please Login First"
                );
            }
            const { Orders } = context.collections;
            const { ID } = args;
            // console.log(decodeOpaqueId(ID).id)
            const CustomerOrderResp = await Orders.findOne({ _id: decodeOpaqueId(ID).id });
            // console.log(CustomerOrderResp)
            return CustomerOrderResp;
        }
    },
};
