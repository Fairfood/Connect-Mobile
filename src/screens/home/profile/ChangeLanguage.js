import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import RadioForm, {
  RadioButton,
  RadioButtonInput,
  RadioButtonLabel,
} from 'react-native-simple-radio-button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeFooterItems } from '../../../redux/CommonStore';
import { HIT_SLOP_TEN } from '../../../services/constants';
import { ChangeLanguageIcon } from '../../../assets/svg';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import CustomButton from '../../../components/CustomButton';
import CommonAlert from '../../../components/CommonAlert';
import I18n from '../../../i18n/i18n';

const { width } = Dimensions.get('window');
const languages = [
  { label: 'English', value: 'en-GB' },
  { label: 'Indonesian', value: 'id-ID' },
];

const ChangeLanguage = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.common);
  const [appLanguage, setAppLanguage] = useState('en-GB');
  const [previousLanguage, setPreviousAppLanguage] = useState('en-GB');
  const [alertModal, setAlertModal] = useState(false);

  useEffect(() => {
    setupInitialValues();
  }, []);

  /**
   * setting initial language value from async storage
   */
  const setupInitialValues = async () => {
    const language = await AsyncStorage.getItem('app_language');
    setAppLanguage(language);
    setPreviousAppLanguage(language);
  };

  /**
   * setting selected language
   *
   * @param {object} obj language object
   */
  const selectLanguage = (obj) => {
    setAppLanguage(obj.value);
  };

  /**
   * submit confirmation
   */
  const onSubmit = () => {
    if (appLanguage === previousLanguage) {
      navigation.goBack(null);
    } else {
      setAlertModal(true);
    }
  };

  /**
   * submit function
   */
  const handleSubmit = async () => {
    I18n.locale = appLanguage;
    await AsyncStorage.setItem('app_language', appLanguage);

    // managing footer text transactions
    const obj = {
      home: I18n.t('home'),
      farmers: I18n.t('farmers'),
      transactions: I18n.t('transactions'),
    };
    dispatch(changeFooterItems(obj));

    setAlertModal(false);
    navigation.goBack();
  };

  const styles = StyleSheetFactory(theme);

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          backgroundColor={theme.background_1}
          title={I18n.t('language')}
          leftIcon='arrow-left'
          onPress={() => navigation.goBack(null)}
        />

        <Text style={styles.text_desc}>
          {I18n.t('app_language_change_disclaimer')}
        </Text>
        <RadioForm formHorizontal={false} animation>
          {languages.map((obj, i) => (
            <RadioButton labelHorizontal key={i}>
              <TouchableOpacity
                onPress={() => selectLanguage(obj)}
                style={styles.radioWrap}
                hitSlop={HIT_SLOP_TEN}
              >
                <RadioButtonLabel
                  obj={obj}
                  index={i}
                  labelHorizontal
                  onPress={() => selectLanguage(obj)}
                  labelStyle={styles.labelStyle}
                  labelWrapStyle={styles.labelWrapStyle}
                />
                <RadioButtonInput
                  obj={obj}
                  index={i}
                  isSelected={obj.value === appLanguage}
                  onPress={() => selectLanguage(obj)}
                  borderWidth={1}
                  buttonInnerColor='#4DCAF4'
                  buttonOuterColor='#2196f3'
                  buttonSize={16}
                  buttonOuterSize={22}
                  buttonStyle={{ width: 100, height: 100 }}
                  buttonWrapStyle={{ marginRight: 20 }}
                />
              </TouchableOpacity>
            </RadioButton>
          ))}
        </RadioForm>
      </View>
      <CustomButton
        buttonText={I18n.t('save')}
        onPress={() => onSubmit()}
        color='#EA2553'
        extraStyle={{ width: '100%', marginBottom: 10 }}
      />

      {alertModal && (
        <CommonAlert
          visible={alertModal}
          title={`${I18n.t('change_language', { locale: appLanguage })}!!`}
          message={I18n.t('are_you_sure_change_language', {
            locale: appLanguage,
          })}
          submitText={I18n.t('ok', { locale: appLanguage })}
          cancelText={I18n.t('cancel', { locale: appLanguage })}
          icon={
            <ChangeLanguageIcon width={width * 0.23} height={width * 0.23} />
          }
          onSubmit={() => handleSubmit()}
          onCancel={() => setAlertModal(false)}
          onRequestClose={() => setAlertModal(false)}
        />
      )}
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      height: '100%',
      backgroundColor: theme.background_1,
      paddingHorizontal: width * 0.05,
    },
    text_desc: {
      fontSize: 13,
      fontFamily: theme.font_regular,
      lineHeight: 20,
      paddingBottom: 30,
      color: theme.text_1,
      marginVertical: 20,
    },
    radioWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'space-around',
      width: '100%',
      marginVertical: 10,
    },
    labelStyle: {
      fontSize: 16,
      color: theme.text_1,
      fontFamily: theme.font_regular,
    },
    labelWrapStyle: {
      justifyContent: 'flex-start',
      alignSelf: 'flex-start',
    },
  });
};

export default ChangeLanguage;
