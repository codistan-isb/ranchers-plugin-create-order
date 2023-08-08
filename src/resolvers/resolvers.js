import ObjectID from "mongodb";
import Random from "@reactioncommerce/random";
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";
import ReactionError from "@reactioncommerce/reaction-error";
import { decodeOrderOpaqueId } from "../xforms/id.js";
import getPaginatedResponse from "@reactioncommerce/api-utils/graphql/getPaginatedResponse.js";
import wasFieldRequested from "@reactioncommerce/api-utils/graphql/wasFieldRequested.js";
import executeCronJob from "../utils/executeCronJob.js";
export default {
  Order: {
    async branchInfo(parent, args, context, info) {
      // console.log("parent", parent)
      const BranchID = parent.branchID;
      // console.log("BranchID:- ", BranchID)
      if (BranchID) {
        const { BranchData } = context.collections;
        const branchDataResponse = await BranchData.findOne({
          _id: ObjectID.ObjectId(BranchID),
        });
        // console.log("Branch Data : ", branchDataResponse)
        return branchDataResponse;
      } else {
        return [];
      }
    },
    async riderInfo(parent, args, context, info) {
      // console.log("parent", parent);
      const { RiderOrder, Accounts } = context.collections;
      const id = parent.id || parent._id;
      // console.log("OrderID:- ", id);
      let OrderIDArray = [];
      if (id) {
        const RiderOrderResponse = await RiderOrder.find({
          OrderID: id,
        }).toArray();
        if (RiderOrderResponse[0] !== undefined) {
          // console.log("rider ID Data : ", RiderOrderResponse[0].riderID);
          const RiderDataResponse = await Accounts.find({
            _id: RiderOrderResponse[0].riderID,
          }).toArray();
          // console.log("RiderDataResponse Data : ", RiderDataResponse[0]);
          return RiderDataResponse[0];
        }
      } else {
        return [];
      }
    },
    async customerInfo(parent, args, context, info) {
      // console.log("parent ", parent);
      if (parent.OrderID) {
        const { Orders } = context.collections;
        const orderInfoResponse = await Orders.findOne({
          _id: parent.OrderID,
        });
        // console.log("orderI/nfoResponse: ", orderInfoResponse)
        if (orderInfoResponse) {
          return orderInfoResponse.shipping[0].address;
          // return orderInfoResponse[0].shipping[0].address
        } else {
          return null;
        }
      } else {
        if (parent._id) {
          return parent.shipping[0].address;
        } else {
          return null;
        }
      }
    },
    async customerOrderTime(parent, args, context, info) {
      console.log("Parent ", parent);
      const { Orders } = context.collections;
      const customerOrderTimeResp = await Orders.findOne({
        _id: parent.OrderID,
      });
      console.log("Customer Resp ", customerOrderTimeResp);
      if (customerOrderTimeResp) {
        return {
          customerOrderTime: customerOrderTimeResp.createdAt,
          Latitude: customerOrderTimeResp.Latitude,
          Longitude: customerOrderTimeResp.Longitude,
        };
      } else {
        return null;
      }
    },
    async branchTimePickup(parent, args, context, info) {
      // console.log("parent data", parent);
      // console.log("parent data with OrderID", parent.OrderID);
      // console.log("branch riderID ", parent.riderID);
      const { RiderOrder } = context.collections;

      if (parent.riderID) {
        // const branchTimePickupResp = await RiderOrder.findOne({
        //   riderID: parent.riderID,
        //   where: {
        //     OrderID: parent.OrderID,
        //   },
        // });
        const branchTimePickupResp = await RiderOrder.findOne({
          riderID: parent.riderID,
          OrderID: parent.OrderID,
        });
        // console.log("branchTimePickupResp ", branchTimePickupResp)
        if (branchTimePickupResp) {
          return {
            branchOrderTime: branchTimePickupResp.createdAt,
          };
        } else {
          return null;
        }
      } else {
        // console.log(parent._id)
        const branchTimePickupResp = await RiderOrder.findOne({
          OrderID: parent._id,
        });

        if (branchTimePickupResp) {
          // console.log("Data ", branchTimePickupResp);
          // console.log("Data TIme ", branchTimePickupResp.createdAt);
          return {
            branchOrderTime: branchTimePickupResp.createdAt,
          };
        } else {
          return null;
        }
      }
    },
    async kitchenOrderIDInfo(parent, args, context, info) {
      // console.log("Parent ", parent.OrderID);
      const { Orders } = context.collections;
      const kitchenOrderIDResp = await Orders.findOne({ _id: parent.OrderID });
      // console.log("kitchenOrderIDResp  ", kitchenOrderIDResp);
      if (kitchenOrderIDResp) {
        return {
          kitchenOrderID: kitchenOrderIDResp.kitchenOrderID,
        };
      } else {
        return null;
      }
    },
    async riderOrderInfo(parent, args, context, info) {
      console.log("Parent riderOrderInfo : ", parent);
      const { RiderOrder } = context.collections;
      if (parent.id) {
        const riderOrderInfoResp = await RiderOrder.findOne({
          OrderID: parent.id,
        });
        // console.log("riderOrderInfoResp ", riderOrderInfoResp);
        if (riderOrderInfoResp) {
          return riderOrderInfoResp;
        } else {
          return null;
        }
      } else {
        let id = decodeOpaqueId(parent._id);
        const riderOrderInfoResp = await RiderOrder.findOne({
          OrderID: parent._id,
        });
        console.log("riderOrderInfoResp : ", riderOrderInfoResp);
        if (riderOrderInfoResp) {
          return riderOrderInfoResp;
        } else {
          return null;
        }
      }
    },
    async orderIdResolver(parent, args, context, info) {
      console.log("Parent orderIdResolver ", parent);
      if (parent) {
        return { orderId: parent?._id };
      } else {
        return null;
      }
    },
  },
  OrderReport: {
    async branchInfo(parent, args, context, info) {
      // console.log("parent", parent);
      const BranchID = parent.branches;
      // console.log("BranchID:- ", BranchID);
      if (BranchID) {
        const { BranchData } = context.collections;
        const branchDataResponse = await BranchData.find({
          _id: ObjectID.ObjectId(BranchID),
        }).toArray();
        // console.log("Branch Data : ", branchDataResponse[0]);
        return branchDataResponse[0];
      } else {
        return [];
      }
    },
    async customerInfo(parent, args, context, info) {
      // console.log("par/ent ", parent);
      if (parent.OrderID) {
        const { Orders } = context.collections;
        const orderInfoResponse = await Orders.findOne({
          _id: parent.OrderID,
        });
        // console.log("orderI/nfoResponse: ", orderInfoResponse)
        if (orderInfoResponse) {
          return orderInfoResponse.shipping[0].address;
          // return orderInfoResponse[0].shipping[0].address
        } else {
          return null;
        }
      } else {
        if (parent._id) {
          return parent.shipping[0].address;
        } else {
          return null;
        }
      }
    },
    async kitchenOrderIDInfo(parent, args, context, info) {
      // console.log("Parent ", parent.OrderID);
      const { Orders } = context.collections;
      if (parent.OrderID) {
        const kitchenOrderIDResp = await Orders.findOne({
          _id: parent.OrderID,
        });
        // console.log("Customer Resp ", kitchenOrderIDResp.kitchenOrderID)
        if (kitchenOrderIDResp) {
          return {
            kitchenOrderID: kitchenOrderIDResp.kitchenOrderID,
          };
        } else {
          return null;
        }
      }
    },
    async riderInfo(parent, args, context, info) {
      // console.log("parent.riderID", parent.riderID);
      // console.log("parent", parent);
      const { RiderOrder, Accounts } = context.collections;
      const { riderID } = parent;
      const RiderInfoResp = await Accounts.findOne({ _id: riderID });
      // console.log("Rider Info Resp : ", RiderInfoResp);
      return RiderInfoResp;
      // console.log("OrderID:- ", id);
      // if (riderID) {

      //   const RiderOrderResponse = await RiderOrder.find({
      //     OrderID: id,
      //   }).toArray();
      //   if (RiderOrderResponse[0] !== undefined) {
      //     // console.log("rider ID Data : ", RiderOrderResponse[0].riderID);
      //     const RiderDataResponse = await Accounts.find({
      //       _id: RiderOrderResponse[0].riderID,
      //     }).toArray();
      //     console.log("RiderDataResponse Data : ", RiderDataResponse[0]);
      //     return RiderDataResponse[0];
      //   }
      // } else {
      //   return [];
      // }
    },
    async orderDetailTime(parent, args, context, info) {
      // console.log("parent ", parent);
      const { Orders } = context.collections;
      const { OrderID } = parent;
      if (OrderID) {
        const orderDetailResp = await Orders.findOne({ _id: OrderID });
        // console.log("Order Info ", orderDetailResp);
        if (orderDetailResp) {
          return {
            prepTime: orderDetailResp?.prepTime || 20,
            deliveryTime: orderDetailResp?.deliveryTime || null,
          };
        } else {
          return null;
        }
      }
    },
    async orderInfo(parent, args, context, info) {
      const { Orders } = context.collections;
      // console.log("parent of order report ", parent);
      if (parent?.OrderID) {
        const orderInfoResp = await Orders.findOne({
          _id: parent?.OrderID,
        });
        if (orderInfoResp) {
          return orderInfoResp;
        } else {
          return null;
        }
      }
    },
  },
  Mutation: {
    async createRiderMultipleOrder(parent, { orders }, context, info) {
      console.log("orders ", orders);
      const now = new Date();
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { RiderOrder, Accounts, Orders, RiderOrderHistory } =
        context.collections;
      const CurrentRiderID = context?.user?.id;
      const AllOrdersArray = orders;

      const RiderIDForAssign1 = orders.map((order) => {
        const riderId = order.riderID ? order.riderID : CurrentRiderID;
        return {
          ...order,
          riderID: riderId,
          createdAt: now,
        };
      });
      // console.log("RiderIDForAssign1 ", RiderIDForAssign1);
      const riderID = RiderIDForAssign1[0].riderID;

      const existingOrders1 = await RiderOrder.find({
        riderID: riderID,
        OrderStatus: { $ne: "delivered" },
      }).toArray();
      if (existingOrders1.length >= 1) {
        throw new ReactionError(
          "not-allowed",
          "Cannot assign new orders. Complete previous order first."
        );
      }
      const insertedOrders = [];
      for (const order of orders) {
        const CustomerOrder = await Orders.findOne({ _id: order.OrderID });
        // console.log("CustomerOrder ", CustomerOrder);

        let CustomerAccountID = "";
        if (CustomerOrder) {
          CustomerAccountID = CustomerOrder?.accountId;
        }
        // console.log("CustomerAccountID", CustomerAccountID);

        const RiderIDForAssign = {
          ...order,
          riderID: order.riderID ? order.riderID : CurrentRiderID,
          createdAt: now,
        };
        // console.log("RiderIDForAssign ", RiderIDForAssign);

        const riderStatus = await Accounts.findOne({
          _id: RiderIDForAssign.riderID,
        });
        // console.log("Status of Rider : ", riderStatus);

        if (riderStatus && riderStatus.currentStatus === "offline") {
          throw new ReactionError(
            "not-found",
            "Rider is offline, cannot create order"
          );
        }

        const existingRiderOrder = await RiderOrder.findOne({
          OrderID: RiderIDForAssign.OrderID,
        });
        // console.log("existingRiderOrder:- ", existingRiderOrder);

        if (existingRiderOrder) {
          // if (existingRiderOrder.riderID !== RiderIDForAssign.riderID) {
          const updatedOrder = await RiderOrder.findOneAndUpdate(
            { _id: existingRiderOrder._id },
            {
              $set: {
                riderID: RiderIDForAssign.riderID,
                branches: RiderIDForAssign.branches,
                OrderID: RiderIDForAssign.OrderID,
                OrderStatus: RiderIDForAssign.OrderStatus,
                startTime: RiderIDForAssign.startTime,
              },
            },
            { new: true }
          );
          const createdOrderIDs = {
            OrderID: RiderIDForAssign.OrderID,
            RiderID: RiderIDForAssign.riderID,
            branches: RiderIDForAssign.branches,
            createdAt: new Date(),
          };
          await RiderOrderHistory.insertOne(createdOrderIDs);

          const message = "Order has been assigned";
          const appType = "rider";
          const id = RiderIDForAssign.riderID;
          let OrderIDs = RiderIDForAssign.OrderID;
          const paymentIntentClientSecret =
            context.mutations.oneSignalCreateNotification(context, {
              message,
              id,
              appType,
              userId: id,
            });
          if (CustomerAccountID) {
            const paymentIntentClientSecret1 =
              context.mutations.oneSignalCreateNotification(context, {
                message,
                id: CustomerAccountID,
                appType: "customer",
                userId: CustomerAccountID,
                orderID: OrderIDs,
              });
          }
          if (updatedOrder) {
            insertedOrders.push(updatedOrder.value);
          }
          // } else {
          //   throw new ReactionError(
          //     "duplicate",
          //     "One or more orders already exist for the same branch and day"
          //   );
          // }
        } else {
          try {
            const insertedOrder = await RiderOrder.insertOne(RiderIDForAssign);
            const createdOrderIDs = {
              OrderID: RiderIDForAssign.OrderID,
              RiderID: RiderIDForAssign.riderID,
              branches: RiderIDForAssign.branches,
              createdAt: new Date(),
            };
            await RiderOrderHistory.insertOne(createdOrderIDs);

            const message = "Order has been assigned";
            const appType = "rider";
            const id = RiderIDForAssign.riderID;
            const paymentIntentClientSecret =
              context.mutations.oneSignalCreateNotification(context, {
                message,
                id,
                appType,
                userId: id,
              });
            if (CustomerAccountID) {
              const paymentIntentClientSecret1 =
                context.mutations.oneSignalCreateNotification(context, {
                  message,
                  id: CustomerAccountID,
                  appType: "customer",
                  userId: CustomerAccountID,
                  orderID: RiderIDForAssign.OrderID,
                });
            }
            insertedOrders.push(insertedOrder.ops[0]);
          } catch (err) {
            if (err.code === 11000) {
              throw new ReactionError("duplicate", "Order Already Exists");
            }
            throw err;
          }
        }
      }

      return insertedOrders;
    },
    async createRiderOrder(parent, { orders }, context, info) {
      console.log("orders ", orders);
      const now = new Date();
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      // console.log("Hello");
      const AllOrdersArray = orders;
      const { RiderOrder, Accounts, Orders, RiderOrderHistory } =
        context.collections;
      const CurrentRiderID = context.user.id;
      const CustomerOrder = await Orders.findOne({ _id: orders[0].OrderID });
      console.log("CustomerOrder ", CustomerOrder);
      let CustomerAccountID = "";
      if (CustomerOrder) {
        CustomerAccountID = CustomerOrder?.accountId;
      }
      console.log("CustomerAccountID", CustomerAccountID);
      const RiderIDForAssign = orders.map((order) => {
        const riderId = order.riderID ? order.riderID : CurrentRiderID;
        return {
          ...order,
          riderID: riderId,
          createdAt: now,
        };
      });
      console.log("RiderIDForAssign ", RiderIDForAssign);
      const riderStatus = await Accounts.findOne({ _id: RiderIDForAssign });
      console.log("Status of Rider : ", riderStatus);
      if (riderStatus && riderStatus.currentStatus === "offline") {
        throw new ReactionError(
          "not-found",
          "Rider is offline, cannot create order"
        );
      }
      const existingRiderOrders = await RiderOrder.find({
        OrderID: { $in: RiderIDForAssign.map((o) => o.OrderID) },
      }).toArray();
      console.log("existingRiderOrders:- ", existingRiderOrders);
      if (existingRiderOrders.length > 0) {
        if (existingRiderOrders[0].riderID !== RiderIDForAssign[0].riderID) {
          // const insertedOrders1 = await RiderOrder.insertOne(RiderIDForAssign[0]);
          const update = {};
          // if (existingRiderOrders[0].startTime) {
          //     update.startTime = existingRiderOrders[0].startTime;
          // }
          const insertedOrders1 = await RiderOrder.findOneAndUpdate(
            { _id: existingRiderOrders[0]._id },
            // { $set: { riderID: RiderIDForAssign[0].riderID } },
            {
              $set: {
                riderID: RiderIDForAssign[0].riderID,
                branches: RiderIDForAssign[0].branches,
                OrderID: RiderIDForAssign[0].OrderID,
                OrderStatus: RiderIDForAssign[0].OrderStatus,
                startTime: RiderIDForAssign[0].startTime,
              },
            },
            { new: true }
          );
          const createdOrderIDs = {
            OrderID: RiderIDForAssign[0].OrderID,
            RiderID: RiderIDForAssign[0].riderID,
            branches: RiderIDForAssign[0].branches,
            createdAt: new Date(),
          };
          await RiderOrderHistory.insertOne(createdOrderIDs);
          // console.log("insertedOrders1:- ", insertedOrders1);
          const message = "Order has been assigned";
          const appType = "rider";
          const appType1 = "customer";
          const id = RiderIDForAssign[0].riderID;
          let OrderIDs = RiderIDForAssign[0].OrderID;
          const paymentIntentClientSecret =
            context.mutations.oneSignalCreateNotification(context, {
              message,
              id,
              appType,
              userId: id,
            });
          // console.log("context Mutation: rider 1 ", paymentIntentClientSecret);
          if (CustomerAccountID) {
            const paymentIntentClientSecret1 =
              context.mutations.oneSignalCreateNotification(context, {
                message,
                id: CustomerAccountID,
                appType: appType1,
                userId: CustomerAccountID,
                orderID: OrderIDs,
              });
            // console.log("context Mutation: client 1 ", paymentIntentClientSecret1);
          }
          if (insertedOrders1) {
            return insertedOrders1.value;
          } else {
            // console.log("else part uper")
            try {
              const insertedOrders = await RiderOrder.insertMany(
                RiderIDForAssign
              );

              // console.log("here");
              // console.log("inserted Data:- ", insertedOrders[0])
              // console.log(AllOrdersArray);
              // console.log("Order ID:- ", AllOrdersArray[0].OrderID);
              if (insertedOrders) {
                const message = "Order has been assigned";
                const customerMessage = "Your order is picked";
                const appType = "rider";
                const id = RiderIDForAssign[0].riderID;
                const appType1 = "customer";
                let OrderIDs = RiderIDForAssign[0].OrderID;
                const paymentIntentClientSecret =
                  context.mutations.oneSignalCreateNotification(context, {
                    message,
                    id,
                    appType,
                    id,
                  });
                // console.log("context Mutation: ", paymentIntentClientSecret);
                if (CustomerAccountID) {
                  const paymentIntentClientSecret1 =
                    context.mutations.oneSignalCreateNotification(context, {
                      message: customerMessage,
                      id: CustomerAccountID,
                      appType: appType1,
                      userId: CustomerAccountID,
                      orderID: OrderIDs,
                    });
                  // console.log("context Mutation: ", paymentIntentClientSecret1);

                  const updateOrders = {
                    $set: { "workflow.status": "pickedUp" },
                  };
                  const options = { new: true };
                  const updatedOrder = await Orders.findOneAndUpdate(
                    { _id: AllOrdersArray[0].OrderID },
                    updateOrders,
                    options
                  );
                  // console.log("updated Order:- ", updatedOrder);
                }
              }
              // (AllOrdersArray[0].OrderID, "pickedUp", Orders);
              return insertedOrders.ops;
            } catch (err) {
              if (err.code === 11000) {
                throw new ReactionError("duplicate", "Order Already Exists");

                // throw new ReactionError("Order Already Exists");
              }
              throw err;
            }
          }
        } else {
          throw new ReactionError(
            "duplicate",
            "One or more orders already exist for the same branch and day"
          );
        }
      } else {
        // console.log("else 2 part")
        try {
          const insertedOrders = await RiderOrder.insertMany(RiderIDForAssign);
          const createdOrderIDs = {
            OrderID: RiderIDForAssign[0].OrderID,
            RiderID: RiderIDForAssign[0].riderID,
            branches: RiderIDForAssign[0].branches,
            createdAt: new Date(),
          };
          await RiderOrderHistory.insertOne(createdOrderIDs);
          // console.log(insertedOrders.insertedIds);
          // console.log("inserted Data:- ", insertedOrders)
          // console.log(AllOrdersArray);
          // console.log("Order ID:- ", AllOrdersArray[0].OrderID);
          // console.log("RiderIDForAssign ", RiderIDForAssign[0]);
          if (insertedOrders) {
            const message = "Order has been assigned";
            const customerMessage = "Your order is picked";
            const appType = "rider";
            const id = RiderIDForAssign[0].riderID;
            const userId = RiderIDForAssign[0].riderID;
            const appType1 = "customer";
            let OrderIDs = RiderIDForAssign[0].OrderID;
            // const paymentIntentClientSecret =
            context.mutations.oneSignalCreateNotification(context, {
              message,
              id,
              appType,
              userId,
            });
            // console.log("context Mutation: ", paymentIntentClientSecret);
            if (CustomerAccountID) {
              // const paymentIntentClientSecret1 =
              context.mutations.oneSignalCreateNotification(context, {
                message: customerMessage,
                id: CustomerAccountID,
                appType: appType1,
                userId: CustomerAccountID,
                orderID: OrderIDs,
              });
              // console.log("context Mutation: ", paymentIntentClientSecret1);

              const updateOrders = { $set: { "workflow.status": "pickedUp" } };
              const options = { new: false };
              const updatedOrder = await Orders.findOneAndUpdate(
                { _id: AllOrdersArray[0].OrderID },
                updateOrders,
                options
              );
              // console.log("updated Order:- ", updatedOrder);
            }
          }
          // updateOrderStatus(AllOrdersArray[0].OrderID, "pickedUp", Orders);
          return insertedOrders.ops[0];
        } catch (err) {
          if (err.code === 11000) {
            throw new ReactionError("duplicate", "Order Already Exists");

            // throw new ReactionError("Order Already Exists");
          }
          throw err;
        }
      }
      // }
      // else{
      //   // console.log("Else pate")
      //   return orders[0];
      // }
      // const existingOrders = await RiderOrder.find({
      //     OrderID: { $in: RiderIDForAssign.map((o) => o.OrderID) },
      //     branches: { $in: RiderIDForAssign.map((o) => o.branches) },
      //     createdAt: {
      //         $gte: todayStart,
      //         $lte: todayEnd,
      //     },
      // }).toArray();
      // console.log("existingOrders :", existingOrders);
      // if (existingOrders.length > 0) {
      //     throw new ReactionError("duplicate", "One or more orders already exist for the same branch and day");
      // }
      // try {
      //     const insertedOrders = await RiderOrder.insertMany(RiderIDForAssign);
      //     console.log(insertedOrders.insertedIds);
      //     console.log(AllOrdersArray);
      //     console.log("Order ID:- ", AllOrdersArray[0].OrderID);
      //     if (insertedOrders) {
      //         const updateOrders = { $set: { "workflow.status": "pickedUp" } };
      //         const options = { new: true };
      //         const updatedOrder = await Orders.findOneAndUpdate(
      //             { _id: AllOrdersArray[0].OrderID },
      //             updateOrders,
      //             options
      //         );
      //         console.log("updated Order:- ", updatedOrder);
      //     }
      //     // updateOrderStatus(AllOrdersArray[0].OrderID, "pickedUp", Orders);
      //     return insertedOrders.ops;
      // } catch (err) {
      //     if (err.code === 11000) {
      //         throw new ReactionError("duplicate", "Order Already Exists");

      //         // throw new ReactionError("Order Already Exists");
      //     }
      //     throw err;
      // }
    },
    async updateRiderOrder(
      parent,
      { id, startTime, endTime, OrderStatus, OrderID, rejectionReason },
      context,
      info
    ) {
      // console.log(context.user);
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      // console.log("start ", startTime);
      // console.log("end ", endTime);
      // const now = new Date();
      const CurrentRiderID = context.user.id;
      // console.log(OrderID);
      const { RiderOrder, Orders, CronJobs } = context.collections;
      const filter = { OrderID: OrderID };
      const CustomerOrder = await Orders.findOne({ _id: OrderID });
      // console.log(CustomerOrder);
      let CustomerAccountID = "";
      if (CustomerOrder) {
        CustomerAccountID = CustomerOrder?.accountId;
      }
      // console.log("CustomerOrder", CustomerAccountID);
      const update = {};

      if (rejectionReason) {
        update.rejectionReason = rejectionReason;
      }
      if (startTime) {
        update.startTime = startTime;
      }
      if (endTime) {
        update.endTime = endTime;
        const getStartTimeResp = await RiderOrder.findOne({ OrderID: OrderID });
        // console.log(getStartTimeResp.startTime);
        if (getStartTimeResp) {
          // const deliveryTime = 0.00;
          const startFinalTime = new Date(getStartTimeResp.startTime);
          const endFinalTime = new Date(endTime);
          const timeDiff = endFinalTime.getTime() - startFinalTime.getTime();
          // timeDiff is in milliseconds, convert to seconds
          const minutes = timeDiff / 60000;
          // console.log("minutes ", minutes.toFixed(2));
          // deliveryTime = minutes
          // console.log("minutes ", typeof (parseFloat(minutes)));
          update.deliveryTime = parseFloat(minutes.toFixed(2));
        }
      }
      if (OrderStatus) {
        let message = "";
        if (OrderStatus === "canceled") {
          message = `Order is ${OrderStatus} and reason is ${rejectionReason}`;
        } else {
          message = `Order is ${OrderStatus}`;
        }
        if (OrderStatus === "delivered") {
          let cronJobObject = {
            _id: Random.id(),
            userId: CustomerAccountID,
            orderId: OrderID,
            createdAt: new Date(),
            type: "orderFeedback",
            status: "delivered",
          };
          const cronjobResp = await CronJobs.insertOne(cronJobObject);
          // console.log("cronjobResp ", cronjobResp);
          const cornJobResp = executeCronJob(context);
        }
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
        // console.log("context Mutation: ", paymentIntentClientSecret);
        if (CustomerAccountID) {
          const paymentIntentClientSecret1 =
            context.mutations.oneSignalCreateNotification(context, {
              message,
              id: CustomerAccountID,
              appType: appTypeCustomer,
              userId: CustomerAccountID,
              orderID: OrderID,
            });
          // console.log(
          //   " Customer Order context Mutation: ",
          //   paymentIntentClientSecret1
          // );
        }
        update.OrderStatus = OrderStatus;
        let updateOrders = {};
        if (rejectionReason) {
          updateOrders = {
            $set: {
              "workflow.status": OrderStatus,
              rejectionReason: rejectionReason,
              updatedAt: new Date(),
            },
          };
        } else {
          updateOrders = {
            $set: { "workflow.status": OrderStatus, updatedAt: new Date() },
          };
        }
        const options = { new: true };
        const updatedOrder = await Orders.findOneAndUpdate(
          { _id: OrderID },
          updateOrders,
          options
        );
        // console.log("updatedOrder ", updatedOrder.value.accountId);
      }
      if (OrderStatus === "ready") {
        const updatedBranch = {
          prepTime: 0, // add prepTime field here
          updatedAt: new Date().toISOString(),
        };
        const message = "Order is Ready";
        const appType = "admin";
        const appTypecustomer = "customer";
        const id = userId;
        // const orderID = orderId;
        const paymentIntentClientSecret =
          context.mutations.oneSignalCreateNotification(context, {
            message,
            id,
            appType,
            userId,
            // orderID,
          });
        if (CustomerAccountID) {
          const paymentIntentClientSecret1 =
            context.mutations.oneSignalCreateNotification(context, {
              message,
              id: CustomerAccountID,
              appType: appTypecustomer,
              userId: CustomerAccountID,
              orderID: OrderID,
            });
          // console.log(
          //   " Customer Order context Mutation: ",
          //   paymentIntentClientSecret1
          // );
        }
        // console.log("context Mutation: ", paymentIntentClientSecret);
        // const UpdatedBranchDataResp = await BranchData.updateOne({ _id: branch._id }, { $set: updatedBranch });
        // console.log(UpdatedBranchDataResp)
      }
      if (OrderID) {
        update.OrderID = OrderID;
      }
      console.log("Update ", update);
      const options = { new: true };
      const response = await RiderOrder.findOneAndUpdate(
        filter,
        { $set: update },
        options
      );

      // console.log("response from updated order", response);
      // console.log(response.value);
      if (response) {
        const updatedOrderResp = await RiderOrder.findOne({
          OrderID: OrderID,
        });
        console.log("updated Order Resp", updatedOrderResp);
        // return updatedOrderResp;
        if (updatedOrderResp) {
          return {
            id: updatedOrderResp._id,
            ...updatedOrderResp,
            // startTime:updatedOrderResp.startTime,
            // endTime: updatedOrderResp.endTime,
            // OrderStatus: updatedOrderResp.OrderStatus,
            // OrderID: updatedOrderResp.OrderID,
            // riderID: updatedOrderResp.riderID,
            // rejectionReason: updatedOrderResp.rejectionReason,
          };
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
    async updateUserCurrentStatus(parent, args, context, info) {
      // console.log(context.user);
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      const { Accounts } = context.collections;
      // console.log(args.status);
      // console.log(context.user);
      const currentStatus = args.status;
      // const now = new Date();
      const userID = context.user.id;
      if (!userID) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      // const accountUser = await Accounts.findOne({
      //   _id: userID,
      // });
      // console.log("accountUser ", accountUser);
      const updatedUser = await Accounts.findOneAndUpdate(
        { _id: userID },
        { $set: { currentStatus, updatedAt: new Date() } },
        // { $set: { currentStatus } },
        { returnOriginal: false }
      );
      // console.log(updatedUser);
      if (!updatedUser) {
        throw new ReactionError(
          "not-found",
          `User with ID ${userID} not found`
        );
      }

      return updatedUser.value;
    },
    async assignBranchtoUser(parent, args, context, info) {
      // console.log(args);
      // console.log(context.collections);
      // console.log(context.user);

      if (
        context.user === undefined ||
        context.user === null ||
        context.user === ""
      ) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }

      const { userID, branches } = args;
      const CurrentUserID = context.user.id;
      const { Accounts, users } = context.collections;
      const filter = { _id: userID };
      const update = { $push: { branches: branches } };
      const options = { new: true };
      // console.log(branches);
      const userAccount = await Accounts.findOne(filter);
      // console.log(userAccount);
      if (
        userAccount.branches &&
        userAccount.branches.includes(args.branches)
      ) {
        throw new ReactionError("duplicate", "Branch Already Assigned");

        // throw new ReactionError("Branch Already Assigned");
      }

      if (
        context.user.UserRole.toLowerCase() === "admin" ||
        context.user.UserRole.toLowerCase() === "dispatcher"
      ) {
        const updatedAccount = await Accounts.findOneAndUpdate(
          filter,
          update,
          options
        );
        // console.log("updatedAccount", updatedAccount);
        const updatedUserAccount = await users.findOneAndUpdate(
          filter,
          update,
          options
        );
        // console.log("updatedUserAccount", updatedUserAccount);
        const updatedUser = await Accounts.findOne({ _id: userID });
        // console.log("updatedUser--->", updatedUser);
        return updatedUser;
      } else {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );

        // throw new ReactionError("Unauthorized access!");
      }
    },
    async updateAccountAdmin(parent, args, context, info) {
      // console.log(args);
      // console.log(context.user);
      // console.log(context.user.UserRole);
      if (
        context.user === undefined ||
        context.user === null ||
        context.user === ""
      ) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      if (
        context.user.UserRole.toLowerCase() === "admin" ||
        context.user.UserRole.toLowerCase() === "dispatcher"
      ) {
        const { users, Accounts } = context.collections;
        const { userID, branches } = args;
        const newBranchValue = branches;
        let updateAccountResult;
        let newBranchValueRIder = [];
        newBranchValueRIder.push(branches);

        // console.log(newBranchValue);
        const checkAccountResponse = await Accounts.findOne({ _id: userID });
        // console.log("checkAccountResponse: ", checkAccountResponse);
        // Check if the new branch already exists in the branches array
        if (
          checkAccountResponse.branches &&
          checkAccountResponse.branches.includes(newBranchValue)
        ) {
          throw new ReactionError("duplicate", "branch already assigned");
          // throw new ReactionError("Duplicate Error", "branch already assigned");
        }
        // console.log("newBranchValue", newBranchValue);
        if (checkAccountResponse?.UserRole === "rider") {
          updateAccountResult = await Accounts.updateOne(
            { _id: userID },
            { $set: { branches: newBranchValueRIder } } // $addToSet only adds the value if it doesn't already exist
          );
          const updateUserResult = await users.updateOne(
            { _id: userID },
            { $set: { branches: newBranchValueRIder } } // $addToSet only adds the value if it doesn't already exist
          );
        } else {
          updateAccountResult = await Accounts.updateOne(
            { _id: userID },
            { $addToSet: { branches: newBranchValue } } // $addToSet only adds the value if it doesn't already exist
          );
        }
        // console.log(updateAccountResult);
        if (updateAccountResult.modifiedCount !== 1) {
          if (!updatedAccount)
            throw new ReactionError(
              "server-error",
              "Unable to update Account, Try again later"
            );

          // throw new ReactionError("Failed", `Failed to update branch value to user: ${userID}`);
        } else {
          // console.log("Updated Account");
          const updateUserResult = await users.updateOne(
            { _id: userID },
            { $addToSet: { branches: newBranchValue } } // $addToSet only adds the value if it doesn't already exist
          );
          // console.log("Updated Account", updateUserResult);
        }
        const updatedUser = await Accounts.findOne({ _id: userID });
        // console.log("updatedUser--->", updatedUser);

        return updatedUser;
      } else {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
    },
    async addBranchNotes(parent, args, context, info) {
      // console.log(args);
      const { orderId, Notes } = args;
      const { Orders } = context.collections;
      // console.log(orderId);
      const updateOrders = { $set: { Notes: Notes } };
      const options = { new: true };
      const updatedOrderResp = await Orders.findOneAndUpdate(
        { _id: orderId },
        updateOrders,
        options
      );
      // console.log("Update Order:- ", updatedOrderResp);
      if (updatedOrderResp.value) {
        return updatedOrderResp.value;
      } else {
        throw new ReactionError(
          "server-error",
          "Something went wrong , please try later"
        );
      }
    },
    async transferOrder(parent, { input }, context, info) {
      console.log("args ", input);
      const { orderID, branchId } = input;
      const { Orders, Accounts, BranchData } = context.collections;
      if (
        context.user === undefined ||
        context.user === null ||
        context.user === ""
      ) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      const modifier = {
        $set: {
          updatedAt: new Date(),
        },
      };
      modifier.$set.branchID = branchId;
      const { modifiedCount, value: updatedOrder } =
        await Orders.findOneAndUpdate(
          { _id: decodeOrderOpaqueId(orderID) },
          modifier,
          {
            returnOriginal: false,
          }
        );
      // const dispatcherId= await Accounts.findOne{""}
      const account = await Accounts.findOne({ branches: { $in: [branchId] } });
      console.log("account ", account);
      const branchData = await BranchData.findOne({
        _id: ObjectID.ObjectId(branchId),
      });
      // console.log("branchData ", branchData);

      const message = `Order has been assigned to ${branchData?.name} branch and order id is ${orderID}`;
      const appType = "customer";
      const appType1 = "admin";
      const id = account?._id;
      let OrderIDs = orderID;
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
      // console.log("context Mutation: rider 1 ", paymentIntentClientSecret);
      if (updatedOrder) {
        return updatedOrder;
      } else {
        throw new ReactionError("not-found", "Order not found");
      }
    },
  },
  Query: {
    // async getRiderOrderByRiderId()
    async getRiderOrderByRiderId(parent, { id }, context, info) {
      // console.log(context.user);
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      const { RiderOrder } = context.collections;
      if (id === null || id === undefined) {
        id = context.user.id;
      }
      const today = new Date(); // Get current date
      today.setHours(0, 0, 0, 0);
      const ordersResp = await RiderOrder.find({
        riderID: id,
        createdAt: { $gte: today },
      })
        .sort({ createdAt: -1 })
        .toArray();
      console.log("ordersResp ", ordersResp);

      if (ordersResp) {
        return ordersResp;
      } else {
        return null;
      }
    },
    async getOrderById(parent, { id }, context, info) {
      // console.log(context.user);
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      const { RiderOrder } = context.collections;
      if (id === null || id === undefined) {
        id = context.user.id;
      }
      const today = new Date(); // Get current date
      today.setHours(0, 0, 0, 0);
      const ordersResp = await RiderOrder.find({
        riderID: id,
        // createdAt: { $gte: today },
      })
        .sort({ createdAt: -1 })
        .toArray();
      // console.log("ordersResp ", ordersResp);

      if (ordersResp) {
        return ordersResp;
      } else {
        return null;
      }
    },
    async getOrdersByStatus(parent, { OrderStatus }, context, info) {
      // console.log("context.user ", context.user);
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      // console.log(OrderStatus);
      // console.log(context.user.id);
      const LoginUserID = context.user.id;
      const { RiderOrder, Orders } = context.collections;
      // Get Order by status
      const orders = await RiderOrder.find({
        OrderStatus: OrderStatus,
      })
        .sort({ createdAt: -1 })
        .toArray();
      // console.log("orders ", orders);

      if (orders) {
        // Current Login User Order
        const filteredOrders = orders.filter(
          (order) => order.riderID === LoginUserID
        );
        // console.log("Filter Order: ", filteredOrders);
        // console.log("Filter Order ID: ", filteredOrders[0].OrderID);
        if (filteredOrders) {
          const ordersWithId = filteredOrders.map((order) => ({
            id: order._id,
            ...order,
          }));
          // console.log("ordersWithId ", ordersWithId);
          return ordersWithId;
        } else {
          return null;
        }
        // if (filteredOrders[0]) {
        //   const kitchenOrderIDResp = await Orders.find({
        //     _id: filteredOrders[0].OrderID,
        //   })
        //     .sort({ createdAt: -1 })
        //     .toArray();
        //   console.log("kitchenOrderID: ", kitchenOrderIDResp);
        //   if (kitchenOrderIDResp[0]) {
        //     const ordersWithId = filteredOrders.map((order) => ({
        //       id: order._id,
        //       ...order,
        //       kitchenOrderID: kitchenOrderIDResp[0]?.kitchenOrderID,
        //     }));
        //     return ordersWithId;
        //   } else {
        //     const ordersWithId = filteredOrders.map((order) => ({
        //       id: order._id,
        //       ...order,
        //     }));
        //     return ordersWithId;
        //   }
        //   // const OrderWithkitchenOrderID =
        //   // console.log("Order with ID: ", ordersWithId);
        // } else {
        //   return null;
        // }
      } else {
        return null;
      }
    },
    async generateOrderReport(parent, args, context, info) {
      try {
        let { authToken, userId, collections } = context;
        let { RiderOrder, Users, Orders, BranchData, Accounts } = collections;
        if (context.user === undefined || context.user === null) {
          throw new ReactionError(
            "access-denied",
            "Unauthorized access. Please Login First"
          );
        }
        let {
          searchQuery,
          riderID,
          branches,
          startTime,
          OrderID,
          endTime,
          fromDate,
          toDate,
          deliveryTime,
          ...connectionArgs
        } = args;
        // console.log("new Date(startDate) ", startTime);
        // console.log("new Date(endDate) ", endDate);
        let matchStage = [];
        if (riderID) {
          matchStage.push({ riderID: riderID });
        }
        if (branches) {
          matchStage.push({ branches: branches });
        }
        if (startTime) {
          matchStage.push({ startTime: { $gte: new Date(startTime) } });
        }
        if (OrderID) {
          matchStage.push({ OrderID: OrderID });
        }
        if (endTime) {
          matchStage.push({ endTime: { $lte: new Date(endTime) } });
        }
        // if (toDate) {
        //   matchStage.push({ createdAt: { $lte: new Date(toDate) } });
        //   matchStage.push({
        //     toDate: {
        //       ...matchStage.createdAt,
        //       $lte: new Date(toDate),
        //     },
        //   });
        // }
        if (toDate && toDate !== undefined) {
          matchStage.createdAt = { $lte: new Date(toDate) };
        }
        if (toDate && toDate !== undefined) {
          matchStage.createdAt = {
            ...matchStage.createdAt,
            $lte: new Date(toDate),
          };
        }
        if (deliveryTime) {
          // matchStage.push({ deliveryTime: { $gte: deliveryTime } });
          matchStage.deliveryTime = { $gte: deliveryTime };
        }
        if (searchQuery) {
          // Searching for matching riderIDs in Accounts collection
          const matchingRiderIDs = await collections.Accounts.distinct("_id", {
            $or: [
              {
                "profile.firstName": {
                  $regex: new RegExp(searchQuery, "i"),
                },
              },
              {
                "profile.lastName": {
                  $regex: new RegExp(searchQuery, "i"),
                },
              },
            ],
          });

          //search based on matching branchIDs from BranchData collection
          // const matchingBranchIDs = await collections.BranchData.distinct(
          //   "_id",
          //   {
          //     $or: [
          //       {
          //         name: {
          //           $regex: new RegExp(searchQuery, "i"),
          //         },
          //       },
          //     ],
          //   }
          // );

          // Searching for matching OrderIDs in Orders collection
          const matchingOrderIDs = await collections.Orders.distinct("_id", {
            $or: [
              {
                "shipping.0.address.address1": {
                  $regex: new RegExp(searchQuery, "i"),
                },
              },
              {
                "shipping.0.address.city": {
                  $regex: new RegExp(searchQuery, "i"),
                },
              },
              {
                kitchenOrderID: {
                  $regex: new RegExp(searchQuery, "i"),
                },
              },
            ],
          });

          // Combining the matching IDs from both collections
          const matchingIDs = [
            ...matchingRiderIDs,
            ...matchingOrderIDs,
            // ...matchingBranchIDs,
          ];

          // Adding the combined IDs to the matchStage
          matchStage.push({
            $or: [
              { riderID: { $in: matchingIDs } },
              { OrderID: { $in: matchingIDs } },
              // { BranchID: { $in: matchingIDs } },
            ],
          });
        }

        // matchStage.push({
        //   riderID: {
        //     $in: await Accounts.distinct("_id", {
        //       "profile.0.firstName": {
        //         $regex: new RegExp(searchQuery, "i"),
        //       },
        //     }),
        //   },
        // });
        // console.log("matchStage ", matchStage);
        // console.log("searchQuery ", searchQuery);
        const report = await RiderOrder.find({ $and: matchStage });
        // console.log("report ", report);
        return getPaginatedResponse(report, connectionArgs, {
          includeHasNextPage: wasFieldRequested("pageInfo.hasNextPage", info),
          includeHasPreviousPage: wasFieldRequested(
            "pageInfo.hasPreviousPage",
            info
          ),
          includeTotalCount: wasFieldRequested("totalCount", info),
        });
      } catch (error) {
        console.log("error", error);
      }
    },

    async getRiderOrdersByLoginRider(parent, args, context, info) {
      // console.log(context.user);
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      // const today = new Date().toISOString().substr(0, 10);

      const { startDate, endDate, riderID } = args;
      const { RiderOrder } = context.collections;
      const { id } = context.user;
      // console.log(id);
      // const query = {};
      // if (riderID) {
      //     query.riderID = riderID;
      // }

      // if (startDate && endDate) {
      //     const start = new Date(startDate);
      //     const end = new Date(endDate);
      //     query.createdAt = {
      //         $gte: start,
      //         $lte: end,
      //     };
      // }
      // console.log(query);
      const orders = await RiderOrder.find({ riderID: riderID })
        .sort({ createdAt: -1 })
        .toArray();
      // console.log(orders);
      // get today's date
      const today = new Date().toISOString().substring(0, 10);
      // console.log(today);
      // filter data array to include only items with today's date in startTime
      const filteredData = orders.filter((item) => {
        if (!item.createdAt) {
          return false;
        }
        const itemDate = item.createdAt.substring(0, 10);
        return itemDate === today;
      });
      // console.log(filteredData);
      return filteredData;
    },
    async getKitchenReport(parent, args, context, info) {
      const { startDate, endDate, branchID, OrderStatus } = args;
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      // console.log("context.user :  ", context.user);
      // if (context.user) {
      // }
      // if (
      //   context.user.UserRole !== "admin" &&
      //   (!context.user.branches ||
      //     (context.user.branches && context.user.branches.includes(branchID)))
      // ) {
      //   throw new ReactionError(
      //     "conflict",
      //     "Only admins or authorized branch users can access orders report"
      //   );
      // }
      const { BranchData, Orders } = context.collections;
      const query = {};
      if (branchID) {
        query.branchID = branchID;
      }
      if (OrderStatus) {
        query["workflow.status"] = args.OrderStatus;
      }
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        query.createdAt = {
          $gte: start,
          $lte: end,
        };
      }
      // query["workflow.status"] = { $ne: "coreOrderWorkflow/canceled" };
      console.log("query:- ", query);
      const ordersResp = await Orders.find(query)
        .sort({ createdAt: -1 })
        .toArray();
      // console.log("ordersResp ", ordersResp);
      const ordersWithId = ordersResp.map((order) => ({
        id: order._id,
        ...order,
      }));
      // console.log("ordersWithId:- ", ordersWithId);
      return ordersWithId;
    },
    async getCustomerOrderbyID(parent, args, context, info) {
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      const { Orders } = context.collections;
      const { ID } = args;
      // console.log(decodeOpaqueId(ID).id);
      const CustomerOrderResp = await Orders.findOne({
        _id: decodeOpaqueId(ID).id,
      });
      // console.log("CustomerOrderResp", CustomerOrderResp);
      return CustomerOrderResp;
    },
    async generateKitchenReport(parent, args, context, info) {
      const { ...connectionArgs } = args;
      const { startDate, endDate, branchID, OrderStatus } = args;
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      const { BranchData, Orders } = context.collections;
      const query = {};
      if (branchID) {
        query.branchID = branchID;
      }
      if (OrderStatus) {
        query["workflow.status"] = args.OrderStatus;
      }
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        query.createdAt = {
          $gte: start,
          $lte: end,
        };
      }
      // console.log("query:- ", query);
      const ordersResp = await Orders.find(query);
      // .sort({ createdAt: -1 })
      // .toArray();
      // console.log("ordersResp ", ordersResp);
      return getPaginatedResponse(ordersResp, connectionArgs, {
        includeHasNextPage: wasFieldRequested("pageInfo.hasNextPage", info),
        includeHasPreviousPage: wasFieldRequested(
          "pageInfo.hasPreviousPage",
          info
        ),
        includeTotalCount: wasFieldRequested("totalCount", info),
      });
      // const ordersWithId = ordersResp.map((order) => ({
      //   id: order._id,
      //   ...order,
      // }));
      // // console.log("ordersWithId:- ", ordersWithId);
      // return ordersWithId;
    },
  },
};
