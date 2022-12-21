import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import {
  findFarmerById,
  saveFarmer,
  findAndupdateCard,
} from '../../services/farmersHelper';
import {
  findCardByCardId,
  saveCard,
  updateCardNodeIDById,
  getAllCardsByNodeId,
} from '../../services/cardsHelper';
import { populateDatabase } from '../../services/populateDatabase';
import { NfcNotSupportIcon, TurnOnNfcIcon } from '../../assets/svg';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import TransparentButton from '../../components/TransparentButton';
import I18n from '../../i18n/i18n';
import Icon from '../../icons';
import CommonAlert from '../../components/CommonAlert';
import * as consts from '../../services/constants';

const { height, width } = Dimensions.get('window');

const IssueFarmerCard = ({ navigation, route }) => {
  const { farmer } = route.params;
  const { isConnected } = useSelector((state) => state.connection);
  const { syncInProgress } = useSelector(
    (state) => state.login,
  );

  const [isLoading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [cardId, setCardId] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertCancelModal, setAlertCancelModal] = useState(false);
  const [alertKey, setAlertKey] = useState('');
  const [alreadyAssignedFarmer, setAlreadyAssignedFarmer] = useState(null);
  const [alertMessage, setAllertMessage] = useState(
    I18n.t('something_went_wrong'),
  );
  const [alertTitle, setAlertTitle] = useState('Alert');
  const [alertIcon, setAlertIcon] = useState(null);
  const [alertSubmitText, setAlertSubmitText] = useState('Ok');

  useEffect(() => {
    initNfc();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * clearing NFC event
   */
  function handleBackButtonClick() {
    NfcManager.unregisterTagEvent().catch(() => 0);
    cleanUp();
    navigation.goBack(null);
  }

   /**
    * checking NFC is support on device and start NFC reading if available
    */
  const initNfc = async () => {
    NfcManager.isSupported().then(async (supported) => {
      if (supported) {
        const isEnabled = await NfcManager.isEnabled();
        if (isEnabled) {
          await NfcManager.start({});
          readNdef();
        } else {
          createAlert('nfc_no_turned_on');
        }
      } else {
        createAlert('nfc_unsupported');
      }
    });
  };

  /**
   * stop NFC reading
   */
  const cleanUp = () => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
  };

  /**
   * redirect to phone's NFC settings
   */
  const turnOnNFC = async () => {
    NfcManager.goToNfcSetting();
    navigation.goBack();
  };

  /**
   * start reading NFC cards
   */
  const readNdef = async () => {
    return new Promise((resolve) => {
      let tagFound = null;

      NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag) => {
        setVerifyLoading(true);

        // saving NFC card variables
        tagFound = tag;
        resolve(tagFound);
        setCardId(tagFound.id);

        // checking this card is already exist
        const isExist = await findCardByCardId(tagFound.id);

        if (isExist.length === 0) {
          AddFarmer(tagFound.id);
        } else {
          // if the card already exist, fining the attached farmer
          if (isExist[0].node_id) {
            const user = await findFarmerById(isExist[0].node_id);
            // creating an alert message this card already exixst
            cardAlreadyAssigned(user, tagFound);
            return;
          }

          AddFarmer(tagFound.id);
        }
        NfcManager.unregisterTagEvent().catch(() => 0);
      });
      NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
        cleanUp();
        if (!tagFound) {
          resolve();
        }
      });
      NfcManager.registerTagEvent();
    });
  };

  /**
   * creating an alert message that card is already assigned
   *
   * @param {object} user farmer object
   * @param {string} tagFound card id
   */
  const cardAlreadyAssigned = (user, tagFound) => {
    setAlreadyAssignedFarmer(user);
    setVerifyLoading(false);

    if (farmer.card_id === tagFound.id) {
      // alert message when this card is already assigned for same farmer
      createAlert(
        'same_card_used_for',
        `${I18n.t('same_card_used_for')} ${user.name}. ${I18n.t(
          'try_an_another_card',
        )}`,
      );
    } else {
      // alert message when this card is already assigned for other farmer
      createCancelAlert(
        'card_already_assigned',
        `${I18n.t('card_already_assigned')} ${user.name}.`,
      );
    }

    readNdef();
  };

  /**
   * when back button clicked, unregister NFC event and redirect to previous page
   */
  const backNavigation = () => {
    NfcManager.unregisterTagEvent().catch(() => 0);
    cleanUp();
    navigation.goBack(null);
  };

  /**
   * updating card details node_id and server_id
   *
   * @param   {Array}   cards     cards array that need to update
   * @param   {string}  farmerId  farmer server id
   * @param   {string}  serverId  card server id
   */
  const updateAllCards = async (cards, farmerId, serverId = null) => {
    return Promise.all(
      cards.map(async (card) => {
        const updates = {
          node_id: farmerId,
          server_id: serverId == null ? card.server_id : serverId,
          fair_id: '',
        };

        await updateCardNodeIDById(card.id, updates);
      }),
    );
  };

  const AddFarmer = async (farmerCardId = null) => {
    setLoading(true);
    if (farmer.server_id === undefined || farmer.server_id == null) {
      const phone = (`+${farmer.dialCode} ${farmer.mobile}`).trim();

      const farmerObj = {
        name: farmer.name,
        phone,
        street: farmer.street ?? '',
        city: farmer.city,
        country: farmer.country,
        province: farmer.province,
        zipcode: farmer.postalCode ?? '',
        image: farmer.profilePic ?? '',
        ktp: farmer.ktp ?? '',
        latitude: farmer.selectedProvince.location.latlong[0],
        longitude: farmer.selectedProvince.location.latlong[1],
        card_id: farmerCardId || '',
        created_on: Math.floor(Date.now() / 1000),
        extra_fields:
          farmer.extraFields && Object.keys(farmer.extraFields).length > 0
            ? farmer.extraFields
            : '',
      };

      const response = await saveFarmer(farmerObj);
      farmerObj.id = response.id;

      if (farmerCardId) {
        const assignedCards = await findCardByCardId(farmerCardId);
        if (assignedCards.length > 0) {
          await updateAllCards(assignedCards, response.id, '');
        } else {
          const cardDetails = {
            card_id: farmerCardId,
            node_id: response.id,
            fair_id: '',
            server_id: '',
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000),
          };

          await saveCard(cardDetails);
        }
      }

      if (isConnected && !syncInProgress) { await populateDatabase(); }

      setCardId(null);
      setVerifyLoading(false);

      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp();

      navigation.navigate('FarmerSuccessScreen', {
        farmer: farmerObj,
        cardId: farmerCardId,
        newFarmer: farmer.id === undefined,
      });
    } else {
      let fairId = '';

      if (farmerCardId) {
        // updating card_id as empty for already assigned node
        if (alreadyAssignedFarmer?.id) {
          await findAndupdateCard(alreadyAssignedFarmer.id, '', false);
          setAlreadyAssignedFarmer(null);
        }

        // removing all the assined cards for this node
        const alreadyAssignedCard = await getAllCardsByNodeId(farmer.id);
        if (alreadyAssignedCard.length > 0) {
          await updateAllCards(alreadyAssignedCard, '');
        }

        // updating card_id in this node
        await findAndupdateCard(farmer.id, farmerCardId, false);

        const isCardExist = await findCardByCardId(farmerCardId);
        if (isCardExist.length > 0) {
          fairId = isCardExist[0].fair_id;
          await updateAllCards(isCardExist, farmer.id, '');
        } else {
          const cardDetails = {
            card_id: farmerCardId,
            node_id: farmer.id,
            fair_id: '',
            server_id: '',
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000),
          };
          await saveCard(cardDetails);
        }
      }

      if (isConnected && !syncInProgress) { await populateDatabase(); }

      setCardId(null);
      setVerifyLoading(false);

      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp();

      navigation.navigate('FarmerSuccessScreen', {
        farmer,
        cardId: farmerCardId,
        fairId,
        newFarmer: farmer.id === undefined,
      });
    }
  };

  const createAlert = (key, message = null) => {
    setAlertKey(key);

    if (key === 'same_card_used_for') {
      setAlertTitle(I18n.t('already_your_card'));
      setAllertMessage(message);
      setAlertSubmitText(I18n.t('ok'));
      setAlertIcon(
        <Image
          source={require('../../assets/images/card-already-assigned.png')}
          resizeMode='contain'
          style={{ width: width * 0.3, height: width * 0.3 }}
        />,
      );
    } else if (key === 'nfc_no_turned_on') {
      setAlertTitle(I18n.t('nfc_no_turned_on'));
      setAllertMessage(I18n.t('turn_on_nfc_continue'));
      setAlertSubmitText(I18n.t('turn_on'));
      setAlertIcon(
        <TurnOnNfcIcon width={width * 0.27} height={width * 0.27} />,
      );
    } else if (key === 'nfc_unsupported') {
      setAlertTitle(I18n.t('nfc_unsupported'));
      setAllertMessage(I18n.t('nfc_not_support_device'));
      setAlertSubmitText(I18n.t('ok'));
      setAlertIcon(
        <NfcNotSupportIcon width={width * 0.27} height={width * 0.27} />,
      );
    }
    setAlertModal(true);
  };

  const createCancelAlert = (key, message = null) => {
    setAlertKey(key);

    if (key === 'card_already_assigned') {
      setAlertTitle(message);
      setAllertMessage(I18n.t('force_issue_card'));
      setAlertSubmitText(I18n.t('proceed'));
      setAlertIcon(
        <Image
          source={require('../../assets/images/card-already-assigned.png')}
          resizeMode='contain'
          style={{ width: width * 0.3, height: width * 0.3 }}
        />,
      );
    }
    setAlertCancelModal(true);
  };

  const onPressAlert = (key) => {
    if (key === 'nfc_no_turned_on') {
      turnOnNFC();
    } else if (key === 'card_already_assigned') {
      AddFarmer(cardId, true);
    }

    setAlertModal(false);
    setAlertCancelModal(false);
  };

  const onCancelModal = () => {
    setAlertCancelModal(false);
    setCardId(null);
    setAlreadyAssignedFarmer(null);
    setVerifyLoading(false);
    readNdef();
  };

  const onSkipCard = () => {
    AddFarmer(null);
    NfcManager.unregisterTagEvent().catch(() => 0);
    cleanUp();
  };

  return (
    <ScrollView style={styles.container}>
      <CustomLeftHeader
        backgroundColor='#D5ECFB'
        title={I18n.t('issue_new_farmer_card')}
        leftIcon='Close'
        onPress={() => backNavigation()}
        extraStyle={{ marginLeft: 10 }}
      />

      <View style={styles.cardReaderImageContainer}>
        <View style={styles.infoWrap}>
          <View style={{ marginHorizontal: 10 }}>
            <Icon name='info' color='#FFFFFF' size={14} />
          </View>
          <Text style={styles.policyText}>{I18n.t('privacy_policy')}</Text>
        </View>
        <Image
          source={require('../../assets/images/scanning.gif')}
          resizeMode='contain'
          style={styles.scanningGif}
        />
      </View>

      <View style={styles.bottomSectionWrap}>
        <View style={styles.bottomSectionSubWrap}>
          {verifyLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={consts.TEXT_PRIMARY_COLOR} />
              <Text style={[styles.scanning, { marginLeft: 10 }]}>
                {I18n.t('reading_farmer_card')}
              </Text>
            </View>
          ) : (
            <Text style={styles.scanning}>
              {I18n.t('scanning_farmer_card')}
            </Text>
          )}

          <View style={styles.noCardButton}>
            {(farmer.server_id === '' || farmer.server_id === undefined) && (
              <TransparentButton
                buttonText={I18n.t('skip_the_card')}
                onPress={() => onSkipCard()}
                color='#4DCAF4'
                isDisabled={isLoading}
              />
            )}
          </View>
        </View>

        <View style={styles.tap_card}>
          <Text style={styles.tapCardInfo}>{I18n.t('tap_new_card')}</Text>
        </View>
      </View>

      {alertModal && (
        <CommonAlert
          visible={alertModal}
          title={alertTitle}
          message={alertMessage}
          submitText={alertSubmitText}
          icon={alertIcon}
          onSubmit={() => onPressAlert(alertKey)}
          onRequestClose={() => onPressAlert(alertKey)}
        />
      )}

      {alertCancelModal && (
        <CommonAlert
          visible={alertCancelModal}
          title={alertTitle}
          message={alertMessage}
          submitText={alertSubmitText}
          icon={alertIcon}
          onCancel={() => onCancelModal()}
          onSubmit={() => onPressAlert(alertKey)}
          onRequestClose={() => onCancelModal()}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D5ECFB',
    paddingHorizontal: width * 0.04,
  },
  tapCardInfo: {
    color: consts.APP_BG_COLOR,
    fontWeight: 'normal',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 40,
    paddingVertical: 10,
  },
  cardReaderImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D5ECFB',
  },
  tap_card: {
    marginHorizontal: 30,
    backgroundColor: consts.TEXT_PRIMARY_LIGHT_COLOR,
    paddingVertical: 10,
  },
  scanning: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: 'normal',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  noCardButton: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
  },
  infoWrap: {
    alignSelf: 'center',
    backgroundColor: consts.TEXT_PRIMARY_LIGHT_COLOR,
    flexDirection: 'row',
    width: '95%',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  policyText: {
    fontFamily: 'Moderat-Medium',
    fontSize: 12,
    backgroundColor: consts.TEXT_PRIMARY_LIGHT_COLOR,
    flexDirection: 'row',
    width: '90%',
    color: '#FFFFFF',
  },
  scanningGif: {
    width: width * 1.2,
    height: width * 1.2,
  },
  bottomSectionWrap: {
    marginTop: height * -0.1,
  },
  bottomSectionSubWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default IssueFarmerCard;
