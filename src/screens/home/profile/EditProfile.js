import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import CountryPicker from 'react-native-country-picker-modal';
import DeviceInfo from 'react-native-device-info';
import Toast from 'react-native-toast-message';

import { updateUserDetails } from '../../../redux/LoginStore';
import { CommonFetchRequest } from '../../../api/middleware';
import { checkEmojis, checkMandatory } from '../../../services/commonFunctions';
import { logAnalytics } from '../../../services/googleAnalyticsHelper';
import FormTextInput from '../../../components/FormTextInput';
import Icon from '../../../icons';
import Countries from '../../../services/countries';
import I18n from '../../../i18n/i18n';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import SelectPicture from '../../../components/SelectPicture';
import api from '../../../api/config';

const { width } = Dimensions.get('window');

const EditProfile = ({ navigation }) => {
  const mobileRef = useRef(null);
  const { theme } = useSelector((state) => state.common);
  const { loggedInUser, userCompanyDetails } = useSelector(
    (state) => state.login,
  );
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(loggedInUser.first_name);
  const [lastName, setLastName] = useState(loggedInUser.last_name);
  const [mobile, setMobile] = useState(loggedInUser.phone.phone);
  const [dialCode, setDialCode] = useState(loggedInUser.phone.dial_code);
  const [dialCodeList, setDialCodeList] = useState([]);
  const [profilePic, setProfilePic] = useState(loggedInUser.image);
  const [error, setError] = useState('');
  const [selectPicModal, setSelectPicModal] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setupDialCode();
  }, []);

  /**
   * setting up initial dial code value
   */
  const setupDialCode = async () => {
    const arrayOfObjs = Object.entries(Countries.data).map((e) => ({
      label: `+${e[1].dial_code}`,
      value: e[1].dial_code,
      country_name: e[0],
    }));

    setDialCodeList([...arrayOfObjs]);

    if (dialCode === '') {
      const country = arrayOfObjs.filter((i) => {
        return i.country_name === userCompanyDetails.country;
      });
      setDialCode(country[0].value);
    }
  };

  /**
   * back navigation, redirecting to previous page
   */
  const backNavigation = () => {
    navigation.goBack(null);
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
      .catch(() => {
        // console.log('error')
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
      .then((image) => {
        // checking file is image type
        if (image.mime && !image.mime.includes('image')) {
          Toast.show({
            type: 'error',
            text1: I18n.t('invalid'),
            text2: I18n.t('only_image_files_allowed'),
          });
          return;
        }

        logAnalytics('image_selection_for_profile_picture', {
          selection_method: 'Gallery',
          selection_case: 'edit_profile',
        });

        setProfilePic(image.path);
      })
      .catch(() => {
        // console.log('error')
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
    const farmerProPic = profilePic;

    // checking emoji in fields
    const emojiFields = [
      { name: I18n.t('first_name'), value: farmerName },
      { name: I18n.t('last_name'), value: farmerLastName },
      { name: I18n.t('mobile_number'), value: farmerMobile },
    ];

    const [emojiValid, emojiError] = await checkEmojis(emojiFields);
    if (!emojiValid) {
      setError(emojiError);
      return;
    }

    // checking mandatory fields
    const mandatoryFields = [
      { name: I18n.t('first_name'), value: farmerName },
      { name: I18n.t('last_name'), value: farmerLastName },
    ];

    const [mandatoryValid, mandatoryError] = await checkMandatory(
      mandatoryFields,
    );

    if (!mandatoryValid) {
      setError(mandatoryError);
      return;
    }

    if (
      farmerName === loggedInUser.Name &&
      farmerLastName === loggedInUser.LastName &&
      farmerMobile === loggedInUser.Mobile &&
      farmerDialCode === loggedInUser.DialCode &&
      farmerProPic === loggedInUser.ProfilePic
    ) {
      // no changes
      backNavigation();
      return;
    }

    // checking mobile number validation
    if (
      farmerMobile !== '' &&
      (farmerMobile.length < 3 || farmerMobile.length > 15)
    ) {
      setError(I18n.t('mobile_number_is_invalid'));
      return;
    }

    let filename = '';
    if (profilePic) {
      filename = profilePic.replace(/^.*[\\/]/, '');
    }

    const user = {
      first_name: name,
      last_name: lastName,
      phone: farmerMobile === '' ? '' : dialCode + mobile,
      image: profilePic
        ? { name: filename, type: 'image/jpg', uri: profilePic }
        : null,
    };
    setError('');
    updateProfileDetails(user);
  };

  /**
   * update profile request to server side
   * @param {object} user updated user values
   */
  const updateProfileDetails = async (user) => {
    setLoading(true);

    const headers = {
      Bearer: loggedInUser.token,
      'User-ID': loggedInUser.id,
      'Content-Type': 'multipart/form-data',
      'Node-ID': loggedInUser.default_node,
      Version: DeviceInfo.getVersion(),
      'Client-Code': api.API_CLIENT_CODE,
    };

    const formData = new FormData();
    formData.append('default_node', loggedInUser.default_node);
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
      url: `${api.API_URL}${api.API_VERSION}/accounts/user/`,
      headers,
      data: formData,
      redirect: 'follow',
    };

    const response = await CommonFetchRequest(config);

    if (response.success) {
      dispatch(updateUserDetails(response.data));
      navigation.goBack(null);
      setLoading(false);
    } else {
      if (response.error) {
        setError(response.error);
      }

      setLoading(false);
    }
  };

  /**
   * setting dial code based on selected country
   * @param {object} country selected country
   */
  const onSelect = (country) => {
    const countryDialCode = country.callingCode;
    if (countryDialCode.length > 0) {
      setDialCode(country.callingCode[0]);
    }
  };

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          backgroundColor={theme.background_1}
          title={I18n.t('edit_profile')}
          leftIcon="arrow-left"
          onPress={() => backNavigation()}
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
              <View
                style={[styles.uploadImageView, { backgroundColor: '#ffffff' }]}
              >
                {profilePic == null && (
                  <Icon name="Camera" color="#5691AE" size={50} />
                )}
                {profilePic != null && (
                  <FastImage
                    source={{ uri: profilePic }}
                    style={styles.uploadImageView}
                  />
                )}
              </View>
              <TouchableOpacity
                style={styles.addPicture}
                onPress={() => setSelectPicModal(true)}
              >
                <Icon name="edit" color="#FFFFFF" size={15} />
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
            extraStyle={{ width: '100%' }}
          />
          <FormTextInput
            mandatory
            placeholder={I18n.t('last_name')}
            value={lastName}
            onSubmitEditing={() => mobileRef.current.focus()}
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
                  onSelect={onSelect}
                />
              )}
            </View>
            <FormTextInput
              placeholder={I18n.t('mobile_number')}
              value={mobile}
              inputRef={mobileRef}
              color={theme.text_1}
              keyboardType="numeric"
              onChangeText={(text) => {
                // text = text.replace(/[^0-9]/g, '');
                setMobile(text.replace(/[^0-9]/g, ''));
              }}
              internalPadding={70}
              extraStyle={{ width: '100%' }}
            />
          </View>

          {error !== '' && (
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
        <SelectPicture
          visible={selectPicModal}
          hideModal={() => setSelectPicModal(false)}
          onSelectGallery={() => onChangePicture()}
          onSelectCamera={() => onTakePicture()}
        />
      )}
    </SafeAreaView>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    formTitleContainer: {
      marginVertical: 10,
    },
    formTitle: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontStyle: 'normal',
      fontSize: 16,
    },
    uploadImageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignSelf: 'center',
      marginVertical: 30,
    },
    uploadImageView: {
      backgroundColor: '#C5EDFA',
      height: 100,
      width: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorMessage: {
      fontSize: 14,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      marginRight: 30,
      color: theme.button_bg_1,
    },
    addPicture: {
      height: 30,
      width: 30,
      borderRadius: 15,
      position: 'absolute',
      right: -5,
      top: 10,
      backgroundColor: theme.text_1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorView: {
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 40,
    },
    countryPickerWrap: {
      width: 50,
      top: 25,
      left: 20,
      position: 'absolute',
      zIndex: 1,
    },
    modalWrap: {
      flex: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.2);',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

export default EditProfile;
