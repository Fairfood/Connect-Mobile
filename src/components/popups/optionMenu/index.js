import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import I18n from '../../../translations/text/i18n';
import StyleSheetFactory from './styles';

const OptionMenu = ({ onPress, hideModal, visible, menus }) => {
  const styles = StyleSheetFactory();

  return (
    <Modal transparent visible={visible} onRequestClose={hideModal}>
      <TouchableOpacity onPress={hideModal} style={{ flex: 1 }}>
        <View style={styles.container}>
          {menus.map((item, index) => (
            <View key={index.toString()}>
              {item.visible && (
                <TouchableOpacity
                  onPress={() => onPress(item.key)}
                  style={styles.listItem}
                >
                  {item.icon ?? <View />}
                  <Text style={styles.listItemText}>{I18n.t(item.title)}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default OptionMenu;
