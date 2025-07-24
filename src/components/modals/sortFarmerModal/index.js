import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import I18n from '../../../translations/text/i18n';
import StyleSheetFactory from './styles';

const SortFarmerModal = ({ ...props }) => {
  const { visible, hideModal, data, onSelectItem, activeValue } = props;
  const styles = StyleSheetFactory();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={hideModal}
    >
      <TouchableOpacity onPress={hideModal} style={styles.modalContainer}>
        <View style={styles.modalContainerSub}>
          <View style={styles.modalTitleSection}>
            <Text style={styles.modalTitle}>{I18n.t('sort_by')}</Text>
          </View>

          {data.map((item, index) => (
            <TouchableOpacity
              key={index.toString()}
              onPress={() => onSelectItem(item)}
              style={styles.modalItemWrap}
            >
              <Text style={styles.modalItem}>{I18n.t(item.title)}</Text>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor:
                      activeValue === item.key ? '#4DCAF4' : '#003A60',
                  },
                ]}
              >
                {activeValue === item.key ? (
                  <View style={styles.radioInner} />
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default SortFarmerModal;
