import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
// import Tts from 'react-native-tts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeFooterItems } from '../../../../redux/CommonStore';
import { HIT_SLOP_TEN } from '../../../../utils/constants';
import { ChangeLanguageIcon } from '../../../../assets/svg';
import { logAnalytics } from '../../../../utils/serviceHelper';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import CustomButton from '../../../../components/buttons/customButton';
import CommonAlert from '../../../../components/modals/commonAlert';
import I18n from '../../../../translations/text/i18n';
import StyleSheetFactory from './styles';
import { handleErrors } from '../../../../utils/commonFunctions';
// import Speech from '../../../../translations/textToSpeech/speech';

const { width } = Dimensions.get('window');
const languages = [
  { label: 'English', value: 'en-GB' },
  { label: 'Indonesian', value: 'id-ID' },
];

const ChangeLanguage = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.common);
  const [appLanguage, setAppLanguage] = useState(languages[0]);
  const [previousLanguage, setPreviousAppLanguage] = useState(languages[0]);
  const [alertModal, setAlertModal] = useState(false);
  const styles = StyleSheetFactory();

  useEffect(() => {
    setupInitialValues();
  }, []);

  /**
   * setting initial language value from async storage
   */
  const setupInitialValues = async () => {
    const language = await AsyncStorage.getItem('app_language');
    const arr = languages.filter((x) => {
      return x.value === language;
    });
    setAppLanguage(arr[0]);
    setPreviousAppLanguage(arr[0]);
  };

  /**
   * setting selected language
   * @param {object} obj language object
   */
  const selectLanguage = (obj) => {
    setAppLanguage(obj);
  };

  /**
   * submit confirmation
   */
  const onSubmit = () => {
    if (appLanguage.value === previousLanguage.value) {
      navigation.goBack(null);
    } else {
      setAlertModal(true);
    }
  };

  /**
   * submit function
   */
  const handleSubmit = async () => {
    try {
      I18n.locale = appLanguage.value;
      // Speech.locale = appLanguage.value;
      // Tts.setDefaultLanguage(appLanguage.value);

      await AsyncStorage.setItem('app_language', appLanguage.value);

      // managing footer text transactions
      const obj = {
        home: I18n.t('home'),
        farmers: I18n.t('farmers'),
        transactions: I18n.t('transactions'),
      };
      dispatch(changeFooterItems(obj));

      logAnalytics('language_switch', {
        language: appLanguage.label,
      });

      setAlertModal(false);
      navigation.goBack();
    } catch (error) {
      handleErrors(error, {
        ref: 'changeLanguage_handleSubmit',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          backgroundColor={theme.background_1}
          title={I18n.t('language')}
          onPress={() => navigation.goBack(null)}
        />

        <Text style={styles.text_desc}>
          {I18n.t('app_language_change_disclaimer')}
        </Text>
        {languages.map((obj, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => selectLanguage(obj)}
            style={styles.radioWrap}
            hitSlop={HIT_SLOP_TEN}
          >
            <View style={styles.labelWrapStyle}>
              <Text style={styles.labelStyle}>{obj.label}</Text>
            </View>
            <View style={styles.outerCircle}>
              {obj.value === appLanguage?.value && (
                <View style={styles.innerCircle} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <CustomButton
        buttonText={I18n.t('save')}
        onPress={onSubmit}
        color="#EA2553"
        extraStyle={{ width: '100%', marginBottom: 10 }}
      />

      {alertModal && (
        <CommonAlert
          visible={alertModal}
          title={`${I18n.t('change_language', {
            locale: appLanguage.value,
          })}!!`}
          message={I18n.t('are_you_sure_change_language', {
            locale: appLanguage.value,
          })}
          submitText={I18n.t('ok', { locale: appLanguage.value })}
          cancelText={I18n.t('cancel', { locale: appLanguage.value })}
          icon={
            <ChangeLanguageIcon width={width * 0.23} height={width * 0.23} />
          }
          onSubmit={handleSubmit}
          onCancel={() => setAlertModal(false)}
          onRequestClose={() => setAlertModal(false)}
        />
      )}
    </View>
  );
};

export default ChangeLanguage;
