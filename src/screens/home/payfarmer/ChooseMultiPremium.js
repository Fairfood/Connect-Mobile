import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RightArrowIcon } from '../../../assets/svg';
import I18n from '../../../i18n/i18n';
import CustomLeftHeader from '../../../components/CustomLeftHeader';

const { width, height } = Dimensions.get('window');

const ChooseMultiPremiums = ({ navigation, route }) => {
  const { allPremiums, locationAllowed, newFarmer } = route.params;
  const { theme } = useSelector((state) => state.common);
  const [premiums, setPremiums] = useState([]);

  useEffect(() => {
    setPremiums(allPremiums);
  }, []);

  /**
   * Navigation function to buy product page
   * @param {object} item product object
   */
  const goToPayFarmer = (item) => {
    const selectedPremiums = [];
    selectedPremiums.push(item);

    navigation.navigate('PayFarmer', {
      allPremiums,
      selectedPremiums,
      locationAllowed,
      newFarmer,
    });
  };

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.topSectionWrap}>
          <CustomLeftHeader
            title={I18n.t('pay')}
            leftIcon="arrow-left"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.imageSection}>
            <Image
              source={require('../../../assets/images/choose-products.png')}
              style={{ resizeMode: 'contain', marginVertical: 10 }}
            />
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitleText}>{I18n.t('pay_farmer')}</Text>
              <Text style={styles.itemSubTitleText}>
                {I18n.t('start_with_one_premium')}
              </Text>
            </View>
          </View>
        </View>
        <Image
          source={require('../../../assets/images/lines.png')}
          style={styles.linesImage}
        />
      </View>

      <Text style={styles.productTitle}>{I18n.t('choose_premium')}</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.bottomSectionWrap}
      >
        {premiums.map((item, index) => (
          <TouchableOpacity
            key={index.toString()}
            onPress={() => goToPayFarmer(item)}
            style={styles.itemWrap}
          >
            <Text style={styles.itemText}>{item.name}</Text>
            <RightArrowIcon
              width={width * 0.04}
              height={width * 0.04}
              stroke={theme.icon_1}
            />
          </TouchableOpacity>
        ))}
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
    productTitle: {
      fontSize: 18,
      fontFamily: theme.font_medium,
      color: theme.text_1,
      marginVertical: height * 0.03,
      marginHorizontal: width * 0.05,
    },
    itemWrap: {
      marginBottom: height * 0.02,
      padding: width * 0.04,
      borderColor: theme.border_1,
      borderWidth: 1,
      borderRadius: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    imageSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerContainer: {
      height: '50%',
      backgroundColor: '#92DDF6',
    },
    topSectionWrap: {
      flex: 1,
      paddingHorizontal: width * 0.05,
    },
    bottomSectionWrap: {
      flex: 1,
      paddingHorizontal: width * 0.05,
    },
    linesImage: {
      width: '100%',
      height: 40,
      bottom: -5,
    },
    itemTextWrap: {
      width: width * 0.8,
      position: 'relative',
    },
    itemTitleText: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_bold,
      fontStyle: 'normal',
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      marginTop: 10,
    },
    itemText: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 16,
    },
    itemSubTitleText: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 14,
      letterSpacing: 0,
      lineHeight: 24,
      textAlign: 'center',
    },
  });
};

export default ChooseMultiPremiums;
