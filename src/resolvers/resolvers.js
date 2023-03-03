export default {
    Mutation: {
        createOrder: async (_, { startTime, endTime, status }) => {
            console.log("start Time" + startTime)
            console.log("End Time" + endTime)
            console.log("status " + status)
            const order = { startTime, endTime, status };
            let { RiderOrder } = context.collections;
            const result = await RiderOrder.insertOne(order);
            console.log("result " + result)
            const newOrder = { id: result.insertedId, ...order };
            return newOrder;
        },
    },
}