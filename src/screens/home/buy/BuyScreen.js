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
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Collapsible from 'react-native-collapsible';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';

import {
  convertCurrency,
  convertQuantity,
  stringToJson,
} from '../../../services/commonFunctions';
import {
  fetchPremiumsByCalculationType,
  searchPremiumByServerId,
} from '../../../db/services/PremiumsHelper';
import { fetchAllPremiumsByProduct } from '../../../db/services/ProductPremiumHelper';
import {
  BlueRoundTickIcon,
  DeleteBinIcon,
  PlusRoundIcon,
  ThinArrowDownIcon,
} from '../../../assets/svg';
import { clearTransactionStatus } from '../../../redux/CommonStore';
import I18n from '../../../i18n/i18n';
import FormTextInput from '../../../components/FormTextInput';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import CustomButton from '../../../components/CustomButton';
import CustomInputFields from '../../../components/CustomInputFields';
import * as consts from '../../../services/constants';

const { width, height } = Dimensions.get('window');

const BuyScreen = ({ navigation, route }) => {
  const { allProducts, selectedProducts, locationAllowed, newFarmer } =
    route.params;
  const localPriceRef = useRef(null);
  const quantityRefs = useRef([]);
  const basePriceRefs = useRef([]);
  const manualPremiumRefs = useRef([]);

  const { userProjectDetails, userCompanyDetails } = useSelector(
    (state) => state.login,
  );
  const { theme } = useSelector((state) => state.common);
  const { currency } = userProjectDetails;
  const qualityCorrection = userProjectDetails.quality_correction;
  const appCustomFields = userCompanyDetails?.app_custom_fields
    ? stringToJson(userCompanyDetails.app_custom_fields)
    : null;
  const fieldVisibility = appCustomFields?.field_visibility?.buy_txn ?? null;

  const dispatch = useDispatch();
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
  const [currentOptions, setCurrentOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [productIndex, setProductIndex] = useState(null);
  const [premiumIndex, setPremiumIndex] = useState(null);
  const [currentPremiumName, setCurrentPremiumName] = useState(null);
  const [optionPremiumModal, setOptionPremiumModal] = useState(false);

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

    dispatch(clearTransactionStatus());

    if (locationAllowed) {
      fetchLocation();
    }

    let productPrices =
      (await AsyncStorage.getItem('product_base_prices')) || '{}';
    productPrices = JSON.parse(productPrices);

    const savedLocalPrice = await AsyncStorage.getItem('LocalPrice');
    if (savedLocalPrice !== null) {
      setLocalPrice(savedLocalPrice);
    } else {
      setLocalPrice('');
    }

    const existingManualPremiums = await fetchPremiumsByCalculationType(
      consts.PREMIUM_MANUAL,
    );

    const convertedManualPremiums = [];
    existingManualPremiums.map((prem) => {
      const newObj = {
        amount: '',
        applicable_activity: prem.applicable_activity,
        calculation_type: prem.calculation_type,
        category: prem.category,
        created_at: prem.created_at,
        id: prem.id,
        included_in_amt: prem.included_in_amt,
        is_active: prem.is_active,
        is_card_dependent: prem.is_card_dependent,
        name: prem.name,
        server_id: prem.server_id,
        type: prem.type,
        options: prem.options,
        updated_at: prem.updated_at,
      };
      convertedManualPremiums.push(newObj);
    });

    const existingSlabPremiums = await fetchPremiumsByCalculationType(
      consts.PREMIUM_OPTIONS,
    );

    const convertedSlabPremiums = [];
    existingSlabPremiums.map((prem) => {
      const updatedOptions = stringToJson(prem.options);
      const newObj = {
        amount: 0,
        applicable_activity: prem.applicable_activity,
        calculation_type: prem.calculation_type,
        category: prem.category,
        created_at: prem.created_at,
        id: prem.id,
        included_in_amt: prem.included_in_amt,
        is_active: prem.is_active,
        is_card_dependent: prem.is_card_dependent,
        name: prem.name,
        server_id: prem.server_id,
        type: prem.type,
        updated_at: prem.updated_at,
        options: updatedOptions,
        selected_option: null,
      };
      convertedSlabPremiums.push(newObj);
    });

    const convertedProjects = Array.from(allProducts);
    const allProd = convertedProjects.map((prod) => {
      prod.label = prod.name;
      prod.value = prod.id;
      prod.quantity = ''; // calculated
      prod.base_price = productPrices[prod.server_id] ?? ''; // base price entered
      prod.total_amount = ''; // base price * quantity
      prod.premium_total = ''; // total premium amount applied for this product
      prod.applied_premiums = []; // all premiums applied for this product
      prod.manual_premiums = convertedManualPremiums;
      prod.option_premiums = convertedSlabPremiums;
      prod.extra_fields =
        appCustomFields && Object.keys(appCustomFields).length > 0
          ? appCustomFields
          : null;
      return prod;
    });

    const firstProduct = allProd.filter((x) => {
      return x.id === selectedProducts[0].id;
    });

    if (firstProduct.length > 0) {
      setProducts(firstProduct);
      setActiveCollapse(firstProduct[0].id);
      validateData(firstProduct);
    } else {
      setProducts(allProd[0]);
      validateData(allProd[0]);
      setActiveCollapse(allProd[0].id);
    }

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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 },
    );
  };

  const calculateValues = async (products) => {
    products.map(async (product) => {
      const currentQuantity = product.quantity;

      if (currentQuantity && parseFloat(currentQuantity) > 0) {
        let initialValue = 0;
        if (product.base_price !== '' && currentQuantity !== '') {
          initialValue =
            parseFloat(product.base_price) * parseFloat(currentQuantity);
        }

        const productPremiums = await fetchAllPremiumsByProduct(
          product.server_id,
        );

        const manualPremiums = product.manual_premiums;
        const slabPremiums = product.option_premiums;
        const totalAppliedPremiums = [
          ...productPremiums,
          ...manualPremiums,
          ...slabPremiums,
        ];
        const sumAllPremiums = 0;
        const premiumsPerTransaction = 0;
        let premiumTotal = 0;
        const appliedPremiums = [];

        if (totalAppliedPremiums.length > 0) {
          await Promise.all(
            totalAppliedPremiums.map(async (premium) => {
              // checking premium is manual premium or not
              let premiumServerId = null;
              let existingPremium = null;

              if (
                premium?.calculation_type === consts.PREMIUM_MANUAL ||
                premium?.calculation_type === consts.PREMIUM_OPTIONS
              ) {
                existingPremium = premium;
              } else {
                premiumServerId = premium.premium_id;

                const existingPremiums = await searchPremiumByServerId(
                  premiumServerId,
                );

                if (existingPremiums.length > 0) {
                  [existingPremium] = existingPremiums;
                }
              }

              // checking premium exist
              if (existingPremium) {
                if (
                  existingPremium.applicable_activity ===
                  consts.PREMIUM_APPLICABLE_ACTIVITY_BUY
                ) {
                  const { amount } = existingPremium;
                  const premiumAmount = Math.round(currentQuantity * amount);
                  premiumTotal += premiumAmount;

                  existingPremium.total = premiumAmount;
                  appliedPremiums.push(existingPremium);
                }
                product.premium_total = premiumTotal;
              }
            }),
          );
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

        updateValues(products);
      } else {
        product.total_amount = 0;
        product.premium_total = 0;
        product.applied_premiums = [];

        updateValues(products);
      }
    });
  };

  /**
   * creating an alert message that card is already assigned
   * @param {Array} products updated product array
   */
  const updateValues = (products) => {
    setProducts((products) => products);
    calculatePremiums(products);
    validateData(products);
    setLoad(!load);
  };

  /**
   * setting quantity of each product based on the array index
   * @param {string}  quantity product quantity
   * @param {number}  orIndex  index of updated product in product array
   */
  const onChangeQuantity = (quantity, orIndex) => {
    let productQuantity = quantity.toString().replace(',', '.');

    if (productQuantity === '.') {
      productQuantity = '0.';
    }

    products[orIndex].quantity = productQuantity;
    calculateValues(products);
  };

  /**
   * setting quantity of each product based on the array index
   * @param {string}  price   product base price
   * @param {number}  orIndex index of updated product in product array
   */
  const onChangeBasePrice = (price, orIndex) => {
    let basePrice = price.toString().replace(',', '.');

    if (basePrice === '.') {
      basePrice = '0.';
    }

    if (parseInt(basePrice) > consts.MAX_BASE_PRICE) {
      Toast.show({
        type: 'error',
        text1: I18n.t('validation'),
        text2: `${I18n.t('max_base_price_is')} ${consts.MAX_BASE_PRICE}`,
      });
    } else {
      products[orIndex].base_price = basePrice;
      calculateValues(products);
    }
  };

  /**
   * setting local market price based on input
   * @param {string} price local market price
   */
  const onChangeLocalPrice = (price) => {
    let priceLocal = price.toString().replace(',', '.');

    if (priceLocal === '.') {
      priceLocal = '0.';
    }

    if (
      priceLocal !== '' &&
      parseInt(priceLocal) > consts.MAX_LOCAL_MARKET_PRICE
    ) {
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
   * @param {Array} products updated product array
   */
  const validateData = async (products) => {
    if (products.length === 0) {
      setValid(false);
      setLoad(!load);
      return;
    }

    let success = true;

    products.map((product) => {
      if (
        !product.quantity ||
        product.quantity === '' ||
        !product.base_price ||
        product.base_price === ''
      ) {
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
   * @returns {boolean} valid or not
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

      if (product?.manual_premiums) {
        product.manual_premiums.map((field) => {
          if (parseFloat(field.amount) === 0) {
            setError(
              `${field.name} of ${product.name} ${I18n.t('cannot_be_0')}.`,
            );
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

    const premiumUpdatedArr = await removeUnwantedPremiums(applicableProducts);

    if (!qualityCorrection) {
      await AsyncStorage.setItem('LocalPrice', localPrice);
    } // caching Local price

    const params = {
      products: premiumUpdatedArr,
      totalPrice,
      newFarmer: newFarmer ?? null,
      preLocation: location,
    };

    navigation.navigate('Verification', params);
  };

  /**
   * calculate and set premiums based on updated product array
   * @param {Array} products updated product array
   */
  const calculatePremiums = (products) => {
    const mainObj = {};
    products.map((product) => {
      product.applied_premiums.map((premium) => {
        const serverId = premium.server_id;
        if (mainObj[serverId]) {
          const obj = mainObj[serverId];
          let { total } = obj;
          total += premium.total;
          obj.total = total;
          mainObj[serverId] = obj;
        } else {
          const obj = {
            name: premium.name,
            total: premium.total,
          };
          mainObj[serverId] = obj;
        }
      });
    });

    const premiumCalculated = Object.values(mainObj);
    const filtered = premiumCalculated.filter((x) => {
      return x.total.toString() !== '0';
    });
    setTotalPremiums((totalPremiums) => filtered);
    calculateTotalPrice(products);
  };

  /**
   * calculate and set total price based on updated product array
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

    // total = Math.round(parseFloat(total));

    setTotalPrice(total);
  };

  /**
   * updating custom field values based on productId and index
   * @param {object}  item    updated custom fields object
   * @param {number}  index   index of updated product in product array
   * @param {Array}   itemId  updated product's itemId
   */
  const updateCustomData = (item, index, itemId) => {
    products.map((product) => {
      if (product.id === itemId) {
        if (
          product?.extra_fields?.custom_fields?.buy_txn_fields?.[index]?.key ===
          item.key
        ) {
          product.extra_fields.custom_fields.buy_txn_fields[index].value =
            item.value;

          validateData(products);
          setLoad(!load);
          setProducts((products) => products);
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
   * @param {object} item new product object
   */
  const addProduct = (item) => {
    const existingManual = [...item.manual_premiums];
    const existingSlab = [...item.option_premiums];

    const convertedManualPremiums = [];
    existingManual.map((prem) => {
      const newObj = {
        amount: '',
        applicable_activity: prem.applicable_activity,
        calculation_type: prem.calculation_type,
        category: prem.category,
        created_at: prem.created_at,
        id: prem.id,
        included_in_amt: prem.included_in_amt,
        is_active: prem.is_active,
        is_card_dependent: prem.is_card_dependent,
        name: prem.name,
        server_id: prem.server_id,
        type: prem.type,
        options: prem.options,
        updated_at: prem.updated_at,
      };
      convertedManualPremiums.push(newObj);
    });

    const convertedSlabPremiums = [];
    existingSlab.map((prem) => {
      const newObj = {
        amount: '',
        applicable_activity: prem.applicable_activity,
        calculation_type: prem.calculation_type,
        category: prem.category,
        created_at: prem.created_at,
        id: prem.id,
        included_in_amt: prem.included_in_amt,
        is_active: prem.is_active,
        is_card_dependent: prem.is_card_dependent,
        name: prem.name,
        server_id: prem.server_id,
        type: prem.type,
        updated_at: prem.updated_at,
        options: prem.options,
        selected_option: null,
      };
      convertedSlabPremiums.push(newObj);
    });

    item.quantity = '';
    item.base_price = basePrices[item.server_id] ?? '';
    item.total_amount = '';
    item.premium_total = '';
    item.applied_premiums = [];
    item.manual_premiums = convertedManualPremiums;
    item.option_premiums = convertedSlabPremiums;
    products.push(item);

    setActiveCollapse(item.id);
    setProducts((products) => products);
    updateValues(products);
    setProductModal(false);
  };

  const onChangeManualPremiumPrice = (text, productIndex, premiumIndex) => {
    let premiumPrice = text === '' ? '' : text.toString().replace(',', '.');

    if (premiumPrice === '.') {
      premiumPrice = '0.';
    }

    const updatedProducts = [...products]; // Create a copy of the products array
    const newArr = Array.from(updatedProducts);
    const updatedPremiums = [...newArr[productIndex].manual_premiums];
    const convertedPremiums = Array.from(updatedPremiums);
    convertedPremiums[premiumIndex].amount = premiumPrice;

    newArr[productIndex].manual_premiums = convertedPremiums;

    calculateValues(newArr);
  };

  const onChangeSlabPremiumPrice = (option, productIndex, premiumIndex) => {
    let premiumPrice = 0;
    if (option && option.amount) {
      premiumPrice = parseFloat(option.amount);
    }

    const updatedProducts = [...products]; // Create a copy of the products array
    const newArr = Array.from(updatedProducts);
    const updatedPremiums = [...newArr[productIndex].option_premiums];
    const convertedPremiums = Array.from(updatedPremiums);
    convertedPremiums[premiumIndex].amount = premiumPrice;
    convertedPremiums[premiumIndex].selected_option = option;
    newArr[productIndex].option_premiums = convertedPremiums;

    calculateValues(newArr);
  };

  /**
   * removing unwanted manual premium with zero value
   * @param   {Array} products Current product array
   * @returns {Array}           updated product array
   */
  const removeUnwantedPremiums = async (products) => {
    await Promise.all(
      products.map((p) => {
        const existingArray = p.applied_premiums;
        // return only manual premiums with value
        const updatedArr = existingArray.filter((x) => {
          return x.amount !== '' && x.amount !== 0;
        });

        p.applied_premiums = updatedArr;
      }),
    );

    return products;
  };

  /**
   * removing product from product array
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

  const openOptionPremiumModal = (
    item,
    productIndex,
    premiumIndex,
    selectedOption,
    name,
  ) => {
    if (item.options && item.options.length > 0) {
      setCurrentOptions(item.options);
      setSelectedOption(item.selected_option);
      setProductIndex(productIndex);
      setPremiumIndex(premiumIndex);
      setCurrentPremiumName(item.name);
      setOptionPremiumModal(true);
    } else {
      setError(`${I18n.t('no_options_found')}.`);
    }
  };

  const onSelectOption = (option, index, n) => {
    if (option) {
      onChangeSlabPremiumPrice(option, productIndex, premiumIndex);
      setProductIndex(null);
      setPremiumIndex(null);
      setCurrentPremiumName(null);
      setOptionPremiumModal(false);
    } else {
      onChangeSlabPremiumPrice(option, index, n);
      resetOptionPremiumModal();
    }
  };

  const resetOptionPremiumModal = () => {
    setSelectedOption(null);
    setProductIndex(null);
    setPremiumIndex(null);
    setCurrentPremiumName(null);
    setOptionPremiumModal(false);
  };

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        backgroundColor={theme.background_1}
        title={I18n.t('buy')}
        leftIcon="arrow-left"
        onPress={() => backNavigation()}
      />

      {loading && <ActivityIndicator size="small" color={theme.text_1} />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
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
                      fill={theme.icon_error}
                    />
                    <Text style={styles.removeText}>{I18n.t('remove')}</Text>
                  </TouchableOpacity>
                )}

                {activeCollapse !== item.id && allProducts.length > 1 && (
                  <ThinArrowDownIcon
                    width={width * 0.04}
                    height={width * 0.04}
                    fill="#7091A6"
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
                          ? theme.placeholder
                          : theme.icon_error,
                      },
                    ]}
                  >
                    {`${I18n.t('quantity')}: `}
                  </Text>
                  <Text style={styles.detailsText}>
                    {convertQuantity(item.quantity)}
                    {item.quantity ? 'kg' : ''}
                  </Text>
                  <Text style={styles.detailsText}> | </Text>
                  <Text
                    style={[
                      styles.detailsText,
                      {
                        color: item.base_price
                          ? theme.placeholder
                          : theme.icon_error,
                      },
                    ]}
                  >
                    {`${I18n.t('base_price')}: `}
                  </Text>
                  <Text style={styles.detailsText}>
                    {`${convertCurrency(item.base_price)} ${
                      item.base_price ? currency : ''
                    }`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Collapsible
              collapsed={activeCollapse !== item.id}
              // key={collapsibleKey}
              align="center"
              style={{ flex: 1, paddingBottom: 10 }}
            >
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
                  keyboardType="number-pad"
                  color={theme.text_1}
                  returnKeyType="next"
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
                  keyboardType="number-pad"
                  color={theme.text_1}
                  returnKeyType="next"
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
                    keyboardType="numeric"
                    color={theme.text_1}
                    extraStyle={{ width: '100%' }}
                  />
                )}

                {item.manual_premiums.map((i, n) => {
                  return (
                    <View
                      key={n.toString()}
                      style={{ width: '100%', alignSelf: 'center' }}
                    >
                      <FormTextInput
                        inputRef={(el) =>
                          (manualPremiumRefs.current[index] = el)
                        }
                        placeholder={`${i.name ?? 'NA'}`}
                        value={
                          i.amount === ''
                            ? ''
                            : i.amount.toLocaleString('id').replace('.', ',')
                        }
                        maxLength={10}
                        onChangeText={(text) =>
                          onChangeManualPremiumPrice(text, index, n)
                        }
                        keyboardType="number-pad"
                        color={theme.text_1}
                        extraStyle={{ width: '100%' }}
                      />

                      {i.amount !== '' && (
                        <TouchableOpacity
                          onPress={() =>
                            onChangeManualPremiumPrice('', index, n)
                          }
                          style={styles.resetWrap}
                          hitSlop={consts.HIT_SLOP_TEN}
                        >
                          <View style={{ marginTop: 2 }}>
                            <DeleteBinIcon
                              width={width * 0.04}
                              height={width * 0.04}
                              fill={theme.icon_error}
                            />
                          </View>
                          <Text style={styles.removeText}>
                            {I18n.t('remove')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                {item.option_premiums &&
                  item.option_premiums.map((i, n) => {
                    return (
                      <View key={n.toString()}>
                        <View style={styles.optionsTitleWrap}>
                          <Text style={styles.placeholderText}>{i.name}</Text>
                        </View>
                        <TouchableOpacity
                          key={n.toString()}
                          onPress={() =>
                            openOptionPremiumModal(i, index, n)
                          }
                          style={styles.optionPremiumWarp}
                          hitSlop={consts.HIT_SLOP_TEN}
                        >
                          <Text style={styles.optionPremiumText}>
                            {i?.selected_option?.name ??
                              '-- Select an option --'}
                          </Text>
                        </TouchableOpacity>

                        {i.selected_option !== null && (
                          <TouchableOpacity
                            onPress={() => onSelectOption(null, index, n)}
                            style={styles.resetOptionWrap}
                            hitSlop={consts.HIT_SLOP_TEN}
                          >
                            <View style={{ marginTop: 2 }}>
                              <DeleteBinIcon
                                width={width * 0.04}
                                height={width * 0.04}
                                fill={theme.icon_error}
                              />
                            </View>
                            <Text style={styles.removeText}>
                              {I18n.t('remove')}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}

                {/* custom fields */}
                {item?.extra_fields?.custom_fields?.buy_txn_fields && (
                  <>
                    {item.extra_fields.custom_fields.buy_txn_fields.map(
                      (i, n) => {
                        return (
                          <CustomInputFields
                            key={n.toString()}
                            itemId={item.id}
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
          >
            <Text style={styles.addText}>
              {initialProducts.length > 0 &&
              initialProducts.length === products.length
                ? I18n.t('all_products_added')
                : I18n.t('add_another_product')}
            </Text>

            {initialProducts.length > 0 &&
            initialProducts.length === products.length ? null : (
              <PlusRoundIcon
                width={width * 0.05}
                height={width * 0.05}
                fill="#4DCAF4"
              />
            )}
          </TouchableOpacity>
        )}

        {valid && products.length > 0 && (
          <View style={[styles.cardContainer]}>
            {products.map((item, index) => {
              return (
                <View key={index.toString()} style={styles.basePriceWrap}>
                  <View style={{ width: '70%' }}>
                    <Text style={styles.cardLeftItem}>
                      {`${I18n.t('base_price_for')} ${convertQuantity(
                        item.quantity,
                      )} Kg ${item.name} :`}
                    </Text>
                  </View>
                  <View style={{ width: '30%' }}>
                    <Text style={styles.cardRightItem}>
                      {`${convertCurrency(item.total_amount)} ${currency}`}
                    </Text>
                  </View>
                </View>
              );
            })}

            {totalPremiums.map((item, index) => (
              <View key={index.toString()} style={styles.premiumWrap}>
                <View style={{ width: '70%' }}>
                  <Text style={styles.cardLeftItem}>{item.name}</Text>
                </View>
                <View style={{ width: '30%' }}>
                  <Text style={styles.cardRightItem}>
                    {`${convertCurrency(item.total)} ${currency}`}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.dottedLine} />

            <View style={styles.totalWrap}>
              <View style={{ width: '30%' }}>
                <Text style={styles.totalText}>
                  {`${I18n.t('total').toUpperCase()}:`}
                </Text>
              </View>
              <View style={{ width: '70%' }}>
                <Text style={styles.totalValue}>
                  {`${convertCurrency(totalPrice)} ${currency}`}
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
          theme={theme}
        />
      )}

      {optionPremiumModal && (
        <PremiumOptionsModal
          visible={optionPremiumModal}
          options={currentOptions}
          selectedOption={selectedOption}
          hideModal={() => resetOptionPremiumModal()}
          onSelectOption={onSelectOption}
          currentPremiumName={currentPremiumName}
          currency={currency}
          theme={theme}
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
  theme,
}) => {
  const getIsSelected = (id) => {
    const isExist = products.filter((x) => {
      return x.id === id;
    });
    return isExist.length > 0;
  };

  const styles = StyleSheetFactory(theme);

  return (
    <Modal
      animationType="fade"
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
                fill="#4DCAF4"
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
};

const PremiumOptionsModal = ({
  visible,
  options = [],
  hideModal,
  selectedOption,
  onSelectOption,
  currentPremiumName,
  currency,
  theme,
}) => {
  const getIsSelected = (id) => {
    if (selectedOption && selectedOption.id === id) {
      return true;
    }

    return false;
  };

  const styles = StyleSheetFactory(theme);

  return (
    <Modal
      animationType="fade"
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
          <Text style={styles.modalTitle}>{currentPremiumName}</Text>
        </View>

        {options.map((item, index) => (
          <TouchableOpacity
            key={index.toString()}
            onPress={() => onSelectOption(item)}
            style={styles.modalItemWrap}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.modalItem}>{`${item.name}: `}</Text>
              <Text style={styles.modalItem2}>
                {`${item.amount} ${currency} (per Kg)`}
              </Text>
            </View>

            {getIsSelected(item.id) && (
              <BlueRoundTickIcon width={width * 0.055} height={width * 0.055} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
      paddingHorizontal: width * 0.05,
    },
    productWrap: {
      borderColor: theme.placeholder,
      borderWidth: 1,
      borderRadius: theme.border_radius,
      marginTop: height * 0.02,
    },
    fieldTitle: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 16,
    },
    removeText: {
      color: theme.icon_error,
      fontFamily: theme.font_medium,
      fontSize: 14,
      paddingLeft: width * 0.01,
    },
    detailsText: {
      color: theme.placeholder,
      fontFamily: theme.font_medium,
      fontSize: 12,
      marginTop: height * 0.005,
    },
    topWrap: {
      padding: width * 0.04,
      borderRadius: theme.border_radius,
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
      borderRadius: theme.border_radius,
      padding: width * 0.035,
      marginVertical: height * 0.02,
    },
    addText: {
      color: '#4DCAF4',
      fontFamily: theme.font_regular,
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
    modalItemWrap: {
      padding: width * 0.035,
      marginBottom: height * 0.015,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderColor: theme.border_1,
      borderWidth: 1,
      borderRadius: theme.border_radius,
    },
    modalItem: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    modalItem2: {
      color: theme.text_2,
      fontSize: 14,
      fontFamily: theme.font_regular,
    },
    modalTitle: {
      color: theme.text_1,
      fontSize: 17,
      fontFamily: theme.font_medium,
      fontWeight: '500',
      marginTop: 15,
    },
    errorMessage: {
      fontSize: 14,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      marginHorizontal: 30,
      color: theme.button_bg_1,
    },
    cardContainer: {
      marginVertical: 30,
      padding: 10,
      backgroundColor: theme.background_2,
    },
    cardLeftItem: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 14,
      color: theme.text_1,
      opacity: 0.7,
      letterSpacing: 0.2,
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 13,
      color: theme.text_1,
      textAlign: 'right',
    },
    totalText: {
      fontFamily: theme.font_bold,
      fontStyle: 'normal',
      fontSize: 20,
      color: theme.text_1,
      opacity: 0.7,
      letterSpacing: 0.2,
    },
    totalValue: {
      fontFamily: theme.font_bold,
      fontStyle: 'normal',
      fontSize: 20,
      color: theme.text_1,
      textAlign: 'right',
    },
    dottedLine: {
      borderStyle: 'dotted',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      borderColor: theme.text_2,
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
      marginBottom: 10,
    },
    totalWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
    },
    buttonWrap: {
      justifyContent: 'flex-end',
      marginBottom: 20,
    },
    resetWrap: {
      position: 'absolute',
      top: 25,
      right: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
    resetOptionWrap: {
      position: 'absolute',
      top: 15,
      right: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionPremiumWarp: {
      height: 53,
      width: '100%',
      alignSelf: 'center',
      justifyContent: 'center',
      borderRadius: theme.border_radius,
      borderColor: theme.placeholder,
      borderWidth: 1,
      marginBottom: 20,
      paddingLeft: 15,
    },
    optionPremiumText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    optionsTitleWrap: {
      zIndex: 99,
      position: 'absolute',
      top: -8,
      left: 8,
    },
    placeholderText: {
      color: theme.placeholder,
      backgroundColor: theme.background_1,
      fontSize: 12,
      fontFamily: theme.font_regular,
      letterSpacing: 0.4,
      paddingHorizontal: 3,
    },
  });
};

export default BuyScreen;
