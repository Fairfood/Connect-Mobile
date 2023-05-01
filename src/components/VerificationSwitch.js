import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { NfcMethodIcon, QrMethodIcon } from '../assets/svg';
import { HIT_SLOP_TWENTY } from '../services/constants';

const { width } = Dimensions.get('window');

const VerificationSwitch = ({ ...props }) => {
  const { verificationMode, onPress, nfcSupported } = props;
  const { theme } = useSelector((state) => state.common);

  const getMethodChangeAccess = () => {
    if (verificationMode === 'nfc') {
      return true;
    }

    if (verificationMode === 'qr_code' && nfcSupported) {
      return true;
    }

    return false;
  };

  const styles = StyleSheetFactory(theme);

  return (
    <View>
      {getMethodChangeAccess() && (
        <TouchableOpacity
          onPress={() => onPress()}
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

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    methodSwitchWrap: {
      width: width * 0.08,
      height: width * 0.08,
      borderRadius: theme.border_radius,
      backgroundColor: '#B2DFF8',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 15,
    },
  });
};

export default VerificationSwitch;
