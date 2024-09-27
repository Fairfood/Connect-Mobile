import React, { useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  BackHandler,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { SuccessScreenTickIcon } from '../../../assets/svg';
import CustomButton from '../../../components/CustomButton';
import I18n from '../../../i18n/i18n';
import Avatar from '../../../components/Avatar';
import { convertCurrency } from '../../../services/commonFunctions';

const { height, width } = Dimensions.get('window');

const PayFarmerComplete = ({ navigation, route }) => {
  const { farmer, total, premiumArray } = route.params;
  const { theme } = useSelector((state) => state.common);
  const { userProjectDetails } = useSelector((state) => state.login);
  const { currency } = userProjectDetails;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        return true;
      },
    );

    return () => backHandler.remove();
  }, []);

  /**
   * navigating to home screen after clearing current transaction status
   */
  const onConfirm = async () => {
    navigation.navigate('Home');
  };

  const FieldView = ({ title, value, hidden }) => {
    if (hidden) {
      return null;
    }

    return (
      <View style={styles.fieldWrap}>
        <View style={{ width: '60%' }}>
          <Text style={styles.fieldTitle}>{title}</Text>
        </View>
        <View style={{ width: '40%', alignItems: 'flex-end' }}>
          <Text style={styles.fieldValue}>{value}</Text>
        </View>
      </View>
    );
  };

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <SuccessScreenTickIcon width={width * 0.3} height={height * 0.15} />
        <Text style={styles.successTitle}>{I18n.t('transaction_created')}</Text>
        <Text style={styles.fromText}>
          {`${I18n.t('premium_complete_sub_msg')}`}
        </Text>
        <View style={styles.fromWrap}>
          <Avatar
            image={farmer.image}
            containerStyle={styles.person}
            avatarName={farmer.name}
          />
          <View style={styles.fromSubWrap}>
            <Text style={styles.farmerName}>{farmer?.name ?? ''}</Text>
            <Text style={styles.fromText}>
              {`${farmer?.city ?? ''}, ${farmer?.country ?? ''}`}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.bottomSection}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{I18n.t('transaction_details')}</Text>
          <Text style={styles.productCountText}>
            {`${premiumArray.length} ${I18n.t('premium')}(s)`}
          </Text>
        </View>

        {premiumArray.map((item, index) => {
          return (
            <View style={styles.fieldContainer} key={index.toString()}>
              <FieldView
                title={item.name}
                value={`${convertCurrency(item.paid_amount)} ${currency}`}
              />
            </View>
          );
        })}

        <View style={styles.fieldWrap}>
          <View style={{ width: '60%' }}>
            <Text style={styles.totalText}>
              {I18n.t('total').toLocaleUpperCase()}
            </Text>
          </View>
          <View style={{ width: '40%', alignItems: 'flex-end' }}>
            <Text style={styles.totalText}>
              {`${convertCurrency(total)} ${currency}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonWrap}>
        <CustomButton
          buttonText={I18n.t('ok')}
          onPress={() => onConfirm()}
          extraStyle={{ width: '45%' }}
        />
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
    topSection: {
      width,
      height: height * 0.45,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.header_bg,
    },
    successTitle: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 20,
      textAlign: 'center',
      marginTop: 30,
    },
    fromWrap: {
      backgroundColor: '#DDF3FF',
      width: '90%',
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.border_radius,
      marginTop: height * 0.02,
      paddingHorizontal: width * 0.035,
      paddingVertical: width * 0.05,
    },
    fromSubWrap: {
      marginLeft: width * 0.03,
    },
    fromText: {
      color: '#5691AE',
      fontFamily: theme.font_regular,
      fontSize: 14,
    },
    farmerName: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 16,
    },
    bottomSection: {
      flexGrow: 1,
      paddingVertical: width * 0.04,
      paddingHorizontal: width * 0.04,
    },
    titleContainer: {
      marginTop: height * 0.01,
      paddingBottom: height * 0.02,
      paddingHorizontal: width * 0.04,
      borderBottomColor: theme.border_1,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fieldContainer: {
      borderBottomColor: theme.border_1,
      borderBottomWidth: 1,
      paddingVertical: height * 0.015,
    },
    fieldWrap: {
      width: '100%',
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.04,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleText: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_medium,
    },
    fieldTitle: {
      color: '#427290',
      fontSize: 14,
      fontFamily: theme.font_regular,
    },
    totalText: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_bold,
      marginTop: height * 0.005,
    },
    fieldValue: {
      color: theme.text_1,
      fontSize: 14,
      fontFamily: theme.font_medium,
    },
    productCountText: {
      color: '#427290',
      fontSize: 16,
      fontFamily: theme.font_regular,
    },
    buttonWrap: {
      marginVertical: 20,
    },
    person: {
      backgroundColor: '#F2F2F2',
      height: 50,
      width: 50,
      borderRadius: 50 / 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 10,
    },
  });
};

export default PayFarmerComplete;
