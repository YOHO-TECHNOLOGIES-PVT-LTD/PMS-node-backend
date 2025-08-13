import cron from "node-cron"
import { LeaseModel } from "../../models/Lease/index.js";
import { TenantModel } from "../../models/Tenants/index.js";
import { NotifyModel } from "../../models/Notification/index.js";

// cron.schedule("* * * * *", async () => {
//     console.log("Checking for leases expiring within the next 30 days...");

//     try {
//         const today = new Date();
//         const oneMonthLater = new Date();
//         oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

//         const expiringLeases = await TenantModel.find({
//             tenant_type: "lease",
//             is_active: true,
//             is_deleted: false,
//             // lease_information: {
//             //     end_date: { $gte: today, $lte: oneMonthLater }
//             // }
//         }).populate({ path: "unit", model: "unit", populate: { path: "propertyId", model: "property" } });

//         console.log("Exppppp", expiringLeases)

//         if(!expiringLeases){
//             res.status(400).json({message: "No leases found"})
//         }

//         for (const lease of expiringLeases) {
//             const alreadyExists = await LeaseModel.findOne({
//                 _id: lease._id
//             });

//             if (!alreadyExists) {
//                 const leases = await LeaseModel.create({
//                     tenantId: lease._id,
//                     expiryDate: alreadyExists?.tenantId?.lease_information?.end_date,
//                 });
//                 await NotifyModel.create({
//                     title: `Lease Expiring Soon`,
//                     description: `${lease.personal_information.full_name} lease for ${lease.unit.name} at ${lease.unit.propertyId.property_name} will expire in ${leases.expiryDate}`,
//                     notify_type: 'rent',
//                     created_at: Date.now()
//                 })

//                 console.log(`Lease expiry record created for tenant: ${lease.personal_information?.full_name}`);
//             }
//         }

//         console.log("Lease expiry check complete!");
//     } catch (err) {
//         console.error("Error checking lease expiries:", err);
//     }
// });

export const getLeases = async (req, res) => {
    try {
        const Leases = await LeaseModel.find({ is_deleted: false }).populate({ path: "tenantId", model: "tenant", populate: { path: "unit", model: "unit", populate: { path: "propertyId", model: "property" } } })

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const leaseStats = await TenantModel.aggregate([
            {
                $facet: {
                    activeLeases: [
                        {
                            $match: {
                                "lease_duration.start_date": { $lte: today },
                                "lease_duration.end_date": { $gte: today },
                                is_active: true,
                            }
                        },
                        { $count: "count" }
                    ],
                    expiredLeases: [
                        {
                            $match: {
                                "lease_duration.end_date": { $lt: today }
                            }
                        },
                        { $count: "count" }
                    ],
                    expiringSoonThisMonth: [
                        {
                            $match: {
                                "lease_duration.end_date": {
                                    $gte: today,
                                    $lte: endOfMonth
                                }
                            }
                        },
                        { $count: "count" }
                    ],
                    totalDepositAmount: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$deposit" }
                            }
                        }
                    ]
                }
            }
        ]);


        const activeLeases = leaseStats[0].activeLeases[0]?.count || 0
        const expiredLeases = leaseStats[0].expiredLeases[0]?.count || 0
        const expiringSoonThisMonth = leaseStats[0].expiringSoonThisMonth[0]?.count || 0
        const totalDepositAmount = leaseStats[0].totalDepositAmount[0]?.total || 0

        res.status(200).json({
            success: true,
            message: "Leases retrieved successfully",
            data: {
                Leases,
                activeLeases,
                expiredLeases,
                expiringSoonThisMonth,
                totalDepositAmount
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching Leases" });
    }
};