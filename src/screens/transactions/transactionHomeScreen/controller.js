import moment from 'moment';
import { getCurrency, handleErrors } from '../../../utils/commonFunctions';
import { fetchPremiumsByCategory } from '../../../db/services/PremiumsHelper';
import {
  APP_TRANS_TYPE_INCOMING,
  APP_TRANS_TYPE_OUTGOING,
  PAYMENT_INCOMING,
  PAYMENT_OUTGOING,
  PREMIUM_CATEGORY_TRANSACTION,
  VERIFICATION_METHOD_CARD,
  VERIFICATION_METHOD_MANUAL,
} from '../../../utils/constants';
import { fetchAllPremiumsByTransaction } from '../../../db/services/TransactionPremiumHelper';
import { store } from '../../../redux/store';

/**
 * sorting and setting section list data
 * @param   {string}  type        array type
 * @param   {Array}   data        data array
 * @param   {*}       filterItem  filter object
 * @returns {Array}               formatted array for sectionList
 */
export const getSectionListData = (type, data, filterItem = null) => {
  try {
    if (!data) {
      return [];
    }

    let localeData = null;
    if (filterItem?.groupByType === 'reference_id') {
      localeData = data.filter((x) => {
        return x.reference_id !== '';
      });

      localeData = localeData.map((item) => {
        item.key = item.reference_id;
        return item;
      });

      // Sort data by reference id
      localeData.sort((a, b) => {
        return b.reference_id
          .toLowerCase()
          .localeCompare(a.reference_id.toLowerCase());
      });
    } else {
      localeData = data.map((item) => {
        const dateItem = type === 'transaction' ? item.created_on : item.date;
        item.key = moment(dateItem * 1000).format('YYYY-MM-DD');
        return item;
      });

      // Sort data by date time
      localeData.sort((a, b) => {
        const dateA = type === 'transaction' ? a.created_on : a.date;
        const dateB = type === 'transaction' ? b.created_on : b.date;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    }

    // Reduce data for SectionList
    const groupedData = localeData.reduce((accumulator, currentValue) => {
      const keyObjectPosition = accumulator.findIndex(
        (item) => item.title === currentValue.key,
      );
      if (keyObjectPosition >= 0) {
        accumulator[keyObjectPosition].data.push(currentValue);
      } else {
        accumulator.push({ title: currentValue.key, data: [currentValue] });
      }
      return accumulator;
    }, []);

    return groupedData;
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionHomeScreen_setSectionListData',
    });
    return [];
  }
};

export const getTransactionFilteredData = async (transactionArray, filter) => {
  const { date, transactionType, product, verificationMethod, quantity } =
    filter;
  let currentTransactions = transactionArray;
  let filterCount = 0;

  if (date) {
    const { startDate, endDate } = date;
    if (startDate && endDate) {
      currentTransactions = currentTransactions.filter((tx) => {
        return (
          tx.created_on >= startDate / 1000 && tx.created_on <= endDate / 1000
        );
      });
      filterCount += 1;
    } else if (startDate) {
      currentTransactions = currentTransactions.filter((tx) => {
        return tx.created_on >= startDate / 1000;
      });
      filterCount += 1;
    } else if (endDate) {
      currentTransactions = currentTransactions.filter((tx) => {
        return tx.created_on <= endDate / 1000;
      });
      filterCount += 1;
    }
  }

  if (transactionType) {
    const tnxArr = [];
    const { buy, sent } = transactionType;
    if (buy) {
      tnxArr.push(APP_TRANS_TYPE_INCOMING);
    }
    if (sent) {
      tnxArr.push(APP_TRANS_TYPE_OUTGOING);
    }

    if (tnxArr.length > 0) {
      currentTransactions = currentTransactions.filter((tx) => {
        return tnxArr.includes(tx.type);
      });
      filterCount += 1;
    }
  }

  if (product && product.length > 0) {
    currentTransactions = currentTransactions.filter((tx) => {
      return product.includes(tx.product_name);
    });
    filterCount += 1;
  }

  if (verificationMethod) {
    const verifyArr = [];
    const { card, manual } = verificationMethod;
    if (card) {
      verifyArr.push(VERIFICATION_METHOD_CARD);
    }
    if (manual) {
      verifyArr.push(VERIFICATION_METHOD_MANUAL);
    }

    if (verifyArr.length > 0) {
      currentTransactions = currentTransactions.filter((tx) => {
        return verifyArr.includes(tx.verification_method);
      });
      filterCount += 1;
    }
  }

  if (quantity) {
    const { minQuantity, maxQuantity } = quantity;
    if (minQuantity && maxQuantity) {
      currentTransactions = currentTransactions.filter((tx) => {
        return (
          parseFloat(tx.quantity_corrected) >= parseFloat(minQuantity) &&
          parseFloat(tx.quantity_corrected) <= maxQuantity
        );
      });
      filterCount += 1;
    } else if (minQuantity) {
      currentTransactions = currentTransactions.filter((tx) => {
        return parseFloat(tx.quantity_corrected) >= parseFloat(minQuantity);
      });
      filterCount += 1;
    } else if (maxQuantity) {
      currentTransactions = currentTransactions.filter((tx) => {
        return parseFloat(tx.quantity_corrected) <= parseFloat(maxQuantity);
      });
      filterCount += 1;
    }
  }

  return [currentTransactions, filterCount];
};

export const getPaymentFilteredData = async (paymentArray, filter) => {
  const { date, paymentType, premium, verificationMethod, amount } = filter;
  let currentPayments = paymentArray;
  let filterCount = 0;

  if (date) {
    const { startDate, endDate } = date;
    if (startDate && endDate) {
      currentPayments = currentPayments.filter((tx) => {
        return tx.date >= startDate / 1000 && tx.date <= endDate / 1000;
      });
      filterCount += 1;
    } else if (startDate) {
      currentPayments = currentPayments.filter((tx) => {
        return tx.date >= startDate / 1000;
      });
      filterCount += 1;
    } else if (endDate) {
      currentPayments = currentPayments.filter((tx) => {
        return tx.date <= endDate / 1000;
      });
      filterCount += 1;
    }
  }

  if (paymentType) {
    const payArr = [];
    const { credit, debit } = paymentType;
    if (credit) {
      payArr.push(PAYMENT_INCOMING);
    }
    if (debit) {
      payArr.push(PAYMENT_OUTGOING);
    }

    if (payArr.length > 0) {
      currentPayments = currentPayments.filter((tx) => {
        return payArr.includes(tx.type);
      });
      filterCount += 1;
    }
  }

  if (premium && premium.length > 0) {
    currentPayments = currentPayments.filter((tx) => {
      return premium.includes(tx.premium_name);
    });
    filterCount += 1;
  }

  if (verificationMethod) {
    const verifyArr = [];
    const { card, manual } = verificationMethod;
    if (card) {
      verifyArr.push(VERIFICATION_METHOD_CARD);
    }
    if (manual) {
      verifyArr.push(VERIFICATION_METHOD_MANUAL);
    }

    if (verifyArr.length > 0) {
      currentPayments = currentPayments.filter((tx) => {
        return verifyArr.includes(tx.verification_method);
      });
      filterCount += 1;
    }
  }

  if (amount) {
    const { minAmount, maxAmount } = amount;
    if (minAmount && maxAmount) {
      currentPayments = currentPayments.filter((tx) => {
        return (
          parseFloat(tx.amount_corrected) >= parseFloat(minAmount) &&
          parseFloat(tx.amount_corrected) <= maxAmount
        );
      });
      filterCount += 1;
    } else if (minAmount) {
      currentPayments = currentPayments.filter((tx) => {
        return parseFloat(tx.amount_corrected) >= parseFloat(minAmount);
      });
      filterCount += 1;
    } else if (maxAmount) {
      currentPayments = currentPayments.filter((tx) => {
        return parseFloat(tx.amount_corrected) <= parseFloat(maxAmount);
      });
      filterCount += 1;
    }
  }

  return [currentPayments, filterCount];
};

const getPremiumData = async (id, allPremiums) => {
  const transactionPremiums = await fetchAllPremiumsByTransaction(id);
  const obj = {};
  if (transactionPremiums.length === 0) {
    return obj;
  }

  await Promise.all(
    allPremiums.map((premium) => {
      const premiumFound = transactionPremiums.find(
        (x) => premium.id === x.premium_id,
      );
      obj[premium.name] = premiumFound
        ? parseFloat(premiumFound.amount_corrected).toFixed(2)
        : '';
    }),
  );

  return obj;
};

export const getReadableTransactionData = async (transactionArray) => {
  try {
    const { loggedInUser } = store.getState().login;
    const currency = getCurrency('code');
    const allPremiums = await fetchPremiumsByCategory(
      PREMIUM_CATEGORY_TRANSACTION,
    );
    const premiumAvailable = allPremiums.length > 0;

    const filteredArray = await Promise.all(
      transactionArray.map(async (tx) => {
        let premiumData = {};
        if (premiumAvailable) {
          premiumData = await getPremiumData(tx.id, allPremiums);
        }
        const quantity = parseFloat(tx.quantity_corrected).toFixed(2);
        const total = parseFloat(tx.total_corrected).toFixed(2);
        const date = moment(parseFloat(tx.date) * 1000).format(
          'YYYY-MM-DD hh:mm:ss a',
        );

        const source =
          tx.type === APP_TRANS_TYPE_INCOMING
            ? tx.node_name
            : `${loggedInUser.first_name} ${loggedInUser.last_name}`;
        const destination =
          tx.type === APP_TRANS_TYPE_INCOMING
            ? `${loggedInUser.first_name} ${loggedInUser.last_name}`
            : tx.node_name;

        const fistPart = {
          ID: tx.server_id,
          'Reference ID': tx.reference_id,
          Product: tx.product_name,
          Quantity: quantity,
          'Date & Time': date,
          Type: tx.type,
          Source: source,
          Destination: destination,
        };

        const lastPart = {
          Total: total,
          Currency: currency,
          'Verified by': tx.verification_method,
          'Verification longitude':
            tx.verification_longitude_corrected === 0
              ? ''
              : tx.verification_longitude_corrected,
          'Verification latitude':
            tx.verification_latitude_corrected === 0
              ? ''
              : tx.verification_latitude_corrected,
        };

        return { ...fistPart, ...premiumData, ...lastPart };
      }),
    );

    return filteredArray;
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionHomeScreen_getReadableTransactionData',
    });
  }
};

export const getReadablePaymentData = async (paymentArray) => {
  try {
    const { loggedInUser } = store.getState().login;
    const currency = getCurrency('code');
    const filteredArray = await Promise.all(
      paymentArray.map(async (tx) => {
        const amount = parseFloat(tx.amount_corrected).toFixed(2);
        const date = moment(parseFloat(tx.date) * 1000).format(
          'YYYY-MM-DD hh:mm:ss a',
        );
        return {
          ID: tx.server_id,
          'Reference ID': tx.reference_id,
          'Payment type': tx.premium_name,
          Amount: amount,
          Currency: currency,
          'Date & Time': date,
          Type: tx.type,
          source:
            tx.type === APP_TRANS_TYPE_INCOMING
              ? tx.node_name
              : `${loggedInUser.first_name} ${loggedInUser.last_name}`,
          destination:
            tx.type === APP_TRANS_TYPE_INCOMING
              ? `${loggedInUser.first_name} ${loggedInUser.last_name}`
              : tx.node_name,
          'Verified by': tx.verification_method,
          'Verification longitude':
            tx.verification_longitude_corrected === 0
              ? ''
              : tx.verification_longitude_corrected,
          'Verification latitude':
            tx.verification_latitude_corrected === 0
              ? ''
              : tx.verification_latitude_corrected,
        };
      }),
    );

    return filteredArray;
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionHomeScreen_getReadableTransactionData',
    });
  }
};
