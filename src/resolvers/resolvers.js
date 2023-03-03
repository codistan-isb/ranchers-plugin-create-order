import ObjectID from "mongodb";
export default {
    Mutation: {
        async createRiderOrder(parent, { orders }, context, info) {
            // console.log(context.user)
            // console.log(context.user.id)
            const { RiderOrder, RiderOrderHistory } = context.collections;
            const CurrentRiderID = context.user.id;
            const insertedOrders = await RiderOrder.insertMany(orders);
            console.log(insertedOrders.insertedIds)
            console.log(insertedOrders)
            const insertedOrderIds = insertedOrders.insertedIds;
            const createdOrderIDs = {
                OrderID: insertedOrders.insertedIds,
                RiderID: CurrentRiderID,
            }
            await RiderOrderHistory.insertOne(createdOrderIDs);
            console.log(RiderOrderHistory);
            return insertedOrders.ops;
        },
        async updateRiderOrder(parent, { id, startTime, endTime, status }, context, info) {
            const { RiderOrder } = context.collections;
            const filter = { _id: ObjectID.ObjectId(id) };
            const update = {};
            if (startTime) {
                update.startTime = startTime;
            }
            if (endTime) {
                update.endTime = endTime;
            }
            if (status) {
                update.status = status;
            }
            const options = { returnOriginal: false };
            const response = await RiderOrder.findOneAndUpdate(filter, { $set: update }, options);
            console.log(response)
            console.log(response.value)
            return {
                id: response.value._id,
                startTime: response.value.startTime,
                endTime: response.value.endTime,
                status: response.value.status,
            };
        },
    },
    Query: {
        async getOrderById(parent, { id }, context, info) {
            const { RiderOrder } = context.collections;
            const order = await RiderOrder.findOne({ _id: ObjectID.ObjectId(id) });
            console.log(order)
            if (order) {
                return { id, ...order };
            } else {
                return null;
            }
        },
    },
}