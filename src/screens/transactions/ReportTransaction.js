import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { REPORT_MENUS } from '../../services/constants';
import { ReportAlertIcon } from '../../assets/svg';
import { updateTransactionReport } from '../../db/services/TransactionsHelper';
import FormTextInput from '../../components/FormTextInput';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import I18n from '../../i18n/i18n';
import CustomButton from '../../components/CustomButton';
import CommonAlert from '../../components/CommonAlert';

const { width, height } = Dimensions.get('window');

const ReportTransaction = ({ navigation, route }) => {
  const { transactionItem } = route.params;
  const { theme } = useSelector((state) => state.common);
  const [radio, setRadio] = useState(null);
  const [reportMessage, setReportMessage] = useState('');
  const [error, setError] = useState('');
  const [reportConfirmModal, setReportConfirmModal] = useState(false);

  /**
   * redirecting to previous page
   */
  const backNavigation = () => {
    navigation.goBack(null);
  };

  const selectRadio = (key) => {
    setRadio(key);
    setError('');
  };

  const handleValidate = async () => {
    if (!radio) {
      setError('Select any option');
      return;
    }

    if (!reportMessage) {
      setError('Write something about the issue');
      return;
    }
    setReportConfirmModal(true);
  };

  const handleSubmit = async () => {
    if (!transactionItem.id) {
      Toast.show({
        type: 'error',
        text1: I18n.t('error'),
        text2: I18n.t('something_went_wrong'),
      });
      navigation.navigate('Transactions');
      return;
    }

    const date = new Date();

    const data = JSON.stringify({
      server_error: transactionItem.error,
      report_category: radio,
      report_message: reportMessage,
      created_on: parseInt(Math.round(date) / 1000),
      updated_on: parseInt(Math.round(date) / 1000),
    });

    await updateTransactionReport(transactionItem.id, true, data);

    Toast.show({
      type: 'warning',
      text1: I18n.t('reported'),
      text2: I18n.t('issue_reported_successfully'),
    });

    setReportConfirmModal(false);
    navigation.navigate('Transactions');
  };

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        backgroundColor={theme.background_1}
        title={I18n.t('report_issue')}
        leftIcon="arrow-left"
        onPress={() => backNavigation()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.reportTitle}>
          {I18n.t('report_transaction_title')}
        </Text>
        <Text style={styles.reportSubTitle}>
          {I18n.t('help_us_understand_problem')}
        </Text>

        {REPORT_MENUS.map((item, index) => (
          <TouchableOpacity
            key={index.toString()}
            onPress={() => selectRadio(item.key)}
            style={styles.radioItemWrap}
            disabled={radio === item.key}
          >
            <Text style={styles.reportTitle}>{I18n.t(item.title)}</Text>

            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    radio === item.key ? theme.radio_2 : theme.radio_1,
                },
              ]}
            >
              {radio === item.key && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        <FormTextInput
          multiline
          placeholder={I18n.t('report_reason')}
          value={reportMessage}
          onChangeText={(text) => setReportMessage(text)}
          color={theme.text_1}
          extraStyle={{ width: '100%', height: height * 0.2 }}
        />
      </ScrollView>

      {error !== '' && <Text style={styles.errorMessage}>{error}</Text>}

      <View style={styles.buttonWrap}>
        <CustomButton
          buttonText={I18n.t('report')}
          onPress={() => handleSubmit(true)}
          extraStyle={{ width: '100%' }}
        />
      </View>

      {reportConfirmModal && (
        <CommonAlert
          visible={reportConfirmModal}
          title={I18n.t('report_alert_title')}
          message={I18n.t('report_alert_message')}
          submitText={I18n.t('yes_continue')}
          cancelText={I18n.t('cancel')}
          icon={<ReportAlertIcon width={width * 0.01} height={width * 0.01} />}
          onCancel={() => setReportConfirmModal(false)}
          onSubmit={() => handleValidate()}
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
      paddingHorizontal: width * 0.05,
    },
    reportTitle: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 14,
    },
    reportSubTitle: {
      color: theme.text_2,
      fontFamily: theme.font_regular,
      fontSize: 14,
      marginVertical: height * 0.03,
    },
    lossTitle: {
      fontWeight: '500',
      fontStyle: 'normal',
      fontSize: 17,
      color: theme.text_1,
      fontFamily: theme.font_regular,
      marginLeft: width * 0.02,
    },
    buttonWrap: {
      width: '100%',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 15,
      backgroundColor: '#ffffff',
    },
    radioItemWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
    },
    radioOuter: {
      height: width * 0.06,
      width: width * 0.06,
      borderRadius: (width * 0.06) / 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    radioInner: {
      height: width * 0.04,
      width: width * 0.04,
      borderRadius: (width * 0.04) / 2,
      backgroundColor: theme.radio_2,
    },
    errorMessage: {
      fontSize: width * 0.04,
      fontFamily: theme.font_regular,
      marginTop: 10,
      textAlign: 'center',
      color: theme.button_bg_1,
    },
  });
};

export default ReportTransaction;
