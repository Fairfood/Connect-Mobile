import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { CloseIcon, PlusRoundIcon, ThinArrowDownIcon } from '../../assets/svg';
import { AVATAR_BG_COLORS, HIT_SLOP_TEN } from '../../utils/constants';
import { setApiConfig, updateServers } from '../../redux/ConnectionStore';
import { updateForceClearDatabase } from '../../redux/CommonStore';
import { handleErrors } from '../../utils/commonFunctions';
import FormTextInput from '../inputs/formTextInput';
import I18n from '../../translations/text/i18n';
import CustomButton from '../buttons/customButton';
import TransparentButton from '../buttons/transparentButton';
import Avatar from '../avatar';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');

export const ServerInputField = ({
  apiConfig,
  currentConfigIndex = 0,
  onPress,
  disabled = false,
  testID = '',
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory();

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} testID={testID}>
      <View style={styles.titleWrap}>
        <Text style={styles.placeholderText}>{' Server '}</Text>
      </View>
      <View style={styles.inputContainer}>
        <View style={styles.serverImageWrap}>
          {apiConfig.DEFAULT_SERVER ? (
            <Image
              source={require('../../assets/images/server_logo.png')}
              style={styles.serverImage}
            />
          ) : (
            <Avatar
              avatarName={apiConfig.API_SERVER_NAME}
              avatarBgColor={
                AVATAR_BG_COLORS[currentConfigIndex % AVATAR_BG_COLORS.length]
              }
            />
          )}
        </View>
        <View style={styles.serverDetailsWrap}>
          <Text style={styles.serverName} numberOfLines={1}>
            {apiConfig.API_SERVER_NAME}
          </Text>
          <Text style={styles.serverUrl}>
            {apiConfig.API_BASE_URL.split('://')[1]}
          </Text>
        </View>
        <View style={styles.dropdownIconWrap}>
          {!disabled && (
            <ThinArrowDownIcon width={15} height={15} fill={theme.text_2} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ServerList = ({ onAddServer, onSelectServer, testID = '' }) => {
  const { servers, apiConfig } = useSelector((state) => state.connection);
  const dispatch = useDispatch();
  const styles = StyleSheetFactory();

  // need_fix proper delete ui
  const deleteServer = (i) => {
    try {
      if (!i.DEFAULT_SERVER) {
        const newServerArray = [...servers];
        const newArray = newServerArray.filter((x) => {
          return x.API_BASE_URL !== i.API_BASE_URL;
        });

        dispatch(updateServers(newArray));
      }
    } catch (error) {
      handleErrors(error, {
        ref: 'ServerSwitch_deleteServer',
      });
    }
  };

  const selectServer = (i) => {
    try {
      dispatch(setApiConfig(i));
      dispatch(updateForceClearDatabase(true));
      onSelectServer();
    } catch (error) {
      handleErrors(error, {
        ref: 'ServerSwitch_selectServer',
      });
    }
  };

  return (
    <View style={styles.serverListMain} testID={testID}>
      <ScrollView style={styles.serverListSub}>
        {servers.map((i, n) => (
          <TouchableOpacity
            key={n.toString()}
            onLongPress={() => deleteServer(i)}
            onPress={() => selectServer(i)}
            style={styles.serverListContainer}
          >
            <View style={styles.serverListImageWrap}>
              {i.DEFAULT_SERVER ? (
                <Image
                  source={require('../../assets/images/server_logo.png')}
                  style={styles.serverListImage}
                />
              ) : (
                <Avatar
                  avatarName={i.API_SERVER_NAME}
                  avatarBgColor={AVATAR_BG_COLORS[n % AVATAR_BG_COLORS.length]}
                />
              )}
            </View>
            <View
              style={[
                styles.serverListSecondWrap,
                { borderBottomWidth: i !== servers.length - 1 ? 0 : 1 },
              ]}
            >
              <View style={{ width: '80%' }}>
                <Text style={styles.serveListName} numberOfLines={1}>
                  {i.API_SERVER_NAME}
                </Text>
                <Text style={styles.serverListUrl}>
                  {i.API_BASE_URL.split('://')[1]}
                </Text>
              </View>
              <View style={styles.radioWrap}>
                <View style={styles.radioOuter}>
                  {i.API_BASE_URL === apiConfig.API_BASE_URL ? (
                    <View style={styles.radioInner} />
                  ) : null}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={onAddServer} style={styles.addServerWrap}>
        <Text style={styles.addText}>{I18n.t('add_new_server')}</Text>
        <PlusRoundIcon
          width={width * 0.05}
          height={width * 0.05}
          fill="#4DCAF4"
        />
      </TouchableOpacity>
    </View>
  );
};

export const AddServerModal = ({ visible, hideModal, onCancel, onSubmit }) => {
  const serverUrlRef = useRef(null);
  const styles = StyleSheetFactory();
  const { theme } = useSelector((state) => state.common);
  const { servers, apiConfig } = useSelector((state) => state.connection);
  const [loading, setLoading] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverUrl, setServerUrl] = useState('https://');
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const handleValidate = async () => {
    setLoading(true);
    let url = serverUrl.trim();
    const name = serverName.trim();

    if (url === '' || serverName.trim() === '') {
      setError('Name and url are mandatory');
      setLoading(false);
      return;
    }

    const lastChar = url.substring(url.length - 1);
    if (lastChar !== '/') {
      url += '/';
    }

    const firstPart = url.split('://')[0];
    const secondPart = url.split('://')[1];
    if (!firstPart || firstPart === '' || !secondPart || secondPart === '') {
      setError('Enter a valid url');
      setLoading(false);
      return;
    }

    const nameAlreadyExist = servers.find((x) => {
      return x.API_SERVER_NAME === name;
    });

    if (nameAlreadyExist) {
      setError(I18n.t('server_name_already_exist'));
      setLoading(false);
      return;
    }

    const urlAlreadyExist = servers.find((x) => {
      return x.API_BASE_URL === url;
    });

    if (urlAlreadyExist) {
      setError(I18n.t('server_url_already_exist'));
      setLoading(false);
      return;
    }

    const newServerArray = [...servers];
    const obj = {
      API_CLIENT_CODE: apiConfig.API_CLIENT_CODE,
      API_BASE_URL: url,
      APP_ENVIRONMENT: apiConfig.APP_ENVIRONMENT,
      API_SERVER_NAME: name,
      DEFAULT_SERVER: false,
      SENTRY_URL: apiConfig.SENTRY_URL,
      APP_LINK_REDIRECT_URI: apiConfig.APP_LINK_REDIRECT_URI,
      GOOGLE_PLAY_STORE_URL: apiConfig.GOOGLE_PLAY_STORE_URL,
    };
    newServerArray.push(obj);

    dispatch(updateServers(newServerArray));
    setLoading(true);
    onSubmit();
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={hideModal}
    >
      <View style={styles.container}>
        <View style={styles.contentWrap}>
          <TouchableOpacity
            onPress={hideModal}
            style={styles.closeIconWrap}
            hitSlop={HIT_SLOP_TEN}
          >
            <Text style={styles.fieldTitle}>{I18n.t('add_new_server')}</Text>
            <CloseIcon width={width * 0.04} height={width * 0.04} />
          </TouchableOpacity>

          <Text style={styles.fieldText}>
            {I18n.t('continue_with_new_server')}
          </Text>

          <View style={{ marginTop: 10 }} />

          <FormTextInput
            placeholder={I18n.t('add_name')}
            value={serverName}
            onChangeText={(text) => setServerName(text)}
            returnKeyType="next"
            color={theme.text_1}
            extraStyle={{ width: '100%' }}
            onSubmitEditing={() => serverUrlRef.current.focus()}
          />

          <FormTextInput
            inputRef={serverUrlRef}
            placeholder={I18n.t('add_url')}
            value={serverUrl}
            onChangeText={(text) => setServerUrl(text)}
            keyboardType="url"
            color={theme.text_1}
            blurOnSubmit={false}
            extraStyle={{ width: '100%' }}
          />

          {error && (
            <View style={styles.errorWrap}>
              <Text style={styles.errorMsg}>{error}</Text>
            </View>
          )}

          <View style={styles.buttonWrap}>
            {onCancel && (
              <TransparentButton
                buttonText={I18n.t('cancel')}
                color="#EA2553"
                onPress={hideModal}
                extraStyle={{
                  width: '45%',
                  marginHorizontal: 0,
                  paddingHorizontal: 0,
                }}
                disabled={loading}
              />
            )}

            <CustomButton
              buttonText={I18n.t('submit')}
              onPress={handleValidate}
              extraStyle={{
                width: onCancel ? '45%' : '100%',
              }}
              isLoading={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
