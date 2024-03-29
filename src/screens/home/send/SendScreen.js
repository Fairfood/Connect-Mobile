/* eslint-disable no-shadow */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import RadioForm from 'react-native-simple-radio-button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';

import { getAllProducts } from '../../../services/productsHelper';
import { findBatchByProductId } from '../../../services/batchesHelper';
import {
  findTransactionById,
  getAllTransactions,
} from '../../../services/transactionsHelper';
import {
  getAllTransactionPremiums,
  findAllPremiumsByTransactionAndCategory,
} from '../../../services/transactionPremiumHelper';
import {
  getAllPremiums,
  findPremiumByServerId,
} from '../../../services/premiumsHelper';
import { findAllPremiumsByProduct } from '../../../services/productPremiumHelper';
import {
  TYPE_TRANSACTION_PREMIUM,
  PREMIUM_APPLICABLE_ACTIVITY_SELL,
  MINIMUM_TRANSACTION_QUANTITY,
  MAXIMUM_TRANSACTION_QUANTITY,
  PREMIUM_APPLICABLE_ACTIVITY_BUY,
  HIT_SLOP_TEN,
} from '../../../services/constants';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import CustomButton from '../../../components/CustomButton';
import Icon from '../../../icons';
import TransparentButton from '../../../components/TransparentButton';
import FormTextInput from '../../../components/FormTextInput';
import I18n from '../../../i18n/i18n';

const { width } = Dimensions.get('window');

const SendScreen = ({ navigation, route }) => {
  const { locationAllowed } = route.params;
  const { theme } = useSelector((state) => state.common);
  const { userProjectDetails } = useSelector((state) => state.login);
  const { currency } = userProjectDetails;
  const [load, setLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [allNodes, setAllNodes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editQuantity, setEditQuantity] = useState(false);
  const [buyers, setBuyers] = useState([]);
  const [onModalOpen, setModalOpen] = useState(false);
  const [location, setLocation] = useState(null);

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

    await AsyncStorage.setItem('transactionStatus', JSON.stringify({}));

    const allProducts = await getAllProducts();

    const firstProduct = allProducts?.[0] ?? null;
    setSelectedProduct(firstProduct);

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
   * used for grouping transaction premiums
   *
   * @param   {Array}   arr       transaction premium array
   * @param   {*}       property  premium id
   * @returns {object}            grouped premiums
   */
  const groupBy = (arr, property) => {
    return arr.reduce((memo, x) => {
      if (!memo[x[property]]) {
        memo[x[property]] = [];
      }
      memo[x[property]].push(x);
      return memo;
    }, {});
  };

  /**
   * setting initial values based on products
   *
   * @param {Array} products all products
   */
  const initiateValues = async (products) => {
    let savedBuyers = await AsyncStorage.getItem('buyers');
    savedBuyers = JSON.parse(savedBuyers);
    setBuyers(savedBuyers);

    const transactions = await getAllTransactions();
    const transactionPremiums = await getAllTransactionPremiums();
    const premiums = await getAllPremiums();

    Promise.all(
      products.map(async (product, index) => {
        const allBatches = await findBatchByProductId(product.id);

        const batches = [];
        let errorBuyTnxFound = false;
        await Promise.all(
          allBatches.map(async (batch) => {
            const tnx = await findTransactionById(batch.transaction_id);
            if (tnx.error === '') {
              batches.push(batch);
            } else {
              errorBuyTnxFound = true;
            }
          }),
        );

        if (errorBuyTnxFound) {
          Toast.show({
            type: 'warning',
            text1: I18n.t('warning'),
            text2: I18n.t('errored_buy_found'),
          });
        }

        const totalQuantity = batches.reduce((total, batch) => {
          return total + parseFloat(batch.current_quantity);
        }, 0);

        const transactionIds = [
          ...new Set(batches.map((item) => item.transaction_id)),
        ];

        const filteredTransactions = transactions.filter((tx) => {
          return transactionIds.includes(tx.id);
        });

        const totalAmount = filteredTransactions.reduce((total, tx) => {
          return total + Math.round(tx.total);
        }, 0);

        // finding total quantity that are applied with premium
        let premiumedQuantity = 0;
        transactionIds.map(async (trans) => {
          const appliedPremiums = await findAllPremiumsByTransactionAndCategory(
            trans,
            TYPE_TRANSACTION_PREMIUM,
          );
          if (appliedPremiums.length > 0) {
            const tranDetails = transactions.filter((tx) => {
              return tx.id === trans;
            });
            premiumedQuantity += tranDetails[0].quantity;
          }
        });

        const filteredTransactionPremiums = transactionPremiums.filter((tx) => {
          return transactionIds.includes(tx.transaction_id);
        });

        const res = groupBy(filteredTransactionPremiums, 'premium_id');
        const totalPremiums = [];
        let total = 0;

        if (Object.keys(res).length > 0) {
          await Promise.all(
            premiums.map(async (p) => {
              const premium = res[p.id];
              if (premium !== undefined) {
                const totalPremium = premium.reduce((total, p) => {
                  return total + parseFloat(p.amount);
                }, 0);

                const totalPremiumedQuantity = premium.reduce((total, p) => {
                  const transId = p.transaction_id;
                  const transDetails = transactions.filter((tx) => {
                    return tx.id === transId;
                  });
                  return total + transDetails[0].quantity;
                }, 0);

                totalPremiums.push({
                  id: p.id,
                  name: p.name,
                  amount: p.amount,
                  total: totalPremium,
                  total_premiumed_quantity: totalPremiumedQuantity,
                  is_card_dependent: p.is_card_dependent,
                  applicable_activity: p.applicable_activity,
                });
                total += totalPremium;
              }
            }),
          );
        }

        let otherPremiumAmount = 0;
        const productPremiums = await findAllPremiumsByProduct(
          product.server_id,
        );
        const otherPremiums = await getOtherPremiums(productPremiums);

        otherPremiums.map((p) => {
          const otherTotalPremium =
            (Math.round(totalQuantity * 100) / 100) * p.amount;

          totalPremiums.push({
            id: p.id,
            name: p.name,
            amount: p.amount,
            total: otherTotalPremium,
            total_premiumed_quantity: totalQuantity,
            is_card_dependent: p.is_card_dependent,
            applicable_activity: p.applicable_activity,
          });
          otherPremiumAmount += otherTotalPremium;
        });

        const nodes = [
          ...new Set(filteredTransactions.map((item) => item.node_id)),
        ];
        setAllNodes((allNodes) => [...allNodes, ...nodes]);

        product.batches = batches;
        product.total_amount_premiums = totalAmount + otherPremiumAmount;
        product.total_amount = totalAmount - total; // base_price
        product.total_premiums = totalPremiums;
        product.total_quantity = Math.round(totalQuantity * 100) / 100;
        product.edited_quantity = Math.round(totalQuantity * 100) / 100;
        product.premiumed_quantity = premiumedQuantity;
        product.ratio = 1;

        products[index] = product;
        return products;
      }),
    ).then(() => {
      // filtering products,no transaction needed for 0 quantity products
      const applicableProducts = products.filter((prod) => {
        return prod.total_quantity !== 0;
      });

      // eslint-disable-next-line no-unused-vars
      setProducts((products) => applicableProducts);
      setLoad(!load);
      setLoading(false);
    });
  };

  /**
   * getting sent premiums
   *
   * @param   {Array} productPremiums all product premiums
   * @returns {Array}                 premiums related on send
   */
  const getOtherPremiums = async (productPremiums) => {
    const otherPremiums = [];
    if (productPremiums.length > 0) {
      await Promise.all(
        productPremiums.map(async (premium) => {
          const pp = await findPremiumByServerId(premium.premium_id);
          let p = pp.slice(0);

          // checking premium exist
          if (p.length > 0) {
            [p] = p;

            if (p.applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_SELL) {
              otherPremiums.push(p);
            }
          }
        }),
      );

      return otherPremiums;
    }
    return [];
  };

  /**
   * navigating to previous page
   */
  const backNavigation = () => {
    navigation.goBack(null);
  };

  /**
   * open/close quantity edit nodal
   */
  const toggleModal = () => {
    setModalOpen(!onModalOpen);
  };

  /**
   * updating quantity based on input
   *
   * @param {string} quantity       updated quantity
   * @param {number} index          index of updated product in product array
   * @param {string} totalQuantity  actual quantity
   */
  const updateQuantity = (quantity, index, totalQuantity) => {
    const quantityEdited = quantity.toString().replace(',', '.');

    if (parseFloat(totalQuantity) > 0) {
      if (
        quantity !== '' &&
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
        if (quantity !== '') {
          products[index].ratio =
            parseFloat(quantityEdited) / parseFloat(totalQuantity);
        } else {
          products[index].ratio = '';
        }

        products[index].edited_quantity = quantity.toString().replace('.', ',');

        setProducts((products) => products);
        setLoad(!load);
      }
    }
  };

  /**
   * checking any product quantity edited
   *
   * @returns {boolean} true if quantity edited, otherwise false
   */
  const ratioCompare = () => {
    const changed = products.filter((i) => {
      return i.ratio !== 1;
    });
    if (changed.length > 0) {
      return true;
    }
    return false;
  };

  /**
   * validating data based on input fields
   *
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
    const total = getTotalAmount();
    if (total > 0) {
      const valid = await validateData();
      if (valid) {
        if (ratioCompare()) {
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
   *
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
    }

    navigation.navigate('SendVerificationScreen', {
      products,
      transactionType,
      buyer: buyers[0],
      totalEditedQuantity: getTotalEditedQuantity(),
      preLocation: location,
    });
  };

  /**
   * alter product name
   *
   * @param   {string} name product name
   * @returns {string}      altered product name
   */
  const getProductName = (name) => {
    if (name.includes('Nutmeg')) {
      return 'Nutmeg';
    }
    return name;
  };

  /**
   * to get total amount of all product
   *
   * @returns {number} total amount
   */
  const getTotalAmount = () => {
    let total = 0;
    products.map((product) => {
      total += product.total_amount * product.ratio;
    });

    return Math.round(parseFloat(total));
  };

  /**
   * to get total premiums paid for products
   *
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
          let total = 0;

          if (mainObj[id]) {
            const existedObj = mainObj[id];
            name = existedObj.name;
            total = existedObj.total;
          }

          if (premium.applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_BUY) {
            if (productEditedQuantity < premium.total_premiumed_quantity) {
              total +=
                parseFloat(premium.amount) * parseFloat(productEditedQuantity);
            } else {
              total +=
                parseFloat(premium.amount) *
                parseFloat(premium.total_premiumed_quantity);
            }
          } else {
            total +=
              parseFloat(premium.amount) * parseFloat(productEditedQuantity);
          }

          const obj = {
            name,
            total,
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
   *
   * @returns {number} total amount
   */
  const getAllTotalAmount = () => {
    let total = 0;

    products.map((product) => {
      const productEditedQuantity =
        product.edited_quantity !== '' ? product.edited_quantity : 0;
      const productRatio = product.ratio !== '' ? product.ratio : 0;

      total += parseFloat(product.total_amount) * parseFloat(productRatio);

      product.total_premiums.map((premium) => {
        if (premium.applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_BUY) {
          if (productEditedQuantity < premium.total_premiumed_quantity) {
            total +=
              parseFloat(premium.amount) * parseFloat(productEditedQuantity);
          } else {
            total +=
              parseFloat(premium.amount) *
              parseFloat(premium.total_premiumed_quantity);
          }
        } else {
          total +=
            parseFloat(premium.amount) * parseFloat(productEditedQuantity);
        }
      });
    });

    return Math.round(parseFloat(total));
  };

  /**
   * to get total farmer count
   *
   * @returns {number} farmer count
   */
  const getTotalFarmerCount = () => {
    const nodes = allNodes;
    const uniqueNodes = [...new Set(nodes)];
    return uniqueNodes.length;
  };

  /**
   * calculate total edited quantity
   *
   * @returns {number} total edited quantity
   */
  const getTotalEditedQuantity = () => {
    const total = products.reduce((a, b) => {
      return a + parseFloat(b.edited_quantity.toString().replace(',', '.'));
    }, 0);
    return total;
  };

  const styles = StyleSheetFactory(theme);

  return (
    <View style={styles.container}>
      <CustomLeftHeader
        backgroundColor={theme.background_1}
        title={I18n.t('sell')}
        leftIcon='arrow-left'
        onPress={() => backNavigation()}
      />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.formTitleContainer}>
          <Text style={styles.formValue}>{I18n.t('transaction_details')}</Text>
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formTitle}>{I18n.t('buyer')}</Text>
          {buyers.length > 0 && (
            <Text style={styles.formValue}>{buyers[0].name}</Text>
          )}
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formTitle}>{I18n.t('product')}</Text>
          {selectedProduct != null && (
            <Text style={styles.formValue}>
              {getProductName(selectedProduct.name)}
            </Text>
          )}
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formTitle}>{I18n.t('total_farmers')}</Text>
          <Text style={styles.formValue}>{getTotalFarmerCount()}</Text>
        </View>

        {loading && <ActivityIndicator size='small' color={theme.text_1} />}

        {products.length > 0 && !loading && (
          <View style={styles.productDetailsWrap}>
            <Text style={styles.formValue}>{I18n.t('product_details')}</Text>
            <TransparentButton
              buttonText={I18n.t('edit')}
              onPress={() => setEditQuantity(true)}
              padding={0}
              icon={<Icon name='edit' color='#EA2553' />}
              extraStyle={{ marginRight: 0 }}
            />
          </View>
        )}

        {!editQuantity && products.length > 0 && !loading && (
          <>
            {products.map((item, index) => {
              return (
                <View key={index.toString()} style={styles.formTitleContainer}>
                  <Text style={[styles.formValue, { fontSize: 10 }]}>
                    {`${I18n.t('total_quantity')} of ${item.name} (Kg)`}
                  </Text>
                  <View style={styles.productQuantity}>
                    <Text style={styles.formValue}>
                      {parseFloat(item.total_quantity * item.ratio)
                        .toLocaleString('id')
                        .replace(/\./g, '')}
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
                    placeholder={`${I18n.t('total_quantity')} of ${
                      item.name
                    } (Kg) *`}
                    value={products[index].edited_quantity
                      .toLocaleString('id')
                      .replace(/\./g, '')}
                    onChangeText={(text) =>
                      updateQuantity(text, index, item.total_quantity)}
                    color={theme.text_1}
                    keyboardType='number-pad'
                    extraStyle={{ width: '100%' }}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      updateQuantity(
                        item.total_quantity,
                        index,
                        item.total_quantity,
                      )}
                    style={styles.resetWrap}
                    hitSlop={HIT_SLOP_TEN}
                  >
                    <Icon name='Reset' color='#EA2553' size={16} />
                    <Text style={styles.resetText}>{I18n.t('reset')}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {products.length > 0 && !loading && (
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
                  {`${getTotalAmount().toLocaleString('pt-BR')} ${currency}`}
                </Text>
              </View>
            </View>

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
                  {`${Math.round(parseFloat(premium.total)).toLocaleString(
                    'pt-BR',
                  )} ${currency}`}
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
                {`${getAllTotalAmount().toLocaleString('pt-BR')} ${currency}`}
              </Text>
            </View>
          </View>
        )}

        {getTotalAmount() > 0 && (
          <CustomButton
            buttonText={I18n.t('next')}
            onPress={() => confirmSend()}
            extraStyle={{ width: '90%', marginBottom: 10 }}
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
            />
          </View>
        )}
      </ScrollView>
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
}) => {
  const [type, setType] = useState(1);
  const radioProps = [
    { label: I18n.t('loss'), value: 1 },
    // { label: I18n.t('partial_delivery'), value: 2 },
  ];

  const styles = StyleSheetFactory(theme);

  return (
    <Modal
      animationType='slide'
      transparent
      visible={OpenModal}
      onRequestClose={() => {
        onCloseModal();
      }}
    >
      <View style={styles.modalWrap}>
        <View style={styles.modalInnerWrap}>
          <ScrollView
            style={styles.modalView}
            showsVerticalScrollIndicator={false}
          >
            <View>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {I18n.t('reason_for_quantity_change')}
                </Text>
                <TouchableOpacity
                  style={{ alignItems: 'flex-end', paddingHorizontal: 20 }}
                  onPress={onCloseModal}
                >
                  <Icon name='Close' size={25} color={theme.text_1} />
                </TouchableOpacity>
              </View>
              <View style={{ marginHorizontal: 30, marginVertical: 20 }}>
                <Text style={styles.reasonText}>{I18n.t('select_reason')}</Text>
                <RadioForm
                  radio_props={radioProps}
                  initial={0}
                  onPress={(value) => setType(value)}
                  borderWidth={1}
                  buttonSize={10}
                  buttonOuterSize={20}
                  labelStyle={styles.labelStyle}
                  style={{ marginHorizontal: 10, marginBottom: 0 }}
                />
              </View>
              <View style={styles.editModalCardContainer}>
                {products.map((item, index) => (
                  <View key={index.toString()} style={{ width: '100%' }}>
                    {item.total_quantity !==
                      item.edited_quantity.toString().replace(/,/g, '.') && (
                      <View
                        style={[
                          {
                            width: '100%',
                            marginTop: 10,
                            flexDirection: 'row',
                          },
                        ]}
                      >
                        <View style={{ marginHorizontal: 10 }}>
                          <Icon name='info' color={theme.text_1} size={15} />
                        </View>
                        <Text style={styles.lossText}>
                          {`${item.name} - ${(
                            parseFloat(item.total_quantity) -
                            parseFloat(
                              item.edited_quantity.toString().replace(',', '.'),
                            )
                          ).toLocaleString('pt-BR')} Kg ${I18n.t(
                            'will_be_considered_as_loss',
                          )}`}
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
                      {totalEditedQuantity.toLocaleString('pt-BR')}
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
            <View style={styles.buttonsWrap}>
              <TransparentButton
                buttonText={I18n.t('back')}
                onPress={() => onCloseModal()}
                color='#EA2553'
                paddingHorizontal={45}
              />
              <TouchableOpacity
                onPress={() => {
                  onCloseModal();
                  onNext(type);
                }}
                style={[
                  styles.buttonContainer,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    {
                      color: theme.background_1,
                      paddingHorizontal: 45,
                    },
                  ]}
                >
                  {I18n.t('next')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
    formTitleContainer: {
      marginVertical: 10,
    },
    formTitle: {
      color: theme.text_2,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 10,
      marginBottom: 10,
    },
    formValue: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 18,
    },
    cardContainer: {
      marginVertical: 20,
      padding: 10,
      backgroundColor: theme.background_2,
      borderRadius: theme.border_radius,
    },
    cardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      marginVertical: 8,
      marginHorizontal: 10,
    },
    cardLeftItem: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 13,
      color: theme.text_1,
      opacity: 0.7,
      letterSpacing: 0.2,
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 13,
      color: theme.text_1,
    },
    dottedLine: {
      borderStyle: 'dotted',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      borderColor: theme.text_2,
      marginHorizontal: 0,
      marginTop: 5,
    },
    buttonContainer: {
      backgroundColor: theme.background_1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: theme.primary,
      marginHorizontal: 25,
      flexDirection: 'row',
      zIndex: 1,
    },
    buttonText: {
      color: theme.primary,
      fontFamily: theme.font_regular,
      paddingHorizontal: 10,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    productDetailsWrap: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 10,
    },
    productQuantity: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    resetWrap: {
      right: 20,
      position: 'absolute',
      top: 25,
      flexDirection: 'row',
    },
    resetText: {
      fontFamily: 'Moderat-Regular',
      fontSize: 14,
      flexDirection: 'row',
      color: '#EA2553',
      marginLeft: 5,
    },
    priceDetails: {
      fontFamily: theme.font_regular,
      fontWeight: '500',
      fontStyle: 'normal',
      fontSize: 16,
      color: theme.text_1,
      opacity: 1,
      letterSpacing: 0.2,
      textTransform: 'none',
      marginVertical: 10,
      marginBottom: 0,
      marginLeft: 10,
    },
    modalWrap: {
      flex: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.2)',
    },
    modalInnerWrap: {
      height: '55%',
      marginTop: 'auto',
      backgroundColor: theme.background_1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',

      justifyContent: 'space-between',
    },
    modalTitle: {
      color: theme.text_1,
      fontSize: 20,
      fontFamily: 'Moderat-Medium',
      margin: 25,
    },
    reasonText: {
      fontFamily: 'Moderat-Medium',
      fontSize: 16,
      flexDirection: 'row',
      width: '95%',
      color: theme.text_1,
      marginBottom: 20,
    },
    buttonsWrap: {
      marginVertical: 10,
      marginHorizontal: 10,
      flexDirection: 'row',
      justifyContent: 'space-around',
      height: 50,
    },
    labelStyle: {
      fontSize: 16,
      color: theme.text_1,
      fontFamily: 'Moderat-Regular',
    },
    editModalCardContainer: {
      width: '85%',
      alignSelf: 'center',
      marginVertical: width * 0.05,
      padding: 10,
      backgroundColor: theme.background_2,
    },
    lossText: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 14,
      color: theme.text_1,
      opacity: 1,
      letterSpacing: 0.2,
      width: '85%',
      textTransform: 'none',
    },
  });
};

export default SendScreen;
