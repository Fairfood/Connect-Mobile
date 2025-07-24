import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal } from 'react-native';
import StyleSheetFactory from './styles';

const SelectPictureModal = ({ ...props }) => {
  const { visible, onSelectGallery, onSelectCamera, hideModal } = props;
  const styles = StyleSheetFactory();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={hideModal}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity onPress={hideModal} style={styles.topSection} />
        <View style={styles.modalContentWrap}>
          <TouchableOpacity onPress={onSelectGallery} style={styles.iconWrap}>
            <Image
              source={require('../../../assets/images/gallery.png')}
              style={styles.galleryImage}
            />
            <Text style={styles.galleyText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSelectCamera} style={styles.iconWrap}>
            <Image
              source={require('../../../assets/images/camera.png')}
              style={styles.cameraImage}
            />
            <Text style={[styles.galleyText, { bottom: 5 }]}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SelectPictureModal;
