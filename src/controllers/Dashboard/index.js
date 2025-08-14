import { PropertyModel } from "../../models/Properties/index.js";
import { RentsModel } from "../../models/Rent/index.js";
import { TenantModel } from "../../models/Tenants/index.js";
import moment from "moment";
import { UnitsModel } from "../../models/Units/index.js";
import { maintenance } from "../../models/maintenance/index.js";

export const dashBoardReports = async (req, res) => {
    try {
        const year = 2025;
        const month = 8;

        const startOfMonth = moment().year(year).month(month - 1).startOf("month").toDate();
        const endOfMonth = moment().year(year).month(month - 1).endOf("month").toDate();
        const today = moment();
        const next30Days = moment().add(30, "days").toDate();

        const PropertiesTotal = await PropertyModel.aggregate([
            { $match: { is_deleted: false } },
            { $group: { _id: "$property_type", count: { $sum: 1 } } }
        ]);

        const totalTenants = await TenantModel.countDocuments({ is_deleted: false });

        const newTenantsThisMonth = await TenantModel.countDocuments({
            is_deleted: false,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const leasesExpiringSoon = await TenantModel.countDocuments({
            is_deleted: false,
            "lease_duration.end_date": { $gte: today.toDate(), $lte: next30Days }
        });

        const rentsPaidThisMonth = await RentsModel.find({
            status: "paid",
            paymentDueDay: { $gte: startOfMonth, $lte: endOfMonth }
        }).populate({ path: "tenantId", model: "tenant" });

        const totalMonthlyRevenue = rentsPaidThisMonth.reduce((sum, rent) => {
            return sum + (rent.tenantId?.rent || 0);
        }, 0);

        const rentsPendingThisMonth = await RentsModel.find({
            status: { $in: ["pending", "overdue"] },
            paymentDueDay: { $gte: startOfMonth, $lte: endOfMonth }
        }).populate({ path: "tenantId", model: "tenant" });

        const totalMonthlyPending = rentsPendingThisMonth.reduce((sum, rent) => {
            return sum + (rent.tenantId?.rent || 0);
        }, 0);

        const expectedRentThisMonth = await TenantModel.aggregate([
            { $match: { is_deleted: false } },
            { $group: { _id: null, total: { $sum: "$rent" } } }
        ]);
        const totalExpected = expectedRentThisMonth[0]?.total || 0;

        const collectionRate = totalExpected > 0
            ? ((totalMonthlyRevenue / totalExpected) * 100).toFixed(2)
            : 0;

        const yearlyRevenue = await RentsModel.aggregate([
            {
                $match: {
                    status: "paid",
                    due_date: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${year + 1}-01-01`)
                    }
                }
            },
            {
                $lookup: {
                    from: "tenants",
                    localField: "tenantId",
                    foreignField: "_id",
                    as: "tenantData"
                }
            },
            { $unwind: "$tenantData" },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$tenantData.rent" }
                }
            }
        ]);
        const YearlyRevenue = yearlyRevenue[0]?.total || 0;

        const overallRevenue = await RentsModel.aggregate([
            { $match: { status: "paid" } },
            {
                $lookup: {
                    from: "tenants",
                    localField: "tenantId",
                    foreignField: "_id",
                    as: "tenantData"
                }
            },
            { $unwind: "$tenantData" },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$tenantData.rent" }
                }
            }
        ]);
        const OverAllRevenue = overallRevenue[0]?.total || 0;


        const monthlyRevenueGraph = await RentsModel.aggregate([
            { $match: { status: "paid" } },
            {
                $lookup: {
                    from: "tenants",
                    localField: "tenantId",
                    foreignField: "_id",
                    as: "tenant"
                }
            },
            { $unwind: "$tenant" },

            {
                $group: {
                    _id: {
                        year: { $year: "$paymentDueDay" },
                        month: { $month: "$paymentDueDay" }
                    },
                    total: { $sum: "$tenant.rent" }
                }
            },

            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);


        const yearlyRevenueGraph = await RentsModel.aggregate([
            { $match: { status: "paid" } },
            {
                $group: {
                    _id: { year: { $year: "$paymentDueDay" } },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1 } }
        ]);

        const totalUnits = await UnitsModel.countDocuments({ is_deleted: false });
        const occupancyGraph = await TenantModel.aggregate([
            {
                $match: {
                    is_deleted: false,
                    is_active: true,
                    unit: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: "units",
                    localField: "unit",
                    foreignField: "_id",
                    as: "unitDetails"
                }
            },
            { $unwind: "$unitDetails" },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    occupiedCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    month: "$_id.month",
                    year: "$_id.year",
                    occupiedCount: 1,
                    occupancyRate: {
                        $multiply: [{ $divide: ["$occupiedCount", totalUnits] }, 100]
                    }
                }
            },
            { $sort: { "year": 1, "month": 1 } }
        ]);

        const paymentStatusBreakdownGraph = await RentsModel.aggregate([
            {
                $match: {
                    paymentDueDay: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const rentdata = await RentsModel.find().populate({ path: "tenantId", select: "rent _id" })
        const maintain = await maintenance.find()
        const rentCollectionGraph = generateReport(rentdata, maintain)


        // const rentCollectionGraph = await RentsModel.aggregate([
        //     {
        //         $group: {
        //             _id: { year: { $year: "$paymentDueDay" }, month: { $month: "$paymentDueDay" } },
        //             totalExpected: { $sum: "$amount" },
        //             collected: {
        //                 $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] }
        //             }
        //         }
        //     },
        //     {
        //         $addFields: {
        //             collectionRate: {
        //                 $cond: {
        //                     if: { $eq: ["$totalExpected", 0] },
        //                     then: 0,
        //                     else: { $multiply: [{ $divide: ["$collected", "$totalExpected"] }, 100] }
        //                 }
        //             }
        //         }
        //     }
        // ]);

        res.status(200).json({
            data: {
                PropertiesTotal,
                totalTenants,
                newTenantsThisMonth,
                leasesExpiringSoon,
                totalMonthlyRevenue,
                totalExpected,
                collectionRate: `${collectionRate}%`,
                YearlyRevenue,
                OverAllRevenue,
                totalMonthlyPending,
                monthlyRevenueGraph,
                yearlyRevenueGraph,
                occupancyGraph,
                paymentStatusBreakdownGraph,
                rentCollectionGraph
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


function generateReport(data, expence) {
    try {
        const monthly = {
            jan: { exp: 0, rev: 0 },
            feb: { exp: 0, rev: 0 },
            mar: { exp: 0, rev: 0 },
            apr: { exp: 0, rev: 0 },
            may: { exp: 0, rev: 0 },
            jun: { exp: 0, rev: 0 },
            jul: { exp: 0, rev: 0 },
            aug: { exp: 0, rev: 0 },
            sep: { exp: 0, rev: 0 },
            oct: { exp: 0, rev: 0 },
            nov: { exp: 0, rev: 0 },
            dec: { exp: 0, rev: 0 },
        };

        const yearly = { exp: 0, rev: 0 }; // <-- new yearly totals

        // Revenue loop
        data.forEach((list) => {
            const month = new Date(list?.createdAt).getMonth();
            const rent = list?.tenantId?.rent || 0;

            yearly.rev += rent; // add to yearly revenue

            switch (month) {
                case 0: monthly.jan.rev += rent; break;
                case 1: monthly.feb.rev += rent; break;
                case 2: monthly.mar.rev += rent; break;
                case 3: monthly.apr.rev += rent; break;
                case 4: monthly.may.rev += rent; break;
                case 5: monthly.jun.rev += rent; break;
                case 6: monthly.jul.rev += rent; break;
                case 7: monthly.aug.rev += rent; break;
                case 8: monthly.sep.rev += rent; break;
                case 9: monthly.oct.rev += rent; break;
                case 10: monthly.nov.rev += rent; break;
                case 11: monthly.dec.rev += rent; break;
                default: throw new Error("Month not correct");
            }
        });

        // Expense loop
        expence.forEach((list) => {
            const month = new Date(list?.createdAt).getMonth();
            const cost = list?.estmate_cost || 0;

            yearly.exp += cost; // add to yearly expense

            switch (month) {
                case 0: monthly.jan.exp += cost; break;
                case 1: monthly.feb.exp += cost; break;
                case 2: monthly.mar.exp += cost; break;
                case 3: monthly.apr.exp += cost; break;
                case 4: monthly.may.exp += cost; break;
                case 5: monthly.jun.exp += cost; break;
                case 6: monthly.jul.exp += cost; break;
                case 7: monthly.aug.exp += cost; break;
                case 8: monthly.sep.exp += cost; break;
                case 9: monthly.oct.exp += cost; break;
                case 10: monthly.nov.exp += cost; break;
                case 11: monthly.dec.exp += cost; break;
                default: throw new Error("Month not correct");
            }
        });

        return { monthly, yearly }; // return both
    } catch (error) {
        console.log(error);
    }
}
