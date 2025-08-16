import cron from "node-cron";
import { RentsModel } from "../../models/Rent/index.js";
import { UnitsModel } from "../../models/Units/index.js";
import fs from "fs";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { TenantModel } from "../../models/Tenants/index.js";
import { NotifyModel } from "../../models/Notification/index.js";
import { ActivityLogModel } from "../../models/activity_log/index.js";
import { populate } from "dotenv";
import path from "path";

cron.schedule("5 0 1 * *", async () => {
    console.log("Starting monthly rent creation...");

    try {
        const tenants = await TenantModel.find({
            tenant_type: "rent",
            is_active: true,
            is_deleted: false
        }).populate({ path: "unit", model: "unit", populate: { path: "propertyId", model: "property" } });

        for (const tenant of tenants) {
            const unitDetails = await UnitsModel.findById(tenant.unit);

            if (!unitDetails) continue;

            const Rent = await RentsModel.create({
                tenantId: tenant._id,
                paymentDueDay: new Date(new Date().getFullYear(), new Date().getMonth(), 5),
                status: "pending"
            });

            const PaymentDueDay = Rent.paymentDueDay.toDateString()
            const PaymentDueMonth = Rent.paymentDueDay.toLocaleString("default", { month: "long", year: "numeric" })

            await NotifyModel.create({
                title: `Rent Due Reminder ${PaymentDueMonth}`,
                description: `${tenant.personal_information.full_name} your rent amount of ₹${tenant.rent} for ${tenant.unit.unit_name}(${tenant?.unit?.propertyId?.property_name}) is rent due on ${PaymentDueDay}. Please make the payment on time to avoid penalties.`,
                notify_type: 'rent',
                created_at: Date.now()
            })

            await ActivityLogModel.create({
                title: `Rent payment due is created`,
                details: `${tenant.personal_information.full_name} ${tenant.unit.unit_name} has rent due ${PaymentDueDay} (₹${tenant.rent})`,
                action: 'Create',
                activity_type: "rent"
            })

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

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const rents = await RentsModel.find({
            createdAt: { $gte: startDate, $lte: endDate },
            is_deleted: false
        }).populate({ path: "tenantId", model: "tenant", populate: { path: "unit", model: "unit" } });

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
                    paymentDueDay: { $gte: startDate, $lte: endDate },
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


        res.status(200).json({
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
    const user = req.user
    try {
        const { uuid } = req.params;
        const { status } = req.body;
        const rent = await RentsModel.findOneAndUpdate(
            { uuid: uuid },
            { status: status, reminderShown: false },
            { new: true }
        ).populate({ path: "tenantId", model: "tenant" });

        if (!rent) return res.status(404).json({ message: "Rent not found" });

        await ActivityLogModel.create({
            userId: user?._id,
            title: `Rent Payment Paid`,
            details: `${user?.first_name} to new paid status recorded tenant ${rent.tenantId.personal_information.full_name}.`,
            action: 'Update',
            activity_type: "rent"
        })

        res.status(200).json({ message: "Rent marked as paid", rent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// export const downloadRentPDF = (data, res) => {
//   try {
//     // Set response headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="rent_receipt_${data.receiptId}.pdf"`);

//     const doc = new PDFDocument({ size: 'A4', margin: 50 });
//     doc.pipe(res); // Pipe directly to response

//     // Font setup
//     const regularFont = 'Helvetica';
//     const boldFont = 'Helvetica-Bold';

//     // Format currency
//     const formatCurrency = (val) => 
//       val === 0 ? '0' : new Intl.NumberFormat('en-IN', { 
//         style: 'currency', 
//         currency: 'INR' 
//       }).format(val).replace('₹', '₹ ');

//     // Header Section (Left aligned)
//     doc.font(boldFont).fontSize(12)
//        .text('Karma', 50, 50)
//        .font(regularFont)
//        .text('karma@gmail.com', 50, 65)
//        .text('St. Louis, MO 63101', 50, 80)
//        .text('222 555 0000', 50, 95)
//        .text('Terrpoller.net', 50, 110);

//     // Title (Centered)
//     doc.moveDown(2)
//        .font(boldFont).fontSize(18)
//        .text('Rent Receipt', { align: 'center', underline: true })
//        .moveDown(1.5);

//     // Receipt Info (Two columns)
//     doc.fontSize(11)
//        .font(boldFont).text('Receipt ID:', 50, doc.y, { continued: true })
//        .font(regularFont).text(` ${data.receiptId}`)
//        .font(boldFont).text('Date:', { align: 'right', continued: true })
//        .font(regularFont).text(` ${data.date}`)
//        .moveDown(1.5);

//     // Tenant Property
//     doc.font(boldFont).text('Tenant Property:', 50, doc.y, { continued: true })
//        .font(regularFont).text(` ${data.property}`)
//        .moveDown(1);

//     // Tenant Details
//     doc.font(boldFont).text('Name:', 50, doc.y, { continued: true })
//        .font(regularFont).text(` ${data.tenantName}`)
//        .moveDown(0.5);

//     doc.font(boldFont).text('Address:', 50, doc.y, { continued: true })
//        .font(regularFont).text(` ${data.address}`)
//        .moveDown(0.5);

//     doc.font(boldFont).text('Contact:', 50, doc.y, { continued: true })
//        .font(regularFont).text(` ${data.contact}`)
//        .moveDown(2);

//     // Table Header
//     const tableTop = doc.y;
//     const descWidth = 400;
//     const amountWidth = 150;

//     doc.font(boldFont)
//        .text('Description', 50, tableTop)
//        .text('Amount', 450, tableTop, { width: amountWidth, align: 'right' })
//        .moveTo(50, tableTop + 20)
//        .lineTo(550, tableTop + 20)
//        .stroke()
//        .moveDown(0.5);

//     // Table Rows
//     const items = [
//       { desc: 'Basic Rent', amount: data.basicRent || 0 },
//       { desc: 'Late Fee', amount: data.lateFee || 0 },
//       { desc: 'Maintenance', amount: data.maintenance || 0 },
//       { desc: 'Subtotal', amount: data.subtotal || 0, bold: true },
//       { desc: 'CGST (9%)', amount: data.cgst || 0 },
//       { desc: 'SGST (8%)', amount: data.sgst || 0 },
//       { desc: 'Total Due', amount: data.total || 0, bold: true }
//     ];

//     items.forEach((item) => {
//       const y = doc.y;

//       if (item.bold) doc.font(boldFont); 
//       else doc.font(regularFont);

//       doc.text(item.desc, 50, y)
//          .text(formatCurrency(item.amount), 450, y, { width: amountWidth, align: 'right' })
//          .moveDown();

//       // Add horizontal line after subtotal
//       if (item.desc === 'Subtotal') {
//         doc.moveTo(50, doc.y - 10)
//            .lineTo(550, doc.y - 10)
//            .stroke();
//       }
//     });

//     // Payment Info
//     doc.moveDown(1.5)
//        .font(boldFont).text('Payment Info:')
//        .moveDown(0.5)
//        .font(regularFont)
//        .text(`Method: ${data.paymentMethod}`)
//        .moveDown(2);

//     // Terms and Conditions
//     doc.font(boldFont).text('Terms and Conditions:')
//        .moveDown(0.5)
//        .font(regularFont);

//     // Custom bullet points
//     const terms = [
//       'Rent due on the 1st of each month.',
//       'Late fee applies after the 5th.'
//     ];

//     terms.forEach(term => {
//       doc.text('•', 50, doc.y)
//          .text(term, 65, doc.y)
//          .moveDown(0.8);
//     });

//     // Footer (Centered at bottom)
//     doc.fontSize(10)
//        .text(
//          `For questions, contact ${data.yourName || '[YOUR NAME]'} at ${data.yourEmail || '[YOUR EMAIL]'}`,
//          50,
//          doc.page.height - 50,
//          { align: 'center', width: doc.page.width - 100 }
//        );

//     doc.end();

//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     res.status(500).send('Error generating receipt');
//   }
// };

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

export const deleteRent = async (req, res) => {
    try {
        const { uuid } = req.params;
        if (!uuid) {
            return res.status(400).json({ message: "UUID is Required" })
        }
        const deletedRent = await RentsModel.findOneAndUpdate({ uuid: uuid }, { is_deleted: true }, { new: true })
        if (!deletedRent) {
            return res.status(400).json({ message: "UUID is Required" })
        }

        await ActivityLogModel.create({
            userId: user?._id,
            title: `Rent Payment Paid`,
            details: `${user?.first_name} to new paid status recorded tenant ${rent.tenantId.personal_information.full_name}.`,
            action: 'Delete',
            activity_type: "rent"
        })

        return res.status(200).json({
            success: true,
            message: "Rent deleted is successfully",
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}


export const downloadRentPDF = async (req, res) => {
    try {
        const { uuid } = req.params;

        const rent = await RentsModel.findOne({ uuid })
            .populate({
                path: "tenantId",
                model: "tenant",
                populate: {
                    path: "unit",
                    model: "unit",
                    populate: { path: "propertyId", model: "property" }
                }
            });

        if (!rent) {
            return res.status(404).json({ success: false, message: "Rent not found" });
        }

        const logopath = path.join(process.cwd(), "public", "pmslogo.png")

        // Ensure numbers
        const monthlyRent = Number(rent.tenantId.financial_information.rent) || 0;
        const maintenance = Number(rent.tenantId.financial_information.maintenance) || 0;

        const subtotal = monthlyRent + maintenance;

        // Taxes
        const cgst = rent.tenantId.financial_information.cgst > 0 ? subtotal * 0.09 : 0
        const sgst = rent.tenantId.financial_information.sgst > 0 ? subtotal * 0.09 : 0

        // TDS (deduction)
        const tds = rent.tenantId.financial_information.cgst > 0 && rent.tenantId.financial_information.sgst > 0 ? subtotal * 0.10 : 0

        // Final total
        const total = subtotal + cgst + sgst - tds;

        const data = {
            items: [
                { description: "Monthly Rent", amount: monthlyRent },
                { description: "Maintenance", amount: maintenance }
            ],
            subtotal,
            cgst,
            sgst,
            tds,
            total,
            terms: [
                "Rent must be paid on or before the due date.",
                "Late payment may attract penalty.",
                "TDS has been deducted as per applicable rules."
            ]
        };

        // ================== PDF SETUP ==================
        const doc = new PDFDocument({ size: "A4", margin: 40 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${rent.uuid}.pdf`);

        doc.pipe(res);

        const sageGreen = "#8B9A7A";
        const darkGray = "#333333";
        const purple = "#8B3FBF";

        // Header background
        doc.rect(0, 0, 612, 120).fill(sageGreen);

        // Stripes
        // doc.strokeColor("white").lineWidth(3);
        // for (let i = -100; i < 700; i += 30) {
        //     doc.moveTo(i, 0).lineTo(i + 200, 120).stroke();
        // }

        // Logo placeholder
        doc.image(logopath, 450, 25, { width: 70, height: 70 });

        // Property info
        doc.fillColor("white").fontSize(12).font("Helvetica-Bold")
            .text(rent.tenantId.unit.propertyId.property_name, 50, 30);

        doc.fontSize(9).font("Helvetica")
            .text(rent.tenantId.unit.propertyId.owner_information.full_name, 50, 45)
            .text(rent.tenantId.unit.propertyId.property_address, 50, 57)
            .text(rent.tenantId.unit.propertyId.owner_information.phone, 50, 57)
            .text(rent.tenantId.unit.propertyId.owner_information.address, 50, 69)

        // Title
        doc.fillColor(darkGray).fontSize(24).font("Helvetica-Bold")
            .text("Rent Receipt", 50, 160, { align: "center" });

        // Receipt details
        doc.fontSize(10).font("Helvetica")
            .text(`Receipt ID: ${rent.receiptId}`, 50, 200)
            .text(`Date: ${rent.paymentDueDay.toLocaleDateString() || ""}`, 300, 200);

        // Tenant info
        doc.fontSize(11).font("Helvetica-Bold").text("Tenant :", 50, 240)
            .font("Helvetica").text(rent.tenantId.unit.unit_name, 150, 240);

        doc.font("Helvetica-Bold").text("Name :", 50, 255)
            .font("Helvetica").text(rent.tenantId.personal_information.full_name, 150, 255);

        doc.font("Helvetica-Bold").text("Contact :", 50, 270)
            .font("Helvetica").text(rent.tenantId.personal_information.phone || "", 150, 270);

        doc.font("Helvetica-Bold").text("Address :", 50, 285)
            .font("Helvetica").text(rent.tenantId.unit.unit_address || "", 150, 285);    

        // ================= TABLE =================
        const tableTop = 310;
        const tableLeft = 50;
        const tableWidth = 500;

        // Header
        doc.rect(tableLeft, tableTop, tableWidth, 25).fill("#f5f5f5").stroke("#cccccc");
        doc.fillColor(darkGray).fontSize(10).font("Helvetica-Bold")
            .text("Description", tableLeft + 10, tableTop + 8)
            .text("Amount", tableLeft + tableWidth - 80, tableTop + 8);

        // Rows
        let currentY = tableTop + 25;
        data.items.forEach(item => {
            const amount = Number(item.amount) || 0;
            doc.rect(tableLeft, currentY, tableWidth, 25).stroke("#cccccc");
            doc.fontSize(9).font("Helvetica").fillColor(darkGray)
                .text(item.description, tableLeft + 10, currentY + 8)
                .text(amount.toFixed(2), tableLeft + tableWidth - 80, currentY + 8);
            currentY += 25;
        });

        // Summary
        const summaryItems = [
            { label: "Subtotal", amount: data.subtotal },
            { label: "CGST (9%)", amount: data.cgst },
            { label: "SGST (9%)", amount: data.sgst },
            // { label: "TDS (-10%)", amount: -data.tds }
        ];

        summaryItems.forEach(item => {
            const amount = Number(item.amount) || 0;
            doc.rect(tableLeft, currentY, tableWidth, 25).stroke("#cccccc");

            // Bold only Subtotal
            if (item.label === "Subtotal") {
                doc.font("Helvetica-Bold");
            } else {
                doc.font("Helvetica");
            }

            doc.fontSize(9).fillColor(darkGray)
                .text(item.label, tableLeft + 10, currentY + 8)
                .text(amount.toFixed(2), tableLeft + tableWidth - 80, currentY + 8);

            currentY += 25;
        });


        // Total
        doc.rect(tableLeft, currentY, tableWidth, 25).fill("#f0f0f0").stroke("#cccccc");
        doc.fontSize(10).font("Helvetica-Bold").fillColor(darkGray)
            .text("Total Due", tableLeft + 10, currentY + 8)
            .text(data.total.toFixed(2), tableLeft + tableWidth - 80, currentY + 8);

        currentY += 50;

        // Payment Info
        doc.fontSize(10).font("Helvetica-Bold").text("Payment Info:", 50, currentY);
        doc.font("Helvetica").text(`Method: ${rent.paymentMethod || "Cash"}`, 50, currentY + 15);

        currentY += 50;

        // Terms
        doc.fontSize(10).font("Helvetica-Bold").text("Terms and Conditions:", 50, currentY);
        currentY += 20;
        data.terms.forEach(term => {
            doc.fontSize(9).font("Helvetica").text(`• ${term}`, 60, currentY);
            currentY += 15;
        });

        // Footer
        currentY += 30;
        doc.fontSize(9).font("Helvetica")
            .text("For questions, contact the property owner.", 50, currentY);

        // End PDF stream
        doc.end();

    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Error generating PDF" });
        }
    }
};
