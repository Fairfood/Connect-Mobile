/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import {
  handleErrors,
  imageTypeValidation,
} from '../../../utils/commonFunctions';
import { logAnalytics } from '../../../utils/serviceHelper';
import CustomButton from '../../buttons/customButton';
import I18n from '../../../translations/text/i18n';
import SelectPictureModal from '../../modals/selectPictureModal';
import StyleSheetFactory from './styles';
import { ProfileCameraIcon } from '../../../assets/svg';

const { width, height } = Dimensions.get('window');

const StepThree = ({ onNext, onAddFarmer, farmer }) => {
  const [profilePic, setProfilePic] = useState(farmer?.profilePic ?? '');
  const [selectPicModal, setSelectPicModal] = useState(false);
  const styles = StyleSheetFactory();

  const analyticEntry = (method) => {
    logAnalytics('image_selection_for_profile_picture', {
      selection_method: method,
      selection_case: 'add_farmer',
    });
  };

  /**
   * taking image from the camera and cropping the image
   */
  const onTakePicture = () => {
    setSelectPicModal(false);

    ImagePicker.openCamera({
      compressImageQuality: 0.5,
    })
      .then(async (image) => {
        const isValidType = await imageTypeValidation(image);
        if (!isValidType) {
          return;
        }

        analyticEntry('Camera');
        setProfilePic(image.path);
        onNext({ profilePic: image.path });
      })
      .catch((error) => {
        handleErrors(error, {
          ref: 'AddNewFarmer_onTakePicture',
        });
      });
  };

  /**
   * taking image from gallery and cropping the image
   */
  const onChangePicture = () => {
    setSelectPicModal(false);

    ImagePicker.openPicker({
      mediaType: 'photo',
      compressImageQuality: 0.5,
    })
      .then(async (image) => {
        // only image file types are allowed
        const isValidType = await imageTypeValidation(image);
        if (!isValidType) {
          return;
        }

        analyticEntry('Gallery');
        setProfilePic(image.path);
        onNext({ profilePic: image.path });
      })
      .catch((error) => {
        handleErrors(error, {
          ref: 'AddNewFarmer_onChangePicture',
        });
      });
  };

  /**
   * opening modal for choosing profile picture
   */
  const openModal = () => {
    if (profilePic === '') {
      setSelectPicModal(true);
    }
  };

  const removePic = () => {
    setProfilePic('');
    onNext({ profilePic: '' });
  };

  return (
    <View style={{ width }}>
      <View style={[styles.formTitleContainer, { marginLeft: '5%' }]}>
        <Text style={styles.formTitle}>{I18n.t('profile_photo_optional')}</Text>
      </View>
      <View style={[styles.uploadImageContainer]}>
        <TouchableOpacity style={styles.uploadImageView} onPress={openModal}>
          {profilePic !== '' ? (
            <Image
              source={{ uri: profilePic }}
              style={styles.uploadImageView}
            />
          ) : (
            <ProfileCameraIcon width={40} height={40} />
          )}
        </TouchableOpacity>
        <View>
          <Text style={styles.uploadImageText}>
            {I18n.t('upload_profile_picture')}
          </Text>
          {profilePic !== '' && (
            <>
              <TouchableOpacity
                style={styles.changePicWrap}
                onPress={() => setSelectPicModal(true)}
              >
                <Text style={styles.changeButtonText}>
                  {I18n.t('change_photo')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removePicWrap}
                onPress={removePic}
              >
                <Text style={styles.changeButtonText}>
                  {I18n.t('remove_photo')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      <View style={styles.stepThreeButtonWrap}>
        <CustomButton
          buttonText={I18n.t('add_farmer')}
          onPress={onAddFarmer}
          extraStyle={{ width: '90%' }}
        />
      </View>

      {selectPicModal && (
        <SelectPictureModal
          visible={selectPicModal}
          hideModal={() => setSelectPicModal(false)}
          onSelectGallery={onChangePicture}
          onSelectCamera={onTakePicture}
        />
      )}
    </View>
  );
};

export default StepThree;
