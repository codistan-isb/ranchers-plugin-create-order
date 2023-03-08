import ObjectID from "mongodb";
export default {
    Mutation: {
        async createRiderOrder(parent, { orders }, context, info) {
            console.log(orders)
            // console.log(context.user.id)
            const { RiderOrder, RiderOrderHistory } = context.collections;
            const CurrentRiderID = context.user.id;
            const ordersWithRiderId = orders.map((order) => ({
                ...order,
                LoginRiderID: CurrentRiderID,
            }));
            const insertedOrders = await RiderOrder.insertMany(ordersWithRiderId);
            console.log(insertedOrders.insertedIds)
            console.log(insertedOrders)
            const createdOrderIDs = {
                OrderID: insertedOrders.insertedIds,
                RiderID: CurrentRiderID,
            }
            await RiderOrderHistory.insertOne(createdOrderIDs);
            console.log(RiderOrderHistory);
            return insertedOrders.ops;
        },
        async updateRiderOrder(parent, { id, startTime, endTime, OrderStatus, RiderOrderID }, context, info) {
            const { RiderOrder } = context.collections;
            const filter = { _id: ObjectID.ObjectId(id) };
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
            const response = await RiderOrder.findOneAndUpdate(filter, { $set: update }, options);
            console.log(response)
            console.log(response.value)
            return {
                id: response.value._id,
                startTime: response.value.startTime,
                endTime: response.value.endTime,
                OrderStatus: response.value.OrderStatus,
                RiderOrderID: response.value.RiderOrderID,
            };
        },

    },
    Query: {
        async getOrderById(parent, { id }, context, info) {
            const { RiderOrder } = context.collections;
            const ordersresp = await RiderOrder.find({ LoginRiderID: id }).toArray();
            console.log(ordersresp)
            if (ordersresp) {
                return ordersresp
            } else {
                return null;
            }
        },
        async getOrdersByStatus(parent, { OrderStatus }, context, info) {
            console.log(OrderStatus)
            const { RiderOrder } = context.collections;
            const orders = await RiderOrder.find({ OrderStatus: OrderStatus }).toArray();
            console.log(orders)
            if (orders) {
                return orders.map(order => ({
                    id: order._id,
                    ...order
                }));
            } else {
                return null;
            }
        },
    },
}