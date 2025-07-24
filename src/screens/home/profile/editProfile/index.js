import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import CountryPicker from 'react-native-country-picker-modal';

import { updateUserDetails } from '../../../../redux/LoginStore';
import { Middleware } from '../../../../api/middleware';
import {
  handleErrors,
  imageTypeValidation,
} from '../../../../utils/commonFunctions';
import { extractPhoneNumber } from '../../../../utils/helperFunctions';
import { logAnalytics } from '../../../../utils/serviceHelper';
import { PHONE_NUMBER_MAX_LENGTH } from '../../../../utils/constants';
import { validateEditProfileForm } from './controller';
import FormTextInput from '../../../../components/inputs/formTextInput';
import Countries from '../../../../utils/countries';
import I18n from '../../../../translations/text/i18n';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import SelectPictureModal from '../../../../components/modals/selectPictureModal';
import StyleSheetFactory from './styles';
import { EditIcon, ProfileCameraIcon } from '../../../../assets/svg';

const { width } = Dimensions.get('window');

const EditProfile = ({ navigation }) => {
  const lastNameRef = useRef(null);
  const mobileRef = useRef(null);
  const styles = StyleSheetFactory();
  const { theme } = useSelector((state) => state.common);
  const { loggedInUser, userCompanyDetails } = useSelector(
    (state) => state.login,
  );
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(loggedInUser?.first_name ?? '');
  const [lastName, setLastName] = useState(loggedInUser?.last_name ?? '');
  const [mobile, setMobile] = useState('');
  const [dialCode, setDialCode] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [dialCodeList, setDialCodeList] = useState([]);
  const [profilePic, setProfilePic] = useState(loggedInUser?.image ?? '');
  const [error, setError] = useState('');
  const [selectPicModal, setSelectPicModal] = useState(false);
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      setUpInitialValues();
      return () => {};
    }, []),
  );

  /**
   * setting up initial dial code value
   */
  const setUpInitialValues = async () => {
    const code = (await extractPhoneNumber(loggedInUser.phone, 'code')) || '';

    const number =
      (await extractPhoneNumber(loggedInUser.phone, 'number')) || '';
    setMobile(number);
    setDialCode(code);

    const arrayOfObjs = Object.entries(Countries.data).map(
      ([countryName, countryData]) => ({
        label: `+${countryData.dial_code}`,
        value: countryData.dial_code,
        country_name: countryName,
        country_code: countryData.alpha_2,
      }),
    );

    setDialCodeList(arrayOfObjs);

    const country = arrayOfObjs.find((i) =>
      code === ''
        ? i.country_name === userCompanyDetails.country
        : i.value === code,
    );

    if (country) {
      if (code === '') {
        setDialCode(country.value);
      }
      setCountryCode(country.country_code);
    } else {
      setDialCode(arrayOfObjs[0].value);
    }
  };

  /**
   * opening device camera
   */
  const onTakePicture = () => {
    setSelectPicModal(false);

    ImagePicker.openCamera({
      compressImageQuality: 0.5,
    })
      .then((image) => {
        logAnalytics('image_selection_for_profile_picture', {
          selection_method: 'Camera',
          selection_case: 'edit_profile',
        });

        setProfilePic(image.path);
      })
      .catch((err) => {
        handleErrors(err);
      });
  };

  /**
   * opening device gallery
   */
  const onChangePicture = () => {
    setSelectPicModal(false);

    ImagePicker.openPicker({
      mediaType: 'photo',
      compressImageQuality: 0.5,
    })
      .then(async (image) => {
        // checking file is image type
        const isValidType = await imageTypeValidation(image);
        if (!isValidType) {
          return;
        }

        logAnalytics('image_selection_for_profile_picture', {
          selection_method: 'Gallery',
          selection_case: 'edit_profile',
        });

        setProfilePic(image.path);
      })
      .catch((err) => {
        handleErrors(err);
      });
  };

  /**
   * submit function for update profile
   */
  const onSave = async () => {
    const farmerName = name.trim();
    const farmerLastName = lastName.trim();
    const farmerMobile = mobile.trim();
    const farmerDialCode = dialCode;
    const fullMobileNumber =
      farmerMobile !== '' ? `+${farmerDialCode}${farmerMobile}`.trim() : '';
    const farmerProPic = profilePic;

    if (
      farmerName === loggedInUser.first_name &&
      farmerLastName === loggedInUser.last_name &&
      fullMobileNumber === loggedInUser.phone &&
      farmerProPic === loggedInUser.image
    ) {
      // no changes
      navigation.goBack(null);
      return;
    }

    const [valid, validError] = await validateEditProfileForm({
      farmerName,
      farmerLastName,
      farmerMobile,
      fullMobileNumber,
      countryCode,
    });

    if (!valid) {
      setError(validError);
      return;
    }

    setError('');

    let filename = '';
    if (profilePic) {
      filename = profilePic.replace(/^.*[\\/]/, '');
    }

    const user = {
      first_name: farmerName,
      last_name: farmerLastName,
      phone: fullMobileNumber,
      image: profilePic
        ? { name: filename, type: 'image/jpg', uri: profilePic }
        : null,
    };

    updateProfileDetails(user);
  };

  /**
   * update profile request to server side
   * @param {object} user updated user values
   */
  const updateProfileDetails = async (user) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('first_name', user.first_name);
      formData.append('last_name', user.last_name);

      if (user.phone !== '') {
        formData.append('phone', user.phone);
      }

      if (user.image) {
        const { uri } = user.image;
        if (uri && !uri.includes('http')) {
          formData.append('image', user.image);
        }
      }

      const config = {
        method: 'PATCH',
        urlKey: `accounts/users/${loggedInUser.user_id}/`,
        data: formData,
        contentType: 'multipart/form-data',
      };

      const response = await Middleware(config);

      if (response.success) {
        dispatch(updateUserDetails(response.data));
        navigation.goBack(null);
      } else {
        setError(response.error);
      }
    } catch (err) {
      handleErrors(err, {
        ref: 'editProfile_updateProfileDetails',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * setting dial code based on selected country
   * @param {object} country selected country
   */
  const onSelectCountryPicker = (country) => {
    const countryDialCode = country.callingCode;
    if (countryDialCode.length > 0) {
      setDialCode(country.callingCode[0]);
      setCountryCode(country.cca2);
    }
  };

  const onSubmittingFirstName = () => {
    if (lastNameRef?.current) {
      lastNameRef.current.focus();
    } else {
      onSubmittingLastName();
    }
  };

  const onSubmittingLastName = () => {
    if (mobileRef?.current) {
      mobileRef.current.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          title={I18n.t('edit_profile')}
          onPress={() => navigation.goBack(null)}
          rightText={I18n.t('save')}
          rightTextColor="#EA2553"
          onPressRight={onSave}
          extraStyle={{ paddingLeft: width * 0.06 }}
        />

        <ScrollView
          keyboardShouldPersistTaps="always"
          style={{ paddingHorizontal: 25 }}
        >
          <View style={{ width: '100%' }}>
            <View style={styles.uploadImageContainer}>
              <View style={styles.uploadImageView}>
                {profilePic !== '' ? (
                  <FastImage
                    source={{ uri: profilePic }}
                    style={styles.uploadImageView}
                  />
                ) : (
                  <ProfileCameraIcon width={40} height={40} />
                )}
              </View>
              <TouchableOpacity
                style={styles.addPicture}
                onPress={() => setSelectPicModal(true)}
              >
                <EditIcon fill="#FFFFFF" width={15} height={15} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.formTitleContainer}>
            <Text style={styles.formTitle}>{I18n.t('basic_information')}</Text>
          </View>
          <FormTextInput
            mandatory
            placeholder={I18n.t('first_name')}
            value={name}
            color={theme.text_1}
            onChangeText={(text) => setName(text)}
            onSubmitEditing={onSubmittingFirstName}
            extraStyle={{ width: '100%' }}
          />
          <FormTextInput
            inputRef={lastNameRef}
            placeholder={I18n.t('last_name')}
            value={lastName}
            onSubmitEditing={onSubmittingLastName}
            color={theme.text_1}
            onChangeText={(text) => setLastName(text)}
            extraStyle={{ width: '100%' }}
          />
          <View>
            <View style={styles.countryPickerWrap}>
              {dialCodeList.length > 0 && (
                <CountryPicker
                  withEmoji
                  withFilter
                  withFlag
                  withCountryNameButton
                  withAlphaFilter
                  withCallingCode
                  keyboardShouldPersistTaps="always"
                  placeholder={`+${dialCode.replace('+', '')}`}
                  onSelect={onSelectCountryPicker}
                />
              )}
            </View>
            <FormTextInput
              inputRef={mobileRef}
              placeholder={I18n.t('mobile_number')}
              value={mobile}
              keyboardType="numeric"
              onChangeText={(text) => {
                setMobile(text.replace(/[^0-9]/g, ''));
              }}
              internalPadding={70}
              maxLength={PHONE_NUMBER_MAX_LENGTH}
              color={theme.text_1}
              extraStyle={{ width: '100%' }}
            />
          </View>

          {error && (
            <View style={styles.errorView}>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          )}
        </ScrollView>
      </View>
      <Modal animationType="slide" transparent visible={loading}>
        <View style={styles.modalWrap}>
          <ActivityIndicator size="large" color="#EA2353" />
        </View>
      </Modal>

      {selectPicModal && (
        <SelectPictureModal
          visible={selectPicModal}
          hideModal={() => setSelectPicModal(false)}
          onSelectGallery={onChangePicture}
          onSelectCamera={onTakePicture}
        />
      )}
    </SafeAreaView>
  );
};

export default EditProfile;
