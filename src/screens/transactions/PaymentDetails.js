/* eslint-disable react/jsx-curly-newline */
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
  Image,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
// import Collapsible from 'react-native-collapsible';
import moment from 'moment';
import {
  stringToJson,
  getCustomFieldValue,
  convertCurrency,
} from '../../services/commonFunctions';
// import { ReportedIcon, ThinArrowDownIcon } from '../../assets/svg';
import { HIT_SLOP_FIFTEEN } from '../../services/constants';
import { searchCardById } from '../../db/services/CardHelper';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import Icon from '../../icons';
import I18n from '../../i18n/i18n';
import InvoiceModal from '../../components/InvoiceModal';

const { width, height } = Dimensions.get('window');

const PaymentDetails = ({ navigation, route }) => {
  const { paymentItem } = route.params;
  const {
    extra_fields,
    receipt,
    verification_latitude,
    verification_longitude,
    card_id,
    server_id,
    is_reported,
    reported,
    amount,
    date,
  } = paymentItem;
  const { theme } = useSelector((state) => state.common);
  const { userProjectDetails } = useSelector((state) => state.login);
  const { currency } = userProjectDetails;
  const [openSetUpModal, setOpenSetUpModal] = useState(false);
  const [filename, setFilename] = useState('');
  const [paymentExtraFields, setPaymentExtraFields] = useState([]);
  const [cardDetails, setCardDetails] = useState({});
  // const [activeCollapse, setActiveCollapse] = useState(true);
  // const [reportedDetails, setReportedDetails] = useState(null);
  const [validMap, setValidMap] = useState(null);

  useEffect(() => {
    setupDetails();
  }, []);

  /**
   * setting initial values
   */
  const setupDetails = async () => {
    if (extra_fields) {
      let extraFieldsArr = extra_fields;

      if (extraFieldsArr && typeof extraFieldsArr === 'string') {
        extraFieldsArr = stringToJson(extraFieldsArr);
      }

      const payFields =
        extraFieldsArr?.custom_fields?.pay_farmer_fields ?? null;
      if (payFields) {
        setPaymentExtraFields(payFields);
      }
    }

    if (receipt) {
      const name = receipt.replace(/^.*[\\/]/, '');
      setFilename(name);
    }

    if (verification_latitude && verification_longitude) {
      setValidMap(true);
    } else {
      setValidMap(false);
    }

    if (card_id) {
      const card = await searchCardById(card_id);
      if (card.length > 0) {
        setCardDetails(card[0]);
      } else {
        setCardDetails({});
      }
    }

    if (is_reported) {
      let reportedData = reported;
      if (reportedData && typeof reportedData === 'string') {
        reportedData = stringToJson(reportedData);
      }
      setReportedDetails(reportedData);
    }
  };

  const openGoogleMap = () => {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${verification_latitude}%2C${verification_longitude}`,
    );
  };

  // const goToReportPage = () => {
  //   navigation.navigate('ReportPayment', {
  //     paymentItem,
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
        title={I18n.t('payment_details')}
        leftIcon="arrow-left"
        onPress={() => backNavigation()}
        extraStyle={{ paddingHorizontal: 20 }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {(server_id === '' || server_id == null) && (
          <View style={styles.syncWarningWrap}>
            <View style={{ marginHorizontal: 10, marginVertical: 5 }}>
              <Icon name="Sync-warning2" size={28} color="#F2994A" />
            </View>
            <Text style={styles.syncMsg}>
              {I18n.t('this_transaction_is_not_synced_to_the_server')}
            </Text>
          </View>
        )}

        {/* {is_reported && reportedDetails && (
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

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>{I18n.t('payment_type')}</Text>
          <Text style={styles.formTitle}>
            {paymentItem.premium_name || `[${I18n.t('not_available')}]`}
          </Text>
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>{I18n.t('amount')}</Text>
          <Text style={styles.formTitle}>
            {`${convertCurrency(amount)} ${currency}`}
          </Text>
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>{I18n.t('transaction_date')}</Text>
          <Text style={styles.formTitle}>
            {moment(date * 1000).format('DD MMM YYYY hh:mm a')}
          </Text>
        </View>

        {paymentExtraFields.map((i, n) => {
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

        {receipt && (
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

        {validMap && (
          <View style={styles.formTitleContainer}>
            <Text style={styles.formSubTitle}>Location</Text>
            <TouchableOpacity
              onPress={() => openGoogleMap()}
              style={styles.mapImageWrap}
            >
              <Image
                source={require('../../assets/images/map.png')}
                style={styles.mapImage}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* {!is_reported && (
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

        {openSetUpModal && (
          <View style={{ flex: 1, position: 'absolute' }}>
            <InvoiceModal
              openSetUpModal={openSetUpModal}
              closeModal={() => setOpenSetUpModal(false)}
              imageUri={receipt}
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
      marginTop: 'auto',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 5,
      borderTopColor: theme.border_1,
      borderTopWidth: 1,
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
    mapImageWrap: {
      width: '100%',
      height: height * 0.3,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      borderRadius: theme.border_radius,
      overflow: 'hidden',
    },
    mapImage: {
      width: '100%',
      height: height * 0.3,
    },
  });
};

export default PaymentDetails;
