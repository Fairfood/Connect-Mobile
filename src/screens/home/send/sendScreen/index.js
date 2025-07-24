/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Modal,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';
import {
  TYPE_TRANSACTION_PREMIUM,
  PREMIUM_APPLICABLE_ACTIVITY_SELL,
  MINIMUM_TRANSACTION_QUANTITY,
  MAXIMUM_TRANSACTION_QUANTITY,
  PREMIUM_APPLICABLE_ACTIVITY_BUY,
  HIT_SLOP_TEN,
  PREMIUM_MANUAL,
  PREMIUM_OPTIONS,
  CURRENCY_FORMAT,
  NUMBER_REGEX,
} from '../../../../utils/constants';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import CustomButton from '../../../../components/buttons/customButton';
import TransparentButton from '../../../../components/buttons/transparentButton';
import FormTextInput from '../../../../components/inputs/formTextInput';
import I18n from '../../../../translations/text/i18n';
import { logAnalytics } from '../../../../utils/serviceHelper';
import {
  fetchAllPremiums,
  searchPremiumByServerId,
} from '../../../../db/services/PremiumsHelper';
import { findAllUnSendTransactionByProduct } from '../../../../db/services/TransactionsHelper';
import { fetchPremiumsByTransactionAndCategory } from '../../../../db/services/TransactionPremiumHelper';
import { fetchAllActiveProducts } from '../../../../db/services/ProductsHelper';
import { fetchAllPremiumsByProduct } from '../../../../db/services/ProductPremiumHelper';
import { getBuyer, NumberFormatter } from '../../../../utils/commonFunctions';
import { clearTransactionStatus } from '../../../../redux/CommonStore';
import { groupBy } from './controller';
import StyleSheetFactory from './styles';
import {
  CloseIcon,
  EditIcon,
  InfoIcon,
  ResetIcon,
} from '../../../../assets/svg';
import SendCard from '../../../../components/cards/sendCard';

const { height } = Dimensions.get('window');

const SendScreen = ({ navigation, route }) => {
  const { locationAllowed } = route.params;
  const quantityRefs = useRef([]);
  const styles = StyleSheetFactory();

  const { theme, currencyFormat } = useSelector((state) => state.common);
  const { decimalSeparator } = currencyFormat;

  const [load, setLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [allNodes, setAllNodes] = useState([]);
  const [editQuantity, setEditQuantity] = useState(false);
  const [buyer, setBuyer] = useState(null);
  const [onModalOpen, setModalOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [totalPaidToFarmer, setTotalPaidToFarmer] = useState(0);
  const [grantTotal, setGrantTotal] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    setupInitialValues();
  }, []);

  /**
   * setting initial product array
   */
  const setupInitialValues = async () => {
    setLoading(true);
    if (locationAllowed) {
      fetchLocation();
    }

    dispatch(clearTransactionStatus());

    const allProducts = await fetchAllActiveProducts();
    initiateValues(allProducts);
  };

  /**
   * fetching devices geo location
   */
  const fetchLocation = async () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
      },
      () => {
        setLocation(null);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
    );
  };

  /**
   * setting initial values based on products
   * @param {Array} products all products
   */
  const initiateValues = async (products) => {
    const savedBuyer = await getBuyer();
    setBuyer(savedBuyer);

    const premiums = await fetchAllPremiums();

    Promise.all(
      products.map(async (product, index) => {
        let transactions = await findAllUnSendTransactionByProduct(product.id);

        // checking is there any error transaction exist
        const isErrorTnxExist = transactions.find((x) => x.error !== '');
        if (isErrorTnxExist) {
          transactions = transactions.filter((x) => {
            return x.error === '';
          });

          Toast.show({
            type: 'warning',
            text1: I18n.t('warning'),
            text2: I18n.t('errored_buy_found'),
          });
        }

        const totalQuantity = transactions.reduce((total, tx) => {
          return total + parseFloat(tx.current_quantity_corrected);
        }, 0);

        const totalAmount = transactions.reduce((total, tx) => {
          return total + tx.total_corrected;
        }, 0);

        // finding total quantity that are applied with premium
        let quantityWithPremium = 0;
        let transactionPremiums = [];

        for (const trans of transactions) {
          const appliedPremiums = await fetchPremiumsByTransactionAndCategory(
            trans.id,
            TYPE_TRANSACTION_PREMIUM,
          );

          if (appliedPremiums.length > 0) {
            quantityWithPremium += trans.quantity_corrected;
            transactionPremiums = [...transactionPremiums, ...appliedPremiums];
          }
        }

        const res = groupBy(transactionPremiums, 'premium_id');
        const totalPremiums = [];
        let total = 0;

        if (Object.keys(res).length > 0) {
          await Promise.all(
            premiums.map(async (p) => {
              const premium = res[p.id];
              if (premium !== undefined) {
                const totalPremium = premium.reduce((total, p) => {
                  return total + parseFloat(p.amount_corrected);
                }, 0);

                const totalQuantityWithPremium = premium.reduce((total, p) => {
                  const transId = p.transaction_id;
                  const transDetails = transactions.filter((tx) => {
                    return tx.id === transId;
                  });
                  return total + transDetails[0].quantity_corrected;
                }, 0);

                totalPremiums.push({
                  id: p.id,
                  name: p.name,
                  amount: p.amount_corrected,
                  total: totalPremium,
                  total_premium_quantity: totalQuantityWithPremium,
                  dependant_on_card: p.dependant_on_card,
                  applicable_activity: p.applicable_activity,
                  calculation_type: p.calculation_type,
                });
                total += totalPremium;
              }
            }),
          );
        }

        let otherPremiumAmount = 0;
        const productPremiums = await fetchAllPremiumsByProduct(
          product.server_id,
        );

        const otherPremiums = await getOtherPremiums(productPremiums);

        otherPremiums.map((p) => {
          const otherTotalPremium = totalQuantity * p.amount_corrected;

          totalPremiums.push({
            id: p.id,
            name: p.name,
            amount: p.amount_corrected,
            total: otherTotalPremium,
            total_premium_quantity: totalQuantity,
            dependant_on_card: p.dependant_on_card,
            applicable_activity: p.applicable_activity,
            calculation_type: p.calculation_type,
          });
          otherPremiumAmount += otherTotalPremium;
        });

        const nodes = [...new Set(transactions.map((item) => item.node_id))];
        setAllNodes((allNodes) => [...allNodes, ...nodes]);

        const transactionIds = [
          ...new Set(transactions.map((item) => item.id)),
        ];

        product.parents = transactionIds;
        product.total_amount_premiums = totalAmount + otherPremiumAmount;
        product.total_amount = totalAmount - total; // base_price
        product.total_premiums = totalPremiums;
        product.total_quantity = totalQuantity;
        product.edited_quantity = totalQuantity;
        product.ratio = 1;

        products[index] = product;
        return products;
      }),
    ).then(() => {
      // filtering products, no transaction needed for 0 quantity products
      const applicableProducts = products.filter((prod) => {
        return prod.total_quantity !== 0;
      });

      setProducts((products) => applicableProducts);
      calculateTotalAmount(applicableProducts);
      setLoad(!load);
      setLoading(false);
    });
  };

  /**
   * getting sent premiums
   * @param   {Array} productPremiums all product premiums
   * @returns {Array}                 premiums related on send
   */
  const getOtherPremiums = async (productPremiums) => {
    const otherPremiums = [];
    if (productPremiums.length > 0) {
      await Promise.all(
        productPremiums.map(async (premium) => {
          const existingPremiums = await searchPremiumByServerId(
            premium.premium_id,
          );
          // checking premium exist
          if (existingPremiums.length > 0) {
            const existingPremium = existingPremiums[0];

            if (
              existingPremium.applicable_activity ===
              PREMIUM_APPLICABLE_ACTIVITY_SELL
            ) {
              otherPremiums.push(existingPremium);
            }
          }
        }),
      );

      return otherPremiums;
    }
    return [];
  };

  /**
   * open/close quantity edit nodal
   */
  const toggleModal = () => {
    setModalOpen(!onModalOpen);
  };

  /**
   * updating quantity based on input
   * @param {string} quantity       updated quantity
   * @param {number} index          index of updated product in product array
   * @param {string} totalQuantity  actual quantity
   */
  const updateQuantity = (quantity, index, totalQuantity) => {
    let quantityEdited = NumberFormatter.formatToNumber(
      quantity,
      decimalSeparator === '.'
        ? CURRENCY_FORMAT.EMPTY_DOT
        : CURRENCY_FORMAT.EMPTY_COMA,
    );

    if (!NUMBER_REGEX.test(quantityEdited)) {
      return;
    }

    if (quantityEdited === '.') {
      quantityEdited = '0.';
    }

    if (parseFloat(totalQuantity) > 0) {
      if (
        quantityEdited !== '' &&
        parseFloat(quantityEdited) > parseFloat(totalQuantity)
      ) {
        Toast.show({
          type: 'error',
          text1: I18n.t('validation'),
          text2: `${I18n.t(
            'edited_quantity_cannot_exceed_actual',
          )} ${totalQuantity}Kg`,
        });
      } else {
        if (quantityEdited !== '') {
          products[index].ratio =
            parseFloat(quantityEdited) / parseFloat(totalQuantity);
        } else {
          products[index].ratio = '';
        }

        products[index].edited_quantity = quantityEdited;

        setProducts((products) => products);
        calculateTotalAmount(products);
        setLoad(!load);
      }
    }
  };

  /**
   * validating data based on input fields
   * @returns {boolean} true if valid, otherwise false
   */
  const validateData = async () => {
    let errorMsg = '';
    let valid = true;

    await Promise.all(
      products.map(async (product) => {
        const editedQuantity = parseFloat(
          product.edited_quantity.toString().replace(/,/g, '.'),
        );

        if (product.ratio === '') {
          errorMsg = I18n.t('all_fields_are_mandatory');
          valid = false;
        } else if (editedQuantity <= MINIMUM_TRANSACTION_QUANTITY) {
          errorMsg = `${I18n.t('quantity_of')} ${product.name} ${I18n.t(
            'must_be_greater_than',
          )} ${MINIMUM_TRANSACTION_QUANTITY}Kg.`;
          valid = false;
        } else if (editedQuantity >= MAXIMUM_TRANSACTION_QUANTITY) {
          errorMsg = `${I18n.t('quantity_of')} ${product.name} ${I18n.t(
            'must_be_lower_than',
          )} ${MAXIMUM_TRANSACTION_QUANTITY}Kg.`;
          valid = false;
        }
      }),
    );

    if (valid) {
      return true;
    }

    Toast.show({
      type: 'error',
      text1: I18n.t('validation'),
      text2: errorMsg,
    });

    return false;
  };

  /**
   * send submit function
   */
  const confirmSend = async () => {
    if (grantTotal > 0) {
      const valid = await validateData();
      if (valid) {
        if (products.find((i) => i.ratio !== 1)) {
          setModalOpen(true);
        } else {
          onNext();
        }
      }
    } else {
      Toast.show({
        type: 'error',
        text1: I18n.t('validation'),
        text2: I18n.t('total_amount_must_greater_0'),
      });
    }
  };

  /**
   * navigation to next page
   * @param {number} type transaction type. 1 if loss, 3 if send.
   */
  const onNext = async (type) => {
    await Promise.all(
      products.map(async (product) => {
        product.edited_quantity = parseFloat(
          product.edited_quantity.toString().replace(/,/g, '.'),
        );
      }),
    );

    let transactionType = 3;
    if (type) {
      transactionType = type;

      logAnalytics('send_quantity_edited', {
        quantity_edited: 'Edited',
      });
    } else {
      logAnalytics('send_quantity_edited', {
        quantity_edited: 'Not-edited',
      });
    }

    if (products.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No product found.',
        text2: I18n.t('something_went_wrong'),
      });
      return;
    }

    navigation.navigate('SendVerificationScreen', {
      products,
      transactionType,
      buyer,
      totalEditedQuantity: getTotalEditedQuantity(),
      preLocation: location,
    });
  };

  /**
   * to get total premiums paid for products
   * @returns {Array} premium array
   */
  const getTotalPremiums = () => {
    if (products.length > 0) {
      const mainObj = {};
      products.map((product) => {
        const productEditedQuantity =
          product.edited_quantity !== ''
            ? parseFloat(product.edited_quantity.toString().replace(/,/g, '.'))
            : 0;

        product.total_premiums.map((premium) => {
          const { id } = premium;
          let { name } = premium;
          let totalAmount = 0;

          if (mainObj[id]) {
            const existedObj = mainObj[id];
            name = existedObj.name;
            totalAmount = existedObj.total;
          }

          const {
            amount,
            applicable_activity,
            calculation_type,
            total,
            total_premium_quantity,
          } = premium;

          if (applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_BUY) {
            if (productEditedQuantity < total_premium_quantity) {
              if (
                calculation_type === PREMIUM_MANUAL ||
                calculation_type === PREMIUM_OPTIONS
              ) {
                totalAmount +=
                  (total / total_premium_quantity) * productEditedQuantity;
              } else {
                totalAmount += amount * productEditedQuantity;
              }
            } else if (
              calculation_type === PREMIUM_MANUAL ||
              calculation_type === PREMIUM_OPTIONS
            ) {
              totalAmount += total;
            } else {
              totalAmount += amount * total_premium_quantity;
            }
          } else {
            totalAmount += amount * productEditedQuantity;
          }

          const obj = {
            name,
            total: totalAmount,
          };
          mainObj[id] = obj;
        });
      });
      return Object.values(mainObj);
    }
    return [];
  };

  /**
   * get all amount including premiums
   * @param   {number} products product array.
  //  * @returns {number}          total amount
   */
  const calculateTotalAmount = (products) => {
    let totalAmount = 0;
    let totalPaidFarmerAmount = 0;

    products.forEach((product) => {
      const editedQuantity =
        product.edited_quantity !== ''
          ? parseFloat(product.edited_quantity.toString().replace(/,/g, '.'))
          : 0;

      const ratio = product.ratio !== '' ? parseFloat(product.ratio) : 1;

      totalAmount += parseFloat(product.total_amount) * ratio;
      totalPaidFarmerAmount += parseFloat(product.total_amount) * ratio;

      product.total_premiums.forEach((premium) => {
        const {
          amount,
          applicable_activity,
          calculation_type,
          total_premium_quantity,
          total,
        } = premium;

        if (applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_BUY) {
          if (editedQuantity < total_premium_quantity) {
            if (
              calculation_type === PREMIUM_MANUAL ||
              calculation_type === PREMIUM_OPTIONS
            ) {
              totalAmount += total * ratio;
            } else {
              totalAmount += amount * editedQuantity;
            }
          } else if (
            calculation_type === PREMIUM_MANUAL ||
            calculation_type === PREMIUM_OPTIONS
          ) {
            totalAmount += total;
          } else {
            totalAmount += amount * total_premium_quantity;
          }
        } else {
          totalAmount += amount * editedQuantity;
        }
      });
    });

    setGrantTotal(totalAmount);
    setTotalPaidToFarmer(totalPaidFarmerAmount);
    setLoad(!load);
  };

  /**
   * calculate total edited quantity
   * @returns {number} total edited quantity
   */
  const getTotalEditedQuantity = () => {
    const total = products.reduce((a, b) => {
      return a + parseFloat(b.edited_quantity);
    }, 0);
    return total;
  };

  /**
   * to get total farmer count
   * @returns {number} farmer count
   */
  const getTotalFarmerCount = () => {
    const uniqueNodes = [...new Set(allNodes)];
    return uniqueNodes.length;
  };

  const onSubmitQuantity = (index) => {
    if (quantityRefs?.current?.[index + 1]) {
      quantityRefs.current[index + 1].focus();
    } else {
      Keyboard.dismiss();
    }
  };

  const getEditedQuantity = (quantity) => {
    if (quantity === '') {
      return '';
    }

    return NumberFormatter.numberToFormat(
      quantity,
      decimalSeparator === '.'
        ? CURRENCY_FORMAT.EMPTY_DOT
        : CURRENCY_FORMAT.EMPTY_COMA,
    );
  };

  return (
    <View style={styles.container}>
      <CustomLeftHeader
        title={I18n.t('sell')}
        leftIcon="arrow-left"
        onPress={() => navigation.goBack(null)}
      />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {!loading && products.length === 0 && (
          <View style={styles.emptyViewWrap}>
            <Text style={styles.emptyText}>
              {I18n.t('no_quantity_remains')}
            </Text>
          </View>
        )}

        {!loading && products.length > 0 && (
          <View>
            <View style={styles.formTitleContainer}>
              <Text style={styles.formValue}>
                {I18n.t('transaction_details')}
              </Text>
            </View>

            <View style={styles.formTitleContainer}>
              <Text style={styles.formTitle}>{I18n.t('buyer')}</Text>
              <Text style={styles.formValue}>{buyer?.name ?? ''}</Text>
            </View>
          </View>
        )}

        {!loading && products.length > 0 && (
          <View style={styles.formTitleContainer}>
            <Text style={styles.formTitle}>{I18n.t('total_farmers')}</Text>
            <Text style={styles.formValue}>{getTotalFarmerCount()}</Text>
          </View>
        )}

        {loading && <ActivityIndicator size="small" color={theme.text_1} />}

        {products.length > 0 && !loading && (
          <View style={styles.productDetailsWrap}>
            <View>
              <Text style={styles.formValue}>{I18n.t('product_details')}</Text>
              <Text style={styles.formTitle}>
                {`(${I18n.t('total_quantity_in_kg')})`}
              </Text>
            </View>
            <TransparentButton
              buttonText={I18n.t('edit')}
              onPress={() => setEditQuantity(true)}
              padding={0}
              icon={<EditIcon fill="#EA2553" width={13} height={13} />}
              extraStyle={{ marginRight: 0, height: 45 }}
            />
          </View>
        )}

        {!editQuantity && products.length > 0 && !loading && (
          <>
            {products.map((item, index) => {
              return (
                <View key={index.toString()} style={styles.formTitleContainer}>
                  <Text style={[styles.formValue, { fontSize: 15 }]}>
                    {item.name}
                  </Text>
                  <View style={styles.productQuantity}>
                    <Text style={styles.formValue}>
                      {NumberFormatter.quantity(
                        item.total_quantity * item.ratio,
                      )}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {editQuantity && products.length > 0 && (
          <>
            {products.map((item, index) => {
              return (
                <View
                  key={index.toString()}
                  style={{ width: '100%', alignSelf: 'center' }}
                >
                  <FormTextInput
                    inputRef={(el) => (quantityRefs.current[index] = el)}
                    placeholder={item.name}
                    value={getEditedQuantity(products[index].edited_quantity)}
                    onChangeText={(text) =>
                      updateQuantity(text, index, item.total_quantity)
                    }
                    onSubmitEditing={() => {
                      onSubmitQuantity(index);
                    }}
                    color={theme.text_1}
                    keyboardType="number-pad"
                    extraStyle={{ width: '100%' }}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      updateQuantity(
                        item.total_quantity,
                        index,
                        item.total_quantity,
                      )
                    }
                    style={styles.resetWrap}
                    hitSlop={HIT_SLOP_TEN}
                  >
                    <ResetIcon stroke="#EA2553" />
                    <Text style={styles.resetText}>{I18n.t('reset')}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        <SendCard
          products={products}
          premiums={getTotalPremiums()}
          loading={loading}
          totalPaidToFarmer={totalPaidToFarmer}
          totalPrice={grantTotal}
        />

        {/* {products.length > 0 && !loading && (
          <View style={styles.cardContainer}>
            <View style={{ marginVertical: 5, paddingVertical: 0 }}>
              <Text style={styles.priceDetails}>{I18n.t('price_details')}</Text>
            </View>
            <View style={[styles.cardItem, { marginTop: 15 }]}>
              <Text
                style={[
                  styles.cardLeftItem,
                  { color: theme.text_1, width: '70%' },
                ]}
              >
                {`${I18n.t('total_paid_to_farmers')}:`}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <Text
                  style={[
                    styles.cardRightItem,
                    {
                      color: theme.text_1,
                    },
                  ]}
                >
                  {NumberFormatter.currency(totalPaidToFarmer, true)}
                </Text>
              </View>
            </View>

            {getTotalPremiums().length > 0 && (
              <Text style={styles.sectionHeading}>{I18n.t('premiums')}</Text>
            )}

            {getTotalPremiums().map((premium, index) => (
              <View key={index.toString()} style={styles.cardItem}>
                <Text style={[styles.cardLeftItem, { color: theme.text_1 }]}>
                  {`${premium.name} ${I18n.t('paid')}:`}
                </Text>
                <Text
                  style={[
                    styles.cardRightItem,
                    {
                      fontWeight: '600',
                      color: theme.text_1,
                    },
                  ]}
                >
                  {NumberFormatter.currency(premium.total, true)}
                </Text>
              </View>
            ))}

            <View style={styles.dottedLine} />
            <View style={[styles.cardItem, { marginVertical: 10 }]}>
              <Text
                style={[
                  styles.cardLeftItem,
                  {
                    opacity: 1,
                    textTransform: 'uppercase',
                    color: theme.text_1,
                    paddingTop: 5,
                  },
                ]}
              >
                {`${I18n.t('total')}:`}
              </Text>
              <Text
                style={[
                  styles.cardRightItem,
                  {
                    fontWeight: '700',
                    fontSize: 20,
                    color: theme.text_1,
                  },
                ]}
              >
                {NumberFormatter.currency(grantTotal, true)}
              </Text>
            </View>
          </View>
        )} */}
      </ScrollView>

      {grantTotal > 0 && (
        <CustomButton
          buttonText={I18n.t('next')}
          onPress={confirmSend}
          extraStyle={{ width: '100%', marginVertical: 10 }}
        />
      )}

      {onModalOpen && (
        <View style={{ flex: 1, position: 'absolute' }}>
          <EditModal
            OpenModal={onModalOpen}
            onNext={onNext}
            onCloseModal={toggleModal}
            products={products}
            totalEditedQuantity={getTotalEditedQuantity()}
            theme={theme}
            styles={styles}
            decimalSeparator={decimalSeparator}
          />
        </View>
      )}
    </View>
  );
};

const EditModal = ({
  OpenModal,
  onCloseModal,
  onNext,
  products,
  totalEditedQuantity,
  theme,
  styles,
  decimalSeparator,
}) => {
  const type = 1;

  const handleSubmit = () => {
    onCloseModal();
    onNext(type);
  };

  const getLossQuantity = (totalQuantity, editedQuantity) => {
    const loss = totalQuantity - parseFloat(editedQuantity);

    return NumberFormatter.numberToFormat(
      loss.toFixed(2),
      decimalSeparator === '.'
        ? CURRENCY_FORMAT.EMPTY_DOT
        : CURRENCY_FORMAT.EMPTY_COMA,
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={OpenModal}
      onRequestClose={onCloseModal}
    >
      <View style={styles.modalWrap}>
        <View style={styles.modalInnerWrap}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {I18n.t('reason_for_quantity_change')}
            </Text>
            <TouchableOpacity
              style={{ alignItems: 'flex-end', paddingHorizontal: 20 }}
              onPress={onCloseModal}
            >
              <CloseIcon fill={theme.text_1} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ maxHeight: height * 0.75 }}
            showsVerticalScrollIndicator={false}
          >
            <View>
              <View style={{ marginHorizontal: 30, marginVertical: 20 }}>
                <Text style={styles.reasonText}>{I18n.t('select_reason')}</Text>
                <View style={styles.radioWrap}>
                  <View style={styles.outerCircle}>
                    <View style={styles.innerCircle} />
                  </View>
                  <Text style={styles.radioText}>{I18n.t('loss')}</Text>
                </View>
              </View>
              <View style={styles.editModalCardContainer}>
                {products.map((item, index) => (
                  <View key={index.toString()} style={{ width: '100%' }}>
                    {item.total_quantity !==
                      item.edited_quantity.toString().replace(/,/g, '.') && (
                      <View
                        style={{
                          width: '100%',
                          marginTop: 10,
                          flexDirection: 'row',
                        }}
                      >
                        <InfoIcon
                          name="info"
                          width={15}
                          height={15}
                          fill={theme.text_1}
                          style={{ marginHorizontal: 10, marginTop: 5 }}
                        />
                        <Text style={styles.lossText}>
                          {`${item.name} - ${getLossQuantity(
                            item.total_quantity,
                            item.edited_quantity,
                          )} Kg ${I18n.t('will_be_considered_as_loss')}`}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}

                <View style={[styles.cardItem, { marginTop: 10 }]}>
                  <Text
                    style={[
                      styles.cardLeftItem,
                      { color: theme.text_1, width: '70%' },
                    ]}
                  >
                    {`${I18n.t('total_quantity_delivering')} (Kg):`}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    <Text
                      style={[
                        styles.cardRightItem,
                        {
                          color: theme.text_1,
                        },
                      ]}
                    >
                      {NumberFormatter.quantity(totalEditedQuantity)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.cardItem, { marginTop: 10 }]}>
                  <Text
                    style={[
                      styles.cardLeftItem,
                      { color: theme.text_1, width: '70%' },
                    ]}
                  >
                    {`${I18n.t('balance_quantity_available')} (Kg):`}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    <Text
                      style={[styles.cardRightItem, { color: theme.text_1 }]}
                    >
                      0
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
          <View style={styles.buttonsWrap}>
            <TransparentButton
              buttonText={I18n.t('back')}
              onPress={onCloseModal}
              color="#EA2553"
              extraStyle={{ width: '45%' }}
            />
            <CustomButton
              buttonText={I18n.t('next')}
              onPress={handleSubmit}
              extraStyle={{ width: '45%' }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SendScreen;
