import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
  Image,
  Keyboard,
} from 'react-native';
import { useSelector } from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import CountryPicker from 'react-native-country-picker-modal';
import {
  searchFarmersByName,
  updateFarmer,
} from '../../../db/services/FarmerHelper';
import {
  handleErrors,
  imageTypeValidation,
} from '../../../utils/commonFunctions';
import { logAnalytics } from '../../../utils/serviceHelper';
import { initiateSync } from '../../../sync/SyncInitials';
import { PHONE_NUMBER_MAX_LENGTH } from '../../../utils/constants';
import {
  checkDuplicateFarmer,
  fieldLabel,
  fieldVisibility,
  validateEditFarmerForm,
} from './controller';
import FormTextInput from '../../../components/inputs/formTextInput';
import Countries from '../../../utils/countries';
import I18n from '../../../translations/text/i18n';
import CustomLeftHeader from '../../../components/headers/customLeftHeader';
import SearchComponent from '../../../components/searchComponent';
import SelectPictureModal from '../../../components/modals/selectPictureModal';
import CommonAlert from '../../../components/modals/commonAlert';
import StyleSheetFactory from './styles';
import { EditIcon, ProfileCameraIcon } from '../../../assets/svg';

const { width } = Dimensions.get('window');

const EditFarmer = ({ navigation, route }) => {
  const scrollRef = useRef(null);
  const mobileRef = useRef(null);
  const cityRef = useRef(null);
  const streetRef = useRef(null);
  const zipCodeRef = useRef(null);

  const styles = StyleSheetFactory();
  const { farmer, otherDetails, updateEditedFarmer } = route.params;
  const { isConnected } = useSelector((state) => state.connection);
  const { syncInProgress, userCompanyDetails } = useSelector(
    (state) => state.login,
  );
  const { theme } = useSelector((state) => state.common);
  const forms = userCompanyDetails?.forms ?? [];

  const [countriesList, setCountriesList] = useState([]);
  const [allCountriesList, setAllCountriesList] = useState([]);
  const [name, setName] = useState(farmer?.name ?? '');
  const [mobile, setMobile] = useState(farmer?.mobile ?? '');
  const [dialCode, setDialCode] = useState(farmer?.dialCode ?? '');
  const [countryCode, setCountryCode] = useState(farmer?.countryCode ?? '');
  const [dialCodeList, setDialCodeList] = useState([]);
  const [profilePic, setProfilePic] = useState(farmer?.profilePic ?? '');
  const [street, setStreet] = useState(farmer?.street ?? '');
  const [city, setCity] = useState(farmer?.city ?? '');
  const [country, setCountry] = useState(farmer?.country ?? '');
  const [referenceNumber] = useState(farmer?.reference_number ?? '');
  const [province, setProvince] = useState(farmer?.province ?? '');
  const [provincesList, setProvincesList] = useState([]);
  const [allProvincesList, setAllProvincesList] = useState([]);
  const [zipCode, setZipCode] = useState(farmer?.zipcode ?? '');
  const [error, setError] = useState('');
  const [displayModal, setDisplayModal] = useState(false);
  const [focused, setFocused] = useState('country');
  const [selectPicModal, setSelectPicModal] = useState(false);
  const [alertModal, setAlertModal] = useState(false);

  useEffect(() => {
    setupProvince();
  }, []);

  // setting province list and initializing dial code values
  const setupProvince = async () => {
    getProvinceList(farmer.country);

    const arrayOfObjs = Object.entries(Countries.data).map(
      ([countryName, countryData]) => ({
        label: `+${countryData.dial_code}`,
        value: countryData.dial_code,
        country_name: countryName,
      }),
    );

    setDialCodeList([...arrayOfObjs]);

    if (dialCode === '') {
      // setting dial code based on selected country or related company
      const selectedCountry = farmer.country || userCompanyDetails.country;
      const countryDetails = arrayOfObjs.filter((i) => {
        return i.country_name === selectedCountry;
      });
      if (countryDetails?.[0]?.value) {
        setDialCode(countryDetails[0].value);
      }
    }

    selectProvince(farmer.province);
  };

  /**
   * Capitalizing first letter for name
   */
  const changeName = async () => {
    let text = name;

    if (text !== '') {
      setError('');
      const firstLetter = text.trim().substr(0, 1);
      text = firstLetter.toUpperCase() + text.trim().substr(1);
      setName(text);
    }

    setName(text);
  };

  /**
   * Capitalizing first letter for street
   */
  const changeStreet = async () => {
    let text = street;

    if (text !== '') {
      setError('');
      const firstLetter = text.trim().substr(0, 1);
      text = firstLetter.toUpperCase() + text.trim().substr(1);
      setStreet(text);
    }

    setStreet(text);
  };

  /**
   * Capitalizing first letter for city
   */
  const changeCity = async () => {
    let text = city;

    if (text !== '') {
      setError('');
      const firstLetter = text.trim().substr(0, 1);
      text = firstLetter.toUpperCase() + text.trim().substr(1);
    }

    setCity(text);
  };

  /**
   * opening country/province list modal based on type
   * @param {string} type modal list type: 'country' or 'province'
   */
  const openDisplayModal = (type) => {
    setCountriesList(type === 'country' ? allCountriesList : allProvincesList);
    setFocused(type);
    setDisplayModal(true);
  };

  /**
   * setting selected dial code and related country
   * @param {object} selectedCountry selected country object
   */
  const onSelectDialCode = (selectedCountry) => {
    if (selectedCountry.callingCode.length > 0) {
      const newDialCode = selectedCountry.callingCode[0];
      if (newDialCode !== dialCode) {
        setDialCode(newDialCode);

        const selectedCountryArr = dialCodeList.find(
          (x) => x.value === newDialCode,
        );

        if (selectedCountryArr) {
          getProvinceList(selectedCountryArr.country_name);
        }
      }
    }
  };

  /**
   * filtering country list based on search text
   * @param {string} text search text from country modal
   */
  const onSearchCountry = (text) => {
    const countryText = text.toLowerCase().trim();
    if (countryText === '') {
      setCountriesList(allCountriesList);
    } else {
      const filteredCountriesList = allCountriesList.filter((e) => {
        const element = e.label.toLowerCase();
        return element.includes(countryText);
      });
      setCountriesList(filteredCountriesList);
    }
  };

  /**
   * filtering province list based on search text
   * @param {string} text search text from province modal
   */
  const onSearchProvince = (text) => {
    const provinceText = text.toLowerCase().trim();
    if (provinceText === '') {
      setProvincesList(allProvincesList);
    } else {
      const filteredCountriesList = allProvincesList.filter((e) => {
        const element = e.label.toLowerCase();
        return element.includes(provinceText);
      });
      setProvincesList(filteredCountriesList);
    }
  };

  /**
   * setting province list based on input country
   * @param {string} text country name
   */
  const getProvinceList = (text) => {
    setCountry(text);
    setProvince('');

    const arrayOfObj = Object.entries(Countries.data).map(
      ([countryData, additionalData]) => ({
        label: countryData,
        additional: additionalData,
        value: countryData,
      }),
    );

    const listOfCountries = [...arrayOfObj];

    setCountriesList(listOfCountries);
    setAllCountriesList(listOfCountries);

    const selectedCountryArr = listOfCountries.find((x) => x.label === text);

    if (selectedCountryArr) {
      // setting dial code based on country text
      if (dialCode !== selectedCountryArr.additional.dial_code) {
        setDialCode(selectedCountryArr.additional.dial_code);
        setCountryCode(selectedCountryArr.additional.alpha_2);
      }

      // setting province list based on country text
      const provinces = selectedCountryArr.additional.sub_divisions;
      const selectedProvinces = Object.entries(provinces).map(
        ([provinceData, provinceLocation]) => ({
          label: provinceData,
          location: provinceLocation,
          value: provinceData,
        }),
      );

      setProvincesList([...selectedProvinces]);
      setAllProvincesList([...selectedProvinces]);
    }
  };

  /**
   * setting selected province
   * @param {string} selectedProvince selected province name
   */
  const selectProvince = (selectedProvince) => {
    setProvince(selectedProvince);
  };

  /**
   * capturing camera image for profile picture
   */
  const onTakePicture = () => {
    setSelectPicModal(false);

    ImagePicker.openCamera({
      compressImageQuality: 0.5,
    })
      .then((image) => {
        logAnalytics('image_selection_for_profile_picture', {
          selection_method: 'Camera',
          selection_case: 'edit_farmer',
        });

        setProfilePic(image.path);
      })
      .catch((err) => {
        handleErrors(err, {
          ref: 'AddNewFarmer_onTakePicture',
        });
      });
  };

  /**
   * opening gallery for profile picture
   */
  const onChangePicture = () => {
    setSelectPicModal(false);

    ImagePicker.openPicker({
      mediaType: 'photo',
      compressImageQuality: 0.5,
    })
      .then(async (image) => {
        // only image type is allowed
        const isValid = await imageTypeValidation(image);
        if (!isValid) {
          return;
        }

        logAnalytics('image_selection_for_profile_picture', {
          selection_method: 'Gallery',
          selection_case: 'edit_farmer',
        });
        setProfilePic(image.path);
      })
      .catch((err) => {
        handleErrors(err, {
          ref: 'AddNewFarmer_onChangePicture',
        });
      });
  };

  /**
   * updating farmer in local db and starts syncing
   */
  const handleValidate = async () => {
    // need_fix add option to edit custom details too

    await Promise.all([changeName(), changeStreet(), changeCity()]);

    const updatedObj = {
      name,
      mobile: mobile.trim(),
      phone: mobile.trim() !== '' ? `+${dialCode.trim()} ${mobile.trim()}` : '',
      street,
      city,
      country: country.trim(),
      province: province.trim(),
      zipcode: zipCode.trim(),
      image: profilePic.trim(),
      reference_number: referenceNumber.trim(),
    };

    // checking no changes
    const isUnchanged = Object.entries(updatedObj).every(
      ([key, value]) => farmer[key] === value,
    );
    if (isUnchanged) {
      return;
    }

    const [isValid, validError] = await validateEditFarmerForm(
      updatedObj,
      forms,
      countryCode,
    );
    if (!isValid) {
      setError(validError);
      Keyboard.dismiss();
      scrollRef.current.scrollToEnd({ animated: true });
      return;
    }

    // checking farmer duplicates
    const nodes = await searchFarmersByName(name);
    if (nodes.length > 0) {
      const duplicate = await checkDuplicateFarmer(nodes, updatedObj);

      if (duplicate) {
        setAlertModal(true);
        return;
      }
    }

    handleSubmit(updatedObj);
  };

  const handleSubmit = async (updatedObj) => {
    updatedObj.is_modified = otherDetails.server_id !== '';
    updatedObj.card_id = farmer.card_id;
    updatedObj.updated_on = Math.floor(Date.now() / 1000);

    // updating farmer details to local db
    await updateFarmer(otherDetails.id, updatedObj);

    const newDetails = { ...otherDetails, ...updatedObj };
    updateEditedFarmer(newDetails);

    // if network is available, starts syncing
    if (isConnected && !syncInProgress) {
      await initiateSync();
    }

    navigation.goBack(null);
  };

  /**
   * setting country/province
   * @param {string} label country/province name
   */
  const onSelectModalItem = (label) => {
    setDisplayModal(false);
    if (focused === 'country' && country !== label) {
      getProvinceList(label);
    } else if (focused === 'province') {
      selectProvince(label);
    }
  };

  const onSubmittingFullName = () => {
    if (mobileRef?.current) {
      mobileRef.current.focus();
    } else {
      onSubmittingMobile();
    }
  };

  const onSubmittingMobile = () => {
    if (streetRef?.current) {
      streetRef.current.focus();
    } else {
      onSubmittingStreet();
    }
  };

  const onSubmittingStreet = () => {
    if (cityRef?.current) {
      cityRef.current.focus();
    } else {
      onSubmittingCity();
    }
  };

  const onSubmittingCity = () => {
    if (zipCodeRef?.current) {
      zipCodeRef.current.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  const closeAlertModal = () => {
    setAlertModal(false);
    setError('');
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.flatListItemWrap}
        onPress={() => onSelectModalItem(item.label)}
      >
        <Text style={styles.flatListItemText}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          title={I18n.t('edit_farmer')}
          onPress={() => navigation.goBack(null)}
          rightText={I18n.t('save')}
          rightTextColor={theme.background_3}
          onPressRight={handleValidate}
          extraStyle={{ paddingLeft: width * 0.05 }}
        />

        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="always"
          style={{ paddingHorizontal: width * 0.05 }}
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
                onPress={() => setSelectPicModal(true)}
                style={styles.addPicture}
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
            placeholder={fieldLabel(forms, 'full_name')}
            value={name}
            onChangeText={(text) => setName(text)}
            onBlur={changeName}
            onSubmitEditing={onSubmittingFullName}
            autoCapitalize="sentences"
            extraStyle={{ width: '100%', color: theme.text_1 }}
          />

          {fieldVisibility(forms, 'mobile_number') && (
            <View>
              <View style={styles.dialCodeWrap}>
                {dialCodeList.length > 0 && (
                  <CountryPicker
                    withEmoji
                    withFilter
                    withFlag
                    withCountryNameButton
                    withAlphaFilter
                    withCallingCode
                    placeholder={`+${dialCode.replace('+', '')}`}
                    keyboardShouldPersistTaps="always"
                    onSelect={onSelectDialCode}
                  />
                )}
              </View>
              <FormTextInput
                inputRef={mobileRef}
                placeholder={fieldLabel(forms, 'mobile_number')}
                value={mobile}
                onChangeText={(text) => {
                  setMobile(text.replace(/[^0-9]/g, ''));
                }}
                onSubmitEditing={onSubmittingMobile}
                keyboardType="numeric"
                internalPadding={70}
                maxLength={PHONE_NUMBER_MAX_LENGTH}
                extraStyle={{ width: '100%', color: theme.text_1 }}
              />
            </View>
          )}

          <View style={styles.formTitleContainer}>
            <Text style={styles.formTitle}>{I18n.t('address')}</Text>
          </View>

          <FormTextInput
            inputRef={streetRef}
            placeholder={fieldLabel(forms, 'street')}
            value={street}
            onChangeText={(text) => setStreet(text)}
            onSubmitEditing={onSubmittingStreet}
            onBlur={changeStreet}
            visibility={fieldVisibility(forms, 'street')}
            autoCapitalize="sentences"
            extraStyle={{ width: '100%', color: theme.text_1 }}
          />

          <FormTextInput
            inputRef={cityRef}
            mandatory
            placeholder={fieldLabel(forms, 'city')}
            value={city}
            onChangeText={(text) => setCity(text)}
            onSubmitEditing={onSubmittingCity}
            onBlur={changeCity}
            autoCapitalize="sentences"
            extraStyle={{ width: '100%', color: theme.text_1 }}
          />

          {fieldVisibility(forms, 'country') && (
            <TouchableOpacity onPress={() => openDisplayModal('country')}>
              <View pointerEvents="none">
                <FormTextInput
                  mandatory
                  placeholder={fieldLabel(forms, 'country')}
                  value={country}
                  extraStyle={{
                    width: '100%',
                    color: theme.text_1,
                  }}
                />
              </View>
            </TouchableOpacity>
          )}

          {fieldVisibility(forms, 'province') && (
            <TouchableOpacity onPress={() => openDisplayModal('province')}>
              <View pointerEvents="none">
                <FormTextInput
                  mandatory
                  placeholder={fieldLabel(forms, 'province')}
                  values={provincesList}
                  value={province}
                  extraStyle={{
                    width: '100%',
                    color: theme.text_1,
                  }}
                />
              </View>
            </TouchableOpacity>
          )}

          <FormTextInput
            inputRef={zipCodeRef}
            placeholder={fieldLabel(forms, 'postal_code')}
            value={zipCode}
            onChangeText={(text) => {
              setZipCode(text);
            }}
            visibility={fieldVisibility(forms, 'postal_code')}
            extraStyle={{ width: '100%', color: theme.text_1 }}
          />

          {error && <Text style={styles.errorMessage}>{error}</Text>}

          {displayModal && (
            <Modal
              animationType="slide"
              transparent
              visible={displayModal}
              onRequestClose={() => setDisplayModal(false)}
            >
              <View style={styles.countryModalContainer}>
                <TouchableOpacity
                  onPress={() => setDisplayModal(false)}
                  style={{ height: '40%' }}
                />
                <View style={styles.countryModalSub}>
                  <SearchComponent
                    placeholder={
                      focused === 'country'
                        ? I18n.t('search_country')
                        : I18n.t('search_province')
                    }
                    onChangeText={(text) => {
                      if (focused === 'country') {
                        onSearchCountry(text);
                      } else {
                        onSearchProvince(text);
                      }
                    }}
                  />
                  <FlatList
                    data={focused === 'country' ? countriesList : provincesList}
                    renderItem={renderItem}
                    extraData={focused}
                    keyboardShouldPersistTaps="always"
                    style={styles.countryFlatList}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>
                        {I18n.t('no_matches_found')}
                      </Text>
                    }
                    keyExtractor={(item, index) => index.toString()}
                  />
                </View>
              </View>
            </Modal>
          )}

          {selectPicModal && (
            <SelectPictureModal
              visible={selectPicModal}
              hideModal={() => setSelectPicModal(false)}
              onSelectGallery={onChangePicture}
              onSelectCamera={onTakePicture}
            />
          )}

          {alertModal && (
            <CommonAlert
              visible={alertModal}
              title={I18n.t('duplicate_farmer_alert')}
              message={I18n.t('farmer_already_exist')}
              submitText={I18n.t('ok')}
              icon={
                <Image
                  source={require('../../../assets/images/duplicate_farmer.png')}
                  style={styles.alertImage}
                />
              }
              onSubmit={closeAlertModal}
              onRequestClose={closeAlertModal}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default EditFarmer;
