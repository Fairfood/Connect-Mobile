import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useDispatch } from 'react-redux';
import RadioForm, {
  RadioButton,
  RadioButtonInput,
  RadioButtonLabel,
} from 'react-native-simple-radio-button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeFooterItems } from '../../redux/LoginStore';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import { ChangeLanguageIcon } from '../../assets/svg';
import CustomButton from '../../components/CustomButton';
import CommonAlert from '../../components/CommonAlert';
import I18n from '../../i18n/i18n';
import * as consts from '../../services/constants';

const { width } = Dimensions.get('window');
const languages = [
  { label: 'English', value: 'en-GB' },
  { label: 'Indonesian', value: 'id-ID' },
];

const ChangeLanguage = ({ navigation }) => {
  const dispatch = useDispatch();
  const [appLanguage, setAppLanguage] = useState('en-GB');
  const [previousLanguage, setPreviousAppLanguage] = useState('en-GB');
  const [alertModal, setAlertModal] = useState(false);

  useEffect(() => {
    setupInitialValues();
  }, []);

  const setupInitialValues = async () => {
    const language = await AsyncStorage.getItem('app_language');
    setAppLanguage(language);
    setPreviousAppLanguage(language);
  };

  const selectLanguage = (obj) => {
    setAppLanguage(obj.value);
  };

  const onSubmit = () => {
    if (appLanguage === previousLanguage) {
      navigation.goBack(null);
    } else {
      setAlertModal(true);
    }
  };

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

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          backgroundColor={consts.APP_BG_COLOR}
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
                hitSlop={consts.HIT_SLOP_TEN}
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

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: consts.APP_BG_COLOR,
    paddingHorizontal: width * 0.05,
  },
  text_desc: {
    fontSize: 13,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 20,
    paddingBottom: 30,
    color: consts.TEXT_PRIMARY_COLOR,
    marginVertical: 20,
  },
  online: {
    color: '#27AE60',
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
    marginLeft: 10,
    marginTop: 10,
  },
  fields: {
    fontSize: 20,
    fontFamily: consts.FONT_REGULAR,
    color: consts.TEXT_PRIMARY_COLOR,
    paddingLeft: 10,
    marginLeft: 15,
    marginTop: 10,
  },
  logo_container: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 15,
    marginHorizontal: 20,
  },
  forgotpassword: {
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'left',
    marginRight: 30,
    color: consts.TEXT_PRIMARY_COLOR,
  },
  form_title_container: {
    marginHorizontal: 25,
    marginVertical: 7,
  },
  form_title: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  horizontal_line: {
    borderBottomWidth: 1,
    borderColor: consts.BORDER_COLOR,
    marginTop: 20,
  },
  list_item: {
    width: '90%',
    height: 40,
    marginLeft: 25,
    justifyContent: 'space-between',
    alignContent: 'space-between',
    flexDirection: 'row',
    marginVertical: 5,
  },
  list_item_left: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
    letterSpacing: 0.15,
  },
  list_item_right_icon: {
    alignSelf: 'center',
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
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_REGULAR,
  },
  labelWrapStyle: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
});

export default ChangeLanguage;
