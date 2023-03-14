import ObjectID from "mongodb";
export default {
    Mutation: {
        async createRiderOrder(parent, { orders }, context, info) {
            console.log(orders);
            console.log(context);
            const { RiderOrder, RiderOrderHistory } = context.collections;
            const CurrentRiderID = context.user.id;
            const ordersWithRiderId = orders.map((order) => ({
                ...order,
                LoginRiderID: CurrentRiderID,
            }));

            const existingOrders = await RiderOrder.find({
                RiderOrderID: { $in: ordersWithRiderId.map((o) => o.RiderOrderID) },
            }).toArray();

            if (existingOrders.length > 0) {
                // return "Order already Exist with same Rider ID"
                throw new Error("One or more orders already exist");
            }

            const insertedOrders = await RiderOrder.insertMany(ordersWithRiderId);
            console.log(insertedOrders.insertedIds);
            console.log(insertedOrders);
            const createdOrderIDs = {
                OrderID: insertedOrders.insertedIds,
                RiderID: CurrentRiderID,
            };
            await RiderOrderHistory.insertOne(createdOrderIDs);
            console.log(RiderOrderHistory);
            return insertedOrders.ops;
        },
        async updateRiderOrder(
            parent,
            { id, startTime, endTime, OrderStatus, RiderOrderID },
            context,
            info
        ) {
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
            const { users } = context.collections;
            console.log(args.status)
            console.log(context.user.id)
            const currentStatus = args.status
            const userID = context.user.id;
            if (!userID) {
                throw new Error('Please Login First');
            }
            const updatedUser = await users.findOneAndUpdate(
                { _id: userID },
                { $set: { currentStatus } },
                { returnOriginal: false }
            );
            console.log(updatedUser.value)
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
            const { RiderOrder } = context.collections;
            const ordersresp = await RiderOrder.find({ LoginRiderID: id }).toArray();
            console.log(ordersresp);
            if (ordersresp) {
                return ordersresp;
            } else {
                return null;
            }
        },
        async getOrdersByStatus(parent, { OrderStatus }, context, info) {
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
            const { RiderOrder, Users } = context.collections;
            const { id } = context.user;
            console.log(id);
            const report = await RiderOrder.aggregate([
                {
                    $match: { LoginRiderID: id },
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
                        startTime: { $toDate: "$startTime" },
                        endTime: { $toDate: "$endTime" },
                    },
                },
                {
                    $addFields: {
                        deliveryTime: {
                            $divide: [{ $subtract: ["$endTime", "$startTime"] }, 60000],
                        },

                        // deliveryTime: { $subtract: ['$endTime', '$startTime'] },
                    },
                },
            ]).toArray();

            console.log(report);
            return report;
        },
    },
};
