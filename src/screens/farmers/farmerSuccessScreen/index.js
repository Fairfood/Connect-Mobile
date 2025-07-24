import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  BackHandler,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { SuccessScreenTickIcon } from '../../../assets/svg';
import { requestPermission } from '../../../utils/commonFunctions';
import { AVATAR_BG_COLORS } from '../../../utils/constants';
import { logAnalytics } from '../../../utils/serviceHelper';
import { fetchAllActiveProducts } from '../../../db/services/ProductsHelper';
import CustomButton from '../../../components/buttons/customButton';
import TransparentButton from '../../../components/buttons/transparentButton';
import I18n from '../../../translations/text/i18n';
import Avatar from '../../../components/avatar';
import StyleSheetFactory from './styles';
import { getAddressText, getPhoneText } from './controller';
import CardVerificationStatus from '../../../components/cardVerificationStatus';

const { width } = Dimensions.get('window');

const FarmerSuccessScreen = ({ navigation, route }) => {
  const { farmer, newFarmer, cardId = null, displayId = null } = route.params;
  const { theme } = useSelector((state) => state.common);
  const [buttonLoading, setButtonLoading] = useState(false);
  const styles = StyleSheetFactory();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        toFarmers();
        return true;
      },
    );

    return () => backHandler.remove();
  }, []);

  /**
   * direct buy option after creating a farmer
   */
  const toBuy = async () => {
    setButtonLoading(true);

    logAnalytics('direct_buy_after_farmer_creation', {
      direct_buy: 'yes',
    });

    // requesting location permission
    const locationGranted = await requestPermission('location');
    const activeProducts = await fetchAllActiveProducts();

    setButtonLoading(false);
    navigation.popToTop();

    navigation.navigate(activeProducts.length > 1 ? 'ChooseProducts' : 'Buy', {
      newFarmer: farmer,
      locationAllowed: locationGranted,
      allProducts: activeProducts,
      selectedProducts: activeProducts,
    });
  };

  const toFarmers = () => {
    logAnalytics('direct_buy_after_farmer_creation', {
      direct_buy: 'no',
    });

    navigation.popToTop();
    navigation.navigate('FarmersHomeScreen');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topSection}>
        <SuccessScreenTickIcon width={width * 0.3} height={width * 0.3} />
        <Text style={styles.successTitle}>
          {newFarmer
            ? I18n.t('successfully_added_farmer')
            : I18n.t('card_issued_successfully')}
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.newFarmWrap}>
          {newFarmer && (
            <Text style={styles.detailsText}>{I18n.t('farmer_details')}</Text>
          )}

          <Avatar
            image={farmer.image}
            containerStyle={styles.person}
            avatarBgColor={AVATAR_BG_COLORS[0]}
            avatarName={farmer.name}
            avatarNameStyle={styles.avatarNameStyle}
          />

          <Text style={styles.title}>{farmer.name}</Text>

          {newFarmer && (
            <>
              {farmer?.phone && getPhoneText(farmer.phone) !== '' && (
                <Text style={styles.subtitle}>
                  {getPhoneText(farmer.phone)}
                </Text>
              )}

              <Text style={styles.title}>{getAddressText(farmer)}</Text>
            </>
          )}

          {!newFarmer && (
            <>
              <Text
                style={[styles.detailsText, { marginTop: 20, marginBottom: 0 }]}
              >
                {I18n.t('card_details')}
              </Text>

              {cardId && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.cardFieldText}>
                    {`${I18n.t('card_id')}: `}
                  </Text>
                  <Text style={styles.title}>{cardId}</Text>
                </View>
              )}

              {displayId ? (
                <View style={styles.fieldWrap}>
                  <Text style={styles.cardFieldText}>
                    {`${I18n.t('display_id')}: `}
                  </Text>
                  <Text style={styles.title}>{`FF ${displayId}`}</Text>
                </View>
              ) : null}
            </>
          )}

          <View style={{ marginTop: 10 }} />
          <CardVerificationStatus cardId={cardId} displayId={displayId} />

          {newFarmer && (
            <View style={styles.buttonWrap}>
              <TransparentButton
                buttonText={I18n.t('farmer_list')}
                onPress={toFarmers}
                extraStyle={{ width: '45%', marginHorizontal: 0 }}
              />

              <CustomButton
                buttonText={I18n.t('buy_now')}
                onPress={toBuy}
                extraStyle={{ width: '45%' }}
              />
            </View>
          )}

          {!newFarmer && (
            <View style={[styles.buttonWrap, { justifyContent: 'center' }]}>
              {buttonLoading ? (
                <ActivityIndicator color={theme.icon_error} size="small" />
              ) : (
                <TransparentButton
                  buttonText={I18n.t('back')}
                  onPress={toFarmers}
                  extraStyle={{ width: '45%', marginHorizontal: 0 }}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default FarmerSuccessScreen;
