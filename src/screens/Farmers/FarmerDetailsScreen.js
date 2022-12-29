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
import { findAllTransactionsById } from '../../services/transactionsHelper';
import { findProductById } from '../../services/productsHelper';
import { findFarmerById } from '../../services/farmersHelper';
import { getAllCardsByNodeId } from '../../services/cardsHelper';
import {
  getCustomFieldValue,
  stringToJson,
} from '../../services/commonFunctions';
import TransparentButton from '../../components/TransparentButton';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import TransactionListItem from '../../components/TransactionListItem';
import Icon from '../../icons';
import I18n from '../../i18n/i18n';
import Countrys from '../../services/countrys';
import Avatar from '../../components/Avatar';
import * as consts from '../../services/constants';

const { width } = Dimensions.get('window');

const FarmerDetailsScreen = ({ navigation, route }) => {
  const { node, avatarBgColor } = route.params;
  const { userProjectDetails, userCompanyDetails } = useSelector(
    (state) => state.login,
  );
  const { currency } = userProjectDetails;
  const [selectedTab, setSelectedTab] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [farmer, setFarmer] = useState(node._raw);
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
    const transactionsList = await findAllTransactionsById(farmer.id);
    const farmerCards = await getAllCardsByNodeId(farmer.id);

    // sorting cards decending order by updated time
    farmerCards.sort((a, b) => {
      const small = a?.updated_at ?? 0;
      const big = b?.updated_at ?? 0;
      return big - small;
    });

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
    transactionsList.map(async (tx) => {
      if (!tx.node_name || !tx.product_name) {
        if (tx.product_id) {
          const product = await findProductById(tx.product_id);
          tx.product_name = product.name;
        } else {
          tx.product_name = '';
        }

        if (tx.node_id) {
          const nodeObj = await findFarmerById(tx.node_id);
          tx.node_name = nodeObj.name;
        } else {
          tx.node_name = '';
        }
      }
    });

    // sorting transaction list based on created date
    transactionsList.sort((a, b) => b.created_on - a.created_on);
    setTransactions(transactionsList);
  };

  const issueCardToFarmer = () => {
    navigation.navigate('IssueFarmerCard', { farmer, newFarmer: true });
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
        const arrayOfObjs = Object.entries(Countrys.data).map((e) => ({
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
        extra_fields:
          extraFields && Object.keys(extraFields).length > 0 ? extraFields : '',
      };
    }

    // navigates edit farmer page with current farmer details
    navigation.navigate('EditFarmer', {
      farmer: farmerDetails,
      otherDetails: farmer,
      updateFarmer,
    });
  };

  /**
   * updating farmer details from edit farmer page
   *
   * @param {object} farmerDetails updated farmer object
   */
  const updateFarmer = (farmerDetails) => {
    const farmerObj = farmerDetails;
    const phone =
      `${farmerDetails.phone.dial_code} ${farmerDetails.phone.phone}`.trim();
    farmerObj.phone = phone;
    farmerObj.updated_on = Math.round(Date.now());
    setFarmer(farmerObj);
  };

  /**
   * checking phone text includes both dial code and phone number.
   * if this condition true, returns phone text otherwise null
   *
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

  const renderItem = ({ item }) => (
    <TransactionListItem
      item={item}
      onSelect={(i) =>
        navigation.navigate('FarmerTransactionDetails', {
          transactionItem: i,
        })}
      currency={currency}
      historyview
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        backgroundColor={consts.APP_BG_COLOR}
        title={I18n.t('farmer_details')}
        leftIcon='arrow-left'
        onPress={() => navigation.goBack(null)}
        rightText={I18n.t('edit')}
        rightTextColor='#EA2553'
        onPressRight={editFarmerDetails}
        extraStyle={{ paddingHorizontal: width * 0.05 }}
      />

      <View style={styles.topSectionWrap}>
        <View style={styles.headerWrap}>
          <Avatar
            image={farmer.image}
            containerStyle={styles.propic}
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
              name='Sync-warning2'
              size={28}
              color='#F2994A'
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
              borderBottomColor:
                selectedTab === 0 ? consts.TEXT_PRIMARY_COLOR : '#EDEEEF',
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
              borderBottomColor:
                selectedTab === 1 ? consts.TEXT_PRIMARY_COLOR : '#EDEEEF',
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
              <Text style={styles.cardStatusTilte}>
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
                    cards[0].fair_id ? `/ ${I18n.t('fair_id')}` : null
                  }`}
                </Text>
                <Text style={styles.formTitle}>
                  {`${cards[0].card_id} ${
                    cards[0].fair_id ? `/ FF ${cards[0].fair_id}` : null
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
                  <Text style={styles.formTitle}>
                    {farmer.ktp.trim() === '' ? '-' : farmer.ktp}
                  </Text>
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
              <Text style={styles.formTitle}>
                {farmer.street.trim() === '' ? '-' : farmer.street}
              </Text>
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
                  : farmer.updated_on,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: consts.APP_BG_COLOR,
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
    fontFamily: consts.FONT_REGULAR,
    letterSpacing: 0.3,
    fontSize: 12,
    marginBottom: 10,
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
  },
  tabOneTop: {
    marginHorizontal: 25,
    marginTop: 30,
    marginBottom: 20,
    width: '90%',
  },
  formTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  cardStatusTilte: {
    fontFamily: consts.FONT_REGULAR,
    letterSpacing: 0.3,
    fontSize: 12,
    marginBottom: 10,
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
  },
  horizontalLine: {
    borderBottomWidth: 1,
    borderColor: consts.BORDER_COLOR,
    marginHorizontal: 18,
    marginBottom: 10,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propic: {
    width: 70,
    height: 70,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarNameStyle: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: consts.FONT_BOLD,
  },
  nameText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_MEDIUM,
    fontSize: 18,
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  phoneText: {
    fontSize: 14,
    color: consts.TEXT_PRIMARY_COLOR,
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
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_MEDIUM,
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
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
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
    backgroundColor: consts.APP_BG_COLOR,
  },
});

export default FarmerDetailsScreen;
