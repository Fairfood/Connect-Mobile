/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchFarmersByName } from '../../../db/services/FarmerHelper';
import CustomButton from '../../buttons/customButton';
import FormTextInput from '../../inputs/formTextInput';
import I18n from '../../../translations/text/i18n';
import SearchComponent from '../../searchComponent';
import CommonAlert from '../../modals/commonAlert';
import StyleSheetFactory from './styles';
import {
  checkDuplicateFarmer,
  fieldLabel,
  fieldVisibility,
  validateStepTwoForm,
} from './controller';

const StepTwo = ({
  onNext,
  farmer,
  countriesList,
  allCountriesList,
  theme,
}) => {
  const cityRef = useRef(null);
  const zipCodeRef = useRef(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [street, setStreet] = useState(farmer?.street ?? '');
  const [city, setCity] = useState(farmer?.city ?? '');
  const [country, setCountry] = useState(farmer?.country ?? '');
  const [selectedCountry, setSelectedCountry] = useState(
    farmer?.selectedCountry ?? null,
  );
  const [dialCode, setDialCode] = useState(farmer?.dialCode ?? '');
  const [countryCode, setCountryCode] = useState(farmer?.countryCode ?? '');
  const [displayModal, setDisplayModal] = useState(false);
  const [focused, setFocused] = useState('country');
  const [selectedProvince, setSelectedProvince] = useState(
    farmer?.selectedProvince ?? null,
  );
  const [province, setProvince] = useState(farmer?.province ?? '');
  const [provincesList, setProvincesList] = useState([]);
  const [allProvincesList, setAllProvincesList] = useState([]);
  const [countryList, setCountryList] = useState(allCountriesList);
  const [zipCode, setZipCode] = useState(farmer?.zipcode ?? '');
  const [error, setError] = useState('');
  const [alertModal, setAlertModal] = useState(false);
  const { userCompanyDetails } = useSelector((state) => state.login);
  const forms = userCompanyDetails?.forms ?? [];
  const styles = StyleSheetFactory();

  useEffect(() => {
    setupCountry();
  }, []);

  /**
   * setting country based on dial code and fetching its provinces
   */
  const setupCountry = async () => {
    if (!farmer?.country) {
      const farmerDialCode = farmer.dialCode;
      const currentCountry = countriesList.find(
        (i) => i.additional.dial_code === farmerDialCode,
      );

      if (currentCountry) {
        getProvinceList(currentCountry.value);
      } else {
        getProvinceList(countriesList[0].value);
      }
    } else {
      getProvinceList(farmer.country);
    }
  };

  /**
   * Capitalizing first letter for street
   * @returns {string} street
   */
  const changeStreet = () => {
    let text = street;

    if (text !== '') {
      setError('');
      const firstLetter = text.trim().substr(0, 1);
      text = firstLetter.toUpperCase() + text.trim().substr(1);
      setStreet(text);
    }

    setStreet(text);
    return text;
  };

  /**
   * Capitalizing first letter for city
   * @returns {string} city
   */
  const changeCity = () => {
    let text = city;

    if (text !== '') {
      setError('');
      const firstLetter = text.trim().substr(0, 1);
      text = firstLetter.toUpperCase() + text.trim().substr(1);
    }

    setCity(text);
    return text;
  };

  const changeZipCode = () => {
    const text = zipCode.trim();
    setZipCode(text);
    return text;
  };

  /**
   * opening country/province modal based on type
   * @param  {string} type country or province
   */
  const openDisplayModal = (type) => {
    if (type === 'country') {
      setFocused('country');
      setCountryList(allCountriesList);
      setDisplayModal(true);
    } else if (type === 'province') {
      setFocused('province');
      setProvincesList(allProvincesList);
      setDisplayModal(true);
    }
  };

  /**
   * setting country/province selected from modal
   * @param  {object} item object containing country/province details
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

  /**
   * filtering country based on search text
   * @param  {string} text country search text
   */
  const onSearchCountry = (text) => {
    const countryText = text.toLowerCase().trim();
    if (countryText === '') {
      setCountryList(allCountriesList);
    } else {
      const filteredCountriesList = allCountriesList.filter((e) => {
        const element = e.label.toLowerCase();
        return element.includes(countryText);
      });
      setCountryList(filteredCountriesList);
    }
  };

  /**
   * filtering province based on search text
   * @param  {string} text province search text
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
   * setting province list based on country
   * @param  {string} text selected country
   */
  const getProvinceList = async (text) => {
    const filteredCountry = countriesList.find((x) => x.label === text);

    setProvince('');
    setSelectedProvince(null);
    setCountry(text);
    await AsyncStorage.setItem('country', text);

    if (filteredCountry) {
      setSelectedCountry(filteredCountry);
      setCountryCode(filteredCountry.additional.alpha_2);
      setDialCode(filteredCountry.additional.dial_code);

      const provinces = filteredCountry.additional.sub_divisions;
      const selectedProvinces = Object.entries(provinces).map(
        ([provinceData, provinceLocation]) => ({
          label: provinceData,
          location: provinceLocation,
          value: provinceData,
        }),
      );

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
      setSelectedCountry('');
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

  const validateData = async () => {
    setButtonLoading(true);
    const updatedStreet = changeStreet();
    const updatedCity = changeCity();
    const updatedZip = changeZipCode();

    const updatedObj = {
      name: farmer.name,
      reference_number: farmer.reference_number,
      phone: farmer.phone,
      street: updatedStreet,
      city: updatedCity,
      country,
      province,
      zipcode: updatedZip,
    };

    const [isValid, validError] = await validateStepTwoForm(
      updatedObj,
      forms,
      countryCode,
    );

    if (!isValid) {
      setError(validError);
      setButtonLoading(false);
      return;
    }

    setError('');

    // checking duplicate farmer
    const nodes = await searchFarmersByName(farmer.name);
    if (nodes.length === 0) {
      stepTwoProceed(updatedObj);
      return;
    }

    const duplicateFound = await checkDuplicateFarmer(nodes, updatedObj);

    if (duplicateFound) {
      setButtonLoading(false);
      setAlertModal(true);
      return;
    }

    stepTwoProceed(updatedObj);
  };

  const stepTwoProceed = async (updatedObj) => {
    updatedObj.dialCode = dialCode;
    updatedObj.selectedProvince = selectedProvince;
    updatedObj.selectedCountry = selectedCountry;

    setError('');
    setButtonLoading(false);
    onNext(updatedObj);
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
        onPress={() => onSelectingModalItem(item)}
        style={styles.countryItems}
      >
        <Text style={styles.countryItemText}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.stepTwoContainer}
      keyboardShouldPersistTaps="always"
    >
      <KeyboardAvoidingView
        behavior="position"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : -40}
        style={{ flex: 1 }}
      >
        <View style={styles.formTitleContainer}>
          <Text style={styles.formTitle}>{I18n.t('address')}</Text>
        </View>

        <FormTextInput
          placeholder={fieldLabel(forms, 'street')}
          value={street}
          onChangeText={(text) => setStreet(text)}
          onSubmitEditing={onSubmittingStreet}
          onBlur={changeStreet}
          visibility={fieldVisibility(forms, 'street')}
          autoCapitalize="sentences"
          color={theme.text_1}
          extraStyle={{ width: '100%' }}
        />

        <FormTextInput
          inputRef={cityRef}
          mandatory
          placeholder={fieldLabel(forms, 'city')}
          value={city}
          onChangeText={(text) => setCity(text)}
          onSubmitEditing={onSubmittingCity}
          onBlur={changeCity}
          visibility={fieldVisibility(forms, 'city')}
          autoCapitalize="sentences"
          color={theme.text_1}
          extraStyle={{ width: '100%' }}
        />

        {fieldVisibility(forms, 'province') && (
          <TouchableOpacity onPress={() => openDisplayModal('province')}>
            <View pointerEvents="none">
              <FormTextInput
                mandatory
                placeholder={fieldLabel(forms, 'province')}
                values={provincesList}
                value={province}
                color={theme.text_1}
                extraStyle={{ width: '100%' }}
              />
            </View>
          </TouchableOpacity>
        )}

        <FormTextInput
          inputRef={zipCodeRef}
          placeholder={fieldLabel(forms, 'postal_code')}
          value={zipCode}
          visibility={fieldVisibility(forms, 'postcode')}
          onChangeText={(text) => setZipCode(text)}
          onBlur={changeZipCode}
          color={theme.text_1}
          extraStyle={{ width: '100%' }}
        />

        {fieldVisibility(forms, 'country') && (
          <TouchableOpacity onPress={() => openDisplayModal('country')}>
            <View pointerEvents="none">
              <FormTextInput
                mandatory
                placeholder={fieldLabel(forms, 'country')}
                value={country}
                color={theme.text_1}
                extraStyle={{ width: '100%' }}
              />
            </View>
          </TouchableOpacity>
        )}

        <View style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          {error && <Text style={styles.errorMessage}>{error}</Text>}

          <CustomButton
            buttonText={I18n.t('next_profile_photo')}
            onPress={validateData}
            disabled={buttonLoading}
            extraStyle={{ width: '100%', marginBottom: 20 }}
          />
        </View>
      </KeyboardAvoidingView>

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
                data={focused === 'country' ? countryList : provincesList}
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

      {alertModal && (
        <CommonAlert
          visible={alertModal}
          title={I18n.t('duplicate_farmer_alert')}
          message={I18n.t('farmer_already_exist')}
          submitText={I18n.t('modify')}
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
  );
};

export default StepTwo;
