/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable no-return-assign */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Keyboard,
  Dimensions,
  ToastAndroid,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import Collapsible from 'react-native-collapsible';
import withObservables from '@nozbe/with-observables';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { observeProducts } from '../../services/productsHelper';
import { findPremiumByServerId } from '../../services/premiumsHelper';
import { findAllPremiumsByProduct } from '../../services/productPremiumHelper';
import { stringToJson } from '../../services/commonFunctions';
import I18n from '../../i18n/i18n';
import FormTextInput from '../../components/FormTextInput';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import CustomButton from '../../components/CustomButton';
import CustomInputFields from '../../components/CustomInputFields';
import {
  BlueRoundTickIcon,
  DeleteBinIcon,
  PlusRoundIcon,
  ThinArrowDowncon,
} from '../../assets/svg';
import * as consts from '../../services/constants';

const { width, height } = Dimensions.get('window');

const BuyScreen = ({ navigation, route }) => {
  const { allProducts, selectedProducts, locationAllowed, newFarmer } =
    route.params;
  const localPriceRef = useRef(null);
  const quantityRefs = useRef([]);
  const basePriceRefs = useRef([]);

  const { userProjectDetails, userCompanyDetails } = useSelector(
    (state) => state.login,
  );
  const { currency } = userProjectDetails;
  const qualityCorrection = userProjectDetails.quality_correction;
  const appCustomFields = userCompanyDetails?.app_custom_fields
    ? stringToJson(userCompanyDetails.app_custom_fields)
    : null;
  const fieldVisibility = appCustomFields?.field_visibility?.buy_txn ?? null;

  const [load, setLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const [products, setProducts] = useState([]);
  const [initialProducts, setInitialProducts] = useState([]);
  const [totalPremiums, setTotalPremiums] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState('');
  const [localPrice, setLocalPrice] = useState('');
  const [location, setLocation] = useState(null);
  const [activeCollapse, setActiveCollapse] = useState(null);
  const [productModal, setProductModal] = useState(false);
  const [basePrices, setBasePrices] = useState(null);

  const backNavigation = () => {
    navigation.goBack(null);
  };

  useEffect(() => {
    setupInitialValues();
  }, []);

   /**
    * setting up initial product values
    */
  const setupInitialValues = async () => {
    setLoading(true);
    if (locationAllowed) {
      fetchLocation();
    }

    await AsyncStorage.setItem('transactionStatus', JSON.stringify({}));

    let productPrices =
      (await AsyncStorage.getItem('product_base_prices')) || '{}';
    productPrices = JSON.parse(productPrices);

    const localprice = await AsyncStorage.getItem('LocalPrice');
    if (localprice != null) {
      setLocalPrice(localprice);
    } else {
      setLocalPrice('');
    }

    const allProd = allProducts.map((prod) => {
      prod.label = prod.name;
      prod.value = prod.id;
      prod.quantity = ''; // calculated
      prod.base_price = productPrices[prod.server_id] ?? ''; // base price entered
      prod.total_amount = ''; // base price * quantity
      prod.premium_total = ''; // total premium amount applied for this product
      prod.applied_premiums = []; // all premiums applied for this product
      prod.extra_fields =
        appCustomFields && Object.keys(appCustomFields).length > 0
          ? appCustomFields
          : null;
      return prod;
    });

    setProducts(selectedProducts);
    setActiveCollapse(selectedProducts[0].id);
    setInitialProducts(allProd);
    setBasePrices(productPrices);
    setLoading(false);
  };

  /**
   * fetching geo location
   */
  const fetchLocation = async () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
      },
      (error) => {
        setLocation(null);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
    );
  };

  /**
   * calculating total values based on inputs
   */
  const calculateValues = async () => {
    products.map(async (product) => {
      const currentQuantity = product.quantity;

      if (currentQuantity && parseFloat(currentQuantity) > 0) {
        let initialValue = 0;
        if (product.base_price !== '' && currentQuantity !== '') {
          initialValue =
            parseFloat(product.base_price) * parseFloat(currentQuantity);
        }

        const premiums = await findAllPremiumsByProduct(product.server_id);

        let sumAllPremiums = 0;
        let premiumsPerTransaction = 0;
        let premiumTotal = 0;
        const appliedPremiums = [];

        if (premiums.length > 0) {
          premiums.map(async (premium) => {
            let premiumAmount = 0;
            const pp = await findPremiumByServerId(premium.premium_id);
            let p = pp.slice(0);

            if (p.length > 0) {
              // checking premium exist
              [p] = p;

              if (
                p.applicable_activity === consts.PREMIUM_APPLICABLE_ACTIVITY_BUY
              ) {
                if (p.included_in_amt) {
                  sumAllPremiums += p.amount;
                }

                if (p.type === 101) {
                  premiumsPerTransaction += p.amount;
                }

                if (p.type === 101) {
                  premiumAmount = Math.round(p.amount);
                } else if (p.type === 301) {
                  premiumAmount = Math.round(currentQuantity * p.amount);
                } else {
                  premiumAmount = Math.round(currentQuantity * p.amount);
                }

                premiumTotal += premiumAmount;

                const obj = { total: premiumAmount };
                p = { ...p, ...obj };
                appliedPremiums.push(p);
              }
              product.premium_total = premiumTotal;
            }
          });
        } else {
          product.premium_total = premiumTotal;
        }

        product.applied_premiums = appliedPremiums;

        let initialExcludingPerTransaction = 0;
        let baseValue = 0;

        if (initialValue > 0) {
          initialExcludingPerTransaction =
            initialValue - premiumsPerTransaction;
        }

        if (initialExcludingPerTransaction > 0) {
          baseValue = parseFloat(
            initialExcludingPerTransaction / (1 + sumAllPremiums),
          );
        }

        product.total_amount = baseValue;

        setTimeout(() => {
          updateValues(products);
        }, 100);
      } else {
        product.total_amount = 0;
        product.premium_total = 0;
        product.applied_premiums = [];

        setTimeout(() => {
          updateValues(products);
        }, 100);
      }
    });
  };

   /**
    * creating an alert message that card is already assigned
    *
    * @param {Array} products updated product array
    */
  const updateValues = (products) => {
    setProducts((products) => products);
    calculatePremiums(products);
    validateDatas();
    setLoad(!load);
  };

  /**
   * setting qunatity of each product based on the array index
   *
   * @param {string}  quantity product quantity
   * @param {number}  orIndex  index of updated product in product array
   */
  const onChangeQuantity = (quantity, orIndex) => {
    productQuantity = quantity.toString().replace(',', '.');

    if (productQuantity === '.') {
      productQuantity = '0.';
    }

    products.find((i, index) => index === orIndex).quantity = productQuantity;
    setProducts((products) => products);
    setLoad(!load);
    calculateValues();
  };

  /**
   * setting qunatity of each product based on the array index
   *
   * @param {string}  price   product base price
   * @param {number}  orIndex index of updated product in product array
   */
  const onChangeBasePrice = (price, orIndex) => {
    let basePrice = price.toString().replace(',', '.');

    if (basePrice === '.') {
      basePrice = '0.';
    }

    if (parseInt(basePrice) > consts.MAX_BASE_PRICE) {
      ToastAndroid.show(
        `${I18n.t('max_baseprice_is')} ${consts.MAX_BASE_PRICE}`,
        ToastAndroid.SHORT,
      );
    } else {
      products.find((i, index) => index === orIndex).base_price = basePrice;
      setProducts((products) => products);
      setLoad(!load);
      calculateValues();
    }
  };

  /**
   * setting local market price based on input
   *
   * @param {string} price local market price
   */
  const onChangeLocalPrice = (price) => {
    let priceLocal = price.toString().replace(',', '.');

    if (priceLocal === '.') {
      priceLocal = '0.';
    }

    if (priceLocal !== '' && parseInt(priceLocal) > consts.MAX_LOCAL_MARKET_PRICE) {
      setError(
        `${I18n.t('max_local_marketprice_is')} ${
          consts.MAX_LOCAL_MARKET_PRICE
        }`,
      );
    } else {
      setLocalPrice(priceLocal);
      setError('');
    }
  };

  /**
   * validating input data
   */
  const validateDatas = async () => {
    if (products.length === 0) {
      setValid(false);
      setLoad(!load);
      return;
    }

    let success = true;

    products.map((product) => {
      if (!product.quantity || !product.base_price) {
        success = false;
      }
    });

    if (success) {
      setError('');
    }
    setValid(success);
    setLoad(!load);
  };

  /**
   * submit validation
   */
  const validateSubmit = async () => {
    if (products.length === 0) {
      setLoad(!load);
      return false;
    }

    let valid = true;

    products.map((product) => {
      if (!product.quantity) {
        setError(
          `${I18n.t('quantity_of')} ${product.name} ${I18n.t('required')}.`,
        );

        valid = false;
        return;
      }

      if (!product.base_price) {
        setError(
          `${I18n.t('base_price_of')} ${product.name} ${I18n.t('required')}.`,
        );
        valid = false;
        return;
      }

      if (Math.round(parseFloat(product.base_price)) <= 0) {
        setError(
          `${I18n.t('base_price_of')} ${product.name} ${I18n.t(
            'cannot_be_0',
          )}.`,
        );
        valid = false;
        return;
      }

      const enteredQuantity = parseFloat(product.quantity);

      if (enteredQuantity <= consts.MINIMUM_TRANSACTION_QUANTITY) {
        setError(
          `${I18n.t('quantity_of')} ${product.name} ${I18n.t(
            'must_be_greater_than',
          )} ${consts.MINIMUM_TRANSACTION_QUANTITY}Kg.`,
        );
        valid = false;
        return;
      }

      if (enteredQuantity >= consts.MAXIMUM_TRANSACTION_QUANTITY) {
        success = false;
        setError(
          `${I18n.t('quantity_of')} ${product.name} ${I18n.t(
            'must_be_lower_than',
          )} ${consts.MAXIMUM_TRANSACTION_QUANTITY}Kg.`,
        );
        valid = false;
        return;
      }

      if (product?.extra_fields) {
        const buyTxnFields =
          product?.extra_fields?.custom_fields?.buy_txn_fields ?? [];

        buyTxnFields.map((field) => {
          if (field.required === true && field.value == null) {
            setError(`${field?.label?.en ?? field.key} ${I18n.t('required')}`);
            valid = false;
          }
        });
      }
    });

    if (valid) {
      setError('');
    }
    setLoad(!load);
    return valid;
  };

  /**
   * submit function
   */
  const confirmBuy = async () => {
    const fieldsValid = await validateSubmit();
    if (!fieldsValid) {
      return;
    }

    setError('');

    // caching product base prices
    let productPrices =
      (await AsyncStorage.getItem('product_base_prices')) || '{}';
    productPrices = JSON.parse(productPrices);

    await Promise.all(
      products.map((product) => {
        productPrices[product.server_id] = product.base_price;
      }),
    );

    await AsyncStorage.setItem(
      'product_base_prices',
      JSON.stringify(productPrices),
    );

    const applicableProducts = products.filter((prod) => {
      return parseFloat(prod.quantity) > consts.MINIMUM_TRANSACTION_QUANTITY;
    });

    if (!qualityCorrection) {
      await AsyncStorage.setItem('LocalPrice', localPrice);
    } // caching Local price

    const params = {
      products: applicableProducts,
      totalPrice,
      newFarmer: newFarmer ?? null,
      preLocation: location,
    };

    navigation.navigate('Verification', params);
  };

  /**
   * calculate and set premiums based on updated product array
   *
   * @param {Array} products updated product array
   */
  const calculatePremiums = (products) => {
    const mainObj = {};
    products.map((product) => {
      product.applied_premiums.map((premium) => {
        const serverId = premium._raw.server_id;
        if (mainObj[serverId]) {
          const obj = mainObj[serverId];
          let { total } = obj;
          total += premium.total;
          obj.total = total;
          mainObj[serverId] = obj;
        } else {
          const obj = {
            name: premium._raw.name,
            total: premium.total,
          };
          mainObj[serverId] = obj;
        }
      });
    });

    const premiumCalculated = Object.values(mainObj);
    setTotalPremiums((totalPremiums) => premiumCalculated);
    calculateTotalPrice(products);
  };

  /**
   * calculate and set total price based on updated product array
   *
   * @param {Array} products updated product array
   */
  const calculateTotalPrice = (products) => {
    let total = 0;
    products.map((product) => {
      if (
        product.quantity === '' ||
        product.base_price === '' ||
        product.total_amount === '' ||
        product.premium_total === ''
      ) {
        return 0;
      }
      total += parseFloat(product.total_amount);
      total += parseFloat(product.premium_total);
    });

    total = Math.round(parseFloat(total));

    setTotalPrice(total);
  };

  /**
   * updating custom field values based on productId and index
   *
   * @param {object}  item        updated custom fileld object
   * @param {number}  index       index of updated product in product array
   * @param {Array}   productId   updated product's productId
   */
  const updateCustomData = (item, index, productId) => {
    products.map((product) => {
      if (product.id === productId) {
        if (
          product?.extra_fields?.custom_fields?.buy_txn_fields?.[index]?.key ===
          item.key
        ) {
          product.extra_fields.custom_fields.buy_txn_fields[index].value =
            item.value;

          setProducts((products) => products);
          setLoad(!load);
          validateDatas();
        }
      }
    });
  };

  /**
   * opening add product modal
   */
  const openProductModal = async () => {
    const valid = await validateSubmit();
    if (valid) {
      setProductModal(true);
    }
  };

  /**
   * opening collapse based on product id
   *
   * @param {string} key product id
   */
  const toggleExpanded = (key) => {
    if (activeCollapse === key) {
      setActiveCollapse(null);
    } else {
      setActiveCollapse(key);
    }
  };

  /**
   * adding products to current product array
   *
   * @param {object} item new product object
   */
  const addProduct = (item) => {
    item.quantity = '';
    item.base_price = basePrices[item.server_id] ?? '';
    item.total_amount = '';
    item.premium_total = '';
    item.applied_premiums = [];
    products.push(item);

    setActiveCollapse(item.id);
    setProducts((products) => products);
    updateValues(products);
    setProductModal(false);
  };

  /**
   * removing product from product array
   *
   * @param {string} id product id
   */
  const removeProduct = (id) => {
    if (products.length === 1) {
      navigation.goBack();
    } else {
      const filteredProducts = products.filter((x) => {
        return x.id !== id;
      });
      setProducts((products) => filteredProducts);
      updateValues(filteredProducts);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        backgroundColor={consts.APP_BG_COLOR}
        title={I18n.t('buy')}
        leftIcon='arrow-left'
        onPress={() => backNavigation()}
      />

      {loading && (
        <ActivityIndicator size='small' color={consts.TEXT_PRIMARY_COLOR} />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='always'
      >
        {products.map((item, index) => (
          <View key={index.toString()} style={styles.productWrap}>
            <TouchableOpacity
              hitSlop={consts.HIT_SLOP_TWENTY}
              onPress={() => toggleExpanded(item.id)}
              style={[
                styles.topWrap,
                {
                  backgroundColor:
                    activeCollapse === item.id ? null : 'rgba(221,243,255,0.3)',
                },
              ]}
              disabled={allProducts.length <= 1}
            >
              <View style={styles.titleWrap}>
                <Text style={styles.fieldTitle}>{item.name}</Text>
                {activeCollapse === item.id && allProducts.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeProduct(item.id)}
                    style={styles.detailsWrap}
                    hitSlop={consts.HIT_SLOP_TEN}
                  >
                    <DeleteBinIcon
                      width={width * 0.04}
                      height={width * 0.04}
                      fill={consts.ERROR_ICON_COLOR}
                    />
                    <Text style={styles.removeText}>{I18n.t('remove')}</Text>
                  </TouchableOpacity>
                )}

                {activeCollapse !== item.id && allProducts.length > 1 && (
                  <ThinArrowDowncon
                    width={width * 0.04}
                    height={width * 0.04}
                    fill='#7091A6'
                  />
                )}
              </View>

              {activeCollapse !== item.id && (
                <View style={styles.detailsWrap}>
                  <Text
                    style={[
                      styles.detailsText,
                      {
                        color: item.quantity
                          ? consts.INPUT_PLACEHOLDER
                          : consts.ERROR_ICON_COLOR,
                      },
                    ]}
                  >
                    {`${I18n.t('quantity')}: `}
                  </Text>
                  <Text style={styles.detailsText}>
                    {item.quantity.toLocaleString('pt-BR')}
                    {item.quantity ? 'kg' : ''}
                  </Text>
                  <Text style={styles.detailsText}> | </Text>
                  <Text
                    style={[
                      styles.detailsText,
                      {
                        color: item.base_price
                          ? consts.INPUT_PLACEHOLDER
                          : consts.ERROR_ICON_COLOR,
                      },
                    ]}
                  >
                    {`${I18n.t('base_price')}: `}
                  </Text>
                  <Text style={styles.detailsText}>
                    {`${item.base_price} ${item.base_price ? currency : ''}`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Collapsible collapsed={activeCollapse !== item.id} align='center'>
              <View key={index.toString()} style={styles.bottomWrap}>
                <FormTextInput
                  inputRef={(el) => (quantityRefs.current[index] = el)}
                  mandatory
                  placeholder={`${I18n.t('quantity')} (kg)`}
                  value={item.quantity.toLocaleString('id').replace('.', ',')}
                  onChangeText={(text) => {
                    if (text === '') {
                      onChangeQuantity(text, index);
                    } else {
                      onChangeQuantity(text, index);
                    }
                  }}
                  keyboardType='number-pad'
                  color={consts.TEXT_PRIMARY_COLOR}
                  returnKeyType='next'
                  onSubmitEditing={() => {
                    if (basePriceRefs?.current?.[index]) {
                      basePriceRefs.current[index].focus();
                    } else {
                      Keyboard.dismiss();
                    }
                  }}
                  blurOnSubmit={false}
                  extraStyle={{ width: '100%' }}
                />

                <FormTextInput
                  inputRef={(el) => (basePriceRefs.current[index] = el)}
                  mandatory
                  placeholder={`${I18n.t('base_price')} (${currency})`}
                  value={item.base_price.toLocaleString('id').replace('.', ',')}
                  maxLength={10}
                  onChangeText={(text) => {
                    if (text === '') {
                      onChangeBasePrice(text, index);
                    } else {
                      onChangeBasePrice(text, index);
                    }
                  }}
                  visibility={
                    fieldVisibility ? fieldVisibility?.base_price : true
                  }
                  keyboardType='number-pad'
                  color={consts.TEXT_PRIMARY_COLOR}
                  returnKeyType='next'
                  onSubmitEditing={() => {
                    if (qualityCorrection) {
                      if (quantityRefs?.current?.[index + 1]) {
                        quantityRefs.current[index + 1].focus();
                      } else {
                        Keyboard.dismiss();
                      }
                    } else {
                      localPriceRef.current.focus();
                    }
                  }}
                  blurOnSubmit={false}
                  extraStyle={{ width: '100%' }}
                />

                {!qualityCorrection && (
                  <FormTextInput
                    placeholder={`${I18n.t(
                      'local_market_price',
                    )} (${currency})`}
                    value={localPrice.toLocaleString('id').replace('.', ',')}
                    inputRef={localPriceRef}
                    maxLength={10}
                    onChangeText={(text) => {
                      onChangeLocalPrice(text);
                    }}
                    visibility={
                      fieldVisibility ? fieldVisibility?.market_price : true
                    }
                    keyboardType='numeric'
                    color={consts.TEXT_PRIMARY_COLOR}
                    extraStyle={{ width: '100%' }}
                  />
                )}

                {/* custom fileds */}
                {item?.extra_fields?.custom_fields?.buy_txn_fields && (
                  <>
                    {item.extra_fields.custom_fields.buy_txn_fields.map(
                      (i, n) => {
                        return (
                          <CustomInputFields
                            key={n.toString()}
                            productId={item.id}
                            item={i}
                            index={n}
                            updatedItem={updateCustomData}
                          />
                        );
                      },
                    )}
                  </>
                )}
              </View>
            </Collapsible>
          </View>
        ))}

        {allProducts.length > 1 && (
          <TouchableOpacity
            onPress={() => openProductModal()}
            style={styles.addProductWarp}
            add_another_product
          >
            <Text style={styles.addText}>{I18n.t('add_another_product')}</Text>
            <PlusRoundIcon
              width={width * 0.05}
              height={width * 0.05}
              fill='#4DCAF4'
            />
          </TouchableOpacity>
        )}

        {valid && products.length > 0 && (
          <View style={[styles.cardContainer]}>
            {products.map((item, index) => {
              return (
                <View key={index.toString()} style={styles.basePriceWrap}>
                  <View style={{ width: '70%' }}>
                    <Text style={styles.cardLeftItem}>
                      {`${I18n.t('base_price_for')} ${parseFloat(item.quantity)
                        .toFixed(2)
                        .toLocaleString('pt-BR')} Kg ${item.name} :`}
                    </Text>
                  </View>
                  <View style={{ width: '30%' }}>
                    <Text style={styles.cardRightItem}>
                      {`${Math.round(
                        parseFloat(item.total_amount),
                      ).toLocaleString('pt-BR')} ${currency}`}
                    </Text>
                  </View>
                </View>
              );
            })}

            {totalPremiums.map((item, index) => (
              <View key={index.toString()} style={{ marginBottom: 10 }}>
                <View style={styles.premiumWrap}>
                  <View style={{ width: '70%' }}>
                    <Text style={styles.cardLeftItem}>{item.name}</Text>
                  </View>
                  <View style={{ width: '30%' }}>
                    <Text style={styles.cardRightItem}>
                      {`${Math.round(parseFloat(item.total)).toLocaleString(
                        'pt-BR',
                      )} ${currency}`}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.dottedLine} />

            <View style={styles.premiumWrap}>
              <View style={{ width: '30%' }}>
                <Text style={styles.totalText}>
                  {`${I18n.t('total').toUpperCase()}:`}
                </Text>
              </View>
              <View style={{ width: '70%' }}>
                <Text style={styles.totalValue}>
                  {`${totalPrice.toLocaleString('pt-BR')} ${currency}`}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonWrap}>
        {error !== '' && <Text style={styles.errorMessage}>{error}</Text>}

        <CustomButton
          buttonText={I18n.t('next')}
          onPress={() => confirmBuy()}
          extraStyle={{ width: '100%' }}
        />
      </View>

      {productModal && (
        <ProductsModal
          visible={productModal}
          initialProducts={initialProducts}
          products={products}
          hideModal={() => setProductModal(false)}
          addProduct={addProduct}
        />
      )}
    </SafeAreaView>
  );
};

const ProductsModal = ({
  visible,
  products,
  initialProducts,
  hideModal,
  addProduct,
}) => {
  const getIsSelected = (id) => {
    const isExist = products.filter((x) => {
      return x.id === id;
    });
    return isExist.length > 0;
  };

  return (
    <Modal
      animationType='fade'
      transparent
      visible={visible}
      onRequestClose={() => hideModal()}
    >
      <TouchableOpacity
        onPress={() => hideModal()}
        style={styles.modalContainer}
      />
      <View style={styles.modalContainerSub}>
        <View style={styles.modalTitleSection}>
          <Text style={styles.modalTitle}>{I18n.t('add_another_product')}</Text>
          {/* <CloseIcon width={width * 0.04} height={width * 0.04}/> */}
        </View>

        {initialProducts.map((item, index) => (
          <TouchableOpacity
            key={index.toString()}
            onPress={() => addProduct(item)}
            style={styles.modalItemWrap}
            disabled={getIsSelected(item.id)}
          >
            <Text style={styles.modalItem}>{item.name}</Text>
            {getIsSelected(item.id) ? (
              <BlueRoundTickIcon width={width * 0.055} height={width * 0.055} />
            ) : (
              <PlusRoundIcon
                width={width * 0.05}
                height={width * 0.05}
                fill='#4DCAF4'
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: consts.APP_BG_COLOR,
    paddingHorizontal: width * 0.05,
  },
  productWrap: {
    borderColor: consts.INPUT_PLACEHOLDER,
    borderWidth: 1,
    borderRadius: consts.BORDER_RADIUS,
    marginTop: height * 0.02,
  },
  fieldTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_MEDIUM,
    fontSize: 16,
  },
  removeText: {
    color: consts.ERROR_ICON_COLOR,
    fontFamily: consts.FONT_MEDIUM,
    fontSize: 14,
    paddingLeft: width * 0.01,
  },
  detailsText: {
    color: consts.INPUT_PLACEHOLDER,
    fontFamily: consts.FONT_MEDIUM,
    fontSize: 12,
    marginTop: height * 0.005,
  },
  topWrap: {
    padding: width * 0.04,
    borderRadius: consts.BORDER_RADIUS,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomWrap: {
    paddingHorizontal: width * 0.03,
  },
  addProductWarp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#4DCAF4',
    borderWidth: 1,
    borderRadius: consts.BORDER_RADIUS,
    padding: width * 0.035,
    marginVertical: height * 0.02,
  },
  addText: {
    color: '#4DCAF4',
    fontFamily: consts.FONT_REGULAR,
    fontSize: 16,
    marginRight: width * 0.03,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  modalContainerSub: {
    marginTop: 'auto',
    paddingHorizontal: width * 0.05,
    backgroundColor: '#ffffff',
  },
  modalTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: width * 0.05,
    paddingHorizontal: width * 0.03,
  },
  closeIconWrap: {
    alignSelf: 'flex-end',
  },
  modalItemWrap: {
    padding: width * 0.035,
    marginBottom: height * 0.015,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: consts.BORDER_COLOR,
    borderWidth: 1,
    borderRadius: consts.BORDER_RADIUS,
  },
  modalItem: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 15,
    fontFamily: consts.FONT_REGULAR,
  },
  modalTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 17,
    fontFamily: consts.FONT_MEDIUM,
    fontWeight: '500',
    marginTop: 15,
  },

  formTitleContainer: {
    marginVertical: 10,
  },
  formTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'center',
    marginHorizontal: 30,
    color: consts.BUTTON_COLOR_PRIMARY,
  },
  cardContainer: {
    marginVertical: 30,
    padding: 10,
    backgroundColor: consts.CARD_BACKGROUND_COLOR,
  },
  cardLeftItem: {
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 14,
    color: consts.TEXT_PRIMARY_COLOR,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  cardRightItem: {
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 13,
    color: consts.TEXT_PRIMARY_COLOR,
    textAlign: 'right',
  },
  totalText: {
    fontFamily: consts.FONT_BOLD,
    fontStyle: 'normal',
    fontSize: 20,
    color: consts.TEXT_PRIMARY_COLOR,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  totalValue: {
    fontFamily: consts.FONT_BOLD,
    fontStyle: 'normal',
    fontSize: 20,
    color: consts.TEXT_PRIMARY_COLOR,
    textAlign: 'right',
  },
  dottedLine: {
    borderStyle: 'dotted',
    borderWidth: 1,
    borderRadius: consts.BORDER_RADIUS,
    borderColor: consts.TEXT_PRIMARY_LIGHT_COLOR,
    marginHorizontal: 0,
    marginTop: 5,
  },
  basePriceWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  premiumWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonWrap: {
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
});

// export default BuyScreen;
const enhanceWithWeights = withObservables([], () => ({
  PRODUCTS: observeProducts(),
}));

export default enhanceWithWeights(BuyScreen);
