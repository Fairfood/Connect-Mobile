import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Keyboard,
  FlatList,
  ToastAndroid,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CountryPicker from 'react-native-country-picker-modal';
import { findFarmerByName } from '../../services/farmersHelper';
import {
  checkEmojis,
  checkMandatory,
  stringToJson,
} from '../../services/commonFunctions';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import CustomButton from '../../components/CustomButton';
import FormTextInput from '../../components/FormTextInput';
import Icon from '../../icons';
import Countrys from '../../services/countrys';
import I18n from '../../i18n/i18n';
import SearchComponent from '../../components/SearchComponent';
import SelectPicture from '../../components/SelectPicture';
import CommonAlert from '../../components/CommonAlert';
import CustomInputFields from '../../components/CustomInputFields';
import * as consts from '../../services/constants';

const { height, width } = Dimensions.get('window');

const AddNewFarmer = ({ navigation }) => {
  const addFarmerScrollRef = useRef();
  const [stepper, setStepper] = useState(1);
  const [farmer, setFarmer] = useState({});
  const [countrysList, setCountrysList] = useState([]);
  const [allCountrysList, setAllCountrysList] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    setupCountryList();
  }, []);

  /**
   * setting country list
   */
  const setupCountryList = async () => {
    const arrayOfObj = Object.entries(Countrys.data).map((e) => ({
      label: e[0],
      additional: e[1],
      value: e[0],
    }));

    setCountrysList([...arrayOfObj]);

    setAllCountrysList([...arrayOfObj]);
  };

  /**
   * on back navigation pages are srolled to backwards
   */
  const backNavigation = () => {
    if (isFocused) {
      if (stepper === 1) {
        navigation.goBack(null);
      } else {
        addFarmerScrollRef.current.scrollTo({
          x: (stepper - 2) * width,
          y: 0,
          animated: true,
        });
        setStepper(stepper - 1);
      }
    }
  };

  /**
   * each page submition farmer details updated and scrolled to forward
   *
   * @param {object} obj famrmer details object
   */
  const onNext = (obj) => {
    Keyboard.dismiss();

    if (stepper < 3) {
      if (stepper === 1) {
        setFarmer({ ...farmer, ...obj });
        setStepper(stepper + 1);
        addFarmerScrollRef.current.scrollTo({
          x: 1 * width,
          y: 0,
          animated: true,
        });
      } else {
        addFarmerScrollRef.current.scrollTo({
          x: 2 * width,
          y: 0,
          animated: true,
        });
        setFarmer({ ...farmer, ...obj });
        setStepper(stepper + 1);
      }
    } else if (stepper === 3) {
      setFarmer({ ...farmer, ...obj });
    }
  };

  const onAddFarmer = () => {
    navigation.navigate('IssueFarmerCard', { farmer, newFarmer: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        backgroundColor={consts.APP_BG_COLOR}
        title={I18n.t('add_new_farmer')}
        leftIcon='arrow-left'
        onPress={() => backNavigation()}
        extraStyle={{ paddingHorizontal: 25 }}
      />

      <Steps stepper={stepper} />

      <ScrollView
        ref={addFarmerScrollRef}
        keyboardShouldPersistTaps='handled'
        pagingEnabled
        horizontal
        scrollEnabled={false}
        showsVerticalScrollIndicator
        automaticallyAdjustContentInsets={false}
        showsHorizontalScrollIndicator={false}
      >
        {stepper === 1 && <StepOne onNext={onNext} farmer={farmer} />}

        {stepper === 2 && (
          <StepTwo
            onNext={onNext}
            farmer={farmer}
            countrysList={countrysList}
            allCountrysList={allCountrysList}
          />
        )}

        {stepper === 3 && (
          <StepThree
            onNext={onNext}
            farmer={farmer}
            onAddFarmer={onAddFarmer}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const StepOne = ({ onNext, farmer }) => {
  const { userCompanyDetails } = useSelector((state) => state.login);
  const appCustomFields = userCompanyDetails?.app_custom_fields
    ? stringToJson(userCompanyDetails.app_custom_fields)
    : null;
  const fieldVisibility = appCustomFields?.field_visibility?.add_farmer ?? null;

  const mobileref = useRef(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [name, setName] = useState(farmer?.name ?? '');
  const [ktp, setKtp] = useState(farmer?.ktp ?? '');
  const [mobile, setMobile] = useState(farmer?.mobile ?? '');
  const [dialCode, setDialCode] = useState(farmer?.dialCode ?? '');
  const [error, setError] = useState('');
  const [countrysList, setCountrysList] = useState([]);
  const [updatedCustomFields, setUpdatedCustomFields] = useState(
    farmer?.extraFields ?? appCustomFields,
  );

  useEffect(() => {
    setupCountry();
  }, []);

  /**
   * setting country and country list
   */
  const setupCountry = async () => {
    const arrayOfObj = Object.entries(Countrys.data).map((e) => ({
      label: `+${e[1].dial_code}`,
      value: e[1].dial_code,
      country_name: e[0],
    }));

    // taking the previously used country while adding farmer
    const previousFarmerCountry = await AsyncStorage.getItem('country');
    let country = [];

    if (previousFarmerCountry) {
      country = arrayOfObj.filter((i) => {
        return i.country_name === previousFarmerCountry;
      });
    } else {
      // using the country same as the related company
      country = arrayOfObj.filter((i) => {
        return i.country_name === userCompanyDetails.country;
      });
    }

    if (country.length > 0) {
      setDialCode(country[0].value);
    } else {
      setDialCode(arrayOfObj[0].value);
    }

    setCountrysList([...arrayOfObj]);
  };

  /**
   * Capitalizing first letter for name
   */
  const changeName = async () => {
    let text = name;

    if (text !== '') {
      const firstLetter = text.substr(0, 1);
      text = (await firstLetter.trim().toUpperCase()) + text.substr(1);
    }

    setName(text);
  };

  /**
   * setting dial code
   *
   * @param {object} country selected country
   */
  const onSelect = (country) => {
    if (country.callingCode.length > 0) {
      setDialCode(country.callingCode[0]);
    } else {
      ToastAndroid.show(I18n.t('cannot_select_country'), ToastAndroid.SHORT);
    }
  };

  /**
   * validating datas
   */
  const validateDatas = async () => {
    setButtonLoading(true);

    const farmerName = await capitalizeText(name);
    const farmerMobile = mobile.trim();
    const farmerKtp = ktp.trim();
    const farmerDialCode = dialCode.trim();

    // checking emoji in fields
    const emojiFields = [
      { name: I18n.t('full_name'), value: farmerName },
      { name: I18n.t('mobile_number'), value: farmerMobile },
      { name: I18n.t('ktp'), value: farmerKtp },
    ];

    const [emojiValid, emojiError] = await checkEmojis(emojiFields);
    if (!emojiValid) {
      setError(emojiError);
      setButtonLoading(false);
      return;
    }

    // checking mandatory fields
    const mandatoryFields = [{ name: I18n.t('full_name'), value: farmerName }];

    const [madatoryValid, madatoryError] = await checkMandatory(
      mandatoryFields,
    );

    if (!madatoryValid) {
      setError(madatoryError);
      setButtonLoading(false);
      return;
    }

    // checking mobile number is valid
    if (
      farmerMobile !== '' &&
      (farmerMobile.length < 3 ||
        farmerMobile.length > (farmerDialCode.length <= 2 ? 15 : 14))
    ) {
      setError(I18n.t('mobile_number_is_invalid'));
      setButtonLoading(false);
      return;
    }

    // checking custom fileds
    if (updatedCustomFields?.custom_fields?.farmer_fields) {
      const farmerFields = updatedCustomFields.custom_fields.farmer_fields;

      let customFieldsValid = true;
      // checking custom mandatory fileds
      farmerFields.map((field) => {
        if (field.required === true && !field.value) {
          setError(`${field?.label?.en ?? field.key} ${I18n.t('required')}`);
          customFieldsValid = false;
        }
      });

      if (!customFieldsValid) {
        setButtonLoading(false);
        return;
      }
    }

    const updatedObj = {
      name: farmerName,
      mobile: farmerMobile,
      dialCode: farmerDialCode,
      ktp: farmerKtp,
      extraFields: updatedCustomFields,
    };

    if (dialCode !== farmer.dialCode) {
      updatedObj.country = '';
      updatedObj.province = '';
    }

    setError('');
    setButtonLoading(false);
    onNext(updatedObj);
  };

  /**
   * updating custom field data
   *
   * @param {object} item currently edited field
   * @param {number} index currently edited field index
   */
  const updateCustomData = (item, index) => {
    if (updatedCustomFields?.custom_fields?.farmer_fields) {
      if (
        updatedCustomFields.custom_fields.farmer_fields[index].key === item.key
      ) {
        updatedCustomFields.custom_fields.farmer_fields[index].value =
          item.value;

        setUpdatedCustomFields(updatedCustomFields);
      }
    }
  };

  return (
    <ScrollView
      style={styles.pageOneContainer}
      keyboardShouldPersistTaps='always'
    >
      <View style={styles.formTitleContainer}>
        <Text style={styles.formTitle}>{I18n.t('basic_information')}</Text>
      </View>
      <FormTextInput
        placeholder={`${I18n.t('full_name')}*`}
        value={name}
        onChangeText={(text) => setName(text)}
        onSubmitEditing={() => mobileref.current.focus()}
        onBlur={() => changeName()}
        visibility={fieldVisibility ? fieldVisibility?.name : true}
        autoCapitalize='sentences'
        color={consts.TEXT_PRIMARY_COLOR}
        extraStyle={{ width: '100%' }}
      />

      {(fieldVisibility ? fieldVisibility?.phone : true) && (
        <View>
          <View style={styles.countryPickerWrap}>
            {countrysList.length > 0 && (
              <CountryPicker
                withFilter
                withAlphaFilter
                withCallingCode
                keyboardShouldPersistTaps='always'
                placeholder={`+${dialCode.replace('+', '')}`}
                onSelect={onSelect}
              />
            )}
          </View>
          <FormTextInput
            placeholder={I18n.t('mobile_number')}
            value={mobile}
            inputRef={mobileref}
            color={consts.TEXT_PRIMARY_COLOR}
            keyboardType='numeric'
            onChangeText={(text) => {
              setMobile(text.replace(/[^0-9]/g, ''));
            }}
            internalpadding={70}
            extraStyle={{ width: '100%' }}
          />
        </View>
      )}

      <FormTextInput
        placeholder={I18n.t('ktp')}
        value={ktp}
        color={consts.TEXT_PRIMARY_COLOR}
        onChangeText={(text) => setKtp(text)}
        visibility={fieldVisibility ? fieldVisibility?.ktp : true}
        extraStyle={{ width: '100%' }}
      />

      {updatedCustomFields?.custom_fields?.farmer_fields &&
        updatedCustomFields.custom_fields.farmer_fields.map((item, index) => (
          <CustomInputFields
            key={index.toString()}
            item={item}
            index={index}
            updatedItem={updateCustomData}
          />
        ))}

      <View style={styles.errorWrap}>
        {error !== '' && <Text style={styles.errorMessage}>{error}</Text>}

        <CustomButton
          buttonText={I18n.t('next_address')}
          onPress={() => validateDatas()}
          disabled={buttonLoading}
          extraStyle={{ width: '100%' }}
        />
      </View>
    </ScrollView>
  );
};

const StepTwo = ({ onNext, farmer, countrysList, allCountrysList }) => {
  const cityref = useRef(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [street, setStreet] = useState(farmer?.street ?? '');
  const [city, setCity] = useState(farmer?.city ?? '');
  const [country, setCountry] = useState(farmer?.country ?? '');
  const [selectedCountry, setSelectedCountry] = useState(
    farmer?.selectedCountry ?? null,
  );
  const [displayModal, setDisplayModal] = useState(false);
  const [focused, setFocused] = useState('country');
  const [selectedProvince, setSelectedProvince] = useState(
    farmer?.selectedProvince ?? null,
  );
  const [province, setProvince] = useState(farmer?.province ?? '');
  const [provincesList, setProvincesList] = useState([]);
  const [allProvincesList, setAllProvincesList] = useState([]);
  const [countryList, setCountryList] = useState(allCountrysList);
  const [postalCode, setPostalCode] = useState(farmer?.postalCode ?? '');
  const [error, setError] = useState('');
  const [alertModal, setAlertModal] = useState(false);
  const { userCompanyDetails } = useSelector((state) => state.login);
  const appCustomFields = userCompanyDetails?.app_custom_fields
    ? stringToJson(userCompanyDetails.app_custom_fields)
    : null;
  const fieldVisibility = appCustomFields?.field_visibility?.add_farmer ?? null;

  useEffect(() => {
    setupCountry();
  }, []);

  /**
   * setting country based on dial code and fetching its provinces
   */
  const setupCountry = async () => {
    if (!farmer?.country) {
      const { dialCode } = farmer;
      const currentCountry = countrysList.filter((i) => {
        return i.additional.dial_code === dialCode;
      });

      if (currentCountry.length > 0) {
        getProvinceList(currentCountry[0].value);
      } else {
        getProvinceList(countrysList[0].value);
      }
    } else if (!farmer?.province) {
      getProvinceList(farmer.country);
    }
  };

  /**
   * Capitalizing first letter for street
   */
  const changeStreet = async () => {
    let text = street;

    if (text !== '') {
      setError('');
      const firstLetter = text.substr(0, 1);
      text = (await firstLetter.trim().toUpperCase()) + text.substr(1);
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
      text = (await firstLetter.trim().toUpperCase()) + text.substr(1);
    }

    setCity(text);
  };

  /**
   * opening country/provice modal based on type
   *
   * @param  {string} type country or province
   */
  const openDisplayModal = (type) => {
    if (type === 'country') {
      setFocused('country');
      setCountryList(allCountrysList);
      setDisplayModal(true);
    } else if (type === 'province') {
      setFocused('province');
      setProvincesList(allProvincesList);
      setDisplayModal(true);
    }
  };

  /**
   * setting country/provice selected from modal
   *
   * @param  {object} item object containing country/provice details
   */
  const onSelectingModalItem = async (item) => {
    setDisplayModal(false);
    if (focused === 'country') {
      if (country !== item.label) {
        await AsyncStorage.removeItem('province');
        getProvinceList(item.label);
      }
    } else {
      selectProvince(item.label);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => onSelectingModalItem(item)}
        style={styles.countryItems}
      >
        <Text style={styles.countryItemText}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  /**
   * filtering country based on search text
   *
   * @param  {string} text country search text
   */
  const onSearchCountry = (text) => {
    const countryText = text.toLowerCase();
    if (countryText === '') {
      setCountryList(allCountrysList);
    } else {
      const filteredCountrysList = allCountrysList.filter((e) => {
        const element = e.label.toLowerCase();
        return element.includes(countryText);
      });
      setCountryList(filteredCountrysList);
    }
  };

  /**
   * filtering provice based on search text
   *
   * @param  {string} text provice search text
   */
  const onSearchProvince = (text) => {
    const proviceText = text.toLowerCase();
    if (proviceText === '') {
      setProvincesList(allProvincesList);
    } else {
      const filteredCountrysList = allProvincesList.filter((e) => {
        const element = e.label.toLowerCase();
        return element.includes(proviceText);
      });
      setProvincesList(filteredCountrysList);
    }
  };

  /**
   * setting provice list based on country
   *
   * @param  {string} text selected country
   */
  const getProvinceList = async (text) => {
    const filterdCountry = countrysList.filter((x) => {
      return x.label === text;
    });

    setProvince('');
    setSelectedProvince(null);
    setCountry(text);
    await AsyncStorage.setItem('country', text);

    if (filterdCountry.length > 0) {
      setSelectedCountry(filterdCountry[0]);
      const provinces = filterdCountry[0].additional.sub_divisions;

      const selectedProvinces = Object.entries(provinces).map((e) => ({
        label: e[0],
        location: e[1],
        value: e[0],
      }));

      setProvincesList([...selectedProvinces]);

      setAllProvincesList([...selectedProvinces]);

      const previousProvince = await AsyncStorage.getItem('province');
      let currentProvince = '';

      const previousCountry = await AsyncStorage.getItem('country');
      if (previousCountry && previousCountry === text && previousProvince) {
        currentProvince = previousProvince;
      } else {
        currentProvince = userCompanyDetails.province;
      }

      const selectedItem = selectedProvinces.filter((prov) => {
        return prov.label === currentProvince;
      });

      if (selectedItem.length > 0) {
        setSelectedProvince(selectedItem[0]);
        setProvince(selectedItem[0].label);
      }
    } else {
      setSelectedCountry(null);
    }
  };

  const selectProvince = async (item) => {
    setProvince(item);

    if (item != null) {
      await AsyncStorage.setItem('province', item);
    } else {
      await AsyncStorage.removeItem('province');
    }

    const filteredProvince = provincesList.filter((prov) => {
      return prov.label === item;
    });

    if (filteredProvince.length > 0) {
      setSelectedProvince(filteredProvince[0]);
    }
  };

  const validateDatas = async () => {
    setButtonLoading(true);

    const farmerName = farmer.name;
    const farmerMobile = farmer.mobile;
    const farmerKtp = farmer.ktp;
    const farmerDialCode = farmer.dialCode;
    const farmerStreet = await capitalizeText(street);
    const farmerCity = await capitalizeText(city);
    const farmerCountry = country;
    const farmerProvince = province;
    const farmerPostalCode = postalCode.trim();

    // checking emoji in fields
    const emojiFields = [
      { name: I18n.t('street_name'), value: farmerStreet },
      { name: I18n.t('city_village'), value: farmerCity },
      { name: I18n.t('country'), value: farmerCountry },
      { name: I18n.t('province'), value: farmerProvince },
      { name: I18n.t('postal_code'), value: farmerPostalCode },
    ];

    const [emojiValid, emojiError] = await checkEmojis(emojiFields);
    if (!emojiValid) {
      setError(emojiError);
      setButtonLoading(false);
      return;
    }

    // checking mandatory fields
    const mandatoryFields = [
      { name: I18n.t('city_village'), value: farmerCity },
      { name: I18n.t('country'), value: farmerCountry },
      { name: I18n.t('province'), value: farmerProvince },
    ];

    const [madatoryValid, madatoryError] = await checkMandatory(
      mandatoryFields,
    );

    if (!madatoryValid) {
      setError(madatoryError);
      setButtonLoading(false);
      return;
    }

    setError('');

    const updatedObj = {
      street: farmerStreet,
      city: farmerCity,
      country: farmerCountry,
      province: farmerProvince,
      postalCode: farmerPostalCode,
      selectedProvince,
      selectedCountry,
    };

    // checking duplicate farmer
    const nodes = await findFarmerByName(farmerName);
    if (nodes.length > 0) {
      const fullMobileNumber =
        farmerMobile !== '' ? `+${farmerDialCode} ${farmerMobile}`.trim() : '';

      const duplicate = nodes.filter((item) => {
        return (
          farmerName === item.name.trim() &&
          fullMobileNumber ===
            (item.phone.trim().includes(' ') ? item.phone.trim() : '') &&
          farmerKtp === item.ktp.trim() &&
          farmerStreet === item.street.trim() &&
          farmerCity === item.city.trim() &&
          farmerCountry === item.country &&
          farmerProvince === item.province &&
          farmerPostalCode === item.zipcode.trim()
        );
      });

      if (duplicate.length > 0) {
        setButtonLoading(false);
        setAlertModal(true);
      } else {
        stepTwoProceed(updatedObj);
      }
    } else {
      stepTwoProceed(updatedObj);
    }
  };

  const stepTwoProceed = async (updatedObj) => {
    setError('');
    setButtonLoading(false);
    onNext(updatedObj);
  };

  return (
    <ScrollView
      style={styles.stepTwoContainer}
      keyboardShouldPersistTaps='always'
    >
      <KeyboardAvoidingView
        behavior='position'
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : -40}
        style={{ flex: 1 }}
      >
        <View style={styles.formTitleContainer}>
          <Text style={styles.formTitle}>{I18n.t('address')}</Text>
        </View>

        <FormTextInput
          placeholder={I18n.t('street_name')}
          value={street}
          onChangeText={(text) => setStreet(text)}
          onSubmitEditing={() => cityref.current.focus()}
          onBlur={() => changeStreet()}
          visibility={fieldVisibility ? fieldVisibility?.street : true}
          autoCapitalize='sentences'
          color={consts.TEXT_PRIMARY_COLOR}
          extraStyle={{ width: '100%' }}
        />

        <FormTextInput
          inputRef={cityref}
          mandatory
          placeholder={I18n.t('city_village')}
          value={city}
          onChangeText={(text) => setCity(text)}
          onBlur={() => changeCity()}
          visibility={fieldVisibility ? fieldVisibility?.city : true}
          autoCapitalize='sentences'
          color={consts.TEXT_PRIMARY_COLOR}
          extraStyle={{ width: '100%' }}
        />

        {(fieldVisibility ? fieldVisibility?.country : true) && (
          <TouchableOpacity onPress={() => openDisplayModal('country')}>
            <View pointerEvents='none'>
              <FormTextInput
                mandatory
                placeholder={I18n.t('country')}
                value={country}
                color={consts.TEXT_PRIMARY_COLOR}
                extraStyle={{ width: '100%' }}
              />
            </View>
          </TouchableOpacity>
        )}

        {(fieldVisibility ? fieldVisibility?.province : true) && (
          <TouchableOpacity onPress={() => openDisplayModal('province')}>
            <View pointerEvents='none'>
              <FormTextInput
                mandatory
                placeholder={I18n.t('province')}
                values={provincesList}
                value={province}
                color={consts.TEXT_PRIMARY_COLOR}
                extraStyle={{ width: '100%' }}
              />
            </View>
          </TouchableOpacity>
        )}

        <FormTextInput
          placeholder={I18n.t('postal_code')}
          value={postalCode}
          onChangeText={(text) => setPostalCode(text)}
          visibility={fieldVisibility ? fieldVisibility?.postcode : true}
          color={consts.TEXT_PRIMARY_COLOR}
          extraStyle={{ width: '100%' }}
        />

        <View style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          {error !== '' && <Text style={styles.errorMessage}>{error}</Text>}

          <CustomButton
            buttonText={I18n.t('next_profile_photo')}
            onPress={() => validateDatas()}
            disabled={buttonLoading}
            extraStyle={{ width: '100%', marginBottom: 20 }}
          />
        </View>
      </KeyboardAvoidingView>

      {displayModal && (
        <Modal
          animationType='slide'
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
                data={focused === 'country' ? countryList : provincesList}
                renderItem={renderItem}
                extraData={focused}
                keyboardShouldPersistTaps='always'
                style={styles.countryFlatlist}
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

      {alertModal && (
        <CommonAlert
          visible={alertModal}
          title={I18n.t('duplicate_farmer_alert')}
          message={I18n.t('farmer_already_exist')}
          submitText={I18n.t('modify')}
          icon={(
            <Image
              source={require('../../assets/images/duplicate-farmer.png')}
              style={styles.alertImage}
            />
          )}
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
  );
};

const StepThree = ({ onNext, onAddFarmer, farmer }) => {
  const [profilePic, setProfilePic] = useState(farmer?.profilePic ?? '');
  const [selectPicModal, setSelectPicModal] = useState(false);

  /**
   * taking image from the camera and cropping the image
   */
  const onTakePicture = () => {
    setSelectPicModal(false);

    ImagePicker.openCamera({
      compressImageQuality: 0.5,
    })
      .then((image) => {
        if (image.mime && !image.mime.includes('image')) {
          ToastAndroid.show(
            I18n.t('only_image_files_allowed'),
            ToastAndroid.SHORT,
          );
          return;
        }

        setProfilePic(image.path);
        onNext({ profilePic: image.path });
      })
      .catch(() => {
        // console.log(error)
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
      .then((image) => {
        // only image file types are allowed
        if (image.mime && !image.mime.includes('image')) {
          ToastAndroid.show(
            I18n.t('only_image_files_allowed'),
            ToastAndroid.SHORT,
          );
          return;
        }

        setProfilePic(image.path);
        onNext({ profilePic: image.path });
      })
      .catch(() => {
        // console.log(error)
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

  return (
    <View style={{ width }}>
      <View style={styles.formTitleContainer}>
        <Text style={styles.formTitle}>{I18n.t('profile_photo_optional')}</Text>
      </View>
      <View style={[styles.uploadImageContainer]}>
        <TouchableOpacity
          style={styles.uploadImageView}
          onPress={() => openModal()}
        >
          {profilePic === '' && (
            <Icon name='Camera' color='#5691AE' size={50} />
          )}

          {profilePic !== '' && (
            <Image
              source={{ uri: profilePic }}
              style={styles.uploadImageView}
            />
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
                onPress={() => {
                  setProfilePic('');
                  onNext({ profilePic: '' });
                }}
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
          onPress={() => onAddFarmer()}
          extraStyle={{ width: '90%' }}
        />
      </View>

      {selectPicModal && (
        <SelectPicture
          visible={selectPicModal}
          hideModal={() => setSelectPicModal(false)}
          onSelectGallery={() => onChangePicture()}
          onSelectCamera={() => onTakePicture()}
        />
      )}
    </View>
  );
};

const Steps = ({ stepper }) => (
  <View style={styles.stepContainer}>
    <View
      style={[
        styles.stepContainerSub,
        { backgroundColor: stepper >= 1 ? '#C5EDFA' : consts.APP_BG_COLOR },
      ]}
    >
      <View
        style={[
          styles.selectedView,
          {
            backgroundColor: stepper >= 1 ? '#4DCAF4' : consts.APP_BG_COLOR,
            borderColor: stepper >= 1 ? '#4DCAF4' : '#C5EDFA',
          },
        ]}
      >
        <Text
          style={[
            styles.selectedText,
            {
              color: stepper >= 1 ? consts.APP_BG_COLOR : '#5691AE',
            },
          ]}
        >
          1
        </Text>
      </View>
    </View>
    <View
      style={[
        styles.horizontalLine,
        {
          borderTopColor: stepper > 1 ? '#C5EDFA' : '#BDBDBD',
          borderTopWidth: stepper <= 1 ? 1 : 3,
        },
      ]}
    />
    <View
      style={[
        styles.stepContainerSub,
        { backgroundColor: stepper >= 2 ? '#C5EDFA' : consts.APP_BG_COLOR },
      ]}
    >
      <View
        style={[
          styles.selectedView,
          {
            backgroundColor: stepper >= 2 ? '#4DCAF4' : consts.APP_BG_COLOR,
            borderColor: stepper >= 2 ? '#4DCAF4' : '#C5EDFA',
          },
        ]}
      >
        <Text
          style={[
            styles.selectedText,
            {
              color: stepper >= 2 ? consts.APP_BG_COLOR : '#5691AE',
            },
          ]}
        >
          2
        </Text>
      </View>
    </View>
    <View
      style={[
        styles.horizontalLine,
        {
          borderTopColor: stepper > 2 ? '#C5EDFA' : '#BDBDBD',
          borderTopWidth: stepper <= 1 ? 1 : 3,
        },
      ]}
    />
    <View
      style={[
        styles.stepContainerSub,
        { backgroundColor: stepper >= 3 ? '#C5EDFA' : consts.APP_BG_COLOR },
      ]}
    >
      <View
        style={[
          styles.selectedView,
          {
            backgroundColor: stepper >= 3 ? '#4DCAF4' : consts.APP_BG_COLOR,
            borderColor: stepper >= 3 ? '#4DCAF4' : '#C5EDFA',
          },
        ]}
      >
        <Text
          style={[
            styles.selectedText,
            {
              color: stepper >= 3 ? consts.APP_BG_COLOR : '#5691AE',
            },
          ]}
        >
          3
        </Text>
      </View>
    </View>
  </View>
);

const capitalizeText = async (text) => {
  if (text !== '') {
    const firstLetter = text.substr(0, 1);
    const sumText = (await firstLetter.trim().toUpperCase()) + text.substr(1);
    return sumText.trim();
  }

  return text;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: consts.APP_BG_COLOR,
  },
  selectedView: {
    height: 25,
    width: 25,
    borderRadius: 13,
    backgroundColor: consts.COLOR_PRIMARY,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: consts.APP_BG_COLOR,
    fontSize: 10,
  },
  horizontalLine: {
    borderTopWidth: 1,
    borderTopColor: '#BDBDBD',
    width: 70,
  },
  formTitleContainer: {
    margin: 30,
  },
  formTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: 'bold',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
  },
  uploadImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  uploadImageView: {
    backgroundColor: '#C5EDFA',
    height: 100,
    width: 100,
    borderRadius: 100 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  uploadImageText: {
    color: consts.TEXT_PRIMARY_COLOR,
    textAlign: 'left',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 14,
    marginVertical: 20,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'center',
    marginLeft: 5,
    color: consts.BUTTON_COLOR_PRIMARY,
  },
  pageOneContainer: {
    width,
    paddingHorizontal: 30,
  },
  countryPickerWrap: {
    width: 50,
    top: 25,
    left: 20,
    position: 'absolute',
    zIndex: 1,
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 20,
    marginTop: 50,
  },
  countryItems: {
    flex: 1,
    height: 40,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    alignContent: 'center',
    justifyContent: 'center',
    borderRadius: consts.BORDER_RADIUS,
  },
  countryItemText: {
    marginLeft: 10,
    fontFamily: consts.FONT_REGULAR,
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
  },
  stepTwoContainer: {
    flex: 1,
    width,
    paddingHorizontal: 30,
  },
  countryModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 58, 96, 0.2);',
  },
  countryModalSub: {
    height: '60%',
    marginTop: 'auto',
    backgroundColor: consts.APP_BG_COLOR,
  },
  countryFlatlist: {
    flex: 1,
    marginHorizontal: 10,
    backgroundColor: consts.APP_BG_COLOR,
  },
  changePicWrap: {
    backgroundColor: consts.BUTTON_COLOR_PRIMARY,
    paddingHorizontal: 10,
  },
  removePicWrap: {
    backgroundColor: consts.BUTTON_COLOR_PRIMARY,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  changeButtonText: {
    color: consts.APP_BG_COLOR,
    textAlign: 'center',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 14,
    paddingVertical: 10,
    marginLeft: 0,
  },
  stepThreeButtonWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  stepContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepContainerSub: {
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  emptyText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 13,
    fontFamily: consts.FONT_REGULAR,
    textAlign: 'center',
  },
  alertImage: {
    width: width * 0.33,
    height: width * 0.33,
    resizeMode: 'contain',
  },
});

export default AddNewFarmer;
