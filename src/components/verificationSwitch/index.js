import React from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { NfcMethodIcon, QrMethodIcon } from '../../assets/svg';
import { HIT_SLOP_TWENTY } from '../../utils/constants';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');

const VerificationSwitch = ({ ...props }) => {
  const { verificationMode, onPress, nfcSupported } = props;
  const styles = StyleSheetFactory();

  const getMethodChangeAccess = () => {
    if (verificationMode === 'nfc') {
      return true;
    }

    if (verificationMode === 'qr_code' && nfcSupported) {
      return true;
    }

    return false;
  };

  return (
    <View>
      {getMethodChangeAccess() && (
        <TouchableOpacity
          onPress={onPress}
          style={styles.methodSwitchWrap}
          hitSlop={HIT_SLOP_TWENTY}
        >
          {verificationMode === 'nfc' ? (
            <QrMethodIcon width={width * 0.06} height={width * 0.06} />
          ) : (
            <NfcMethodIcon width={width * 0.06} height={width * 0.06} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default VerificationSwitch;
