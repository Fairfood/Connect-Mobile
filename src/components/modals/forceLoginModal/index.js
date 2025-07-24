import React from 'react';
import { View, Text, Modal } from 'react-native';
import I18n from '../../../translations/text/i18n';
import TransparentButton from '../../buttons/transparentButton';
import CustomButton from '../../buttons/customButton';
import StyleSheetFactory from './styles';

const ForceLoginModal = ({ OpenModal, onNext, onCancel }) => {
  const styles = StyleSheetFactory();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={OpenModal}
      onRequestClose={() => {}}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalInnerWrap}>
          <Text style={styles.alreadyActiveText}>
            {I18n.t('already_active_device')}
          </Text>

          <Text style={styles.continueText}>{I18n.t('on_click_continue')}</Text>

          <View style={styles.buttonWrap}>
            <TransparentButton
              buttonText={I18n.t('cancel')}
              onPress={onCancel}
              color="#EA2553"
              extraStyle={{ width: '45%' }}
            />

            <CustomButton
              onPress={onNext}
              buttonText={I18n.t('continue')}
              extraStyle={{ width: '45%' }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ForceLoginModal;
