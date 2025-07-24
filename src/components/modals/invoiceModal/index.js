import React from 'react';
import { View, Modal } from 'react-native';
import FastImage from 'react-native-fast-image';

import CustomLeftHeader from '../../headers/customLeftHeader';
import I18n from '../../../translations/text/i18n';
import StyleSheetFactory from './styles';

const InvoiceModal = ({ openSetUpModal, closeModal, imageUri }) => {
  const styles = StyleSheetFactory();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={openSetUpModal}
      onRequestClose={closeModal}
    >
      <View style={styles.container}>
        <CustomLeftHeader
          title={I18n.t('invoice_details')}
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

export default InvoiceModal;
