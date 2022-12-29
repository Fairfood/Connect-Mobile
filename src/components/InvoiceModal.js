import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';

import CustomLeftHeader from './CustomLeftHeader';
import * as consts from '../services/constants';
import I18n from '../i18n/i18n';

const InvoiceModal = ({ openSetUpModal, closeModal, imageUri }) => {
  return (
    <Modal
      animationType='slide'
      transparent
      visible={openSetUpModal}
      onRequestClose={closeModal}
    >
      <View style={styles.container}>
        <CustomLeftHeader
          backgroundColor={consts.APP_BG_COLOR}
          title={I18n.t('invoice_details')}
          leftIcon='arrow-left'
          onPress={closeModal}
          extraStyle={{ marginLeft: 10 }}
        />
        <View style={styles.container}>
          <FastImage
            source={{ uri: imageUri, priority: FastImage.priority.high }}
            style={styles.invoiceImage}
            resizeMode={FastImage.resizeMode.contain}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: consts.APP_BG_COLOR,
  },
  invoiceImage: {
    height: '100%',
    width: '100%',
    borderWidth: 1,
    backgroundColor: '#000000',
    alignSelf: 'center',
  },
});

export default InvoiceModal;
