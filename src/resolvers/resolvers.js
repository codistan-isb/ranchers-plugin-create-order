import ObjectID from "mongodb";
import Random from "@reactioncommerce/random";
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";
import ReactionError from "@reactioncommerce/reaction-error";
import { decodeOrderOpaqueId } from "../xforms/id.js";
import getPaginatedResponse from "@reactioncommerce/api-utils/graphql/getPaginatedResponse.js";
import wasFieldRequested from "@reactioncommerce/api-utils/graphql/wasFieldRequested.js";
import calculateDeliveryTIme from "../utils/calculateDeliveryTIme.js";
import { PubSub } from "graphql-subscriptions";
import moment from 'moment-timezone';
const pubSub = new PubSub();
import seedrandom from "seedrandom";
import Logger from "@reactioncommerce/logger";
// import Random from "@reactioncommerce/random";

// import Random from "@reactioncommerce/random";
export default {
  Order: {
    async branchInfo(parent, args, context, info) {
      try {
        const BranchID = parent.branchID;
        if (BranchID) {
          const { BranchData } = context.collections;
          const branchDataResponse = await BranchData.findOne({
            _id: ObjectID.ObjectId(BranchID),
          });
          return branchDataResponse;
        } else {
          return [];
        }
      } catch (error) {
        console.log("error ", error);
      }
    },
    async riderInfo(parent, args, context, info) {
      try {
        console.log("parent ", parent);
        const { RiderOrder, Accounts } = context.collections;
        const id = parent.id || parent._id;
        let OrderIDArray = [];
        if (id) {
          // console.log("id ", id);
          const RiderOrderResponse = await RiderOrder.find({
            OrderID: id,
          }).toArray();
          // console.log("RiderOrderResponse ", RiderOrderResponse);
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
      } catch (error) {
        console.log("error ", error);
      }
    },
    async customerInfo(parent, args, context, info) {
      try {
        if (parent.OrderID) {
          const { Orders } = context.collections;
          const orderInfoResponse = await Orders.findOne({
            _id: parent.OrderID,
          });
          if (orderInfoResponse) {
            return orderInfoResponse.shipping[0].address;
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
      } catch (error) {
        console.log("error ", error);
      }
    },
    async customerOrderTime(parent, args, context, info) {
      try {
        const { Orders } = context.collections;
        const customerOrderTimeResp = await Orders.findOne({
          _id: parent.OrderID,
        });
        if (customerOrderTimeResp) {
          return {
            customerOrderTime: customerOrderTimeResp.createdAt,
            Latitude: customerOrderTimeResp.Latitude,
            Longitude: customerOrderTimeResp.Longitude,
          };
        } else {
          return null;
        }
      } catch (error) {
        console.log("error ", error);
      }
    },
    async branchTimePickup(parent, args, context, info) {
      try {
        const { RiderOrder } = context.collections;

        if (parent.riderID) {
          const branchTimePickupResp = await RiderOrder.findOne({
            riderID: parent.riderID,
            OrderID: parent.OrderID,
          });
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
      } catch (error) {
        console.log("error ", error);
      }
    },
    async kitchenOrderIDInfo(parent, args, context, info) {
      try {
        const { Orders } = context.collections;
        const kitchenOrderIDResp = await Orders.findOne({
          _id: parent.OrderID,
        });
        if (kitchenOrderIDResp) {
          return {
            kitchenOrderID: kitchenOrderIDResp.kitchenOrderID,
          };
        } else {
          return null;
        }
      } catch (error) {
        console.log("error ", error);
      }
    },
    async riderOrderInfo(parent, args, context, info) {
      try {
        const { RiderOrder } = context.collections;
        if (parent.id) {
          const riderOrderInfoResp = await RiderOrder.findOne({
            OrderID: parent.id,
          });
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
          if (riderOrderInfoResp) {
            return riderOrderInfoResp;
          } else {
            return null;
          }
        }
      } catch (error) {
        console.log("error ", error);
      }
    },
    async orderIdResolver(parent, args, context, info) {
      try {
        if (parent) {
          return { orderId: parent?._id };
        } else {
          return null;
        }
      } catch (error) {
        console.log("error ", error);
      }
    },
  },
  OrderReport: {
    async branchInfo(parent, args, context, info) {
      try {
        const BranchID = parent.branches;
        if (BranchID) {
          const { BranchData } = context.collections;
          const branchDataResponse = await BranchData.find({
            _id: ObjectID.ObjectId(BranchID),
          }).toArray();
          return branchDataResponse[0];
        } else {
          return [];
        }
      } catch (error) {
        console.log("error ", error);
      }
    },
    async customerInfo(parent, args, context, info) {
      try {
        if (parent.OrderID) {
          const { Orders } = context.collections;
          const orderInfoResponse = await Orders.findOne({
            _id: parent.OrderID,
          });
          if (orderInfoResponse) {
            return orderInfoResponse.shipping[0].address;
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
      } catch (error) {
        console.log("error ", error);
      }
    },
    async kitchenOrderIDInfo(parent, args, context, info) {
      try {
        const { Orders } = context.collections;
        if (parent.OrderID) {
          const kitchenOrderIDResp = await Orders.findOne({
            _id: parent.OrderID,
          });
          if (kitchenOrderIDResp) {
            return {
              kitchenOrderID: kitchenOrderIDResp.kitchenOrderID,
            };
          } else {
            return null;
          }
        }
      } catch (error) {
        console.log("error ", error);
      }
    },
    async riderInfo(parent, args, context, info) {
      try {
        const { RiderOrder, Accounts } = context.collections;
        const { riderID } = parent;
        const RiderInfoResp = await Accounts.findOne({ _id: riderID });
        return RiderInfoResp;
      } catch (error) {
        console.log("error ", error);
      }

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
      try {
        const { Orders } = context.collections;
        const { OrderID } = parent;
        if (OrderID) {
          const orderDetailResp = await Orders.findOne({ _id: OrderID });
          if (orderDetailResp) {
            return {
              prepTime: orderDetailResp?.prepTime || 20,
              deliveryTime: orderDetailResp?.deliveryTime || null,
            };
          } else {
            return null;
          }
        }
      } catch (error) {
        console.log("error ", error);
      }
    },
    async orderInfo(parent, args, context, info) {
      try {
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
      } catch (error) {
        console.log("error ", error);
      }
    },
  },
  RiderReport: {
    async riderInfo(parent, args, context, info) {
      try {
        // console.log("parent ", parent);
        const { Accounts } = context.collections;
        const { _id } = parent;
        console.log("id ", _id);
        const RiderInfoResp = await Accounts.findOne({
          _id: _id,
        });
        console.log("RiderInfoResp", RiderInfoResp);
        return RiderInfoResp;
      } catch (error) {
        console.log("error ", error);
      }
    },
  },
  Mutation: {
    async createRiderMultipleOrder(parent, { orders }, context, info) {
      const now = new Date();
      let CustomerOrder;
      // console.log("here first", orders);
      // console.log("Random id ", Random.id());
      const { userId, appEvents, collections } = context;
      // Get the current date
      // Use the current date to seed the random number generator
      // Get the current date
      // Get the current date
      var current_date = new Date();
      // Get the timestamp
      var timestamp = current_date.getTime();

      // console.log("Timestamp:", timestamp);

      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      try {
        // console.log("orders ", orders);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const { RiderOrder, Accounts, Orders, RiderOrderHistory } = collections;
        const CurrentRiderID = context?.user?.id;
        const AllOrdersArray = [];

        const riderStatus = await Accounts.findOne({
          _id: orders[0].riderID,
        });
        // console.log("Status of Rider : ", riderStatus);

        if (riderStatus && riderStatus?.currentStatus === "offline") {
          throw new ReactionError(
            "not-found",
            "Rider is offline, cannot create order"
          );
        }
        // for (const orderItem of orders) {
        //   // console.log("orderCount", orderCount);
        //   // createdAt: {
        //   //   $gte: todayStart,
        //   //   $lt: todayEnd,
        //   // },
        // }
        const RiderIDForAssign1 = orders.map((order) => {
          const riderId = order.riderID ? order.riderID : CurrentRiderID;
          return {
            ...order,
            riderID: riderId,
            createdAt: now,
          };
        });
        const riderID = RiderIDForAssign1[0].riderID;
        const existingOrders1 = await RiderOrder.find({
          riderID: riderID,
          OrderStatus: { $nin: ["delivered", "canceled"] }, // OrderStatus: { $ne: "delivered" },
        }).toArray();
        // console.log("testing");
        // console.log("existingOrders1 ", existingOrders1.length);
        // console.log("existingOrders1 ", existingOrders1);
        if (existingOrders1.length > 1) {
          // console.log("testig 2");
          throw new ReactionError(
            "access-denied",
            "Cannot assign new orders. Complete previous order first."
          );
        }
        // console.log("inside else statement");
        const insertedOrders = [];
        for (const order of orders) {
          var current_date = new Date();
          // Get the timestamp
          var timestamp = current_date.getTime();
          CustomerOrder = await Orders.findOne({ _id: order?.OrderID });
          let CustomerAccountID = "";
          if (CustomerOrder) {
            CustomerAccountID = CustomerOrder?.accountId;
            let updateOrders = {
              $set: { "workflow.status": "pickedUp", updatedAt: new Date() },
            };
            const options = { new: true };
            await Orders.findOneAndUpdate(
              { _id: order?.OrderID },
              updateOrders,
              options
            );
          }
          // console.log("order id", order.OrderID);
          // console.log(/^\d+$/.test(order.OrderID));
          var OrderID = order.OrderID;
          if (/^\d+$/.test(order.OrderID)) {
            OrderID = timestamp + "-" + OrderID;
          }
          // console.log("Order ID", OrderID);
          order.OrderID = OrderID;
          const RiderIDForAssign = {
            ...order,
            riderID: order.riderID ? order.riderID : CurrentRiderID,
            createdAt: now,
          };
          order.createdAt = new Date();
          order.updatedAt = new Date();
          let riderOrderResp = await RiderOrder.insertOne(order);
          // console.log("riderOrderResp", riderOrderResp.ops[0]);
          if (riderOrderResp?.ops?.length >= 1) {
            insertedOrders.push(riderOrderResp.ops[0]);
          }
          // await RiderOrderHistory.insertOne(order);
          await appEvents.emit("afterCreatingRiderOrder", {
            createdBy: userId,
            order,
            CustomerAccountID,
            CustomerOrder,
          });
        }
        // console.log("insertedOrders", insertedOrders);
        return insertedOrders;
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async createRiderOrder(parent, { orders }, context, info) {
      const now = new Date();
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      try {
        const { userId, appEvents, collections } = context;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const AllOrdersArray = orders;
        const { RiderOrder, Accounts, Orders, RiderOrderHistory } = collections;
        const CurrentRiderID = context.user.id;
        const CustomerOrder = await Orders.findOne({ _id: orders[0].OrderID });
        let CustomerAccountID = "";
        if (CustomerOrder) {
          CustomerAccountID = CustomerOrder?.accountId;
        }
        const RiderIDForAssign = orders.map((order) => {
          const riderId = order.riderID ? order.riderID : CurrentRiderID;
          return {
            ...order,
            riderID: riderId,
            createdAt: now,
          };
        });
        const riderStatus = await Accounts.findOne({ _id: RiderIDForAssign });
        if (riderStatus && riderStatus.currentStatus === "offline") {
          throw new ReactionError(
            "not-found",
            "Rider is offline, cannot create order"
          );
        }
        const existingRiderOrders = await RiderOrder.find({
          OrderID: { $in: RiderIDForAssign.map((o) => o.OrderID) },
        }).toArray();

        if (existingRiderOrders.length > 0) {
          if (existingRiderOrders[0].riderID !== RiderIDForAssign[0].riderID) {
            const update = {};
            const insertedOrders1 = await RiderOrder.findOneAndUpdate(
              { _id: existingRiderOrders[0]._id },
              {
                $set: {
                  riderID: RiderIDForAssign[0].riderID,
                  branches: RiderIDForAssign[0].branches,
                  OrderID: RiderIDForAssign[0].OrderID,
                  OrderStatus: RiderIDForAssign[0].OrderStatus,
                  startTime: RiderIDForAssign[0].startTime,
                  riderOrderAmount: RiderIDForAssign[0].riderOrderAmount,
                  riderOrderNotes: RiderIDForAssign[0].riderOrderNotes,
                  updatedAt: new Date(),
                },
              },
              { new: true, upsert: true }
            );
            const createdOrderIDs = {
              OrderID: RiderIDForAssign[0].OrderID,
              RiderID: RiderIDForAssign[0].riderID,
              branches: RiderIDForAssign[0].branches,
              riderOrderAmount: RiderIDForAssign[0].riderOrderAmount,
              riderOrderNotes: RiderIDForAssign[0].riderOrderNotes,
              createdAt: new Date(),
            };
            await RiderOrderHistory.insertOne(createdOrderIDs);
            let riderID = "test";
            console.log("insertedOrders1 ", insertedOrders1);
            pubSub.publish("ORDER_ASSIGNED", {
              orderMessage: insertedOrders1?.value,
            });
            // await appEvents.emit("afterCreatingRiderOrder", { createdBy: userId, CustomerOrder, CustomerAccountID });

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
            if (CustomerAccountID) {
              const paymentIntentClientSecret1 =
                context.mutations.oneSignalCreateNotification(context, {
                  message,
                  id: CustomerAccountID,
                  appType: appType1,
                  userId: CustomerAccountID,
                  orderID: OrderIDs,
                });
            }
            if (insertedOrders1) {
              return insertedOrders1.value;
            } else {
              try {
                const insertedOrders = await RiderOrder.insertMany(
                  RiderIDForAssign
                );
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
                  if (CustomerAccountID) {
                    const paymentIntentClientSecret1 =
                      context.mutations.oneSignalCreateNotification(context, {
                        message: customerMessage,
                        id: CustomerAccountID,
                        appType: appType1,
                        userId: CustomerAccountID,
                        orderID: OrderIDs,
                      });

                    const updateOrders = {
                      $set: { "workflow.status": "pickedUp" },
                    };
                    const options = { new: true };
                    const updatedOrder = await Orders.findOneAndUpdate(
                      { _id: AllOrdersArray[0].OrderID },
                      updateOrders,
                      options
                    );
                  }
                }
                // await appEvents.emit("afterCreatingRiderOrder", { createdBy: userId, CustomerOrder, CustomerAccountID });

                return insertedOrders.ops;
              } catch (err) {
                if (err.code === 11000) {
                  throw new ReactionError("duplicate", "Order Already Exists");
                  // throw new ReactionError("Order Already Exists");
                }
                console.log("error ", err);
                throw new ReactionError("duplicate", "Order Already Exists");
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
            const insertedOrders = await RiderOrder.insertMany(
              RiderIDForAssign
            );
            const createdOrderIDs = {
              OrderID: RiderIDForAssign[0].OrderID,
              RiderID: RiderIDForAssign[0].riderID,
              branches: RiderIDForAssign[0].branches,
              riderOrderAmount: RiderIDForAssign[0].riderOrderAmount,
              riderOrderNotes: RiderIDForAssign[0].riderOrderNotes,
              createdAt: new Date(),
            };
            await RiderOrderHistory.insertOne(createdOrderIDs);
            // console.log(insertedOrders.insertedIds);
            // console.log("inserted Data:- ", insertedOrders)
            // console.log(AllOrdersArray);
            // console.log("Order ID:- ", AllOrdersArray[0].OrderID);
            // console.log("RiderIDForAssign ", RiderIDForAssign[0]);
            if (insertedOrders) {
              console.log("insertedOrders ", insertedOrders);
              for (let i = 0; i < insertedOrders?.ops?.length; i++) {
                console.log("insertedOrders[i] ", insertedOrders?.ops[i]);
                pubSub.publish("ORDER_ASSIGNED", {
                  orderMessage: insertedOrders?.ops[i],
                });
              }
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
              // await appEvents.emit("afterCreatingRiderOrder", { createdBy: userId, CustomerAccountID, CustomerOrder });

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

                const updateOrders = {
                  $set: { "workflow.status": "pickedUp" },
                };
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
            // await appEvents.emit("afterCreatingRiderOrder", { createdBy: userId, CustomerOrder, CustomerAccountID });

            return insertedOrders.ops[0];
          } catch (err) {
            if (err.code === 11000) {
              throw new ReactionError("duplicate", "Order Already Exists");

              // throw new ReactionError("Order Already Exists");
            }
            throw err;
          }
        }
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async updateRiderOrder(
      parent,
      { id, startTime, endTime, OrderStatus, OrderID, rejectionReason },
      context,
      info
    ) {
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      try {
        const CurrentRiderID = context.user.id;
        const { userId, appEvents, collections } = context;
        let message = "";
        let updateOrders = {};
        const { RiderOrder, Orders, CronJobs } = collections;
        const filter = { OrderID: OrderID };
        const CustomerOrder = await Orders.findOne({ _id: OrderID });
        let CustomerAccountID = "";
        if (CustomerOrder) {
          CustomerAccountID = CustomerOrder?.accountId;
        }
        const update = {};
        if (rejectionReason) {
          update.rejectionReason = rejectionReason;
        }
        if (startTime) {
          update.startTime = startTime;
        }
        if (endTime) {
          let deliveryTimeCalculation = await calculateDeliveryTIme(
            context,
            OrderID,
            endTime
          );
          console.log("deliveryTimeCalculation", deliveryTimeCalculation);
          update.endTime = endTime;
          update.deliveryTime = deliveryTimeCalculation;
          // this move to another function, dnt uncomment it
          // const getStartTimeResp = await RiderOrder.findOne({
          //   OrderID: OrderID,
          // });
          // if (getStartTimeResp) {
          //   const startFinalTime = new Date(getStartTimeResp.startTime);
          //   const endFinalTime = new Date(endTime);
          //   const timeDiff = endFinalTime.getTime() - startFinalTime.getTime();
          //   // timeDiff is in milliseconds, convert to seconds
          //   const minutes = timeDiff / 60000;
          //   update.deliveryTime = parseFloat(minutes.toFixed(2));
          // }
        }
        // console.log("update", update);
        if (OrderStatus) {
          if (OrderStatus === "canceled") {
            message = `Order is ${OrderStatus} and reason is ${rejectionReason}`;
            update.OrderStatus = OrderStatus;
            updateOrders = {
              $set: {
                "workflow.status": OrderStatus,
                rejectionReason: rejectionReason,
                updatedAt: new Date(),
              },
            };
          } else {
            update.OrderStatus = OrderStatus;
            message = `Order is ${OrderStatus}`;
            updateOrders = {
              $set: { "workflow.status": OrderStatus, updatedAt: new Date() },
            };
          }
          // move toward appevent
          // const appType = "admin";
          // const appTypeCustomer = "customer";
          // const id = CurrentRiderID;
          // const userId = CurrentRiderID;
          // const paymentIntentClientSecret =
          //   context.mutations.oneSignalCreateNotification(context, {
          //     message,
          //     id,
          //     appType,
          //     userId,
          //   });
          // if (CustomerAccountID) {
          //   const paymentIntentClientSecret1 =
          //     context.mutations.oneSignalCreateNotification(context, {
          //       message,
          //       id: CustomerAccountID,
          //       appType: appTypeCustomer,
          //       userId: CustomerAccountID,
          //       orderID: OrderID,
          //     });
          // }

          // if (rejectionReason) {
          // } else {
          //   updateOrders = {
          //     $set: { "workflow.status": OrderStatus, updatedAt: new Date() },
          //   };
          // }
          // const options = { new: true };
          // const updatedOrder = await Orders.findOneAndUpdate(
          //   { _id: OrderID },
          //   updateOrders,
          //   options
          // );
        }
        // if (OrderStatus === "ready") {
        //   const updatedBranch = {
        //     prepTime: 0, // add prepTime field here
        //     updatedAt: new Date().toISOString(),
        //   };
        //   const message = "Order is Ready";
        //   const appType = "admin";
        //   const appTypecustomer = "customer";
        //   const id = userId;
        //   const paymentIntentClientSecret =
        //     context.mutations.oneSignalCreateNotification(context, {
        //       message,
        //       id,
        //       appType,
        //       userId,
        //       // orderID,
        //     });
        //   if (CustomerAccountID) {
        //     const paymentIntentClientSecret1 =
        //       context.mutations.oneSignalCreateNotification(context, {
        //         message,
        //         id: CustomerAccountID,
        //         appType: appTypecustomer,
        //         userId: CustomerAccountID,
        //         orderID: OrderID,
        //       });
        //     // console.log(
        //     //   " Customer Order context Mutation: ",
        //     //   paymentIntentClientSecret1
        //     // );
        //   }
        // }
        if (OrderID) {
          update.OrderID = OrderID;
        }
        update.updatedAt = new Date();
        // console.log("Update ", update);
        const options = { new: false };
        const response = await RiderOrder.findOneAndUpdate(
          filter,
          { $set: update },
          options
        );
        // console.log("response ", response.value);
        if (response) {
          const updatedOrderResp = await RiderOrder.findOne({
            OrderID: OrderID,
          });
          // console.log("updated Order Resp", updatedOrderResp);
          if (updatedOrderResp) {
            await appEvents.emit("afterUpdatingRiderOrder", {
              createdBy: userId,
              CustomerAccountID,
              CustomerOrder,
              updateOrders,
              OrderID,
              message,
              CurrentRiderID,
            });
            return {
              id: updatedOrderResp._id,
              ...updatedOrderResp,
            };
          } else {
            return null;
          }
        } else {
          return null;
        }
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async updateUserCurrentStatus(parent, args, context, info) {
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }

      const { Accounts } = context.collections;
      const currentStatus = args.status;
      const userID = context.user.id;
      if (!userID) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      try {
        const updatedUser = await Accounts.findOneAndUpdate(
          { _id: userID },
          { $set: { currentStatus, updatedAt: new Date() } },
          { returnOriginal: false }
        );
        if (!updatedUser) {
          throw new ReactionError(
            "not-found",
            `User with ID ${userID} not found`
          );
        }

        return updatedUser.value;
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async assignBranchtoUser(parent, args, context, info) {
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
      try {
        const { userID, branches } = args;
        const CurrentUserID = context.user.id;
        const { Accounts, users } = context.collections;
        const filter = { _id: userID };
        const update = { $push: { branches: branches } };
        const options = { new: true };
        const userAccount = await Accounts.findOne(filter);
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
          const updatedUserAccount = await users.findOneAndUpdate(
            filter,
            update,
            options
          );
          const updatedUser = await Accounts.findOne({ _id: userID });
          return updatedUser;
        } else {
          throw new ReactionError(
            "access-denied",
            "Unauthorized access. Please Login First"
          );
        }
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async updateAccountAdmin(parent, args, context, info) {
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
      try {
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
          const checkAccountResponse = await Accounts.findOne({ _id: userID });
          // Check if the new branch already exists in the branches array
          if (
            checkAccountResponse.branches &&
            checkAccountResponse.branches.includes(newBranchValue)
          ) {
            throw new ReactionError("duplicate", "branch already assigned");
          }
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
          return updatedUser;
        } else {
          throw new ReactionError(
            "access-denied",
            "Unauthorized access. Please Login First"
          );
        }
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async addBranchNotes(parent, args, context, info) {
      try {
        const { orderId, Notes } = args;
        const { Orders } = context.collections;
        const updateOrders = { $set: { Notes: Notes } };
        const options = { new: true };
        const updatedOrderResp = await Orders.findOneAndUpdate(
          { _id: orderId },
          updateOrders,
          options
        );
        if (updatedOrderResp.value) {
          return updatedOrderResp.value;
        } else {
          throw new ReactionError(
            "server-error",
            "Something went wrong , please try later"
          );
        }
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async transferOrder(parent, { input }, context, info) {
      try {
        const { orderID, transferTo, transferFrom } = input;
        const { appEvents, collections, userId } = context;
        const { Orders, Accounts, BranchData } = collections;
        console.log("input", input);
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
        modifier.$set.branchID = transferTo;
        const { modifiedCount, value: updatedOrder } =
          await Orders.findOneAndUpdate(
            { _id: decodeOrderOpaqueId(orderID) },
            modifier,
            {
              returnOriginal: false,
            }
          );
        // moved to appevent for testing
        // console.log("updatedOrder ", updatedOrder);
        // const account = await Accounts.findOne({
        //   branches: { $in: [transferTo] },
        // });
        // console.log("account ", account);
        // const branchData = await BranchData.findOne({
        //   _id: ObjectID.ObjectId(transferTo),
        // });

        // const message = `Order has been assigned to ${branchData?.name} branch and order id is ${updatedOrder?.kitchenOrderID}`;
        // const appType = "customer";
        // const appType1 = "admin";
        // const id = account?._id;
        // let OrderIDs = updatedOrder?.kitchenOrderI;
        // const paymentIntentClientSecret =
        //   context.mutations.oneSignalCreateNotification(context, {
        //     message,
        //     id,
        //     appType,
        //     userId: id,
        //     orderID: OrderIDs,
        //   });
        // const paymentIntentClientSecret1 =
        //   context.mutations.oneSignalCreateNotification(context, {
        //     message,
        //     id,
        //     appType: appType1,
        //     userId: id,
        //   });
        await appEvents.emit("afterOrderTransfer", {
          createdBy: userId,
          orderID,
          transferTo,
          transferFrom,
          updatedOrder,
        });

        if (updatedOrder) {
          return updatedOrder;
        } else {
          throw new ReactionError("not-found", "Order not found");
        }
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async addIsManual(parent, args, context, info) {
      console.log("args", args);
      let { isManual } = args;
      const { RiderOrder } = context.collections;
      const updateResult = await RiderOrder.updateMany(
        { OrderID: { $regex: "^[0-9]+$" } }, // Numeric OrderID
        { $set: { isManual: true } } // Set isManual to true
      );
      const totalUpdated = updateResult.modifiedCount;
      console.log("totalUpdated", updateResult);
      await RiderOrder.updateMany(
        { OrderID: { $not: { $regex: "^[0-9]+$" } } }, // Non-numeric OrderID
        { $set: { isManual: false } } // Set isManual to false
      );
      console.log(`Updated ${totalUpdated} documents`);
    },
  },
  Query: {
    async getRiderOrderByRiderId(parent, { id }, context, info) {
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      try {
        const { RiderOrder } = context.collections;
        if (id === null || id === undefined) {
          id = context.user.id;
        }
        console.log("id ", id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        console.log("tomorrow ", tomorrow);
        let ordersResp = await RiderOrder.find({
          riderID: id,
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        })
          .sort({ createdAt: -1 })
          .toArray();
        // console.log("ordersResp ", ordersResp);
        // const ordersResp = await RiderOrder.find({
        //   riderID: new ObjectID.ObjectId(id),
        //   // createdAt: { $gte: today },
        // })
        //   .sort({ createdAt: -1 })
        //   .toArray();
        console.log("ordersResp ", ordersResp);
        if (ordersResp) {
          return ordersResp;
        } else {
          return null;
        }
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async getRiderOrderHistory(parent, { input }, context, info) {
      let { startTime, endTime, OrderStatus, riderID } = input;
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      try {
        const { RiderOrder } = context.collections;
        if (riderID === null || riderID === undefined) {
          riderID = context.user.id;
        }
        let query = { riderID: riderID };
        if (startTime && endTime) {
          query.createdAt = {
            $gte: new Date(startTime),
            $lte: new Date(endTime),
          };
        }
        if (OrderStatus) {
          query.OrderStatus = OrderStatus;
        }
        // console.log("query",query)
        const ordersResponse = await RiderOrder.find(query)
          .sort({ createdAt: -1 })
          .toArray();
        if (ordersResponse) {
          return ordersResponse;
        } else {
          return null;
        }
      } catch (error) {
        console.log("error", error);
        throw new ReactionError("access-denied", `${error}`);
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
      try {
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
          .sort({ updatedAt: -1 })
          .toArray();
        // console.log("ordersResp ", ordersResp);

        if (ordersResp) {
          return ordersResp;
        } else {
          return null;
        }
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
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
      try {
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
        console.log("LoginUserID ", LoginUserID);

        if (orders) {
          // Current Login User Order
          const filteredOrders = orders.filter(
            (order) => order.riderID === LoginUserID
          );
          // console.log("Filter Order: ", filteredOrders);
          // console.log("Filter Order ID: ", filteredOrders[0].OrderID);
          console.log("filteredOrders.length ", filteredOrders.length);
          if (filteredOrders) {
            const ordersWithId = filteredOrders.map((order) => ({
              id: order._id,
              ...order,
            }));
            console.log("ordersWithId.length ", ordersWithId.length);
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
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async getOrdersByStatusOptimized(parent, { OrderStatus }, context, info) {
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }

      try {
        const LoginUserID = context.user.id;
        const { RiderOrder } = context.collections;

        // Aggregate directly on RiderOrder
        const ordersResp = await RiderOrder.aggregate([
          {
            $match: {
              OrderStatus: OrderStatus,
              riderID: LoginUserID,
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "Accounts",
              localField: "riderID",
              foreignField: "_id",
              as: "riderInfo",
            },
          },
          { $unwind: { path: "$riderInfo", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "Orders",
              localField: "OrderID",
              foreignField: "_id",
              as: "orderInfo",
            },
          },
          { $unwind: { path: "$orderInfo", preserveNullAndEmptyArrays: true } }, // Preserve documents even if riderOrderInfo is missing
          {
            // Convert branchID to ObjectId and lookup in BranchData
            $addFields: {
              branchObjectId: { $toObjectId: "$orderInfo.branchID" }, // Convert branchID string to ObjectId
            },
          },
          {
            $lookup: {
              from: "BranchData", // The collection where branch information is stored
              localField: "branchObjectId", // Use the converted ObjectId field
              foreignField: "_id", // Field in BranchData that matches the branchID
              as: "branchDetails",
            },
          },
          {
            $unwind: {
              path: "$branchDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              id: "$_id",
              OrderID: "$OrderID",
              status: "$orderInfo.workflow.status",
              startTime: "$startTime",
              endTime: "$endTime",
              createdAt: "$orderInfo.createdAt",
              updatedAt: "$orderInfo.updatedAt",
              branchID: "$orderInfo.branchID",
              summary: {
                discountTotal: {
                  amount: { $sum: "$discounts.amount" },
                  __typename: "DiscountTotal",
                },
                __typename: "Summary",
              },
              payments: {
                $map: {
                  input: "$orderInfo.payments",
                  as: "payment",
                  in: {
                    finalAmount: "$$payment.finalAmount",
                    tax: "$$payment.tax",
                    totalAmount: "$$payment.totalAmount",
                    billingAddress: {
                      fullName: "$$payment.address.fullName",
                      phone: "$$payment.address.phone",
                      address1: "$$payment.address.address1",
                      city: "$$payment.address.city",
                      country: "$$payment.address.country",
                      postal: "$$payment.address.postal",
                      region: "$$payment.address.region",
                    },
                    __typename: "Payments",
                  },
                },
              },
              email: 1,
              kitchenOrderID: 1,
              // Ensure kitchenOrderIDInfo is null if the value is null or missing
              kitchenOrderIDInfo: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: ["$orderInfo", null] },
                      { $eq: ["$orderInfo.kitchenOrderID", null] },
                    ],
                  },
                  then: null,
                  else: { kitchenOrderID: "$orderInfo.kitchenOrderID" },
                },
              },
              customerOrderTime: {
                customerOrderTime: "$orderInfo.createdAt",
              },
              riderOrderNotes: "$riderOrderNotes",
              riderOrderAmount: "$riderOrderAmount",
              branches: "$branches",
              username: "$riderInfo.name",
              OrderStatus: "$OrderStatus",
              riderOrderInfo: {
                _id: "$_id",
                startTime: "$startTime",
                endTime: "$endTime",
                __typename: "RiderOrderInfo",
              },
              riderInfo: {
                userId: "$riderInfo.userId",
                _id: "$riderInfo._id",
                firstName: "$riderInfo.profile.firstName",
                lastName: "$riderInfo.profile.lastName",
                phone: "$riderInfo.profile.phone",
                __typename: "RiderInfo",
              },
              fulfillmentGroups: {
                $map: {
                  input: "$orderInfo.shipping",
                  as: "shippingItem",
                  in: {
                    selectedFulfillmentOption: {
                      fulfillmentMethod: {
                        fulfillmentTypes: ["$$shippingItem.type"],
                        __typename: "FulfillmentMethod",
                      },
                      __typename: "FulfillmentOption",
                    },
                    items: {
                      nodes: {
                        $map: {
                          input: "$$shippingItem.items",
                          as: "item",
                          in: {
                            _id: "$$item._id",
                            quantity: "$$item.quantity",
                            optionTitle: "$$item.optionTitle",
                            title: "$$item.title",
                            variantTitle: "$$item.variantTitle",
                            attributes: {
                              $map: {
                                input: "$$item.attributes",
                                as: "attribute",
                                in: {
                                  label: "$$attribute.label",
                                  value: "$$attribute.value",
                                  __typename: "OrderItemAttribute",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              notes: "$orderInfo.notes",
              deliveryTime: 1,
              branchTimePickup: {
                branchOrderTime: "$createdAt",
                __typename: "BranchTimePickup",
              },
              customerInfo: {
                address1: {
                  $arrayElemAt: ["$orderInfo.shipping.address.address1", 0],
                },
                city: { $arrayElemAt: ["$orderInfo.shipping.address.city", 0] },
                country: {
                  $arrayElemAt: ["$orderInfo.shipping.address.country", 0],
                },
                postal: {
                  $arrayElemAt: ["$orderInfo.shipping.address.postal", 0],
                },
                region: {
                  $arrayElemAt: ["$orderInfo.shipping.address.region", 0],
                },
                phone: {
                  $arrayElemAt: ["$orderInfo.shipping.address.phone", 0],
                },
                fullName: {
                  $arrayElemAt: ["$orderInfo.shipping.address.fullName", 0],
                },
                __typename: "CustomerInfo",
              },
              branchInfo: {
                _id: "$branchDetails._id",
                name: "$branchDetails.name",
                __typename: "BranchInfo",
              },
            },
          },
        ]).toArray();
        console.log("ordersResp ", ordersResp);
        // console.log("ordersResp.length ", ordersResp.length);
        // console.log("ordersResp[0].fulfillmentGroups ",ordersResp[0].fulfillmentGroups)
        return ordersResp;
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async generateOrderReport(parent, args, context, info) {
      // console.log("args ", args);
      // console.log("info", info);
      let { authToken, userId, collections } = context;
      let { RiderOrder } = collections;
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }

      try {
        let {
          isManual,
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
        // console.log("args ", args);
        let query = {};
        let matchStage = [];
        if (isManual === false) {
          query.isManual = false;
          matchStage.push({ isManual: false });
        }
        if (isManual === true) {
          query.isManual = true;
          matchStage.push({ isManual: true });
        }
        if (riderID) {
          query.riderID = riderID;
          matchStage.push({ riderID: riderID });
        }
        if (branches) {
          query.branches = branches;
          matchStage.push({ branches: branches });
        }
        // if (deliveryTime) {
        //   query.deliveryTime = deliveryTime;
        //   matchStage.push({ deliveryTime: deliveryTime });
        // }
        if (deliveryTime) {
          query.deliveryTime = { $lt: deliveryTime };
          matchStage.push({ deliveryTime: { $lt: deliveryTime } });
        }

        if (startTime) {
          const start = new Date(startTime); // Fix variable name
          query.startTime = {
            $gte: start,
          };
          matchStage.push({ $match: { startTime: { $gte: start } } });
        }
        if (endTime) {
          query.endTime = {
            $lte: new Date(endTime),
          };
          matchStage.push({
            $match: { startTime: { $lte: new Date(endTime) } },
          });
        }
        if (OrderID) {
          query.OrderID = OrderID;
          matchStage.push({ OrderID: OrderID });
        }
        if (fromDate && fromDate !== undefined) {
          query.createdAt = {
            ...query.createdAt,
            $gte: new Date(fromDate),
          };
          matchStage.push({
            $match: { createdAt: { $gte: new Date(fromDate) } },
          });
        }
        if (toDate && toDate !== undefined) {
          query.createdAt = {
            ...query.createdAt,
            $lte: new Date(toDate),
          };
          matchStage.push({
            $match: { createdAt: { $lte: new Date(toDate) } },
          });
        }
        if (searchQuery) {
          const regexQuery = new RegExp(searchQuery, "i");
          query.$or = [
            { OrderID: { $regex: regexQuery } },
            { OrderStatus: { $regex: regexQuery } },
            // { OrderID: { $in: matchingOrderIDs } },
          ];
        }
        // console.log("query", query);
        const report = await RiderOrder.find(query);
        // console.log(report[0])
        // const report = await RiderOrder.find([{ $match: { $and: matchStage } }]);
        return getPaginatedResponse(report, connectionArgs, {
          includeHasNextPage: wasFieldRequested("pageInfo.hasNextPage", info),
          includeHasPreviousPage: wasFieldRequested(
            "pageInfo.hasPreviousPage",
            info
          ),
          includeTotalCount: wasFieldRequested("totalCount", info),
        });
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async generateOrderReportV2(parent, args, context, info) {
      let { authToken, userId, collections } = context;
      let { Orders } = collections; // Use the Order collection here
      if (!context.user) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }

      try {
        Logger.info("args: ", args);
        const {
          fromDate = null,
          toDate = null,
          offset = 0,
          searchQuery = null,
          branchID = null,
          rowPerPage = 10,
          isManual = null,
        } = args?.data;

        let query = {};
        let matchStage = [];
        if (isManual === false) {
          query.isManual = false;
          matchStage.push({ isManual: false });
        }
        if (isManual === true) {
          query.isManual = true;
          matchStage.push({ isManual: true });
        }
        // if (riderID) {
        //   query.riderID = riderID;
        //   matchStage.push({ riderID: riderID });
        // }
        // if (branches) {
        //   query.branches = branches;
        //   matchStage.push({ branches: branches });
        // }
        // if (deliveryTime) {
        //   query.deliveryTime = deliveryTime;
        //   matchStage.push({ deliveryTime: deliveryTime });
        // }
        // if (deliveryTime) {
        //   query.deliveryTime = { $lt: deliveryTime };
        //   matchStage.push({ deliveryTime: { $lt: deliveryTime } });
        // }

        // if (startTime) {
        //   const start = new Date(startTime); // Fix variable name
        //   query.startTime = {
        //     $gte: start,
        //   };
        //   matchStage.push({ $match: { startTime: { $gte: start } } });
        // }
        // if (endTime) {
        //   query.endTime = {
        //     $lte: new Date(endTime),
        //   };
        //   matchStage.push({
        //     $match: { startTime: { $lte: new Date(endTime) } },
        //   });
        // }
        // if (OrderID) {
        //   query.OrderID = OrderID;
        //   matchStage.push({ OrderID: OrderID });
        // }
        if (fromDate && fromDate !== undefined) {
          query.createdAt = {
            ...query.createdAt,
            $gte: new Date(fromDate),
          };
          matchStage.push({
            $match: { createdAt: { $gte: new Date(fromDate) } },
          });
        }
        if (toDate && toDate !== undefined) {
          query.createdAt = {
            ...query.createdAt,
            $lte: new Date(toDate),
          };
          matchStage.push({
            $match: { createdAt: { $lte: new Date(toDate) } },
          });
        }
        if (searchQuery) {
          const regexQuery = new RegExp(searchQuery, "i");
          query.$or = [
            { OrderID: { $regex: regexQuery } },
            { OrderStatus: { $regex: regexQuery } },
            // { OrderID: { $in: matchingOrderIDs } },
          ];
        }

        Logger.info("query: ", query);

        // Pagination: Use skip and limit for efficient data fetching
        const skip = offset || 0;
        const limit = rowPerPage || 10;

        // Projection: Select only the necessary fields to reduce data transfer
        const projection = {
          _id: 1,
          // OrderStatus: 1,
          // createdAt: 1,
          // isManual: 1,
        };

        // const [dbOrders, totalOrders] = await Promise.all([
        //   Orders.find(query)
        //     .skip(skip)
        //     .limit(limit)
        //     .project(projection) // Use projection to return only required fields
        //     .toArray(),
        //   Orders.countDocuments(query),
        // ]);

        let [dbOrders, totalOrders] = await Promise.all([
          Orders.aggregate([
            // Stage 1: Match only orders created on the current date
            {
              $match: query,
            },
            // Stage 2: Sort orders by creation date (newest first)
            {
              $sort: { createdAt: -1 },
            },
            // Stage 3: Lookup RiderOrder based on OrderID
            {
              $lookup: {
                from: "RiderOrder", // the collection with rider details
                localField: "_id", // the field in the orders collection referencing the rider
                foreignField: "OrderID", // the field in the riders collection to match
                as: "riderOrderInfo", // output field containing the rider details
              },
            },
            {
              $match: {
                riderOrderInfo: { $ne: [] }, // ensures the rider exists by checking that riderInfo is not empty
              },
            },
            {
              $unwind: {
                path: "$riderOrderInfo",
                preserveNullAndEmptyArrays: true, // Keep the order even if no matching RiderOrder exists
              },
            },
            {
              $addFields: {
                branchID: { $toObjectId: "$branchID" },
              },
            },
            {
              $lookup: {
                from: "BranchData", // The collection for branch data
                localField: "branchID", // The branches field in RiderOrder
                foreignField: "_id", // The _id field in BranchData
                as: "branchData", // Store the branch data
              },
            },
            {
              $unwind: {
                path: "$branchData",
                preserveNullAndEmptyArrays: true, // Keep the order even if no matching BranchData exists
              },
            },
            {
              $lookup: {
                from: "users", // The collection for rider accounts
                localField: "riderOrderInfo.riderID", // The riderID field in RiderOrder
                foreignField: "_id", // The _id field in Accounts
                as: "riderData", // Store the rider data
              },
            },
            // {
            //   $match: {
            //     riderData: { $ne: [] } // ensures the rider exists by checking that riderInfo is not empty
            //   }
            // },
            {
              $unwind: {
                path: "$riderData",
                preserveNullAndEmptyArrays: true, // Keep the order even if no matching BranchData exists
              },
            },
            // Stage 4: Paginate the results
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },

            // No $project stage means all fields will be returned
          ]),
          // Count total documents matching today's orders
          Orders.countDocuments(query),
        ]);

        dbOrders = await dbOrders.toArray();

        Logger.info("totalOrders: ", totalOrders);
        Logger.info("dbOrders: ", dbOrders);

        return { totalOrders, dbOrders } || { message: "okay", success: true };
        // let {
        //   isManual,
        //   searchQuery,
        //   riderID,
        //   branches, // Assuming branches should map to branchID
        //   startTime,
        //   OrderID,
        //   endTime,
        //   fromDate,
        //   toDate,
        //   deliveryTime,
        //   ...connectionArgs
        // } = args;

        // let query = {};
        // let matchStage = [];

        // // Apply filters to query based on args
        // if (isManual !== undefined) {
        //   query.isManual = isManual;
        //   matchStage.push({ isManual });
        // }

        // if (riderID) {
        //   query.riderID = riderID;
        //   matchStage.push({ riderID });
        // }

        // if (branches) {
        //   query.branchID = branches; // Matching branchID from Order collection
        //   matchStage.push({ branchID: branches });
        // }

        // if (deliveryTime) {
        //   query.deliveryTime = { $lt: deliveryTime };
        //   matchStage.push({ deliveryTime: { $lt: deliveryTime } });
        // }

        // if (startTime) {
        //   const start = new Date(startTime);
        //   query.startTime = { $gte: start };
        //   matchStage.push({ startTime: { $gte: start } });
        // }

        // if (endTime) {
        //   query.startTime = { $lte: new Date(endTime) };
        //   matchStage.push({ startTime: { $lte: new Date(endTime) } });
        // }

        // if (OrderID) {
        //   query.OrderID = OrderID;
        //   matchStage.push({ OrderID });
        // }

        // if (fromDate) {
        //   query.createdAt = { ...query.createdAt, $gte: new Date(fromDate) };
        //   matchStage.push({ createdAt: { $gte: new Date(fromDate) } });
        // }

        // if (toDate) {
        //   query.createdAt = { ...query.createdAt, $lte: new Date(toDate) };
        //   matchStage.push({ createdAt: { $lte: new Date(toDate) } });
        // }

        // if (searchQuery) {
        //   const regexQuery = new RegExp(searchQuery, "i");
        //   query.$or = [
        //     { OrderID: { $regex: regexQuery } },
        //     { OrderStatus: { $regex: regexQuery } },
        //   ];
        // }

        // // Fetch data from Order collection
        // const report = await Orders.find(query);

        // Logger.info("report: ", report);

        // // Return paginated response
        // return getPaginatedResponse(report, connectionArgs, {
        //   includeHasNextPage: wasFieldRequested("pageInfo.hasNextPage", info),
        //   includeHasPreviousPage: wasFieldRequested(
        //     "pageInfo.hasPreviousPage",
        //     info
        //   ),
        //   includeTotalCount: wasFieldRequested("totalCount", info),
        // });
      } catch (error) {
        console.log("error", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async getRiderOrdersByLoginRider(parent, args, context, info) {
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      try {
        const { startDate, endDate, riderID } = args;
        const { RiderOrder } = context.collections;
        const { id } = context.user;
        const orders = await RiderOrder.find({ riderID: riderID })
          .sort({ createdAt: -1 })
          .toArray();
        const today = new Date().toISOString().substring(0, 10);
        // filter data array to include only items with today's date in startTime
        const filteredData = orders.filter((item) => {
          if (!item.createdAt) {
            return false;
          }
          const itemDate = item.createdAt.substring(0, 10);
          return itemDate === today;
        });
        return filteredData;
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async getKitchenReport(parent, args, context, info) {
      const { startDate, endDate, branchID, OrderStatus } = args;
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      try {
        const { BranchData, Orders } = context.collections;
        const query = {};
        // query._id = "gaEncZjXwfkRPcwif";
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
        const ordersResp = await Orders.find(query)
          .sort({ createdAt: -1 })
          .toArray();
        // console.log(ordersResp.length);
        // console.log()
        // return

        const ordersWithId = ordersResp.map((order) => ({
          id: order._id,
          ...order,
        }));
        return ordersWithId;
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async getKitchenReportOptimized(parent, args, context, info) {
      const { startDate, endDate, branchID, OrderStatus, type } = args;
      if (context.user === undefined || context.user === null) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }
      try {
        const { Orders } = context.collections;
        const query = {};
        const filterStatus = [];
        if (type == "kitchenOrders") {
          filterStatus.push("new", "processing", "ready", "pickedUp", "picked");
        } else if (type == "completed") {
          filterStatus.push("delivered", "complete", "canceled");
        }
        console.log("filterStatus ", filterStatus);
        // let statuses=await Orders.distinct("workflow.status")
        // console.log("statuses ",statuses)
        // query._id = {$in:["giKsbwL4qHPNbmhSu","v4NxfoDHzyPGg9RwS"]}; // Example _id
        if (branchID) {
          query.branchID = branchID;
        }
        if (filterStatus && filterStatus.length > 0) {
          query["workflow.status"] = {
            $in: filterStatus,
          };
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
        console.log("query ", query);

        const ordersResp = await Orders.aggregate([
          { $match: query },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "RiderOrder",
              localField: "_id",
              foreignField: "OrderID",
              as: "riderOrderInfo",
            },
          },
          {
            $unwind: {
              path: "$riderOrderInfo",
              preserveNullAndEmptyArrays: true,
            },
          }, // Preserve documents even if riderOrderInfo is missing
          {
            $lookup: {
              from: "Accounts",
              localField: "riderOrderInfo.riderID",
              foreignField: "_id",
              as: "riderInfo",
            },
          },
          { $unwind: { path: "$riderInfo", preserveNullAndEmptyArrays: true } }, // Preserve documents even if riderInfo is missing
          {
            // Convert branchID to ObjectId and lookup in BranchData
            $addFields: {
              branchObjectId: { $toObjectId: "$branchID" }, // Convert branchID string to ObjectId
            },
          },
          {
            $lookup: {
              from: "BranchData", // The collection where branch information is stored
              localField: "branchObjectId", // Use the converted ObjectId field
              foreignField: "_id", // Field in BranchData that matches the branchID
              as: "branchDetails",
            },
          },
          {
            $unwind: {
              path: "$branchDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              isPaid: { $cond: [{ $eq: ["$paymentMethod", "EASYPAISA"] }, true, false] },
            },
          },
          {
            $project: {
              id: "$_id",
              _id: 1,
              startTime: "$riderOrderInfo.startTime",
              endTime: "$riderOrderInfo.endTime",
              createdAt: 1,
              updatedAt: 1,
              branchID: 1,
              placedFrom: 1,
              isPaid: 1,
              summary: {
                discountTotal: {
                  amount: { $sum: "$discounts.amount" },
                  __typename: "DiscountTotal",
                },
                __typename: "Summary",
              },
              payments: {
                $map: {
                  input: "$payments",
                  as: "payment",
                  in: {
                    finalAmount: "$$payment.finalAmount",
                    tax: "$$payment.tax",
                    totalAmount: "$$payment.totalAmount",
                    billingAddress: {
                      fullName: "$$payment.address.fullName",
                      phone: "$$payment.address.phone",
                      address1: "$$payment.address.address1",
                      city: "$$payment.address.city",
                      country: "$$payment.address.country",
                      postal: "$$payment.address.postal",
                      region: "$$payment.address.region",
                    },
                    __typename: "Payments",
                  },
                },
              },
              email: 1,
              kitchenOrderID: 1,
              paymentMethod: 1,
              status: "$workflow.status",
              branches: "$riderOrderInfo.branches",
              username: "$riderInfo.name",
              OrderStatus: "$riderOrderInfo.OrderStatus",
              riderOrderInfo: {
                _id: "$riderOrderInfo._id",
                startTime: "$riderOrderInfo.startTime",
                endTime: "$riderOrderInfo.endTime",
                __typename: "RiderOrderInfo",
              },
              riderInfo: {
                userId: "$riderInfo.userId",
                _id: "$riderInfo._id",
                firstName: "$riderInfo.profile.firstName",
                lastName: "$riderInfo.profile.lastName",
                phone: "$riderInfo.profile.phone",
                __typename: "RiderInfo",
              },
              fulfillmentGroups: {
                $map: {
                  input: "$shipping", // Map the shipping field
                  as: "shippingItem",
                  in: {
                    selectedFulfillmentOption: {
                      fulfillmentMethod: {
                        fulfillmentTypes: ["$$shippingItem.type"], // Correct
                        __typename: "FulfillmentMethod",
                      },
                      __typename: "FulfillmentOption",
                    },
                    items: {
                      nodes: {
                        $map: {
                          input: "$$shippingItem.items",
                          as: "item",
                          in: {
                            _id: "$$item._id",
                            quantity: "$$item.quantity",
                            optionTitle: "$$item.optionTitle",
                            title: "$$item.title",
                            variantTitle: "$$item.variantTitle",
                            attributes: {
                              $map: {
                                input: "$$item.attributes",
                                as: "attribute",
                                in: {
                                  label: "$$attribute.label",
                                  value: "$$attribute.value",
                                  __typename: "OrderItemAttribute",
                                },
                              },
                            },
                            // __typename: "OrderItem",
                          },
                        },
                        // __typename: "OrderItemConnection",
                      },
                    },
                    // __typename: "OrderFulfillmentGroup",
                  },
                },
                // __typename: "OrderFulfillmentGroups",
              },
              notes: {
                content: { $arrayElemAt: ["$notes.content", 0] }, // Access first element using $arrayElemAt
                createdAt: { $arrayElemAt: ["$notes.createdAt", 0] }, // Access first createdAt element using $arrayElemAt
                __typename: "Notes",
              },
              deliveryTime: 1,
              branchTimePickup: {
                branchOrderTime: "$riderOrderInfo.startTime",
                __typename: "BranchTimePickup",
              },
              customerInfo: {
                address1: { $arrayElemAt: ["$shipping.address.address1", 0] }, // Ensure address1 is treated as a string
                __typename: "CustomerInfo",
              },
              branchInfo: {
                _id: "$branchID",
                name: "$branchDetails.name", // Use the name from branchDetail
                __typename: "BranchInfo",
              },
            },
          },
        ]).toArray();

        console.log(ordersResp);
        // console.log(ordersResp[0]);
        // console.log("Random.id(), ", Random.id())
        // const ordersWithId = ordersResp.map((order) => ({
        //   _id: Random.id(),
        //   ...order,
        // }));
        // console.log(ordersWithId.length);
        // console.log(ordersWithId[0]);
        return ordersResp;
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async getCustomerOrderbyID(parent, args, context, info) {

      try {
        const { Orders, RiderOrder } = context.collections;
        const { ID } = args;
        console.log("context?.user?.id ", context?.user?.id)
        const CustomerOrderResp = await Orders.findOne({
          _id: decodeOpaqueId(ID).id,
        });
        if (CustomerOrderResp?.accountId != null && context?.user?.id != CustomerOrderResp?.accountId) {
          //Now check if it's rider asking for order info
          if (CustomerOrderResp?.accountId != null) {
            const riderOrderInfo = await RiderOrder.findOne({
              OrderID: CustomerOrderResp._id
            })
            // console.log("riderOrderInfo ", riderOrderInfo)
            if (riderOrderInfo?.riderID != context?.user?.id) {
              throw new ReactionError(
                "access-denied",
                "Unauthorized access. Please Login First"
              );
            }
          }

        }
        return CustomerOrderResp;
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async generateKitchenReport(parent, args, context, info) {
      try {
        let { authToken, userId, collections } = context;
        const {
          startDate,
          endDate,
          branchID,
          OrderStatus,
          searchQuery,
          ...connectionArgs
        } = args;
        if (context.user === undefined || context.user === null) {
          throw new ReactionError(
            "access-denied",
            "Unauthorized access. Please Login First"
          );
        }
        // console.log("here on testing ");
        const { BranchData, Orders } = collections;
        const query = {};
        let matchStage = [];
        if (branchID) {
          // query.branchID = branchID;
          matchStage.push({ branchID: branchID });
        }
        if (OrderStatus) {
          // query["workflow.status"] = OrderStatus;
          matchStage.push({ "workflow.status": OrderStatus });
        }
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          // query.createdAt = {
          //   $gte: start,
          //   $lte: end,
          // };
          matchStage.push({
            createdAt: {
              $gte: start,
              $lte: end,
            },
          });
        }
        if (searchQuery) {
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
            ],
          });
          const matchingIDs = [...matchingOrderIDs];
          // Adding the combined IDs to the matchStage
          console.log("matching ids are", matchingIDs);
          matchStage.push({
            _id: { $in: matchingIDs },
          });
        }
        let ordersResp = await Orders.find({ $and: matchStage });
        return getPaginatedResponse(ordersResp, connectionArgs, {
          includeHasNextPage: wasFieldRequested("pageInfo.hasNextPage", info),
          includeHasPreviousPage: wasFieldRequested(
            "pageInfo.hasPreviousPage",
            info
          ),
          includeTotalCount: wasFieldRequested("totalCount", info),
        });
      } catch (error) {
        console.log("error ", error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async getRiderReport(parent, args, context, info) {
      // console.log("args", info);
      try {
        let { collections } = context;
        if (context.user === undefined || context.user === null) {
          throw new ReactionError(
            "access-denied",
            "Unauthorized access. Please Login First"
          );
        }
        console.log("context.user ", context.user.UserRole);
        if (
          context.user.UserRole === "admin" ||
          context.user.UserRole === "dispatcher"
        ) {
          const { RiderOrder } = collections;
          let {
            branchId,
            riderID,
            startDate,
            endDate,
            itemPerPage,
            PageNumber,
          } = args;
          let itemsPerPage = itemPerPage ? itemPerPage : 10; // Number of items to display per page
          PageNumber = PageNumber ? PageNumber : 1;
          let skipAmount = (PageNumber - 1) * itemsPerPage;
          let pageCount = await RiderOrder.countDocuments({
            riderID: { $exists: true },
          });
          // console.log("pageCount", pageCount);
          // console.log("data1", pageCount / 10);
          // console.log("skipAmount ", skipAmount);
          // console.log("itemsPerPage", itemsPerPage);
          var matchStage = {};
          let query = [];
          matchStage = {
            $match: {
              riderID: { $exists: true },
              // createdAt: {
              //   // assuming your order has a createdAt field
              //   $gte: new Date(startDate),
              //   $lte: new Date(endDate),
              // },
            },
          };
          query.push(matchStage);
          if (startDate && endDate) {
            matchStage = {
              $match: {
                createdAt: {
                  $gte: new Date(startDate),
                  $lte: new Date(endDate),
                },
              },
            };
            query.push(matchStage);
          }

          if (branchId) {
            matchStage = {
              $match: {
                branches: branchId,
              },
            };
            query.push(matchStage);
          }
          if (riderID) {
            matchStage = {
              $match: {
                riderID: riderID,
              },
            };
            query.push(matchStage);
          }
          // console.log("query", query);

          let data = await RiderOrder.aggregate([
            ...query,
            // {
            //   $match: {
            //     riderOrderAmount: { $exists: true, $type: "number" },
            //   },
            // },
            {
              $group: {
                _id: "$riderID",
                totalOrders: { $sum: 1 },
                averageDeliveryTime: { $avg: "$deliveryTime" },
                cancelOrders: {
                  $sum: {
                    $cond: [{ $eq: ["$OrderStatus", "canceled"] }, 1, 0],
                  },
                },
                completeOrder: {
                  $sum: {
                    $cond: [{ $eq: ["$OrderStatus", "delivered"] }, 1, 0],
                  },
                },
                completeInTimeOrder: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$OrderStatus", "delivered"] },
                          { $lte: ["$deliveryTime", 25] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },

                //  {
                //   $sum: { $cond: [{ $lte: ["$deliveryTime", 25] }, 1, 0] },
                // },
                totalActiveTime: {
                  $sum: { $subtract: ["$endTime", "$startTime"] },
                },
                totalEarning: {
                  $sum: {
                    $cond: [
                      { $eq: ["$OrderStatus", "delivered"] },
                      "$riderOrderAmount",
                      0,
                    ],
                  },
                },
                // totalEarning: { $sum: "$riderOrderAmount" },
                totalManualOrders: { $sum: { $cond: ["$isManual", 1, 0] } },
                totalCustomerOrders: {
                  $sum: { $cond: ["$isManual", 0, 1] },
                },
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $addFields: {
                totalActiveTime: {
                  $let: {
                    vars: {
                      hours: {
                        $trunc: { $divide: ["$totalActiveTime", 3600000] },
                      },
                      minutes: {
                        $trunc: {
                          $divide: [
                            { $mod: ["$totalActiveTime", 3600000] },
                            60000,
                          ],
                        },
                      },
                    },
                    in: {
                      $concat: [
                        { $toString: "$$hours" },
                        "h ",
                        { $toString: "$$minutes" },
                        "m",
                      ],
                    },
                  },
                },
                averageDeliveryTime: {
                  $round: ["$averageDeliveryTime", 2],
                },
              },
            },
            {
              $project: {
                account: 0,
              },
            },
            {
              $skip: skipAmount,
            },
            {
              $limit: itemsPerPage,
            },
          ]).toArray();
          // console.log("data", data);
          // console.log("data", data);
          if (data.length > 0) {
            return {
              RiderReport: data,
              totalPages: Math.round(pageCount / 100),
            };
          } else {
            return {
              RiderReport: [],
              totalPages: 0,
            };
          }
        } else {
          throw new ReactionError(
            "access-denied",
            "You are not authorize for this action"
          );
        }
      } catch (error) {
        console.log(error);
        throw new ReactionError("access-denied", `${error}`);
      }
    },
    async getRiderOrder(parent, args, context, info) {
      // Ensure the user is authenticated
      if (!context.user) {
        throw new ReactionError(
          "access-denied",
          "Unauthorized access. Please Login First"
        );
      }

      try {
        const { riderOrderId } = args; // Extract riderOrderId from arguments

        const { RiderOrder } = context.collections; // Access the RiderOrder collection

        // Fetch the order with the specified id
        const dbRiderOrder = await RiderOrder.findOne({
          _id: ObjectID.ObjectId(riderOrderId),
        });

        // Return the order if found, otherwise return null
        return dbRiderOrder || null;
      } catch (error) {
        console.error("Error fetching rider order:", error.message);
        throw new ReactionError(
          "fetch-error",
          `Failed to fetch rider order: ${error.message}`
        );
      }
    },
    async isOrderTime(parent, args, context, info) {
      // Ensure the user is authenticated
      // if (!context.user) {
      //   throw new ReactionError(
      //     "access-denied",
      //     "Unauthorized access. Please Login First"
      //   );
      // }

      try {
        const startTime = "11:45 AM"; // Start time
        const endTime = "01:00 AM"; // End time on the next day
        const pakistanDate = moment().tz('Asia/Karachi'); // Get current Pakistan time
        const currentTime = pakistanDate; // Use the full moment object

        console.log("pakistanDate:", pakistanDate.format());
        console.log("currentTime:", currentTime.format());

        // Parse startMoment and endMoment
        let startMoment = moment.tz(
          `${pakistanDate.format('YYYY-MM-DD')} ${startTime}`,
          'YYYY-MM-DD hh:mm A',
          'Asia/Karachi'
        );

        let endMoment = moment.tz(
          `${pakistanDate.format('YYYY-MM-DD')} ${endTime}`,
          'YYYY-MM-DD hh:mm A',
          'Asia/Karachi'
        );

        console.log("startMoment (before adjustment):", startMoment.format());
        console.log("endMoment (before adjustment):", endMoment.format());

        // If end time is earlier than start time, adjust endMoment to the next day
        if (endMoment.isBefore(startMoment)) {
          endMoment.add(1, 'day');
        }

        console.log("startMoment (after adjustment):", startMoment.format());
        console.log("endMoment (after adjustment):", endMoment.format());

        // Check if the current time is within the range
        const isInRange = currentTime.isBetween(startMoment, endMoment);

        console.log("isInRange:", isInRange);
        console.log("currentTime ", currentTime)
        console.log("currentTime.format() ", currentTime.format())

        return {
          isOrderTime: isInRange,
          currentTime: currentTime.format()
        };
      } catch (error) {
        console.error("Error fetching rider order:", error.message);
        throw new ReactionError(
          "fetch-error",
          `Failed to fetch rider order: ${error.message}`
        );
      }
    },
  },
  Subscription: {
    orderMessage: {
      subscribe: () => pubSub.asyncIterator(["ORDER_ASSIGNED"]),
    },
  }
};
