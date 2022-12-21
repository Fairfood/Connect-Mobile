import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import FastImage from 'react-native-fast-image';
import AnimatedEllipsis from 'react-native-animated-ellipsis';
import I18n from '../../i18n/i18n';
import { populateDatabase } from '../../services/populateDatabase';
import { onBoardingComplete } from '../../redux/LoginStore';
import NoInternetConnection from './NoInternetConnection';
import CustomButton from '../../components/CustomButton';
import * as consts from '../../services/constants';

const { height, width } = Dimensions.get('window');

const OnBoardingScreen = () => {
  const { syncInProgress, syncSuccessfull } = useSelector(
    (state) => state.login,
  );
  const { isConnected } = useSelector((state) => state.connection);
  const [ActiveSlide, setActiveSlide] = useState(0);
  const dispatch = useDispatch();

  const PaginationComponent = () => (
    <Pagination
      dotsLength={3}
      activeDotIndex={ActiveSlide % 3}
      containerStyle={{ backgroundColor: '#92DDF6' }}
      dotStyle={styles.dot}
      inactiveDotOpacity={0.4}
      inactiveDotScale={0.6}
    />
  );

  useEffect(() => {
    if (isConnected && !syncInProgress) {
      populateDatabase();
    }
  }, [isConnected]);

  const renderItem = ({ item, index }) => {
    return (
      <View key={index.toString()} style={styles.itemContainer}>
        <FastImage source={item.uri} style={styles.imageStyle} />
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
    <SafeAreaView style={styles.container}>
      {isConnected && (
        <>
          <View style={styles.carouselWrap}>
            <Carousel
              data={[
                {
                  uri: require('../../assets/images/onboarding1.png'),
                  title: I18n.t('add_farmer'),
                  description: I18n.t(
                    'add_farmers_and_issue_card_for_verifying_transactions',
                  ),
                },
                {
                  uri: require('../../assets/images/onboarding2.png'),
                  title: I18n.t('receive_or_deliver_products'),
                  description: I18n.t(
                    'view_transaction_history_price_and_premiums_received_per_transactions',
                  ),
                },
                {
                  uri: require('../../assets/images/onboarding3.png'),
                  title: I18n.t('verify_transactions'),
                  description: I18n.t(
                    'verify_and_confirm_each_transactions_by_taping_card_with_your_device',
                  ),
                },
              ]}
              renderItem={renderItem}
              onSnapToItem={(index) => setActiveSlide(index)}
              sliderWidth={width * 0.8}
              itemWidth={width * 0.8}
              autoplay
              lockScrollWhileSnapping={false}
              enableMomentum
              loop
            />
            <PaginationComponent entries={3} />
          </View>
          <View>
            <Image
              source={require('../../assets/images/lines.png')}
              resizeMode='stretch'
              style={{ width }}
            />
          </View>

          <View style={styles.secondWrap}>
            <View style={styles.secondSubwrap}>
              {isConnected && syncInProgress && (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={styles.titleText}>
                    {I18n.t('we_are_setting_up_your_accounts')}
                  </Text>
                  <AnimatedEllipsis
                    numberOfDots={3}
                    minOpacity={0.4}
                    animationDelay={200}
                    style={styles.ellipsis}
                  />
                </View>
              )}
              {syncSuccessfull && (
                <Text style={styles.titleText}>
                  {I18n.t('all_set_youre_ready_to_go')}
                </Text>
              )}
              {!isConnected && (
                <Text style={styles.titleText}>
                  {I18n.t('no_active_internet_connection')}
                </Text>
              )}
            </View>
            {syncSuccessfull && (
              <CustomButton
                buttonText={I18n.t('next')}
                onPress={() => {
                  dispatch(onBoardingComplete());
                }}
                extraStyle={{ width: '100%' }}
              />
            )}
          </View>
        </>
      )}
      {!isConnected && <NoInternetConnection />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#92DDF6',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: consts.BORDER_RADIUS,
    marginHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  carouselWrap: {
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#92DDF6',
    width: '100%',
  },
  titleText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 14,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  itemTitleText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_BOLD,
    fontStyle: 'normal',
    fontSize: 16,
    letterSpacing: 1.0,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 10,
  },
  itemSubTitleText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 24,
    textAlign: 'center',
  },
  itemContainer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  imageStyle: {
    width: width * 0.7,
    height: height * 0.3,
  },
  itemTextWrap: {
    width: width * 0.8,
    position: 'relative',
  },
  secondWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 0,
    backgroundColor: consts.APP_BG_COLOR,
    padding: width * 0.05,
  },
  secondSubwrap: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  ellipsis: {
    marginTop: -5,
    letterSpacing: -1,
    fontSize: 20,
  },
});

export default OnBoardingScreen;
