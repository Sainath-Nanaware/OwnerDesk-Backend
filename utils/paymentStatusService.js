const PaymentStatus = require("../models/paymentStatusModel");

/**
 * Recalculate payment summary
 */
const recalculateTotals = (paymentStatus) => {
  let totalAmount = 0;
  let totalReceived = 0;

  paymentStatus.charges.forEach((charge) => {
    totalAmount += Number(charge.amount || 0);
    totalReceived += Number(charge.paidAmount || 0);

    // Update individual charge status
    if (charge.paidAmount <= 0) {
      charge.status = "unpaid";
    } else if (charge.paidAmount >= charge.amount) {
      charge.status = "paid";
    }
    //  else {
    //   charge.status = "Partially Paid";
    // }
  });

  paymentStatus.totalAmount = totalAmount;
  paymentStatus.totalReceived = totalReceived;
  paymentStatus.dueAmount = totalAmount - totalReceived;

  // Overall payment status
  if (paymentStatus.totalReceived <= 0) {
    paymentStatus.paymentStatus = "unpaid";
  } else if (paymentStatus.dueAmount <= 0) {
    paymentStatus.paymentStatus = "paid";
  }
  //  else {
  //   paymentStatus.paymentStatus = "Partially Paid";
  // }
};

/**
 * Create or Update Monthly Payment Status
 */
const createOrUpdatePaymentStatus = async ({
  session,
  ownerId,
  propertyId,
  roomId,
  tenantId,
  month,
  year,
  charges,
}) => {
  //----------------------------------------------------------
  // Find monthly payment record
  //----------------------------------------------------------
  let paymentStatus = await PaymentStatus.findOne({
    ownerId,
    propertyId,
    roomId,
    tenantId,
    month,
    year,
  }).session(session);

  //----------------------------------------------------------
  // Create new monthly record if not exists
  //----------------------------------------------------------
  if (!paymentStatus) {
    paymentStatus = new PaymentStatus({
      ownerId,
      propertyId,
      roomId,
      tenantId,
      month,
      year,
      charges: [],
    });
  }

  //----------------------------------------------------------
  // Create lookup map for existing charges
  //----------------------------------------------------------
  const chargeMap = new Map();

  paymentStatus.charges.forEach((charge, index) => {
    chargeMap.set(charge.type, index);
  });

  //----------------------------------------------------------
  // Insert / Update Charges
  //----------------------------------------------------------
  for (const charge of charges) {
    const newCharge = {
      type: charge.type,
      amount: Number(charge.amount || 0),

      paidAmount: Number(charge.paidAmount ?? 0),

      status: charge.status ?? "pending",

      paidDate: charge.paidDate ?? null,

      remarks: charge.remarks ?? "",

      referenceId: charge.referenceId ?? null,

      referenceModel: charge.referenceModel ?? null,
    };

    //------------------------------------------------------
    // Update Existing Charge
    //------------------------------------------------------
    if (chargeMap.has(newCharge.type)) {
      const index = chargeMap.get(newCharge.type);

      // Preserve payment information if not supplied
      newCharge.paidAmount =
        charge.paidAmount ?? paymentStatus.charges[index].paidAmount;

      newCharge.paidDate =
        charge.paidDate ?? paymentStatus.charges[index].paidDate;

      newCharge.status = charge.status ?? paymentStatus.charges[index].status;

      paymentStatus.charges[index] = newCharge;
    }

    //------------------------------------------------------
    // Add New Charge
    //------------------------------------------------------
    else {
      paymentStatus.charges.push(newCharge);
    }
  }

  //----------------------------------------------------------
  // Recalculate Totals
  //----------------------------------------------------------
  recalculateTotals(paymentStatus);

  //----------------------------------------------------------
  // Tell mongoose nested array changed
  //----------------------------------------------------------
  paymentStatus.markModified("charges");

  //----------------------------------------------------------
  // Save
  //----------------------------------------------------------
  await paymentStatus.save({ session });

  return paymentStatus;
};

module.exports = {
  createOrUpdatePaymentStatus,
  recalculateTotals,
};
