
import ObjectID from "mongodb";
export default function ordersStartup(context) {
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
}
