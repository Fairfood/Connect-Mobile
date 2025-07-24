/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Collapsible from 'react-native-collapsible';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';
import {
  NumberFormatter,
  getCurrency,
} from '../../../../utils/commonFunctions';
import { stringToJson } from '../../../../utils/helperFunctions';
import {
  fetchPremiumsByCalculationType,
  searchPremiumByServerId,
} from '../../../../db/services/PremiumsHelper';
import { fetchAllPremiumsByProduct } from '../../../../db/services/ProductPremiumHelper';
import {
  BlueRoundTickIcon,
  DeleteBinIcon,
  PlusRoundIcon,
  ThinArrowDownIcon,
} from '../../../../assets/svg';
import { clearTransactionStatus } from '../../../../redux/CommonStore';
import { fieldLabel, fieldVisibility } from './controller';
import I18n from '../../../../translations/text/i18n';
import FormTextInput from '../../../../components/inputs/formTextInput';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import CustomButton from '../../../../components/buttons/customButton';
import CustomInputFields from '../../../../components/inputs/customInputFields';
import {
  CURRENCY_FORMAT,
  FORM_TYPE_PRODUCT,
  FORM_TYPE_TRANSACTION,
  HIT_SLOP_TEN,
  HIT_SLOP_TWENTY,
  MAX_BASE_PRICE,
  MAX_LOCAL_MARKET_PRICE,
  MAXIMUM_TRANSACTION_QUANTITY,
  MINIMUM_TRANSACTION_QUANTITY,
  NUMBER_REGEX,
  PREMIUM_APPLICABLE_ACTIVITY_BUY,
  PREMIUM_MANUAL,
  PREMIUM_OPTIONS,
  PREMIUM_RANGE,
} from '../../../../utils/constants';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');

const BuyScreen = ({ navigation, route }) => {
  const { allProducts, selectedProducts, locationAllowed, newFarmer } =
    route.params;
  const localPriceRef = useRef([]);
  const quantityRefs = useRef([]);
  const basePriceRefs = useRef([]);
  const manualPremiumRefs = useRef([]);
  const rangePremiumRefs = useRef([]);
  const formFieldRefs = useRef([]);
  const styles = StyleSheetFactory();

  const { userCompanyDetails } = useSelector((state) => state.login);
  const qualityCorrection = userCompanyDetails.quality_correction;
  const { theme, currencyFormat } = useSelector((state) => state.common);
  const { decimalSeparator } = currencyFormat;

  const dispatch = useDispatch();
  const [load, setLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const [products, setProducts] = useState([]);
  const [initialProducts, setInitialProducts] = useState([]);
  const [totalPremiums, setTotalPremiums] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState('');
  const [optionError, setOptionError] = useState('');
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
  const [commonCustomFields, setCommonCustomFields] = useState([]);

  useEffect(() => {
    setupInitialValues();
  }, []);

  /**
   * setting up initial product values
   */
  const setupInitialValues = async () => {
    setLoading(true);
    setError('');
    setOptionError('');

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
      PREMIUM_MANUAL,
    );

    const convertedManualPremiums = existingManualPremiums.map((prem) => ({
      ...prem,
      amount: '',
    }));

    const existingSlabPremiums = await fetchPremiumsByCalculationType(
      PREMIUM_OPTIONS,
    );

    const convertedSlabPremiums = existingSlabPremiums.map((prem) => {
      const { options = [], ...rest } = prem;
      const updatedOptions = stringToJson(options) || [];
      let selectedOption = null;
      if (updatedOptions.length) {
        [selectedOption] = updatedOptions;
      }

      return {
        ...rest,
        amount: parseFloat(selectedOption?.amount ?? 0),
        selected_option: selectedOption,
        options: updatedOptions,
      };
    });

    const existingRangePremiums = await fetchPremiumsByCalculationType(
      PREMIUM_RANGE,
    );

    const convertedRangePremiums = existingRangePremiums.map((prem) => {
      const { options = [], ...rest } = prem;
      const selectedOption = stringToJson(options) || [];
      return {
        ...rest,
        amount: 0,
        value: '',
        selected_option: null,
        options: selectedOption,
      };
    });

    const forms = userCompanyDetails?.forms ?? [];
    let productForm = [];
    if (forms.length > 0) {
      productForm = forms.filter((x) => {
        return x.form_type === FORM_TYPE_PRODUCT;
      });
    }

    if (forms.length > 0) {
      const transactionForm = forms.filter((x) => {
        return x.form_type === FORM_TYPE_TRANSACTION;
      });

      setCommonCustomFields(transactionForm);
    }

    const allProd = allProducts.map((prod) => {
      prod.label = prod.name;
      prod.value = prod.id;
      prod.quantity = ''; // calculated
      prod.base_price = productPrices[prod.server_id] ?? ''; // base price entered
      prod.total_amount = ''; // base price * quantity
      prod.premium_total = ''; // total premium amount applied for this product
      prod.applied_premiums = []; // all premiums applied for this product
      prod.manual_premiums = convertedManualPremiums;
      prod.option_premiums = convertedSlabPremiums;
      prod.range_premiums = convertedRangePremiums;
      if (productForm.length > 0) {
        const productFound = productForm[0].products.find(
          (x) => x?.id === prod.server_id,
        );
        if (productFound) {
          prod.product_form = productForm;
        }
      }

      return prod;
    });

    const firstProduct = allProd.filter((x) => {
      return x.id === selectedProducts[0].id;
    });

    if (firstProduct.length > 0) {
      setProducts(firstProduct);
      setTimeout(() => {
        setActiveCollapse(firstProduct[0].id);
      }, 100);
      validateData(firstProduct);
    } else {
      setProducts(allProd[0]);
      setTimeout(() => {
        setActiveCollapse(allProd[0].id);
      }, 100);
      validateData(allProd[0]);
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
        const rangePremiums = product.range_premiums;
        const totalAppliedPremiums = [
          ...productPremiums,
          ...manualPremiums,
          ...slabPremiums,
          ...rangePremiums,
        ];
        const sumAllPremiums = 0;
        const premiumsPerTransaction = 0;
        let premiumTotal = 0;
        const appliedPremiums = [];

        if (totalAppliedPremiums.length > 0) {
          await Promise.all(
            totalAppliedPremiums.map(async (premium) => {
              /**
               * checking premium calculation_type
               * if not normal premium,here have full premium details
               * if normal premium, have to fetch full details from db.
               */
              let premiumServerId = null;
              let existingPremium = null;

              if (
                premium?.calculation_type === PREMIUM_MANUAL ||
                premium?.calculation_type === PREMIUM_OPTIONS ||
                premium?.calculation_type === PREMIUM_RANGE
              ) {
                existingPremium = premium;
              } else {
                premiumServerId = premium.premium_id;

                const existingPremiums = await searchPremiumByServerId(
                  premiumServerId,
                );

                if (existingPremiums.length > 0) {
                  [existingPremium] = existingPremiums;
                  existingPremium.amount = existingPremium.amount_corrected;
                }
              }

              // checking premium exist
              if (existingPremium) {
                if (
                  existingPremium.applicable_activity ===
                  PREMIUM_APPLICABLE_ACTIVITY_BUY
                ) {
                  const { amount } = existingPremium;
                  const premiumAmount = currentQuantity * amount;
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

  const getFieldValue = (value) => {
    return NumberFormatter.numberToFormat(
      value,
      decimalSeparator === '.'
        ? CURRENCY_FORMAT.EMPTY_DOT
        : CURRENCY_FORMAT.EMPTY_COMA,
    );
  };

  /**
   * setting quantity of each product based on the array index
   * @param {string}  quantity product quantity
   * @param {number}  orIndex  index of updated product in product array
   */
  const onChangeQuantity = (quantity, orIndex) => {
    let productQuantity = NumberFormatter.formatToNumber(
      quantity,
      decimalSeparator === '.'
        ? CURRENCY_FORMAT.EMPTY_DOT
        : CURRENCY_FORMAT.EMPTY_COMA,
    );

    if (!NUMBER_REGEX.test(productQuantity)) {
      return;
    }

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
    if (price !== '') {
      let basePrice = NumberFormatter.formatToNumber(
        price,
        decimalSeparator === '.'
          ? CURRENCY_FORMAT.EMPTY_DOT
          : CURRENCY_FORMAT.EMPTY_COMA,
      );

      if (!NUMBER_REGEX.test(basePrice)) {
        return;
      }

      if (basePrice === '.') {
        basePrice = '0.';
      }

      if (parseInt(basePrice) > MAX_BASE_PRICE) {
        Toast.show({
          type: 'error',
          text1: I18n.t('validation'),
          text2: `${I18n.t('max_base_price_is')} ${MAX_BASE_PRICE}`,
        });
        return;
      }

      products[orIndex].base_price = basePrice;
      calculateValues(products);
    } else {
      products[orIndex].base_price = price;
      calculateValues(products);
    }
  };

  /**
   * setting local market price based on input
   * @param {string} price local market price
   */
  const onChangeLocalPrice = (price) => {
    let priceLocal = NumberFormatter.formatToNumber(
      price,
      decimalSeparator === '.'
        ? CURRENCY_FORMAT.EMPTY_DOT
        : CURRENCY_FORMAT.EMPTY_COMA,
    );

    if (!NUMBER_REGEX.test(priceLocal)) {
      return;
    }

    if (priceLocal === '.') {
      priceLocal = '0.';
    }

    if (priceLocal !== '' && parseInt(priceLocal) > MAX_LOCAL_MARKET_PRICE) {
      setError(
        `${I18n.t('max_local_market_price_is')} ${MAX_LOCAL_MARKET_PRICE}`,
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
   * @param   {string} type function calling type
   * @returns {boolean}     valid or not
   */
  const validateSubmit = async (type = null) => {
    if (products.length === 0) {
      setLoad(!load);
      return false;
    }

    if (optionError) {
      return false;
    }

    let valid = true;

    products.forEach((product) => {
      if (!product.quantity) {
        setError(
          `${product.name} - ${fieldLabel(product, 'quantity')} ${I18n.t(
            'required',
          )}.`,
        );

        valid = false;
        return;
      }

      if (!product.base_price) {
        setError(
          `${product.name} - ${fieldLabel(product, 'base_price')} ${I18n.t(
            'required',
          )}.`,
        );
        valid = false;
        return;
      }

      if (parseFloat(product.base_price) <= 0) {
        setError(
          `${product.name} - ${fieldLabel(product, 'base_price')} ${I18n.t(
            'cannot_be_0',
          )}.`,
        );
        valid = false;
        return;
      }

      const enteredQuantity = parseFloat(product.quantity);

      if (enteredQuantity <= MINIMUM_TRANSACTION_QUANTITY) {
        setError(
          `${product.name} - ${fieldLabel(product, 'quantity')} ${I18n.t(
            'must_be_greater_than',
          )} ${MINIMUM_TRANSACTION_QUANTITY}Kg.`,
        );
        valid = false;
        return;
      }

      if (enteredQuantity >= MAXIMUM_TRANSACTION_QUANTITY) {
        setError(
          `${product.name} - ${fieldLabel(product, 'quantity')} ${I18n.t(
            'must_be_lower_than',
          )} ${MAXIMUM_TRANSACTION_QUANTITY}Kg.`,
        );
        valid = false;
        return;
      }

      // checking custom form values
      if (type && type === 'confirm_buy') {
        // checking product form values
        if (product?.product_form?.[0]?.fields.length > 0) {
          product.product_form[0].fields.forEach((field) => {
            if (
              field.required === true &&
              (field.value == null ||
                field.value === undefined ||
                field.value === '')
            ) {
              setError(`${field.label || field.key} ${I18n.t('required')}`);
              valid = false;
            }
          });
        }

        // checking transaction form values
        if (commonCustomFields?.[0]?.fields.length > 0) {
          commonCustomFields[0].fields.forEach((field) => {
            if (
              field.required === true &&
              (field.value == null ||
                field.value === undefined ||
                field.value === '')
            ) {
              setError(`${field.label || field.key} ${I18n.t('required')}`);
              valid = false;
            }
          });
        }

        // checking manual premium
        if (product?.manual_premiums) {
          product.manual_premiums.forEach((field) => {
            if (parseFloat(field.amount) === 0) {
              setError(
                `${product.name} - ${field.name} ${I18n.t('cannot_be_0')}.`,
              );
              valid = false;
            }
          });
        }

        // checking range premium
        if (product?.range_premiums) {
          product.range_premiums.forEach((field) => {
            if (field.value !== '' && !field.selected_option) {
              setOptionError(
                `${product.name} - ${I18n.t('value_of')} ${field.name} ${I18n.t(
                  'is_out_of_range',
                )}`,
              );
              valid = false;
            }
          });
        }
      }
    });

    if (valid) {
      setError('');
      setOptionError('');
    }
    setLoad(!load);
    return valid;
  };

  /**
   * calculate and set premiums based on updated product array
   * @param {Array} products updated product array
   */
  const calculatePremiums = (products) => {
    const mainObj = {};
    products.forEach((product) => {
      product.applied_premiums.forEach((premium) => {
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
    const total = products.reduce((acc, product) => {
      if (
        product.quantity === '' ||
        product.base_price === '' ||
        product.total_amount === '' ||
        product.premium_total === ''
      ) {
        return acc;
      }
      return (
        acc +
        parseFloat(product.total_amount) +
        parseFloat(product.premium_total)
      );
    }, 0);

    setTotalPrice(total);
  };

  /**
   * updating custom field values based on productId and index
   * @param {object}  item    updated custom fields object
   * @param {Array}   productId  updated product's id
   * @param {Array}   formId  updated from's id
   */
  const updateCustomData = (item, productId, formId) => {
    const updatedProducts = products.map((product) => {
      if (product.id === productId) {
        const updatedProductForm = product.product_form.map((form) => {
          if (form.id === formId) {
            const updatedFields = form.fields.map((field) => {
              if (field.id === item.id) {
                return {
                  ...field,
                  value: item.value,
                };
              }
              return field;
            });

            return {
              ...form,
              fields: updatedFields,
            };
          }
          return form;
        });

        return {
          ...product,
          product_form: updatedProductForm,
        };
      }
      return product;
    });

    validateData(updatedProducts);
    setProducts((products) => updatedProducts);
    setLoad(!load);
  };

  /**
   * updating custom field values based on productId and index
   * @param {object}  item    updated custom fields object
   */
  const updateCommonCustomData = (item) => {
    const fieldCopy = [...commonCustomFields];
    const updatedArr = fieldCopy.map((i) => {
      const updatedFields = i.fields.map((field) => {
        if (field.id === item.id) {
          return {
            ...field,
            value: item.value,
          };
        }
        return field;
      });

      return {
        ...i,
        fields: updatedFields,
      };
    });

    setCommonCustomFields((commonCustomFields) => updatedArr);
    setLoad(!load);
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
    setActiveCollapse((prevKey) => (prevKey === key ? null : key));
  };

  /**
   * adding products to current product array
   * @param {object} item new product object
   */
  const addProduct = (item) => {
    const existingManual = [...item.manual_premiums];
    const existingSlab = [...item.option_premiums];
    const existingRange = [...item.range_premiums];

    const convertedManualPremiums = existingManual.map((prem) => ({
      ...prem,
      amount: '',
    }));

    const convertedSlabPremiums = existingSlab.map((prem) => {
      const { options = [], ...rest } = prem;
      let selectedOption = null;
      if (options.length) {
        [selectedOption] = options;
      }

      return {
        ...rest,
        amount: parseFloat(selectedOption?.amount ?? 0),
        selected_option: selectedOption,
        options,
      };
    });

    const convertedRange = existingRange.map((prem) => {
      const { options = [], ...rest } = prem;

      return {
        ...rest,
        amount: '',
        value: '',
        selected_option: null,
        options,
      };
    });

    item.quantity = '';
    item.base_price = basePrices[item.server_id] ?? '';
    item.total_amount = '';
    item.premium_total = '';
    item.applied_premiums = [];
    item.manual_premiums = convertedManualPremiums;
    item.option_premiums = convertedSlabPremiums;
    item.range_premiums = convertedRange;
    products.push(item);

    setProducts((products) => products);
    setTimeout(() => {
      setActiveCollapse(item.id);
    }, 100);
    updateValues(products);
    setProductModal(false);
  };

  const onChangeManualPremiumPrice = (text, productIndex, premiumIndex) => {
    let premiumPrice =
      text === ''
        ? ''
        : NumberFormatter.formatToNumber(
            text,
            decimalSeparator === '.'
              ? CURRENCY_FORMAT.EMPTY_DOT
              : CURRENCY_FORMAT.EMPTY_COMA,
          );

    if (!NUMBER_REGEX.test(premiumPrice)) {
      return;
    }

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

  const onChangeRangePremiumPrice = async (
    text,
    options,
    productIndex,
    premiumIndex,
  ) => {
    let premiumPrice = 0;
    let option = null;
    let premiumRangeValue =
      text === ''
        ? ''
        : NumberFormatter.formatToNumber(
            text,
            decimalSeparator === '.'
              ? CURRENCY_FORMAT.EMPTY_DOT
              : CURRENCY_FORMAT.EMPTY_COMA,
          );

    if (!NUMBER_REGEX.test(premiumRangeValue)) {
      return;
    }

    if (premiumRangeValue === '.') {
      premiumRangeValue = '0.';
    }

    if (premiumRangeValue !== '') {
      option = options.find(
        (x) =>
          parseFloat(premiumRangeValue) >= parseFloat(x.range_from) &&
          parseFloat(premiumRangeValue) <= parseFloat(x.range_to),
      );

      if (option && option.amount) {
        premiumPrice = parseFloat(option.amount);
        setOptionError('');
      } else {
        setOptionError(
          `${products[productIndex].name} - ${I18n.t('value_of')} ${
            products[productIndex].range_premiums[premiumIndex].name
          } ${I18n.t('is_out_of_range')}`,
        );
      }
    } else {
      setOptionError('');
    }

    const updatedProducts = [...products]; // Create a copy of the products array
    const newArr = Array.from(updatedProducts);
    const updatedPremiums = [...newArr[productIndex].range_premiums];
    const convertedPremiums = Array.from(updatedPremiums);
    convertedPremiums[premiumIndex].value = premiumRangeValue;
    convertedPremiums[premiumIndex].amount = premiumPrice;
    convertedPremiums[premiumIndex].selected_option = premiumRangeValue;
    newArr[productIndex].range_premiums = convertedPremiums;

    calculateValues(newArr);
  };

  const openOptionPremiumModal = (item, productIndex, premiumIndex) => {
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
   * adding common custom fields to each products
   * @param   {Array} products Current product array
   * @returns {Array}           updated product array
   */
  const addCommonCustomFields = async (products) => {
    if (commonCustomFields.length === 0) {
      return products;
    }

    await Promise.all(
      products.map((p) => {
        p.transaction_form = commonCustomFields;
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

  /**
   * caching base prices and local market price
   */
  const cachePrices = async () => {
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

    // caching Local price
    if (!qualityCorrection) {
      await AsyncStorage.setItem('LocalPrice', localPrice);
    }
  };

  /**
   * submit function
   */
  const confirmBuy = async () => {
    const fieldsValid = await validateSubmit('confirm_buy');
    if (!fieldsValid) {
      return;
    }

    setError('');
    setOptionError('');
    await cachePrices();

    const premiumUpdatedArr = await removeUnwantedPremiums(products);
    const commonCustomFieldsArr = await addCommonCustomFields(
      premiumUpdatedArr,
    );

    if (commonCustomFieldsArr.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No product found.',
        text2: I18n.t('something_went_wrong'),
      });
      return;
    }

    const params = {
      products: commonCustomFieldsArr,
      totalPrice,
      newFarmer: newFarmer ?? null,
      preLocation: location,
    };

    navigation.navigate('Verification', params);
  };

  const onSubmitQuantity = (productIndex) => {
    if (basePriceRefs?.current?.[productIndex]) {
      basePriceRefs.current[productIndex].focus();
    } else {
      onSubmitBasePrice();
    }
  };

  const onSubmitBasePrice = (productIndex) => {
    if (!qualityCorrection && localPriceRef?.current?.[productIndex]) {
      localPriceRef.current[productIndex].focus();
    } else {
      onSubmitManualPremium(productIndex);
    }
  };

  const onSubmitLocalPrice = (productIndex) => {
    onSubmitManualPremium(productIndex);
  };

  const onSubmitManualPremium = (productIndex, premiumIndex = -1) => {
    if (manualPremiumRefs?.current?.[`${productIndex}_${premiumIndex + 1}`]) {
      manualPremiumRefs.current[`${productIndex}_${premiumIndex + 1}`].focus();
    } else {
      onSubmitRangePremium(productIndex);
    }
  };

  const onSubmitRangePremium = (
    productIndex,
    premiumIndex = -1,
    productForm = [],
  ) => {
    if (rangePremiumRefs?.current?.[`${productIndex}_${premiumIndex + 1}`]) {
      rangePremiumRefs.current[`${productIndex}_${premiumIndex + 1}`].focus();
    } else if (productForm?.[0]?.fields && productForm[0].fields.length > 0) {
      onSubmitProductForm(
        productIndex,
        -1,
        productForm[0].fields,
        productForm[0].fields[0].type,
      );
    } else {
      onSubmitToNextProduct(productIndex);
    }
  };

  const onSubmitProductForm = (
    productIndex,
    fieldIndex,
    formFields,
    fieldType,
  ) => {
    const typeArr = ['TEXT', 'NUMBER', 'PHONE', 'INTEGER', 'FLOAT', 'EMAIL'];
    for (let i = fieldIndex; i <= formFields.length; i++) {
      if (i === formFields.length) {
        onSubmitToNextProduct(productIndex);
        break;
      } else if (
        typeArr.includes(fieldType) &&
        formFieldRefs?.current?.[`${productIndex}_${i + 1}`]
      ) {
        formFieldRefs?.current?.[`${productIndex}_${i + 1}`].focus();
        break;
      }
    }
  };

  const onSubmitToNextProduct = (productIndex) => {
    if (quantityRefs?.current?.[productIndex + 1]) {
      quantityRefs.current[productIndex + 1].focus();
      if (products?.[productIndex + 1]?.id) {
        toggleExpanded(products?.[productIndex + 1]?.id);
      }
    } else {
      Keyboard.dismiss();
    }
  };

  const onRefresh = async () => {
    if (commonCustomFields.length > 0) {
      setLoading(true);

      const copiedField = JSON.parse(JSON.stringify(commonCustomFields));

      await Promise.all(
        copiedField.map((x) => {
          x.value = null;
        }),
      );
      setCommonCustomFields((commonCustomFields) => copiedField);
      setLoading(false);
      setLoad(!load);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="buy-scroll-view">
      <CustomLeftHeader
        title={I18n.t('buy')}
        onPress={() => navigation.goBack(null)}
        testID="buy-screen-header-text"
      />

      {loading && <ActivityIndicator size="small" color={theme.text_1} />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingTop: 5 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
      >
        {/* common custom fields */}
        {!loading && commonCustomFields?.[0]?.fields && (
          <>
            {commonCustomFields[0].fields.map((i, n) => {
              return (
                <CustomInputFields
                  key={n.toString()}
                  fieldItem={i}
                  formId={commonCustomFields[0].id}
                  updatedItem={updateCommonCustomData}
                />
              );
            })}
          </>
        )}

        {products.map((item, index) => (
          <View key={index.toString()} style={styles.productWrap}>
            <TouchableOpacity
              hitSlop={HIT_SLOP_TWENTY}
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
                <Text
                  style={styles.fieldTitle}
                  testID={`product-header-${item.name}`}
                >
                  {item.name}
                </Text>
                {activeCollapse === item.id && allProducts.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeProduct(item.id)}
                    style={styles.detailsWrap}
                    hitSlop={HIT_SLOP_TEN}
                    testID={`remove-button-${item.name}`}
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
                    {`${fieldLabel(item, 'quantity')}: `}
                  </Text>
                  <Text style={styles.detailsText}>
                    {NumberFormatter.quantity(item.quantity, true)}
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
                    {`${fieldLabel(item, 'base_price')}: `}
                  </Text>
                  <Text style={styles.detailsText}>
                    {NumberFormatter.currency(item.base_price, true)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Collapsible
              collapsed={activeCollapse !== item.id}
              align="center"
              style={{ flex: 1, paddingBottom: 10 }}
            >
              <View key={index.toString()} style={styles.bottomWrap}>
                <FormTextInput
                  inputRef={(el) => (quantityRefs.current[index] = el)}
                  mandatory
                  placeholder={`${fieldLabel(item, 'quantity')} (kg)`}
                  value={getFieldValue(item.quantity)}
                  onChangeText={(text) => onChangeQuantity(text, index)}
                  keyboardType="number-pad"
                  color={theme.text_1}
                  returnKeyType="next"
                  onSubmitEditing={() => onSubmitQuantity(index)}
                  blurOnSubmit={false}
                  extraStyle={{ width: '100%' }}
                  testID={`field-quantity-${item.name}`}
                />

                <FormTextInput
                  inputRef={(el) => (basePriceRefs.current[index] = el)}
                  mandatory
                  placeholder={`${fieldLabel(
                    item,
                    'base_price',
                  )} (${getCurrency('code')})`}
                  value={getFieldValue(item.base_price)}
                  maxLength={10}
                  onChangeText={(text) => onChangeBasePrice(text, index)}
                  visibility={fieldVisibility(item, 'base_price')}
                  keyboardType="number-pad"
                  color={theme.text_1}
                  returnKeyType="next"
                  onSubmitEditing={() => onSubmitBasePrice(index)}
                  blurOnSubmit={false}
                  extraStyle={{ width: '100%' }}
                  testID={`field-base-price-${item.name}`}
                />

                {!qualityCorrection && (
                  <FormTextInput
                    placeholder={`${fieldLabel(
                      item,
                      'market_price',
                    )} (${getCurrency('code')})`}
                    value={getFieldValue(localPrice)}
                    inputRef={(el) => (localPriceRef.current[index] = el)}
                    maxLength={10}
                    onChangeText={(text) => onChangeLocalPrice(text)}
                    onSubmitEditing={() => onSubmitLocalPrice(index)}
                    returnKeyType="next"
                    visibility={fieldVisibility(item, 'market_price')}
                    keyboardType="numeric"
                    color={theme.text_1}
                    extraStyle={{ width: '100%' }}
                    testID={`field-market-price-${item.name}`}
                  />
                )}

                {item.manual_premiums &&
                  item.manual_premiums.map((i, n) => {
                    return (
                      <View
                        key={n.toString()}
                        style={{ width: '100%', alignSelf: 'center' }}
                      >
                        <FormTextInput
                          inputRef={(el) =>
                            (manualPremiumRefs.current[`${index}_${n}`] = el)
                          }
                          placeholder={i.label || i.name}
                          value={getFieldValue(i.amount)}
                          maxLength={10}
                          onChangeText={(text) =>
                            onChangeManualPremiumPrice(text, index, n)
                          }
                          onSubmitEditing={() =>
                            onSubmitManualPremium(index, n)
                          }
                          keyboardType="number-pad"
                          color={theme.text_1}
                          extraStyle={{ width: '100%' }}
                          testID={`manual-premium-${i.name}`}
                        />

                        {i.amount !== '' && (
                          <TouchableOpacity
                            onPress={() =>
                              onChangeManualPremiumPrice('', index, n)
                            }
                            style={styles.resetWrap}
                            hitSlop={HIT_SLOP_TEN}
                            testID={`manual-premium-remove-${i.name}`}
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
                      <View
                        key={n.toString()}
                        testID={`option-premium-${i.name}`}
                      >
                        <View style={styles.optionsTitleWrap}>
                          <Text style={styles.placeholderText}>
                            {i.label || i.name || 'NA'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          key={n.toString()}
                          onPress={() => openOptionPremiumModal(i, index, n)}
                          style={styles.optionPremiumWarp}
                          hitSlop={HIT_SLOP_TEN}
                        >
                          <Text
                            style={styles.optionPremiumText}
                            testID="option-premium-value"
                          >
                            {i?.selected_option?.name ??
                              '-- Select an option --'}
                          </Text>
                        </TouchableOpacity>

                        {i.selected_option !== null && (
                          <TouchableOpacity
                            onPress={() => onSelectOption(null, index, n)}
                            style={styles.resetOptionWrap}
                            hitSlop={HIT_SLOP_TEN}
                            testID={`option-premium-remove-${i.name}`}
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

                {item.range_premiums &&
                  item.range_premiums.map((i, n) => {
                    return (
                      <View
                        key={n.toString()}
                        style={{ width: '100%', alignSelf: 'center' }}
                      >
                        <FormTextInput
                          inputRef={(el) =>
                            (rangePremiumRefs.current[`${index}_${n}`] = el)
                          }
                          placeholder={i.label || i.name}
                          value={getFieldValue(i.value)}
                          maxLength={10}
                          onChangeText={(text) =>
                            onChangeRangePremiumPrice(text, i.options, index, n)
                          }
                          onSubmitEditing={() =>
                            onSubmitRangePremium(index, n, item.product_form)
                          }
                          keyboardType="number-pad"
                          returnKeyType="next"
                          color={theme.text_1}
                          extraStyle={{ width: '100%' }}
                          testID={`range-premium-${i.name}`}
                        />

                        {i.value !== '' && (
                          <TouchableOpacity
                            onPress={() =>
                              onChangeRangePremiumPrice('', i.options, index, n)
                            }
                            style={styles.resetWrap}
                            hitSlop={HIT_SLOP_TEN}
                            testID={`range-premium-remove-${i.name}`}
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

                {/* form fields */}
                {item?.product_form?.[0]?.fields && (
                  <>
                    {item.product_form[0].fields.map((i, n) => {
                      return (
                        <CustomInputFields
                          inputRef={(el) =>
                            (formFieldRefs.current[`${index}_${n}`] = el)
                          }
                          key={n.toString()}
                          fieldItem={i}
                          productId={item.id}
                          formId={item.product_form[0].id}
                          updatedItem={updateCustomData}
                          onSubmitEditing={() =>
                            onSubmitProductForm(
                              index,
                              n,
                              item.product_form[0].fields,
                              i.type,
                            )
                          }
                        />
                      );
                    })}
                  </>
                )}
              </View>
            </Collapsible>
          </View>
        ))}

        {allProducts.length > 1 && (
          <TouchableOpacity
            onPress={openProductModal}
            style={styles.addProductWarp}
            testID="add-product-button"
          >
            <Text style={styles.addText} testID="add-product-text">
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
          <View style={[styles.cardContainer]} testID="card-container">
            <Text style={styles.sectionHeading}>{I18n.t('base_prices')}</Text>

            {products.map((item, index) => {
              return (
                <View key={index.toString()} style={styles.basePriceWrap}>
                  <Text style={styles.cardLeftItem}>
                    {`${NumberFormatter.quantity(item.quantity, true)} ${
                      item.name
                    } :`}
                  </Text>
                  <Text style={styles.cardRightItem}>
                    {NumberFormatter.currency(item.total_amount, true)}
                  </Text>
                </View>
              );
            })}

            {totalPremiums.length > 0 && (
              <Text style={styles.sectionHeading}>{I18n.t('premiums')}</Text>
            )}

            {totalPremiums.map((item, index) => (
              <View key={index.toString()} style={styles.premiumWrap}>
                <Text style={styles.cardLeftItem}>{item.name}</Text>
                <Text style={styles.cardRightItem}>
                  {NumberFormatter.currency(item.total, true)}
                </Text>
              </View>
            ))}

            <View style={styles.dottedLine} />

            <View style={styles.totalWrap}>
              <Text style={styles.totalTitle} testID="buy-card-total-title">
                {`${I18n.t('total').toUpperCase()}:`}
              </Text>
              <Text style={styles.totalValue} testID="buy-card-total-value">
                {NumberFormatter.currency(totalPrice, true)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonWrap}>
        {error && (
          <Text style={styles.errorMessage} testID="common-error">
            {error}
          </Text>
        )}
        {optionError !== '' && (
          <Text style={styles.errorMessage} testID="option-error">
            {optionError}
          </Text>
        )}

        <CustomButton
          buttonText={I18n.t('next')}
          onPress={confirmBuy}
          extraStyle={{ width: '100%', marginVertical: 10 }}
          testID="buy-submit-button"
        />
      </View>

      {productModal && (
        <ProductsModal
          visible={productModal}
          initialProducts={initialProducts}
          products={products}
          hideModal={() => setProductModal(false)}
          addProduct={addProduct}
          styles={styles}
        />
      )}

      {optionPremiumModal && (
        <PremiumOptionsModal
          visible={optionPremiumModal}
          options={currentOptions}
          selectedOption={selectedOption}
          hideModal={resetOptionPremiumModal}
          onSelectOption={onSelectOption}
          currentPremiumName={currentPremiumName}
          styles={styles}
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
  const styles = StyleSheetFactory();
  const getIsSelected = (id) => {
    const isExist = products.filter((x) => {
      return x.id === id;
    });
    return isExist.length > 0;
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={hideModal}
    >
      <TouchableOpacity onPress={hideModal} style={styles.modalContainer} />
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
  styles,
}) => {
  const getIsSelected = (id) => {
    if (selectedOption && selectedOption.id === id) {
      return true;
    }

    return false;
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={hideModal}
    >
      <TouchableOpacity onPress={hideModal} style={styles.modalContainer} />
      <View style={styles.modalContainerSub} testID="option-modal-container">
        <View style={styles.modalTitleSection}>
          <Text style={styles.modalTitle} testID="option-modal-title">
            {currentPremiumName}
          </Text>
        </View>

        {options.map((item, index) => (
          <TouchableOpacity
            key={index.toString()}
            onPress={() => onSelectOption(item)}
            style={styles.modalItemWrap}
            testID={`option-item-${index}`}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.modalItem}>{`${item.name}: `}</Text>
              <Text style={styles.modalItem2}>
                {`${item.amount} ${getCurrency('code')} (per Kg)`}
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

export default BuyScreen;
