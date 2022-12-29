import React from 'react';
import { View, Text, StyleSheet, Modal, Dimensions, Image } from 'react-native';

import I18n from '../i18n/i18n';
import CustomButton from './CustomButton';
import TransparentButton from './TransparentButton';
import * as consts from '../services/constants';

const { width, height } = Dimensions.get('window');

const CommonAlert = ({
  visible,
  onRequestClose,
  title,
  message,
  message2,
  data,
  infoText,
  onCancel,
  cancelText,
  onSubmit,
  submitText,
  icon,
}) => {
  return (
    <Modal
      animationType='slide'
      transparent
      visible={visible}
      onRequestClose={onRequestClose ?? null}
    >
      <View style={styles.container}>
        <View style={styles.topsection}>
          <Image
            source={require('../assets/images/alert-bg.png')}
            style={styles.imageWrap}
          />
          <View style={styles.iconWrap}>{icon}</View>
        </View>
        <View style={styles.contentWrap}>
          <Text style={styles.titleText}>
            {title || I18n.t('something_went_wrong')}
          </Text>

          <Text style={[styles.messageText, { marginTop: -10 }]}>
            {message}
          </Text>

          {message2 && (
            <Text style={[styles.messageText, { marginTop: -10 }]}>
              {message2}
            </Text>
          )}

          {data && data.length > 0 && (
            <View style={styles.dataMainWrap}>
              {infoText ? (
                <Text style={styles.infoText}>{infoText}</Text>
              ) : null}

              {data.map((item, index) => (
                <View key={index.toString()} style={styles.dataWrap}>
                  <View style={{ width: '50%' }}>
                    <Text style={styles.fieldText}>{item.field}</Text>
                  </View>
                  <View style={{ width: '50%' }}>
                    <Text style={styles.valueText}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.buttonWrap}>
            {onCancel && (
              <TransparentButton
                buttonText={cancelText || I18n.t('cancel')}
                color='#EA2553'
                onPress={onCancel}
                extraStyle={{
                  width: '45%',
                  marginHorizontal: 0,
                  paddingHorizontal: 0,
                }}
              />
            )}

            <CustomButton
              buttonText={submitText || I18n.t('submit')}
              onPress={onSubmit}
              extraStyle={{
                width: onCancel ? '45%' : '100%',
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 58, 96, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  topsection: {
    width: '100%',
    height: height * 0.27,
    backgroundColor: '#ffffff',
  },
  iconWrap: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
  imageWrap: {
    width: '100%',
    resizeMode: 'contain',
  },
  contentWrap: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingHorizontal: width * 0.06,
    paddingBottom: width * 0.06,
  },
  fieldText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
  },
  valueText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 14,
    fontFamily: consts.FONT_BOLD,
    textAlign: 'right',
  },
  infoText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 14,
    fontFamily: consts.FONT_BOLD,
    marginBottom: 5,
  },
  titleText: {
    color: consts.ERROR_ICON_COLOR,
    fontSize: 16,
    fontFamily: consts.FONT_MEDIUM,
    textAlign: 'center',
    marginVertical: height * 0.03,
  },
  messageText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 15,
    fontFamily: consts.FONT_REGULAR,
    textAlign: 'center',
    marginVertical: height * 0.03,
  },
  buttonWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataMainWrap: {
    width: '100%',
    backgroundColor: '#DDF3FF',
    padding: width * 0.05,
    marginBottom: 20,
  },
  dataWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
});

export default CommonAlert;
