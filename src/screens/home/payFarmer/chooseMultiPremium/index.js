import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RightArrowIcon } from '../../../../assets/svg';
import I18n from '../../../../translations/text/i18n';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');

const ChooseMultiPremiums = ({ navigation, route }) => {
  const { allPremiums, locationAllowed, newFarmer } = route.params;
  const { theme } = useSelector((state) => state.common);
  const [premiums, setPremiums] = useState([]);
  const styles = StyleSheetFactory();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.topSectionWrap}>
          <CustomLeftHeader
            title={I18n.t('pay')}
            onPress={() => navigation.goBack()}
          />
          <View style={styles.imageSection}>
            <Image
              source={require('../../../../assets/images/choose_products.png')}
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
          source={require('../../../../assets/images/lines.png')}
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

export default ChooseMultiPremiums;
