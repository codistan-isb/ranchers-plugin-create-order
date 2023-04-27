import ReactionError from "@reactioncommerce/reaction-error";
export default async function updateOrderStatus(OrderData, Status, Orders) {
    // console.log(OrderData);
    // console.log(OrderData.OrderStatus);
    OrderData.map(async (order) => {
        // Note the use of async here
        // console.log(order.RiderID);
        const ordersFilter = { _id: order.RiderID };
        const options = { new: true }; // Return the updated document
        const updateOrders = { $set: { 'workflow.status': Status } };
        // Use find to get a cursor to the matching document
        const GetOrderData = await Orders.find({ _id: order.RiderID });
        // console.log("Get Order Data : ", GetOrderData)
        // Get the first document from the cursor
        const orderToUpdate = await GetOrderData.next();
        // console.log(orderToUpdate)
        if (!orderToUpdate) {
            throw new ReactionError(`No order found with ID = ${order.RiderID}`);


        }
        const updatedOrder = await Orders.findOneAndUpdate({ _id: order.RiderID }, updateOrders, options);
        // console.log(updatedOrder);
    });
}


