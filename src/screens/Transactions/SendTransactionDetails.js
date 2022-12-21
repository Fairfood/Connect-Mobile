import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { findAllPremiumsByTransaction } from '../../services/transactionPremiumHelper';
import { findPremiumById } from '../../services/premiumsHelper';
import { erroredTransactionsCount } from '../../services/transactionsHelper';
import { deleteTransaction } from '../../services/commonFunctions';
import { DeleteConfirmIcon } from '../../assets/svg';
import { populateDatabase } from '../../services/populateDatabase';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import InvoiceModal from '../../components/InvoiceModal';
import Icon from '../../icons';
import I18n from '../../i18n/i18n';
import CommonAlert from '../../components/CommonAlert';
import DeleteTransactionView from '../../components/DeleteTransactionView';
import * as consts from '../../services/constants';

const { width } = Dimensions.get('window');

const SendTransactionDetails = ({ navigation, route }) => {
  const { transactionItem } = route.params;
  const isFocused = useIsFocused();
  const { userProjectDetails } = useSelector((state) => state.login);
  const { currency } = userProjectDetails;
  const [openSetUpModal, setOpenSetUpModal] = useState(false);
  const [paidToFamers, setPaidToFamers] = useState('');
  const [premiums, setPremiums] = useState([]);
  const [basePrice, setBasePrice] = useState(0);
  const [filename, setFilename] = useState('');
  const [alertModal, setAlertModal] = useState(false);
  const [deleteButton, setDeleteButton] = useState(false);

  useEffect(() => {
    setupDetails();
  }, []);

  useEffect(() => {
    setupDeleteTnxStatus();
  }, [isFocused]);

  const setupDetails = async () => {
    setBasePrice(transactionItem.price);

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

    const filteredPremiums = await Promise.all(
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
    setPremiums(filteredPremiums);

    // setting total price to farmers
    let total = transactionItem?.price ?? null;
    if (!total) {
      const totalPrice = transactionItem?.total ?? basePrice;
      total = filteredPremiums.reduce((a, b) => {
        return a - b.total;
      }, parseFloat(totalPrice));
    }

    if (total < 0) {
      setPaidToFamers(`[${I18n.t('not_available')}]`);
    } else {
      total = Math.round(parseInt(total)).toLocaleString('pt-BR');
      setPaidToFamers(total);
    }
  };

  const setupDeleteTnxStatus = async () => {
    const deleteTnxEnabled = await AsyncStorage.getItem('deleteTnxEnabled');
    if (deleteTnxEnabled && deleteTnxEnabled === 'true') {
      setDeleteButton(true);
    } else {
      setDeleteButton(false);
    }
  };

  const handleDelete = async () => {
    await deleteTransaction(transactionItem, consts.APP_TRANS_TYPE_OUTGOING);
    const count = await erroredTransactionsCount();
    if (count === 0) {
      populateDatabase();
    }

    setAlertModal(false);
    navigation.goBack();
  };

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
        extraStyle={{ paddingHorizontal: width * 0.05 }}
      />
      <ScrollView>
        {(transactionItem.server_id === '' ||
          transactionItem.server_id == null) &&
          transactionItem.error === '' && (
            <View style={styles.syncWarningWrap}>
              <Icon
                name='Sync-warning2'
                size={28}
                color='#F2994A'
                style={{ marginHorizontal: 10 }}
              />
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

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSunTitle}>
            {I18n.t('transaction_delivered_to')}
          </Text>
          <Text style={styles.formTitle}>{transactionItem.node_name}</Text>
        </View>
        <View style={styles.formTitleContainer}>
          <Text style={styles.formSunTitle}>{I18n.t('product')}</Text>
          <Text style={styles.formTitle}>{transactionItem.product_name}</Text>
        </View>
        <View style={styles.formTitleContainer}>
          <Text style={styles.formSunTitle}>
            {`${I18n.t('total_quantity_delivered')} Kg`}
          </Text>
          <Text style={styles.formTitle}>
            {transactionItem.quantity.toLocaleString('id').replace(/\./g, '')}
          </Text>
        </View>
        <View style={styles.formTitleContainer}>
          <Text style={styles.formSunTitle}>{I18n.t('transaction_date')}</Text>
          <Text style={styles.formTitle}>
            {moment(transactionItem.created_on * 1000).format(
              'DD MMM YYYY hh:mm a',
            )}
          </Text>
        </View>

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

        <View style={styles.cardContainer}>
          <View style={{ marginVertical: 5, paddingVertical: 0 }}>
            <Text style={styles.priceDetailText}>
              {I18n.t('price_details')}
            </Text>
          </View>
          <View style={[styles.cardItem, { marginTop: 15 }]}>
            <Text
              style={[
                styles.cardLeftItem,
                { color: consts.TEXT_PRIMARY_COLOR, width: '70%' },
              ]}
            >
              {`${I18n.t('total_paid_to_farmers')}:`}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <Text
                style={[
                  styles.cardRightItem,
                  {
                    color: consts.TEXT_PRIMARY_COLOR,
                  },
                ]}
              >
                {`${paidToFamers} ${paidToFamers ? currency : ''}`}
              </Text>
            </View>
          </View>

          {premiums.map((premium, index) => (
            <View key={index.toString()} style={styles.cardItem}>
              <Text
                style={[
                  styles.cardLeftItem,
                  { color: consts.TEXT_PRIMARY_COLOR },
                ]}
              >
                {`${premium.name} ${I18n.t('paid')}:`}
              </Text>
              <Text
                style={[
                  styles.cardRightItem,
                  {
                    fontWeight: '600',
                    color: consts.TEXT_PRIMARY_COLOR,
                  },
                ]}
              >
                {`${parseInt(premium.total).toLocaleString(
                  'pt-BR',
                )} ${currency}`}
              </Text>
            </View>
          ))}
          <View style={styles.dottedLine} />
          <View style={[styles.cardItem, { marginVertical: 10 }]}>
            <Text
              style={[
                styles.cardLeftItem,
                {
                  opacity: 1,
                  textTransform: 'capitalize',
                  color: consts.TEXT_PRIMARY_COLOR,
                  paddingTop: 5,
                },
              ]}
            >
              {`${I18n.t('total_price')}:`}
            </Text>
            <Text
              style={[
                styles.cardRightItem,
                {
                  fontWeight: '700',
                  fontSize: 20,
                  color: consts.TEXT_PRIMARY_COLOR,
                },
              ]}
            >
              {`${parseInt(transactionItem.total).toLocaleString(
                'pt-BR',
              )} ${currency}`}
            </Text>
          </View>
        </View>

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
    marginVertical: 10,
    paddingHorizontal: width * 0.05,
  },
  formTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
  },
  formSunTitle: {
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 12,
    marginBottom: 10,
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
  },
  cardContainer: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    marginHorizontal: width * 0.05,
    backgroundColor: consts.CARD_BACKGROUND_COLOR,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    marginVertical: 8,
    marginHorizontal: 10,
  },
  cardLeftItem: {
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 12,
    color: consts.TEXT_PRIMARY_COLOR,
    opacity: 0.7,
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  cardRightItem: {
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 12,
    color: consts.TEXT_PRIMARY_COLOR,
  },
  priceDetailText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    opacity: 1,
    letterSpacing: 0.2,
    fontWeight: '500',
    fontSize: 16,
    textTransform: 'capitalize',
    marginVertical: 10,
    marginBottom: 0,
    marginLeft: 10,
  },
  dottedLine: {
    borderStyle: 'dotted',
    borderWidth: 1,
    borderRadius: consts.BORDER_RADIUS,
    borderColor: consts.TEXT_PRIMARY_LIGHT_COLOR,
    marginHorizontal: 0,
    marginTop: 5,
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
  errorTile: {
    fontSize: 14,
    fontFamily: consts.FONT_BOLD,
    lineHeight: 28,
    paddingBottom: 2,
    color: consts.BUTTON_COLOR_PRIMARY,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    color: consts.BUTTON_COLOR_PRIMARY,
  },
  errorWrap: {
    width: '90%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginVertical: 10,
    backgroundColor: '#fcd4d1',
    borderRadius: consts.BORDER_RADIUS,
  },
});

export default SendTransactionDetails;
