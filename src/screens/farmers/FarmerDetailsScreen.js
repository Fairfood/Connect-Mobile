/* eslint-disable react/jsx-curly-newline */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import {
  getCustomFieldValue,
  stringToJson,
} from '../../services/commonFunctions';
import TransparentButton from '../../components/TransparentButton';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import TransactionListItem from '../../components/TransactionListItem';
import Icon from '../../icons';
import I18n from '../../i18n/i18n';
import Countries from '../../services/countries';
import Avatar from '../../components/Avatar';
import { findFarmer } from '../../db/services/FarmerHelper';
import { fetchCardsByNodeId } from '../../db/services/CardHelper';
import { findProduct } from '../../db/services/ProductsHelper';
import { fetchTransactionsByNodId } from '../../db/services/TransactionsHelper';

const { width } = Dimensions.get('window');

const FarmerDetailsScreen = ({ navigation, route }) => {
  const { node, avatarBgColor } = route.params;
  const { theme } = useSelector((state) => state.common);
  const { userProjectDetails, userCompanyDetails } = useSelector(
    (state) => state.login,
  );
  const { currency } = userProjectDetails;
  const [selectedTab, setSelectedTab] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [farmer, setFarmer] = useState(node);
  const [farmerExtraFields, setFarmerExtraFields] = useState([]);
  const appCustomFields = userCompanyDetails?.app_custom_fields
    ? stringToJson(userCompanyDetails.app_custom_fields)
    : null;
  const fieldVisibility = appCustomFields?.field_visibility?.add_farmer ?? null;

  useEffect(() => {
    setupDetails();
  }, []);

  /**
   * setting initial values
   */
  const setupDetails = async () => {
    const farmerCards = await fetchCardsByNodeId(farmer.id);

    // sorting cards descending order by updated time
    farmerCards.sorted('updated_at', false);
    setCards(farmerCards);

    // setting extra field values
    if (node?.extra_fields) {
      let extraFields = node.extra_fields;

      if (extraFields && typeof extraFields === 'string') {
        extraFields = stringToJson(extraFields);
      }

      const farmerFields = extraFields?.custom_fields?.farmer_fields ?? null;
      if (farmerFields) {
        setFarmerExtraFields(farmerFields);
      }
    }

    // adding product and farmer name for transaction list
    const transactionsList = await fetchTransactionsByNodId(farmer.id);
    const convertedTransactionsList = Array.from(transactionsList);
    convertedTransactionsList.map(async (tx) => {
      if (!tx.node_name || !tx.product_name) {
        if (tx.product_id) {
          const product = await findProduct(tx.product_id);
          tx.product_name = product.name;
        } else {
          tx.product_name = '';
        }

        if (tx.node_id) {
          const nodeObj = await findFarmer(tx.node_id);
          tx.node_name = nodeObj.name;
        } else {
          tx.node_name = '';
        }
      }
    });

    // sorting transaction list based on created date
    convertedTransactionsList.sort(
      (a, b) =>
        new Date(b.created_on).getTime() - new Date(a.created_on).getTime(),
    );
    setTransactions(transactionsList);
  };

  const issueCardToFarmer = () => {
    navigation.navigate('IssueFarmerCard', { farmer });
  };

  /**
   * setting farmer details for edit page
   */
  const editFarmerDetails = () => {
    let farmerDetails = farmer;
    let phone = farmer.phone.trim();

    let extraFields = {};
    if (farmer.extra_fields) {
      extraFields = farmer.extra_fields;

      if (extraFields && typeof extraFields === 'string') {
        extraFields = stringToJson(extraFields);
      }
    }

    // checking phone includes both dial code and phone number
    if (phone.includes(' ')) {
      farmerDetails = {
        name: farmer.name,
        type: 2,
        mobile: phone.split(' ')[1], // phone number
        street: farmer.street,
        city: farmer.city,
        country: farmer.country,
        province: farmer.province,
        postalCode: farmer.zipcode,
        profilePic: farmer.image,
        dialCode: phone.split(' ')[0].replace('+', ''), // dial code
        ktp: farmer.ktp,
        extra_fields:
          extraFields && Object.keys(extraFields).length > 0 ? extraFields : '',
      };
    } else {
      // if phone is empty setting a dial code based on country
      if (phone === '') {
        const arrayOfObjs = Object.entries(Countries.data).map((e) => ({
          label: `+${e[1].dial_code}`,
          value: e[1].dial_code,
          country_name: e[0],
        }));

        // taking farmer country or related company country
        const country = farmer.country || userCompanyDetails.country;
        const countryDetails = arrayOfObjs.filter((i) => {
          return i.country_name === country;
        });

        if (countryDetails?.[0]?.value) {
          phone = countryDetails[0].value;
        }
      }

      farmerDetails = {
        name: farmer.name,
        type: 2,
        mobile: '',
        street: farmer.street,
        city: farmer.city,
        country: farmer.country,
        province: farmer.province,
        postalCode: farmer.zipcode,
        profilePic: farmer.image,
        dialCode: phone.replace('+', ''),
        ktp: farmer.ktp,
        card_id: cards.length > 0 ? cards[0].card_id : '',
        extra_fields:
          extraFields && Object.keys(extraFields).length > 0 ? extraFields : '',
      };
    }

    // navigates edit farmer page with current farmer details
    navigation.navigate('EditFarmer', {
      farmer: farmerDetails,
      otherDetails: farmer,
      updateEditedFarmer,
    });
  };

  /**
   * updating farmer details from edit farmer page
   * @param {object} farmerDetails updated farmer object
   */
  const updateEditedFarmer = (farmerDetails) => {
    const farmerObj = farmerDetails;
    farmerObj.updated_on = Math.round(Date.now());
    setFarmer(farmerObj);
  };

  /**
   * checking phone text includes both dial code and phone number.
   * if this condition true, returns phone text otherwise null
   * @param   {string} phone phone text
   * @returns {any}          phone text or null
   */
  const getPhoneText = (phone) => {
    const phoneText = phone.trim();
    if (phoneText.includes(' ')) {
      return phoneText;
    }
    return null;
  };

  const renderItem = ({ item }) => {
    return (
      <TransactionListItem
        item={item}
        onSelect={(i) =>
          navigation.navigate('FarmerTransactionDetails', {
            transactionItem: i,
          })
        }
        currency={currency}
        historyView
      />
    );
  };

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        backgroundColor={theme.background_1}
        title={I18n.t('farmer_details')}
        leftIcon="arrow-left"
        onPress={() => navigation.goBack(null)}
        rightText={I18n.t('edit')}
        rightTextColor="#EA2553"
        onPressRight={editFarmerDetails}
        extraStyle={{ paddingHorizontal: width * 0.05 }}
      />

      <View style={styles.topSectionWrap}>
        <View style={styles.headerWrap}>
          <Avatar
            image={farmer?.image ?? ''}
            containerStyle={styles.proPic}
            avatarName={farmer.name}
            avatarNameStyle={styles.avatarNameStyle}
            avatarBgColor={avatarBgColor}
          />

          <View style={[styles.formTitleContainer, { marginLeft: 15 }]}>
            <Text style={styles.nameText} numberOfLines={4}>
              {farmer.name}
            </Text>
            <Text style={styles.phoneText}>{getPhoneText(farmer.phone)}</Text>
          </View>
        </View>
        {(farmer.server_id === '' || farmer.is_modified) && (
          <View style={styles.syncWarningWrap}>
            <Icon
              name="Sync-warning2"
              size={28}
              color="#F2994A"
              style={{ marginHorizontal: 10 }}
            />
            <Text style={styles.syncMsg}>
              {I18n.t('farmer_details_not_synced_to_the_server')}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          onPress={() => setSelectedTab(0)}
          style={[
            styles.tabItemWrap,
            {
              borderBottomColor: selectedTab === 0 ? theme.text_1 : '#EDEEEF',
            },
          ]}
        >
          <Text
            style={[
              styles.tabItemTitle,
              { opacity: selectedTab === 0 ? 1 : 0.5 },
            ]}
          >
            {I18n.t('basic_details')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTab(1)}
          style={[
            styles.tabItemWrap,
            {
              borderBottomColor: selectedTab === 1 ? theme.text_1 : '#EDEEEF',
            },
          ]}
        >
          <Text
            style={[
              styles.tabItemTitle,
              { opacity: selectedTab === 1 ? 1 : 0.5 },
            ]}
          >
            {I18n.t('transaction_history')}
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 0 && (
        <ScrollView>
          <View style={styles.tabOneTop}>
            <View style={styles.cardView}>
              <Text style={styles.cardStatusTitle}>
                {I18n.t('card_status')}
              </Text>
              <TransparentButton
                buttonText={
                  cards.length !== 0
                    ? I18n.t('reissue_card')
                    : I18n.t('issue_card')
                }
                padding={5}
                paddingHorizontal={5}
                onPress={() => issueCardToFarmer()}
              />
            </View>
            <Text style={[styles.formTitle, { marginTop: -25 }]}>
              {cards.length !== 0 ? I18n.t('active') : I18n.t('pending')}
            </Text>
            {cards.length !== 0 && (
              <View style={styles.cardValueWrap}>
                <Text style={styles.fieldValue}>
                  {`${I18n.t('card_id')} ${
                    cards[0].fair_id ? `/ ${I18n.t('fair_id')}` : ''
                  }`}
                </Text>
                <Text style={styles.formTitle}>
                  {`${cards[0].card_id} ${
                    cards[0].fair_id ? `/ FF ${cards[0].fair_id}` : ''
                  }`}
                </Text>
              </View>
            )}

            {farmer.ktp !== '' &&
              (fieldVisibility ? fieldVisibility?.ktp : true) && (
                <View style={{ marginVertical: 10 }}>
                  <Text style={styles.fieldValue} numberOfLines={1}>
                    {I18n.t('ktp')}
                  </Text>
                  <Text style={styles.formTitle}>{farmer.ktp || '-'}</Text>
                </View>
              )}
          </View>

          <View style={styles.horizontalLine} />

          <View style={styles.formTitleContainer}>
            <Text style={styles.formTitle}>{I18n.t('address')}</Text>
          </View>

          {(fieldVisibility ? fieldVisibility?.street : true) && (
            <View style={styles.formTitleContainer}>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {I18n.t('street_name')}
              </Text>
              <Text style={styles.formTitle}>{farmer.street || '-'}</Text>
            </View>
          )}

          {(fieldVisibility ? fieldVisibility?.city : true) && (
            <View style={styles.formTitleContainer}>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {I18n.t('city_village')}
              </Text>
              <Text style={styles.formTitle}>{farmer.city}</Text>
            </View>
          )}

          {(fieldVisibility ? fieldVisibility?.country : true) && (
            <View style={styles.formTitleContainer}>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {I18n.t('country')}
              </Text>
              <Text style={styles.formTitle}>{farmer.country}</Text>
            </View>
          )}

          {(fieldVisibility ? fieldVisibility?.province : true) && (
            <View style={styles.formTitleContainer}>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {I18n.t('province')}
              </Text>
              <Text style={styles.formTitle}>{farmer.province}</Text>
            </View>
          )}

          {(fieldVisibility ? fieldVisibility?.postcode : true) && (
            <View style={styles.formTitleContainer}>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {I18n.t('postal_code')}
              </Text>
              <Text style={styles.formTitle}>
                {farmer.zipcode === '' ? '-' : farmer.zipcode}
              </Text>
            </View>
          )}

          <View style={styles.horizontalLine} />

          {farmerExtraFields.map((i, n) => {
            return (
              <View key={n.toString()} style={styles.formTitleContainer}>
                <Text style={styles.fieldValue} numberOfLines={1}>
                  {i?.label?.en ?? i.key}
                </Text>
                <Text style={styles.formTitle}>
                  {getCustomFieldValue(i) ?? '-'}
                </Text>
              </View>
            );
          })}

          <View style={styles.horizontalLine} />

          <View style={styles.formTitleContainer}>
            <Text style={styles.fieldValue}>
              {I18n.t('last_updated_on')}
              {` ${moment(
                farmer.updated_on === 0
                  ? farmer.created_on * 1000
                  : farmer.updated_on * 1000,
              ).format('MMMM Do YYYY, h:mm a')}`}
            </Text>
          </View>
        </ScrollView>
      )}

      {selectedTab === 1 && (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          extraData={transactions}
          style={styles.flatListStyle}
          ListEmptyComponent={() => (
            <View style={styles.emptyWrap}>
              <Text style={styles.formTitle}>{I18n.t('no_transactions')}</Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
    </SafeAreaView>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    topSectionWrap: {
      marginHorizontal: 25,
      marginTop: 20,
      marginBottom: 40,
      width: '85%',
    },
    formTitleContainer: {
      marginHorizontal: 25,
      marginVertical: 7,
      width: '80%',
    },
    cardValueWrap: {
      marginTop: 15,
    },
    fieldValue: {
      fontFamily: theme.font_regular,
      letterSpacing: 0.3,
      fontSize: 12,
      marginBottom: 10,
      color: theme.text_2,
    },
    tabOneTop: {
      marginHorizontal: 25,
      marginTop: 30,
      marginBottom: 20,
      width: '90%',
    },
    formTitle: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      letterSpacing: 0.3,
    },
    cardStatusTitle: {
      fontFamily: theme.font_regular,
      letterSpacing: 0.3,
      fontSize: 12,
      marginBottom: 10,
      color: theme.text_2,
    },
    horizontalLine: {
      borderBottomWidth: 1,
      borderColor: theme.border_1,
      marginHorizontal: 18,
      marginBottom: 10,
    },
    headerWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    proPic: {
      width: 70,
      height: 70,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarNameStyle: {
      color: '#ffffff',
      fontSize: 22,
      fontFamily: theme.font_bold,
    },
    nameText: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 18,
      letterSpacing: 0.3,
      lineHeight: 24,
    },
    phoneText: {
      fontSize: 14,
      color: theme.text_1,
      marginVertical: 5,
      lineHeight: 24,
    },
    syncWarningWrap: {
      backgroundColor: '#DDF3FF',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      flexDirection: 'row',
      paddingVertical: 10,
      marginTop: 20,
      marginBottom: 0,
    },
    syncMsg: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_medium,
      fontStyle: 'normal',
      fontSize: 12,
      letterSpacing: 0.3,
      marginVertical: 5,
    },
    tabItemWrap: {
      borderBottomWidth: 4,
      width: '50%',
      height: 40,
    },
    tabItemTitle: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 12,
      letterSpacing: 0.3,
      alignSelf: 'center',
    },
    emptyWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 20,
    },
    cardView: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    flatListStyle: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
  });
};

export default FarmerDetailsScreen;
