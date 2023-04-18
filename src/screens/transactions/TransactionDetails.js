/* eslint-disable camelcase */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import moment from 'moment';
import { findAllPremiumsByTransaction } from '../../services/transactionPremiumHelper';
import { findPremiumById } from '../../services/premiumsHelper';
import {
  stringToJson,
  deleteTransaction,
  getCustomFieldValue,
} from '../../services/commonFunctions';
import { erroredTransactionsCount } from '../../services/transactionsHelper';
import { populateDatabase } from '../../services/populateDatabase';
import { DeleteConfirmIcon } from '../../assets/svg';
import InvoiceModal from '../../components/InvoiceModal';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import Card from '../../components/Card';
import Icon from '../../icons';
import I18n from '../../i18n/i18n';
import CommonAlert from '../../components/CommonAlert';
import DeleteTransactionView from '../../components/DeleteTransactionView';
import * as consts from '../../services/constants';

const { width } = Dimensions.get('window');

const TransactionDetails = ({ navigation, route }) => {
  const isFocused = useIsFocused();
  const { transactionItem } = route.params;
  const { userProjectDetails } = useSelector((state) => state.login);
  const { currency, quality_correction } = userProjectDetails;
  const [quantity, setQuantity] = useState(0);
  const [openSetUpModal, setOpenSetUpModal] = useState(false);
  const [premiums, setPremiums] = useState([]);
  const [basePrice, setBasePrice] = useState(0);
  const [localPrice, setLocalPrice] = useState('');
  const [filename, setFilename] = useState('');
  const [buyTnxFields, setBuyTnxFields] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [deleteButton, setDeleteButton] = useState(false);

  useEffect(() => {
    setupDetails();
  }, []);

  useEffect(() => {
    setupDeleteTxnStatus();
  }, [isFocused]);

  /**
   * setting initial values
   */
  const setupDetails = async () => {
    const savedLocalPrice = await AsyncStorage.getItem('LocalPrice');
    if (savedLocalPrice) {
      setLocalPrice(savedLocalPrice);
    }

    if (transactionItem?.extra_fields) {
      let extraFields = transactionItem.extra_fields;

      if (extraFields && typeof extraFields === 'string') {
        extraFields = stringToJson(extraFields);
      }

      const txnFields = extraFields?.custom_fields?.buy_txn_fields ?? null;
      if (txnFields) {
        setBuyTnxFields(txnFields);
      }
    }

    if (
      transactionItem.invoice_file !== '' &&
      transactionItem.invoice_file != null
    ) {
      const filepath = transactionItem.invoice_file;
      const name = filepath.replace(/^.*[\\/]/, '');
      setFilename(name);
    }

    const transactionPremiums = await findAllPremiumsByTransaction(
      transactionItem.id,
    );
    setQuantity(transactionItem.quantity);
    setBasePrice(transactionItem.price);

    Promise.all(
      transactionPremiums.map(async (p) => {
        const transPremium = await findPremiumById(p._raw.premium_id);
        p._raw.included_in_amt = transPremium.included_in_amt;
        p._raw.is_card_dependent = transPremium.is_card_dependent;
      }),
    ).then(async () => {
      const transPremiums = await Promise.all(
        transactionPremiums.map(async (p) => {
          const premium = await findPremiumById(p._raw.premium_id);
          if (premium.type === 101) {
            premium.total = premium.amount;
          } else if (premium.type === 301) {
            premium.total = Math.round(p._raw.amount);
          } else {
            premium.total = Math.round(p._raw.amount);
          }
          return premium;
        }),
      );
      setPremiums(transPremiums);
    });
  };

  /**
   * setting delete transaction option
   */
  const setupDeleteTxnStatus = async () => {
    const deleteTnxEnabled = await AsyncStorage.getItem('deleteTnxEnabled');
    if (deleteTnxEnabled && deleteTnxEnabled === 'true') {
      setDeleteButton(true);
    } else {
      setDeleteButton(false);
    }
  };

  /**
   * get toatal price (base price + premium)
   *
   * @returns {number} total price
   */
  const getTotalPrice = () => {
    const total = premiums.reduce((a, b) => {
      return a + b.total;
    }, parseFloat(basePrice));
    return Math.round(total);
  };

  /**
   * delete transaqction
   */
  const handleDelete = async () => {
    await deleteTransaction(transactionItem, consts.APP_TRANS_TYPE_INCOMING);
    const count = await erroredTransactionsCount();
    if (count === 0) {
      populateDatabase();
    }

    setAlertModal(false);
    navigation.goBack();
  };

  /**
   * redirecting to previous page
   */
  const backNavigation = () => {
    navigation.goBack(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        backgroundColor={consts.APP_BG_COLOR}
        title={I18n.t('transaction_details')}
        leftIcon='arrow-left'
        onPress={() => backNavigation()}
        extraStyle={{ paddingHorizontal: 20 }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {(transactionItem.server_id === '' ||
          transactionItem.server_id == null) &&
          transactionItem.error === '' && (
            <View style={styles.syncWarningWrap}>
              <View style={{ marginHorizontal: 10, marginVertical: 5 }}>
                <Icon name='Sync-warning2' size={28} color='#F2994A' />
              </View>
              <Text style={styles.syncMsg}>
                {I18n.t('this_transaction_is_not_synced_to_the_server')}
              </Text>
            </View>
          )}

        {(transactionItem.server_id === '' ||
          transactionItem.server_id == null) &&
          transactionItem.error !== '' && (
            <DeleteTransactionView
              error={transactionItem.error}
              deleteButton={consts.DELETE_TRANSACTION_ENABLED && deleteButton}
              onDelete={() => setAlertModal(true)}
            />
          )}

        {transactionItem.type === consts.APP_TRANS_TYPE_LOSS && (
          <View style={styles.lossTitleWrap}>
            <View style={styles.person}>
              <Text style={styles.lossSymbol}>!</Text>
            </View>
            <Text style={styles.lossTitle}>{I18n.t('loss')}</Text>
          </View>
        )}

        {transactionItem.type !== consts.APP_TRANS_TYPE_LOSS && (
          <View style={styles.formTitleContainer}>
            <Text style={styles.formSubTitle}>
              {I18n.t('transaction_received_from')}
            </Text>
            <Text style={[styles.formTitle, { textTransform: 'capitalize' }]}>
              {transactionItem.node_name || `[${I18n.t('not_available')}]`}
            </Text>
          </View>
        )}

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>{I18n.t('product')}</Text>
          <Text style={styles.formTitle}>
            {transactionItem.product_name || `[${I18n.t('not_available')}]`}
          </Text>
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>
            {transactionItem.type === consts.APP_TRANS_TYPE_LOSS
              ? `${I18n.t('quantity_lost')} Kg`
              : `${I18n.t('total_quantity')} Kg`}
          </Text>
          <Text style={styles.formTitle}>
            {transactionItem.quantity.toLocaleString('id').replace(/\./g, '')}
          </Text>
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>{I18n.t('transaction_date')}</Text>
          <Text style={styles.formTitle}>
            {moment(transactionItem.created_on * 1000).format(
              'DD MMM YYYY hh:mm a',
            )}
          </Text>
        </View>

        {buyTnxFields.map((i, n) => {
          return (
            <View key={n.toString()} style={styles.formTitleContainer}>
              <Text style={styles.formSubTitle}>{i?.label?.en ?? i.key}</Text>
              <Text style={styles.formTitle}>{getCustomFieldValue(i)}</Text>
            </View>
          );
        })}

        {transactionItem.invoice_file !== '' &&
          transactionItem.invoice_file != null && (
            <View style={styles.formTitleContainer}>
              <Text
                style={[styles.formTitle, { fontSize: 14, marginBottom: 10 }]}
              >
                {I18n.t('verification_image')}
              </Text>
              <View style={styles.viewImage}>
                <Text style={styles.viewImageText} numberOfLines={1}>
                  {filename}
                </Text>
                <TouchableOpacity
                  onPress={() => setOpenSetUpModal(true)}
                  style={{ width: '30%' }}
                  hitSlop={consts.HIT_SLOP_FIFTEEN}
                >
                  <Text style={styles.viewImageButtonText}>
                    {`${I18n.t('view_image')} >`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        {transactionItem.type !== consts.APP_TRANS_TYPE_LOSS && (
          <View style={styles.cardWrap}>
            <Card
              displayPremium
              productName={transactionItem.product_name}
              productQuantity={quantity}
              productPrice={transactionItem.product_price}
              basePrice={basePrice}
              premiums={premiums}
              noCard={false}
              totalPrice={getTotalPrice()}
              localPrice={localPrice}
              displayInfo
              displayPriceDetails
              currency={currency}
              qualityCorrection={transactionItem.quality_correction}
              qualityCorrectionEnabled={quality_correction}
            />
          </View>
        )}

        {alertModal && (
          <CommonAlert
            visible={alertModal}
            title={I18n.t('delete_transaction')}
            message={`${I18n.t('are_you_sure_delete_transaction')}`}
            submitText={I18n.t('ok')}
            cancelText={I18n.t('cancel')}
            icon={
              <DeleteConfirmIcon width={width * 0.23} height={width * 0.23} />
            }
            onSubmit={() => handleDelete()}
            onCancel={() => setAlertModal(false)}
          />
        )}

        {openSetUpModal && (
          <View style={{ flex: 1, position: 'absolute' }}>
            <InvoiceModal
              openSetUpModal={openSetUpModal}
              closeModal={() => setOpenSetUpModal(false)}
              imageUri={transactionItem.invoice_file}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: consts.APP_BG_COLOR,
  },
  formTitleContainer: {
    alignSelf: 'center',
    width: '90%',
    marginVertical: 10,
  },
  formTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
  },
  formSubTitle: {
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
    marginBottom: 10,
    color: '#5691AE',
  },
  lossTitleWrap: {
    width: '90%',
    alignSelf: 'center',
    marginVertical: 10,
    backgroundColor: '#DDF3FF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.025,
  },
  lossTitle: {
    fontWeight: '500',
    fontStyle: 'normal',
    fontSize: 17,
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_REGULAR,
    marginLeft: width * 0.02,
  },
  lossSymbol: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: consts.FONT_BOLD,
  },
  person: {
    backgroundColor: '#EA2553',
    height: 30,
    width: 30,
    borderRadius: 30 / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewImage: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  viewImageText: {
    fontSize: 12,
    marginBottom: 10,
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '60%',
    marginVertical: 10,
  },
  viewImageButtonText: {
    fontSize: 13,
    textDecorationLine: 'underline',
    color: '#4DCAF4',
    fontFamily: consts.FONT_BOLD,
    textAlign: 'right',
    marginVertical: 10,
  },
  syncWarningWrap: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#DDF3FF',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 5,
  },
  syncMsg: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_MEDIUM,
    fontStyle: 'normal',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  cardWrap: {
    width: '90%',
    alignSelf: 'center',
    marginBottom: 20,
  },
});

export default TransactionDetails;
