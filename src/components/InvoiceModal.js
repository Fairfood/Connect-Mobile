import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';

import CustomLeftHeader from './CustomLeftHeader';
import I18n from '../i18n/i18n';

const InvoiceModal = ({ openSetUpModal, closeModal, imageUri }) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <Modal
      animationType='slide'
      transparent
      visible={openSetUpModal}
      onRequestClose={closeModal}
    >
      <View style={styles.container}>
        <CustomLeftHeader
          backgroundColor={theme.background_1}
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

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    invoiceImage: {
      height: '100%',
      width: '100%',
      borderWidth: 1,
      backgroundColor: '#000000',
      alignSelf: 'center',
    },
  });
};

export default InvoiceModal;
