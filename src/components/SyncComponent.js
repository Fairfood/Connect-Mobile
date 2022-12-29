import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ToastAndroid,
} from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';

import {
  CloseIcon,
  SyncCloseIcon,
  SyncFarmerIcon,
  SyncInProgressIcon,
  SyncSuccessIcon,
  SyncTickIcon,
  SyncTransactionIcon,
} from '../assets/svg';
import TransparentButton from './TransparentButton';
import I18n from '../i18n/i18n';
import { populateDatabase } from '../services/populateDatabase';
import * as consts from '../services/constants';

const { width } = Dimensions.get('window');

const SyncComponent = ({ ...props }) => {
  const { syncPercentage, syncInProgress, syncSuccessfull } = useSelector(
    (state) => state.login,
  );
  const [load, setLoad] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(null);
  const [localSyncData, setLocalSyncData] = useState(null);
  const { isConnected } = useSelector((state) => state.connection);

  useEffect(() => {
    setupLocalSyncData();
  }, [syncInProgress, syncPercentage]);

  useEffect(() => {
    setInitailValues();
  }, [syncInProgress]);

  /**
   * setting last synced time
   */
  const setInitailValues = async () => {
    const lastSynced = await AsyncStorage.getItem('last_synced_time');
    const d = new Date(lastSynced * 1000);
    const months = consts.LONG_MONTH_ARRAY;
    const dateText = `${d.getDate()} ${
      months[d.getMonth()]
    } ${d.getFullYear()}, ${
      d.getHours() < 12 ? d.getHours() : d.getHours() - 12
    }:${d.getMinutes()}${d.getHours() < 12 ? 'am' : 'pm'}`;
    setLastSyncedTime(dateText);
  };

  /**
   * setting latest sync data
   */
  const setupLocalSyncData = async () => {
    let obj = await AsyncStorage.getItem('syncData');
    obj = JSON.parse(obj);
    setLocalSyncData(obj);
    setLoad(!load);
  };

  /**
   * start syncing based on connection check
   */
  const startSyncing = () => {
    if (!isConnected) {
      ToastAndroid.show(
        I18n.t('no_active_internet_connection'),
        ToastAndroid.SHORT,
      );
    } else if (syncInProgress) {
      ToastAndroid.show(I18n.t('sync_already_in_progress'), ToastAndroid.SHORT);
    } else {
      populateDatabase();
    }
  };

  return (
    <Modal
      animationType='slide'
      transparent
      visible={props.visible}
      onRequestClose={() => props.hideModal()}
    >
      <View style={styles.container}>
        <View style={styles.containerSub}>
          <TouchableOpacity
            onPress={() => props.hideModal()}
            style={styles.closeIconWrap}
            hitSlop={consts.HIT_SLOP_TEN}
          >
            <CloseIcon width={width * 0.05} height={width * 0.05} />
          </TouchableOpacity>
          <View style={styles.topSectionWrap}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: '15%' }}>
                {syncInProgress && (
                  <SyncInProgressIcon
                    width={width * 0.1}
                    height={width * 0.1}
                  />
                )}

                {!syncInProgress && syncSuccessfull && (
                  <SyncSuccessIcon width={width * 0.1} height={width * 0.1} />
                )}

                {!syncInProgress && !syncSuccessfull && (
                  <SyncSuccessIcon width={width * 0.1} height={width * 0.1} />
                )}
              </View>
              <View style={{ width: '85%', justifyContent: 'center' }}>
                <Text style={styles.titleText}>
                  {syncInProgress ? I18n.t('in_sync') : I18n.t('sync_data')}
                </Text>
                {!syncInProgress ? (
                  <Text style={styles.lastSyncedText}>
                    {lastSyncedTime
                      ? `${I18n.t('last_synced_on')} ${lastSyncedTime}`
                      : null}
                  </Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.syncWaring}>{I18n.t('sync_warning')}</Text>

            {syncInProgress ? (
              <>
                <View style={styles.progressBarWrap}>
                  <Text style={styles.syncingText}>
                    {I18n.t('syncing')}
                    ..
                  </Text>
                  <Text
                    style={styles.percetageText}
                  >
                    {`${syncPercentage}%`}

                  </Text>
                </View>
                <View style={{ marginTop: 10 }}>
                  <Progress.Bar
                    progress={syncPercentage > 100 ? 1 : syncPercentage / 100}
                    width={width * 0.8}
                    height={8}
                    color='#27AE60'
                  />
                </View>
              </>
            ) : null}
          </View>

          {localSyncData ? (
            <>
              <SyncFields
                leftImage={
                  <SyncFarmerIcon width={width * 0.09} height={width * 0.09} />
                }
                title={I18n.t('farmers')}
                subtitle={localSyncData.farmer}
                loading={localSyncData.farmer.status}
                syncInProgress={syncInProgress}
              />
              <SyncFields
                leftImage={(
                  <SyncTransactionIcon
                    width={width * 0.09}
                    height={width * 0.09}
                  />
                )}
                title={I18n.t('transactions')}
                subtitle={localSyncData.transaction}
                loading={localSyncData.transaction.status}
                syncInProgress={syncInProgress}
              />
            </>
          ) : null}

          {syncInProgress ? (
            <Text style={styles.lastSyncedText}>
              {lastSyncedTime
                ? `${I18n.t('last_synced_on')} ${lastSyncedTime}`
                : null}
            </Text>
          ) : (
            <TransparentButton
              buttonText={I18n.t('sync_manually')}
              onPress={() => startSyncing()}
              color='#EA2553'
              paddingHorizontal={45}
              extraStyle={{ width: '100%' }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const SyncFields = ({ ...props }) => {
  const { leftImage, title, subtitle, loading, syncInProgress, noMargin } =
    props;

  const getSubtitleText = (subtitleObj) => {
    if (subtitleObj?.status === 'completed') {
      return `${I18n.t('all')} ${title.toLowerCase()} ${I18n.t('synced')}.`;
    }
    if (subtitleObj?.status === 'syncing') {
      return `${subtitleObj.finished} of ${
        subtitleObj.pending
      } ${title.toLowerCase()} ${I18n.t('syncing')}..`;
    }
    if (subtitleObj?.status === 'pending') {
      return `${subtitleObj.pending} ${title.toLowerCase()} ${I18n.t(
        'pending',
      )}.`;
    }
    if (subtitleObj?.status === 'failed') {
      return `${subtitleObj.failed} of ${
        subtitleObj.pending
      } ${title.toLowerCase()} ${I18n.t('failed')}.`;
    }
    return '';
  };

  return (
    <View
      style={[styles.syncFiledsWrap, { borderBottomWidth: noMargin ? 0 : 1 }]}
    >
      <View style={styles.leftImageWrap}>{leftImage}</View>
      <View style={{ width: '70%' }}>
        <Text style={styles.fieldTitle}>{title}</Text>
        <Text style={styles.fieldSubTitle}>{getSubtitleText(subtitle)}</Text>
      </View>
      <View style={styles.fieldLoadingWrap}>
        {loading === 'completed' && (
          <SyncTickIcon width={width * 0.07} height={width * 0.07} />
        )}

        {(loading === 'syncing' || loading === 'pending') &&
          syncInProgress === true && (
            <Progress.CircleSnail color={['#92DDF6']} />
          )}

        {loading === 'failed' && (
          <SyncCloseIcon
            width={width * 0.07}
            height={width * 0.07}
            fill='#EA2553'
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  containerSub: {
    marginTop: 'auto',
    paddingHorizontal: width * 0.05,
    paddingVertical: width * 0.07,
    backgroundColor: '#ffffff',
  },
  closeIconWrap: {
    alignSelf: 'flex-end',
    marginBottom: width * 0.07,
  },
  topSectionWrap: {
    padding: width * 0.05,
    backgroundColor: consts.CARD_BACKGROUND_COLOR,
    marginBottom: width * 0.05,
  },
  titleText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 16,
    fontFamily: consts.FONT_BOLD,
  },
  lastSyncedText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 13,
    fontFamily: consts.FONT_MEDIUM,
    lineHeight: 25,
  },
  syncWaring: {
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
    fontSize: 13,
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '500',
    marginTop: 10,
    lineHeight: 20,
  },
  progressBarWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: width * 0.05,
  },
  syncingText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 14,
    fontFamily: consts.FONT_BOLD,
  },
  percetageText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
  },
  syncFiledsWrap: {
    flexDirection: 'row',
    paddingVertical: width * 0.03,
    borderBottomColor: consts.BORDER_COLOR,
  },
  leftImageWrap: {
    width: '15%',
    justifyContent: 'center',
    paddingLeft: 5,
  },
  fieldTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 14,
    fontFamily: consts.FONT_MEDIUM,
  },
  fieldSubTitle: {
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
    fontSize: 13,
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '500',
    lineHeight: 25,
  },
  fieldLoadingWrap: {
    width: '15%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SyncComponent;
