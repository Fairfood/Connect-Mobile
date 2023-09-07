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
  FlatList,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import CountryPicker from 'react-native-country-picker-modal';
import Toast from 'react-native-toast-message';
import { syncUpdatedFarmers } from '../../sync/SyncFarmers';
import {
  searchFarmersByName,
  updateFarmer,
} from '../../db/services/FarmerHelper';
import {
  checkMandatory,
  checkEmojis,
  stringToJson,
} from '../../services/commonFunctions';
import { logAnalytics } from '../../services/googleAnalyticsHelper';
import FormTextInput from '../../components/FormTextInput';
import Icon from '../../icons';
import Countries from '../../services/countries';
import I18n from '../../i18n/i18n';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import SearchComponent from '../../components/SearchComponent';
import SelectPicture from '../../components/SelectPicture';
import CommonAlert from '../../components/CommonAlert';

// import CustomInputFields from '../../components/CustomInputFields';

const { width } = Dimensions.get('window');

const EditFarmer = ({ navigation, route }) => {
  const scrollRef = useRef(null);
  const mobileRef = useRef(null);
  const cityRef = useRef(null);
  const { isConnected } = useSelector((state) => state.connection);
  const { syncInProgress } = useSelector((state) => state.login);
  const { theme } = useSelector((state) => state.common);
  const { farmer, otherDetails, updateEditedFarmer } = route.params;
  const [countriesList, setCountriesList] = useState([]);
  const [allCountriesList, setAllCountriesList] = useState([]);
  const [name, setName] = useState(farmer?.name ?? '');
  const [mobile, setMobile] = useState(farmer?.mobile ?? '');
  const [dialCode, setDialCode] = useState(farmer?.dialCode ?? '');
  const [dialCodeList, setDialCodeList] = useState([]);
  const [profilePic, setProfilePic] = useState(farmer?.profilePic ?? '');
  const [street, setStreet] = useState(farmer?.street ?? '');
  const [city, setCity] = useState(farmer?.city ?? '');
  const [country, setCountry] = useState(farmer?.country ?? '');
  const [ktp] = useState(farmer?.ktp ?? '');
  const [province, setProvince] = useState(farmer?.province ?? '');
  const [provincesList, setProvincesList] = useState([]);
  const [allProvincesList, setAllProvincesList] = useState([]);
  const [postalCode, setPostalCode] = useState(farmer?.postalCode ?? '');
  // const [updatedCustomFields, setUpdatedCustomFields] = useState(
  //   farmer?.extra_fields ?? {},
  // );
  const [error, setError] = useState('');
  const [displayModal, setDisplayModal] = useState(false);
  const [focused, setFocused] = useState('country');
  const [selectPicModal, setSelectPicModal] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const { userCompanyDetails } = useSelector((state) => state.login);
  const appCustomFields = userCompanyDetails?.app_custom_fields
    ? stringToJson(userCompanyDetails.app_custom_fields)
    : null;
  const fieldVisibility = appCustomFields?.field_visibility?.add_farmer ?? null;

  useEffect(() => {
    setupProvince();
  }, []);

  // setting province list and initializing dial code values
  const setupProvince = async () => {
    getProvinceList(farmer.country);

    const arrayOfObjs = Object.entries(Countries.data).map((e) => ({
      label: `+${e[1].dial_code}`,
      value: e[1].dial_code,
      country_name: e[0],
    }));

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

  // const updateCustomData = (item, index) => {
  //   if (updatedCustomFields?.custom_fields?.farmer_fields) {
  //     if (
  //       updatedCustomFields.custom_fields.farmer_fields[index].key == item.key
  //     ) {
  //       updatedCustomFields.custom_fields.farmer_fields[index].value =
  //         item.value;

  //       setUpdatedCustomFields(updatedCustomFields);
  //     }
  //   }
  // };

  /**
   * Capitalizing first letter for name
   */
  const changeName = async () => {
    let text = name;

    if (text !== '') {
      setError('');
      const firstLetter = text.substr(0, 1);
      text = firstLetter.trim().toUpperCase() + text.substr(1);
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
      const firstLetter = text.substr(0, 1);
      text = firstLetter.trim().toUpperCase() + text.substr(1);
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
      const firstLetter = text.substr(0, 1);
      text = firstLetter.trim().toUpperCase() + text.substr(1);
    }

    setCity(text);
  };

  /**
   * Capitalizing first letter of input text
   * @param   {string} text input text
   * @returns {string}      capitalized text
   */
  const capitalizeText = async (text) => {
    if (text === '') {
      return text;
    }

    setError('');
    const firstLetter = text.substr(0, 1);
    const sumText = firstLetter.trim().toUpperCase() + text.substr(1);
    return sumText.trim();
  };

  /**
   * opening country/province list modal based on type
   * @param {string} type modal list type: 'country' or 'province'
   */
  const openDisplayModal = (type) => {
    if (type === 'country') {
      setFocused('country');
      setCountriesList(allCountriesList);
      setDisplayModal(true);
    } else if (type === 'province') {
      setFocused('province');
      setProvincesList(allProvincesList);
      setDisplayModal(true);
    }
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

        const arrayOfObjs = Object.entries(Countries.data).map((e) => ({
          label: `+${e[1].dial_code}`,
          value: e[1].dial_code,
          country_name: e[0],
        }));

        const selectedCountryArr = arrayOfObjs.filter((x) => {
          return x.value === newDialCode;
        });

        if (selectedCountryArr.length > 0) {
          getProvinceList(selectedCountryArr[0].country_name);
        }
      }
    }
  };

  /**
   * filtering country list based on search text
   * @param {string} text search text from country modal
   */
  const onSearchCountry = (text) => {
    const countryText = text.toLowerCase();
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
    const provinceText = text.toLowerCase();
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
    setProvince('');

    const arrayOfObj = Object.entries(Countries.data).map((e) => ({
      label: e[0],
      additional: e[1],
      value: e[0],
    }));

    const listOfCountries = [...arrayOfObj];

    setCountriesList(listOfCountries);
    setAllCountriesList(listOfCountries);

    const selectedCountryArr = listOfCountries.filter((x) => {
      return x.label === text;
    });

    setCountry(text);

    // setting dial code based on country text
    if (dialCode !== selectedCountryArr[0].additional.dial_code) {
      setDialCode(selectedCountryArr[0].additional.dial_code);
    }

    if (selectedCountryArr.length > 0) {
      // setting province list based on country text
      const provinces = selectedCountryArr[0].additional.sub_divisions;
      const selectedProvinces = Object.entries(provinces).map((e) => ({
        label: e[0],
        location: e[1],
        value: e[0],
      }));

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
      .catch(() => {
        // console.log('error')
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
      .then((image) => {
        // only image type is allowed
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
          selection_case: 'edit_farmer',
        });
        setProfilePic(image.path);
      })
      .catch(() => {
        // console.log('error')
      });
  };

  /**
   * navigate to previous page
   */
  const backNavigation = () => {
    navigation.goBack(null);
  };

  /**
   * checks any farmer with same details exist
   * @param   {object}  props farmer details
   * @returns {boolean}       if duplicate found returns true otherwise false
   */
  const checkDuplicateFarmer = async (props) => {
    const {
      farmerName,
      farmerMobile,
      farmerStreet,
      farmerCity,
      farmerCountry,
      farmerProvince,
      farmerPostalCode,
      farmerDialCode,
      farmerProfilePic,
      farmerKtp,
    } = props;

    // finding farmers with same name
    const nodes = await searchFarmersByName(farmerName);

    if (nodes.length > 0) {
      const fullMobileNumber =
        farmerMobile !== '' ? `+${farmerDialCode} ${farmerMobile}`.trim() : '';

      // filtering existing farmer with same details
      const duplicates = nodes.filter((item) => {
        return (
          farmerName === item.name.trim() &&
          fullMobileNumber ===
            (item.phone.trim().includes(' ') ? item.phone.trim() : '') &&
          farmerKtp === item.ktp.trim() &&
          farmerStreet === item.street.trim() &&
          farmerCity === item.city.trim() &&
          farmerCountry === item.country &&
          farmerProvince === item.province &&
          farmerPostalCode === item.zipcode.trim() &&
          farmerProfilePic === item.image
        );
      });

      if (duplicates && duplicates.length > 0) {
        return true;
      }
      return false;
    }
    return false;
  };

  /**
   * updating farmer in local db and starts syncing
   */
  const onSave = async () => {
    await changeName();
    await changeStreet();
    await changeCity();

    const farmerName = await capitalizeText(name);
    const farmerMobile = mobile.trim();
    const farmerStreet = await capitalizeText(street);
    const farmerCity = await capitalizeText(city);
    const farmerCountry = country.trim();
    const farmerProvince = province.trim();
    const farmerPostalCode = postalCode.trim();
    const farmerDialCode = dialCode.trim();
    const farmerProfilePic = profilePic.trim();
    const farmerKtp = ktp.trim();

    // checking emoji in fields
    const emojiFields = [
      { name: I18n.t('full_name'), value: farmerName },
      { name: I18n.t('mobile_number'), value: farmerMobile },
      { name: I18n.t('street_name'), value: farmerStreet },
      { name: I18n.t('city_village'), value: farmerCity },
      { name: I18n.t('postal_code'), value: farmerPostalCode },
    ];

    const [emojiValid, emojiError] = await checkEmojis(emojiFields);
    if (!emojiValid) {
      setError(emojiError);
      scrollRef.current.scrollToEnd({ animated: true });
      return;
    }

    // checking mandatory fields
    const mandatoryFields = [
      { name: I18n.t('full_name'), value: farmerName },
      { name: I18n.t('city_village'), value: farmerCity },
      { name: I18n.t('country'), value: farmerCountry },
      { name: I18n.t('province'), value: farmerProvince },
    ];

    const [mandatoryValid, mandatoryError] = await checkMandatory(
      mandatoryFields,
    );

    if (!mandatoryValid) {
      setError(mandatoryError);
      scrollRef.current.scrollToEnd({ animated: true });
      return;
    }

    if (
      farmerName === farmer.name &&
      farmerMobile === farmer.mobile &&
      farmerStreet === farmer.street &&
      farmerCity === farmer.city &&
      farmerCountry === farmer.country &&
      farmerProvince === farmer.province &&
      farmerPostalCode === farmer.postalCode &&
      farmerDialCode === farmer.dialCode &&
      farmerProfilePic === farmer.profilePic
    ) {
      // no changes
      backNavigation();
      return;
    }

    // mobile number validations
    if (
      farmerMobile !== '' &&
      (farmerMobile.length < 3 ||
        farmerMobile.length > (farmerDialCode.length <= 2 ? 15 : 14))
    ) {
      setError(I18n.t('mobile_number_is_invalid'));
      scrollRef.current.scrollToEnd({ animated: true });
      return;
    }

    // // custom field validation
    // if (updatedCustomFields?.custom_fields?.farmer_fields) {
    //   const farmerFields =
    //     updatedCustomFields.custom_fields.farmer_fields;

    //   let customFieldsValid = true;
    //   farmerFields.map((field) => {
    //     if (field.required == true && !field.value) {
    //       setError(
    //         `${field?.label?.en ?? field.key} ${I18n.t("required")}`
    //       );
    //       customFieldsValid = false;
    //       return;
    //     }
    //   });

    //   if (!customFieldsValid) {
    //     scrollRef.current.scrollToEnd({ animated: true });
    //     return;
    //   }
    // }

    // checking farmer duplicates
    const duplicate = await checkDuplicateFarmer({
      farmerName,
      farmerMobile,
      farmerStreet,
      farmerCity,
      farmerCountry,
      farmerProvince,
      farmerPostalCode,
      farmerDialCode,
      farmerProfilePic,
      farmerKtp,
    });

    if (duplicate) {
      setAlertModal(true);
      return;
    }

    let phone = '';
    if (farmerMobile) {
      phone = `${farmerDialCode ?? ''} ${farmerMobile}`.trim();
    }

    const farmerDetails = {
      name: farmerName,
      type: 2,
      phone,
      street: farmerStreet,
      city: farmerCity,
      country: farmerCountry,
      province: farmerProvince,
      zipcode: farmerPostalCode,
      image: farmerProfilePic,
      is_modified: true,
      id: otherDetails.server_id,
      latitude: otherDetails.latitude,
      longitude: otherDetails.longitude,
      is_card_modified: otherDetails.is_card_modified,
      extra_fields: otherDetails.extra_fields,
      created_on: otherDetails.created_on,
      card_id: farmer.card_id,
    };

    // updating farmer details to local db
    await updateFarmer(otherDetails.id, farmerDetails);

    const newDetails = { ...farmerDetails, id: otherDetails.id };
    updateEditedFarmer(newDetails);

    // if network is available, starts syncing
    if (isConnected && !syncInProgress) {
      syncUpdatedFarmers();
    }

    backNavigation();
  };

  /**
   * setting country/province
   * @param {string} label country/province name
   */
  const onSelectModalItem = (label) => {
    setDisplayModal(false);
    if (focused === 'country') {
      if (country !== label) {
        getProvinceList(label);
      }
    } else {
      selectProvince(label);
    }
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

  const duplicateFarmerImage = () => {
    return (
      <Image
        source={require('../../assets/images/duplicate-farmer.png')}
        style={styles.alertImage}
      />
    );
  };

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          backgroundColor={theme.background_1}
          title={I18n.t('edit_farmer')}
          leftIcon="arrow-left"
          onPress={() => backNavigation()}
          rightText={I18n.t('save')}
          rightTextColor="#EA2553"
          onPressRight={() => onSave()}
          extraStyle={{ paddingLeft: width * 0.05 }}
        />

        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="always"
          style={{ paddingHorizontal: width * 0.05 }}
        >
          <View style={{ width: '100%' }}>
            <View style={styles.uploadImageContainer}>
              <View
                style={[styles.uploadImageView, { backgroundColor: '#ffffff' }]}
              >
                {profilePic === '' && (
                  <Icon name="Camera" color="#5691AE" size={50} />
                )}
                {profilePic !== '' && (
                  <FastImage
                    source={{ uri: profilePic }}
                    style={styles.uploadImageView}
                  />
                )}
              </View>
              <TouchableOpacity
                onPress={() => setSelectPicModal(true)}
                style={styles.addPicture}
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
            placeholder={I18n.t('full_name')}
            value={name}
            onChangeText={(text) => setName(text)}
            onBlur={() => changeName()}
            onSubmitEditing={() => mobileRef.current.focus()}
            visibility={fieldVisibility ? fieldVisibility?.name : true}
            autoCapitalize="sentences"
            extraStyle={{ width: '100%', color: theme.text_1 }}
          />

          {(fieldVisibility ? fieldVisibility?.country : true) && (
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
                placeholder={I18n.t('mobile_number')}
                value={mobile}
                onChangeText={(text) => {
                  setMobile(text.replace(/[^0-9]/g, ''));
                }}
                keyboardType="numeric"
                internalPadding={70}
                extraStyle={{ width: '100%', color: theme.text_1 }}
              />
            </View>
          )}

          <View style={styles.formTitleContainer}>
            <Text style={styles.formTitle}>{I18n.t('address')}</Text>
          </View>

          <FormTextInput
            placeholder={I18n.t('street_name')}
            value={street}
            onSubmitEditing={() => cityRef.current.focus()}
            onChangeText={(text) => setStreet(text)}
            onBlur={() => changeStreet()}
            visibility={fieldVisibility ? fieldVisibility?.street : true}
            autoCapitalize="sentences"
            extraStyle={{ width: '100%', color: theme.text_1 }}
          />

          <FormTextInput
            mandatory
            placeholder={I18n.t('city_village')}
            value={city}
            inputRef={cityRef}
            onChangeText={(text) => setCity(text)}
            onBlur={() => changeCity()}
            visibility={fieldVisibility ? fieldVisibility?.city : true}
            autoCapitalize="sentences"
            extraStyle={{ width: '100%', color: theme.text_1 }}
          />

          {(fieldVisibility ? fieldVisibility?.country : true) && (
            <TouchableOpacity onPress={() => openDisplayModal('country')}>
              <View pointerEvents="none">
                <FormTextInput
                  mandatory
                  placeholder={I18n.t('country')}
                  value={country}
                  extraStyle={{
                    width: '100%',
                    color: theme.text_1,
                  }}
                />
              </View>
            </TouchableOpacity>
          )}

          {(fieldVisibility ? fieldVisibility?.province : true) && (
            <TouchableOpacity onPress={() => openDisplayModal('province')}>
              <View pointerEvents="none">
                <FormTextInput
                  mandatory
                  placeholder={I18n.t('province')}
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
            placeholder={I18n.t('postal_code')}
            value={postalCode}
            onChangeText={(text) => {
              setPostalCode(text);
            }}
            visibility={fieldVisibility ? fieldVisibility?.postcode : true}
            extraStyle={{ width: '100%', color: theme.text_1 }}
          />

          {/* {updatedCustomFields?.custom_fields?.farmer_fields &&
            updatedCustomFields.custom_fields.farmer_fields.map(
              (item, index) => (
                <CustomInputFields
                  key={index.toString()}
                  item={item}
                  index={index}
                  updatedItem={updateCustomData}
                />
              )
            )} */}

          {error !== '' && <Text style={styles.errorMessage}>{error}</Text>}

          {displayModal && (
            <Modal
              animationType="slide"
              transparent
              visible={displayModal}
              onRequestClose={() => {
                setDisplayModal(false);
              }}
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
                    ListEmptyComponent={() => (
                      <Text style={styles.emptyText}>
                        {I18n.t('no_matches_found')}
                      </Text>
                    )}
                    keyExtractor={(item, index) => index.toString()}
                  />
                </View>
              </View>
            </Modal>
          )}

          {selectPicModal && (
            <SelectPicture
              visible={selectPicModal}
              hideModal={() => setSelectPicModal(false)}
              onSelectGallery={() => onChangePicture()}
              onSelectCamera={() => onTakePicture()}
            />
          )}

          {alertModal && (
            <CommonAlert
              visible={alertModal}
              title={I18n.t('duplicate_farmer_alert')}
              message={I18n.t('farmer_already_exist')}
              submitText={I18n.t('ok')}
              icon={duplicateFarmerImage()}
              onSubmit={() => {
                setAlertModal(false);
                setError('');
              }}
              onRequestClose={() => {
                setAlertModal(false);
                setError('');
              }}
            />
          )}
        </ScrollView>
      </View>
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
    dialCodeWrap: {
      width: 50,
      top: 25,
      left: 20,
      position: 'absolute',
      zIndex: 1,
    },
    countryModalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.2);',
    },
    countryModalSub: {
      height: '60%',
      marginTop: 'auto',
      backgroundColor: theme.background_1,
    },
    countryFlatList: {
      flex: 1,
      marginHorizontal: 10,
      backgroundColor: theme.background_1,
    },
    flatListItemWrap: {
      flex: 1,
      height: 40,
      marginTop: 10,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.12)',
      alignContent: 'center',
      justifyContent: 'center',
    },
    flatListItemText: {
      marginLeft: 10,
      fontFamily: theme.font_regular,
      color: theme.text_2,
    },
    emptyText: {
      color: theme.text_1,
      fontSize: 13,
      fontFamily: theme.font_regular,
      textAlign: 'center',
    },
    alertImage: {
      width: width * 0.33,
      height: width * 0.33,
      resizeMode: 'contain',
    },
  });
};

export default EditFarmer;
