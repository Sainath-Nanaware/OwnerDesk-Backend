const mongoose = require("mongoose");
const ElectricityBill = require("../models/electricityBillModel");
const logger = require("../logs/logger");
const {createOrUpdatePaymentStatus}= require("../utils/paymentStatusService");

exports.createOrUpdateElectricityBill = async (req, res) => {
  logger.info("create or update electricity bill")
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
