import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Collapsible from 'react-native-collapsible';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { signOutUser } from '../../../../redux/LoginStore';
import {
  ClearDataIcon,
  DataWillLostIcon,
  HotSyncModalIcon,
  MustHaveInternetIcon,
  NoBluetoothPermissionIcon,
  RightArrowIcon,
  TimeConsumingIcon,
} from '../../../../assets/svg';
import { updateForceClearDatabase } from '../../../../redux/CommonStore';
import { SETTINGS_MENUS, HIT_SLOP_TWENTY } from '../../../../utils/constants';
import { resetTnxSync, updateSyncStage } from '../../../../redux/SyncStore';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import CommonAlert from '../../../../components/modals/commonAlert';
import I18n from '../../../../translations/text/i18n';
import TransparentButton from '../../../../components/buttons/transparentButton';
import CustomButton from '../../../../components/buttons/customButton';
import {
  handleErrors,
  removeLocalStorage,
} from '../../../../utils/commonFunctions';
import { realm } from '../../../../db/Configuration';
import { initiateSync } from '../../../../sync/SyncInitials';
import ToastConfig from '../../../../components/toastConfig';
import {
  NumberFormatMenu,
  LanguageMenu,
  TextToSpeechMenu,
} from '../../../../components/settingsComponents';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');

const SettingsScreen = ({ navigation }) => {
  const styles = StyleSheetFactory();

  const { theme } = useSelector((state) => state.common);
  const { syncInProgress } = useSelector((state) => state.login);
  const { isConnected } = useSelector((state) => state.connection);
  const [clearDataModal, setClearDataModal] = useState(false);
  const [collapsed, setCollapsed] = useState();
  const [hotSyncModal, setHotSyncModal] = useState(false);
  const [hotSyncLoading, setHotLoading] = useState(false);
  const dispatch = useDispatch();

  /**
   * clear local storage and database
   */
  const clearData = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(allKeys);

    setClearDataModal(false);
    dispatch(updateSyncStage(0));
    dispatch(updateForceClearDatabase(true));
    dispatch(signOutUser());
  };

  /**
   * open collapsible based on list option keys
   * @param {string} key list option key
   */
  const toggleExpanded = (key) => {
    if (collapsed === key) {
      setCollapsed();
    } else {
      setCollapsed(key);
    }
  };

  const startHotSync = async () => {
    try {
      setHotLoading(true);

      if (!isConnected) {
        Toast.show({
          type: 'error',
          text1: I18n.t('connection_error'),
          text2: I18n.t('no_active_internet_connection'),
        });
        setHotLoading(false);
        return;
      }

      if (syncInProgress) {
        Toast.show({
          type: 'error',
          text1: I18n.t('in_progress'),
          text2: I18n.t('try_after_sync'),
        });
        setHotLoading(false);
        return;
      }

      await removeLocalStorage();

      realm.write(() => {
        realm.deleteAll();
      });

      dispatch(resetTnxSync());
      dispatch(updateSyncStage(2));
      initiateSync();
      setHotLoading(false);
      setHotSyncModal(false);
      navigation.navigate('HomeScreen');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: I18n.t('error'),
        text2: I18n.t('something_went_wrong'),
      });

      handleErrors(error, {
        ref: 'SettingsScreen_startHotSync',
      });

      setHotLoading(false);
      setHotSyncModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          title={I18n.t('settings')}
          onPress={() => navigation.goBack(null)}
        />

        <View
          style={{
            marginTop: 10,
            borderTopColor: theme.border_1,
            borderTopWidth: 1,
          }}
        >
          <View
            style={{
              borderBottomColor: theme.border_1,
              borderBottomWidth: 1,
            }}
          >
            <LanguageMenu navigation={navigation} />
            <NumberFormatMenu navigation={navigation} />
            <TextToSpeechMenu navigation={navigation} />
          </View>
          {SETTINGS_MENUS.map((item) => (
            <View
              key={item.key}
              style={{
                borderBottomColor: theme.border_1,
                borderBottomWidth: 1,
              }}
            >
              {item.key === 'hot_sync' && (
                <TouchableOpacity
                  onPress={() => setHotSyncModal(true)}
                  style={styles.listItem}
                >
                  <View style={styles.listMainItem}>
                    <Text style={styles.listItemLeft}>
                      {I18n.t(item.title)}
                    </Text>
                  </View>
                  <View style={styles.listItemRightIcon}>
                    {item.rightArrow && <RightArrowIcon stroke="#5691AE" />}
                  </View>
                </TouchableOpacity>
              )}

              {item.key === 'developer_options' && (
                <CommonCollapsible
                  title={item.title}
                  onPress={() => toggleExpanded(item.key)}
                  collapsed={collapsed !== item.key}
                  styles={styles}
                >
                  <View style={styles.developerWrap}>
                    <TouchableOpacity
                      onPress={() => setClearDataModal(true)}
                      style={styles.listItemSub}
                    >
                      <View style={styles.listItemRightIcon}>
                        <Text style={styles.listItemLeft}>
                          {I18n.t('clear_data')}
                        </Text>
                      </View>
                      <View style={styles.listItemRightIcon}>
                        <RightArrowIcon stroke="#5691AE" />
                      </View>
                    </TouchableOpacity>
                  </View>
                </CommonCollapsible>
              )}
            </View>
          ))}
        </View>
      </View>

      {clearDataModal && (
        <CommonAlert
          visible={clearDataModal}
          icon={<ClearDataIcon width={width * 0.25} height={width * 0.25} />}
          title={I18n.t('clear_data_warning')}
          message={I18n.t('clear_data_warning2')}
          submitText={I18n.t('clear_and_logout')}
          cancelText={I18n.t('cancel')}
          onSubmit={clearData}
          onCancel={() => setClearDataModal(false)}
          onRequestClose={() => setClearDataModal(false)}
        />
      )}

      {hotSyncModal && (
        <HotSyncModal
          visible={hotSyncModal}
          onSubmit={startHotSync}
          hideModal={() => setHotSyncModal(false)}
          styles={styles}
          loading={hotSyncLoading}
        />
      )}
    </View>
  );
};

const CommonCollapsible = ({ title, collapsed, onPress, children, styles }) => {
  return (
    <>
      <TouchableOpacity
        hitSlop={HIT_SLOP_TWENTY}
        onPress={onPress}
        style={styles.listItem}
      >
        <View style={styles.listItem}>
          <Text style={styles.listItemLeft}>{I18n.t(title)}</Text>
          {collapsed ? (
            <View>
              <RightArrowIcon stroke="#5691AE" />
            </View>
          ) : (
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <RightArrowIcon stroke="#5691AE" />
            </View>
          )}
        </View>
      </TouchableOpacity>
      <Collapsible collapsed={collapsed} align="center">
        {children}
      </Collapsible>
    </>
  );
};

const HotSyncModal = ({
  visible,
  onSubmit,
  hideModal,
  styles,
  loading = false,
}) => {
  const FieldsView = ({ message, icon, border }) => {
    return (
      <View style={styles.filedWrap}>
        <View style={styles.firstPart}>{icon}</View>
        <View
          style={[styles.secondPart, { borderBottomWidth: border ? 1 : 0 }]}
        >
          <Text style={styles.messageText2}>{message}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalContainer}>
        <View style={styles.topSection}>
          <Image
            source={require('../../../../assets/images/alert_bg.png')}
            style={styles.imageWrap}
          />
          <View style={styles.iconWrap}>
            <HotSyncModalIcon width={width * 0.35} height={width * 0.35} />
          </View>
        </View>
        <View style={styles.contentWrap}>
          <Text style={styles.titleText}>{I18n.t('hot_sync')}</Text>

          <Text style={styles.messageText}>{I18n.t('hot_sync_message_1')}</Text>

          <FieldsView
            message={I18n.t('hot_sync_message_2')}
            icon={<MustHaveInternetIcon width={25} height={25} />}
            border
          />

          <FieldsView
            message={I18n.t('hot_sync_message_3')}
            icon={<DataWillLostIcon width={25} height={25} />}
            border
          />

          <FieldsView
            message={I18n.t('hot_sync_message_4')}
            icon={<TimeConsumingIcon width={25} height={25} />}
            border
          />

          <FieldsView
            message={I18n.t('hot_sync_message_5')}
            icon={<NoBluetoothPermissionIcon width={25} height={25} />}
          />

          <View style={styles.modalButtonWrap}>
            {!loading && (
              <TransparentButton
                buttonText={I18n.t('cancel')}
                color="#EA2553"
                onPress={hideModal}
                extraStyle={{
                  width: '48%',
                  marginHorizontal: 0,
                  paddingHorizontal: 0,
                }}
                disabled={loading}
              />
            )}

            <CustomButton
              buttonText={I18n.t('sync_now')}
              onPress={onSubmit}
              extraStyle={{
                width: loading ? '100%' : '48%',
              }}
              isLoading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </View>
      <Toast config={ToastConfig} visibilityTime={3500} />
    </Modal>
  );
};

export default SettingsScreen;
