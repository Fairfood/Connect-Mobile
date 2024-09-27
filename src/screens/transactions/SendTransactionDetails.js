import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
// import Collapsible from 'react-native-collapsible';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  convertCurrency,
  convertQuantity,
  deleteTransaction,
} from '../../services/commonFunctions';
import {
  DeleteConfirmIcon,
  // ReportedIcon,
  // ThinArrowDownIcon,
} from '../../assets/svg';
import {
  TYPE_TRANSACTION_PREMIUM,
  APP_TRANS_TYPE_OUTGOING,
  DELETE_TRANSACTION_ENABLED,
  HIT_SLOP_FIFTEEN,
} from '../../services/constants';
import { fetchPremiumsByTransactionAndCategory } from '../../db/services/TransactionPremiumHelper';
import { findPremium } from '../../db/services/PremiumsHelper';
import { initiateSync } from '../../sync/SyncInitials';
import { countErroredTransactions } from '../../db/services/TransactionsHelper';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import InvoiceModal from '../../components/InvoiceModal';
import Icon from '../../icons';
import I18n from '../../i18n/i18n';
import CommonAlert from '../../components/CommonAlert';
import DeleteTransactionView from '../../components/DeleteTransactionView';

const { width } = Dimensions.get('window');

const SendTransactionDetails = ({ navigation, route }) => {
  const { transactionItem } = route.params;
  const { theme } = useSelector((state) => state.common);
  const { userProjectDetails } = useSelector((state) => state.login);
  const { currency } = userProjectDetails;
  const [openSetUpModal, setOpenSetUpModal] = useState(false);
  const [paidToFarmers, setPaidToFarmers] = useState('');
  const [premiums, setPremiums] = useState([]);
  const [basePrice, setBasePrice] = useState(0);
  const [filename, setFilename] = useState('');
  const [alertModal, setAlertModal] = useState(false);
  const [deleteButton, setDeleteButton] = useState(false);
  const [cardDetails, setCardDetails] = useState({});
  // const [activeCollapse, setActiveCollapse] = useState(true);
  // const [reportedDetails, setReportedDetails] = useState(null);

  useEffect(() => {
    setupDetails();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setUpDeleteTnxStatus();
      return () => {};
    }, []),
  );

  /**
   * setting initial values
   */
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

    const transactionPremiums = await fetchPremiumsByTransactionAndCategory(
      transactionItem.id,
      TYPE_TRANSACTION_PREMIUM,
    );

    const filteredPremiums = await Promise.all(
      transactionPremiums.map(async (p) => {
        const premium = await findPremium(p.premium_id);

        if (premium.type === 101) {
          premium.total = premium.amount;
        } else if (premium.type === 301) {
          premium.total = Math.round(p.amount);
        } else {
          premium.total = Math.round(p.amount);
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
      setPaidToFarmers(`[${I18n.t('not_available')}]`);
    } else {
      setPaidToFarmers(total);
    }

    if (transactionItem.card_id) {
      let buyers = await AsyncStorage.getItem('buyers');
      buyers = JSON.parse(buyers);
      if (buyers.length > 0) {
        const { cards } = buyers[0];

        const filteredCards = cards.filter((card) => {
          return card.id === transactionItem.card_id;
        });
        if (filteredCards.length > 0) {
          setCardDetails(filteredCards[0]);
        } else {
          setCardDetails({});
        }
      }
    }

    if (transactionItem.is_reported) {
      let reportedData = transactionItem.reported;

      if (reportedData && typeof reportedData === 'string') {
        reportedData = stringToJson(reportedData);
      }

      setReportedDetails(reportedData);
    }
  };

  /**
   * setting delete transaction option
   */
  const setUpDeleteTnxStatus = async () => {
    const deleteTnxEnabled = await AsyncStorage.getItem('deleteTnxEnabled');
    if (deleteTnxEnabled && deleteTnxEnabled === 'true') {
      setDeleteButton(true);
    } else {
      setDeleteButton(false);
    }
  };

  /**
   * delete transaction
   */
  const handleDelete = async () => {
    await deleteTransaction(transactionItem, APP_TRANS_TYPE_OUTGOING);
    const count = await countErroredTransactions();
    if (count === 0) {
      initiateSync();
    }

    setAlertModal(false);
    navigation.goBack();
  };

  // const goToReportPage = () => {
  //   navigation.navigate('ReportTransaction', {
  //     transactionItem,
  //   });
  // };

  /**
   * redirecting to previous page
   */
  const backNavigation = () => {
    navigation.goBack(null);
  };

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        backgroundColor={theme.background_1}
        title={I18n.t('transaction_details')}
        leftIcon="arrow-left"
        onPress={() => backNavigation()}
        extraStyle={{ paddingHorizontal: width * 0.05 }}
      />
      <ScrollView>
        {(transactionItem.server_id === '' ||
          transactionItem.server_id == null) &&
          transactionItem.error === '' && (
            <View style={styles.syncWarningWrap}>
              <Icon
                name="Sync-warning2"
                size={28}
                color="#F2994A"
                style={{ marginHorizontal: 10 }}
              />
              <Text style={styles.syncMsg}>
                {I18n.t('this_transaction_is_not_synced_to_the_server')}
              </Text>
            </View>
          )}

        {/* {transactionItem.is_reported && reportedDetails && (
          <TouchableOpacity
            onPress={() => setActiveCollapse(!activeCollapse)}
            style={styles.errorWrap}
          >
            <View style={styles.errorTitleWrap}>
              <ReportedIcon width={width * 0.06} height={width * 0.06} />
              <Text style={styles.errorTile}>
                {I18n.t('transaction_reported')}
              </Text>
              <View style={styles.arrowWrap}>
                <ThinArrowDownIcon
                  width={width * 0.035}
                  height={width * 0.035}
                  fill={theme.primary}
                />
              </View>
            </View>
            <Collapsible collapsed={activeCollapse} align="center">
              <View style={styles.errorMessageWrap}>
                <View style={styles.leftColumn}>
                  <View style={styles.bulletin} />
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.errorMessage}>
                    {I18n.t(reportedDetails.report_category)}
                  </Text>
                </View>
              </View>

              <View style={styles.errorMessageWrap}>
                <View style={styles.leftColumn}>
                  <View style={styles.bulletin} />
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.errorMessage}>
                    {reportedDetails.report_message}
                  </Text>
                </View>
              </View>
            </Collapsible>
          </TouchableOpacity>
        )} */}

        {(transactionItem.server_id === '' ||
          transactionItem.server_id == null) &&
          transactionItem.error !== '' && (
            <DeleteTransactionView
              error={transactionItem.error}
              deleteButton={DELETE_TRANSACTION_ENABLED && deleteButton}
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
            {convertQuantity(transactionItem.quantity)}
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

        {cardDetails?.card_id && (
          <View style={styles.formTitleContainer}>
            <Text style={styles.formSubTitle}>
              {`${I18n.t('card_id')} ${
                cardDetails.fair_id !== '' ? `/ ${I18n.t('fair_id')}` : ''
              }`}
            </Text>
            <Text style={styles.formTitle}>
              {`${cardDetails.card_id} ${
                cardDetails.fairid !== '' ? `/ FF ${cardDetails.fairid}` : ''
              }`}
            </Text>
          </View>
        )}

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
                  hitSlop={HIT_SLOP_FIFTEEN}
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
                { color: theme.text_1, width: '70%' },
              ]}
            >
              {`${I18n.t('total_paid_to_farmers')}:`}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <Text
                style={[
                  styles.cardRightItem,
                  {
                    color: theme.text_1,
                  },
                ]}
              >
                {`${convertCurrency(paidToFarmers)} ${
                  convertCurrency(paidToFarmers) ? currency : ''
                }`}
              </Text>
            </View>
          </View>

          {premiums.map((premium, index) => (
            <View key={index.toString()} style={styles.cardItem}>
              <Text style={[styles.cardLeftItem, { color: theme.text_1 }]}>
                {`${premium.name} ${I18n.t('paid')}:`}
              </Text>
              <Text
                style={[
                  styles.cardRightItem,
                  {
                    fontWeight: '600',
                    color: theme.text_1,
                  },
                ]}
              >
                {`${convertCurrency(premium.total)} ${currency}`}
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
                  color: theme.text_1,
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
                  color: theme.text_1,
                },
              ]}
            >
              {`${convertCurrency(transactionItem.total)} ${currency}`}
            </Text>
          </View>
        </View>

        {/* {!transactionItem.is_reported && (
          <View style={styles.reportSectionWrap}>
            <Text style={styles.reportTitleText}>
              {I18n.t('trouble_in_transaction')}
            </Text>
            <TouchableOpacity
              onPress={() => goToReportPage()}
              hitSlop={HIT_SLOP_FIFTEEN}
            >
              <Text style={styles.reportButtonText}>
                {`${I18n.t('report_issue')} >`}
              </Text>
            </TouchableOpacity>
          </View>
        )} */}

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

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    formTitleContainer: {
      marginVertical: 10,
      paddingHorizontal: width * 0.05,
    },
    formTitle: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
    },
    formSunTitle: {
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 12,
      marginBottom: 10,
      color: theme.text_2,
    },
    formSubTitle: {
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      marginBottom: 10,
      color: '#5691AE',
    },
    cardContainer: {
      marginTop: 10,
      marginBottom: 20,
      paddingHorizontal: 10,
      marginHorizontal: width * 0.05,
      backgroundColor: theme.background_2,
      borderRadius: theme.border_radius,
    },
    cardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      marginVertical: 8,
      marginHorizontal: 10,
    },
    cardLeftItem: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 12,
      color: theme.text_1,
      opacity: 0.7,
      letterSpacing: 0.2,
      textTransform: 'capitalize',
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 12,
      color: theme.text_1,
    },
    priceDetailText: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
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
      borderRadius: theme.border_radius,
      borderColor: theme.text_2,
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
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_medium,
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
      color: theme.text_2,
      justifyContent: 'center',
      alignSelf: 'center',
      width: '60%',
      marginVertical: 10,
    },
    viewImageButtonText: {
      fontSize: 13,
      textDecorationLine: 'underline',
      color: '#4DCAF4',
      fontFamily: theme.font_bold,
      textAlign: 'right',
      marginVertical: 10,
    },
    reportSectionWrap: {
      width: '90%',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 5,
    },
    reportTitleText: {
      color: theme.text_2,
      fontFamily: theme.font_regular,
      fontSize: width * 0.035,
    },
    reportButtonText: {
      color: theme.primary,
      fontFamily: theme.font_medium,
      fontSize: width * 0.035,
    },
    bulletin: {
      width: 5,
      height: 5,
      borderRadius: 5 / 2,
      backgroundColor: '#053B5F',
    },
    errorTitleWrap: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 2,
      paddingHorizontal: 20,
    },
    errorMessageWrap: {
      flexDirection: 'row',
      paddingHorizontal: 25,
    },
    leftColumn: {
      width: '5%',
      alignItems: 'center',
      paddingTop: 12,
    },
    rightColumn: {
      width: '95%',
      justifyContent: 'center',
      paddingLeft: 5,
    },
    errorTile: {
      fontSize: 14,
      fontFamily: theme.font_bold,
      color: theme.primary,
      marginLeft: 10,
    },
    errorMessage: {
      fontSize: 14,
      fontFamily: theme.font_regular,
      lineHeight: 25,
      paddingBottom: 5,
      color: '#053B5F',
    },
    errorWrap: {
      width: '90%',
      alignSelf: 'center',
      paddingVertical: 15,
      marginVertical: 10,
      backgroundColor: 'rgba(255, 176, 170, 0.04)',
      borderRadius: theme.border_radius,
      borderColor: 'rgba(255, 176, 170, 1)',
      borderWidth: 1,
    },
    arrowWrap: {
      position: 'absolute',
      right: 15,
      alignSelf: 'center',
    },
  });
};

export default SendTransactionDetails;
