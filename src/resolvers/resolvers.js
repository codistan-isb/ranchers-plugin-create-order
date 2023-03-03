// import ObjectID from "mongodb";
// export default {
//     Mutation: {
//         async createService(parent, args, context, info) {
//             try {
//                 // console.log(context.collections)
//                 let { Service } = context.collections;
//                 let { name, options } = args;

//                 let data = {
//                     name,
//                     options,
//                 };
//                 let createdServices = await Service.insertOne(data);
//                 // console.log("Created transaction is ", createdServices);
//                 // console.log("Created  is ", createdServices.ops);
//                 return createdServices.ops[0];

//             }
//             catch (err) {
//                 return err
//             }
//         },
//         async updateService(parent, args, context, info) {
//             try {
//                 let { Service } = context.collections;
//                 const { id, name, options } = args;
//                 // console.log(args)
//                 // console.log(id)
//                 // console.log(options)
//                 // console.log(options.price)
//                 const updatedContact = {};
//                 if (name) updatedContact.name = name;
//                 if (options) updatedContact.optionsName = options.name;
//                 if (options) updatedContact.optionsPrice = options.price;
//                 let approvedServices = await Service.findOneAndUpdate(
//                     {
//                         _id: id,
//                     },
//                     {
//                         $set: updatedContact
//                     }
//                 );
//                 // console.log(approvedServices);
//                 if (approvedServices)
//                     return approvedServices.value
//                 else return null
//             }
//             catch (err) {
//                 return err
//             }
//         },
//         async deleteService(parent, args, context, info) {
//             try {
//                 let { id } = args;
//                 let { Service } = context.collections;
//                 let data = {
//                     _id: ObjectID.ObjectId(id),
//                 };
//                 let updatedService = await Service.deleteOne(data);
//                 console.log(updatedService)
//                 if (updatedService?.length) return updatedService.result.electionid
//                 else return null
//             } catch (error) {
//                 return null
//             }
//         },
//     },
//     Query: {
//         async services(parent, args, context, info) {
//             try {
//                 let { Service } = context.collections;
//                 let allServices = await Service.find().toArray();
//                 console.log(allServices);
//                 if (allServices?.length) {
//                     return allServices.map(service => {
//                         console.log(service._id.toString())
//                         return {
//                             id: service._id.toString(),
//                             name: service.name,
//                             options: service.options
//                         }
//                     });
//                 } else {
//                     return null;
//                 }
//             } catch (error) {
//                 return error
//             }
//         },
//     }
// }