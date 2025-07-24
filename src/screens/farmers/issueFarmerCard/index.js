import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, BackHandler } from 'react-native';
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import CustomLeftHeader from '../../../components/headers/customLeftHeader';
import I18n from '../../../translations/text/i18n';
import CommonAlert from '../../../components/modals/commonAlert';
import QrCodeMethod from '../../../components/cardMethods/qrCodeMethod';
import NfcMethod from '../../../components/cardMethods/nfcMethod';
import {
  createFarmer,
  findFarmer,
  updateFarmer,
} from '../../../db/services/FarmerHelper';
import {
  createCard,
  fetchCardByCardId,
  fetchCardByDisplayId,
  fetchCardsByNodeId,
  fetchCardWithFarmerAndCardId,
  fetchCardWithFarmerAndDisplayId,
  fetchCardWithFarmerIdAndCardId,
  fetchCardWithFarmerIdAndDisplayId,
  updateCard,
} from '../../../db/services/CardHelper';
import { initiateSync } from '../../../sync/SyncInitials';
import { jsonToString } from '../../../utils/helperFunctions';
import { getAlertConfig, getBuyerCard } from '../../../utils/commonFunctions';
import { createSubmissions } from './controller';
import StyleSheetFactory from './styles';
import TransparentButton from '../../../components/buttons/transparentButton';
import {
  fetchUnSyncedTransactionsByCardIds,
  updateTransaction,
} from '../../../db/services/TransactionsHelper';
import {
  fetchUnSyncedTransactionPremiumWithCardIds,
  updateTransactionPremium,
} from '../../../db/services/TransactionPremiumHelper';

const { width, height } = Dimensions.get('window');

const IssueFarmerCard = ({ navigation, route }) => {
  const { farmer, newFarmer } = route.params;
  const cardIdRef = useRef();
  const displayIdRef = useRef();
  const { isConnected } = useSelector((state) => state.connection);
  const { syncInProgress } = useSelector((state) => state.login);
  const { nfcSupported } = useSelector((state) => state.common);
  const { theme } = useSelector((state) => state.common);
  const [stepper, setStepper] = useState(1);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verificationMode, setVerificationMode] = useState('qr_code');
  const [alert, setAlert] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const styles = StyleSheetFactory();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        backNavigation();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [stepper]);

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
   * @returns {null} no return
   */
  const readNfc = async () => {
    return new Promise((resolve) => {
      let tagFound = null;

      NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag) => {
        // saving NFC card variables
        tagFound = tag;
        resolve(tagFound);
        setVerificationMode('nfc');
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
    cardIdRef.current = id;

    // check this is a buyer card
    const foundBuyerCard = await getBuyerCard(id, 'card_id');
    if (foundBuyerCard) {
      createAlert('buyer_card_found');
      return;
    }

    // checking this card with farmer exist
    const isExist = await fetchCardWithFarmerAndCardId(id);
    if (isExist.length > 0) {
      // if the card already exist, finding the attached farmer
      const user = await findFarmer(isExist[0].node_id);

      // creating an alert message this card already exist
      cardAlreadyAssigned(user, id, 'card_id');
    } else {
      setVerifyLoading(false);
      skipMethod('nfc');
    }
  };

  const checkDisplayId = async (id) => {
    setVerifyLoading(true);
    displayIdRef.current = id;

    // check this is a buyer card
    const foundBuyerCard = await getBuyerCard(id, 'display_id');
    if (foundBuyerCard) {
      createAlert('buyer_card_found');
      return;
    }

    // checking this card is already exist
    const isExist = await fetchCardWithFarmerAndDisplayId(id);

    if (isExist.length > 0) {
      // if the card already exist, finding the attached farmer
      const user = await findFarmer(isExist[0].node_id);

      // creating an alert message this card already exist
      cardAlreadyAssigned(user, id, 'display_id');
    } else {
      setVerifyLoading(false);
      skipMethod('qr_code');
    }
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
   * creating an alert message that card is already assigned
   * @param {object} user farmer object
   * @param {string} id   card id
   * @param {string} key  card_id or display_id
   */
  const cardAlreadyAssigned = (user, id, key) => {
    if (farmer[key] === id) {
      // alert message when this card is already assigned for same farmer
      createAlert(
        'same_card_used_for',
        `${I18n.t('same_card_used_for')} ${user.name}. ${I18n.t(
          'try_an_another_card',
        )}`,
        'message',
      );
    } else {
      // alert message when this card is already assigned for other farmer
      createAlert(
        'card_already_assigned',
        `${I18n.t('card_already_assigned')} ${user.name}.`,
        'title',
      );
    }
  };

  /**
   * when back button clicked, unregister NFC event and redirect to previous page
   */
  const backNavigation = () => {
    displayIdRef.current = null;
    cardIdRef.current = null;

    if (stepper === 2) {
      setStepper(1);
      setVerificationMode('qr_code');
    } else {
      if (nfcSupported) {
        NfcManager.unregisterTagEvent().catch(() => 0);
        cleanUp();
      }
      navigation.goBack(null);
    }
  };

  const addFarmer = async () => {
    setVerifyLoading(true);

    if (!newFarmer && !cardIdRef?.current && !displayIdRef.current) {
      setVerifyLoading(false);
      return;
    }

    let farmerObj = {};

    if (newFarmer) {
      const phone =
        farmer.dialCode && farmer.mobile
          ? `+${farmer.dialCode} ${farmer.mobile}`.trim()
          : '';
      const submissions = await createSubmissions(farmer.extraFields);
      const submissionsString =
        typeof submissions === 'object'
          ? jsonToString(submissions)
          : submissions;

      farmerObj = {
        name: farmer.name,
        phone,
        street: farmer.street ?? '',
        city: farmer.city,
        country: farmer.country,
        province: farmer.province,
        zipcode: farmer.zipcode ?? '',
        image: farmer.profilePic ?? '',
        reference_number: farmer.reference_number ?? '',
        latitude_corrected: farmer.selectedProvince.location.latlong[0],
        longitude_corrected: farmer.selectedProvince.location.latlong[1],
        card_id: '',
        display_id: '',
        created_on: Math.floor(Date.now() / 1000),
        extra_fields: submissionsString,
      };

      const response = await createFarmer(farmerObj);
      farmerObj.id = response.id;
    }

    if (cardIdRef.current || displayIdRef.current) {
      await handleCardUpdates(newFarmer ? farmerObj : farmer);
    }

    if (isConnected && !syncInProgress) {
      await initiateSync();
    }

    if (nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp();
    }

    navigation.navigate('FarmerSuccessScreen', {
      farmer: newFarmer ? farmerObj : farmer,
      cardId: cardIdRef.current,
      displayId: displayIdRef.current,
      newFarmer,
    });

    cardIdRef.current = null;
    displayIdRef.current = null;
  };

  const createANewCardEntry = async (farmerId, cardId, displayId) => {
    const cardDetails = {
      node_id: farmerId,
      card_id: cardId,
      display_id: displayId,
      server_id: '',
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    };

    await createCard(cardDetails);
    await updateCardIdsInFarmer(farmerId, cardId, displayId);
  };

  const updateCardIdsInFarmer = async (farmerId, cardId, displayId) => {
    await updateFarmer(farmerId, {
      card_id: cardId,
      display_id: displayId,
    });
  };

  const removeFarmerFormCards = async (farmerId) => {
    const farmerCards = await fetchCardsByNodeId(farmerId);
    for (const card of farmerCards) {
      await updateCard(card.id, { node_id: '' });
    }
  };

  const removeCardsFromFarmer = async (farmerId) => {
    await removeFarmerFormCards(farmerId);

    const updates = {
      card_id: '',
      display_id: '',
      updated_at: Math.round(new Date().getTime() / 1000),
    };

    await updateFarmer(farmerId, updates);
  };

  const updateFarmerInCard = async (id, farmerId) => {
    const updates = {
      node_id: farmerId,
      server_id: '',
      updated_at: Math.round(new Date().getTime() / 1000),
    };

    await updateCard(id, updates);
  };

  const handleDifferentFarmerCase = async (
    farmerId,
    cardId,
    displayId,
    existingCardId,
    existingDisplayId,
  ) => {
    const cardDetails = {
      node_id: farmerId,
      card_id: cardId,
      display_id: displayId,
      server_id: '',
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    };

    const newCard = await createCard(cardDetails);

    await updateCardIdsInFarmer(farmerId, cardId, displayId);

    const transactions = await fetchUnSyncedTransactionsByCardIds([
      existingCardId,
      existingDisplayId,
    ]);

    for (const tx of transactions) {
      await updateTransaction(tx.id, { card_id: newCard.id });
    }

    const transactionPremiums =
      await fetchUnSyncedTransactionPremiumWithCardIds([
        existingCardId,
        existingDisplayId,
      ]);

    for (const tx of transactionPremiums) {
      await updateTransactionPremium(tx.id, { card_id: newCard.id });
    }

    await updateCard(existingCardId, { is_active: false, display_id: '' });
    await updateCard(existingDisplayId, { is_active: false, card_id: '' });
  };

  /**
   * This is tha function for handling farmer card.
   * section 1: This is the case when user verified both qr and nfc.
   * section 2: This is the case when already a card exist with both card_id and display_id.
   * section 3: This is the case where same card exist for another farmer.
   * section 4: This is the case where both card_id and display_id exist but in different farmer.
   *            Then we will remove the card and farmer references and create a new card entry
   *            with this combo.
   * section 5: This is the case when user only verified with nfc.
   * section 6: This is the case when user only verified with qr.
   * @param {object} farmerObj farmer object
   */
  const handleCardUpdates = async (farmerObj) => {
    const farmerId = farmerObj.id;
    const cardId = cardIdRef.current;
    const displayId = displayIdRef.current;
    const isCardIdExist = (await fetchCardByCardId(cardId)).sort(
      (a, b) => b.updated_at - a.updated_at,
    );

    const isCardDisplayIdExist = (await fetchCardByDisplayId(displayId)).sort(
      (a, b) => b.updated_at - a.updated_at,
    );

    if (cardId && displayId) {
      // section 1
      if (isCardIdExist.length > 0 && isCardDisplayIdExist.length > 0) {
        // section 2
        if (isCardIdExist[0].id === isCardDisplayIdExist[0].id) {
          // section 3
          if (isCardIdExist?.[0]?.node_id) {
            await removeCardsFromFarmer(isCardIdExist[0].node_id);
          }
          await updateFarmerInCard(isCardIdExist[0].id, farmerId);
          await updateCardIdsInFarmer(farmerId, cardId, displayId);
        } else {
          // section 4
          if (isCardIdExist?.[0]?.node_id) {
            await removeCardsFromFarmer(isCardIdExist[0].node_id);
          }
          if (isCardDisplayIdExist?.[0]?.node_id) {
            await removeCardsFromFarmer(isCardDisplayIdExist[0].node_id);
          }
          await handleDifferentFarmerCase(
            farmerId,
            cardId,
            displayId,
            isCardIdExist[0].id,
            isCardDisplayIdExist[0].id,
          );
        }
      } else if (isCardIdExist.length > 0) {
        if (isCardIdExist?.[0]?.node_id) {
          await removeCardsFromFarmer(isCardIdExist[0].node_id);
        }
        await updateCard(isCardIdExist[0].id, {
          node_id: farmerId,
          display_id: displayId,
          server_id: '',
        });
        await updateCardIdsInFarmer(farmerId, cardId, displayId);
      } else if (isCardDisplayIdExist.length > 0) {
        if (isCardDisplayIdExist?.[0]?.node_id) {
          await removeCardsFromFarmer(isCardDisplayIdExist[0].node_id);
        }
        await updateCard(isCardDisplayIdExist[0].id, {
          node_id: farmerId,
          card_id: cardId,
          server_id: '',
        });
        await updateCardIdsInFarmer(farmerId, cardId, displayId);
      } else {
        await createANewCardEntry(farmerId, cardId, displayId);
      }
    } else if (cardId) {
      // section 5
      if (isCardIdExist.length > 0) {
        if (isCardIdExist?.[0]?.node_id) {
          await removeCardsFromFarmer(isCardIdExist[0].node_id);
        }
        await removeCardsFromFarmer(farmerId);
        await updateFarmerInCard(isCardIdExist[0].id, farmerId);
        await updateCardIdsInFarmer(
          farmerId,
          cardId,
          isCardIdExist[0].display_id,
        );
      } else if (!farmerObj?.card_id && farmerObj?.display_id) {
        const displayIdCardFound = await fetchCardWithFarmerIdAndDisplayId(
          farmerObj.display_id,
          farmerId,
        );
        if (displayIdCardFound.length > 0) {
          await updateCard(displayIdCardFound[0].id, {
            card_id: cardId,
            server_id: '',
          });
        }
        await updateCardIdsInFarmer(farmerId, cardId, farmerObj.display_id);
      } else {
        if (farmerObj?.card_id) {
          await removeCardsFromFarmer(farmerId);
        }
        await createANewCardEntry(farmerId, cardId, '');
      }
    } else if (displayId) {
      // section 6
      if (isCardDisplayIdExist.length > 0) {
        if (isCardDisplayIdExist?.[0]?.node_id) {
          await removeCardsFromFarmer(isCardDisplayIdExist[0].node_id);
        }
        await removeCardsFromFarmer(farmerId);
        await updateFarmerInCard(isCardDisplayIdExist[0].id, farmerId);
        await updateCardIdsInFarmer(
          farmerId,
          isCardDisplayIdExist[0].card_id,
          displayId,
        );
      } else if (!farmerObj?.display_id && farmerObj?.card_id) {
        const cardIdCardFound = await fetchCardWithFarmerIdAndCardId(
          farmerObj.card_id,
          farmerId,
        );
        if (cardIdCardFound.length > 0) {
          await updateCard(cardIdCardFound[0].id, {
            display_id: displayId,
            server_id: '',
          });
        }
        await updateCardIdsInFarmer(farmerId, farmerObj.card_id, displayId);
      } else {
        if (farmerObj?.display_id) {
          await removeCardsFromFarmer(farmerId);
        }
        await createANewCardEntry(farmerId, '', displayId);
      }
    }
  };

  /**
   * creating alert modal based on put key
   * @param {string} key      alert modal type
   * @param {string} addOn    extra message or value for alert
   * @param {string} addOnKey extra key or any alert key
   */
  const createAlert = (key, addOn = null, addOnKey = 'extra') => {
    const alertObj = getAlertConfig(key);

    if (addOn) {
      alertObj[addOnKey] = addOn;
    }

    if (alertObj) {
      setAlert(alertObj);
      setAlertModal(true);
    }
  };

  const onPressAlert = (key) => {
    setVerifyLoading(false);
    setAlertModal(false);
    setAlert(null);

    switch (key) {
      case 'nfc_no_turned_on':
        turnOnNFC();
        break;
      case 'card_already_assigned':
        if (verificationMode === 'qr_code') {
          skipMethod('qr_code');
        } else if (verificationMode === 'nfc') {
          createAlert('issue_card_verification');
        }
        break;
      case 'buyer_card_found':
        if (verificationMode === 'nfc') {
          cardIdRef.current = null;
        } else if (verificationMode === 'qr_code') {
          displayIdRef.current = null;
        }
        break;
      case 'same_card_used_for':
        if (verificationMode === 'nfc' && nfcSupported) {
          cardIdRef.current = null;
          readNfc();
        } else if (verificationMode === 'qr_code') {
          displayIdRef.current = null;
        }
        break;
      case 'confirm_skip':
        navigation.goBack();
        break;
      case 'issue_card_verification':
        addFarmer();
        break;
      default:
        break;
    }
  };

  const onCancelAlert = () => {
    setVerifyLoading(false);
    setAlertModal(false);
    setAlert(null);

    if (verificationMode === 'nfc' && nfcSupported) {
      cardIdRef.current = null;
      readNfc();
    } else if (verificationMode === 'qr_code') {
      displayIdRef.current = null;
    }
  };

  const skipMethod = (currentMethod) => {
    if (currentMethod === 'qr_code') {
      if (nfcSupported) {
        setVerificationMode('nfc');
        checkNfcEnabled();
        setStepper(2);
      } else if (!newFarmer && !displayIdRef.current) {
        createAlert('confirm_skip', I18n.t('qr_skipped_msg'), 'message');
      } else if (displayIdRef.current) {
        createAlert('issue_card_verification');
      } else {
        addFarmer();
      }
    } else if (currentMethod === 'nfc') {
      if (nfcSupported) {
        NfcManager.unregisterTagEvent().catch(() => 0);
        cleanUp();
      }
      if (!newFarmer && !cardIdRef.current && !displayIdRef.current) {
        createAlert('confirm_skip', I18n.t('nfc_skipped_msg'), 'message');
      } else if (cardIdRef.current || displayIdRef.current) {
        createAlert('issue_card_verification');
      } else {
        addFarmer();
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <CustomLeftHeader
          title={newFarmer ? 'Issue card' : 'Re-issue card'}
          onPress={backNavigation}
          extraStyle={{ width: '90%' }}
        />
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {nfcSupported && (
          <Steps stepper={stepper} styles={styles} theme={theme} />
        )}

        {verificationMode === 'qr_code' && (
          <QrCodeMethod
            stepper={nfcSupported}
            actionType={
              farmer.server_id === '' || farmer.server_id === undefined
                ? 'issue_card'
                : 'reissue_card'
            }
            verifyLoading={verifyLoading}
            disableQr={displayIdRef.current || verifyLoading}
            backNavigation={backNavigation}
            createAlert={createAlert}
            onGetScanId={checkDisplayId}
            cardSection={
              <View style={styles.helpWrap}>
                <FastImage
                  source={{ uri: 'file:///android_asset/qr_code.gif' }}
                  style={{
                    width: width * 0.48,
                    height: height * 0.13,
                  }}
                  resizeMode={FastImage.resizeMode.contain}
                />
                <Text style={styles.qrHelpMessage}>
                  {I18n.t('hold_your_phone_steady')}
                </Text>
                <TransparentButton
                  buttonText="Skip QR method"
                  onPress={() => skipMethod('qr_code')}
                  color="#4DCAF4"
                  extraStyle={{
                    width: width * 0.8,
                    paddingVertical: 5,
                    marginTop: 10,
                  }}
                />
              </View>
            }
            noCardButton={false}
          />
        )}

        {verificationMode === 'nfc' && (
          <NfcMethod
            actionType={
              farmer.server_id === '' || farmer.server_id === undefined
                ? 'issue_card'
                : 'reissue_card'
            }
            verifyLoading={verifyLoading}
            backNavigation={backNavigation}
            cardSection={
              <View style={styles.helpWrap}>
                <TransparentButton
                  buttonText="Skip NFC method"
                  onPress={() => skipMethod('nfc')}
                  color="#4DCAF4"
                  extraStyle={{
                    width: width * 0.8,
                    paddingVertical: 5,
                    marginTop: 'auto',
                  }}
                />
              </View>
            }
            noCardButton={false}
          />
        )}

        {alertModal && (
          <CommonAlert
            visible={alertModal}
            title={alert.title}
            message={alert.message}
            submitText={alert.submitText}
            icon={alert.icon}
            onSubmit={() => onPressAlert(alert.key)}
            cancelText={alert?.cancelText ?? null}
            onCancel={alert?.cancelText ? onCancelAlert : null}
            onRequestClose={onCancelAlert}
          />
        )}
      </ScrollView>
    </View>
  );
};

const Steps = ({ stepper, styles, theme }) => {
  const defaultColor = theme.background_2;

  const RoundView = ({
    pageCount,
    outerBg,
    innerBg,
    innerBorder,
    textColor,
  }) => (
    <View style={[styles.stepContainerSub, { backgroundColor: outerBg }]}>
      <View
        style={[
          styles.selectedView,
          {
            backgroundColor: innerBg,
            borderColor: innerBorder,
          },
        ]}
      >
        <Text style={[styles.selectedText, { color: textColor }]}>
          {pageCount}
        </Text>
      </View>
    </View>
  );

  const LineView = ({ borderTopColor, borderTopWidth }) => {
    return (
      <View
        style={[styles.horizontalLine, { borderTopColor, borderTopWidth }]}
      />
    );
  };

  return (
    <View style={styles.stepContainer}>
      {[1, 2].map((i, n) => (
        <View key={n.toString()} style={styles.stepWrapper}>
          <RoundView
            pageCount={i}
            outerBg={stepper >= i ? '#C5EDFA' : defaultColor}
            innerBg={stepper >= i ? '#4DCAF4' : '#C5EDFA'}
            innerBorder={stepper >= i ? '#4DCAF4' : '#C5EDFA'}
            textColor={stepper >= i ? defaultColor : '#5691AE'}
          />
          {n !== 1 && (
            <LineView
              borderTopColor={stepper > i ? '#C5EDFA' : '#BDBDBD'}
              borderTopWidth={stepper <= i ? 1 : 3}
            />
          )}
        </View>
      ))}
    </View>
  );
};

export default IssueFarmerCard;
