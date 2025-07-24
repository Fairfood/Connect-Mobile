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
import I18n from '../../../../translations/text/i18n';
import { RightArrowIcon } from '../../../../assets/svg';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');

const ChooseProducts = ({ navigation, route }) => {
  const { allProducts, locationAllowed, newFarmer } = route.params;
  const { theme } = useSelector((state) => state.common);
  const [products, setProducts] = useState([]);
  const styles = StyleSheetFactory();

  useEffect(() => {
    setProducts(allProducts);
  }, []);

  /**
   * Navigation function to buy product page
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
            onPress={() => navigation.goBack()}
          />
          <View style={styles.imageSection}>
            <Image
              source={require('../../../../assets/images/choose_products.png')}
              style={{ resizeMode: 'contain', marginVertical: 10 }}
            />
            <View style={styles.itemTextWrap}>
              <Text
                style={styles.itemTitleText}
                testID="multi-product-title-text"
              >
                {I18n.t('buy_products')}
              </Text>
              <Text style={styles.itemSubTitleText}>
                {I18n.t('start_with_one_product')}
              </Text>
            </View>
          </View>
        </View>
        <Image
          source={require('../../../../assets/images/lines.png')}
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
            testID={`product-item-${item.name}`}
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

export default ChooseProducts;
