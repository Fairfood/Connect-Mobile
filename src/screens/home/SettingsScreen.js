import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Collapsible from 'react-native-collapsible';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { signOutUser } from '../../redux/LoginStore';
import { database } from '../../../App';
import { store } from '../../redux/store';
import { ClearDataIcon } from '../../assets/svg';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import CommonAlert from '../../components/CommonAlert';
import I18n from '../../i18n/i18n';
import Icon from '../../icons';
import * as consts from '../../services/constants';

const { width, height } = Dimensions.get('window');

const SettingsScreen = ({ navigation }) => {
  const [clearDataModal, setClearDataModal] = useState(false);
  const [collapsed, setCollapsed] = useState();
  const [deleteTnxStatus, setDeleteTnxStatus] = useState(false);

  useEffect(() => {
    setupInitialValues();
  }, []);

  const setupInitialValues = async () => {
    const deleteTnxEnabled = await AsyncStorage.getItem('deleteTnxEnabled');
    if (deleteTnxEnabled && deleteTnxEnabled === 'true') {
      setDeleteTnxStatus(true);
    } else {
      setDeleteTnxStatus(false);
    }
  };

  const clearData = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(allKeys);

    database.action(async () => {
      await database.unsafeResetDatabase();
    });

    setClearDataModal(false);
    store.dispatch(signOutUser());
  };

  const toggleExpanded = (key) => {
    if (collapsed === key) { setCollapsed(); } else { setCollapsed(key); }
  };

  const updateDeleteTransaction = async () => {
    if (deleteTnxStatus) {
      await AsyncStorage.setItem('deleteTnxEnabled', 'false');
      setDeleteTnxStatus(false);
    } else {
      await AsyncStorage.setItem('deleteTnxEnabled', 'true');
      setDeleteTnxStatus(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          backgroundColor={consts.APP_BG_COLOR}
          title={I18n.t('settings')}
          leftIcon='arrow-left'
          onPress={() => navigation.goBack(null)}
        />

        <View
          style={{
            marginTop: 10,
            borderTopColor: consts.BORDER_COLOR,
            borderTopWidth: 1,
          }}
        >
          {consts.SETTINGS_MENUS.map((item) => (
            <View
              key={item.key}
              style={{
                borderBottomColor: consts.BORDER_COLOR,
                borderBottomWidth: 1,
              }}
            >
              {item.key === 'developer_options' && (
                <CommonCollapsible
                  title={item.title}
                  onPress={() => toggleExpanded(item.key)}
                  collapsed={collapsed !== item.key}
                >
                  <View
                    style={{
                      paddingHorizontal: width * 0.05,
                    }}
                  >
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
                        <Icon name='right-arrow' size={20} color='#5691AE' />
                      </View>
                    </TouchableOpacity>

                    <View
                      style={styles.listItemSub}
                    >
                      <View style={styles.listItemRightIcon}>
                        <Text style={styles.listItemLeft}>
                          {I18n.t('enable_delete_transaction')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => updateDeleteTransaction()}
                        style={[
                          styles.toggleOutter,
                          {
                            backgroundColor: deleteTnxStatus
                              ? consts.TEXT_PRIMARY_LIGHT_COLOR
                              : consts.BORDER_COLOR,
                            justifyContent: deleteTnxStatus
                              ? 'flex-end'
                              : 'flex-start',
                          },
                        ]}
                        hitSlop={consts.HIT_SLOP_TEN}
                      >
                        <View style={styles.toggleInner} />
                      </TouchableOpacity>
                    </View>
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
          onSubmit={() => clearData()}
          onCancel={() => setClearDataModal(false)}
          onRequestClose={() => setClearDataModal(false)}
        />
      )}
    </View>
  );
};

const CommonCollapsible = ({ title, collapsed, onPress, children }) => {
  return (
    <>
      <TouchableOpacity
        hitSlop={consts.HIT_SLOP_TWENTY}
        onPress={onPress}
        style={styles.listItem}
      >
        <View style={styles.listItem}>
          <Text style={styles.listItemLeft}>{I18n.t(title)}</Text>
          {collapsed ? (
            <View>
              <Icon name='right-arrow' size={20} color='#5691AE' />
            </View>
          ) : (
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <Icon name='right-arrow' size={20} color='#5691AE' />
            </View>
          )}
        </View>
      </TouchableOpacity>
      <Collapsible collapsed={collapsed} align='center'>
        {children}
      </Collapsible>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: consts.APP_BG_COLOR,
    paddingHorizontal: width * 0.05,
  },
  listItem: {
    width: '100%',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    flexDirection: 'row',
    paddingVertical: height * 0.01,
  },
  listItemSub: {
    width: '100%',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    flexDirection: 'row',
    paddingVertical: height * 0.017,
    borderTopColor: consts.BORDER_COLOR,
    borderTopWidth: 0.7,
  },
  listItemLeft: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_REGULAR,
    fontSize: 16,
    letterSpacing: 0.15,
  },
  listItemRight: {
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
    fontFamily: consts.FONT_MEDIUM,
    fontSize: 14,
    letterSpacing: 0.15,
  },
  listItemRightIcon: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  rightTextStyle: {
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
    fontSize: 14,
    paddingHorizontal: 20,
    fontStyle: 'normal',
    fontFamily: consts.FONT_REGULAR,
  },
  toggleOutter: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.14,
    height: 28,
    borderColor: consts.BORDER_COLOR,
    paddingHorizontal: 1,
    borderWidth: 1,
    borderRadius: 20,
  },
  toggleInner: {
    width: width * 0.075,
    height: 24,
    borderColor: consts.BORDER_COLOR,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 20,
  },
});

export default SettingsScreen;
