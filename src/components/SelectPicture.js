import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  StyleSheet,
} from 'react-native';
import * as consts from '../services/constants';

const { height } = Dimensions.get('window');

const SelectPicture = ({ ...props }) => {
  const { visible, onSelectGallery, onSelectCamera, hideModal } = props;
  return (
    <Modal
      animationType='slide'
      transparent
      visible={visible}
      onRequestClose={hideModal}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity onPress={hideModal} style={styles.topSection} />
        <View style={styles.modalContentWrap}>
          <TouchableOpacity onPress={onSelectGallery} style={styles.iconWrap}>
            <Image
              source={require('../assets/images/gallery.png')}
              style={styles.galleryImage}
            />
            <Text style={styles.galleyText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSelectCamera} style={styles.iconWrap}>
            <Image
              source={require('../assets/images/camera.png')}
              style={styles.cameraImage}
            />
            <Text style={[styles.galleyText, { bottom: 5 }]}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 58, 96, 0.2)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalContentWrap: {
    width: '100%',
    height: height * 0.125,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
  },
  galleyText: {
    color: consts.TEXT_PRIMARY_COLOR,
    textAlign: 'center',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 12,
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 25,
  },
  topSection: {
    height: height * 0.875,
    width: '100%',
  },
  galleryImage: {
    height: height * 0.07,
    width: height * 0.07,
    borderRadius: consts.BORDER_RADIUS,
  },
  cameraImage: {
    height: height * 0.08,
    width: height * 0.08,
    borderRadius: consts.BORDER_RADIUS,
  },
});

export default SelectPicture;
