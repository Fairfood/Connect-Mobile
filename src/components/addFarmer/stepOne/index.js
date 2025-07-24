/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Keyboard } from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CountryPicker from 'react-native-country-picker-modal';
import Toast from 'react-native-toast-message';
import {
  FORM_TYPE_FARMER,
  PHONE_NUMBER_MAX_LENGTH,
} from '../../../utils/constants';
import { fieldLabel, fieldVisibility, validateStepOneForm } from './controller';
import CustomButton from '../../buttons/customButton';
import FormTextInput from '../../inputs/formTextInput';
import Countries from '../../../utils/countries';
import I18n from '../../../translations/text/i18n';
import CustomInputFields from '../../inputs/customInputFields';
import StyleSheetFactory from './styles';

const StepOne = ({ onNext, farmer, theme }) => {
  const mobileRef = useRef(null);
  const referenceNumberRef = useRef(null);
  const formFieldRefs = useRef([]);

  const { userCompanyDetails } = useSelector((state) => state.login);
  const forms = userCompanyDetails?.forms ?? [];

  const [load, setLoad] = useState(!load);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [name, setName] = useState(farmer?.name ?? '');
  const [referenceNumber, setReferenceNumber] = useState(
    farmer?.reference_number ?? '',
  );
  const [mobile, setMobile] = useState(farmer?.mobile ?? '');
  const [dialCode, setDialCode] = useState(farmer?.dialCode ?? '');
  const [countryCode, setCountryCode] = useState(farmer?.countryCode ?? '');
  const [error, setError] = useState('');
  const [countriesList, setCountriesList] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const styles = StyleSheetFactory();

  useEffect(() => {
    setupForms();
    setupCountry();
  }, []);

  const setupForms = () => {
    const farmerForm = forms.filter((x) => {
      return x.form_type === FORM_TYPE_FARMER;
    });
    setCustomFields(farmerForm);
    setLoad(!load);
  };

  /**
   * setting country and country list
   */
  const setupCountry = async () => {
    const arrayOfObj = Object.entries(Countries.data).map(
      ([countryName, countryData]) => ({
        label: `+${countryData.dial_code}`,
        value: countryData.dial_code,
        country_name: countryName,
        country_code: countryData.alpha_2,
      }),
    );

    // taking the previously used country while adding farmer
    const previousFarmerCountry = await AsyncStorage.getItem('country');
    let country = null;

    if (previousFarmerCountry) {
      country = arrayOfObj.find(
        (i) => i.country_name === previousFarmerCountry,
      );
    } else {
      // using the country same as the related company
      country = arrayOfObj.find(
        (i) => i.country_name === userCompanyDetails.country,
      );
    }

    if (country) {
      setDialCode(country.value);
      setCountryCode(country.country_code);
    } else {
      setDialCode(arrayOfObj[0].value);
      setCountryCode(arrayOfObj[0].country_code);
    }

    setCountriesList([...arrayOfObj]);
  };

  /**
   * Capitalizing first letter for name
   * @returns {string} name
   */
  const changeName = async () => {
    let text = name;

    if (text !== '') {
      const firstLetter = text.trim().substr(0, 1);
      text = (await firstLetter.toUpperCase()) + text.trim().substr(1);
    }

    setName(text);
    return text;
  };

  /**
   * setting dial code
   * @param {object} country selected country
   */
  const onSelectCountryPicker = (country) => {
    if (country.callingCode.length > 0) {
      setDialCode(country.callingCode[0]);
      setCountryCode(country.cca2);
    } else {
      Toast.show({
        type: 'error',
        text1: I18n.t('invalid'),
        text2: I18n.t('cannot_select_country'),
      });
    }
  };

  /**
   * validating data
   */
  const validateData = async () => {
    setButtonLoading(true);
    const updatedName = await changeName();

    const updatedObj = {
      name: updatedName,
      mobile: mobile.trim(),
      phone: mobile.trim() !== '' ? `+${dialCode} ${mobile}` : '',
      dialCode,
      reference_number: referenceNumber.trim(),
      extraFields: customFields,
      countryCode,
      forms,
    };

    const [isValid, validationError] = await validateStepOneForm(updatedObj);
    if (!isValid) {
      setError(validationError);
      setButtonLoading(false);
      return;
    }

    if (dialCode !== farmer.dialCode) {
      updatedObj.country = '';
      updatedObj.province = '';
    }

    setError('');
    setButtonLoading(false);
    onNext(updatedObj);
  };

  /**
   * updating custom field values based on productId and index
   * @param {object}  item    updated custom fields object
   */
  const updateCustomData = (item) => {
    const fieldCopy = [...customFields];
    const updatedArr = fieldCopy.map((i) => {
      const updatedFields = i.fields.map((field) => {
        if (field.id === item.id) {
          return {
            ...field,
            value: item.value,
          };
        }
        return field;
      });

      return {
        ...i,
        fields: updatedFields,
      };
    });

    setCustomFields((customFields) => updatedArr);
  };

  const onSubmittingFullName = () => {
    if (mobileRef?.current) {
      mobileRef.current.focus();
    } else {
      onSubmittingMobile();
    }
  };

  const onSubmittingMobile = () => {
    if (referenceNumberRef?.current) {
      referenceNumberRef.current.focus();
    } else {
      onSubmittingReferenceNumber();
    }
  };

  const onSubmittingReferenceNumber = () => {
    if (customFields?.[0]?.fields?.[0]) {
      onSubmitFormField(
        -1,
        customFields[0].fields,
        customFields[0].fields[0].type,
      );
    } else {
      Keyboard.dismiss();
    }
  };

  const onSubmitFormField = (index, formFields, fieldType) => {
    const typeArr = ['TEXT', 'NUMBER', 'PHONE', 'INTEGER', 'FLOAT', 'EMAIL'];
    for (let i = index; i <= formFields.length; i++) {
      if (i === formFields.length) {
        Keyboard.dismiss();
        break;
      } else if (
        typeArr.includes(fieldType) &&
        formFieldRefs?.current?.[index + 1]
      ) {
        formFieldRefs?.current?.[index + 1].focus();
        break;
      }
    }
  };

  return (
    <ScrollView
      style={styles.pageOneContainer}
      keyboardShouldPersistTaps="always"
    >
      <View style={styles.formTitleContainer}>
        <Text style={styles.formTitle}>{I18n.t('basic_information')}</Text>
      </View>
      <FormTextInput
        placeholder={fieldLabel(forms, 'full_name')}
        value={name}
        mandatory
        onChangeText={(text) => setName(text)}
        onSubmitEditing={onSubmittingFullName}
        onBlur={changeName}
        visibility={fieldVisibility(forms, 'full_name')}
        autoCapitalize="sentences"
        color={theme.text_1}
        extraStyle={{ width: '100%' }}
        testID="field-full-name"
      />

      {fieldVisibility(forms, 'phone') && (
        <View>
          <View style={styles.countryPickerWrap}>
            {countriesList.length > 0 && (
              <CountryPicker
                withFilter
                withAlphaFilter
                withCallingCode
                keyboardShouldPersistTaps="always"
                placeholder={`+${dialCode.replace('+', '')}`}
                onSelect={onSelectCountryPicker}
                testID="field-country-code"
              />
            )}
          </View>
          <FormTextInput
            inputRef={mobileRef}
            placeholder={fieldLabel(forms, 'mobile_number')}
            value={mobile}
            color={theme.text_1}
            keyboardType="numeric"
            onChangeText={(text) => {
              setMobile(text.replace(/[^0-9]/g, ''));
            }}
            onSubmitEditing={onSubmittingMobile}
            internalPadding={70}
            maxLength={PHONE_NUMBER_MAX_LENGTH}
            extraStyle={{ width: '100%' }}
            testID="field-phone-number"
          />
        </View>
      )}

      <FormTextInput
        inputRef={referenceNumberRef}
        placeholder={fieldLabel(forms, 'reference_number')}
        value={referenceNumber}
        color={theme.text_1}
        onChangeText={(text) => setReferenceNumber(text)}
        onSubmitEditing={onSubmittingReferenceNumber}
        visibility={fieldVisibility(forms, 'reference_number')}
        extraStyle={{ width: '100%' }}
        testID="field-reference-number"
      />

      {/* form fields */}
      {customFields?.[0]?.fields && (
        <>
          {customFields[0].fields.map((i, n) => {
            return (
              <CustomInputFields
                inputRef={(el) => (formFieldRefs.current[n] = el)}
                key={n.toString()}
                fieldItem={i}
                formId={customFields[0].id}
                updatedItem={updateCustomData}
                onSubmitEditing={() =>
                  onSubmitFormField(n, customFields[0].fields, i.type)
                }
              />
            );
          })}
        </>
      )}

      <View style={styles.errorWrap}>
        {error && <Text style={styles.errorMessage}>{error}</Text>}

        <CustomButton
          buttonText={I18n.t('next_address')}
          onPress={validateData}
          disabled={buttonLoading}
          extraStyle={{ width: '100%' }}
          testID="submit-button"
        />
      </View>
    </ScrollView>
  );
};

export default StepOne;
