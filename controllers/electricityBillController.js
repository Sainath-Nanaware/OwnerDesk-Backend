const mongoose = require("mongoose");
const ElectricityBill = require("../models/electricityBillModel");
const PaymentStatusModel=require("../models/paymentStatusModel")
const logger = require("../logs/logger");
const {createOrUpdatePaymentStatus}= require("../utils/paymentStatusService");

exports.createOrUpdateElectricityBill = async (req, res) => {
  logger.info("In create or update electricity bill")
  // console.log("requeste body",req.body)
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      ownerId,
      propertyId,
      roomId,
      tenantId,
      month,
      year,
      previousReading,
      currentReading,
      rate,
      charges,
    } = req.body;

    //----------------------------------------------------------
    // Validation
    //----------------------------------------------------------
    if (currentReading < previousReading) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Current reading cannot be less than previous reading.",
      });
    }

    //----------------------------------------------------------
    // Calculate Bill
    //----------------------------------------------------------
    const units = currentReading - previousReading;
    const amount = units * rate;

    //----------------------------------------------------------
    // Check Existing Bill
    //----------------------------------------------------------
    let bill = await ElectricityBill.findOne({
      ownerId,
      propertyId,
      roomId,
      month,
      year,
    }).session(session);

    let message = "";

    //----------------------------------------------------------
    // Update Existing Bill
    //----------------------------------------------------------
    if (bill) {
      bill.previousReading = previousReading;
      bill.currentReading = currentReading;
      bill.units = units;
      bill.rate = rate;
      bill.amount = amount;
      bill.generatedDate = new Date();

      await bill.save({ session });

      message = "Electricity bill updated successfully.";
    }

    //----------------------------------------------------------
    // Create New Bill
    //----------------------------------------------------------
    else {
      bill = await ElectricityBill.create(
        [
          {
            ownerId,
            propertyId,
            roomId,
            month,
            year,
            previousReading,
            currentReading,
            units,
            rate,
            amount,
          },
        ],
        { session }
      );

      bill = bill[0];

      message = "Electricity bill created successfully.";
    }

    //----------------------------------------------------------
    // TODO:
    // Update Payment Status Here
    //----------------------------------------------------------

    const paymentStatusData = await createOrUpdatePaymentStatus({
      session,
      ownerId,
      propertyId,
      roomId,
      tenantId,
      month,
      year,
      charges,
    });
    
    if(!paymentStatusData){
         await session.abortTransaction();
         logger.error("payment status collection not updated")
         return res.status(500).json({
           success: false,
           message: "Internal Server Error.",
           error: error.message,
         });
    }

    //----------------------------------------------------------
    // Commit Transaction
    //----------------------------------------------------------
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message,
      data: { bill ,paymentStatusData},
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};


//upadte aditional payment data in charges array
/**
 * Update a single charge inside PaymentStatus
 *
 * PATCH
 * /api/payment-status/:paymentStatusId/charges/:chargeId
 */
exports.updateCharge = async (req, res) => {
  logger.info("In update charge")
  const session = await mongoose.startSession();

  try {
    const { paymentStatusId, chargeId } = req.params;

    const {
      type,
      amount,
      paidAmount,
      paidDate,
      remarks,
      referenceId,
      referenceModel,
    } = req.body;

    /**
     * ---------------------------------------------------------
     * 1. Validate IDs
     * ---------------------------------------------------------
     */

    if (!mongoose.Types.ObjectId.isValid(paymentStatusId)) {
      logger.error("Payment status ID not found!")
      return res.status(400).json({
        success: false,
        message: "Invalid paymentStatusId.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(chargeId)) {
      logger.error("Charge Id not found!")
      return res.status(400).json({
        success: false,
        message: "Invalid chargeId.",
      });
    }

    /**
     * ---------------------------------------------------------
     * 2. Start transaction
     * ---------------------------------------------------------
     */

    session.startTransaction();

    /**
     * ---------------------------------------------------------
     * 3. Find PaymentStatus
     * ---------------------------------------------------------
     */

    const paymentStatus = await PaymentStatusModel.findById(
      paymentStatusId
    ).session(session);

    if (!paymentStatus) {
      await session.abortTransaction();
      logger.error("PaymentStatusId not found!")
      return res.status(404).json({
        success: false,
        message: "Payment status not found.",
      });
    }

    /**
     * ---------------------------------------------------------
     * 4. Find charge inside charges array
     * ---------------------------------------------------------
     */

    const charge = paymentStatus.charges.find(
      (item) => item._id.toString() === chargeId
    );

    if (!charge) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Charge ID not found.",
      });
    }
    /**
     * ---------------------------------------------------------
     * 5. Validate amount / paidAmount
     * ---------------------------------------------------------
     */

    const newAmount =
      amount !== undefined ? Number(amount) : Number(charge.amount);

    const newPaidAmount =
      paidAmount !== undefined ? Number(paidAmount) : Number(charge.paidAmount);

    if (newPaidAmount > newAmount) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be greater than charge amount.",
      });
    }

    /**
     * ---------------------------------------------------------
     * 6. Update only supplied fields
     * ---------------------------------------------------------
     */

    if (type !== undefined) {
      charge.type = type;
    }

    if (amount !== undefined) {
      charge.amount = Number(amount);
    }

    if (paidAmount !== undefined) {
      charge.paidAmount = Number(paidAmount);
    }

    if (paidDate !== undefined) {
      charge.paidDate = paidDate;
    }

    if (remarks !== undefined) {
      charge.remarks = remarks;
    }

    if (referenceId !== undefined) {
      charge.referenceId = referenceId;
    }

    if (referenceModel !== undefined) {
      charge.referenceModel = referenceModel;
    }

    /**
     * ---------------------------------------------------------
     * 7. Automatically calculate charge status
     * ---------------------------------------------------------
     */

    if (charge.paidAmount >= charge.amount) {
      charge.status = "paid";
    } else {
      charge.status = "unpaid";
    }

    /**
     * ---------------------------------------------------------
     * 8. Recalculate PaymentStatus totals
     * ---------------------------------------------------------
     */

    let totalAmount = 0;
    let totalReceived = 0;

    paymentStatus.charges.forEach((item) => {
      totalAmount += Number(item.amount || 0);
      totalReceived += Number(item.paidAmount || 0);

      /**
       * Also make sure every charge status
       * is correct.
       */
      if (item.paidAmount >= item.amount) {
        item.status = "paid";
      } else {
        item.status = "unpaid";
      }
    });

    paymentStatus.totalAmount = totalAmount;
    paymentStatus.totalReceived = totalReceived;

    paymentStatus.dueAmount = Math.max(totalAmount - totalReceived, 0);

    /**
     * ---------------------------------------------------------
     * 9. Calculate overall payment status
     * ---------------------------------------------------------
     */

    if (totalReceived >= totalAmount && totalAmount > 0) {
      paymentStatus.paymentStatus = "paid";
    } else {
      paymentStatus.paymentStatus = "unpaid";
    }

    /**
     * ---------------------------------------------------------
     * 10. Save
     * ---------------------------------------------------------
     */

    await paymentStatus.save({ session });

    /**
     * ---------------------------------------------------------
     * 11. Commit transaction
     * ---------------------------------------------------------
     */

    await session.commitTransaction();

    /**
     * ---------------------------------------------------------
     * 12. Response
     * ---------------------------------------------------------
     */
    logger.info("charge update successfully!")
    return res.status(200).json({
      success: true,
      message: "Charge updated successfully.",
      data: {
        paymentStatusId: paymentStatus._id,
        charge: charge,
        totalAmount: paymentStatus.totalAmount,
        totalReceived: paymentStatus.totalReceived,
        dueAmount: paymentStatus.dueAmount,
        paymentStatus: paymentStatus.paymentStatus,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    looger.error("update charge error!")
    console.error("Update Charge Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Delete a particular charge from PaymentStatus
 *
 * DELETE
 * /api/payment-status/:paymentStatusId/charges/:chargeId
 *
 * Example:
 * DELETE /api/payment-status/68abc123/charges/68xyz789
 */
exports.deleteCharge = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { paymentStatusId, chargeId } = req.params;

    // --------------------------------------------------
    // 1. Validate PaymentStatus ID
    // --------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(paymentStatusId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid paymentStatusId.",
      });
    }

    // --------------------------------------------------
    // 2. Validate Charge ID
    // --------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(chargeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chargeId.",
      });
    }

    // --------------------------------------------------
    // 3. Start MongoDB transaction
    // --------------------------------------------------

    session.startTransaction();

    // --------------------------------------------------
    // 4. Find PaymentStatus
    // --------------------------------------------------

    const paymentStatus = await PaymentStatusModel.findById(paymentStatusId).session(
      session
    );

    if (!paymentStatus) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Payment status not found.",
      });
    }

    // --------------------------------------------------
    // 5. Find charge inside charges array
    // --------------------------------------------------

    const chargeIndex = paymentStatus.charges.findIndex(
      (charge) => charge._id.toString() === chargeId
    );

    // Charge does not exist
    if (chargeIndex === -1) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Charge not found.",
      });
    }

    // Keep deleted charge information for response
    const deletedCharge = paymentStatus.charges[chargeIndex];

    // --------------------------------------------------
    // 6. Remove only selected charge
    // --------------------------------------------------

    paymentStatus.charges.splice(chargeIndex, 1);

    // --------------------------------------------------
    // 7. Recalculate total amount
    // --------------------------------------------------

    let totalAmount = 0;
    let totalReceived = 0;

    paymentStatus.charges.forEach((charge) => {
      totalAmount += Number(charge.amount || 0);
      totalReceived += Number(charge.paidAmount || 0);
    });

    // --------------------------------------------------
    // 8. Update PaymentStatus totals
    // --------------------------------------------------

    paymentStatus.totalAmount = totalAmount;

    paymentStatus.totalReceived = totalReceived;

    paymentStatus.dueAmount = Math.max(totalAmount - totalReceived, 0);

    // --------------------------------------------------
    // 9. Recalculate overall payment status
    // --------------------------------------------------

    if (totalAmount === 0) {
      paymentStatus.paymentStatus = "unpaid";
    } else if (totalReceived >= totalAmount) {
      paymentStatus.paymentStatus = "paid";
    } else {
      paymentStatus.paymentStatus = "unpaid";
    }

    // --------------------------------------------------
    // 10. Save updated PaymentStatus
    // --------------------------------------------------

    await paymentStatus.save({ session });

    // --------------------------------------------------
    // 11. Commit transaction
    // --------------------------------------------------

    await session.commitTransaction();

    // --------------------------------------------------
    // 12. Send response
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Charge deleted successfully.",

      data: {
        paymentStatusId: paymentStatus._id,

        deletedCharge: {
          _id: deletedCharge._id,
          type: deletedCharge.type,
          amount: deletedCharge.amount,
          paidAmount: deletedCharge.paidAmount,
        },

        summary: {
          totalAmount: paymentStatus.totalAmount,
          totalReceived: paymentStatus.totalReceived,
          dueAmount: paymentStatus.dueAmount,
          paymentStatus: paymentStatus.paymentStatus,
        },

        charges: paymentStatus.charges,
      },
    });
  } catch (error) {
    // --------------------------------------------------
    // Rollback transaction
    // --------------------------------------------------

    await session.abortTransaction();

    console.error("Delete Charge Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  } finally {
    // --------------------------------------------------
    // Always close MongoDB session
    // --------------------------------------------------

    await session.endSession();
  }
};