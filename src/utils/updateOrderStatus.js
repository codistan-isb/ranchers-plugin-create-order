import ReactionError from "@reactioncommerce/reaction-error";
export default async function updateOrderStatus(OrderData, Status, Orders) {
    console.log(OrderData);
    console.log(Status);
    OrderData.map(async (order) => {
        // Note the use of async here
        console.log(order.RiderOrderID);
        const ordersFilter = { _id: order.RiderOrderID };
        const options = { new: true }; // Return the updated document
        const updateOrders = { $set: { 'workflow.status': Status } };
        // Use find to get a cursor to the matching document
        const GetOrderData = await Orders.find({ _id: order.RiderOrderID });
        console.log(GetOrderData)
        // Get the first document from the cursor
        const orderToUpdate = await GetOrderData.next();
        console.log(orderToUpdate)
        if (!orderToUpdate) {
            throw new ReactionError(`No order found with ID = ${order.RiderOrderID}`);


        }
        const updatedOrder = await Orders.findOneAndUpdate({ _id: order.RiderOrderID }, updateOrders, options);
        console.log(updatedOrder);
    });
}


