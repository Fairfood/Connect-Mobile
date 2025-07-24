import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import { getCustomFieldValue } from '../../../utils/helperFunctions';
import { findFarmer } from '../../../db/services/FarmerHelper';
import { findProduct } from '../../../db/services/ProductsHelper';
import { fetchTransactionsByNodId } from '../../../db/services/TransactionsHelper';
import {
  getFarmerDetails,
  fieldVisibility,
  getPhoneText,
  getSubmissionFields,
} from './controller';
import { HIT_SLOP_TWENTY } from '../../../utils/constants';
import TransparentButton from '../../../components/buttons/transparentButton';
import CustomLeftHeader from '../../../components/headers/customLeftHeader';
import I18n from '../../../translations/text/i18n';
import Avatar from '../../../components/avatar';
import StyleSheetFactory from './styles';
import CardVerificationStatus from '../../../components/cardVerificationStatus';
import { SyncPendingSecondaryIcon } from '../../../assets/svg';
import HistoryListItem from '../../../components/lists/historyListItem';

const { width } = Dimensions.get('window');

const FarmerDetailsScreen = ({ navigation, route }) => {
  const { node, avatarBgColor } = route.params;
  const { theme } = useSelector((state) => state.common);
  const { cardSyncingInProgress } = useSelector((state) => state.sync);
  const { userCompanyDetails, syncInProgress } = useSelector(
    (state) => state.login,
  );
  const forms = userCompanyDetails?.forms ?? [];
  const [selectedTab, setSelectedTab] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [farmer, setFarmer] = useState(node);
  const [farmerExtraFields, setFarmerExtraFields] = useState([]);
  const styles = StyleSheetFactory();

  useFocusEffect(
    useCallback(() => {
      setupDetails();
      return () => {};
    }, []),
  );

  /**
   * setting initial values
   */
  const setupDetails = async () => {
    // setting extra field values
    if (node.extra_fields) {
      const submissionFields = await getSubmissionFields(node.extra_fields);
      setFarmerExtraFields(submissionFields);
    }

    // adding product and farmer name for transaction list
    const transactionsList = await fetchTransactionsByNodId(farmer.id);
    transactionsList.map(async (tx) => {
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
    transactionsList.sort(
      (a, b) =>
        new Date(b.created_on).getTime() - new Date(a.created_on).getTime(),
    );
    setTransactions(transactionsList);
  };

  const issueCardToFarmer = async () => {
    if (cardSyncingInProgress || syncInProgress) {
      Toast.show({
        type: 'error',
        text1: I18n.t('in_progress'),
        text2: I18n.t('try_after_sync'),
      });
      return;
    }

    navigation.navigate('IssueFarmerCard', { farmer, newFarmer: false });
  };

  /**
   * setting farmer details for edit page
   */
  const editFarmerDetails = async () => {
    const farmerDetails = await getFarmerDetails(
      farmer,
      userCompanyDetails.country,
    );

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
    setFarmer(farmerDetails);
  };

  const renderItem = ({ item }) => {
    return (
      <HistoryListItem
        item={item}
        onSelect={(i) =>
          navigation.navigate('FarmerTransactionDetails', {
            transactionItem: i,
          })
        }
      />
    );
  };

  const phone = getPhoneText(farmer.phone);
  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        title={I18n.t('farmer_details')}
        onPress={() => navigation.goBack(null)}
        rightText={I18n.t('edit')}
        rightTextColor="#EA2553"
        onPressRight={editFarmerDetails}
        extraStyle={{
          paddingHorizontal: width * 0.05,
          backgroundColor: theme.background_2,
        }}
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
            {phone && <Text style={styles.phoneText}>{phone}</Text>}
            <CardVerificationStatus
              cardId={farmer.card_id}
              displayId={farmer.display_id}
            />
          </View>
        </View>
        {(farmer.server_id === '' || farmer.is_modified) && (
          <View style={styles.syncWarningWrap}>
            <SyncPendingSecondaryIcon style={{ marginHorizontal: 5 }} />
            <Text style={styles.syncMsg}>
              {I18n.t('farmer_details_not_synced_to_the_server')}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', paddingTop: '5%' }}>
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.tabOneTop}>
            <View style={styles.cardView}>
              <View style={styles.cardValueWrap}>
                <Text style={styles.fieldValue}>
                  {`${I18n.t('card_id')} / ${I18n.t('display_id')}`}
                </Text>
                <Text style={styles.formTitle}>
                  {`${node.card_id || '-'} / ${
                    node.display_id ? `FF ${node.display_id}` : '-'
                  }`}
                </Text>
              </View>
              <TransparentButton
                buttonText={
                  node.card_id || node.display_id
                    ? I18n.t('reissue_card')
                    : I18n.t('issue_card')
                }
                onPress={issueCardToFarmer}
                hitSlop={HIT_SLOP_TWENTY}
              />
            </View>

            {fieldVisibility(forms, 'reference_number') && (
              <View style={{ marginVertical: 10 }}>
                <Text style={styles.fieldValue}>
                  {I18n.t('reference_number')}
                </Text>
                <Text style={styles.formTitle}>
                  {farmer.reference_number || '-'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.horizontalLine} />

          <View style={styles.formTitleContainer}>
            <Text style={styles.formTitle}>{I18n.t('address')}</Text>
          </View>

          {fieldVisibility(forms, 'street') && (
            <View style={styles.formTitleContainer}>
              <Text style={styles.fieldValue}>{I18n.t('street')}</Text>
              <Text style={styles.formTitle}>{farmer.street || '-'}</Text>
            </View>
          )}

          {fieldVisibility(forms, 'city') && (
            <View style={styles.formTitleContainer}>
              <Text style={styles.fieldValue}>{I18n.t('city')}</Text>
              <Text style={styles.formTitle}>{farmer.city}</Text>
            </View>
          )}

          {fieldVisibility(forms, 'country') && (
            <View style={styles.formTitleContainer}>
              <Text style={styles.fieldValue}>{I18n.t('country')}</Text>
              <Text style={styles.formTitle}>{farmer.country}</Text>
            </View>
          )}

          {fieldVisibility(forms, 'province') && (
            <View style={styles.formTitleContainer}>
              <Text style={styles.fieldValue}>{I18n.t('province')}</Text>
              <Text style={styles.formTitle}>{farmer.province}</Text>
            </View>
          )}

          {fieldVisibility(forms, 'postcode') && (
            <View style={styles.formTitleContainer}>
              <Text style={styles.fieldValue}>{I18n.t('postal_code')}</Text>
              <Text style={styles.formTitle}>
                {farmer.zipcode === '' ? '-' : farmer.zipcode}
              </Text>
            </View>
          )}

          <View style={styles.horizontalLine} />

          {farmerExtraFields.map((i, n) => {
            return (
              <View key={n.toString()} style={styles.formTitleContainer}>
                <Text style={styles.fieldValue}>{i.label || i.key}</Text>
                <Text style={styles.formTitle}>
                  {getCustomFieldValue(i) ?? '-'}
                </Text>
              </View>
            );
          })}

          {/* <View style={styles.horizontalLine} /> */}

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
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.formTitle}>{I18n.t('no_transactions')}</Text>
            </View>
          }
          keyExtractor={(item, index) => index.toString()}
        />
      )}
    </SafeAreaView>
  );
};

export default FarmerDetailsScreen;
