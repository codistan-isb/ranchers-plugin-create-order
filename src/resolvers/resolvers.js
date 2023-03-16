import ObjectID from "mongodb";
export default {
    Mutation: {
        async createRiderOrder(parent, { orders }, context, info) {
            console.log(orders);
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { RiderOrder, RiderOrderHistory, Accounts } = context.collections;
            const CurrentRiderID = context.user.id;
            const currentDate = new Date().toISOString().substr(0, 10);
            console.log(currentDate)
            const riderStatus = await Accounts.findOne({ _id: CurrentRiderID });
            if (riderStatus.currentStatus === "offline") {
                throw new Error("Rider is offline, cannot create order");
            }
            const ordersWithRiderId = orders.map((order) => ({
                ...order,
                LoginRiderID: CurrentRiderID,
            }));

            const existingOrders = await RiderOrder.find({
                RiderOrderID: { $in: ordersWithRiderId.map((o) => o.RiderOrderID) },
                branchname: { $in: ordersWithRiderId.map((o) => o.branchname) },
            }).toArray();
            console.log(existingOrders)
            if (existingOrders.length > 0) {
                throw new Error("One or more orders already exist for the same branch and day");

            }
            try {
                const insertedOrders = await RiderOrder.insertMany(ordersWithRiderId);
                console.log(insertedOrders.insertedIds);
                // console.log(insertedOrders);
                const createdOrderIDs = {
                    OrderID: insertedOrders.insertedIds,
                    RiderID: CurrentRiderID,
                };
                await RiderOrderHistory.insertOne(createdOrderIDs);
                console.log(RiderOrderHistory);
                return insertedOrders.ops;
            } catch (err) {
                if (err.code === 11000) {
                    throw new Error("Order Already Exists");
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
                throw new Error("Unauthorized access. Please login first");
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
                throw new Error("Unauthorized access. Please login first");
            }
            const { Accounts } = context.collections;
            console.log(args.status);
            console.log(context.user.id);
            const currentStatus = args.status;
            const userID = context.user.id;
            if (!userID) {
                throw new Error("Please Login First");
            }
            const updatedUser = await Accounts.findOneAndUpdate(
                { _id: userID },
                { $set: { currentStatus } },
                { returnOriginal: false }
            );
            console.log(updatedUser.value);
            if (!updatedUser) {
                throw new Error(`User with ID ${userID} not found`);
            }

            return updatedUser.value;
            //     const updatedUser = await users.findOneAndUpdate(
            //         { _id: ObjectID(userID) },
            //         { $set: { currentStatus: status } },
            //         { returnOriginal: false }
            //     );

            //     return updatedUser;
            // }
        },
    },
    Query: {
        async getOrderById(parent, { id }, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            const { RiderOrder } = context.collections;
            if (id === null || id === undefined) {
                id = context.user.id;
            }
            const currentDate = new Date().toISOString().substr(0, 10); // get current date in ISO format (yyyy-mm-dd)

            const ordersresp = await RiderOrder.find({
                LoginRiderID: id,
                $or: [
                    { startTime: { $gte: currentDate } }, // include orders that start on or after the current date
                ]
            }).sort({ startTime: 1 }).toArray();
            console.log(ordersresp);

            if (ordersresp) {
                return ordersresp;
            } else {
                return null;
            }
        },
        async getOrdersByStatus(parent, { OrderStatus }, context, info) {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            console.log(OrderStatus);
            console.log(context.user.id);
            const LoginUserID = context.user.id;
            const { RiderOrder } = context.collections;
            const orders = await RiderOrder.find({
                OrderStatus: OrderStatus,
            }).toArray();
            console.log(orders);
            if (orders) {
                const filteredOrders = orders.filter(
                    (order) => order.LoginRiderID === LoginUserID
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
                throw new Error("Unauthorized access. Please login first");
            }
            const { RiderOrder, Users } = context.collections;
            const { id } = context.user;
            console.log(id);
            console.log(args);
            // const { branchName } = args;
            let match = {};
            if (args.LoginRiderID) {
                match.LoginRiderID = args.LoginRiderID;
            }
            if (args.branchName) {
                match.branchname = args.branchName;
                // match["RiderOrder.branchname"] = args.branchName;
            }
            if (args.startDate) {
                match.startTime = { $gte: new Date(args.startDate) };
            }
            if (args.endDate) {
                match.endTime = { $lte: new Date(args.endDate) };
            }
            console.log(match)
            const report = await RiderOrder.aggregate([
                // {
                //     $match: {
                //         LoginRiderID: args.LoginRiderID,
                //         $or: [
                //             { "RiderOrder.branchname": { $eq: args.branchName } },
                //             { "RiderOrder.branchname": { $exists: false } },
                //         ],
                //         $or: [
                //             { startTime: { $gte: new Date(args.startDate) } },
                //             { startTime: { $exists: false } },
                //         ],
                //         $or: [
                //             { endTime: { $lte: new Date(args.endDate) } },
                //             { endTime: { $exists: false } },
                //         ],
                //     },
                // },
                {
                    $match: match
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
                        riderName: "$Rider.username",
                        branchCity: "$Rider.branchCity",
                        branchName: "$Rider.branchname",
                        orderStatus: "$OrderStatus",
                        username: "$username",
                        startTime: { $toDate: "$startTime" },
                        endTime: { $toDate: "$endTime" },
                    },
                },
                {
                    $addFields: {
                        deliveryTime: {
                            $divide: [{ $subtract: ["$endTime", "$startTime"] }, 60000],
                        },
                    },
                },
                // {
                //     $match: {
                // "Rider.branchname": args.branchName,
                // 
                //         ...(args.startTime && {
                //             startTime: { $gte: new Date(args.startTime) },
                //         }),
                //         ...(args.endTime && {
                //             endTime: { $lte: new Date(args.endTime) },
                //         }),
                //         // LoginRiderID: id,
                //     },
                // },
                {
                    $sort: {
                        startTime: 1,
                    },
                },
            ]).toArray();

            console.log(report);
            return report;
        },

        getRiderOrdersByLoginRider: async (parent, args, context, info) => {
            console.log(context.user);
            if (context.user === undefined || context.user === null) {
                throw new Error("Unauthorized access. Please login first");
            }
            // const today = new Date().toISOString().substr(0, 10);

            const { LoginRiderID } = args
            const { RiderOrder } = context.collections;
            const { id } = context.user;

            const orders = await RiderOrder.find({
                LoginRiderID: LoginRiderID,

            }).toArray();
            console.log(orders)
            // get today's date
            const today = new Date().toISOString().substring(0, 10);

            // filter data array to include only items with today's date in startTime
            const filteredData = orders.filter(item => {
                const itemDate = item.startTime.substring(0, 10);
                return itemDate === today;
            });
            console.log(filteredData);
            return filteredData
        }

    },
};
