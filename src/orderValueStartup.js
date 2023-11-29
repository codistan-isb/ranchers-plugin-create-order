
import ObjectID from "mongodb";
// import sendOrderEmail from "./utils/sendOrderEmail.js";
import _ from "lodash";

export default function orderValueStartup(context) {
    const { appEvents, collections } = context;

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
    appEvents.on("afterCreatingRiderOrder", async ({ createdBy: userId, order, CustomerAccountID, CustomerOrder }) => {
        // console.log("order", order);
        // console.log("CustomerOrder", CustomerOrder);
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

    });
}
