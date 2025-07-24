import React from 'react';
import { View, Text, Modal, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import I18n from '../../../translations/text/i18n';
import CustomButton from '../../buttons/customButton';
import TransparentButton from '../../buttons/transparentButton';
import ToastConfig from '../../toastConfig';
import StyleSheetFactory from './styles';

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
  isLoading = false,
  disabled = false,
  customSection = null,
}) => {
  const styles = StyleSheetFactory();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onRequestClose ?? null}
    >
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Image
            source={require('../../../assets/images/alert_bg.png')}
            style={styles.imageWrap}
          />
          <View style={styles.iconWrap}>{icon}</View>
        </View>
        <View style={styles.contentWrap}>
          {customSection || (
            <View>
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
            </View>
          )}

          <View style={styles.buttonWrap}>
            {onCancel && (
              <TransparentButton
                buttonText={cancelText || I18n.t('cancel')}
                color="#EA2553"
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
              isLoading={isLoading}
              disabled={disabled}
            />
          </View>
        </View>
      </View>
      <Toast config={ToastConfig} visibilityTime={3500} />
    </Modal>
  );
};

export default CommonAlert;
