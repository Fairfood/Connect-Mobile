/* eslint-disable camelcase */
import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
// import Collapsible from 'react-native-collapsible';
import moment from 'moment';
import {
  stringToJson,
  deleteTransaction,
  getCustomFieldValue,
  convertQuantity,
} from '../../services/commonFunctions';
import { fetchPremiumsByTransactionAndCategory } from '../../db/services/TransactionPremiumHelper';
import { initiateSync } from '../../sync/SyncInitials';
import { findPremium } from '../../db/services/PremiumsHelper';
import { searchCardById } from '../../db/services/CardHelper';
import { countErroredTransactions } from '../../db/services/TransactionsHelper';
import {
  DeleteConfirmIcon,
  // ReportedIcon,
  // ThinArrowDownIcon,
} from '../../assets/svg';
import {
  TYPE_TRANSACTION_PREMIUM,
  APP_TRANS_TYPE_INCOMING,
  DELETE_TRANSACTION_ENABLED,
  APP_TRANS_TYPE_LOSS,
  HIT_SLOP_FIFTEEN,
} from '../../services/constants';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import Card from '../../components/Card';
import Icon from '../../icons';
import I18n from '../../i18n/i18n';
import CommonAlert from '../../components/CommonAlert';
import DeleteTransactionView from '../../components/DeleteTransactionView';
import InvoiceModal from '../../components/InvoiceModal';

const { width } = Dimensions.get('window');

const TransactionDetails = ({ navigation, route }) => {
  const { transactionItem } = route.params;

  const { theme } = useSelector((state) => state.common);
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

    setQuantity(transactionItem.quantity);
    setBasePrice(transactionItem.price);

    const transactionPremiums = await fetchPremiumsByTransactionAndCategory(
      transactionItem.id,
      TYPE_TRANSACTION_PREMIUM,
    );

    Promise.all(
      transactionPremiums.map(async (p) => {
        const transPremium = await findPremium(p.premium_id);

        p.included_in_amt = transPremium.included_in_amt;
        p.is_card_dependent = transPremium.is_card_dependent;
      }),
    ).then(async () => {
      const transPremiums = await Promise.all(
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
      setPremiums(transPremiums);
    });

    if (transactionItem.card_id) {
      const card = await searchCardById(transactionItem.card_id);
      if (card.length > 0) {
        setCardDetails(card[0]);
      } else {
        setCardDetails({});
      }
    }

    // if (transactionItem.is_reported) {
    //   let reportedData = transactionItem.reported;

    //   if (reportedData && typeof reportedData === 'string') {
    //     reportedData = stringToJson(reportedData);
    //   }

    //   setReportedDetails(reportedData);
    // }
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
   * get total price (base price + premium)
   * @returns {number} total price
   */
  const getTotalPrice = () => {
    const total = premiums.reduce((a, b) => {
      return a + b.total;
    }, parseFloat(basePrice));
    return Math.round(total);
  };

  /**
   * delete transaction
   */
  const handleDelete = async () => {
    await deleteTransaction(transactionItem, APP_TRANS_TYPE_INCOMING);
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
        extraStyle={{ paddingHorizontal: 20 }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {(transactionItem.server_id === '' ||
          transactionItem.server_id == null) &&
          transactionItem.error === '' && (
            <View style={styles.syncWarningWrap}>
              <View style={{ marginHorizontal: 10, marginVertical: 5 }}>
                <Icon name="Sync-warning2" size={28} color="#F2994A" />
              </View>
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

        {transactionItem.type === APP_TRANS_TYPE_LOSS && (
          <View style={styles.lossTitleWrap}>
            <View style={styles.person}>
              <Text style={styles.lossSymbol}>!</Text>
            </View>
            <Text style={styles.lossTitle}>{I18n.t('loss')}</Text>
          </View>
        )}

        {transactionItem.type !== APP_TRANS_TYPE_LOSS && (
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
            {transactionItem.type === APP_TRANS_TYPE_LOSS
              ? `${I18n.t('quantity_lost')} Kg`
              : `${I18n.t('total_quantity')} Kg`}
          </Text>
          <Text style={styles.formTitle}>
            {convertQuantity(transactionItem.quantity)}
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

        {cardDetails?.card_id && (
          <View style={styles.formTitleContainer}>
            <Text style={styles.formSubTitle}>
              {`${I18n.t('card_id')} ${
                cardDetails.fair_id !== '' ? `/ ${I18n.t('fair_id')}` : ''
              }`}
            </Text>
            <Text style={styles.formTitle}>
              {`${cardDetails.card_id} ${
                cardDetails.fair_id !== '' ? `/ FF ${cardDetails.fair_id}` : ''
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

        {transactionItem.type !== APP_TRANS_TYPE_LOSS && (
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
      alignSelf: 'center',
      width: '90%',
      marginVertical: 10,
    },
    formTitle: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
    },
    formSubTitle: {
      fontWeight: '500',
      fontFamily: theme.font_regular,
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
      color: theme.text_1,
      fontFamily: theme.font_regular,
      marginLeft: width * 0.02,
    },
    lossSymbol: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: theme.font_bold,
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
    cardWrap: {
      width: '90%',
      alignSelf: 'center',
      paddingBottom: 20,
      borderBottomColor: theme.border_1,
      borderBottomWidth: 1,
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

export default TransactionDetails;
