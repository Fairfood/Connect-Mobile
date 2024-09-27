/* eslint-disable camelcase */
/**
 * Database migration file.
 * Migrating app database from Watermelondb to Realm.
 * This file will be delete on next app release after migration.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  Image,
  ImageBackground,
} from 'react-native';
import { useSelector } from 'react-redux';
import * as Progress from 'react-native-progress';
import I18n from '../i18n/i18n';
import CustomButton from '../components/CustomButton';

import { store } from '../redux/store';
import { realm } from './Configuration';
import { searchCardById, getAllCards } from '../services/cardsHelper';
import { findFarmerById, getAllFarmers } from '../services/farmersHelper';
import { searchPremiumById, getAllPremiums } from '../services/premiumsHelper';
import { getAllProductPremiums } from '../services/productPremiumHelper';
import { findProductById, getAllProducts } from '../services/productsHelper';
import {
  findTransactionById,
  getAllTransactions,
} from '../services/transactionsHelper';
import {
  createCard,
  fetchAllCards,
  findCardByServerId,
  updateCard,
} from './services/CardHelper';
import {
  createFarmer,
  fetchAllFarmers,
  fetchFarmerByServerId,
} from './services/FarmerHelper';
import {
  createPremium,
  fetchAllPremiums,
  searchPremiumByServerId,
} from './services/PremiumsHelper';
import {
  createProductPremium,
  fetchAllProductPremiums,
} from './services/ProductPremiumHelper';
import {
  createProduct,
  fetchAllProducts,
  fetchProductByServerId,
} from './services/ProductsHelper';
import {
  createTransaction,
  fetchAllTransactions,
  fetchTransactionByServerId,
  updateTransaction,
} from './services/TransactionsHelper';
import { getAllTransactionPremiums } from '../services/transactionPremiumHelper';
import {
  createTransactionPremium,
  fetchAllTransactionPremiums,
  updateTransactionPremium,
  updateTransactionPremiumDestination,
} from './services/TransactionPremiumHelper';
import { findBatchById, getAllBatches } from '../services/batchesHelper';
import {
  createBatch,
  fetchAllBatches,
  findBatchesByServerId,
  updateBatchNew,
} from './services/BatchHelper';
import { getAllSourceBatches } from '../services/sourceBatchesHelper';
import {
  createSourceBatch,
  fetchAllSourceBatches,
  updateSourceBatch,
} from './services/SourceBatchHelper';
import {
  migrationCompleted,
  startMigrationProcess,
  updateMigrationPercentage,
} from '../redux/CommonStore';
import captureSentry from '../services/sentryHelper';
import { PAYMENT_OUTGOING } from '../services/constants';

const { width, height } = Dimensions.get('window');

export const startDbMigration = async () => {
  realm.write(() => {
    realm.deleteAll();
  });

  store.dispatch(startMigrationProcess());
  products();
};

export const products = async () => {
  try {
    const allProducts = await getAllProducts();
    allProducts.forEach(async (product) => {
      const { _raw } = product;
      _raw.id = _raw.server_id;
      await createProduct(_raw);
    });

    const newProducts = await fetchAllProducts();
    if (allProducts.length === newProducts.length) {
      premiums();
    } else {
      throw new Error('mismatch in product count after migration');
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const premiums = async () => {
  try {
    const allPremiums = await getAllPremiums();
    allPremiums.forEach(async (premium) => {
      const { _raw } = premium;
      _raw.id = _raw.server_id;
      _raw.included = _raw.included_in_amt;
      _raw.dependant_on_card = _raw.is_card_dependent;
      await createPremium(_raw);
    });

    const newPremiums = await fetchAllPremiums();
    if (allPremiums.length === newPremiums.length) {
      store.dispatch(updateMigrationPercentage(20));
      productPremiums();
    } else {
      throw new Error('mismatch in premium count after migration');
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const productPremiums = async () => {
  try {
    const allProductPremiums = await getAllProductPremiums();
    allProductPremiums.forEach(async (productPremium) => {
      const { product_id, premium_id } = productPremium._raw;
      await createProductPremium(product_id, premium_id);
    });

    const newProductPremiums = await fetchAllProductPremiums();
    if (allProductPremiums.length === newProductPremiums.length) {
      store.dispatch(updateMigrationPercentage(30));
      nodes();
    } else {
      throw new Error('mismatch in productPremium count after migration');
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const nodes = async () => {
  try {
    const allFarmers = await getAllFarmers();
    allFarmers.forEach(async (farmer) => {
      const { _raw } = farmer;
      _raw.id = _raw.server_id;
      await createFarmer(_raw);
    });

    const newFarmers = await fetchAllFarmers();
    if (allFarmers.length === newFarmers.length) {
      store.dispatch(updateMigrationPercentage(40));
      cards();
    } else {
      throw new Error('mismatch in node count after migration');
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const cards = async () => {
  try {
    const allCards = await getAllCards();
    allCards.forEach(async (card) => {
      const { _raw } = card;
      await createCard(_raw);
    });

    const newCards = await fetchAllCards();
    if (allCards.length === newCards.length) {
      store.dispatch(updateMigrationPercentage(50));
      transactions();
    } else {
      throw new Error('mismatch in card count after migration');
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const transactions = async () => {
  try {
    const allTransactions = await getAllTransactions();
    allTransactions.forEach(async (transaction) => {
      const { _raw } = transaction;
      await createTransaction(_raw);
    });

    const newTransactions = await fetchAllTransactions();
    if (allTransactions.length === newTransactions.length) {
      store.dispatch(updateMigrationPercentage(60));
      transactionPremiums();
    } else {
      throw new Error('mismatch in transaction count after migration');
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const transactionPremiums = async () => {
  try {
    const allTransactionPremiums = await getAllTransactionPremiums();
    allTransactionPremiums.forEach(async (transactionPremium) => {
      const { _raw } = transactionPremium;
      await createTransactionPremium(_raw);
    });

    const newTransactionPremiums = await fetchAllTransactionPremiums();
    if (allTransactionPremiums.length === newTransactionPremiums.length) {
      store.dispatch(updateMigrationPercentage(70));
      batches();
    } else {
      throw new Error('mismatch in transactionPremium count after migration');
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const batches = async () => {
  try {
    const allBatches = await getAllBatches();

    allBatches.forEach(async (batch) => {
      const { _raw } = batch;
      await createBatch(_raw);
    });

    const newBatches = await fetchAllBatches();
    if (allBatches.length === newBatches.length) {
      store.dispatch(updateMigrationPercentage(80));
      sourcesBatches();
    } else {
      throw new Error('mismatch in batch count after migration');
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const sourcesBatches = async () => {
  try {
    const allSourceBatches = await getAllSourceBatches();

    allSourceBatches.forEach(async (sourceBatch) => {
      const { _raw } = sourceBatch;
      await createSourceBatch(_raw);
    });

    const newSourceBatches = await fetchAllSourceBatches();
    if (allSourceBatches.length === newSourceBatches.length) {
      store.dispatch(updateMigrationPercentage(90));
      updateBatchObjects();
    } else {
      throw new Error('mismatch in sourcesBatch count after migration');
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

// updating all local reference ids in batch objects
export const updateBatchObjects = async () => {
  try {
    const allBatches = await fetchAllBatches();
    const batchesWithLocals = allBatches.filtered(
      'product_id != "" || transaction_id != ""',
    );

    batchesWithLocals.map(async (batch) => {
      let product_id = '';
      let transaction_id = '';

      if (batch.product_id !== '') {
        const productDetails = await findProductById(batch.product_id);
        if (productDetails) {
          const product = await fetchProductByServerId(
            productDetails._raw.server_id,
          );
          product_id = product[0].id;
        }
      }

      if (batch.transaction_id !== '') {
        const transactionDetails = await findTransactionById(
          batch.transaction_id,
        );
        if (transactionDetails) {
          const transaction = await fetchTransactionByServerId(
            transactionDetails._raw.server_id,
          );
          transaction_id = transaction[0].id;
        }
      }

      const updates = {};
      if (product_id !== '') {
        updates.product_id = product_id;
      }

      if (transaction_id !== '') {
        updates.transaction_id = transaction_id;
      }

      await updateBatchNew(batch.id, updates);
    });

    updateCardObjects();
  } catch (error) {
    captureSentry('error', error);
  }
};

// updating all local reference ids in card objects
export const updateCardObjects = async () => {
  try {
    const allCards = await fetchAllCards();
    const cardWithNodeId = allCards.filtered('node_id != ""');
    cardWithNodeId.map(async (card) => {
      const nodeDetails = await findFarmerById(card.node_id);
      if (nodeDetails) {
        const farmer = await fetchFarmerByServerId(nodeDetails._raw.server_id);
        const update = {
          node_id: farmer[0].id,
        };
        await updateCard(card.id, update);
      }
    });

    updateSourceBatchObjects();
  } catch (error) {
    captureSentry('error', error);
  }
};

// updating all local reference ids in sourceBatch objects
export const updateSourceBatchObjects = async () => {
  try {
    const sourceBatches = await fetchAllSourceBatches();
    const sourceBatchWithLocals = sourceBatches.filtered(
      'transaction_id != "" || batch_id != ""',
    );

    sourceBatchWithLocals.map(async (sourceBatch) => {
      let transaction_id = '';
      let batch_id = '';

      if (sourceBatch.transaction_id !== '') {
        const transactionDetails = await findTransactionById(
          sourceBatch.transaction_id,
        );
        if (transactionDetails) {
          const transaction = await fetchTransactionByServerId(
            transactionDetails._raw.server_id,
          );
          transaction_id = transaction[0].id;
        }
      }

      if (sourceBatch.batch_id !== '') {
        const batchDetails = await findBatchById(sourceBatch.batch_id);
        if (batchDetails) {
          const batch = await findBatchesByServerId(
            batchDetails._raw.server_id,
          );
          batch_id = batch[0].id;
        }
      }

      const updates = {};
      if (transaction_id !== '') {
        updates.transaction_id = transaction_id;
      }

      if (batch_id !== '') {
        updates.batch_id = batch_id;
      }

      await updateSourceBatch(sourceBatch.id, updates);
    });

    updateTransactionObjects();
  } catch (error) {
    captureSentry('error', error);
  }
};

// updating all local reference ids in transaction objects
export const updateTransactionObjects = async () => {
  try {
    const allTransaction = await fetchAllTransactions();
    const transactionWithLocals = allTransaction.filtered(
      'node_id != "" || product_id != "" || card_id != ""',
    );

    transactionWithLocals.map(async (transaction) => {
      let node_id = '';
      let product_id = '';
      let card_id = '';

      if (transaction.node_id !== '') {
        const nodeDetails = await findFarmerById(transaction.node_id);
        if (nodeDetails) {
          const farmer = await fetchFarmerByServerId(
            nodeDetails._raw.server_id,
          );
          node_id = farmer[0].id;
        }
      }

      if (transaction.product_id !== '') {
        const productDetails = await findProductById(transaction.product_id);
        if (productDetails) {
          const product = await fetchProductByServerId(
            productDetails._raw.server_id,
          );
          product_id = product[0].id;
        }
      }

      if (transaction.card_id !== '') {
        const cardDetails = await searchCardById(transaction.card_id);
        if (cardDetails.length > 0) {
          const card = await findCardByServerId(cardDetails[0]._raw.server_id);
          card_id = card[0].id;
        } else {
          const card = await findCardByServerId(transaction.card_id);
          card_id = card.length > 0 ? card[0].id : '';
        }
      }

      const updates = {};
      if (node_id !== '') {
        updates.node_id = node_id;
      }

      if (product_id !== '') {
        updates.product_id = product_id;
      }

      if (card_id !== '') {
        updates.card_id = card_id;
      }

      await updateTransaction(transaction.id, updates);
    });

    updateTransactionPremiumNodeIds();
  } catch (error) {
    captureSentry('error', error);
  }
};

// updating all local reference ids in transactionPremium objects
export const updateTransactionPremiumNodeIds = async () => {
  try {
    const allTransactionPremiums = await fetchAllTransactionPremiums();
    const transactionPremiumWithNodeIds = allTransactionPremiums.filtered(
      'type == $0 && node_id == destination',
      PAYMENT_OUTGOING,
    );

    transactionPremiumWithNodeIds.map(async (transactionPremium) => {
      const { destination, id } = transactionPremium;

      // updating destination if the transaction was direct_buy
      const destinationFarmer = await findFarmerById(destination);
      if (destinationFarmer) {
        const farmerServerId = destinationFarmer._raw.server_id;
        await updateTransactionPremiumDestination(id, farmerServerId);
      }
    });

    updateTransactionPremiumObjects();
  } catch (error) {
    captureSentry('error', error);
  }
};

// updating all local reference ids in transactionPremium objects
export const updateTransactionPremiumObjects = async () => {
  try {
    const allTransactionPremiums = await fetchAllTransactionPremiums();
    const transactionPremiumWithLocals = allTransactionPremiums.filtered(
      'transaction_id != "" || premium_id != ""',
    );

    transactionPremiumWithLocals.map(async (transactionPremium) => {
      let transaction_id = '';
      let premium_id = '';

      if (transactionPremium.transaction_id !== '') {
        const transactionDetails = await findTransactionById(
          transactionPremium.transaction_id,
        );
        if (transactionDetails) {
          const transaction = await fetchTransactionByServerId(
            transactionDetails._raw.server_id,
          );
          transaction_id = transaction[0].id;
        }
      }

      if (transactionPremium.premium_id !== '') {
        const premiumDetails = await searchPremiumById(
          transactionPremium.premium_id,
        );

        if (premiumDetails.length > 0) {
          const premium = await searchPremiumByServerId(
            premiumDetails[0]._raw.server_id,
          );
          premium_id = premium[0].id;
        } else {
          const premium = await searchPremiumByServerId(
            transactionPremium.premium_id,
          );
          premium_id = premium.length > 0 ? premium[0].id : '';
        }
      }

      const updates = {};
      if (transaction_id !== '') {
        updates.transaction_id = transaction_id;
      }

      if (premium_id !== '') {
        updates.premium_id = premium_id;
      }

      await updateTransactionPremium(transactionPremium.id, updates);
    });

    stopDbMigration();
  } catch (error) {
    captureSentry('error', error);
  }
};

export const stopDbMigration = async () => {
  store.dispatch(migrationCompleted());
};

export const MigrationModal = ({ visible, onSubmit }) => {
  const { theme, migration, migrationPercentage } = useSelector(
    (state) => state.common,
  );
  const styles = StyleSheetFactory(theme);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.container}>
        <View style={styles.topSection}>
          <ImageBackground
            source={require('../assets/images/alert-bg.png')}
            style={styles.imageWrap}
          >
            {migration ? (
              <Image
                source={require('../assets/images/migration_complete.png')}
                style={styles.imageWrapSub2}
              />
            ) : (
              <Image
                source={require('../assets/images/migration_processing.png')}
                style={styles.imageWrapSub}
              />
            )}
          </ImageBackground>
        </View>
        <View style={styles.contentWrap}>
          {migration ? (
            <Text style={styles.titleText}>
              {I18n.t('db_migration_completed')}
            </Text>
          ) : (
            <Text style={styles.titleText}>{I18n.t('db_migration')}</Text>
          )}

          {migration ? (
            <Text style={styles.messageText3}>
              {I18n.t('db_migration_msg_3')}
            </Text>
          ) : (
            <Text style={styles.messageText1}>
              {I18n.t('db_migration_msg_1')}
            </Text>
          )}

          {!migration && (
            <View>
              <View style={styles.progressBarTitleWrap}>
                <Text style={styles.progressBarTitle}>
                  {I18n.t('db_migrating')}
                </Text>
                <Text style={styles.progressBarPercentage}>
                  {`${migrationPercentage || 0}%`}
                </Text>
              </View>
              <Progress.Bar
                progress={migrationPercentage ? migrationPercentage / 100 : 0}
                width={width * 0.88}
                height={8}
                color="#27AE60"
              />
              <Text style={styles.messageText2}>
                {I18n.t('db_migration_msg_2')}
              </Text>
            </View>
          )}

          {migration && (
            <View style={styles.buttonWrap}>
              <CustomButton
                buttonText={I18n.t('continue')}
                onPress={onSubmit}
                extraStyle={{
                  width: '100%',
                }}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.4)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    topSection: {
      width: '100%',
      height: height * 0.27,
      backgroundColor: '#ffffff',
    },
    imageWrap: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageWrapSub: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    imageWrapSub2: {
      width: '70%',
      height: '70%',
      resizeMode: 'contain',
    },
    contentWrap: {
      width: '100%',
      backgroundColor: '#ffffff',
      paddingHorizontal: width * 0.06,
      paddingBottom: width * 0.06,
    },
    titleText: {
      color: theme.text_1,
      fontSize: 20,
      fontFamily: theme.font_bold,
      marginBottom: 5,
    },
    messageText1: {
      color: theme.icon_error,
      fontSize: 13,
      fontFamily: theme.font_regular,
    },
    messageText2: {
      color: theme.text_2,
      fontSize: 13,
      fontFamily: theme.font_regular,
      marginTop: height * 0.02,
    },
    messageText3: {
      color: theme.text_1,
      fontSize: 13,
      fontFamily: theme.font_regular,
    },
    buttonWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: height * 0.035,
    },
    progressBarTitleWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: height * 0.035,
      marginBottom: height * 0.01,
    },
    progressBarTitle: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    progressBarPercentage: {
      color: theme.text_2,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
  });
};
