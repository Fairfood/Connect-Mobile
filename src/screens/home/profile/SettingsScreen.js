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
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { signOutUser } from '../../../redux/LoginStore';
import { database } from '../../../../App';
import { store } from '../../../redux/store';
import { ClearDataIcon } from '../../../assets/svg';
import { migrationCompleted, updateForceClearDatabase } from '../../../redux/CommonStore';
import {
  SETTINGS_MENUS,
  HIT_SLOP_TEN,
  HIT_SLOP_TWENTY,
} from '../../../services/constants';
import { updateSyncStage } from '../../../redux/SyncStore';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import CommonAlert from '../../../components/CommonAlert';
import I18n from '../../../i18n/i18n';
import Icon from '../../../icons';
// import { realm } from '../../../db/Configuration';

const { width, height } = Dimensions.get('window');
const Languages = { 'en-GB': 'English', 'id-ID': 'Indonesian' };

const SettingsScreen = ({ navigation }) => {
  const { theme } = useSelector((state) => state.common);
  const [clearDataModal, setClearDataModal] = useState(false);
  const [collapsed, setCollapsed] = useState();
  const [deleteTnxStatus, setDeleteTnxStatus] = useState(false);
  const [appLanguage, setAppLanguage] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    setupInitialValues();
  }, [isFocused]);

  /**
   * setting delete transaction button
   */
  const setupInitialValues = async () => {
    const language = await AsyncStorage.getItem('app_language');
    setAppLanguage(Languages[language]);

    const deleteTnxEnabled = await AsyncStorage.getItem('deleteTnxEnabled');
    if (deleteTnxEnabled && deleteTnxEnabled === 'true') {
      setDeleteTnxStatus(true);
    } else {
      setDeleteTnxStatus(false);
    }
  };

  /**
   * clear local storage and database
   */
  const clearData = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(allKeys);

    database.action(async () => {
      await database.unsafeResetDatabase();
    });

    // realm.write(() => {
    //   realm.deleteAll();
    // });

    setClearDataModal(false);
    store.dispatch(migrationCompleted());
    store.dispatch(updateSyncStage(0));
    store.dispatch(updateForceClearDatabase(true));
    store.dispatch(signOutUser());
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

  /**
   * enable/disable delete transaction feature
   */
  const updateDeleteTransaction = async () => {
    if (deleteTnxStatus) {
      await AsyncStorage.setItem('deleteTnxEnabled', 'false');
      setDeleteTnxStatus(false);
    } else {
      await AsyncStorage.setItem('deleteTnxEnabled', 'true');
      setDeleteTnxStatus(true);
    }
  };

  /**
   * managing operations based on settings options
   * @param {string} key selected settings option key
   */
  const onPressMenu = (key) => {
    switch (key) {
      case 'language':
        navigation.navigate('ChangeLanguage');
        break;
      default:
        break;
    }
  };

  const styles = StyleSheetFactory(theme);

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          backgroundColor={theme.background_1}
          title={I18n.t('settings')}
          leftIcon="arrow-left"
          onPress={() => navigation.goBack(null)}
        />

        <View
          style={{
            marginTop: 10,
            borderTopColor: theme.border_1,
            borderTopWidth: 1,
          }}
        >
          {SETTINGS_MENUS.map((item) => (
            <View
              key={item.key}
              style={{
                borderBottomColor: theme.border_1,
                borderBottomWidth: 1,
              }}
            >
              {item.key === 'language' && (
                <TouchableOpacity
                  onPress={() => onPressMenu(item.key)}
                  style={styles.listItem}
                  testID="ChangeLanguageTouch"
                >
                  <View style={styles.listMainItem}>
                    <Text style={styles.listItemLeft}>
                      {I18n.t(item.title)}
                    </Text>
                  </View>
                  <View style={styles.listItemRightIcon}>
                    {item.key === 'language' && (
                      <Text style={styles.rightTextStyle}>{appLanguage}</Text>
                    )}
                    {item.rightArrow && (
                      <Icon name="right-arrow" size={20} color="#5691AE" />
                    )}
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
                        <Icon name="right-arrow" size={20} color="#5691AE" />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.listItemSub}>
                      <View style={styles.listItemRightIcon}>
                        <Text style={styles.listItemLeft}>
                          {I18n.t('enable_delete_transaction')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => updateDeleteTransaction()}
                        style={[
                          styles.toggleOuter,
                          {
                            backgroundColor: deleteTnxStatus
                              ? theme.text_2
                              : theme.border_1,
                            justifyContent: deleteTnxStatus
                              ? 'flex-end'
                              : 'flex-start',
                          },
                        ]}
                        hitSlop={HIT_SLOP_TEN}
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
              <Icon name="right-arrow" size={20} color="#5691AE" />
            </View>
          ) : (
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <Icon name="right-arrow" size={20} color="#5691AE" />
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

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      height: '100%',
      backgroundColor: theme.background_1,
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
      borderTopColor: theme.border_1,
      borderTopWidth: 0.7,
    },
    listItemLeft: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 16,
      letterSpacing: 0.15,
    },
    listItemRight: {
      color: theme.text_2,
      fontFamily: theme.font_bold,
      fontSize: 14,
      letterSpacing: 0.15,
    },
    listItemRightIcon: {
      flexDirection: 'row',
      alignSelf: 'center',
    },
    listMainItem: {
      flexDirection: 'row',
      alignSelf: 'center',
      paddingVertical: height * 0.01,
    },
    rightTextStyle: {
      color: theme.text_2,
      fontSize: 14,
      paddingHorizontal: 20,
      fontStyle: 'normal',
      fontFamily: theme.font_regular,
    },
    toggleOuter: {
      flexDirection: 'row',
      alignItems: 'center',
      width: width * 0.14,
      height: 28,
      borderColor: theme.border_1,
      paddingHorizontal: 1,
      borderWidth: 1,
      borderRadius: 20,
    },
    toggleInner: {
      width: width * 0.075,
      height: 24,
      borderColor: theme.border_1,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderRadius: 20,
    },
  });
};

export default SettingsScreen;
