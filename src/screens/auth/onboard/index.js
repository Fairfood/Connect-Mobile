import React, { useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as Progress from 'react-native-progress';
import Carousel from 'react-native-reanimated-carousel';
import I18n from '../../../translations/text/i18n';
import CustomButton from '../../../components/buttons/customButton';
import TransparentButton from '../../../components/buttons/transparentButton';
import StyleSheetFactory from './styles';
import { removeLocalStorage } from '../../../utils/commonFunctions';
import { onBoardingComplete, signOutUser } from '../../../redux/LoginStore';
import { updateSyncStage } from '../../../redux/SyncStore';
import { initiateSync } from '../../../sync/SyncInitials';

const { width } = Dimensions.get('window');

const OnBoardingScreen = () => {
  const { syncInProgress, syncSuccessful } = useSelector(
    (state) => state.login,
  );
  const { isConnected } = useSelector((state) => state.connection);
  const { farmerSyncing, farmerSyncCount, farmerSyncTotal } = useSelector(
    (state) => state.sync,
  );
  const dispatch = useDispatch();
  const styles = StyleSheetFactory();

  useEffect(() => {
    initiateSync();
  }, [isConnected]);

  const onLogout = async () => {
    await removeLocalStorage();
    dispatch(updateSyncStage(0));
    dispatch(signOutUser());
  };

  const getProgressBarValue = () => {
    if (farmerSyncCount !== 0 && farmerSyncTotal !== 0) {
      return farmerSyncCount / farmerSyncTotal;
    }

    return 0;
  };

  const retrySyncing = () => {
    initiateSync();
  };

  const renderItem = ({ item, index }) => {
    return (
      <View key={String(index)} style={styles.itemContainer}>
        <Image source={item.uri} style={styles.imageStyle} />
        <View style={styles.itemTextWrap}>
          <Text style={styles.itemTitleText}>{item.title}</Text>
          <Text style={styles.itemSubTitleText} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} testID="onboard-screen-container">
      <View style={styles.carouselWrap}>
        <Carousel
          loop
          width={width}
          autoPlay
          data={[
            {
              uri: require('../../../assets/images/onboarding1.png'),
              title: I18n.t('add_farmer'),
              description: I18n.t(
                'add_farmers_and_issue_card_for_verifying_transactions',
              ),
            },
            {
              uri: require('../../../assets/images/onboarding2.png'),
              title: I18n.t('receive_or_deliver_products'),
              description: I18n.t(
                'view_transaction_history_price_and_premiums_received_per_transactions',
              ),
            },
            {
              uri: require('../../../assets/images/onboarding3.png'),
              title: I18n.t('verify_transactions'),
              description: I18n.t(
                'verify_and_confirm_each_transactions_by_taping_card_with_your_device',
              ),
            },
          ]}
          scrollAnimationDuration={3000}
          renderItem={renderItem}
        />
      </View>
      <View>
        <Image
          source={require('../../../assets/images/lines.png')}
          resizeMode="stretch"
          style={{ width }}
        />
      </View>

      <View style={styles.secondWrap}>
        <View style={styles.secondSubWrap}>
          {isConnected && syncInProgress && (
            <Text style={styles.titleText}>
              {I18n.t('we_are_setting_up_your_accounts')}
            </Text>
          )}

          {farmerSyncing && isConnected && syncInProgress && (
            <View style={styles.farmerSyncWrap}>
              <View style={{ width: '85%' }}>
                <Text style={styles.farmerSyncTitle}>
                  {`${I18n.t('fetching_farmers')}...`}
                </Text>
                <Progress.Bar
                  progress={getProgressBarValue()}
                  width={width * 0.7}
                  height={8}
                  color="#27AE60"
                />
                {farmerSyncCount === 0 ? (
                  <Text style={styles.farmerSyncCount}>
                    {`${I18n.t('calculating')}..`}
                  </Text>
                ) : (
                  <Text style={styles.farmerSyncCount}>
                    {`${farmerSyncCount}/${farmerSyncTotal}`}
                  </Text>
                )}
              </View>
              <View style={styles.loadingWarp}>
                <ActivityIndicator size="small" color="#27AE60" />
              </View>
            </View>
          )}

          {syncSuccessful && (
            <Text style={styles.titleText}>{I18n.t('ready_to_go')}</Text>
          )}

          {!isConnected && (
            <Text style={styles.titleText}>
              {I18n.t('no_active_internet_connection')}
            </Text>
          )}
        </View>

        {syncSuccessful && (
          <CustomButton
            buttonText={I18n.t('next')}
            onPress={() => dispatch(onBoardingComplete())}
            extraStyle={{ width: '100%' }}
            testID="onboard-next-button"
          />
        )}
      </View>
      {!syncSuccessful && !syncInProgress && (
        <View style={styles.retryWrap}>
          <Text style={[styles.titleText, { textAlign: 'center' }]}>
            {I18n.t('retry_or_logout')}
          </Text>
          <View style={styles.buttonWrap}>
            <TransparentButton
              buttonText={I18n.t('logout')}
              onPress={onLogout}
              color="#EA2553"
              extraStyle={{
                width: '48%',
                marginHorizontal: 0,
                paddingHorizontal: 0,
              }}
            />

            <CustomButton
              buttonText={I18n.t('retry')}
              onPress={retrySyncing}
              extraStyle={{
                width: '48%',
              }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default OnBoardingScreen;
