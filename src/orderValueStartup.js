
import ObjectID from "mongodb";
import sendOrderEmail from "./utils/sendOrderEmail.js";
import _ from "lodash";

export default function orderValueStartup(context) {
    const { appEvents, collections } = context;
    const { Orders, RiderOrderHistory } = collections;
    appEvents.on("afterOrderTransfer", async ({ createdBy: userId, orderID, updatedOrder, transferTo, transferFrom }) => {
        console.log("here in app event");
        const { Orders, Accounts, BranchData } = collections;
        const account = await Accounts.findOne({
            branches: { $in: [transferTo] },
        });
        const branchData = await BranchData.findOne({
            _id: ObjectID.ObjectId(transferTo),
        });
        const message = `Order has been assigned to ${branchData?.name} branch and order id is ${updatedOrder?.kitchenOrderID}`;
        const appType = "customer";
        const appType1 = "admin";
        const id = account?._id;
        let OrderIDs = updatedOrder?.kitchenOrderI;
        const paymentIntentClientSecret =
            context.mutations.oneSignalCreateNotification(context, {
                message,
                id,
                appType,
                userId: id,
                orderID: OrderIDs,
            });
        const paymentIntentClientSecret1 =
            context.mutations.oneSignalCreateNotification(context, {
                message,
                id,
                appType: appType1,
                userId: id,
            });
    });
    appEvents.on("afterCreatingRiderOrder", async ({ createdBy, order, CustomerAccountID, CustomerOrder }) => {
        await RiderOrderHistory.insertOne(order);
        const customerMessage = "Your order is picked";
        const message = "Order has been assigned";
        const appType = "rider";
        let id = order?.riderID;
        let OrderIDs = order?.OrderID;
        context.mutations.oneSignalCreateNotification(context, {
            message,
            id,
            appType,
            userId: id,
        });
        if (CustomerAccountID) {
            context.mutations.oneSignalCreateNotification(context, {
                message: customerMessage,
                id: CustomerAccountID,
                appType: "customer",
                userId: CustomerAccountID,
                orderID: OrderIDs,
            });
        }
        sendOrderEmail(context, CustomerOrder, "pickedUp")
    });
    appEvents.on("afterUpdatingRiderOrder", async ({ createdBy, CustomerAccountID, CustomerOrder, updateOrders, OrderID, message, CurrentRiderID }) => {
        // console.log("createdBy", createdBy);
        // console.log("CustomerAccountID", CustomerAccountID);
        // console.log("CustomerOrder", CustomerOrder);
        // console.log("updateOrders", updateOrders);
        // console.log("OrderID", OrderID);
        // console.log("message", message);
        const options = { new: true };
        let updatedOrderResult = await Orders.findOneAndUpdate(
            { _id: OrderID },
            updateOrders,
            options
        );
        console.log("updatedOrderResult", updatedOrderResult);
        const appType = "admin";
        const appTypeCustomer = "customer";
        const id = CurrentRiderID;
        const userId = CurrentRiderID;
        const paymentIntentClientSecret =
            context.mutations.oneSignalCreateNotification(context, {
                message,
                id,
                appType,
                userId,
            });
        if (CustomerAccountID) {
            const paymentIntentClientSecret1 =
                context.mutations.oneSignalCreateNotification(context, {
                    message,
                    id: CustomerAccountID,
                    appType: appTypeCustomer,
                    userId: CustomerAccountID,
                    orderID: OrderID,
                });
        }
        sendOrderEmail(context, updatedOrderResult?.value, "delivered")
    });
}
