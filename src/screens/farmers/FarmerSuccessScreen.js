import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  BackHandler,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { SuccessScreenTickIcon } from '../../assets/svg';
import { requestPermission } from '../../services/commonFunctions';
import { AVATAR_BG_COLORS } from '../../services/constants';
import { logAnalytics } from '../../services/googleAnalyticsHelper';
import { fetchAllProducts } from '../../db/services/ProductsHelper';
import CustomButton from '../../components/CustomButton';
import TransparentButton from '../../components/TransparentButton';
import I18n from '../../i18n/i18n';
import Avatar from '../../components/Avatar';

const { height, width } = Dimensions.get('window');

const FarmerSuccessScreen = ({ navigation, route }) => {
  const isFocused = useIsFocused();
  const { farmer, newFarmer, cardId, fairId } = route.params;
  const { theme } = useSelector((state) => state.common);
  const [buttonLoading, setButtonLoading] = useState(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isFocused) {
          navigation.navigate('Farmers');
        }
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

    const allProducts = await fetchAllProducts();

    // filtering products by active status
    const activeProducts = allProducts.filtered('is_active == true');

    navigation.popToTop();

    if (activeProducts.length > 1) {
      setButtonLoading(false);

      navigation.navigate('ChooseProducts', {
        newFarmer: farmer,
        locationAllowed: locationGranted,
        allProducts: activeProducts,
      });
    } else {
      setButtonLoading(false);

      navigation.navigate('Buy', {
        newFarmer: farmer,
        locationAllowed: locationGranted,
        allProducts: activeProducts,
        selectedProducts: activeProducts,
      });
    }
  };

  const toFarmers = () => {
    logAnalytics('direct_buy_after_farmer_creation', {
      direct_buy: 'no',
    });

    navigation.navigate('Farmers');
  };

  /**
   * checking phone text includes both dial code and phone number.
   * if this condition true, returns phone text otherwise ''
   * @param   {string} phone phone text
   * @returns {any}          phone text or ''
   */
  const getPhoneText = (phone) => {
    return phone.trim().includes(' ') ? phone : '';
  };

  /**
   * creating address text from farmer details
   * @param   {object} farmerObj farmer details
   * @returns {string}           address text
   */
  const getAddressText = (farmerObj) => {
    const { street, city, province, country, zipcode } = farmerObj;
    let address = '';
    if (street) {
      address += `${street}, `;
    }
    if (city) {
      address += `${city}, `;
    }
    if (province) {
      address += `${province}, `;
    }
    if (country) {
      address += `${country}, `;
    }
    if (zipcode) {
      address += `${zipcode}.`;
    }

    return address;
  };

  const styles = StyleSheetFactory(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topSection}>
        <SuccessScreenTickIcon width={width * 0.3} height={width * 0.3} />
        {newFarmer && (
          <Text style={styles.successTitle}>
            {I18n.t('successfully_added_farmer')}
          </Text>
        )}

        {!newFarmer && (
          <Text style={styles.successTitle}>
            {I18n.t('card_issued_successfully')}
          </Text>
        )}
      </View>

      <View style={styles.bottomSection}>
        {newFarmer && (
          <View style={styles.newFarmWrap}>
            <Text style={styles.detailsText}>{I18n.t('farmer_details')}</Text>

            <Avatar
              image={farmer.image}
              containerStyle={styles.person}
              avatarBgColor={AVATAR_BG_COLORS[0]}
              avatarName={farmer.name}
              avatarNameStyle={styles.avatarNameStyle}
            />

            <Text style={styles.title}>{farmer.name}</Text>

            {farmer?.phone && getPhoneText(farmer.phone) !== '' && (
              <Text style={styles.subtitle}>{getPhoneText(farmer.phone)}</Text>
            )}

            <Text style={styles.title}>{getAddressText(farmer)}</Text>

            <View style={styles.buttonWrap}>
              <TransparentButton
                buttonText={I18n.t('back_to_home')}
                onPress={() => toFarmers()}
                extraStyle={{ width: '45%', marginHorizontal: 0 }}
              />

              <CustomButton
                buttonText={I18n.t('buy_now')}
                onPress={() => toBuy()}
                extraStyle={{ width: '45%' }}
              />
            </View>
          </View>
        )}

        {!newFarmer && (
          <View style={styles.newFarmWrap}>
            <Text style={styles.detailsText}>{I18n.t('card_details')}</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.cardFieldText}>
                {`${I18n.t('farmer_name')}: `}
              </Text>
              <Text style={styles.title}>{farmer.name}</Text>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.cardFieldText}>
                {`${I18n.t('card_id')}: `}
              </Text>
              <Text style={styles.title}>{cardId}</Text>
            </View>

            {fairId ? (
              <View style={styles.fieldWrap}>
                <Text style={styles.cardFieldText}>
                  {`${I18n.t('fair_id')}: `}
                </Text>
                <Text style={styles.title}>{`FF ${fairId}`}</Text>
              </View>
            ) : null}

            <View style={[styles.buttonWrap, { justifyContent: 'center' }]}>
              {buttonLoading ? (
                <ActivityIndicator color={theme.icon_error} size="small" />
              ) : (
                <TransparentButton
                  buttonText={I18n.t('back_to_home')}
                  onPress={() => toFarmers()}
                  extraStyle={{ width: '45%', marginHorizontal: 0 }}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    topSection: {
      width,
      height: height * 0.4,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.header_bg,
    },
    bottomSection: {
      width,
      height: height * 0.6,
      alignItems: 'center',
    },
    newFarmWrap: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: width * 0.1,
      paddingVertical: width * 0.15,
    },
    fieldWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
    },
    detailsText: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_medium,
      marginBottom: 15,
    },
    successTitle: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 20,
      textAlign: 'center',
      marginTop: 30,
    },
    person: {
      backgroundColor: '#F2F2F2',
      height: 70,
      width: 70,
      borderRadius: 70 / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarNameStyle: {
      color: '#ffffff',
      fontSize: 20,
      fontFamily: theme.font_bold,
    },
    title: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      marginTop: 10,
      textAlign: 'center',
    },
    subtitle: {
      color: theme.placeholder,
      fontSize: 14,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      fontStyle: 'normal',
      marginTop: 10,
      textAlign: 'center',
    },
    buttonWrap: {
      width: width * 0.85,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 'auto',
    },
    cardFieldText: {
      color: theme.placeholder,
      fontSize: 16,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      marginTop: 10,
    },
  });
};

export default FarmerSuccessScreen;
