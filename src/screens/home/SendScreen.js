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
  ToastAndroid,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import RadioForm from 'react-native-simple-radio-button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { getAllProducts } from '../../services/productsHelper';
import { findBatchByProductId } from '../../services/batchesHelper';
import {
  findTransactionById,
  getAllTransactions,
} from '../../services/transactionsHelper';
import {
  getAllTransactionPremiums,
  findAllPremiumsByTransaction,
} from '../../services/transactionPremiumHelper';
import {
  getAllPremiums,
  findPremiumByServerId,
} from '../../services/premiumsHelper';
import { findAllPremiumsByProduct } from '../../services/productPremiumHelper';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import CustomButton from '../../components/CustomButton';
import Icon from '../../icons';
import TransparentButton from '../../components/TransparentButton';
import FormTextInput from '../../components/FormTextInput';
import I18n from '../../i18n/i18n';
import * as consts from '../../services/constants';

const { width } = Dimensions.get('window');

const SendScreen = ({ navigation, route }) => {
  const { locationAllowed } = route.params;
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

  const setupInitialValues = async () => {
    setLoading(true);
    if (locationAllowed) {
      fetchLocation();
    }

    await AsyncStorage.setItem('transactionStatus', JSON.stringify({}));

    const allProducts = await getAllProducts();

    const firstProduct = allProducts?.[0] ?? null;
    setSelectedProduct(firstProduct);

    initiatevalues(allProducts, true);
  };

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

  const groupBy = (arr, property) => {
    return arr.reduce((memo, x) => {
      if (!memo[x[property]]) {
        memo[x[property]] = [];
      }
      memo[x[property]].push(x);
      return memo;
    }, {});
  };

  const initiatevalues = async (products) => {
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
          ToastAndroid.show(I18n.t('errored_buy_found'), ToastAndroid.LONG);
        }

        const totalQuantity = batches.reduce((total, batch) => {
          return total + parseFloat(batch.current_quantity);
        }, 0);

        const transactionIds = [
          ...new Set(batches.map((item) => item.transaction_id)),
        ];

        const filteredTrasactions = transactions.filter((tx) => {
          return transactionIds.includes(tx.id);
        });

        const totalAmount = filteredTrasactions.reduce((total, tx) => {
          return total + Math.round(tx.total);
        }, 0);

        // finding total quantity that are applied with premium
        let premiumedQuantity = 0;
        transactionIds.map(async (trans) => {
          const apppliedPremiums = await findAllPremiumsByTransaction(trans);
          if (apppliedPremiums.length > 0) {
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
          ...new Set(filteredTrasactions.map((item) => item.node_id)),
        ];
        setAllNodes((allNodes) => [...allNodes, ...nodes]);

        product.batches = batches;
        product.total_amount_premiums = totalAmount + otherPremiumAmount;
        product.total_amount = totalAmount - total; // baseprice
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

  // fetching send premiums
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

            if (
              p.applicable_activity === consts.PREMIUM_APPLICABLE_ACTIVITY_SELL
            ) {
              otherPremiums.push(p);
            }
          }
        }),
      );

      return otherPremiums;
    }
    return [];
  };

  const backNavigation = () => {
    navigation.goBack(null);
  };

  const toggleModal = () => {
    setModalOpen(!onModalOpen);
  };

  const updateQuantity = (quantity, index, totalQuantity) => {
    const quantityEdited = quantity.toString().replace(',', '.');

    if (parseFloat(totalQuantity) > 0) {
      if (
        quantity !== '' &&
        parseFloat(quantityEdited) > parseFloat(totalQuantity)
      ) {
        ToastAndroid.show(
          `${I18n.t(
            'edited_quantity_cannot_exceed_actual',
          )} ${totalQuantity}Kg`,
          ToastAndroid.SHORT,
        );
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

  const ratioCompare = () => {
    const changed = products.filter((i) => {
      return i.ratio !== 1;
    });
    if (changed.length > 0) {
      return true;
    }
    return false;
  };

  const validateDatas = async () => {
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
        } else if (editedQuantity <= consts.MINIMUM_TRANSACTION_QUANTITY) {
          errorMsg = `${I18n.t('quantity_of')} ${product.name} ${I18n.t(
            'must_be_greater_than',
          )} ${consts.MINIMUM_TRANSACTION_QUANTITY}Kg.`;
          valid = false;
        } else if (editedQuantity >= consts.MAXIMUM_TRANSACTION_QUANTITY) {
          errorMsg = `${I18n.t('quantity_of')} ${product.name} ${I18n.t(
            'must_be_lower_than',
          )} ${consts.MAXIMUM_TRANSACTION_QUANTITY}Kg.`;
          valid = false;
        }
      }),
    );

    if (valid) {
      return true;
    }
    ToastAndroid.show(errorMsg, ToastAndroid.SHORT);
    return false;
  };

  const confirmBuy = async () => {
    const total = getTotalAmount();
    if (total > 0) {
      const valid = await validateDatas();
      if (valid) {
        if (ratioCompare()) {
          setModalOpen(true);
        } else {
          onNext();
        }
      }
    } else {
      ToastAndroid.show(
        I18n.t('total_amount_must_greater_0'),
        ToastAndroid.SHORT,
      );
    }
  };

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

  const getProductName = (name) => {
    if (name.includes('Nutmeg')) {
      return 'Nutmeg';
    }
    return name;
  };

  const getTotalAmount = () => {
    let total = 0;
    products.map((product) => {
      total += product.total_amount * product.ratio;
    });

    return Math.round(parseFloat(total));
  };

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

          if (
            premium.applicable_activity ===
            consts.PREMIUM_APPLICABLE_ACTIVITY_BUY
          ) {
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

  // get all amount including premiums
  const getAllTotalAmount = () => {
    let total = 0;

    products.map((product) => {
      const productEditedQuantity =
        product.edited_quantity !== '' ? product.edited_quantity : 0;
      const productRatio = product.ratio !== '' ? product.ratio : 0;

      total += parseFloat(product.total_amount) * parseFloat(productRatio);

      product.total_premiums.map((premium) => {
        if (
          premium.applicable_activity === consts.PREMIUM_APPLICABLE_ACTIVITY_BUY
        ) {
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

  const getTotalFarmerCount = () => {
    const nodes = allNodes;
    const uniqueNodes = [...new Set(nodes)];
    return uniqueNodes.length;
  };

  const getTotalEditedQuantity = () => {
    const total = products.reduce((a, b) => {
      return a + parseFloat(b.edited_quantity.toString().replace(',', '.'));
    }, 0);
    return total;
  };

  return (
    <View style={styles.container}>
      <CustomLeftHeader
        backgroundColor={consts.APP_BG_COLOR}
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

        {loading && (
          <ActivityIndicator size='small' color={consts.TEXT_PRIMARY_COLOR} />
        )}

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
                    color={consts.TEXT_PRIMARY_COLOR}
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
                    hitSlop={consts.HIT_SLOP_TEN}
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
          <View style={[styles.cardContainer]}>
            <View style={{ marginVertical: 5, paddingVertical: 0 }}>
              <Text style={styles.priceDetails}>{I18n.t('price_details')}</Text>
            </View>
            <View style={[styles.cardItem, { marginTop: 15 }]}>
              <Text
                style={[
                  styles.cardLeftItem,
                  { color: consts.TEXT_PRIMARY_COLOR, width: '70%' },
                ]}
              >
                {`${I18n.t('total_paid_to_farmers')}:`}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <Text
                  style={[
                    styles.cardRightItem,
                    {
                      color: consts.TEXT_PRIMARY_COLOR,
                    },
                  ]}
                >
                  {`${getTotalAmount().toLocaleString('pt-BR')} ${currency}`}
                </Text>
              </View>
            </View>

            {getTotalPremiums().map((premium, index) => (
              <View key={index.toString()} style={styles.cardItem}>
                <Text
                  style={[
                    styles.cardLeftItem,
                    { color: consts.TEXT_PRIMARY_COLOR },
                  ]}
                >
                  {`${premium.name} ${I18n.t('paid')}:`}
                </Text>
                <Text
                  style={[
                    styles.cardRightItem,
                    {
                      fontWeight: '600',
                      color: consts.TEXT_PRIMARY_COLOR,
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
                    color: consts.TEXT_PRIMARY_COLOR,
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
                    color: consts.TEXT_PRIMARY_COLOR,
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
            onPress={() => confirmBuy()}
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
}) => {
  const [type, setType] = useState(1);
  const radioProps = [
    { label: I18n.t('loss'), value: 1 },
    // { label: I18n.t('partial_delivery'), value: 2 },
  ];

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
                  <Icon
                    name='Close'
                    size={25}
                    color={consts.TEXT_PRIMARY_COLOR}
                  />
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
              <View style={styles.editModalCardConrainer}>
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
                          <Icon
                            name='info'
                            color={consts.TEXT_PRIMARY_COLOR}
                            size={15}
                          />
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
                      { color: consts.TEXT_PRIMARY_COLOR, width: '70%' },
                    ]}
                  >
                    {`${I18n.t('total_quantity_delivering')} (Kg):`}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    <Text
                      style={[
                        styles.cardRightItem,
                        {
                          color: consts.TEXT_PRIMARY_COLOR,
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
                      { color: consts.TEXT_PRIMARY_COLOR, width: '70%' },
                    ]}
                  >
                    {`${I18n.t('balance_quantity_available')} (Kg):`}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    <Text
                      style={[
                        styles.cardRightItem,
                        { color: consts.TEXT_PRIMARY_COLOR },
                      ]}
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
                  { backgroundColor: consts.COLOR_PRIMARY },
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    {
                      color: consts.APP_BG_COLOR,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: consts.APP_BG_COLOR,
    paddingHorizontal: width * 0.05,
  },
  formTitleContainer: {
    marginVertical: 10,
  },
  formTitle: {
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 10,
    marginBottom: 10,
  },
  formValue: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 18,
  },
  cardContainer: {
    marginVertical: 20,
    padding: 10,
    backgroundColor: consts.CARD_BACKGROUND_COLOR,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    marginVertical: 8,
    marginHorizontal: 10,
  },
  cardLeftItem: {
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 13,
    color: consts.TEXT_PRIMARY_COLOR,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  cardRightItem: {
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 13,
    color: consts.TEXT_PRIMARY_COLOR,
  },
  dottedLine: {
    borderStyle: 'dotted',
    borderWidth: 1,
    borderRadius: consts.BORDER_RADIUS,
    borderColor: consts.TEXT_PRIMARY_LIGHT_COLOR,
    marginHorizontal: 0,
    marginTop: 5,
  },
  buttonContainer: {
    backgroundColor: consts.APP_BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: consts.COLOR_PRIMARY,
    marginHorizontal: 25,
    flexDirection: 'row',
    zIndex: 1,
  },
  buttonText: {
    color: consts.COLOR_PRIMARY,
    fontFamily: consts.FONT_REGULAR,
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
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '500',
    fontStyle: 'normal',
    fontSize: 16,
    color: consts.TEXT_PRIMARY_COLOR,
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
    backgroundColor: consts.APP_BG_COLOR,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    justifyContent: 'space-between',
  },
  modalTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 20,
    fontFamily: 'Moderat-Medium',
    margin: 25,
  },
  reasonText: {
    fontFamily: 'Moderat-Medium',
    fontSize: 16,
    flexDirection: 'row',
    width: '95%',
    color: consts.TEXT_PRIMARY_COLOR,
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
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: 'Moderat-Regular',
  },
  editModalCardConrainer: {
    width: '85%',
    alignSelf: 'center',
    marginVertical: width * 0.05,
    padding: 10,
    backgroundColor: consts.CARD_BACKGROUND_COLOR,
  },
  lossText: {
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 14,
    color: consts.TEXT_PRIMARY_COLOR,
    opacity: 1,
    letterSpacing: 0.2,
    width: '85%',
    textTransform: 'none',
  },
});

export default SendScreen;
