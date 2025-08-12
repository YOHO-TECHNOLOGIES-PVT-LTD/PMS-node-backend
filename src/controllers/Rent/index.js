import cron from "node-cron";
import { RentsModel } from "../../models/Rent/index.js";
import { UnitsModel } from "../../models/Units/index.js";
import fs from "fs";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { TenantModel } from "../../models/Tenants/index.js";

cron.schedule("5 0 1 * *", async () => {
    console.log("Starting monthly rent creation...");

    try {
        const tenants = await TenantModel.find({
            tenant_type: "rent",
            is_active: true,
            is_deleted: false
        }).populate({ path: "unit", model: "unit" });

        for (const tenant of tenants) {
            const unitDetails = await UnitsModel.findById(tenant.unit);

            if (!unitDetails) continue;

            await RentsModel.create({
                propertyId: tenant.property_name,
                tenantId: tenant._id,
                paymentDueDay: new Date(new Date().getFullYear(), new Date().getMonth(), 5),
                status: "pending"
            });

            console.log(`Rent created for tenant ${tenant.personal_information.full_name}`);
        }

        console.log("Monthly rent creation complete!");
    } catch (err) {
        console.error("Error creating monthly rents:", err);
    }
});

export const getRents = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and Year are required" });
        }
        const now = new Date();
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const rents = await RentsModel.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).populate("propertyId tenantId");

        const TotalDue = await TenantModel.aggregate([
            {
                $match: {
                    tenant_type: "rent",
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$rent" }
                }
            }
        ]);

        const totalDueAmount = TotalDue.length > 0 ? TotalDue[0].total : 0;

        const stats = await RentsModel.aggregate([
            {
                $match: {
                    due_date: { $gte: startOfMonth, $lte: endOfMonth },
                    status: { $in: ["paid", "pending"] }
                }
            },
            {
                $lookup: {
                    from: "tenants",
                    localField: "tenant_id",
                    foreignField: "_id",
                    as: "tenant"
                }
            },
            { $unwind: "$tenant" },
            {
                $group: {
                    _id: "$status",
                    totalAmount: { $sum: "$tenant.rent" }
                }
            }
        ]);

        const totalPaidThisMonth = stats.find(s => s._id === "paid")?.totalAmount || 0;
        const totalPendingThisMonth = stats.find(s => s._id === "pending")?.totalAmount || 0;


        res.status.json({
            success: true,
            message: "Rents retrieved successfully",
            data: {
                rents,
                totalDueAmount,
                totalPaidThisMonth,
                totalPendingThisMonth
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching rents" });
    }
};



export const markRentPaidByUUID = async (req, res) => {
    try {
        const { uuid } = req.params;

        const rent = await RentsModel.findByIdAndUpdate(
            { uuid: uuid },
            { status: "paid", reminderShown: false },
            { new: true }
        );

        if (!rent) return res.status(404).json({ message: "Rent not found" });

        res.json({ message: "Rent marked as paid", rent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const downloadRentPDF = async (req, res) => {
    try {
        const { uuid } = req.params;
        const rent = await RentsModel.findOne({ uuid: uuid })
            .populate({ path: "tenantId", model: "tenant", populate: { path: "unit", model: "unit", populate: { path: "propertyId", model: "property" } } })

        if (!rent) return res.status(404).json({ message: "Rent not found" });

        const doc = new PDFDocument();
        const filePath = `./rent_receipts/${rent.uuid}.pdf`;
        doc.pipe(fs.createWriteStream(filePath));

        doc.fontSize(18).text("Rent Payment Receipt", { align: "center" });
        doc.moveDown();
        doc.text(`Receipt ID: ${rent.uuid}`);
        doc.text(`Tenant: ${rent.tenantId?.personal_information?.full_name}`);
        doc.text(`Property: ${rent.tenantId?.unit?.propertyId?.property_name}`);
        doc.text(`Status: ${rent.status}`);
        doc.text(`Due Date: ${rent.paymentDueDay.toDateString()}`);

        doc.end();

        doc.on("finish", () => {
            res.download(filePath, `${rent.uuid}.pdf`);
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating PDF" });
    }
};

export const downloadMonthlyExcel = async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const rents = await RentsModel.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).populate({ path: "tenantId", model: "tenant", populate: { path: "unit", model: "unit", populate: { path: "propertyId", model: "property" } } });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Monthly Rents");

        sheet.columns = [
            { header: "UUID", key: "uuid", width: 36 },
            { header: "Tenant", key: "tenant", width: 20 },
            { header: "Property", key: "property", width: 20 },
            { header: "Due Date", key: "due", width: 15 },
            { header: "Status", key: "status", width: 10 },
        ];

        rents.forEach(rent => {
            sheet.addRow({
                uuid: rent.uuid,
                tenant: rent.tenantId?.personal_information?.full_name,
                property: rent.tenantId?.unit?.propertyId?.property_name,
                due: rent.paymentDueDay.toDateString(),
                status: rent.status
            });
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=monthly_rents_${month}_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating Excel" });
    }
};