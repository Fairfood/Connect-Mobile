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
import I18n from '../../i18n/i18n';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import { RightArrowIcon } from '../../assets/svg';
import * as consts from '../../services/constants';

const { width, height } = Dimensions.get('window');

const ChooseProducts = ({ navigation, route }) => {
  const { allProducts, locationAllowed, newFarmer } = route.params;
  const [products, setProducts] = useState([]);

  useEffect(() => {
    setProducts(allProducts);
  }, []);

  /**
   * Navigation function to buy product page
   *
   * @param {object} item product object
   */
  const goToBuy = (item) => {
    const selectedProducts = [];
    selectedProducts.push(item);

    navigation.navigate('Buy', {
      allProducts,
      selectedProducts,
      locationAllowed,
      newFarmer,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.topSectionWrap}>
          <CustomLeftHeader
            title={I18n.t('buy')}
            leftIcon='arrow-left'
            onPress={() => navigation.goBack()}
          />
          <View style={styles.imageSection}>
            <Image
              source={require('../../assets/images/choose-products.png')}
              style={{ resizeMode: 'contain', marginVertical: 10 }}
            />
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitleText}>{I18n.t('buy_products')}</Text>
              <Text style={styles.itemSubTitleText}>
                {I18n.t('start_with_one_product')}
              </Text>
            </View>
          </View>
        </View>
        <Image
          source={require('../../assets/images/lines.png')}
          style={styles.linesImage}
        />
      </View>

      <Text style={styles.productTitle}>{I18n.t('choose_product')}</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.bottomSectionWrap}
      >
        {products.map((item, index) => (
          <TouchableOpacity
            key={index.toString()}
            onPress={() => goToBuy(item)}
            style={styles.itemWrap}
          >
            <Text style={styles.itemText}>{item.name}</Text>
            <RightArrowIcon
              width={width * 0.04}
              height={width * 0.04}
              stroke={consts.ICON_COLOR}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: consts.APP_BG_COLOR,
  },
  productTitle: {
    fontSize: 18,
    fontFamily: consts.FONT_MEDIUM,
    color: consts.TEXT_PRIMARY_COLOR,
    marginVertical: height * 0.03,
    marginHorizontal: width * 0.05,
  },
  itemWrap: {
    marginBottom: height * 0.02,
    padding: width * 0.04,
    borderColor: consts.BORDER_COLOR,
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
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_BOLD,
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 10,
  },
  itemText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_REGULAR,
    fontSize: 16,
  },
  itemSubTitleText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 24,
    textAlign: 'center',
  },
});

export default ChooseProducts;
