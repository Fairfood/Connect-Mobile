import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Progress from 'react-native-progress';
import {
  CloseIcon,
  SyncCloseIcon,
  SyncFarmerIcon,
  SyncInProgressIcon,
  SyncSuccessIcon,
  SyncTickIcon,
  SyncTransactionIcon,
} from '../../assets/svg';
import { LONG_MONTH_ARRAY, HIT_SLOP_TEN } from '../../utils/constants';
import ToastConfig from '../toastConfig';
import TransparentButton from '../buttons/transparentButton';
import I18n from '../../translations/text/i18n';
import { initiateSync } from '../../sync/SyncInitials';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');

const SyncComponent = ({ ...props }) => {
  const { visible, hideModal } = props;
  const styles = StyleSheetFactory();
  const { syncPercentage, syncInProgress, syncSuccessful } = useSelector(
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
    setInitialValues();
  }, [syncInProgress]);

  /**
   * setting last synced time
   */
  const setInitialValues = async () => {
    const lastSynced = await AsyncStorage.getItem('last_synced_time');
    const d = new Date(lastSynced * 1000);
    const months = LONG_MONTH_ARRAY;
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
      Toast.show({
        type: 'error',
        text1: I18n.t('connection_error'),
        text2: I18n.t('no_active_internet_connection'),
      });
    } else if (syncInProgress) {
      Toast.show({
        type: 'warning',
        text1: I18n.t('in_progress'),
        text2: I18n.t('sync_already_in_progress'),
      });
    } else {
      initiateSync();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={hideModal}
    >
      <View style={styles.container}>
        <View style={styles.containerSub}>
          <TouchableOpacity
            onPress={hideModal}
            style={styles.closeIconWrap}
            hitSlop={HIT_SLOP_TEN}
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

                {!syncInProgress && syncSuccessful && (
                  <SyncSuccessIcon width={width * 0.1} height={width * 0.1} />
                )}

                {!syncInProgress && !syncSuccessful && (
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
                  <Text style={styles.percentageText}>
                    {`${syncPercentage}%`}
                  </Text>
                </View>
                <View style={{ marginTop: 10 }}>
                  <Progress.Bar
                    progress={syncPercentage > 100 ? 1 : syncPercentage / 100}
                    width={width * 0.8}
                    height={8}
                    color="#27AE60"
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
                styles={styles}
              />
              <SyncFields
                leftImage={
                  <SyncTransactionIcon
                    width={width * 0.09}
                    height={width * 0.09}
                  />
                }
                title={I18n.t('transactions')}
                subtitle={localSyncData.transaction}
                loading={localSyncData.transaction.status}
                syncInProgress={syncInProgress}
                styles={styles}
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
              onPress={startSyncing}
              color="#EA2553"
              extraStyle={{ width: '100%' }}
            />
          )}
        </View>
      </View>
      <Toast config={ToastConfig} visibilityTime={3500} />
    </Modal>
  );
};

const SyncFields = ({ ...props }) => {
  const {
    leftImage,
    title,
    subtitle,
    loading,
    syncInProgress,
    noMargin,
    styles,
  } = props;

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
      style={[styles.syncFieldsWrap, { borderBottomWidth: noMargin ? 0 : 1 }]}
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
            fill="#EA2553"
          />
        )}
      </View>
    </View>
  );
};

export default SyncComponent;
