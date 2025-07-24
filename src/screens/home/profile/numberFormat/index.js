import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { changeCurrencyFormat } from '../../../../redux/CommonStore';
import { CURRENCY_FORMAT, HIT_SLOP_TEN } from '../../../../utils/constants';
import { ChangeNumberFormatIcon } from '../../../../assets/svg';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import CustomButton from '../../../../components/buttons/customButton';
import CommonAlert from '../../../../components/modals/commonAlert';
import I18n from '../../../../translations/text/i18n';
import StyleSheetFactory from './styles';
import { handleErrors } from '../../../../utils/commonFunctions';

const { width } = Dimensions.get('window');
const formats = [
  { label: '1.23.456,78', value: CURRENCY_FORMAT.DOT_COMA },
  { label: '1,23,456.78', value: CURRENCY_FORMAT.COMA_DOT },
];

const ChangeNumberFormat = ({ navigation }) => {
  const dispatch = useDispatch();
  const { currencyFormat } = useSelector((state) => state.common);
  const [appLanguage, setAppLanguage] = useState(currencyFormat);
  const [previousLanguage] = useState(currencyFormat);
  const [alertModal, setAlertModal] = useState(false);
  const styles = StyleSheetFactory();

  /**
   * setting selected language
   * @param {object} value language object
   */
  const selectLanguage = (value) => {
    setAppLanguage(value);
  };

  /**
   * submit confirmation
   */
  const onSubmit = () => {
    if (JSON.stringify(appLanguage) === JSON.stringify(previousLanguage)) {
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
      dispatch(changeCurrencyFormat(appLanguage));

      setAlertModal(false);
      navigation.goBack();
    } catch (error) {
      handleErrors(error, {
        ref: 'numberFormat_handleSubmit',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          title={I18n.t('number_format')}
          onPress={() => navigation.goBack(null)}
        />

        <Text style={styles.text_desc}>
          {I18n.t('app_number_format_change_disclaimer')}
        </Text>

        {formats.map((obj, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => selectLanguage(obj.value)}
            style={styles.radioWrap}
            hitSlop={HIT_SLOP_TEN}
          >
            <View style={styles.labelWrapStyle}>
              <Text style={styles.labelStyle}>{obj.label}</Text>
            </View>
            <View style={styles.outerCircle}>
              {JSON.stringify(obj.value) === JSON.stringify(appLanguage) && (
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
          title={`${I18n.t('change_number_format')}!!`}
          message={I18n.t('are_you_sure_number_format')}
          submitText={I18n.t('ok', { locale: appLanguage.value })}
          cancelText={I18n.t('cancel', { locale: appLanguage.value })}
          icon={
            <ChangeNumberFormatIcon width={width * 0.3} height={width * 0.3} />
          }
          onSubmit={handleSubmit}
          onCancel={() => setAlertModal(false)}
          onRequestClose={() => setAlertModal(false)}
        />
      )}
    </View>
  );
};

export default ChangeNumberFormat;
