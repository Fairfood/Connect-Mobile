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
import { getAllProducts } from '../../services/productsHelper';
import { requestPermission } from '../../services/commonFunctions';
import CustomButton from '../../components/CustomButton';
import TransparentButton from '../../components/TransparentButton';
import I18n from '../../i18n/i18n';
import Avatar from '../../components/Avatar';
import * as consts from '../../services/constants';

const { height, width } = Dimensions.get('window');

const FarmerSuccessScreen = ({ navigation, route }) => {
  const isFocused = useIsFocused();
  const { farmer, newFarmer, cardId, fairId } = route.params;
  const { userCompanyDetails } = useSelector((state) => state.login);
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

    // requesting location permission
    const locationGranted = await requestPermission('location');

    const allProducts = await getAllProducts();

    // filtering products only eligilbe for that company
    const companyProducts = userCompanyDetails?.products ?? [];
    const filteredProducts = allProducts.filter((prod) => {
      return companyProducts.includes(prod.server_id);
    });

    // filtering products by active status
    const productActiveList = filteredProducts.filter((prod) => {
      return prod.is_active;
    });

    navigation.popToTop();

    if (productActiveList.length > 1) {
      setButtonLoading(false);

      navigation.navigate('ChooseProducts', {
        newFarmer: farmer,
        locationAllowed: locationGranted,
        allProducts: productActiveList,
      });
    } else {
      setButtonLoading(false);

      navigation.navigate('Buy', {
        newFarmer: farmer,
        locationAllowed: locationGranted,
        allProducts: productActiveList,
        selectedProducts: productActiveList,
      });
    }
  };

  /**
   * checking phone text includes both dial code and phone number.
   * if this condition true, returns phone text otherwise ''
   *
   * @param   {string} phone phone text
   * @returns {any}          phone text or ''
   */
  const getPhoneText = (phone) => {
    return phone.trim().includes(' ') ? phone : '';
  };

  /**
   * creating address text from farmer details
   *
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
              avatarBgColor={consts.AVATAR_BG_COLORS[0]}
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
                onPress={() => {
                  navigation.navigate('Farmers');
                }}
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
                <ActivityIndicator
                  color={consts.ERROR_ICON_COLOR}
                  size='small'
                />
              ) : (
                <TransparentButton
                  buttonText={I18n.t('back_to_home')}
                  onPress={() => {
                    navigation.navigate('Farmers');
                  }}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: consts.APP_BG_COLOR,
  },
  topSection: {
    width,
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: consts.HEADER_BACKGROUND_COLOR,
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
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 16,
    fontFamily: consts.FONT_MEDIUM,
    marginBottom: 15,
  },
  successTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
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
    fontFamily: consts.FONT_BOLD,
  },
  title: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 16,
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    marginTop: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: consts.INPUT_PLACEHOLDER,
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
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
    color: consts.INPUT_PLACEHOLDER,
    fontSize: 16,
    fontFamily: consts.FONT_REGULAR,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default FarmerSuccessScreen;
