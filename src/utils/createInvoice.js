import RNHTMLtoPDF from 'react-native-html-to-pdf';
import moment from 'moment';
import FileViewer from 'react-native-file-viewer';
import Toast from 'react-native-toast-message';
import ThermalPrinterModule from 'react-native-thermal-printer';
import I18n from '../translations/text/i18n';
import { NumberFormatter, getCurrency, handleErrors } from './commonFunctions';
import {
  APP_TRANS_TYPE_INCOMING,
  PAYMENT_OUTGOING,
  VERIFICATION_METHOD_CARD,
  VERIFICATION_METHOD_MANUAL,
  VERIFICATION_METHOD_QR,
  VERIFIED_BY_CARD,
  VERIFIED_BY_MANUAL,
  VERIFIED_BY_QR,
} from './constants';
import { store } from '../redux/store';

const getTotal = async (key, dataArray) => {
  const totalAmount = dataArray.reduce((total, element) => {
    return total + parseFloat(element[key]);
  }, 0);
  return totalAmount;
};

const getVerificationMethod = async (method) => {
  switch (method) {
    case VERIFICATION_METHOD_CARD:
      return VERIFIED_BY_CARD;
    case VERIFICATION_METHOD_MANUAL:
      return VERIFIED_BY_MANUAL;
    case VERIFICATION_METHOD_QR:
      return VERIFIED_BY_QR;
    default:
      return 'NONE';
  }
};

export const createBuyCompleteInvoice = async ({
  action,
  farmerName = 'NA',
  transactionArray = [],
  totalAmount = 0,
}) => {
  try {
    if (transactionArray.length === 0) {
      throw new Error('Transaction array is empty.');
    }

    const currency = await getCurrency('code');
    const { reference_id, created_on, verification_method } =
      transactionArray[0];
    const displayArray = transactionArray.map(
      ({
        product_name,
        quantity_corrected,
        total_amount,
        premium_total,
        total_corrected,
        product_price_corrected,
      }) => ({
        Product: product_name || 'NA',
        Quantity: NumberFormatter.quantity(quantity_corrected, true),
        'Base price': NumberFormatter.currency(product_price_corrected, true),
        Price: NumberFormatter.currency(total_amount, true),
        Premium: NumberFormatter.currency(premium_total, true),
        Total: NumberFormatter.currency(total_corrected, true),
      }),
    );

    const verifiedBy = await getVerificationMethod(verification_method);

    const data = {
      referenceId: reference_id,
      date: created_on || parseInt(new Date().getTime() / 1000),
      node: { type: 'Farmer', name: farmerName },
      transactionArray: displayArray,
      total: totalAmount,
      currency,
      verifiedBy,
    };

    if (action === 'view') {
      const html = await createHtml(data);
      const response = createPdf(html, 'buy_invoice');
      return response;
    }

    if (action === 'print') {
      const markup = await createMarkUp(data);
      const response = await printPdf(markup);
      return response;
    }
    return false;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    handleErrors(error, {
      ref: 'createInvoice_createBuyCompleteInvoice',
    });

    return false;
  }
};

export const createSendCompleteInvoice = async ({
  action,
  buyerName = 'NA',
  transactionArray = [],
}) => {
  try {
    if (transactionArray.length === 0) {
      throw new Error('Transaction array is empty.');
    }

    const currency = await getCurrency('code');
    const { reference_id, created_on, verification_method } =
      transactionArray[0];
    const totalAmount = await getTotal('total_corrected', transactionArray);

    const displayArray = transactionArray.map(
      ({
        product_name,
        edited_quantity,
        price_corrected,
        total_corrected,
      }) => ({
        Product: product_name || 'NA',
        Quantity: NumberFormatter.quantity(edited_quantity, true),
        Price: NumberFormatter.currency(price_corrected, true),
        Premium: NumberFormatter.currency(
          parseFloat(total_corrected) - parseFloat(price_corrected),
          true,
        ),
        Total: NumberFormatter.currency(total_corrected, true),
      }),
    );

    const verifiedBy = await getVerificationMethod(verification_method);

    const data = {
      referenceId: reference_id,
      date: created_on || parseInt(new Date().getTime() / 1000),
      node: { type: 'Buyer', name: buyerName },
      transactionArray: displayArray,
      total: totalAmount,
      currency,
      verifiedBy,
    };

    if (action === 'view') {
      const html = await createHtml(data);
      const response = createPdf(html, 'buy_invoice');
      return response;
    }

    if (action === 'print') {
      const markup = await createMarkUp(data);
      const response = await printPdf(markup);
      return response;
    }
    return false;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    handleErrors(error, {
      ref: 'createInvoice_createSendCompleteInvoice',
    });

    return false;
  }
};

export const createBuyTransactionInvoice = async ({
  action,
  referenceId = '',
  transactionArray = [],
}) => {
  try {
    if (transactionArray.length === 0) {
      throw new Error('Transaction array is empty.');
    }

    const currency = await getCurrency('code');
    const { node_name, created_on, verification_method, type } =
      transactionArray[0];
    const totalAmount = await getTotal('total_corrected', transactionArray);
    const displayArray = transactionArray.map(
      ({
        product_name,
        quantity_corrected,
        price_corrected,
        total_corrected,
        product_price_corrected,
      }) => ({
        Product: product_name || 'NA',
        Quantity: NumberFormatter.quantity(quantity_corrected, true),
        'Base price': NumberFormatter.currency(product_price_corrected, true),
        Price: NumberFormatter.currency(price_corrected, true),
        Premium: NumberFormatter.currency(
          parseFloat(total_corrected) - parseFloat(price_corrected),
          true,
        ),
        Total: NumberFormatter.currency(total_corrected, true),
      }),
    );

    const verifiedBy = await getVerificationMethod(verification_method);

    const data = {
      referenceId,
      date: created_on || parseInt(new Date().getTime() / 1000),
      node: {
        type: type === APP_TRANS_TYPE_INCOMING ? 'Farmer' : 'Buyer',
        name: node_name || 'NA',
      },
      transactionArray: displayArray,
      total: totalAmount,
      currency,
      verifiedBy,
    };

    if (action === 'view') {
      const html = await createHtml(data);
      const response = createPdf(html, 'buy_invoice');
      return response;
    }

    if (action === 'print') {
      const markup = await createMarkUp(data);
      const response = await printPdf(markup);
      return response;
    }
    return false;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    handleErrors(error, {
      ref: 'createInvoice_createBuyTransactionInvoice',
    });

    return false;
  }
};

export const createPaymentInvoice = async ({
  action,
  referenceId = '',
  transactionArray = [],
}) => {
  try {
    if (transactionArray.length === 0) {
      throw new Error('Transaction array is empty.');
    }

    const currency = await getCurrency('code');
    const { type, node_name, date, verification_method } = transactionArray[0];
    const totalAmount = await getTotal('amount_corrected', transactionArray);

    const displayArray = transactionArray.map(
      ({ premium_name, amount_corrected }) => ({
        Type: premium_name ?? 'NA',
        Amount: NumberFormatter.currency(amount_corrected, true),
      }),
    );

    const verifiedBy = await getVerificationMethod(verification_method);

    const data = {
      referenceId,
      date: date || parseInt(new Date().getTime() / 1000),
      node: {
        type: type === PAYMENT_OUTGOING ? 'Farmer' : 'Buyer',
        name: node_name || 'NA',
      },
      transactionArray: displayArray,
      total: totalAmount,
      currency,
      verifiedBy,
    };

    if (action === 'view') {
      const html = await createHtml(data);
      const response = createPdf(html, 'buy_invoice');
      return response;
    }

    if (action === 'print') {
      const markup = await createMarkUp(data);
      const response = await printPdf(markup);
      return response;
    }
    return false;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    handleErrors(error, {
      ref: 'createInvoice_createPaymentInvoice',
    });

    return false;
  }
};

export const createPaymentCompleteInvoice = async ({
  action,
  referenceId = '',
  transactionArray = [],
  farmer = 'NA',
  total = 0,
}) => {
  try {
    if (transactionArray.length === 0) {
      throw new Error('Transaction array is empty.');
    }

    const currency = await getCurrency('code');
    const { date, verification_method } = transactionArray[0];

    const displayArray = transactionArray.map(
      ({ premium_name, amount_corrected }) => ({
        Type: premium_name ?? 'NA',
        Amount: NumberFormatter.currency(amount_corrected, true),
      }),
    );

    const verifiedBy = await getVerificationMethod(verification_method);

    const data = {
      referenceId,
      date: date || parseInt(new Date().getTime() / 1000),
      node: {
        type: 'Farmer',
        name: farmer,
      },
      transactionArray: displayArray,
      total,
      currency,
      verifiedBy,
    };

    if (action === 'view') {
      const html = await createHtml(data);
      const response = createPdf(html, 'buy_invoice');
      return response;
    }

    if (action === 'print') {
      const markup = await createMarkUp(data);
      const response = await printPdf(markup);
      return response;
    }
    return false;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    handleErrors(error, {
      ref: 'createInvoice_createPaymentCompleteInvoice',
    });

    return false;
  }
};

const createHtml = async (data) => {
  try {
    const { referenceId, date, node, transactionArray, total, verifiedBy } =
      data;
    const arrayLength = transactionArray.length;
    const { userCompanyDetails } = store.getState().login;
    const {
      name = null,
      city = null,
      country = null,
      email = null,
      image = null,
    } = userCompanyDetails;

    const html = `
    <html>
      <head>
        <style>
          body {
            font-family: 'Helvetica';
            color: #000000;
          }
          footer {
            padding: 20px 0;
          }
          p {
            font-size: 35px;
            line-height: 35px;
          }
          table {
            width: 100%;
          }
          td {
            font-size: 35px;
            width: 50%;
          }
          hr {
            border: 2px solid black;
          }
          img {
            display: block;
            margin-left: auto;
            margin-right: auto;
            width: 50%;
          }
          .total {
            font-size: 35px;
            font-weight: bold;
          }
          .container {
            display: flex;
            flex-direction: row;
          }
          .column {
            flex: 1;
          }
          .column:nth-child(1) {
            flex-basis: 35%;
            padding-left: 35px;
          }
          .column:nth-child(2) {
            flex-basis: 65%;
            padding-right: 35px;
          }
          .infoText {
            font-size: 35px;
            text-align: center;
            line-height: 20px;
          }
          .commonWrap {
            padding: 20px 0;
          }
          .footerClass {
            font-size: 30px;
            text-align: center;
          }
          .hrStyle {
            border: 3px dashed black;
          }
          .title {
            font-size: 50px;
            text-align: center;
            font-weight: bold;
          }
          .detailsWrap {
            padding-left: 35px;
          }
          .details {
            font-size: 35px;
            margin: 50px 0;
          }
        </style>
      </head>
      <body>
        <br />
       ${image ? `<img src="${image}" />` : ''}
        <p class="title">${name ?? ''}</p>
        <p class="infoText">${city ?? ''}, ${country ?? ''}.</p>
        <p class="infoText">${email ?? ''}</p>
        <hr />
        <hr />
        <div class="detailsWrap">
          <p class="details">Ref ID: ${referenceId}</p>
          <p class="details">Date & Time: ${moment(date * 1000).format(
            'DD MMM YYYY, hh:mm a',
          )}</p>
          <p class="details">${node.type}: ${node.name}</p>
          <p class="details">Verified by: ${verifiedBy}</p>
        </div>
        <hr />
        ${transactionArray
          .map(
            (item, index) => `
            <div>
            ${Object.keys(item)
              .map(
                (i) => `
                <div class="container">
                <div class="column">
                  <p>${i}:</p>
                </div>
                <div class="column">
                  <p>${item[i]}</p>
                </div>
              </div>
                `,
              )
              .join('')}
              ${index === arrayLength - 1 ? '<hr />' : '<hr class="hrStyle"/>'}
            </div>`,
          )
          .join('')}
        <div class="container">
          <div class="column">
            <p class="total">Net total:</p>
          </div>
          <div class="column">
            <p class="total">${
              total ? `${NumberFormatter.currency(total, true)}` : 'NA'
            }</p>
          </div>
        </div>
        <hr />
        <div class="commonWrap">
          <p class="infoText">THIS IS YOUR OFFICIAL RECEIPT</p>
          <p class="infoText">- Thank you and see you again -</p>
        </div>
        <hr />
        <footer>
          <p class="footerClass">Copyright ${new Date().getFullYear()} - Fairfood</p>
        </footer>
      </body>
    </html>
  `;

    return html;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    handleErrors(error, {
      ref: 'createInvoice_createHtml',
    });
  }
};

const createPdf = async (
  html = '',
  fileName = 'invoice',
  directory = 'Documents',
) => {
  try {
    const options = {
      html,
      fileName,
      directory,
    };

    const file = await RNHTMLtoPDF.convert(options);
    await FileViewer.open(file.filePath);
    return true;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    handleErrors(error, {
      ref: 'createInvoice_createPdf',
    });

    return false;
  }
};

const formatItem = (transactionArray) => {
  const arrayLength = transactionArray.length;
  let markup = '';
  transactionArray.forEach((item, index) => {
    Object.keys(item).map((i) => {
      markup += `[L]${i} : ${item[i]}\n`;
    });
    if (index !== arrayLength - 1) {
      markup += '[C]=====================================\n';
    }
  });
  return markup;
};

const getImageMarkup = (image) => {
  return image ? `[L]<img>${image}</img>\n\n` : '';
};

const createMarkUp = (data) => {
  try {
    const { referenceId, verifiedBy, date, node, transactionArray, total } =
      data;

    const { userCompanyDetails } = store.getState().login;
    const {
      name = null,
      city = null,
      country = null,
      email = null,
      image = null,
    } = userCompanyDetails;

    const markup =
      '[L]\n' +
      `${getImageMarkup(image)}` +
      `[C]<font size='tall'><b>${name ?? ''}</b></font>\n` +
      `[C]${city ?? ''}, ${country ?? ''}.\n` +
      `[C]${email ?? ''}\n` +
      '[C]\n' +
      `[L]Ref ID: ${referenceId}\n` +
      `[L]Date&Time: ${moment(date * 1000).format('DD MMM YYYY, hh:mm a')}\n` +
      `[L]${node.type}: ${node.name}\n` +
      `[L]Verified by: ${verifiedBy}\n` +
      '[C]=====================================\n' +
      `${formatItem(transactionArray)}\n` +
      '[C]=====================================\n' +
      `[L]<b>Net Total : ${
        total ? `${NumberFormatter.currency(total, true)}` : 'NA'
      }</b>\n` +
      '[C]=====================================\n' +
      '[C]THIS IS YOUR OFFICIAL RECEIPT\n' +
      '[C]Thank you and see you again\n' +
      `[C]Copyright ${new Date().getFullYear()} - Fairfood\n`;

    return markup;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    handleErrors(error, {
      ref: 'createInvoice_createHtml',
    });
  }
};

const printPdf = async (markup) => {
  try {
    await ThermalPrinterModule.printBluetooth({
      payload: markup,
      printerDpi: 300,
      printerWidthMM: 58,
      printerNbrCharactersPerLine: 32,
      timeout: 5000,
    });
    return true;
  } catch (error) {
    handleErrors(error, {
      ref: 'createInvoice_printPdf',
    });
    return false;
  }
};
