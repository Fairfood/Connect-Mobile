/* eslint-disable react/jsx-wrap-multilines */
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import {
  findFarmerById,
  saveFarmer,
  findAndUpdateCard,
} from '../../services/farmersHelper';
import {
  findCardByCardId,
  saveCard,
  updateCardNodeIDById,
  getAllCardsByNodeId,
} from '../../services/cardsHelper';
import { NfcNotSupportIcon, TurnOnNfcIcon } from '../../assets/svg';
import { syncFarmers } from '../../services/syncFarmers';
import { initSyncProcess } from '../../redux/LoginStore';
import { updateNfcSupported } from '../../redux/CommonStore';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import I18n from '../../i18n/i18n';
import CommonAlert from '../../components/CommonAlert';
import QrCodeMethod from '../../components/QrCodeMethod';
import NfcMethod from '../../components/NfcMethod';
import VerificationSwitch from '../../components/VerificationSwitch';

const { width } = Dimensions.get('window');

const IssueFarmerCard = ({ navigation, route }) => {
  const { farmer } = route.params;
  const { isConnected } = useSelector((state) => state.connection);
  const { syncInProgress } = useSelector((state) => state.login);
  const { nfcSupported } = useSelector((state) => state.common);
  const { theme } = useSelector((state) => state.common);

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [qrTutorial, setQrTutorial] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [verificationMode, setVerificationMode] = useState('nfc');
  const [cardId, setCardId] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertCancelModal, setAlertCancelModal] = useState(false);
  const [alertKey, setAlertKey] = useState('');
  const [alreadyAssignedFarmer, setAlreadyAssignedFarmer] = useState(null);
  const [alertMessage, setAlertMessage] = useState(
    I18n.t('something_went_wrong'),
  );
  const [alertTitle, setAlertTitle] = useState('Alert');
  const [alertIcon, setAlertIcon] = useState(null);
  const [alertSubmitText, setAlertSubmitText] = useState('Ok');
  const dispatch = useDispatch();

  useEffect(() => {
    setInitialLoading(true);
    setupInitialValues();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackButtonClick,
    );
    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * initial setting farmer list values
   */
  const setupInitialValues = async () => {
    const qrHelpTutorial = await AsyncStorage.getItem('qr_help_tutorial');
    if (!qrHelpTutorial || qrHelpTutorial !== 'true') {
      setQrTutorial(true);
    }

    if (nfcSupported === null) {
      initNfc();
    } else if (nfcSupported) {
      setVerificationMode('nfc');
      checkNfcEnabled();
    }

    setInitialLoading(false);
  };

  /**
   * initializing NFC
   */
  const initNfc = async () => {
    NfcManager.isSupported()
      .then(async (supported) => {
        if (supported) {
          setVerificationMode('nfc');
          dispatch(updateNfcSupported(true));
          checkNfcEnabled();
        } else {
          createAlert('nfc_unsupported');
          dispatch(updateNfcSupported(true));
        }
      })
      .catch((err) => {
        Sentry.captureException(`error initiating${err}`);
      });
  };

  const checkNfcEnabled = async () => {
    const isEnabled = await NfcManager.isEnabled();
    if (isEnabled) {
      await NfcManager.start();
      readNfc();
    } else {
      createAlert('nfc_no_turned_on');
    }
  };

  /**
   * start reading NFC cards
   */
  const readNfc = async () => {
    return new Promise((resolve) => {
      let tagFound = null;

      NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag) => {
        // saving NFC card variables
        tagFound = tag;
        resolve(tagFound);
        checkCardId(tagFound.id);

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

  const checkCardId = async (id) => {
    setVerifyLoading(true);
    setCardId(id);

    // checking this card is already exist
    const isExist = await findCardByCardId(id);

    if (isExist.length === 0) {
      AddFarmer(id);
    } else {
      // if the card already exist, fining the attached farmer
      if (isExist[0].node_id) {
        const user = await findFarmerById(isExist[0].node_id);
        // creating an alert message this card already exist
        cardAlreadyAssigned(user, id);
        return;
      }

      AddFarmer(id);
    }
  };

  /**
   * clearing NFC event
   */
  function handleBackButtonClick() {
    if (nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);
    }
    navigation.goBack(null);
  }

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
   * creating an alert message that card is already assigned
   *
   * @param {object} user farmer object
   * @param {string} id card id
   */
  const cardAlreadyAssigned = (user, id) => {
    setAlreadyAssignedFarmer(user);

    if (farmer.card_id === id) {
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
  };

  /**
   * when back button clicked, unregister NFC event and redirect to previous page
   */
  const backNavigation = () => {
    if (nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);
    }
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
    setVerifyLoading(true);
    if (farmer.server_id === undefined || farmer.server_id == null) {
      const phone = `+${farmer.dialCode} ${farmer.mobile}`.trim();

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

      if (isConnected && !syncInProgress) {
        dispatch(initSyncProcess());
        await syncFarmers();
      }

      setCardId(null);

      if (nfcSupported) {
        NfcManager.unregisterTagEvent().catch(() => 0);
        cleanUp(false);
      }

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
          await findAndUpdateCard(alreadyAssignedFarmer.id, '', false);
          setAlreadyAssignedFarmer(null);
        }

        // removing all the assigned cards for this node
        const alreadyAssignedCard = await getAllCardsByNodeId(farmer.id);
        if (alreadyAssignedCard.length > 0) {
          await updateAllCards(alreadyAssignedCard, '');
        }

        // updating card_id in this node
        await findAndUpdateCard(farmer.id, farmerCardId, false);

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

      if (isConnected && !syncInProgress) {
        dispatch(initSyncProcess());
        await syncFarmers();
      }

      setCardId(null);

      if (nfcSupported) {
        NfcManager.unregisterTagEvent().catch(() => 0);
        cleanUp(false);
      }

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
      setAlertMessage(message);
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
      setAlertMessage(I18n.t('turn_on_nfc_continue'));
      setAlertSubmitText(I18n.t('turn_on'));
      setAlertIcon(
        <TurnOnNfcIcon width={width * 0.27} height={width * 0.27} />,
      );
    } else if (key === 'nfc_unsupported') {
      setAlertTitle(I18n.t('nfc_unsupported'));
      setAlertMessage(I18n.t('nfc_not_support_device'));
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
      setAlertMessage(I18n.t('force_issue_card'));
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

    if (verificationMode === 'nfc' && nfcSupported) {
      readNfc();
    }
    setAlertModal(false);
    setAlertCancelModal(false);
    if (key !== 'card_already_assigned') {
      setVerifyLoading(false);
    }
  };

  const onCancelModal = () => {
    setAlertCancelModal(false);
    setCardId(null);
    setAlreadyAssignedFarmer(null);
    setVerifyLoading(false);
    if (verificationMode === 'nfc' && nfcSupported) {
      readNfc();
    }
  };

  const changeMethod = () => {
    if (verificationMode === 'nfc') {
      if (nfcSupported) {
        NfcManager.unregisterTagEvent().catch(() => 0);
        cleanUp(false);
      }
      setVerificationMode('qr_code');
    } else if (verificationMode === 'qr_code') {
      checkNfcEnabled();
      setVerificationMode('nfc');
    }
  };

  const onSkipCard = () => {
    AddFarmer(null);
    if (nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);
    }
  };

  const styles = StyleSheetFactory(theme);

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <CustomLeftHeader
          title={I18n.t('issue_new_farmer_card')}
          leftIcon='arrow-left'
          onPress={() => backNavigation()}
          extraStyle={{ width: '90%' }}
        />

        <VerificationSwitch
          verificationMode={verificationMode}
          onPress={() => changeMethod()}
          nfcSupported={nfcSupported}
        />
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {initialLoading && (
          <ActivityIndicator size='small' color={theme.icon_1} />
        )}

        {verificationMode === 'nfc' && !initialLoading && (
          <NfcMethod
            actionType={
              farmer.server_id === '' || farmer.server_id === undefined
                ? 'issue_card'
                : 'reissue_card'
            }
            verifyLoading={verifyLoading}
            onNoCardSubmit={onSkipCard}
            backNavigation={backNavigation}
            cardSection={
              <View style={styles.tapCard}>
                <Text style={styles.tapCardInfo}>{I18n.t('tap_new_card')}</Text>
              </View>
            }
            noCardButton={
              farmer.server_id === '' || farmer.server_id === undefined
            }
          />
        )}

        {verificationMode === 'qr_code' && !initialLoading && (
          <QrCodeMethod
            actionType={
              farmer.server_id === '' || farmer.server_id === undefined
                ? 'issue_card'
                : 'reissue_card'
            }
            verifyLoading={verifyLoading}
            onNoCardSubmit={onSkipCard}
            backNavigation={backNavigation}
            createAlert={createAlert}
            onGetScanId={checkCardId}
            qrTutorial={qrTutorial}
            cardSection={
              <View style={styles.tapCard}>
                <Text style={styles.tapCardInfo}>{I18n.t('tap_new_card')}</Text>
              </View>
            }
            noCardButton={
              farmer.server_id === '' || farmer.server_id === undefined
            }
          />
        )}

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
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#D5ECFB',
    },
    headerWrap: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: width * 0.05,
    },
    tapCardInfo: {
      color: theme.background_1,
      fontWeight: 'normal',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 18,
      textAlign: 'center',
      paddingHorizontal: 40,
      paddingVertical: 10,
    },
    tapCard: {
      marginHorizontal: 30,
      backgroundColor: theme.text_2,
      paddingVertical: 10,
    },
  });
};

export default IssueFarmerCard;
