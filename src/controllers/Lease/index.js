import cron from "node-cron"
import { LeaseModel } from "../../models/Lease";
import { TenantModel } from "../../models/Tenants";
import { RentsModel } from "../../models/Rent";

cron.schedule("0 0 * * *", async () => {
    console.log("Checking for leases expiring within the next 30 days...");

    try {
        const today = new Date();
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

        const expiringLeases = await TenantModel.find({
            tenant_type: "lease",
            is_active: true,
            is_deleted: false,
            lease_information: {
                end_date: { $gte: today, $lte: oneMonthLater }
            }
        }).populate({ path: "tenantId", model: "tenant", populate: { path: "unit", model: "unit", populate: { path: "propertyId", model: "property" } } });

        for (const lease of expiringLeases) {
            // Check if already recorded to avoid duplicates
            const alreadyExists = await LeaseModel.findOne({
                leaseId: lease._id
            });

            if (!alreadyExists) {
                await LeaseModel.create({
                    tenantId: lease.tenantId?._id,
                    unitId: lease.tenantId?.unit?._id,
                    propertyId: lease.tenantId?.unit?.propertyId?._id,
                    expiryDate: lease.lease_end_date,
                    status: "pending"
                });

                console.log(`Lease expiry record created for tenant: ${lease.tenantId?.personal_information?.full_name}`);
            }
        }

        console.log("Lease expiry check complete!");
    } catch (err) {
        console.error("Error checking lease expiries:", err);
    }
});

export const getLeases = async (req, res) => {
    try {
        const Leases = await RentsModel.find({ is_deleted: false }).populate({ path: "tenantId", model: "tenant", populate: { path: "unit", model: "unit", populate: { path: "propertyId", model: "property" } } })

        res.status.json({
            success: true,
            message: "Leases retrieved successfully",
            data: Leases
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching rents" });
    }
};