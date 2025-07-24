const migrations = (oldRealm, newRealm) => {
  if (oldRealm.schemaVersion < 5) {
    const oldPremiumObjects = oldRealm.objects('Premium');
    const newPremiumObjects = newRealm.objects('Premium');

    for (let i = 0; i < oldPremiumObjects.length; i++) {
      newPremiumObjects[i].type = oldPremiumObjects[i].type_string;
      newPremiumObjects[i].applicable_activity =
        oldPremiumObjects[i].applicable_activity_string;
    }

    const oldPTnxObjects = oldRealm.objects('Transaction');
    const newTnxObjects = newRealm.objects('Transaction');

    for (let i = 0; i < oldPTnxObjects.length; i++) {
      newTnxObjects[i].type = oldPTnxObjects[i].type_string;
      newTnxObjects[i].verification_method =
        oldPTnxObjects[i].verification_method_string;
    }

    const oldPTnxPremiumObjects = oldRealm.objects('TransactionPremium');
    const newTnxPremiumObjects = newRealm.objects('TransactionPremium');

    for (let i = 0; i < oldPTnxPremiumObjects.length; i++) {
      newTnxPremiumObjects[i].verification_method =
        oldPTnxPremiumObjects[i].verification_method_string;
    }
  }

  if (oldRealm.schemaVersion < 12) {
    const oldNodeObjects = oldRealm.objects('Node');
    const newNodeObjects = newRealm.objects('Node');

    for (let i = 0; i < oldNodeObjects.length; i++) {
      newNodeObjects[i].latitude_corrected = oldNodeObjects[i].latitude;
      newNodeObjects[i].longitude_corrected = oldNodeObjects[i].longitude;
    }

    const oldPremiumObjects = oldRealm.objects('Premium');
    const newPremiumObjects = newRealm.objects('Premium');

    for (let i = 0; i < oldPremiumObjects.length; i++) {
      newPremiumObjects[i].amount_corrected = oldPremiumObjects[i].amount;
    }

    const oldProductObjects = oldRealm.objects('Product');
    const newProductObjects = newRealm.objects('Product');

    for (let i = 0; i < oldProductObjects.length; i++) {
      newProductObjects[i].price_corrected = oldProductObjects[i].price;
    }

    const oldPTnxObjects = oldRealm.objects('Transaction');
    const newTnxObjects = newRealm.objects('Transaction');

    for (let i = 0; i < oldPTnxObjects.length; i++) {
      newTnxObjects[i].product_price_corrected =
        oldPTnxObjects[i].product_price;
      newTnxObjects[i].quantity_corrected = oldPTnxObjects[i].quantity;
      newTnxObjects[i].price_corrected = oldPTnxObjects[i].price;
      newTnxObjects[i].total_corrected = oldPTnxObjects[i].total;
      newTnxObjects[i].verification_longitude_corrected =
        oldPTnxObjects[i].verification_longitude;
      newTnxObjects[i].verification_latitude_corrected =
        oldPTnxObjects[i].verification_latitude;
      newTnxObjects[i].current_quantity_corrected =
        oldPTnxObjects[i].current_quantity;
    }

    const oldPTnxPremiumObjects = oldRealm.objects('TransactionPremium');
    const newTnxPremiumObjects = newRealm.objects('TransactionPremium');

    for (let i = 0; i < oldPTnxPremiumObjects.length; i++) {
      newTnxPremiumObjects[i].amount_corrected =
        oldPTnxPremiumObjects[i].amount;
      newTnxPremiumObjects[i].verification_longitude_corrected =
        oldPTnxPremiumObjects[i].verification_longitude;
      newTnxPremiumObjects[i].verification_latitude_corrected =
        oldPTnxPremiumObjects[i].verification_latitude;
    }
  }

  if (oldRealm.schemaVersion < 15) {
    const newNodeObjects = newRealm.objects('Card');

    for (let i = 0; i < newNodeObjects.length; i++) {
      newNodeObjects[i].is_active = true;
    }
  }
};

export default migrations;
